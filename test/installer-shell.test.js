'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'installer/shell-properties.nsh'), 'utf8');
const probe = fs.readFileSync(path.join(root, 'test/fixtures/installer-shell-probe.nsi'), 'utf8');
const runner = fs.readFileSync(path.join(root, 'scripts/test-installer-shell.ps1'), 'utf8');

test('prototype uses core Windows calls without WinShell or shell/registry deletion', () => {
  assert.doesNotMatch(source, /WinShell::|^\s*(?:Delete|RMDir|WriteReg\w*|DeleteReg\w*|Exec\w*)\s/im);
  for (const name of ['HD2_SetShortcutAppId', 'HD2_UnpinShortcut', 'HD2_ClearAppDestinations']) {
    assert.match(source, new RegExp('!macro ' + name + ' '));
  }
  assert.match(source, /IPersistFile::Load/);
  assert.match(source, /IPropertyStore::SetValue/);
  assert.match(source, /IPropertyStore::Commit/);
  assert.match(source, /IPersistFile::Save/);
});

test('setter captures register inputs and frees acquired native resources', () => {
  const setter = source.split('!macro HD2_SetShortcutAppId')[1].split('!macroend')[0];
  assert(setter.indexOf('Push "${appId}"') < setter.indexOf('Pop $7'));
  assert.match(setter, /\$9 > 128/);
  assert.match(setter, /\$9 > 1[\s\S]*?0x80004005/);
  for (const value of ['SysFreeString', 'System::Free $4', 'System::Free $3', 'ComHlpr_SafeRelease $2', 'ComHlpr_SafeRelease $1', 'ComHlpr_SafeRelease $0', 'CoUninitialize']) assert(setter.includes(value));
  assert.match(setter, /Push \$9\s+System::Store "L"\s+Pop \$\{result\}/);
});

test('fixture installer and uninstaller stay within compile-time fixture targets', () => {
  assert.match(probe, /RequestExecutionLevel user/);
  assert.match(probe, /Section "Uninstall"/);
  assert.doesNotMatch(probe, /\$(?:DESKTOP|SMPROGRAMS|APPDATA|LOCALAPPDATA)|^\s*(?:Delete|RMDir|WriteReg\w*|DeleteReg\w*|Exec\w*)\s/im);
  for (const line of probe.split('\n').filter(line => /^\s*(?:WriteINI|WriteUninstaller|OutFile)/.test(line))) assert(line.includes('${TEST_ROOT}'));
  for (const key of ['empty', 'missing', 'damaged', 'readonly', 'extension', 'longId', 'registerInput', 'replaceId']) assert(probe.includes('"' + key + '"'));
});

test('native runner records bounded results and cannot silently download or kill tools', () => {
  assert.match(runner, /org\.hd2chaosslotmachine\.fixture\./);
  assert.match(runner, /INPUTCHARSET','UTF8/);
  assert.match(runner, /WaitForExit\(30000\)/);
  assert.match(runner, /ProductionInstallerExecuted=\$false/);
  assert.match(runner, /UnpinObserved=\$false/);
  assert.doesNotMatch(runner, /Stop-Process|taskkill|Invoke-WebRequest|DownloadFile|ExecutionPolicy Bypass|Remove-Item/i);
});

test('production helper retains stock installer and signing with guarded preparation', () => {
  const config = require('../electron-builder.config');
  assert.equal(config.nsis.script, undefined);
  assert.equal(config.nsis.include, 'installer/integration.nsh');
  assert.equal(typeof config.beforePack, 'function');
  assert.match(require('../package.json').scripts['prebuild:win'], /prepare:installer-shell/);
  // Native helper probes are deliberately separate from ordinary npm test.
  assert.doesNotMatch(require('../package.json').scripts.test, /installer-shell/);
});
