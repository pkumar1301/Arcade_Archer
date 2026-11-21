// Connect to an isolated Chrome debugging session. Start the local server first.
import fs from 'node:fs';
const tabs=await(await fetch(`http://127.0.0.1:${process.env.CDP_PORT||9332}/json`)).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const requests=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=requests.get(m.id);requests.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
function call(method,params={}){return new Promise((resolve,reject)=>{requests.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function ev(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw r.exceptionDetails;return r.result.value;}
await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:(process.env.GAME_URL||'http://127.0.0.1:8774/')+'?test=1'});
for(let i=0;i<120;i++){if(await ev('Boolean(window.gameTest)'))break;await new Promise(r=>setTimeout(r,500));}
console.log('LOADED',await ev('Boolean(window.gameTest)'));console.log('ERRORS',JSON.stringify(errors));
if(!await ev('Boolean(window.gameTest)')){ws.close();process.exit(1);}
for(const [width,height] of [[1280,720],[1366,768],[1100,700]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await ev("gameTest.menu();document.querySelector('.menu-main').scrollTop=10000");await new Promise(r=>setTimeout(r,200));
 console.log('MENU',width,height,await ev("JSON.stringify({qualityBottom:document.querySelector('#quality').getBoundingClientRect().bottom,actionTop:document.querySelector('.menu-actions').getBoundingClientRect().top,hint:document.querySelector('#menu').classList.contains('has-more')})"));
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/menu-v12-'+width+'.png',Buffer.from(shot.data,'base64'));
}
for(const key of ['easy','medium','hard']) {
 const r=await ev(`gameTest.rules('${key}')`);console.log('ACCEPTANCE',key,JSON.stringify(r));
 const expected={easy:[4,6,6,4],medium:[7,12,12,3],hard:[10,20,20,3]}[key];
 if(r.noRegen!==83 || r.capped!==100 || r.fullHealthWaste!==100 || r.sources.shot!==expected[0] || r.sources.collision!==expected[1] || r.sources.twoLeaks!==expected[2] || r.cappedEarned!==expected[3] || r.expired!==0 || !r.noWarmupWave || r.log.speed!==0)throw Error('Rules failed '+key);
 for(const remaining of [1,.4,.1])console.log('WARNING',key,remaining,JSON.stringify(await ev(`gameTest.warning('${key}',${remaining},10)`)));
}
await ev("gameTest.warning('medium',.4,0)");
const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/gameplay-v12-warnings.png',Buffer.from(shot.data,'base64'));
await ev("gameTest.menu();document.querySelector('.menu-main').scrollTop=0");await new Promise(r=>setTimeout(r,100));console.log('HINT TOP',await ev("document.querySelector('#menu').classList.contains('has-more')"));
for(const key of ['easy','medium','hard']) {
 const state=await ev(`gameTest.bot('${key}')`),fraction=state.distance/state.finish;
 console.log('BOT',key,JSON.stringify({health:state.health,distance:state.distance,time:state.elapsed,fraction}));
 if(key==='easy' ? state.health<=0 || fraction<1 : state.health>0 || fraction>(key==='medium'?.4:.1))throw Error('Bot target failed '+key);
}
if(errors.length)throw Error('Browser exceptions: '+JSON.stringify(errors));
console.log('ERRORS',JSON.stringify(errors));ws.close();

// The gameTest.bot(key) hook runs the documented non-aiming bot.
