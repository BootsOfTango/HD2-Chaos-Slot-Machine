#!/usr/bin/env python3
"""Validate catalog/default/image consistency for armory visuals."""

import json
import re
import sys
import unicodedata
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
    value = unicodedata.normalize("NFKC", value or "").lower().replace("&", " and ")
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


def validate_identity_contracts(catalog_items, images):
    """Canonical rows own category-scoped IDs; retired identities never get image rows."""
    errors = []
    canonical_ids = {}
    legacy_ids = {}
    names = {}
    for item in catalog_items:
        item_id = item.get("id")
        category = item.get("type")
        if category not in TYPE_TO_DEFAULTS_KEY:
            errors.append(f"Unknown catalog category: {category!r}")
            continue
        if not isinstance(item_id, str) or item_id != item_id.strip() or not item_id.startswith(category + ":") or not item_id[len(category) + 1:].strip():
            errors.append(f"Canonical ID must be scoped to {category}: {item_id!r}")
        elif item_id in canonical_ids:
            errors.append(f"Duplicate canonical ID: {item_id}")
        else:
            canonical_ids[item_id] = item
        old_ids = item.get("legacyIds", [])
        if not isinstance(old_ids, list):
            errors.append(f"legacyIds must be an array: {item_id}")
            old_ids = []
        for old_id in old_ids:
            if not isinstance(old_id, str) or old_id != old_id.strip() or not old_id.startswith(category + ":") or not old_id[len(category) + 1:].strip():
                errors.append(f"Legacy ID must be scoped to {category}: {old_id!r}")
            elif old_id in legacy_ids:
                errors.append(f"Duplicate or multiply claimed legacy ID: {old_id}")
            else:
                legacy_ids[old_id] = item_id
        aliases = item.get("aliases", [])
        if not isinstance(aliases, list):
            errors.append(f"aliases must be an array: {item_id}")
            aliases = []
        for label in [item.get("name"), *aliases]:
            if not isinstance(label, str) or not label.strip():
                errors.append(f"Canonical names and aliases must be nonempty strings: {item_id}")
                continue
            normalized = normalize_key(label)
            if not normalized:
                errors.append(f"Catalog label needs a resolvable normalized name: {item_id}: {label!r}")
                continue
            name_key = (category, normalized)
            owner = names.get(name_key)
            if owner is not None and owner != item_id:
                errors.append(f"Ambiguous within-category name/alias: {category}:{label} maps to {owner} and {item_id}")
            else:
                names[name_key] = item_id
    for old_id in legacy_ids:
        if old_id in canonical_ids:
            errors.append(f"Legacy ID collides with a canonical ID: {old_id}")

    for category in TYPE_TO_DEFAULTS_KEY:
        expected = {item_id: item for item_id, item in canonical_ids.items() if item["type"] == category}
        entries = images.get(category, [])
        if not isinstance(entries, list):
            errors.append(f"Image category must be an array: {category}")
            continue
        actual_ids = []
        for entry in entries:
            item_id = entry.get("id")
            actual_ids.append(item_id)
            canonical = expected.get(item_id) if isinstance(item_id, str) else None
            if canonical is None:
                errors.append(f"Image ID is not a canonical {category} identity: {item_id!r}")
                continue
            if entry.get("name") != canonical.get("name"):
                errors.append(f"Image canonical name differs from catalog: {item_id}")
            if entry.get("assetPath") != canonical.get("assetPath"):
                errors.append(f"Image canonical assetPath differs from catalog: {item_id}")
        valid_actual = [item_id for item_id in actual_ids if isinstance(item_id, str)]
        if len(valid_actual) != len(set(valid_actual)):
            errors.append(f"Duplicate {category} image IDs")
        if set(valid_actual) != set(expected) or len(actual_ids) != len(expected):
            errors.append(f"Image IDs differ from the exact canonical {category} set")
    return errors


def main() -> int:
    index_text = INDEX.read_text(encoding="utf-8")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    images = json.loads(IMAGES.read_text(encoding="utf-8"))
    defaults = parse_defaults(index_text)

    errors = []

    catalog_items = catalog.get("items", [])
    errors.extend(validate_identity_contracts(catalog_items, images))
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
        typed_items = [item for item in catalog_items if item["type"] == t]
        catalog_names = [item["name"] for item in typed_items]
        if catalog_names != defaults[defaults_key]:
            errors.append(f"DEFAULTS.items.{defaults_key} differs from catalog ordering/content")
        block = re.search(rf"{defaults_key}: \[(.*?)\n\s{{16}}\],", index_text, flags=re.S).group(1)
        default_rows = [line for line in block.splitlines() if re.search(r"\{\s*name:", line)]
        generated_ids = []
        generated_legacy_ids = []
        for line in default_rows:
            id_match = re.search(r'\bid:\s*("(?:\\.|[^"\\])*")', line)
            legacy_match = re.search(r'\blegacyIds:\s*(\[[^\n]*?\])', line)
            generated_ids.append(json.loads(id_match.group(1)) if id_match else None)
            generated_legacy_ids.append(json.loads(legacy_match.group(1)) if legacy_match else [])
        if generated_ids != [item["id"] for item in typed_items]:
            errors.append(f"DEFAULTS.items.{defaults_key} canonical IDs differ from catalog")
        if generated_legacy_ids != [item.get("legacyIds", []) for item in typed_items]:
            errors.append(f"DEFAULTS.items.{defaults_key} retired ID compatibility differs from catalog")

    if errors:
        print("Catalog validation failed:")
        for err in errors:
            print(f" - {err}")
        return 1

    print("Catalog validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
