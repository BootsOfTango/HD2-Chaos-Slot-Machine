#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re, unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote, urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = ROOT / 'index.html'
CATALOG_JSON = ROOT / 'assets' / 'item-catalog.json'
OUTPUT_JSON = ROOT / 'assets' / 'item-images.json'
WIKI_BASE = 'https://helldivers.wiki.gg'
API_ENDPOINT = f'{WIKI_BASE}/api.php'
UA = 'HD2CSMAssetSync/1.0'

CATEGORY_TO_ASSET_DIR = {
    'primary': 'assets/weapons/primaries',
    'sidearm': 'assets/weapons/sidearms',
    'throwable': 'assets/weapons/throwables',
    'booster': 'assets/boosters',
}
STRATAGEM_GROUP_DIRS = {
    'support': 'assets/stratagems/support',
    'orbital': 'assets/stratagems/orbital',
    'eagle': 'assets/stratagems/eagle',
    'defensive': 'assets/stratagems/defensive',
    'backpack': 'assets/stratagems/backpack',
    'exosuit': 'assets/stratagems/exosuits',
}
WIKI_TITLE_ALIASES: Dict[str, str] = {
    'Guard Dog Rover': 'AX/LAS-5 "Guard Dog" Rover',
    'SG-225SP Breaker Spray&Pray': 'SG-225SP Breaker Spray & Pray',
    'Orbital 120MM HE Barrage': 'Orbital 120mm HE Barrage',
    'Orbital 380MM HE Barrage': 'Orbital 380mm HE Barrage',
    'Eagle 110MM Rocket Pods': 'Eagle 110mm Rocket Pods',
    'Detonation Tool': 'Defoliation Tool',
    'Fast Recon Vehicle': 'M-102 Fast Recon Vehicle',
    'Grenadier Battalion': 'Grenadier battlement',
    'Guard Dog Arc': 'AX/ARC-3 K-9',
    'Guard Dog Breath': 'AX/TX-13 Dog Breath',
    'R-0 Variable': 'VG-70 Variable',
}
NAME_ALIASES = {
    'sg-225sp breaker spray and pray': 'SG-225SP Breaker Spray&Pray',
    'sg 225sp breaker spray pray': 'SG-225SP Breaker Spray&Pray',
    'sta x3 wasp launcher': 'StA-X3 W.A.S.P. Launcher',
    'orbital 120mm he barrage': 'Orbital 120MM HE Barrage',
    'orbital 380mm he barrage': 'Orbital 380MM HE Barrage',
    'eagle 110mm rocket pods': 'Eagle 110MM Rocket Pods',
}
STRATAGEM_GROUP_RULES: List[Tuple[str, str]] = [
    ('orbital', 'orbital'), ('eagle', 'eagle'), ('sentry', 'defensive'),
    ('mine', 'defensive'), ('emplacement', 'defensive'),
    ('shield', 'backpack'), ('pack', 'backpack'), ('guard dog', 'backpack'), ('exosuit', 'exosuit'),
]

def fetch_text(url: str) -> str:
    with urlopen(Request(url, headers={'User-Agent': UA}), timeout=25) as r:
        return r.read().decode('utf-8', errors='replace')

def fetch_bytes(url: str) -> bytes:
    with urlopen(Request(url, headers={'User-Agent': UA}), timeout=25) as r:
        return r.read()

def normalize_name(v: str) -> str:
    v = unicodedata.normalize('NFKD', v).encode('ascii', 'ignore').decode('ascii').lower().replace('&', ' and ')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', v)).strip()

def slugify(v: str) -> str:
    v = unicodedata.normalize('NFKD', v).encode('ascii', 'ignore').decode('ascii').lower().replace('&', ' and ')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', v)).strip('-') or 'item'

def parse_defaults_items(text: str) -> Dict[str, List[str]]:
    out = {}
    for key in ('primaries', 'sidearms', 'throwables', 'stratagems'):
        m = re.search(rf'{key}:\s*\[(.*?)\]\.map\(n => \(\{{ name: n, enabled: true \}}\)\)', text, re.S)
        if not m: raise RuntimeError(f'missing {key}')
        out[key] = [unescape(x) for x in re.findall(r'"([^"]+)"', m.group(1))]
    return out

