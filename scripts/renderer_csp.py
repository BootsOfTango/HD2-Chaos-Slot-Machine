"""Generate/check the hash allowlist for the single reviewed inline app script.

Hash HTML-parser-normalized LF text, not platform-dependent CRLF file bytes.
This is a build consistency check, not approval of newly edited JavaScript.
"""
import base64
import hashlib
import re
import sys
from pathlib import Path

INDEX = Path(__file__).resolve().parents[1] / 'index.html'
META = re.compile(r'(<meta http-equiv="Content-Security-Policy" content=")[^"]*("\s*/>)')

def with_policy(text):
    normalized = text.replace('\r\n', '\n').replace('\r', '\n')
    scripts = [(attrs, body) for attrs, body in re.findall(r'<script\b([^>]*)>(.*?)</script\s*>', normalized, re.S | re.I) if not re.search(r'\bsrc\s*=', attrs, re.I)]
    if len(scripts) != 1 or scripts[0][0].strip():
        raise ValueError('Expected exactly one unadorned inline application script')
    digest = base64.b64encode(hashlib.sha256(scripts[0][1].encode('utf-8')).digest()).decode('ascii')
    policy = ("default-src 'self'; script-src 'self' 'sha256-" + digest + "'; script-src-attr 'none'; "
              "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
              "connect-src 'self' https://api.helldivers2.dev; font-src 'self' data:; "
              "media-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; "
              "base-uri 'none'; form-action 'none'")
    updated, count = META.subn(lambda m: m[1] + policy + m[2], text)
    if count != 1:
        raise ValueError('Expected exactly one CSP meta tag')
    return updated

def main():
    # Preserve platform bytes outside the mechanically generated meta value.
    with INDEX.open(encoding='utf-8', newline='') as stream:
        text = stream.read()
    expected = with_policy(text)
    if '--write' in sys.argv:
        with INDEX.open('w', encoding='utf-8', newline='') as stream:
            stream.write(expected)
        print('Updated reviewed inline-script CSP hash.')
    elif text != expected:
        raise SystemExit('Renderer CSP is stale. Review the script changes, then run python scripts/renderer_csp.py --write.')
    else:
        print('Renderer CSP matches the reviewed inline script and local-image policy.')

if __name__ == '__main__':
    main()
