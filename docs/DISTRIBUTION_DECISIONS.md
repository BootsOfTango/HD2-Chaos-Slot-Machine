# Remaining distribution decisions — September 29, 2026

No official release is authorized by this document. The owner has approved temporary unsigned GitHub Actions test artifacts, not publication to Releases. Existing release signing/readiness gates have not been bypassed.

## Signing

The installed/local candidate is unsigned. An explicitly approved unsigned release could remain free to distribute, with its status stated in the README, release notes and download instructions. Keep checksums, exact-source build evidence, malware scans and private vulnerability reporting; none is equivalent to a trusted publisher signature or a safety guarantee. Do not instruct users to disable Defender, SmartScreen or Smart App Control.

Microsoft explains that SmartScreen uses file/publisher reputation and that even newly signed binaries can receive warnings. Signing is therefore not a promise of warning-free installation. [Microsoft guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

SignPath Foundation offers a potential free open-source signing route, but acceptance is not guaranteed or instant. Its conditions include open-source components, an already released/maintained/documented project, MFA, review/approval roles, verifiable builds and a published signing/privacy policy. The certificate identifies the Foundation. This project's third-party artwork/component situation must be disclosed and evaluated, not assumed eligible because the code uses Apache-2.0. No application, account, new credentials or third-party upload has been made. Do not claim their sponsorship or copy their required credit before acceptance. [Program](https://signpath.org/), [conditions](https://signpath.org/terms.html)

Latest owner decision: set signing aside and continue with a clearly labeled unsigned download. No signing application, purchase or extra signing setup is requested. This supersedes the earlier undecided question; it does not authorize bypassing final tests or automatically publishing. The eventual release workflow must deliberately support the approved unsigned route while retaining other release checks, accurate warnings and signature-status verification. No paid service has been purchased.

## Artwork

The owner prefers the accurate game artwork. It remains unchanged. The candidate inventory records sources and hashes, not permission. No new broad redistribution permission was established by the current check. PlayStation's website terms restrict redistribution of its site content; that is evidence about those site assets, not a legal determination for every screenshot or all third-party contributions. [Official website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/)

The existing permission-request draft remains unsent. Arrowhead's current contact page lists a general enquiry address; it does not promise licensing approval or cover Sony/crossover/community rights automatically. Sending a request still requires approval of the actual recipient and message. Do not invent an approval, remove notices, or silently replace the requested artwork. [Arrowhead contact](https://www.arrowheadgamestudios.com/contact/)

A disclaimer explains ownership/non-affiliation but does not itself establish a redistribution license. The artwork gate remains explicitly unresolved. This is a record of verified sources and outstanding decisions, not a legal opinion guaranteeing infringement or safety.

## Windows acceptance

The personal-PC backed-up upgrade is complete. The separately authorized hosted lifecycle now passed273 checks in run36637328640: fresh install, normal launches/graceful closes, actual uninstall, reinstall and exact synthetic-save preservation. The earlier close failure was the test missing first-run reminder acknowledgement; exact observed-dialog handling corrected it. See `HOSTED_INSTALLER_LIFECYCLE.md`. No repeat on the personal PC occurred. The Windows Server image has preinstalled tools, so manual consumer-Windows/audio/DPI/wizard/offline/all-users checks remain distinct.
