# Bundled game-item artwork

The September 13, 2026 artwork correction replaces the primary, sidearm, and throwable placeholders and the simplified booster substitutes with 111 source images: 50 primaries, 23 sidearms, 20 throwables, and 18 boosters.

Sources are the existing item-specific `sourceUrl` and `imageUrl` fields in `assets/item-images.json`, hosted by the Helldivers Wiki at https://helldivers.wiki.gg. Weapon images are game renders. Booster SVGs reproduce the game's symbols; some explicitly credit community tracing (for example, Increased Reinforcement Budget credits Dogo314). They are not claimed to be original official SVG files provided by the developer. Artwork remains the property of its respective game creators/contributors; this fan application is not affiliated with or endorsed by them. Source attribution is retained per item and inside downloaded SVGs.

Images are downloaded unchanged to distinct `*-wiki.*` filenames. Earlier substitute files remain recoverable. Each mapping records the downloaded SHA-256 digest. No AI-generated replacements are used for game-item pictures.

To refresh the existing mapped sources, run `python scripts/sync_wiki_assets.py --download-existing`. This preserves catalog names, validates image responses, and only changes the mapping if all downloads succeed. These files are included in the application and do not require runtime internet access.

`test/item-artwork.test.js` rejects placeholders and verifies source-image digests. The desktop integration tests decode every one of these images with external requests blocked, including when running the packaged EXE.
