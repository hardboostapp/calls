'use strict';
const REPO='hardboostapp/calls';
function version(v){const m=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(v||'');return m?m.slice(1).map(Number):null;}
function compare(a,b){const x=version(a),y=version(b);if(!x||!y)throw Error('Versão inválida');for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
function assetUrl(value,tag,name){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname==='github.com'&&decodeURIComponent(u.pathname)===`/${REPO}/releases/download/${tag}/${name}`&&!u.search&&!u.hash;}catch{return false;}}
function select(releases,product,current,platform='windows'){
 if(!['bubble','cria'].includes(product)||!version(current)||!['windows','android','android-v2'].includes(platform)||(platform==='android-v2'&&product!=='cria'))throw Error('Canal inválido');
 const candidates=[];
 for(const r of releases){if(!r||r.draft||r.prerelease||typeof r.tag_name!=='string')continue;const prefix=product+'-v';if(!r.tag_name.startsWith(prefix))continue;const v=r.tag_name.slice(prefix.length);if(!version(v)||compare(v,current)<=0)continue;
  const name=`${product}-${platform}-${v}.${platform==='windows'?'exe':'apk'}`;
  const binary=r.assets?.find(a=>a.name===name&&a.state==='uploaded'&&Number.isSafeInteger(a.size)&&a.size>0&&a.size<350*1024*1024&&assetUrl(a.browser_download_url,r.tag_name,name));
  if(!binary)continue;
  if(platform==='windows'&&!r.assets?.some(a=>a.name==='latest.yml'&&a.state==='uploaded'&&assetUrl(a.browser_download_url,r.tag_name,'latest.yml')))continue;
  if(platform!=='windows'&&!/^sha256:[a-f\d]{64}$/i.test(binary.digest||''))continue;
  candidates.push({version:v,tag:r.tag_name,name,url:binary.browser_download_url,size:binary.size,digest:binary.digest,notes:typeof r.body==='string'?r.body.slice(0,1800):'',feed:`https://github.com/${REPO}/releases/download/${r.tag_name}/`});
 }
 candidates.sort((a,b)=>compare(b.version,a.version));return candidates[0]||null;
}
module.exports={REPO,version,compare,assetUrl,select};
