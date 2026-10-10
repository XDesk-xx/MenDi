import fs from 'node:fs';
import { resolveAction } from '../../src/application/action-resolution.ts';
const [project,runRef,release]=process.argv.slice(2);
try {
  const result=resolveAction({project,runRef,role:'owner',actor:'fixture-owner',resolution:'handoff',toRole:'author',toActor:'receiver',reason:'真实子进程并发实验'}, {observeWrite:phase=>{
    if(phase!=='lock-acquired')return;
    process.send?.({ready:true});const deadline=Date.now()+15000;
    while(!fs.existsSync(release)) {if(Date.now()>deadline)throw new Error('release timed out');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}
  }});
  process.send?.({result});
} catch(error) {process.send?.({error:String(error)});process.exitCode=1;}
