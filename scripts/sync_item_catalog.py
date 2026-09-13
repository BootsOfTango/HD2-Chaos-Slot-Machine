#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'
CATALOG = ROOT / 'assets' / 'item-catalog.json'
ITEM_IMAGES = ROOT / 'assets' / 'item-images.json'

TYPE_TO_DEFAULTS_KEY = {
    'primary': 'primaries',
    'sidearm': 'sidearms',
    'throwable': 'throwables',
    'stratagem': 'stratagems',
    'booster': 'boosters',
}


def local_asset_exists(asset_path: str) -> bool:
    return bool(asset_path) and (ROOT / asset_path).exists()


def normalize_key(value: str) -> str:
    value = (value or '').lower().replace('&', ' and ')
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def build_aliases(catalog_items):
    aliases = {}
    for item in catalog_items:
        name = item['name']
        variants = {
            normalize_key(name),
            normalize_key(name.replace('&', 'and')),
            normalize_key(name.replace('&', '')),
            normalize_key(name.replace('/', ' ')),
            normalize_key(name.replace("'", '')),
        }
        variants.update(normalize_key(alias) for alias in item.get('aliases', []))
        for key in [v for v in variants if v]:
            aliases[key] = name
    return dict(sorted(aliases.items()))


def render_defaults_block(catalog_items):
    grouped = {k: [] for k in TYPE_TO_DEFAULTS_KEY.values()}
    for item in catalog_items:
        grouped[TYPE_TO_DEFAULTS_KEY[item['type']]].append(item)

    lines = ['            items: {']
    order = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters']
    for idx, group_key in enumerate(order):
        lines.append(f'                {group_key}: [')
        for item in grouped[group_key]:
            name = json.dumps(item['name'])
            warbond = json.dumps(item['warbond'])
            subgroup = json.dumps(item['subgroup'])
            source = json.dumps(item['source'])
            enabled = 'true' if item.get('defaultEnabled', True) else 'false'
            extra = ', '.join(f'{key}: {json.dumps(item[key], ensure_ascii=False)}' for key in ['id', 'aliases', 'acquisition', 'introducedIn'] if key in item)
            lines.append(f'                    {{ name: {name}, enabled: {enabled}, owned: {enabled}, warbond: {warbond}, subgroup: {subgroup}, source: {source}, {extra} }},')
        lines.append('                ],')
        if idx < len(order) - 1:
            lines.append('')
    lines.append('            },')
    return '\n'.join(lines)


def render_warbond_map(catalog_items):
    lines = ['        const ITEM_WARBOND_BY_NAME = {']
    for item in catalog_items:
        name = json.dumps(item['name'])
        warbond = json.dumps(item['warbond'])
        lines.append(f'            {name}: {warbond},')
    lines.append('        };')
    return '\n'.join(lines)


def sync_index(catalog_items):
    text = INDEX.read_text(encoding='utf-8')
    defaults_block = render_defaults_block(catalog_items)
    text, n1 = re.subn(
        r"^[ \t]*items: \{.*?\n[ \t]+planets:",
        defaults_block + '\n\n            planets:',
        text,
        count=1,
        flags=re.S | re.M,
    )
    if n1 != 1:
        raise RuntimeError('Unable to replace DEFAULTS.items block')

    warbond_map = render_warbond_map(catalog_items)
    text, n2 = re.subn(
        r"^[ \t]*const ITEM_WARBOND_BY_NAME = \{.*?\n[ \t]{8}\};",
        warbond_map,
        text,
        count=1,
        flags=re.S | re.M,
    )
    if n2 != 1:
        raise RuntimeError('Unable to replace ITEM_WARBOND_BY_NAME block')

    INDEX.write_text(text, encoding='utf-8')


def sync_item_images(catalog_items):
    existing = json.loads(ITEM_IMAGES.read_text(encoding='utf-8'))
    provenance_path = ROOT / 'assets' / 'new-gear' / 'provenance.json'
    provenance = json.loads(provenance_path.read_text(encoding='utf-8')) if provenance_path.exists() else {}
    verified_art = {entry['name']: entry for entry in provenance.get('assets', [])}
    existing_by_type = {
        t: {entry['name']: entry for entry in existing.get(t, [])}
        for t in TYPE_TO_DEFAULTS_KEY
    }

    result = {
        'generatedAt': existing.get('generatedAt', ''),
        'source': 'Derived from assets/item-catalog.json via scripts/sync_item_catalog.py',
        'nameAliases': {**existing.get('nameAliases', {}), **build_aliases(catalog_items)},
    }

    for t in ['primary', 'sidearm', 'throwable', 'stratagem', 'booster']:
        out = []
        for item in [i for i in catalog_items if i['type'] == t]:
            prev = existing_by_type.get(t, {}).get(item['name'], {})
            catalog_asset_path = item.get('assetPath') or ''
            asset_path = catalog_asset_path if local_asset_exists(catalog_asset_path) else prev.get('assetPath', '')
            entry = {**prev,
                'name': item['name'],
                'assetPath': asset_path,
                'kind': prev.get('kind', 'icon' if t in {'stratagem', 'booster'} else 'image'),
            }
            for key in ['wikiTitle', 'sourceUrl', 'imageUrl', 'rimCategory']:
                if prev.get(key):
                    entry[key] = prev[key]
            if item['name'] in verified_art:
                art = verified_art[item['name']]
                entry.update(assetPath=art['assetPath'], imageUrl=art['imageUrl'], sourceUrl=art['filePage'],
                             artworkSource=art['sourceKind'] + '; ' + art['contributor'], artworkSha256=art['sha256'])
                if t == 'stratagem':
                    entry['rimCategory'] = item['subgroup']
                    entry['kind'] = 'icon' if art['assetPath'].endswith('.svg') else 'image'
            out.append(entry)
        result[t] = out

    ITEM_IMAGES.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def main():
    data = json.loads(CATALOG.read_text(encoding='utf-8'))
    if '--upgrade-v2' in sys.argv:
        # Explicit one-time mechanical migration, never a network content sync.
        # Persist IDs once; subsequent renames must retain the stored IDs.
        images = json.loads(ITEM_IMAGES.read_text(encoding='utf-8'))
        for item in data['items']:
            item.setdefault('id', item['type'] + ':' + normalize_key(item['name']).replace(' ', '-'))
            item.setdefault('aliases', [])
            for alias, canonical in images.get('nameAliases', {}).items():
                if canonical == item['name'] and normalize_key(alias) != normalize_key(item['name']) and alias not in item['aliases']:
                    item['aliases'].append(alias)
            item.setdefault('acquisition', {'kind': 'unverified', 'label': item.get('source', 'Unassigned / Custom'), 'verification': 'legacy-assignment-pending-audit'})
            previous = next((row for row in images.get(item['type'], []) if row['name'] == item['name']), {})
            if previous.get('assetPath') and local_asset_exists(previous['assetPath']):
                item['assetPath'] = previous['assetPath']
        data['version'] = 2
        CATALOG.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    items = data['items']
    sync_index(items)
    sync_item_images(items)
    print(f'Synced {len(items)} catalog items into index defaults, warbond map, and item-images.')


if __name__ == '__main__':
    main()
