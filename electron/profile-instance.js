// Call only after app.setPath('userData', profile.directory): Electron scopes
// its single-instance lock to that profile. A second launch must not write
// diagnostics, migrate data, or open another independently editable snapshot.
function acquireProfileInstance(app, BrowserWindow) {
  if (!app.requestSingleInstanceLock()) { app.quit(); return false; }
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows().find(candidate => !candidate.isDestroyed());
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.show(); window.focus();
  });
  return true;
}
module.exports = { acquireProfileInstance };
