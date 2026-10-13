'use strict';
(async()=>{
 const api=window.bubble.atualizacoes;if(!api)return;
 const host=document.createElement('section');host.className='atualizacoes';host.setAttribute('aria-label','Atualizações');
 const line=document.createElement('p');line.setAttribute('role','status');line.textContent='Atualizações pelo GitHub';
 const action=document.createElement('button');action.className='botao';action.textContent='Verificar atualizações';
 const note=document.createElement('p');note.className='sob';
 host.append(line,action,note);(document.querySelector('.configuracoes')||document.querySelector('main')).appendChild(host);
 let state={phase:'idle'};const heard=new Set();
 function sound(v){if(heard.has(v)||!document.hasFocus()||document.visibilityState!=='visible')return;heard.add(v);try{const ctx=new AudioContext();const gain=ctx.createGain();gain.gain.value=.06;gain.connect(ctx.destination);[659,880,988].forEach((hz,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=hz;o.connect(gain);o.start(ctx.currentTime+i*.11);o.stop(ctx.currentTime+i*.11+.08);});setTimeout(()=>ctx.close(),700);}catch{}}
 function render(s){state=s;host.classList.toggle('nova-versao',['available','downloading','ready'].includes(s.phase));
  line.textContent=({idle:'Atualizações pelo GitHub',checking:'Verificando atualizações…',available:'Versão '+s.version+' disponível',downloading:'Baixando atualização · '+(s.progress||0)+'%',ready:'Atualização pronta para instalar',current:'Você está na versão mais recente · '+s.current,error:s.error})[s.phase]||'Atualizações';
  action.disabled=['checking','downloading'].includes(s.phase);action.textContent=s.phase==='available'?'Baixar atualização':s.phase==='ready'?'Reiniciar e atualizar':'Verificar atualizações';
  note.textContent=s.phase==='ready'?'Ao instalar, a chamada será encerrada e o aplicativo abrirá novamente. Sua sala e preferências ficam salvas.':s.phase==='available'?'Baixe quando quiser. A chamada continua durante o download.':'';
  if(s.phase==='available'){sound(s.version);let banner=document.getElementById('atualizacao-aviso');if(!banner){banner=document.createElement('button');banner.id='atualizacao-aviso';banner.className='botao atualizacao-aviso';banner.addEventListener('click',()=>{const panel=host.closest("#ajustes");panel?.classList.remove("oculto");document.getElementById("btn-ajustes")?.setAttribute("aria-expanded","true");host.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});});document.querySelector('.cabecalho')?.appendChild(banner);}banner.textContent='Atualizar · '+s.version;}
 }
 action.addEventListener('click',async()=>{action.disabled=true;try{render(await(state.phase==='available'?api.baixar():state.phase==='ready'?api.instalar():api.verificar()));}catch{render({phase:'error',error:'Não consegui atualizar. Tente novamente.'});}});
 api.observar(render);try{render(await api.estado());}catch{render({phase:'error',error:'Não consegui consultar as atualizações. Tente novamente.'});}
})();
