// Descriptive local artifacts are separate from immutable public release names.
function localArtifactNames(label) {
  if (label === undefined) return null;
  if (typeof label !== 'string' || label !== label.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label) || label.length > 48) {
    throw new Error('Local build label must be 1-48 lowercase letters/digits with single hyphens between words.');
  }
  return {
    archive: `HD2-Chaos-Slot-Machine-local-${label}-win-\${arch}.\${ext}`,
    installer: `HD2-Chaos-Slot-Machine-Setup-local-${label}-win-\${arch}.\${ext}`,
  };
}
module.exports = { localArtifactNames };
