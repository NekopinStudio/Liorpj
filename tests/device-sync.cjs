const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let tests=0;
function fixture(){const s={stamp:'v1',loads:0,writes:0,pending:null,editor:false,delay:null};const ctx=vm.createContext({console,CloudSheet:{ready:true,loading:false,busy:false,dirty:false,error:null,rowId:'lior',updatedAt:'v1',generation:0},CLOUD_CHARACTER_ID:'lior',setInterval:()=>1,
 document:{hidden:false,activeElement:null,addEventListener:()=>{},getElementById:id=>id==='editorModal'?{classList:{contains:()=>!s.editor}}:null},window:{addEventListener:()=>{}},
 cloudRequest:async()=>{if(s.delay)await s.delay;return[{updated_at:s.stamp}]},cloudStatus:()=>{},cloudLoad:async()=>{s.loads++;ctx.CloudSheet.updatedAt=s.stamp;ctx.cloudApply({},[])},cloudApply:()=>{},cloudQueue:()=>s.writes++,cloudPending:x=>s.pending=x,cloudSnapshot:()=>({localChanges:true}),stRequireReady:()=>{}
 });vm.runInContext(fs.readFileSync(path.join(root,'character-combat.js'),'utf8').split('/* ===== device-sync ===== */')[1].split('/* ===== focused-combat ===== */')[0],ctx);return{s,ctx,run:code=>vm.runInContext(code,ctx)}}
async function test(name,fn){await fn();tests++;console.log('OK '+name)}
(async()=>{
await test('Una sesión limpia carga lo guardado desde otro dispositivo',async()=>{const f=fixture();f.s.stamp='v2';await f.run('deviceRefresh()');assert.equal(f.s.loads,1);assert.equal(f.ctx.CloudSheet.updatedAt,'v2');assert.equal(f.ctx.CloudSheet.remoteChanged,false)});
await test('Misma versión no vuelve a cargar ni escribe',async()=>{const f=fixture();await f.run('deviceRefresh()');assert.equal(f.s.loads,0);assert.equal(f.s.writes,0)});
await test('Cambios locales pendientes nunca se reemplazan por la sesión remota',async()=>{const f=fixture();f.s.stamp='v2';f.ctx.CloudSheet.dirty=true;await f.run('deviceRefresh()');assert.equal(f.s.loads,0);assert.equal(f.ctx.CloudSheet.error,'conflict')});
await test('Un editor abierto conserva su borrador y bloquea un guardado obsoleto',async()=>{const f=fixture();f.s.stamp='v2';f.s.editor=true;await f.run('deviceRefresh()');assert.equal(f.s.loads,0);assert.throws(()=>f.run('stRequireReady()'),/otro dispositivo/);f.s.editor=false;await f.run('deviceRefresh()');assert.equal(f.s.loads,1)});
await test('Una mutación antigua queda pendiente y no se manda a Supabase',async()=>{const f=fixture();f.ctx.CloudSheet.remoteChanged=true;f.run('cloudQueue()');assert.equal(f.s.writes,0);assert.ok(f.s.pending);assert.equal(f.ctx.CloudSheet.dirty,true)});
await test('Editar mientras la comprobación está en vuelo impide sobreescritura',async()=>{const f=fixture();let release;f.s.delay=new Promise(r=>release=r);f.s.stamp='v2';const p=f.run('deviceRefresh()');f.ctx.CloudSheet.dirty=true;release();await p;assert.equal(f.s.loads,0);assert.equal(f.ctx.CloudSheet.error,'conflict')});
await test('No se interrumpe un guardado que ya está en curso',async()=>{const f=fixture();f.ctx.CloudSheet.busy=true;f.s.stamp='v2';await f.run('deviceRefresh()');assert.equal(f.s.loads,0)});
console.log(`${tests} pruebas de sincronización aprobadas. Sin escrituras reales.`);
})().catch(e=>{console.error(e);process.exitCode=1});
