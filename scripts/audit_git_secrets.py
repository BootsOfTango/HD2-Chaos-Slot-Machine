"""Bounded, local-only pattern audit; never print matched secret values.

Scans reachable Git blobs/commit/tag messages and current nonignored files.
Not a complete credential detector, malware scanner or rights clearance.
"""
import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES = {
    'private-key-header': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),
    'github-classic-token': re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{36,255}\b'),
    'github-fine-grained-token': re.compile(rb'\bgithub_pat_[A-Za-z0-9_]{40,255}\b'),
    'aws-access-key-id': re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'slack-token': re.compile(rb'\bxox[baprs]-[A-Za-z0-9-]{20,255}\b'),
    'npm-token': re.compile(rb'\bnpm_[A-Za-z0-9]{36}\b'),
    'credential-bearing-http-url': re.compile(rb'https?://[^\s/@:]+:[^\s/@]+@[^\s/]+'),
}


def matching_rules(data):
    return [name for name, regex in RULES.items() if regex.search(data)]


def sensitive_path(name):
    normalized = name.replace('\\', '/').lower()
    parts = normalized.split('/')
    leaf = parts[-1]
    return ('.test-data' in parts or '.git-credentials' in parts or
            leaf in {'.npmrc', 'id_rsa', 'id_ed25519', 'credentials', 'credentials.json'} or
            (leaf.startswith('.env') and leaf not in {'.env.example', '.env.sample', '.env.template'}) or
            leaf.endswith(('.pfx', '.p12', '.key', '.pem')))


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def audit():
    lines = git('rev-list', '--objects', '--all').decode('utf-8', 'replace').splitlines()
    ids = list(dict.fromkeys(line.split(' ', 1)[0] for line in lines))
    report = {
        'at': datetime.now(timezone.utc).isoformat(),
        'scope': 'All locally reachable refs (not remote-only/deleted/unreachable history) plus current nonignored files',
        'commitCount': int(git('rev-list', '--all', '--count')),
        'objectsScanned': {}, 'workingFilesScanned': 0, 'findings': [], 'symlinksSkipped': 0,
        'limits': 'Selected token/key/URL patterns only; no arbitrary password, entropy or malware detection. No values printed or uploaded.',
    }
    # Batch-stream to avoid loading all historical binary assets into memory.
    proc = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for oid in ids:
            proc.stdin.write((oid + '\n').encode()); proc.stdin.flush()
            header = proc.stdout.readline().decode().split()
            if len(header) != 3:
                raise RuntimeError('Could not read a referenced Git object')
            _, kind, size = header
            data = proc.stdout.read(int(size))
            if len(data) != int(size) or proc.stdout.read(1) != b'\n':
                raise RuntimeError('Incomplete Git object stream')
            if kind not in {'blob', 'commit', 'tag'}:
                continue
            report['objectsScanned'][kind] = report['objectsScanned'].get(kind, 0) + 1
            for rule in matching_rules(data):
                report['findings'].append({'scope': 'history', 'object': oid, 'kind': kind, 'rule': rule})
    finally:
        proc.stdin.close()
        proc.stdout.close()
        if proc.wait() != 0:
            raise RuntimeError('Git object reader failed')
    # Name history separately: a reused blob can have several historical paths.
    historic_names = set(git('log', '--all', '--format=', '--name-only', '-z').decode('utf-8', 'replace').split('\0'))
    for name in sorted({name.lstrip('\n') for name in historic_names if name.strip()}):
        if sensitive_path(name):
            report['findings'].append({'scope': 'historical-path', 'path': name, 'rule': 'sensitive-file-name'})
    names = git('ls-files', '-c', '-o', '--exclude-standard', '-z').decode('utf-8', 'replace').split('\0')
    for name in sorted(set(filter(None, names))):
        file = ROOT / name
        if file.is_symlink():
            report['symlinksSkipped'] += 1
            continue
        if not file.is_file():
            continue
        # Do not follow links outside the checkout or read ignored private profiles.
        if not file.resolve().is_relative_to(ROOT):
            raise RuntimeError('Unexpected external path')
        report['workingFilesScanned'] += 1
        if sensitive_path(name):
            report['findings'].append({'scope': 'working-tree', 'path': name, 'rule': 'sensitive-file-name'})
        for rule in matching_rules(file.read_bytes()):
            report['findings'].append({'scope': 'working-tree', 'path': name, 'rule': rule})
    report['findingCount'] = len(report['findings'])
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', help='Optional generated report inside .test-data only')
    args = parser.parse_args()
    output = None
    if args.report:
        output = (ROOT / args.report).resolve()
        if not output.is_relative_to(ROOT / '.test-data') or output.suffix != '.json':
            parser.error('Report must be a JSON file inside this checkout .test-data')
    result = audit()
    rendered = json.dumps(result, indent=2) + '\n'
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding='utf-8')
    print(rendered)
    raise SystemExit(1 if result['findingCount'] else 0)
