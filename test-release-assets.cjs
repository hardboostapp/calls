const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('./validar-release.cjs'),'utf8');
function validate(names,tag='bubble-v2.4.3'){const assets=names.map(name=>({name,size:100}));vm.runInNewContext(source,{process:{argv:['node','test',tag]},console:{log(){}},require:name=>name==='node:child_process'?{execFileSync:()=>JSON.stringify({assets})}:require(name)});}
const windows=['bubble-windows-2.4.3.exe','bubble-windows-2.4.3.exe.blockmap','latest.yml'];
test('Release Windows completa pode sair sem obrigar um APK novo',()=>assert.doesNotThrow(()=>validate(windows)));
test('Release Android pode sair de forma independente',()=>assert.doesNotThrow(()=>validate(['bubble-android-2.4.3.apk'])));
test('Novo pacote Android dos Cria pode ter release independente',()=>assert.doesNotThrow(()=>validate(['cria-android-v2-1.0.4.apk'],'cria-v1.0.4')));
test('Nome Android v2 não libera outro produto ou versão',()=>{assert.throws(()=>validate(['bubble-android-v2-2.4.3.apk']),/fora da lista/);assert.throws(()=>validate(['cria-android-v2-1.0.5.apk'],'cria-v1.0.4'),/fora da lista/);});
test('Ambas as plataformas continuam aceitas',()=>assert.doesNotThrow(()=>validate([...windows,'bubble-android-2.4.3.apk'])));
test('Instalador sem manifesto é recusado',()=>assert.throws(()=>validate(windows.filter(n=>n!=='latest.yml')),/obrigatório/));
test('Manifesto sem instalador e release vazia são recusados',()=>{assert.throws(()=>validate(['latest.yml']),/Nenhum instalador/);assert.throws(()=>validate([]),/Nenhum instalador/);});
test('Arquivos privados ou de outra versão continuam proibidos',()=>{assert.throws(()=>validate([...windows,'convite.bubble']),/fora da lista/);assert.throws(()=>validate([...windows,'bubble-android-2.4.2.apk']),/fora da lista/);});
