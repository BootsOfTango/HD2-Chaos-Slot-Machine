"""Reproduce reviewed original-pixel artwork from explicitly supplied local sources.

No downloads, AI, background removal, recoloring or resampling. Requires Pillow.
Sources/coordinates are pinned below; see docs/IRONCLAD_ARTWORK.md.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/catalog-additions/ironclad'
OFFICIAL = 'https://blog.playstation.com/2026/09/15/helldivers-2-ironclad-democracy-warbond-launches-sept-22/'
POWERUP = 'https://powerupgaming.co.uk/2026/09/22/helldivers-2-all-ironclad-democracy-premium-warbond-details/'
CHALLENGES = 'https://www.helldivers2challenges.com/tiermaker/'
GAMESRADAR = 'https://www.gamesradar.com/games/third-person-shooter/helldivers-2-ironclad-democracy-warbond/'
# slug, input, sha256, crop(left,top,right,bottom), source page, direct source
SOURCES = [
 ('ar-11-arbitrator','ar11arbitrator.webp','374bc5bf7ef11ca2702938390db871cf9dc0918d387e5fbed02dc9e6ccbfb147',(380,334,1584,798),CHALLENGES,''),
 ('gl-15-evictor','gl15evictor.webp','b2c3f3e3a6f5016e3664011a6ed41eea56a8618b135c15411d497cb09c88fc68',(280,313,1634,835),CHALLENGES,''),
 ('las-12-sai','las12sai.webp','308a82d6970d0c15178e891112b3b5449dd0948adb1dd7770856db723f9b3413',(412,304,1603,858),CHALLENGES,''),
 ('p-34-breacher','p34breacher.webp','2318ba9f432d42b50b79a5b0e7745a755fa00203b5362edfdbb8120bab334d54',(16,65,312,225),CHALLENGES,''),
 ('g-8-immolation','g8immolation.webp','0b4bc40b52ac1da8c3da19c4d6a8dec46a7583ba4d6e9174eff0364c8715be6f',None,CHALLENGES,''),
 ('g-60-anti-tank-seeker','g60antitankseeker.webp','9629fd755d81ce924d87dbc6a923459fbc3811c32bdecc88a646f1de42e7521f',None,CHALLENGES,''),
 ('integrated-extinguishers','integratedextinguishers.webp','c41c5ef953b8199dd51646f1c1c0eff9b17a85df4c880aaca8069df955b6f86a',None,CHALLENGES,''),
 ('surplus-eat-allocation','surpluseatallocation.webp','997b9b9b93555e1e615b590f6c8b17af0e89d916fa5905f7f0eae4e1be1b8069',None,CHALLENGES,''),
 ('cover','cover.jpg','8034f5509c78ddf387d0090db67f70aa77b11079539b6a0fef00ee7f2af6f296',None,OFFICIAL,'https://blog.playstation.com/tachyon/2026/09/2ae780305b6c042b462bf069db5c42a36c819248.jpg'),
]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main(source_dir):
    # Validate every source before writing any output.
    for _, filename, expected, crop, _, _ in SOURCES:
        path = source_dir / filename
        if digest(path.read_bytes()) != expected:
            raise ValueError('Unreviewed source bytes: ' + filename)
        with Image.open(path) as im:
            im.load()
            if crop and not (0 <= crop[0] < crop[2] <= im.width and 0 <= crop[1] < crop[3] <= im.height):
                raise ValueError('Crop out of bounds: ' + filename)
    provenance = json.loads((DEST / 'provenance.json').read_text(encoding='utf-8'))
    historical = [a for a in provenance['assets'] if a['sourceKind'] == 'original-symbolic-vector']
    assert len(historical) == 9, 'Preserve all nine prior original assets'
    active = []
    for slug, filename, source_hash, crop, page, url in SOURCES:
        source = source_dir / filename
        original = next(a for a in historical if Path(a['assetPath']).stem == slug)
        ext = '.jpg' if slug == 'cover' else '.png'
        target = DEST / (slug + ext)
        with Image.open(source) as im:
            dimensions = [im.width, im.height]
            pixels = im.crop(crop) if crop else im.copy()
            if slug == 'cover':
                target.write_bytes(source.read_bytes())
            else:
                pixels.save(target, format='PNG')
                with Image.open(target) as check:
                    assert check.mode == pixels.mode and check.tobytes() == pixels.tobytes(), 'Pixel preservation failed'
            output_dimensions = [pixels.width, pixels.height]
        url = url or ('https://www.helldivers2challenges.com/images/equipment/' + filename)
        active.append(dict(name=original['name'], type=original['type'],
            assetPath=target.relative_to(ROOT).as_posix(),
            sourceKind='publisher-promotional-image' if slug == 'cover' else 'game-screenshot-crop' if page in (POWERUP,GAMESRADAR) else 'community-hosted-game-artwork',
            contributor='Game artwork: Sony Interactive Entertainment / Arrowhead Game Studios; source publisher: ' + ('PlayStation Blog' if slug == 'cover' else 'PowerUp Gaming' if page == POWERUP else 'GamesRadar+' if page == GAMESRADAR else 'Helldivers 2 Challenges (upstream editing authorship unverified)'),
            sourcePage=page, filePage=page, imageUrl=url, sha256=digest(target.read_bytes()), bytes=target.stat().st_size,
            sourceFile=filename, sourceSha256=source_hash, sourceDimensions=dimensions, crop=list(crop) if crop else None,
            dimensions=output_dimensions, transformation='unchanged download' if slug == 'cover' else 'lossless original-pixel crop / PNG encoding; no resampling or redrawing',
            permissionStatus='not-established', limitation='Local review. Source attribution and pixel matching do not establish redistribution permission. Community images are not asserted to be publisher-supplied originals.'))
    provenance.update(reviewedAt='2026-09-25', assets=historical + active,
        activeAssetPaths=[a['assetPath'] for a in active], historicalNote='Nine original SVGs retained recoverably; not used by current catalog. Later records supersede earlier records with the same name.')
    (DEST / 'provenance.json').write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    # Only artwork fields change; stable identities, ownership and factual sources stay intact.
    review_path = DEST / 'review.json'
    review = json.loads(review_path.read_text(encoding='utf-8'))
    catalog_path = ROOT / 'assets/item-catalog.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    by_name = {a['name']:a for a in active}
    for row in review['items']:
        row['assetPath'] = by_name[row['name']]['assetPath']
        next(i for i in catalog['items'] if i['id']==row['id'])['assetPath'] = row['assetPath']
    review['artwork'] = 'Reviewed transparent game-derived artwork; bundled offline. Public reuse rights not established.'
    review['warbond']['coverAssetPath'] = 'assets/catalog-additions/ironclad/cover.jpg'
    review['warbond']['coverKind'] = 'publisher-promotional-image'
    review['warbond']['notes'] = review['warbond']['notes'].replace('Artwork is original symbolic catalog illustration, not an in-game render.', 'Cover is the official promotional image; equipment uses reviewed transparent source artwork.').replace('equipment uses reviewed source artwork and exact screenshot crops.', 'equipment uses reviewed transparent source artwork.')
    catalog['warbonds'] = [review['warbond'] if b['id']==review['warbond']['id'] else b for b in catalog['warbonds']]
    for path, data in [(review_path, review),(catalog_path,catalog)]:
        path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Prepared 8 original-pixel item images + official cover; all pixel/hash checks passed.')

if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
