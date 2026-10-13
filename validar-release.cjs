const {execFileSync}=require('node:child_process');
const {version}=require('./release-policy.cjs');
const tag=process.argv[2];if(!/^(bubble|cria)-v/.test(tag||''))throw Error('Use tag bubble-vX.Y.Z ou cria-vX.Y.Z.');
const [product,v]=tag.split('-v');if(!version(v))throw Error('Versão inválida.');
const r=JSON.parse(execFileSync('gh',['release','view',tag,'--repo','hardboostapp/calls','--json','assets,isDraft,isPrerelease'],{encoding:'utf8'}));
const allowed=new Set([`${product}-windows-${v}.exe`,`${product}-windows-${v}.exe.blockmap`,`${product}-android-${v}.apk`,'latest.yml']);
for(const a of r.assets)if(!allowed.has(a.name))throw Error('Asset fora da lista pública permitida: '+a.name);
for(const name of [`${product}-windows-${v}.exe`,`${product}-android-${v}.apk`,'latest.yml'])if(!r.assets.some(a=>a.name===name&&a.size>0))throw Error('Arquivo obrigatório ausente: '+name);
console.log('Arquivos públicos e canais corretos para '+tag+'.');
