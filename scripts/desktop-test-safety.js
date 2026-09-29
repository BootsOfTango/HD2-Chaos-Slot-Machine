const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { writeJson, writeDurable } = require('../electron/durable-file');

const LOCK_PATH = path.join(os.tmpdir(), 'hd2csm-desktop-tests.lock');
function processAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== 'ESRCH'; }
}

// Shared across runners AND checkouts. Unknown/partial locks fail closed. An
// orphaned child keeps the lock even if its parent runner has already stopped.
function acquireDesktopTestLock(evidence, { lockPath = LOCK_PATH, alive = processAlive } = {}) {
  let fd;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { fd = fs.openSync(lockPath, 'wx'); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let previous;
      try { previous = JSON.parse(fs.readFileSync(lockPath, 'utf8')); }
      catch { throw new Error(`Desktop-test lock is unreadable; refusing another GUI run: ${lockPath}`); }
      if (!previous.token || !Number.isSafeInteger(previous.ownerPid) || previous.ownerPid <= 0 || previous.manualReview || previous.launchPending || alive(previous.ownerPid) ||
          (previous.childPid && alive(previous.childPid))) {
        throw new Error(`Another desktop test may still be active. No GUI was launched. Inspect ${lockPath}`);
      }
      // Exclusively claim stale recovery, then recheck bytes before removing it.
      const recovery = `${lockPath}.recovery`;
      const recoveryFd = fs.openSync(recovery, 'wx');
      try {
        if (JSON.parse(fs.readFileSync(lockPath, 'utf8')).token === previous.token) fs.unlinkSync(lockPath);
      } finally { fs.closeSync(recoveryFd); fs.unlinkSync(recovery); }
    }
  }
  if (fd === undefined) throw new Error('Could not acquire desktop-test lock.');
  const state = { token: randomUUID(), ownerPid: process.pid, childPid: null, evidence, startedAt: new Date().toISOString() };
  try { fs.writeFileSync(fd, JSON.stringify(state)); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  function ownsLock() {
    try { return JSON.parse(fs.readFileSync(lockPath, 'utf8')).token === state.token; } catch { return false; }
  }
  return {
    path: lockPath,
    prepareLaunch() {
      if (!ownsLock() || state.manualReview || state.launchPending || (state.childPid && alive(state.childPid))) {
        throw new Error('Cannot launch another desktop child until the previous one has ended.');
      }
      // Persist BEFORE spawn so a runner crash in the spawn/track gap fails closed.
      state.launchPending = true;
      state.childPid = null;
      writeJson(lockPath, state);
    },
    retain(reason) {
      state.manualReview = reason;
      if (ownsLock()) writeJson(lockPath, state);
    },
    track(child) {
      if (!ownsLock()) throw new Error('Lost desktop-test lock; stop this run.');
      state.childPid = child.pid;
      state.launchPending = false;
      writeJson(lockPath, state);
    },
    release() {
      if (state.manualReview || state.launchPending) return false;
      if (state.childPid && alive(state.childPid)) return false;
      if (ownsLock()) fs.unlinkSync(lockPath);
      return true;
    }
  };
}

function observeExit(child) {
  // Attach immediately after spawn; waiting later must not miss an early exit.
  const finished = new Promise(resolve => {
    child.once('error', error => resolve({ error: error.message, code: null, signal: null }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  return { finished, async wait(timeoutMs = 30000) {
    let timer;
    try {
      return await Promise.race([finished, new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Desktop process ${child.pid} did not exit within ${timeoutMs}ms. It was NOT force-killed; stop subsequent GUI tests.`)), timeoutMs);
      })]);
    } finally { clearTimeout(timer); }
  } };
}

async function runElectronChild({ executable, args, env, cwd, evidence, lock, timeoutMs = 180000 }) {
  lock.prepareLaunch();
  const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const exit = observeExit(child);
  lock.track(child);
  child.stdin.on('error', () => {}); // An exiting child may already have closed stdin.
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
    output += chunk.toString(); process.stdout.write(chunk);
  });
  try {
    let result;
    try { result = await exit.wait(timeoutMs); }
    catch (timeout) {
      // The isolated harness listens for this one narrow, graceful request.
      child.stdin.write('HD2CSM_QUIT\n');
      try { result = await exit.wait(30000); }
      catch (error) { lock.retain(error.message); throw error; }
      throw timeout;
    }
    if (result.error || result.code !== 0) throw new Error(result.error || `Desktop child exited with ${result.code}/${result.signal}`);
    return result;
  } finally {
    writeDurable(path.join(evidence, 'process.log'), output);
    if (child.exitCode === null && child.signalCode === null) {
      child.unref(); child.stdout.destroy(); child.stderr.destroy(); child.stdin.destroy();
    }
  }
}

function installHarnessQuit(app) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    input += chunk;
    if (input.includes('HD2CSM_QUIT\n')) app.quit();
    input = input.slice(-100);
  });
  process.stdin.resume();
}

module.exports = { LOCK_PATH, acquireDesktopTestLock, observeExit, runElectronChild, installHarnessQuit, writeJson, writeDurable };
