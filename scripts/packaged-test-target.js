const fs = require('node:fs');
const path = require('node:path');

// Never guess a runtime from dist/win-unpacked: an interrupted build can leave
// an old or damaged executable there. This is a basic preflight, not a substitute
// for the archive/source-parity checks required before packaged GUI testing.
function resolvePackagedTestTarget(args, cwd = process.cwd()) {
  const positional = args.filter(value => !value.startsWith('--'));
  if (positional.length !== 1 || !positional[0].trim()) {
    throw new Error('Provide exactly one explicit, integrity-verified packaged EXE path. No default app will be launched.');
  }
  const executable = path.resolve(cwd, positional[0]);
  if (path.extname(executable).toLowerCase() !== '.exe' || !fs.existsSync(executable) || !fs.statSync(executable).isFile()) {
    throw new Error(`Packaged target must be an existing EXE file: ${executable}`);
  }
  const descriptor = fs.openSync(executable, 'r');
  try {
    const header = Buffer.alloc(2);
    if (fs.readSync(descriptor, header, 0, 2, 0) !== 2 || header.toString('ascii') !== 'MZ') {
      throw new Error(`Packaged EXE has a damaged or missing MZ header; no app was launched: ${executable}`);
    }
  } finally { fs.closeSync(descriptor); }
  return executable;
}

module.exports = { resolvePackagedTestTarget };
