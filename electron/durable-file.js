const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// Flush file contents before publishing a report. This reduces interrupted-write
// damage; it cannot guarantee survival of a Windows crash or power failure.
function writeDurable(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temporary, 'wx');
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(temporary, file);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function writeJson(file, value) {
  writeDurable(file, JSON.stringify(value, null, 2) + '\n');
}

module.exports = { writeDurable, writeJson };
