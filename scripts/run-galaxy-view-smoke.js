'use strict';
const path=require('node:path'),fs=require('node:fs');
const {acquireDesktopTestLock,runElectronChild,writeJson}=require('./desktop-test-safety');
const root=path.resolve(__dirname,'..'),runRoot=path.join(root,'.test-data',`galaxy-view-${Date.now()}`);
if(process.argv.slice(2).some(a=>a!=='--live')||process.argv.length>3)throw Error('Optional --live enables two explicit community API requests.');
fs.mkdirSync(runRoot,{recursive:true});
const env={...process.env,HD2_ELECTRON_TEST_HARNESS:'1',HD2CSM_GALAXY_VIEW_ROOT:runRoot,HD2CSM_GALAXY_LIVE:process.argv.includes('--live')?'1':'0'};delete env.ELECTRON_RUN_AS_NODE;
(async()=>{const lock=acquireDesktopTestLock(runRoot);try{
  await runElectronChild({executable:require('electron'),args:[path.join(__dirname,'electron-galaxy-view-smoke.js'),'--disable-gpu'],cwd:root,env,evidence:runRoot,lock,timeoutMs:60000});
  const report=JSON.parse(fs.readFileSync(path.join(runRoot,'report.json'),'utf8'));
  if(!report.passed||!fs.existsSync(path.join(runRoot,'graceful-exit.json')))throw Error(report.error||'Missing pass/graceful exit evidence');
  console.log(`PASS ${report.checks.length} map-view checks. Evidence: ${runRoot}`);
}finally{lock.release();}})().catch(error=>{writeJson(path.join(runRoot,'failure.json'),{error:error.stack});console.error(error);process.exitCode=1;});
