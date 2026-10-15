const {test}=require('node:test'),assert=require('node:assert/strict');
const {select,compare,REPO}=require('./release-policy.cjs');
function release(p,v,extra={}){const tag=p+'-v'+v;const asset=(name,size=100)=>({name,size,state:'uploaded',digest:'sha256:'+'a'.repeat(64),browser_download_url:`https://github.com/${REPO}/releases/download/${tag}/${name}`});return {tag_name:tag,draft:false,prerelease:false,assets:[asset(p+'-windows-'+v+'.exe'),asset('latest.yml'),asset(p+'-android-'+v+'.apk')],...extra};}
test('Dois produtos no mesmo repo mantêm versões independentes',()=>{const list=[release('cria','7.0.0'),release('bubble','2.4.0')];assert.equal(select(list,'bubble','2.3.0').version,'2.4.0');assert.equal(select(list,'cria','1.0.0').version,'7.0.0');});
test('Versão numérica e nenhuma troca por versão igual ou mais antiga',()=>{assert.equal(compare('2.10.0','2.9.0'),1);assert.equal(select([release('bubble','2.3.0'),release('bubble','2.4.0')],'bubble','2.4.0'),null);assert.equal(select([release('bubble','2.9.0'),release('bubble','2.10.0')],'bubble','2.4.0').version,'2.10.0');});
test('Ignora drafts e testes; APK exige digest SHA-256',()=>{assert.equal(select([release('bubble','9.0.0',{draft:true}),release('bubble','8.0.0',{prerelease:true})],'bubble','2.4.0'),null);const r=release('cria','1.1.0');assert.equal(select([r],'cria','1.0.0','android').version,'1.1.0');delete r.assets[2].digest;assert.equal(select([r],'cria','1.0.0','android'),null);});
test('Recusa arquivo, host ou caminho de outro canal',()=>{for(const bad of ['https://evil.invalid/a.exe','http://github.com/'+REPO+'/releases/download/bubble-v2.4.0/bubble-windows-2.4.0.exe','https://github.com/'+REPO+'/releases/download/cria-v1.0.0/bubble-windows-2.4.0.exe','https://user:pass@github.com/'+REPO+'/releases/download/bubble-v2.4.0/bubble-windows-2.4.0.exe']){const r=release('bubble','2.4.0');r.assets[0].browser_download_url=bad;assert.equal(select([r],'bubble','2.3.0'),null);}});
test('Sem metadata ou arquivo incompleto não anuncia instalação',()=>{const r=release('bubble','2.4.0');r.assets=r.assets.filter(a=>a.name!=='latest.yml');assert.equal(select([r],'bubble','2.3.0'),null);const a=release('cria','1.1.0');a.assets[0].state='new';assert.equal(select([a],'cria','1.0.0'),null);});

function androidV2(){const r=release('cria','1.0.4');r.assets=[r.assets[2]];r.assets[0].name='cria-android-v2-1.0.4.apk';r.assets[0].browser_download_url=`https://github.com/${REPO}/releases/download/cria-v1.0.4/cria-android-v2-1.0.4.apk`;return r;}
test('Cria Android v2, Android antigo e Windows selecionam pacotes distintos',()=>{
 const list=[androidV2(),release('cria','1.0.3'),release('bubble','2.4.3')];
 assert.equal(select(list,'cria','1.0.2','android-v2').version,'1.0.4');
 assert.equal(select(list,'cria','1.0.2','android').version,'1.0.3');
 assert.equal(select(list,'cria','1.0.2','windows').version,'1.0.3');
 assert.equal(select(list,'bubble','2.4.2','windows').version,'2.4.3');
 assert.equal(select(list,'cria','1.0.4','android-v2'),null);
});
test('Android v2 continua exigindo checksum e URL exata',()=>{
 let r=androidV2();delete r.assets[0].digest;assert.equal(select([r],'cria','1.0.3','android-v2'),null);
 r=androidV2();r.assets[0].browser_download_url=r.assets[0].browser_download_url.replace('cria-android-v2-','cria-android-');assert.equal(select([r],'cria','1.0.3','android-v2'),null);
});
test('Canal v2 exclusivo dos Cria e plataformas desconhecidas são recusados',()=>{assert.throws(()=>select([],'bubble','2.4.3','android-v2'),/Canal/);assert.throws(()=>select([],'cria','1.0.3','qualquer'),/Canal/);});
