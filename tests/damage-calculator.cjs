const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const dir = path.resolve(__dirname, '..');
const engine = require(path.join(dir, 'damage-engine.js'));
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('OK ' + name); }
function near(a,b) { assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`); }
const a = {dice:'1d10', flat:9, bonus:9, count:1, thirst:true, smite:'4d8', level:6, prof:3};
const o = {ac:16, thirst:true, hex:true, curse:true};
test('Referencia: promedio 42, rango 28–56, DPR 31.2', () => {
  const r=engine.calculate(a,o); near(r.mean,42); near(r.min,28); near(r.max,56); near(r.dpr,31.2); near(r.hit,.7); near(r.critical,.1);
});
test('Ventaja enumera 400 resultados: 91% impacto, 19% crítico',()=>{const r=engine.calculate(a,{...o,advantage:true});near(r.hit,.91);near(r.critical,.19);near(r.dpr,41.64)});
test('Mortaja y Castigo una vez/turno; Castigo dobla dados en crítico',()=>{const r=engine.calculate(a,{...o,shroud:true,smite:true});near(r.mean,66);near(r.dpr,55.38);near(r.criticalMax,158)});
test('CA imposible: solo crítico natural; CA baja: 1 natural falla',()=>{near(engine.probabilities(0,100,false).hit,.05);near(engine.probabilities(100,1,false).hit,.95);near(engine.probabilities(0,100,true,19).hit,.19)});
test('Sin Filo Sediento solo un ataque; bonos fijos no duplicados',()=>{const r=engine.calculate({...a,thirst:false},{...o});assert.equal(r.count,1);near(r.criticalMax,44)});
test('Daño negativo se limita a cero antes de promediar',()=>{near(engine.damage('1d4',-3).mean,.25);assert.equal(engine.dice('1d6;alert(1)'),null)});
test('De carga limita Filo Sediento sin una excepción',()=>{assert.equal(engine.calculate({...a,loadingLimited:true},o).count,1)});
test('El desglose suma el daño medio aun con modificadores negativos',()=>{const r=engine.calculate({...a,dice:'1d4',flat:-5},{...o});near(r.parts.reduce((n,p)=>n+p.mean,0),r.mean)});
const noop=()=>{};
const storage=new Map();
const context=vm.createContext({console, LiorDamage:engine, structuredClone, URL, Blob, crypto:require('node:crypto').webcrypto,
  window:{addEventListener:noop,innerWidth:1200},document:{addEventListener:noop,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  setTimeout:noop,clearTimeout:noop,queueMicrotask:noop,confirm:()=>true,alert:noop,
  fetch:()=>{throw Error('Prohibido acceder a red durante la prueba')}
});
vm.runInContext(fs.readFileSync(path.join(dir,'app.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(dir,'damage-calculator.js'),'utf8'),context);
function run(code){return vm.runInContext(code,context)}
run(`character={...character,level:6,cha:20,class_name:'Brujo (Filo Maléfico)',spell_slots_used:0,ammo_pistol:8,combat_state:{class_levels:{Brujo:6},invocations_known:['thirsting_blade','eldritch_smite','agonizing_blast'],battle:{attacksMade:0,smiteUsed:false,shroudDamageUsed:false,summonedWeaponId:'pistol'}}};
 inventory=[{id:'pistol',name:'Pistola del Pacto',category:'arma',is_pact_weapon:true,damage_dice:'1d10',magic_bonus:1},{id:'sword',name:'Espada',category:'arma',is_equipped:true,is_carried:true,quantity:1,damage_dice:'1d8'}];
 spells=[{id:'blast',name:'Descarga Sobrenatural',is_known:true,level:0,damage_dice:'1d10',casting_time:'Acción'},{id:'hex',name:'Maleficio',is_known:true,level:1},{id:'save',name:'Salvación',is_known:true,level:1,damage_dice:'3d6',description:'Salvación de Sabiduría'}];
 renderAll=()=>{};renderBattle=()=>{};renderBattleComposer=()=>{};bRenderImpact=()=>{};toast=()=>{};`);
test('Adaptador: arma invocada, física y truco conocido; excluye salvación',()=>{assert.equal(run('dcAttacks().length'),3);assert.equal(run('dcAttacks().find(a=>a.sourceId==="blast").count'),2)});
test('Nivel total escala rayos y competencia; nivel brujo limita Castigo',()=>{run('character.level=11;character.combat_state.class_levels.Brujo=3');assert.equal(run('dcAttacks().find(a=>a.sourceId==="blast").count'),3);assert.equal(run('dcAttacks()[0].prof'),4);assert.equal(run('dcAttacks()[0].smite'),null);run('character.level=6;character.combat_state.class_levels.Brujo=6')});
test('Sin armas permanece Descarga Sobrenatural',()=>{run('inventory[1].is_equipped=false;character.combat_state.battle.summonedWeaponId=null');assert.equal(run('dcAttacks().length'),1);run('inventory[1].is_equipped=true;character.combat_state.battle.summonedWeaponId="pistol"')});
test('Simular repetidamente no muta estado ni guarda recursos',()=>{const before=run('JSON.stringify({character,inventory,spells,logs})');run('for(let i=0;i<30;i++){LiorDamage.calculate(dcAttacks()[0],{ac:i+1,advantage:true,hex:true,curse:true,thirst:true,shroud:true,smite:true});dcSet("ac",i+1)}');assert.equal(run('JSON.stringify({character,inventory,spells,logs})'),before);assert.equal(storage.size,0)});
(async()=>{
  run(`bLog=async function(t){logs.unshift({log_text:t});persist()};Battle.selection={type:'weapon',id:'pistol'};Battle.options={hex:true,curse:false};`);
  await run('bExecuteWeapon()');
  test('Acción real consume una munición, un espacio y acción adicional',()=>{assert.equal(run('character.ammo_pistol'),7);assert.equal(run('character.spell_slots_used'),1);assert.equal(run('character.combat_state.battle.attacksMade'),1);assert.equal(run('character.combat_state.bonus_action_used'),true);assert.ok(run('character.combat_state.concentration_spell.includes("Maleficio")'));assert.ok(storage.size>0)});
  await run('bExecuteWeapon()');
  test('Doble clic con impacto pendiente no vuelve a gastar',()=>{assert.equal(run('character.ammo_pistol'),7)});
  run('bImpact(true)'); await run('bHitEffect("smite")');await run('bHitEffect("smite")');
  test('Castigo real consume un espacio tras impacto una sola vez',()=>{assert.equal(run('character.spell_slots_used'),2);assert.equal(run('character.combat_state.battle.smiteUsed'),true)});
  test('Payload central incluye gastos, concentración e inventario',()=>{run('CloudSheet.columns=Object.keys(character);CloudSheet.relatedIDs=["pistol"]');const payload=JSON.parse(run('JSON.stringify(cloudPayload(cloudSnapshot()))'));assert.equal(payload.ammo_pistol,7);assert.equal(payload.spell_slots_used,2);assert.equal(payload.combat_state.battle.smiteUsed,true);assert.equal(payload.combat_state._sheet_v4.inventory.length,2)});
  let requests=[];context.fetch=async(url,options)=>{requests.push({url,options});return{ok:true,text:async()=>JSON.stringify([{updated_at:'new-version'}])}};
  run('CloudSheet.ready=true;CloudSheet.loading=false;CloudSheet.dirty=true;CloudSheet.rowId="test-row";CloudSheet.updatedAt="old-version"');await run('cloudFlush()');
  test('Guardado Supabase simulado: PATCH con versión, sin escritores paralelos',()=>{assert.equal(requests.length,1);assert.equal(requests[0].options.method,'PATCH');assert.ok(requests[0].url.includes('updated_at=eq.old-version'));assert.equal(JSON.parse(requests[0].options.body).spell_slots_used,2);assert.equal(run('CloudSheet.dirty'),false)});
  console.log(`${checks} pruebas correctas. Sin escrituras reales en Supabase.`);
})().catch(e=>{console.error(e);process.exitCode=1});
