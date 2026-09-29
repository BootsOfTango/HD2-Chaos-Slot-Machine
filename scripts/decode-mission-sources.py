"""Decode retained JPEG/WebP screenshots to RGBA PNG without resizing or retouching.

Requires Pillow in a development-only Python environment. No network requests.
Run before prepare-mission-game-icons.js, or with --check to verify decoded pixels.
The original download and its hash remain separate from the decoded PNG/hash.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, __version__ as pillow_version

root = Path(__file__).resolve().parents[1]
manifest_path = root / "assets/missions/game-icons/provenance.json"
originals = root / ".test-data/mission-game-icon-sources/originals"
parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
count = 0
for entry in manifest["entries"]:
    if not entry.get("downloadFile"):
        continue
    for key in ("downloadFile", "sourceFile"):
        if Path(entry[key]).name != entry[key]:
            raise ValueError("Only local source filenames are accepted")
    download = originals / entry["downloadFile"]
    digest = hashlib.sha256(download.read_bytes()).hexdigest()
    if entry.get("downloadSha256") and digest != entry["downloadSha256"]:
        raise ValueError("Downloaded source changed: " + entry["id"])
    with Image.open(download) as original:
        decoded = original.convert("RGBA")
        target = originals / entry["sourceFile"]
        if args.check or target.exists():
            with Image.open(target) as retained:
                if retained.size != decoded.size or retained.convert("RGBA").tobytes() != decoded.tobytes():
                    raise ValueError("Decoded pixels changed: " + entry["id"])
        else:
            decoded.save(target, format="PNG")
    if not args.check:
        entry["downloadSha256"] = digest
        entry["decode"] = "Pillow " + pillow_version + "; RGBA decode only; no resize, recolor or retouch"
    count += 1
if not args.check:
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Verified {count} original downloads against their lossless decoded pixels.")
