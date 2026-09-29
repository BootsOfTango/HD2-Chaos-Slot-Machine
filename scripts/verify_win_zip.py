#!/usr/bin/env python3
"""Verify both Windows release artifacts and write SHA-256 sidecars."""

import hashlib
import argparse
import json
import re
import shutil
import struct
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dist', type=Path, default=ROOT / 'dist', help='Build output directory inside the source checkout dist folder')
parser.add_argument('--installer', type=Path, help='Explicit installer path inside this checkout, for a top-level local handoff')
parser.add_argument('--local-label', help='Verify descriptive local artifacts, without changing the internal package version')
args = parser.parse_args()
DIST = args.dist.resolve()
if not DIST.is_relative_to((ROOT / 'dist').resolve()):
    raise SystemExit('Refusing a verification directory outside this checkout dist folder.')

with (ROOT / 'package.json').open(encoding='utf-8') as package_file:
    version = json.load(package_file)['version']
with (ROOT / 'release-identity.json').open(encoding='utf-8') as release_file:
    version = json.load(release_file)['publicVersion']

if args.local_label is not None and (len(args.local_label) > 48 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.local_label)):
    raise SystemExit('Invalid local build label: use 1-48 lowercase letters/digits with single hyphens between words.')
zip_path = DIST / (f'HD2-Chaos-Slot-Machine-local-{args.local_label}-win-x64.zip' if args.local_label else f'HD2-Chaos-Slot-Machine-v{version}-win-x64.zip')
installer_name = f'HD2-Chaos-Slot-Machine-Setup-local-{args.local_label}-win-x64.exe' if args.local_label else f'HD2-Chaos-Slot-Machine-Setup-v{version}-win-x64.exe'
installer_path = args.installer.resolve() if args.installer else DIST / installer_name
if not installer_path.is_relative_to(ROOT) or installer_path.name != installer_name:
    raise SystemExit('Explicit installer must be inside this checkout and match the current versioned Setup filename or explicitly selected local label.')

for artifact in (zip_path, installer_path):
    if not artifact.is_file():
        raise SystemExit(f'Missing Windows artifact: {artifact}')

extract_dir = DIST / 'verify-win-zip'
if extract_dir.exists():
    if extract_dir.is_symlink() or extract_dir.resolve().parent != DIST.resolve():
        raise SystemExit(f'Refusing to replace an unexpected verification directory: {extract_dir.resolve()}')
    shutil.rmtree(extract_dir)

with zipfile.ZipFile(zip_path) as zf:
    damaged_member = zf.testzip()
    if damaged_member:
        raise SystemExit(f'ZIP CRC check failed: {damaged_member}')
    names = zf.namelist()
    # Legal/source materials must actually ship, not just exist in the checkout.
    legal_root = ROOT / 'licenses' / 'installer'
    legal_manifest = json.loads((legal_root / 'manifest.json').read_text(encoding='utf-8'))
    for legal_file in ['README.md', 'manifest.json'] + [row['file'] for row in legal_manifest['files']]:
        expected_path = 'licenses/installer/' + legal_file
        candidates = [name for name in names if name == expected_path or name.endswith('/' + expected_path)]
        if len(candidates) != 1 or zf.read(candidates[0]) != (legal_root / legal_file).read_bytes():
            raise SystemExit(f'Missing, ambiguous or changed installer license/source material in ZIP: {expected_path}')
    for builder_file in ['LICENSE.txt', 'README.md']:
        member = 'licenses/builder/' + builder_file
        if names.count(member) != 1 or zf.read(member) != (ROOT / 'licenses' / 'builder' / builder_file).read_bytes():
            raise SystemExit(f'Missing or changed builder template attribution: {member}')
    application_exe = next((name for name in names if name.endswith('HD2 Chaos Slot Machine.exe')), None)
    for helper_file in ['integration.nsh', 'shell-properties.nsh']:
        member = 'licenses/hd2-shell/' + helper_file
        if member not in names or zf.read(member) != (ROOT / 'installer' / helper_file).read_bytes():
            raise SystemExit(f'Missing or changed original shell helper source: {member}')
    if not application_exe or zf.open(application_exe).read(2) != b'MZ':
        raise SystemExit('ZIP application executable is absent or has an invalid MZ header.')
    asar_member = next((name for name in names if name.endswith('resources/app.asar')), None)
    if asar_member:
        zf.extract(asar_member, extract_dir)