def parse_catalog_items() -> List[Dict[str, str]]:
    catalog = json.loads(CATALOG_JSON.read_text(encoding='utf-8'))
    out: List[Dict[str, str]] = []
    for item in catalog.get('items', []):
        item_type = str(item.get('type', '')).strip()
        name = str(item.get('name', '')).strip()
        subgroup = str(item.get('subgroup', '')).strip()
        if item_type and name:
            out.append({'type': item_type, 'name': name, 'subgroup': subgroup})
    return out

def resolve_wiki_titles(name: str) -> List[str]:
    candidates = []
    if name in WIKI_TITLE_ALIASES: candidates.append(WIKI_TITLE_ALIASES[name])
    candidates.append(name)
    q = urlencode({'action':'opensearch','search':name,'limit':5,'namespace':0,'format':'json'})
    data = json.loads(fetch_text(f'{API_ENDPOINT}?{q}'))
    if isinstance(data,list) and len(data)>1: candidates.extend(data[1])
    seen, dedup = set(), []
    for c in candidates:
        if c and c not in seen: seen.add(c); dedup.append(c)
    return dedup

def image_from_html(html:str)->Optional[str]:
    for pat in [r'<meta\s+property="og:image"\s+content="([^"]+)"', r'<meta\s+name="twitter:image"\s+content="([^"]+)"']:
        m = re.search(pat, html, re.I)
        if m: return unescape(m.group(1))
    return None

def pick_ext(url:str)->str:
    s=Path(urlparse(url).path).suffix.lower()
    return '.jpg' if s=='.jpeg' else (s if s in {'.png','.jpg','.webp','.gif','.svg'} else '.png')

def stratagem_group(name:str)->str:
    n=normalize_name(name)
    for t,g in STRATAGEM_GROUP_RULES:
        if t in n: return g
    return 'support'

def rim_category_for_group(group: str) -> str:
    return group if group in {'support', 'orbital', 'eagle', 'defensive'} else 'support'

def stratagem_group_from_subgroup(subgroup: str, name: str) -> str:
    subgroup = normalize_name(subgroup)
    if subgroup in {'support', 'orbital', 'eagle', 'defensive', 'backpack'}:
        return subgroup
    if subgroup in {'exosuit', 'exosuits'}:
        return 'exosuit'
    return stratagem_group(name)

def stable_write(path:Path, content:bytes):
    if path.exists() and path.read_bytes()==content: return
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)

def should_store_local_asset(category: str, ext: str) -> bool:
    return category in {*CATEGORY_TO_ASSET_DIR, 'stratagem'} and ext in {'.png', '.jpg', '.webp', '.gif', '.svg'}

def validate_image(content: bytes, ext: str):
    if ext == '.svg':
        text = content.decode('utf-8')
        if '<svg' not in text or re.search(r'<script|<foreignObject|\bon\w+\s*=|(?:href|url)\s*[=(]\s*[\"\']?https?:', text, re.I):
            raise ValueError('Invalid or externally active SVG')
    elif not (content.startswith(b'\x89PNG\r\n\x1a\n') or content.startswith(b'\xff\xd8\xff')
              or content.startswith((b'GIF87a', b'GIF89a'))
              or (content.startswith(b'RIFF') and content[8:12] == b'WEBP')):
        raise ValueError('Response is not a supported image')

