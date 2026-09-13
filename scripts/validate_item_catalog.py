#!/usr/bin/env python3
"""Validate catalog/default/image consistency for armory visuals."""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
CATALOG = ROOT / "assets" / "item-catalog.json"
IMAGES = ROOT / "assets" / "item-images.json"

TYPE_TO_DEFAULTS_KEY = {
    "primary": "primaries",
    "sidearm": "sidearms",
    "throwable": "throwables",
    "stratagem": "stratagems",
    "booster": "boosters",
}


def normalize_key(value: str) -> str:
    value = (value or "").lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_defaults(index_text: str):
    results = {}
    for key in ["primaries", "sidearms", "throwables", "stratagems", "boosters"]:
        match = re.search(rf"{key}: \[(.*?)\n\s{{16}}\],", index_text, flags=re.S)
        if not match:
            raise RuntimeError(f"Could not find DEFAULTS.items.{key} in index.html")
        block = match.group(1)
        names = re.findall(r'name:\s*"(.*?)"', block)
        results[key] = names
    return results


def main() -> int:
    index_text = INDEX.read_text(encoding="utf-8")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    images = json.loads(IMAGES.read_text(encoding="utf-8"))
    defaults = parse_defaults(index_text)

    errors = []

    catalog_items = catalog.get("items", [])
    if catalog.get('version') != 2:
        errors.append('Catalog schema version must be 2')
    ids = [item.get('id') for item in catalog_items]
    if any(not isinstance(value, str) or not value for value in ids) or len(set(ids)) != len(ids):
        errors.append('Every catalog item needs a unique stable ID')
    for item in catalog_items:
        if not isinstance(item.get('aliases'), list) or not isinstance(item.get('acquisition'), dict):
            errors.append(f"Missing aliases/acquisition metadata: {item['name']}")
        if item.get('introducedIn') == '1.1.2' and item.get('defaultEnabled') is not False:
            errors.append(f"New paid/reward gear must default to disabled: {item['name']}")
    for warbond in catalog.get('warbonds', []):
        if not set(warbond.get('equipmentIds', [])).issubset(set(ids)):
            errors.append(f"Unknown equipment association: {warbond['name']}")
        if not (ROOT / warbond['coverAssetPath']).is_file():
            errors.append(f"Missing Warbond cover: {warbond['name']}")
    canonical_names = [f"{item['type']}::{item['name']}" for item in catalog_items]
    duplicates = sorted({name for name in canonical_names if canonical_names.count(name) > 1})
    if duplicates:
        errors.append(f"Duplicate catalog canonical names: {duplicates}")

    defaults_by_type = {
        t: set(defaults[TYPE_TO_DEFAULTS_KEY[t]])
        for t in TYPE_TO_DEFAULTS_KEY
    }

    alias_map = {normalize_key(k): v for k, v in (images.get("nameAliases") or {}).items()}

    for t in ["primary", "sidearm", "throwable", "stratagem", "booster"]:
        img_entries = images.get(t, [])
        img_names = {entry.get("name", "") for entry in img_entries if entry.get("name")}

        # every default item has image entry directly or via alias canonicalization
        for item_name in sorted(defaults_by_type[t]):
            key = normalize_key(item_name)
            canonical = alias_map.get(key, item_name)
            if canonical not in img_names:
                errors.append(f"Missing image mapping for default {t} item: {item_name}")

        # no orphan image entries
        orphans = sorted(name for name in img_names if name not in defaults_by_type[t])
        if orphans:
            errors.append(f"Orphan {t} image entries not present in DEFAULTS: {orphans}")

        for entry in img_entries:
            name = entry.get("name", "<missing name>")
            asset_path = str(entry.get("assetPath", "")).strip()
            image_url = str(entry.get("imageUrl", "")).strip()

            if not asset_path and not image_url:
                errors.append(f"{t} item '{name}' is missing both assetPath and imageUrl")

            if asset_path:
                file_path = ROOT / asset_path
                if not file_path.exists():
                    errors.append(f"{t} item '{name}' references missing assetPath: {asset_path}")
                if "assets/placeholders/" in asset_path and not entry.get("placeholder"):
                    errors.append(f"{t} item '{name}' points to placeholder art without placeholder metadata: {asset_path}")

    # ensure defaults are catalog-derived
    for t, defaults_key in TYPE_TO_DEFAULTS_KEY.items():
        catalog_names = [item["name"] for item in catalog_items if item["type"] == t]
        if catalog_names != defaults[defaults_key]:
            errors.append(f"DEFAULTS.items.{defaults_key} differs from catalog ordering/content")

    if errors:
        print("Catalog validation failed:")
        for err in errors:
            print(f" - {err}")
        return 1

    print("Catalog validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