asar_listing = []
if asar_member:
    asar_path = extract_dir / asar_member
    asar_cli = ROOT / 'node_modules' / '@electron' / 'asar' / 'bin' / 'asar.js'
    if not asar_cli.is_file():
        raise SystemExit(f'Missing locked ASAR inspection tool: {asar_cli}. Run npm ci first.')
    result = subprocess.run(
        ['node', str(asar_cli), 'list', str(asar_path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    asar_listing = [line.replace('\\', '/').lstrip('/') for line in result.stdout.splitlines()]

all_names = names + asar_listing

checks = {
    'trusted IPC guard': 'electron/ipc-security.js',
    'CSP-safe image fallbacks': 'assets/image-fallbacks.js',
    'project license': 'LICENSE.txt',
    'ownership notice': 'NOTICE.txt',
    'third-party notices': 'THIRD_PARTY_NOTICES.md',
    'security guidance': 'SECURITY.md',
    'save acknowledgement tracking': 'assets/save-health.js',
    'shared import export validation': 'assets/transfer-validation.js',
    'single profile instance protection': 'electron/profile-instance.js',
    'Entrenched Division artwork': 'assets/warbonds/official/entrenched-division.jpg',
    'Exo Experts original artwork': 'assets/warbonds/official/exo-experts.jpg',
    'ODST original artwork': 'assets/warbonds/official/obedient-democracy-support-troopers.jpg',
    'reviewed Warbond batch 7': 'assets/catalog-reviews/2026-09-14-warbonds-7.json',
    'Python Commandos artwork': 'assets/warbonds/official/python-commandos.jpg',
    'Redacted Regiment artwork': 'assets/warbonds/official/redacted-regiment.jpg',
    'Siege Breakers artwork': 'assets/warbonds/official/siege-breakers.jpg',
    'reviewed Warbond batch 6': 'assets/catalog-reviews/2026-09-14-warbonds-6.json',
    'Viper Commandos artwork': 'assets/warbonds/official/viper-commandos.jpg',
    'Truth Enforcers artwork': 'assets/warbonds/official/truth-enforcers.jpg',
    'Steeled Veterans artwork': 'assets/warbonds/official/steeled-veterans.jpg',
    'reviewed Warbond batch 5': 'assets/catalog-reviews/2026-09-14-warbonds-5.json',
    'exe': 'HD2 Chaos Slot Machine.exe',
    'electron': 'resources/app.asar',
    'runtime': 'resources/',
    'catalog': 'assets/item-catalog.json',
    'image mappings': 'assets/item-images.json',
    'HD2CSM artwork': 'assets/branding/hd2-chaos-slot-machine.svg',
    'browser save migration': 'assets/browser-storage-migration.js',
    'desktop window layout': 'assets/desktop-window.css',
    'desktop window behavior': 'assets/desktop-window.js',
    'fullscreen window IPC': 'electron/window-controls.js',
    'software rendering and graceful close': 'electron/desktop-safety.js',
    'durable diagnostic reporting': 'electron/durable-file.js',
    'catalog migration and ownership': 'assets/catalog-state.js',
    'catalog source facts': 'assets/catalog-sources.js',
    'reviewed source batch': 'assets/catalog-reviews/2026-09-14.json',
    'retired identity review and archived records': 'assets/catalog-reviews/2026-09-14-identity-merges.json',
    'second Warbond review': 'assets/catalog-reviews/2026-09-14-warbonds.json',
    'third Warbond review': 'assets/catalog-reviews/2026-09-14-warbonds-3.json',
    'official cover provenance': 'assets/warbonds/official/provenance.json',
    'official cover attribution': 'assets/warbonds/official/ATTRIBUTION.md',
    'Freedom flame promotional cover': 'assets/warbonds/official/freedoms-flame.jpg',
    'Chemical agents promotional cover': 'assets/warbonds/official/chemical-agents.jpg',
    'Urban legends promotional cover': 'assets/warbonds/official/urban-legends.jpg',
    'Cutting Edge promotional cover': 'assets/warbonds/official/cutting-edge.jpg',
    'Democratic Detonation promotional cover': 'assets/warbonds/official/democratic-detonation.jpg',
    'Polar Patriots promotional cover': 'assets/warbonds/official/polar-patriots.png',
    'Control Group promotional cover': 'assets/warbonds/official/control-group.jpg',
    'Servants of Freedom promotional cover': 'assets/warbonds/official/servants-of-freedom.jpg',
    'Borderline Justice promotional cover': 'assets/warbonds/official/borderline-justice.jpg',
    'new gear ownership UI': 'assets/catalog-ui.js',
    'new gear layout': 'assets/catalog-ui.css',
    'new gear provenance': 'assets/new-gear/provenance.json',
    'new gear attribution': 'assets/new-gear/ATTRIBUTION.md',
    'Castellans Creed cover': 'assets/new-gear/castellans-creed-cover.png',
    'icon': 'build/icon.ico',
    'window icon': 'build/icon.png',
    'readme first': 'README-FIRST.txt',
}

missing = []
image_mapping = json.loads((ROOT / 'assets' / 'item-images.json').read_text(encoding='utf-8'))
for category in ('primary', 'sidearm', 'throwable', 'booster', 'stratagem'):
    for entry in image_mapping.get(category, []):
        asset_path = entry.get('assetPath', '')
        if not asset_path or asset_path not in asar_listing:
            missing.append(f'{category} source artwork: {entry["name"]}: {asset_path}')
for label, needle in checks.items():
    if not any(name.endswith(needle) or needle in name for name in all_names):
        missing.append(f'{label}: {needle}')

runtime_needles = ['resources/app.asar', 'chrome_100_percent.pak', 'icudtl.dat', 'snapshot_blob.bin', 'v8_context_snapshot.bin', 'LICENSE.electron.txt', 'LICENSES.chromium.html']
for needle in runtime_needles:
    if not any(name.endswith(needle) for name in all_names):
        missing.append(f'Electron runtime: {needle}')

forbidden_parts = ['.git/', 'node_modules/', 'test/', 'coverage/', '.env']
forbidden_names = ['package-lock.json', 'sample-card-tidied.html']
forbidden = []
for name in all_names:
    lower = name.lower()
    if any(part in lower for part in forbidden_parts) or any(lower.endswith(f) for f in forbidden_names) or 'secret' in lower:
        forbidden.append(name)

if missing or forbidden:
    if missing:
        print('Missing required package content:')
        print('\n'.join(f' - {m}' for m in missing))
    if forbidden:
        print('Forbidden/unnecessary package content:')
        print('\n'.join(f' - {f}' for f in forbidden[:50]))
    raise SystemExit(1)

def pe_overlay_size(path):
    """Return bytes after the final PE section (the embedded NSIS payload)."""
    with path.open('rb') as executable:
        if executable.read(2) != b'MZ':
            raise SystemExit(f'Installer is not a Windows PE executable: {path}')
        executable.seek(0x3C)
        pe_offset_bytes = executable.read(4)
        if len(pe_offset_bytes) != 4:
            raise SystemExit(f'Installer has a truncated DOS header: {path}')
        pe_offset = struct.unpack('<I', pe_offset_bytes)[0]
        executable.seek(pe_offset)
        if executable.read(4) != b'PE\0\0':
            raise SystemExit(f'Installer has an invalid PE signature: {path}')
        coff_header = executable.read(20)
        if len(coff_header) != 20:
            raise SystemExit(f'Installer has a truncated COFF header: {path}')
        section_count = struct.unpack_from('<H', coff_header, 2)[0]
        optional_header_size = struct.unpack_from('<H', coff_header, 16)[0]
        executable.seek(optional_header_size, 1)
        final_section_byte = 0
        for _ in range(section_count):
            section_header = executable.read(40)
            if len(section_header) != 40:
                raise SystemExit(f'Installer has a truncated PE section table: {path}')
            raw_size = struct.unpack_from('<I', section_header, 16)[0]
            raw_offset = struct.unpack_from('<I', section_header, 20)[0]
            final_section_byte = max(final_section_byte, raw_offset + raw_size)
    return max(0, path.stat().st_size - final_section_byte)


installer_overlay_size = pe_overlay_size(installer_path)
if installer_overlay_size < 1024 * 1024:
    raise SystemExit(
        f'Installer does not contain a substantial embedded application payload '
        f'({installer_overlay_size} bytes after PE sections): {installer_path}'
    )


def write_checksum(artifact):
    digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
    checksum_path = artifact.with_suffix(artifact.suffix + '.sha256')
    checksum_path.write_text(f'{digest}  {artifact.name}\n', encoding='ascii', newline='\n')
    return digest, checksum_path


zip_sha, zip_sha_path = write_checksum(zip_path)
installer_sha, installer_sha_path = write_checksum(installer_path)

print(f'ZIP: {zip_path}')
print(f'ZIP size bytes: {zip_path.stat().st_size}')
print(f'ZIP SHA-256: {zip_sha}')
print(f'ZIP entries: {len(names)}')
print(f'ZIP checksum: {zip_sha_path}')
print(f'Offline installer: {installer_path}')
print(f'Installer size bytes: {installer_path.stat().st_size}')
print(f'Installer embedded payload bytes: {installer_overlay_size}')
print(f'Installer SHA-256: {installer_sha}')
print(f'Installer checksum: {installer_sha_path}')
print('Required runtime files and assets are present; forbidden development/secrets patterns are absent.')