def download_existing():
    """Bundle known source URLs without replacing catalog names or losing entries.

    Source-derived artwork gets a distinct filename, preserving earlier local art.
    All downloads must succeed before the mapping is changed.
    """
    mapping = json.loads(OUTPUT_JSON.read_text(encoding='utf-8'))
    def download(category, entry):
        url = entry.get('imageUrl', '')
        if urlparse(url).hostname != 'helldivers.wiki.gg':
            raise ValueError(f'Missing approved source URL for {entry["name"]}')
        ext = pick_ext(url)
        rel = Path(CATEGORY_TO_ASSET_DIR[category]) / f'{slugify(entry["name"])}-wiki{ext}'
        content = fetch_bytes(url)
        validate_image(content, ext)
        stable_write(ROOT / rel, content)
        return entry, rel.as_posix(), hashlib.sha256(content).hexdigest()
    results, failures = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {pool.submit(download, cat, entry): (cat, entry['name'])
                for cat in CATEGORY_TO_ASSET_DIR for entry in mapping.get(cat, [])}
        for job in as_completed(jobs):
            cat, name = jobs[job]
            try:
                results.append(job.result())
                print(f'Downloaded {cat}: {name}', flush=True)
            except Exception as exc:
                failures.append(f'{cat}: {name}: {exc}')
    if failures:
        raise SystemExit('Mapping unchanged; downloads failed:\n' + '\n'.join(failures))
    for entry, asset_path, digest in results:
        entry.update(assetPath=asset_path, artworkSha256=digest,
                     artworkSource='Helldivers Wiki game artwork / community-traced game icon')
    stable_write(OUTPUT_JSON, (json.dumps(mapping, indent=2, ensure_ascii=False) + '\n').encode())
    print(f'Bundled {len(results)} source images and updated mapping.')

def sync_item(name:str, category:str, subgroup:str='')->Dict[str,str]:
    last=None; wiki_title=''; page_url=''; html=''
    for t in resolve_wiki_titles(name):
        try:
            wiki_title=t; page_url=f"{WIKI_BASE}/wiki/{quote(t.replace(' ','_'))}"; html=fetch_text(page_url); break
        except Exception as e:
            last=e
    else:
        raise RuntimeError(f'unresolved page ({last})')
    img=image_from_html(html)
    if not img: raise RuntimeError('missing og:image')
    img=urljoin(WIKI_BASE,img)
    ext=pick_ext(img); slug=slugify(name)
    if category=='stratagem':
        group = stratagem_group_from_subgroup(subgroup, name)
        rel=Path(STRATAGEM_GROUP_DIRS[group]) / f'{slug}{ext}'; kind='icon'
    else:
        rel=Path(CATEGORY_TO_ASSET_DIR[category]) / f'{slug}{ext}'; kind='icon' if category=='booster' else 'image'
    asset_path = rel.as_posix() if should_store_local_asset(category, ext) else ''
    if asset_path:
        content = fetch_bytes(img)
        validate_image(content, ext)
        stable_write(ROOT/rel, content)
    payload = {'name':name,'assetPath':asset_path,'kind':kind,'wikiTitle':wiki_title,'sourceUrl':page_url,'imageUrl':img}
    if category == 'stratagem':
        payload['rimCategory'] = rim_category_for_group(group)
    return payload

def main():
    catalog_items=parse_catalog_items()
    mapping={'primary':[],'sidearm':[],'throwable':[],'stratagem':[],'booster':[]}
    failures=[]
    for item in catalog_items:
        category = item['type']
        name = item['name']
        subgroup = item.get('subgroup', '')
        if category not in mapping:
            continue
        try:
            e=sync_item(name,category,subgroup); mapping[category].append(e); print(f"Synced {category:<9} {name} -> {e['assetPath']}")
        except Exception as ex:
            failures.append(f'{category}:{name}: {ex}'); print(f'FAILED {category:<9} {name}: {ex}')
    for k in mapping: mapping[k]=sorted(mapping[k], key=lambda x:x['name'])
    aliases={normalize_name(item['name']):item['name'] for item in catalog_items}
    aliases.update(NAME_ALIASES)
    payload={'generatedAt':'deterministic-v1','source':WIKI_BASE,'nameAliases':dict(sorted(aliases.items())),**mapping}
    stable_write(OUTPUT_JSON,(json.dumps(payload,indent=2,ensure_ascii=False)+'\n').encode())
    print(f'Wrote mapping: {OUTPUT_JSON.relative_to(ROOT)}')
    if failures: raise SystemExit('\n'.join(failures))

if __name__=='__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--download-existing', action='store_true', help='Bundle existing weapon/booster source URLs; preserve catalog and old artwork')
    args = parser.parse_args()
    download_existing() if args.download_existing else main()
