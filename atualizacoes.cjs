'use strict';
const {ipcMain}=require('electron');
const {NsisUpdater}=require('electron-updater');
const {REPO,select}=require('./release-policy.cjs');
function criarAtualizacoes(app,window,product){
 let state={phase:'idle',current:app.getVersion()},candidate=null,updater=null,busy=false,lastCheck=0;
 const publish=(patch)=>{state={...state,...patch};if(!window.isDestroyed())window.webContents.send('atualizacao-estado',state);return state;};
 async function check(){
  if(busy||state.phase==='downloading'||state.phase==='ready')return state;busy=true;lastCheck=Date.now();publish({phase:'checking',error:''});
  try{
   let list=[];
   for(let page=1;page<=3;page++){
    const r=await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`,{headers:{Accept:'application/vnd.github+json','User-Agent':product+'-updater','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(12000)});
    if(r.status===403||r.status===429)throw Error('O GitHub limitou a consulta. Tente mais tarde.');if(!r.ok)throw Error('Não consegui consultar as versões. Tente novamente.');
    const text=await r.text();if(text.length>4*1024*1024)throw Error('Resposta de atualização inválida.');const items=JSON.parse(text);if(!Array.isArray(items))throw Error('Resposta de atualização inválida.');list.push(...items);if(items.length<100)break;
   }
   candidate=select(list,product,app.getVersion());
   return publish(candidate?{phase:'available',version:candidate.version,notes:candidate.notes}:{phase:'current',version:app.getVersion(),notes:''});
  }catch(e){return publish({phase:'error',error:e.message});}finally{busy=false;}
 }
 async function download(){
  if(busy||!candidate||!['available','error'].includes(state.phase))return state;busy=true;
  try{
   // Release-specific feed separates both products in the same repository.
   updater=new NsisUpdater({provider:'generic',url:candidate.feed});updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;
   updater.on('error',()=>{});
   updater.on('download-progress',p=>publish({phase:'downloading',progress:Math.round(p.percent)}));
   updater.on('update-downloaded',()=>publish({phase:'ready',progress:100}));
   publish({phase:'downloading',progress:0,error:''});
   const r=await updater.checkForUpdates();
   if(!r||r.updateInfo.version!==candidate.version)throw Error('Os arquivos publicados não correspondem à versão anunciada.');
   const f=r.updateInfo.files;
   if(!Array.isArray(f)||f.length!==1||f[0].url!==candidate.name||!f[0].sha512)throw Error('O pacote da atualização é inválido.');
   await updater.downloadUpdate();return state;
  }catch(e){updater=null;return publish({phase:'error',error:e.message});}finally{busy=false;}
 }
 function install(){if(state.phase!=='ready'||!updater)return state;app.saindoDeVerdade=true;updater.quitAndInstall(true,true);return state;}
 for(const [channel,handler] of [['atualizacao-estado',()=>state],['atualizacao-verificar',check],['atualizacao-baixar',download],['atualizacao-instalar',install]])ipcMain.handle(channel,(e)=>{if(e.sender!==window.webContents)throw Error('Janela inválida.');return handler();});
 // User asked for checks only when visiting the app, without game overlays.
 const visibleCheck=()=>{if(window.isVisible()&&window.isFocused()&&Date.now()-lastCheck>10*60*1000)check();};
 window.on('focus',visibleCheck);
 const first=setTimeout(visibleCheck,2500),timer=setInterval(visibleCheck,30*60*1000);first.unref();timer.unref();
 return {check,download,install,state:()=>state};
}
module.exports={criarAtualizacoes};
