const fs = require('node:fs/promises');
const path = require('node:path');

const SCHEME = 'hd2-slot';
const HOST = 'app';
const ENTRY_URL = `${SCHEME}://${HOST}/index.html`;
const SCHEME_REGISTRATION = Object.freeze({ scheme: SCHEME,
  privileges: Object.freeze({ standard: true, secure: true, supportFetchAPI: true }) });
const SCRIPT_FILES = Object.freeze([
  'assets/image-fallbacks.js', 'assets/browser-storage-migration.js',
  'assets/planet-selection.js', 'assets/war-snapshot.js', 'assets/war-refresh.js', 'assets/war-planet-pool.js',
  'assets/galaxy-identities.js', 'assets/planet-activity.js', 'assets/planet-activity-service.js', 'assets/galaxy-map-model.js', 'assets/galaxy-atlas-service.js', 'assets/galaxy-map-view.js', 'assets/galaxy-map-session.js', 'assets/galaxy-app.js',
  'assets/catalog-state.js', 'assets/save-health.js', 'assets/armory-preferences.js', 'assets/transfer-validation.js',
  'assets/run-name-lexicon.js', 'assets/run-names.js',
  'assets/mission-selection.js', 'assets/mission-state.js',
  'assets/mission-context.js', 'assets/mission-ui.js', 'assets/planet-art.js', 'assets/card-planet.js', 'assets/card-planet.css',
  'assets/solo-score.js', 'assets/solo-score-ui.js', 'assets/card-entry.js', 'assets/card-entry.css',
  'assets/card-rules.js', 'assets/card-rules-ui.js', 'assets/card-rules.css',
  'assets/catalog-sources.js', 'assets/catalog-ui.js', 'assets/desktop-window.js',
  'assets/fan-notice.js', 'assets/fan-notice.css',
  'assets/origin-storage.js'
]);
const EXACT_FILES = new Set(['index.html', ...SCRIPT_FILES,
  'assets/desktop-window.css', 'assets/catalog-ui.css',
  'assets/galaxy-map-view.css', 'assets/galaxy-app.css', 'assets/galaxy-atlas-bundled.json',
  'assets/mission-ui.css', 'assets/mission-catalog.json', 'assets/planet-art.css', 'assets/solo-score.css',
  'assets/origin-bootstrap.html',
  'assets/item-catalog.json', 'assets/item-images.json',
  'cadet.png', 'veteran.png', 'helldive.png', 'youtube_logo.png.png', 'Helldivers-2-Logo.png.png']);
const MIME = Object.freeze({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon' });
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico']);

function resolveRequest(url, method = 'GET') {
  if (!['GET', 'HEAD'].includes(method)) return { status: 405 };
  if (typeof url !== 'string' || /[\\\x00-\x20\x7f]/.test(url)) return { status: 400 };
  // Inspect raw segments before URL parsing removes dot segments. Chromium may
  // already have normalized a request; the resource allowlist still applies.
  const raw = /^hd2-slot:\/\/app(\/[^?#]*)$/.exec(url);
  if (!raw) return { status: 403 };
  let decoded;
  try { decoded = decodeURIComponent(raw[1]); } catch { return { status: 400 }; }
  if (/[\\%:\x00-\x1f\x7f]/.test(decoded) || /%2f/i.test(raw[1])) return { status: 400 };
  const segments = decoded.slice(1).split('/');
  if (segments.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part))) return { status: 403 };
  const relative = segments.join('/');
  const extension = path.posix.extname(relative).toLowerCase();
  const image = relative.startsWith('assets/') && IMAGE_EXTENSIONS.has(extension);
  if (!EXACT_FILES.has(relative) && !image) return { status: 403 };
  return { status: 200, relative, contentType: MIME[extension] };
}

function createLocalHandler(appRoot) {
  const root = path.resolve(appRoot);
  return async request => {
    const route = resolveRequest(request.url, request.method);
    const headers = { 'Content-Type': route.contentType || 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'none'" };
    const fail = status => new Response(request.method === 'HEAD' ? null : 'Resource unavailable', { status, headers });
    if (route.status !== 200) return fail(route.status);
    try {
      const candidate = path.join(root, ...route.relative.split('/'));
      const [realRoot, realFile] = await Promise.all([fs.realpath(root), fs.realpath(candidate)]);
      const relative = path.relative(realRoot, realFile);
      if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return fail(403);
      // Do not serve linked files/directories even when they point within the app.
      let cursor = root;
      for (const segment of route.relative.split('/')) {
        cursor = path.join(cursor, segment);
        if ((await fs.lstat(cursor)).isSymbolicLink()) return fail(403);
      }
      if (!(await fs.stat(candidate)).isFile()) return fail(404);
      const bytes = request.method === 'HEAD' ? null : await fs.readFile(candidate);
      return new Response(bytes, { status: 200, headers });
    } catch { return fail(404); } // Never disclose filesystem paths or error details.
  };
}

module.exports = { SCHEME, HOST, ENTRY_URL, SCHEME_REGISTRATION, SCRIPT_FILES, resolveRequest, createLocalHandler };
