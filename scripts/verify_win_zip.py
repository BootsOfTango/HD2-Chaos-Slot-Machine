#!/usr/bin/env python3
"""Verify both Windows release artifacts and write SHA-256 sidecars."""

import hashlib
import json
import shutil
import struct
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

with (ROOT / 'package.json').open(encoding='utf-8') as package_file:
    version = json.load(package_file)['version']

zip_path = DIST / f'Helldivers-2-Chaos-Slot-Machine-v{version}-win-x64.zip'
installer_path = DIST / f'Helldivers-2-Chaos-Slot-Machine-Setup-v{version}-win-x64.exe'

for artifact in (zip_path, installer_path):
    if not artifact.is_file():
        raise SystemExit(f'Missing Windows artifact: {artifact}')

extract_dir = DIST / 'verify-win-zip'
if extract_dir.exists():
    if extract_dir.is_symlink() or extract_dir.resolve().parent != DIST.resolve():
        raise SystemExit(f'Refusing to replace an unexpected verification directory: {extract_dir.resolve()}')
    shutil.rmtree(extract_dir)

with zipfile.ZipFile(zip_path) as zf:
    names = zf.namelist()
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
    'exe': 'Helldivers 2 Chaos Slot Machine.exe',
    'electron': 'resources/app.asar',
    'runtime': 'resources/',
    'catalog': 'assets/item-catalog.json',
    'image mappings': 'assets/item-images.json',
    'HD2CSM artwork': 'assets/branding/hd2csm-emblem.png',
    'browser save migration': 'assets/browser-storage-migration.js',
    'desktop window layout': 'assets/desktop-window.css',
    'desktop window behavior': 'assets/desktop-window.js',
    'fullscreen window IPC': 'electron/window-controls.js',
    'catalog migration and ownership': 'assets/catalog-state.js',
    'catalog source facts': 'assets/catalog-sources.js',
    'reviewed source batch': 'assets/catalog-reviews/2026-09-14.json',
    'retired identity review and archived records': 'assets/catalog-reviews/2026-09-14-identity-merges.json',
    'second Warbond review': 'assets/catalog-reviews/2026-09-14-warbonds.json',
    'official cover attribution': 'assets/warbonds/official/ATTRIBUTION.md',
    'Freedom flame promotional cover': 'assets/warbonds/official/freedoms-flame.jpg',
    'Chemical agents promotional cover': 'assets/warbonds/official/chemical-agents.jpg',
    'Urban legends promotional cover': 'assets/warbonds/official/urban-legends.jpg',
    'Cutting Edge promotional cover': 'assets/warbonds/official/cutting-edge.jpg',
    'Democratic Detonation promotional cover': 'assets/warbonds/official/democratic-detonation.jpg',
    'Polar Patriots promotional cover': 'assets/warbonds/official/polar-patriots.png',
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

runtime_needles = ['resources/app.asar', 'chrome_100_percent.pak', 'icudtl.dat', 'snapshot_blob.bin', 'v8_context_snapshot.bin']
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
