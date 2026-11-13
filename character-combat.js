/* Shared rules for new resources, arbitrary spells, and granted equipment. */
function stSpellReference(sp){return sp.srd||LiorCatalog.spells.find(r=>r.index===sp.catalog_index||r.name.toLowerCase()===sp.name.toLowerCase()||sp.name.toLowerCase().includes('('+r.name.toLowerCase()+')'))}
function stSpellMechanics(sp){
 const old=sp.mechanics||{},name=sp.name||'',known=/descarga sobrenatural|eldritch blast|toque helado|chill touch|infligir heridas|inflict wounds/i.test(name);
 const ref=stSpellReference(sp);
 const text=sp.description||'',forcedSave=/\bTS\s+(?:de\s+)?(?:Fue|Des|Con|Int|Sab|Car)|(?:objetivo|criatura|enemigo)[^.]{0,120}(?:superar|realizar|tirada de salvaci[oó]n)/i.test(text);
 const save=ref?.dc?.dc_type?.index||(/sabidur[ií]a|\bTS\s+Sab\b/i.test(text)?'wis':/destreza|\bTS\s+Des\b/i.test(text)?'dex':/constituci[oó]n|\bTS\s+Con\b/i.test(text)?'con':/fuerza|\bTS\s+Fue\b/i.test(text)?'str':/inteligencia|\bTS\s+Int\b/i.test(text)?'int':/carisma|\bTS\s+Car\b/i.test(text)?'cha':undefined);
 return{ability:'cha',action:/adicional|bonus/i.test(sp.casting_time||'')?'bonus':/reacci/i.test(sp.casting_time||'')?'reaction':'action',kind:ref?.attack_type||known?'attack':ref?.dc||forcedSave?'save':ref?.heal_at_slot_level?'heal':'reference',save,pool:'auto',...old};
}
function stSpellOptions(sp){const options=LiorCharacter.resourceOptions(character,sp);if(character.combat_state.feats?.includes('fey_touched')&&/paso brumoso|infligir heridas/i.test(sp.name)&&!bCS().battle.freeSpells?.[sp.id])options.push({id:'fey',label:'Uso gratuito concedido en la ficha',level:Number(sp.level)});return options}
bSpellCost=function(sp){return stSpellOptions(sp).map(x=>x.label).join(' / ')||'Sin recursos disponibles'};
function stSpellFormula(sp,castLevel=Number(sp.level)){
 const m=stSpellMechanics(sp),tier=character.level<5?1:character.level<11?2:character.level<17?3:4;
 let expression=sp.damage_dice||'',count=Math.max(1,Number(m.count||1)),flat=Number(m.flat||0)+(m.addAbility?getMod(character[m.ability]):0);
 const blast=/descarga sobrenatural|eldritch blast/i.test(sp.name),chill=/toque helado|chill touch/i.test(sp.name),wounds=/infligir heridas|inflict wounds/i.test(sp.name);
 if(blast&&m.scaling!=='fixed'){expression='1d10';count=m.count>0?Number(m.count):tier;if(character.combat_state.invocations_known?.includes('agonizing_blast'))flat+=getMod(character.cha)}
 else if(chill&&m.scaling!=='fixed')expression=tier+'d8';else if(wounds&&m.scaling!=='fixed')expression=(2+castLevel)+'d10';
 else if(m.scaling!=='fixed'&&stSpellReference(sp)){const ref=stSpellReference(sp),damage=ref.damage?.[0];if(m.kind==='heal')expression=ref.heal_at_slot_level?.[castLevel]||expression;else{const scale=damage?.damage_at_character_level,threshold=scale?Math.max(...Object.keys(scale).map(Number).filter(n=>n<=character.level)):0;expression=damage?.damage_at_slot_level?.[castLevel]||scale?.[threshold]||expression}if(ref.index==='scorching-ray'&&sp.mechanics?.count===undefined)count=castLevel+1;}
 return{dice:expression,count,flat,bonus:LiorCharacter.prof(character.level)+getMod(character[m.ability])+Number(m.attackBonus||0)+stModifiers().attack,save:8+LiorCharacter.prof(character.level)+getMod(character[m.ability])+Number(m.attackBonus||0),kind:m.kind};
}
function stWeaponAttack(w){
 const m=w.mechanics||{},p=LiorCharacter.prof(character.level),mods=stModifiers();
 let ability=m.ability;if(!ability||ability==='auto')ability=w.is_pact_weapon||w.use_cha?'cha':/sutil|finesse/i.test(w.properties||'')?(getMod(character.dex)>getMod(character.str)?'dex':'str'):/pistol|musket/.test(bKind(w))||/arco|ballesta|honda|bow/i.test(w.name)?'dex':'str';
 const attr=getMod(character[ability]),magic=Number(w.magic_bonus)||0;
 return{ability,bonus:attr+magic+(m.proficient===false?0:p)+Number(m.attackBonus||0)+mods.attack,
 flat:attr+magic+Number(m.flat||0)+mods.damage+(w.is_pact_weapon&&(LiorCharacter.levels(character).Brujo||0)>=12&&character.combat_state.invocations_known?.includes('lifedrinker')?Math.max(1,getMod(character.cha)):0),
 dice:w.damage_dice,count:LiorCharacter.extraAttacks(character,w.is_pact_weapon),loadingLimited:/de carga|loading/i.test(w.properties||'')&&!w.ignore_loading&&!(/pistol|musket/.test(bKind(w))&&character.combat_state.feats?.includes('gunner'))&&!(/ballesta|crossbow/i.test(w.name)&&character.combat_state.feats?.includes('crossbow_expert'))};
}
const stPreviousAC=calculateDynamicAC;calculateDynamicAC=function(){const result=stPreviousAC(),bonus=stModifiers().ac;return{...result,total:result.total+bonus,breakdown:result.breakdown+(bonus?' · Concesiones activas '+sign(bonus):'')}};
const stPreviousDC=dcAttacks;dcAttacks=function(){
 const attacks=stPreviousDC().filter(a=>a.type!=='spell');
 for(const a of attacks){const w=inventory.find(w=>w.id===a.sourceId),s=stWeaponAttack(w);Object.assign(a,{bonus:s.bonus,flat:s.flat,dice:s.dice,count:s.count,loadingLimited:s.loadingLimited});if(a.loadingLimited)a.count=1;}
 for(const sp of spells.filter(s=>s.is_known)){
  if(stSpellMechanics(sp).kind!=='attack')continue;
 const options=stSpellOptions(sp),selected=options.find(o=>o.id===Studio.castResource[sp.id])||options[0];
  const f=stSpellFormula(sp,selected?.level||Number(sp.mechanics?.castLevel)||Number(sp.level));if(!LiorDamage.dice(f.dice))continue;
  attacks.push({id:'spell:'+sp.id,sourceId:sp.id,type:'spell',name:sp.name,bonus:f.bonus,dice:f.dice,flat:f.flat+stModifiers().damage,count:f.count,thirst:false,smite:null,level:Number(character.level),prof:LiorCharacter.prof(character.level),slot:selected?.level||0});
 }return attacks;
};
// Extra Attack is derived from all classes. It never stacks with Thirsting Blade.
bAvailableAttack=function(w){const c=bCS(),n=w?stWeaponAttack(w):{count:1};return(!c.action_used||c.battle.attacksMade>0)&&c.battle.attacksMade<(n.loadingLimited?1:n.count)};
function stAmmo(w){return w.mechanics?.ammo??(bKind(w)==='pistol'?'ammo_pistol':bKind(w)==='musket'?'ammo_musket':'')}
function stApplyPreAttack(c,options){
 if(options.hex&&options.curse)throw Error('Maleficio y Maldición requieren la misma acción adicional.');
 if((options.hex||options.curse)&&c.combat_state.bonus_action_used)throw Error('Acción adicional gastada.');
 const cs=c.combat_state;
 if(options.curse){if(cs.battle.curseUsed)throw Error('Maldición agotada.');cs.hexblade_curse=true;cs.battle.curseUsed=true;cs.bonus_action_used=true}
 if(options.hex){
  const hex=spells.find(s=>s.is_known&&/maleficio|^hex\b/i.test(s.name));if(!hex)throw Error('Maleficio no conocido.');
  if(cs.battle.leveledActionSpell||cs.battle.reactionSpell)throw Error('Ya lanzaste un conjuro incompatible con Maleficio como acción adicional este turno.');
  const option=LiorCharacter.resourceOptions(c,hex)[0];if(!option)throw Error('No hay recurso para Maleficio.');
  const paid=LiorCharacter.spend(c,hex,option.id);c=paid.character;
  // A customized Hex with its own uses is updated only when the entire action commits.
  c.combat_state.battle.hexSpellUpdate=paid.spell;c.combat_state.concentration_spell=hex.name;c.combat_state.bonus_action_used=true;c.combat_state.battle.bonusSpell=true;
 }return c;
}
function stCommitCharacter(next){const updated=next.combat_state.battle?.hexSpellUpdate;if(updated){spells=spells.map(s=>s.id===updated.id?updated:s);delete next.combat_state.battle.hexSpellUpdate}character=next}

bExecuteWeapon=async function(){
 try{
  stRequireReady();if(Battle.pending||Battle.selection?.type!=='weapon')return;const w=inventory.find(w=>w.id===Battle.selection.id);if(!w)return;
  if(bCS().battle.outOfTurn)throw Error('Fuera de tu turno: comienza un nuevo turno para usar la acción de Atacar.');
  const available=w.is_pact_weapon?w.id===bCS().battle.summonedWeaponId:w.is_carried&&w.is_equipped&&Number(w.quantity??1)>0;
  if(!available)throw Error('El arma ya no está equipada o invocada.');if(!bAvailableAttack(w))throw Error('No quedan ataques para esta acción.');
  const ammo=stAmmo(w);if(ammo&&Number(ammo==='quantity'?w.quantity:character[ammo])<=0)throw Error('No queda munición.');
  if(Battle.options.hex&&bCS().concentration_spell&&!confirm('Maleficio reemplazará tu concentración. ¿Continuar?'))return;
  const values=stWeaponAttack(w);if(!LiorDamage.dice(values.dice))throw Error('Configura los dados de esta arma.');
  const next=stApplyPreAttack(LiorCharacter.clone(character),Battle.options),cs=next.combat_state,prof=LiorCharacter.prof(next.level);
  if(ammo&&ammo!=='quantity')next[ammo]=Number(next[ammo])-1;cs.action_used=true;cs.battle.attacksMade++;
  if(w.is_pact_weapon)next.active_pact_weapon_id=w.id;
  let formula=values.dice+sign(values.flat+(ctEffect('curse',cs)?prof:0));if(ctEffect('hex',cs))formula+='+1d6';
  Battle.pending={name:w.name,weaponId:w.id,pact:Boolean(w.is_pact_weapon),formula,count:1};Battle.options={hex:false,curse:false};
  stCommitCharacter(next);if(ammo==='quantity')w.quantity--;await bLog('Ataque con '+w.name+': '+formula+'.');
 }catch(e){toast(e.message)}
};

const stPreviousComposer=renderBattleComposer;
renderBattleComposer=function(){
 stPreviousComposer();
 if(Battle.pending){const body=document.querySelector('#battleComposer .compose-body');if(body){body.insertAdjacentHTML('beforeend',`<p class="battle-note">${Number(Battle.pending.count||1)>1?'Quedan '+Number(Battle.pending.count)+' impactos por resolver. ':''}Cada impacto se confirma por separado.</p><button class="quiet-btn" id="stCritical">Impacto crítico</button>`);document.getElementById('stCritical').onclick=()=>{Battle.pending.critical=true;Battle.pending.formula=Battle.pending.formula.replace(/(\d*)d(\d+)/gi,(_,n,d)=>(Number(n||1)*2)+'d'+d);bImpact(true)}}return}
 if(Battle.selection?.type==='weapon'){
  const w=inventory.find(w=>w.id===Battle.selection.id);if(w){const value=stWeaponAttack(w),el=document.querySelector('#battleComposer .combat-values');if(el)el.innerHTML=`<span>Impacto ${sign(value.bonus)}</span><span>${esc(value.dice)} ${sign(value.flat)}</span>`;const button=document.querySelector('#battleComposer .action-commit');if(button)button.disabled=!bAvailableAttack(w)}return;
 }
 if(Battle.selection?.type!=='spell')return;
 const sp=spells.find(s=>s.id===Battle.selection.id);if(!sp)return;const body=document.querySelector('#battleComposer .compose-body');if(!body)return;
 const options=stSpellOptions(sp),chosen=options.find(o=>o.id===Studio.castResource[sp.id])||options[0],m=stSpellMechanics(sp),f=stSpellFormula(sp,chosen?.level||Number(sp.level));
 body.querySelectorAll('.action-commit,.battle-radio').forEach(n=>n.remove());
 body.insertAdjacentHTML('afterbegin',`<div class="studio-cast"><strong>${m.ability.toUpperCase()} · Ataque ${sign(f.bonus)} · CD ${f.save}</strong><p>${f.kind==='save'?'Salvación '+(m.save||sp.srd?.dc?.dc_type?.index||'del objetivo').toUpperCase()+' · se resuelve en mesa':f.kind==='attack'?f.count+' tirada(s) de ataque':'Efecto: '+esc(f.kind)}</p><label>Recurso para lanzar<select id="stCastResource">${options.map(o=>stOption(o.id,o.label,chosen?.id)).join('')||'<option>Sin recursos disponibles</option>'}</select></label><p>${esc(f.dice)} ${sign(f.flat)} ${f.count>1?'por impacto':''}</p>${sp.mechanics?.source?'<small>'+esc(sp.mechanics.source)+'</small>':''}</div>`);
 const actionKey={action:'action_used',bonus:'bonus_action_used',reaction:'reaction_used'}[m.action];
 body.insertAdjacentHTML('beforeend',`<button class="action-commit" id="stCommitSpell" ${!chosen||actionKey&&bCS()[actionKey]?'disabled':''}>${!chosen?'Sin recursos disponibles':actionKey&&bCS()[actionKey]?'Acción necesaria gastada':'Lanzar y registrar gasto'}</button><button class="quiet-btn" id="stEditSpell">Editar reglas de este conjuro</button>`);
 document.getElementById('stCastResource').onchange=e=>{Studio.castResource[sp.id]=e.target.value;renderBattleComposer();renderDamageCalculator()};document.getElementById('stCommitSpell').onclick=bExecuteSpell;document.getElementById('stEditSpell').onclick=()=>openSpellModal(sp.id);
};

bExecuteSpell=async function(){
 try{
  stRequireReady();if(Battle.pending||Battle.selection?.type!=='spell')return;
  const sp=spells.find(s=>s.id===Battle.selection.id);if(!sp?.is_known)throw Error('El conjuro no está conocido o concedido.');const m=stSpellMechanics(sp),cs=bCS();
  if(cs.battle.outOfTurn&&(m.action!=='reaction'||Battle.options.hex||Battle.options.curse))throw Error('Fuera de tu turno solo se permiten conjuros de reacción.');
  const actionKey={action:'action_used',bonus:'bonus_action_used',reaction:'reaction_used'}[m.action];if(actionKey&&cs[actionKey])throw Error('Acción necesaria gastada.');
  const bonusCasting=m.action==='bonus'||Battle.options.hex;
  if(!cs.battle.outOfTurn&&cs.battle.bonusSpell&&(Number(sp.level)>0||m.action!=='action'))throw Error('Tras un conjuro de acción adicional solo puedes lanzar un truco de una acción este turno.');
  if(bonusCasting&&(cs.battle.leveledActionSpell||cs.battle.reactionSpell||Battle.options.hex&&(Number(sp.level)>0||m.action!=='action')))throw Error('La combinación de conjuros no cumple la regla de acción adicional de 2014.');
  if(m.action==='bonus'&&(Battle.options.hex||Battle.options.curse))throw Error('Ambas opciones requieren la acción adicional.');
  if(sp.concentration&&cs.concentration_spell&&!confirm('Este conjuro reemplazará tu concentración actual. ¿Continuar?'))return;
  if(Battle.options.hex&&cs.concentration_spell&&!confirm('Maleficio reemplazará tu concentración actual. ¿Continuar?'))return;
  const options=stSpellOptions(sp),selected=options.find(o=>o.id===Studio.castResource[sp.id])||options[0];if(!selected)throw Error('Sin recursos para lanzar.');
  // Preserve the sheet's explicit Fey Touched grants, without making other spells free.
  const freeEligible=selected.id==='fey';
  let applied=null;if(['heal','temp'].includes(m.kind)){const raw=prompt('Resuelve la curación y escribe el total. Cancelar no consume recursos.');if(raw===null)return;applied=Number(raw);if(!Number.isInteger(applied)||applied<0)throw Error('Resultado de curación inválido.');}
  let paid=freeEligible?{character:LiorCharacter.clone(character),spell:LiorCharacter.clone(sp),option:{level:Number(sp.level)}}:LiorCharacter.spend(character,sp,selected.id);
  let next=stApplyPreAttack(paid.character,Battle.options),nc=next.combat_state;
  if(actionKey)nc[actionKey]=true;if(m.action==='bonus')nc.battle.bonusSpell=true;if(m.action==='action'&&Number(sp.level)>0)nc.battle.leveledActionSpell=true;if(m.action==='reaction')nc.battle.reactionSpell=true;
  if(freeEligible){nc.battle.freeSpells||={};nc.battle.freeSpells[sp.id]=true}
  if(sp.concentration)nc.concentration_spell=sp.name;
  const f=stSpellFormula(sp,paid.option.level);
  if(/agathys/i.test(sp.name))next.hp_temp=Math.max(Number(next.hp_temp||0),5*paid.option.level);
  if(/^escudo\b|^shield\b/i.test(sp.name))nc.shield_active=true;
  if(m.kind==='heal')next.hp_current=Math.min(next.hp_max,next.hp_current+applied);if(m.kind==='temp')next.hp_temp=Math.max(next.hp_temp||0,applied);
  stCommitCharacter(next);spells=spells.map(s=>s.id===sp.id?paid.spell:s);Battle.options={hex:false,curse:false};Battle.freeSpell=false;
  if(m.kind==='attack'){
    const prof=LiorCharacter.prof(character.level),flat=f.flat+stModifiers().damage+(ctEffect('curse',nc)?prof:0),hex=ctEffect('hex',nc);
    Battle.pending={name:sp.name,pact:false,formula:f.dice+sign(flat)+(hex?'+1d6':''),count:f.count,spellId:sp.id};
  }else Battle.selection=null;
  await bLog('Lanzó '+sp.name+' · '+(freeEligible?'Uso gratuito concedido':selected.label)+' · '+(f.kind==='save'?'Salvación CD '+f.save+' (resolver en mesa)':f.count+' × '+f.dice+sign(f.flat)));
 }catch(e){toast(e.message)}
};
// Each ray is resolved separately. Resource payment occurs once when the spell is cast.
const stPreviousImpact=bImpact;
bImpact=function(hit){
 const attack=Battle.pending;if(!attack)return;
 const remaining=Math.max(0,Number(attack.count||1)-1);attack.remaining=remaining;
 stPreviousImpact(hit);
 if(!hit&&remaining){Battle.pending={...attack,count:remaining,critical:false};renderBattleComposer()}
};
const stPreviousImpactRender=bRenderImpact;
bRenderImpact=function(a){
 stPreviousImpactRender(a);if(a.remaining>0){document.querySelectorAll('#battleComposer .compose-body .action-commit').forEach(b=>b.remove());const button=document.createElement('button');button.className='action-commit';button.textContent='Resolver siguiente rayo · quedan '+a.remaining;button.onclick=()=>{Battle.pending={...a,formula:a.critical?a.formula.replace(/(\d*)d(\d+)/gi,(_,n,d)=>(Number(n||1)/2)+'d'+d):a.formula,count:a.remaining,remaining:0,critical:false,appliedEffects:[]};renderBattleComposer()};document.querySelector('#battleComposer .compose-body')?.append(button)}
};
bHitEffect=async function(which){
 try{stRequireReady();if(Battle.selection?.type!=='impact')return;const a=Battle.selection.attack,c=bCS(),wl=Number(LiorCharacter.levels(character).Brujo||0);let formula;
 if(which==='smite'){if(!a.pact||wl<5||!c.invocations_known?.includes('eldritch_smite')||c.battle.smiteUsed||!bSlots())throw Error('Castigo Arcano no disponible.');c.battle.smiteUsed=true;character.spell_slots_used=Number(character.spell_slots_used||0)+1;formula=(1+bProg().slotLevel)*(a.critical?2:1)+'d8'}
 else{if(!c.necrotic_shroud_active||c.battle.shroudDamageUsed)throw Error('Mortaja no disponible en este impacto.');c.battle.shroudDamageUsed=true;formula=String(character.level)}
 (a.appliedEffects||=[]).push(formula);await bLog((which==='smite'?'Castigo Arcano':'Mortaja Necrótica')+' · '+formula);bRenderImpact(a)
 }catch(e){toast(e.message)}
};
const stPreviousProg=bProg;bProg=function(){return{...stPreviousProg(),prof:LiorCharacter.prof(character.level)}};
castSpellInCombat=async function(id){if(Battle.pending)return toast('Termina de resolver el ataque pendiente.');bSelect('spell',id);await bExecuteSpell()};

function renderStudioCombat(){
 const host=document.getElementById('studioCombat');if(!host)return;const d=stDev(),slots=LiorCharacter.slotMaximum(character);
 host.innerHTML=`<div class="ready-heading"><div><span class="eyebrow">Estado compartido</span><h2>Capacidades y recursos de todas tus clases</h2></div><div><button class="quiet-btn" onclick="stEndTurn()">${bCS().battle.outOfTurn?'Fuera de tu turno':'Terminar mi turno'}</button><button class="quiet-btn" onclick="switchTab('progression')">Configurar personaje →</button></div></div><div class="studio-slot-row">${slots.map((max,i)=>max?'<span class="condition-mark">N'+(i+1)+': '+Math.max(0,max-Number(d.spellSlotsUsed?.[i]||0))+'/'+max+'</span>':'').join('')}${(d.resources||[]).map(r=>'<span class="condition-mark">'+esc(r.name)+': '+Math.max(0,r.max-Number(r.used||0))+'/'+r.max+'</span>').join('')}</div>${(d.features||[]).filter(f=>f.resolution==='configured').map(f=>`<article class="studio-row"><div><strong>${esc(f.name)}</strong><p>${esc(f.source)} · ${esc(f.mechanics.action)}${f.mechanics.max?' · '+Math.max(0,f.mechanics.max-Number(f.mechanics.used||0))+'/'+f.mechanics.max:''}${f.active?' · ACTIVO':''}</p><small>${esc(f.description)}</small></div><button class="quiet-btn" data-st-use="${esc(f.id)}">${f.active?'Terminar efecto':'Usar capacidad'}</button></article>`).join('')||'<p>Las nuevas capacidades configuradas aparecerán aquí. Las originales siguen en sus controles de combate.</p>'}`;
 host.querySelectorAll('[data-st-use]').forEach(b=>b.onclick=()=>stUseFeature(b.dataset.stUse));
}
function stUseFeature(id){
 try{
  stRequireReady();const next=LiorCharacter.clone(character),dev=next.combat_state.development,f=dev.features.find(f=>f.id===id),m=f.mechanics,cs=next.combat_state;
  if(f.active){f.active=false;stCommitCharacter(next);stHistory('Terminó '+f.name);return stSave()}
  const key={action:'action_used',bonus:'bonus_action_used',reaction:'reaction_used'}[m.action];if(key&&cs[key])throw Error('Acción necesaria gastada.');
  if(cs.battle.outOfTurn&&['action','bonus'].includes(m.action))throw Error('Esta capacidad requiere tu turno.');
  if(m.max&&Number(m.used||0)>=m.max)throw Error('Capacidad agotada.');
  const resource=m.resource?dev.resources?.find(r=>r.id===m.resource):null;
  if(m.resource&&(!resource||resource.max-Number(resource.used||0)<Number(m.cost||1)))throw Error('No queda reserva para esta capacidad.');
  let amount=null;if(['heal','temp','damage'].includes(m.effect)){
   const raw=prompt('Resuelve '+m.dice+' y escribe el total. Cancelar no gasta recursos.');if(raw===null)return;amount=Number(raw);if(!Number.isInteger(amount)||amount<0)throw Error('Indica un total válido.');
  }
  if(key)cs[key]=true;if(m.max)m.used=Number(m.used||0)+1;if(resource)resource.used=Number(resource.used||0)+Number(m.cost||1);
  if(m.effect==='buff'){f.active=true;f.turnsLeft=Number(m.duration||0)}
  if(m.effect==='heal')next.hp_current=Math.min(next.hp_max,next.hp_current+amount);if(m.effect==='temp')next.hp_temp=Math.max(next.hp_temp||0,amount);
  stCommitCharacter(next);stHistory('Usó '+f.name+(amount!==null?' · resultado '+amount:''));stSave();
 }catch(e){toast(e.message)}
}
const stPreviousNext=bNextTurn;bNextTurn=async function(){
 const battle=bCS().battle;battle.leveledActionSpell=false;battle.reactionSpell=false;battle.outOfTurn=false;
 for(const f of stDev().features||[])if(f.active&&f.turnsLeft>0&&--f.turnsLeft===0)f.active=false;
 await stPreviousNext();renderStudioCombat();
};
function stRecover(kind){
 const d=stDev();if(kind==='long'&&d.spellSlotsUsed)d.spellSlotsUsed=Array(9).fill(0);
 for(const r of d.resources||[])if(r.recovery===kind||kind==='long'&&r.recovery==='short')r.used=0;
 for(const f of d.features||[])if(f.mechanics&&(f.mechanics.recovery===kind||kind==='long'&&f.mechanics.recovery==='short')){f.mechanics.used=0;f.active=false}
 for(const sp of spells)if(sp.mechanics&&(sp.mechanics.recovery===kind||kind==='long'&&sp.mechanics.recovery==='short'))sp.mechanics.used=0;
}
function stResetRestActions(){const c=bCS();for(const k of ['action_used','bonus_action_used','reaction_used'])c[k]=false;Object.assign(c.battle,{attacksMade:0,smiteUsed:false,shroudDamageUsed:false,curseUsed:false,bonusSpell:false,outOfTurn:false,leveledActionSpell:false,reactionSpell:false,minionActions:{}});c.hexblade_curse=false;c.necrotic_shroud_active=false;c.shield_active=false;Battle.pending=null;Battle.selection=null;Battle.minionUsed.clear()}
shortRest=async function(){try{stRequireReady();character.spell_slots_used=0;stResetRestActions();stRecover('short');stHistory('Descanso corto completado');await bLog('Descanso corto: Pacto y reservas de descanso corto recuperados. La concentración se conserva si su duración lo permite.')}catch(e){toast(e.message)}};
longRest=async function(){try{stRequireReady();character.hp_current=character.hp_max;character.hp_temp=0;character.spell_slots_used=0;const c=bCS();stResetRestActions();c.necrotic_shroud_used=false;c.healing_hands_used=false;c.concentration_spell=null;c.arcanum_used={};c.battle.freeSpells={};stRecover('long');
 const d=stDev();if(d.hitDiceUsed){let recover=Math.max(1,Math.floor(character.level/2));const classes=Object.keys(LiorCharacter.levels(character)).sort((a,b)=>LiorCharacter.classInfo(LiorCatalog,b).hit_die-LiorCharacter.classInfo(LiorCatalog,a).hit_die);for(const key of classes){const n=Math.min(Number(d.hitDiceUsed[key]||0),recover);d.hitDiceUsed[key]-=n;recover-=n}}
 stHistory('Descanso largo completado; dados de golpe recuperados hasta la mitad del nivel, primero los de mayor tamaño');await bLog('Descanso largo: PG, Pacto, espacios normales y reservas correspondientes recuperados.');}catch(e){toast(e.message)}};
function stHitDie(key){try{stRequireReady();const level=Number(LiorCharacter.levels(character)[key]||0),used=Number(stDev().hitDiceUsed?.[key]||0),die=LiorCharacter.classInfo(LiorCatalog,key)?.hit_die;if(!die||used>=level)throw Error('No quedan dados de golpe de esa clase.');const value=prompt('Durante tu descanso corto tira 1d'+die+'. Escribe el resultado del dado (sin Constitución).');if(value===null)return;const roll=Number(value);if(!Number.isInteger(roll)||roll<1||roll>die)throw Error('La tirada no corresponde al dado.');character.combat_state.development||={};const d=character.combat_state.development;d.hitDiceUsed||={};d.hitDiceUsed[key]=used+1;const gain=Math.max(0,roll+getMod(character.con));character.hp_current=Math.min(character.hp_max,character.hp_current+gain);stHistory('Dado de golpe '+key+': '+roll+' + CON; '+gain+' PG de curación');stSave()}catch(e){toast(e.message)}}

function stEndTurn(){try{stRequireReady();if(Battle.pending||Battle.selection?.attack?.remaining)throw Error('Resuelve los impactos pendientes antes de terminar el turno.');bCS().battle.outOfTurn=true;Battle.selection=null;stSave();toast('Turno terminado. Conservas tu reacción si no la gastaste.')}catch(e){toast(e.message)}}

/* ===== device-sync ===== */
/* Supabase remains authoritative. Refresh clean sessions; never overwrite pending edits. */
const DeviceSync={checking:false,timer:null};
function deviceEditorOpen(){
 const editor=document.getElementById('editorModal'),wizard=document.getElementById('levelUpModal');
 return Boolean(editor&&!editor.classList.contains('hidden')||wizard&&!wizard.classList.contains('hidden')||document.activeElement?.matches?.('input,textarea,select'));
}
async function deviceRefresh(){
 if(DeviceSync.checking||document.hidden||!CloudSheet.ready||CloudSheet.loading||CloudSheet.busy||CloudSheet.error==='conflict')return;
 DeviceSync.checking=true;
 try{
  const rows=await cloudRequest('characters?id=eq.'+encodeURIComponent(CloudSheet.rowId||CLOUD_CHARACTER_ID)+'&select=updated_at');
  if(!Array.isArray(rows)||rows.length!==1)throw Error('No se pudo verificar la versión compartida.');
  if(rows[0].updated_at===CloudSheet.updatedAt)return;
  CloudSheet.remoteChanged=true;
  // These flags can change while the read is in flight. Re-check before hydration.
  if(CloudSheet.dirty||CloudSheet.busy){CloudSheet.error='conflict';cloudStatus('Otro dispositivo guardó cambios. Tus cambios pendientes se conservan; revisa el conflicto.','conflict');return}
  if(deviceEditorOpen()){cloudStatus('Hay cambios de otro dispositivo. Cierra el editor para actualizar antes de guardar.','conflict');return}
  await cloudLoad();
 }catch(e){cloudStatus('No se pudo comprobar la ficha compartida. Revisa la conexión antes de cambiar de dispositivo.','offline')}
 finally{DeviceSync.checking=false}
}
const devicePreviousApply=cloudApply;
cloudApply=function(row,related){devicePreviousApply(row,related);CloudSheet.remoteChanged=false;};
const devicePreviousQueue=cloudQueue;
cloudQueue=function(){
 if(CloudSheet.remoteChanged){CloudSheet.dirty=true;CloudSheet.generation++;CloudSheet.error='conflict';cloudPending(cloudSnapshot());cloudStatus('Cambios pendientes: otra sesión tiene una versión más reciente. No se sobrescribió la base de datos.','conflict');return}
 devicePreviousQueue();
};
const devicePreviousReady=stRequireReady;
stRequireReady=function(){devicePreviousReady();if(CloudSheet.remoteChanged)throw Error('Hay cambios de otro dispositivo. Cierra este editor y actualiza la ficha antes de guardar.');};
document.addEventListener('DOMContentLoaded',()=>{DeviceSync.timer=setInterval(deviceRefresh,5000)});
window.addEventListener('focus',deviceRefresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)deviceRefresh()});

/* ===== focused-combat ===== */
/* Focused combat: one selection, one composer, shared resources and a separate map. */
const CombatFocus={advantage:false,manualAC:16,simulateSmite:false,simulateShroud:false};
function ctMap(){return character.combat_state.tactical||{columns:12,rows:10,feet:5,tokens:[{id:'lior',name:character.name,type:'self',x:0,y:0}],target:null}}
function ctMapWrite(change){stRequireReady();const map=LiorCharacter.clone(ctMap());change(map);character.combat_state.tactical=map;persist();renderAll()}
function ctTarget(){return ctMap().tokens.find(t=>t.id===ctMap().target&&t.type!=='self')||null}
function ctAC(token){return token?.type==='self'?calculateDynamicAC().total:Number(token?.ac||CombatFocus.manualAC)}
function ctEffect(which,cs=character.combat_state){const target=ctMap().target,b=cs.battle||{};return which==='curse'?Boolean(cs.hexblade_curse&&(!b.curseTargetId||b.curseTargetId===target)):Boolean(/maleficio|^hex\b/i.test(cs.concentration_spell||'')&&(!b.hexTargetId||b.hexTargetId===target))}
function ctPickTarget(id){try{if(Battle.pending)throw Error('Resuelve este impacto antes de cambiar el objetivo.');ctMapWrite(m=>{m.target=id||null})}catch(e){toast(e.message)}}
const ctOldPreAttack=stApplyPreAttack;stApplyPreAttack=function(c,options){const result=ctOldPreAttack(c,options);if(options.curse)result.combat_state.battle.curseTargetId=ctMap().target||null;if(options.hex)result.combat_state.battle.hexTargetId=ctMap().target||null;return result};
function ctEffects(kind,weapon){
 const c=bCS(),battle=c.battle,pact=Boolean(weapon?.is_pact_weapon),hex=spells.find(s=>s.is_known&&/maleficio|^hex\b/i.test(s.name));
 const attack=kind==='attack',own=!battle.outOfTurn,sp=Battle.selection?.type==='spell'?spells.find(s=>s.id===Battle.selection.id):null,m=sp?stSpellMechanics(sp):null,bonusAllowed=m?.action!=='bonus',hexCompatible=!sp||Number(sp.level)===0&&m.action==='action';
 const item=(label,detail,key,eligible,active=false)=>`<label class="ct-effect ${!eligible?'ct-disabled':''}"><input type="checkbox" data-ct-effect="${key}" ${active||Battle.options[key]?'checked':''} ${!eligible||active?'disabled':''}><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></label>`;
 const curseActive=ctEffect('curse'),hexActive=ctEffect('hex'),hexResource=hex?LiorCharacter.resourceOptions(character,hex)[0]:null;
 let html=item('Maldición del Filo',!attack?'No se aplica a esta resolución':curseActive?'Activa en este objetivo':c.hexblade_curse?'Activa en otro objetivo':battle.curseUsed?'Agotada hasta descansar':!bonusAllowed?'El conjuro usa tu acción adicional':!own||c.bonus_action_used?'Acción adicional gastada':'Acción adicional · +'+LiorCharacter.prof(character.level)+' daño · crítico 19–20','curse',attack&&own&&bonusAllowed&&!c.bonus_action_used&&!battle.curseUsed&&!c.hexblade_curse,curseActive);
 html+=item('Maleficio',!attack?'No añade daño a este tipo de efecto':hexActive?'Activo · +1d6 por impacto':!hex?'No conocido':!hexCompatible?'Activarlo no es compatible con este lanzamiento':battle.leveledActionSpell||battle.reactionSpell?'Ya lanzaste un conjuro incompatible este turno':!hexResource?'Sin recurso disponible':!own||c.bonus_action_used?'Acción adicional gastada':'Acción adicional · '+hexResource.label+' · concentración','hex',attack&&own&&hexCompatible&&!battle.leveledActionSpell&&!battle.reactionSpell&&!c.bonus_action_used&&Boolean(hexResource)&&!hexActive,hexActive);
 html+=`<div class="ct-effect ct-disabled"><span><strong>Filo Sediento / Ataque Extra</strong><small>${!weapon?'No se aplica a conjuros':stWeaponAttack(weapon).loadingLimited?'De carga: un disparo por acción':stWeaponAttack(weapon).count+' ataque(s) por acción · aplicación automática'}</small></span></div>`;
 html+=`<div class="ct-effect"><span><strong>Mortaja Necrótica</strong><small>${!attack?'El daño requiere un ataque o conjuro dañino':battle.shroudDamageUsed?'Daño adicional ya usado este turno':c.necrotic_shroud_active?'Activa · +'+character.level+' al confirmar un impacto':c.necrotic_shroud_used?'Agotada hasta descanso largo':'Activar requiere una acción'}</small></span>${!c.necrotic_shroud_active&&!c.necrotic_shroud_used?`<button class="quiet-btn" data-ct-shroud ${!own||c.action_used?'disabled':''}>Activar · acción</button>`:''}</div>`;
 html+=`<div class="ct-effect ct-disabled"><span><strong>Castigo Arcano</strong><small>${!pact?'Solo con arma del pacto':!c.invocations_known?.includes('eldritch_smite')?'Invocación no adquirida':battle.smiteUsed?'Ya usado este turno':!bSlots()?'Sin espacio del pacto':'Disponible tras impactar · '+bProg().smiteDice+' · un espacio'}</small></span></div>`;
 return '<div class="ct-effects">'+html+'</div>';
}
function ctAttackValues(){
 const s=Battle.selection;if(!s)return null;
 if(s.type==='weapon'){const w=inventory.find(x=>x.id===s.id);if(!w)return null;const f=stWeaponAttack(w);return{weapon:w,dice:f.dice,flat:f.flat,bonus:f.bonus,count:Math.max(1,(f.loadingLimited?1:f.count)-Number(bCS().battle.attacksMade||0)),kind:'attack',pact:w.is_pact_weapon,name:w.name}}
 if(s.type==='spell'){const sp=spells.find(x=>x.id===s.id);if(!sp)return null;const options=stSpellOptions(sp),selected=options.find(o=>o.id===Studio.castResource[sp.id])||options[0],m=stSpellMechanics(sp),f=stSpellFormula(sp,selected?.level||Number(sp.level));return{...f,flat:f.flat+stModifiers().damage,spell:sp,options,resource:selected,mechanics:m,pact:false,name:sp.name}}
 return null;
}
function ctEstimate(a){
 if(!a||!LiorDamage.dice(a.dice))return '';
 const c=bCS(),curse=ctEffect('curse')||Battle.options.curse,hex=ctEffect('hex')||Battle.options.hex;
 if(a.kind!=='attack'){const d=LiorDamage.damage(a.dice,a.flat);return `<div class="ct-preview"><strong>${esc(a.dice)} ${sign(a.flat)}</strong><span>Mín. ${ctNum(d.min)} · Máx. ${ctNum(d.max)} · Media ${ctNum(d.mean)}</span><small>${a.kind==='save'?'Daño antes de resolver la salvación; sus consecuencias se consultan en el conjuro.':'Efecto de referencia, no se aplica automáticamente al objetivo.'}</small></div>`}
 const attack={dice:a.dice,flat:a.flat,bonus:a.bonus,count:a.count,level:Number(character.level),prof:LiorCharacter.prof(character.level),smite:a.pact&&c.invocations_known.includes('eldritch_smite')?bProg().smiteDice:null};
 const options={ac:ctAC(ctTarget()),advantage:CombatFocus.advantage,curse,hex,thirst:false,shroud:CombatFocus.simulateShroud&&c.necrotic_shroud_active&&!c.battle.shroudDamageUsed,smite:CombatFocus.simulateSmite&&a.pact&&!c.battle.smiteUsed&&bSlots()>0};
 const r=LiorDamage.calculate(attack,options);
 return `<div class="ct-preview"><div class="ct-preview-line"><strong>${ctNum(r.hit*100)}% impacto</strong><strong>${ctNum(r.dpr)} daño esperado</strong></div><small>Contra CA ${options.ac} · ${ctNum(r.critical*100)}% crítico · ${r.count} impacto(s) restante(s)</small><details><summary>Desglose del daño · simulación</summary><p>Todos impactan, sin crítico: ${ctNum(r.min)}–${ctNum(r.max)} · media ${ctNum(r.mean)}.</p>${r.parts.filter(p=>p.mean).map(p=>`<div class="ct-part"><span>${esc(p.name)}</span><strong>${ctNum(p.mean)}</strong></div>`).join('')}<label><input type="checkbox" data-ct-sim="simulateShroud" ${options.shroud?'checked':''} ${!c.necrotic_shroud_active||c.battle.shroudDamageUsed?'disabled':''}> Incluir Mortaja al impactar</label><label><input type="checkbox" data-ct-sim="simulateSmite" ${options.smite?'checked':''} ${!attack.smite||c.battle.smiteUsed||!bSlots()?'disabled':''}> Incluir Castigo al impactar</label><small>Comparar no gasta recursos. Los efectos tras impacto se confirman después de atacar.</small></details></div>`;
}
const ctNum=n=>Number(n.toFixed(2)).toLocaleString('es');
function ctTargetHTML(){return `<div class="ct-target">${stSelect('ctTarget','Objetivo',[['','Sin objetivo · CA manual'],...ctMap().tokens.filter(t=>t.type!=='self').map(t=>[t.id,t.name+' · CA '+ctAC(t)])],ctMap().target||'')}${ctTarget()?`<button class="quiet-btn" id="ctShowMap">Ver mapa →</button>`:stField('ctManualAC','CA de referencia',CombatFocus.manualAC,'number','min="1" max="40"')}</div>`}
const ctPreviousComposer=renderBattleComposer;
renderBattleComposer=function(){
 const a=ctAttackValues(),s=Battle.selection;
 if(!a||Battle.pending||!['weapon','spell'].includes(s?.type)){ctPreviousComposer();return}
 const c=bCS(),m=a.mechanics,spell=a.spell,w=a.weapon,action=m?{action:'Acción',bonus:'Adicional',reaction:'Reacción',free:'Especial'}[m.action]:'Acción de Atacar';
 const actionKey=m?{action:'action_used',bonus:'bonus_action_used',reaction:'reaction_used'}[m.action]:null;
 const ammo=w?stAmmo(w):null,ammoCount=ammo?(ammo==='quantity'?w.quantity:character[ammo]):null;
 const blocked=w?!bAvailableAttack(w)||ammo&&Number(ammoCount)<=0||c.battle.outOfTurn:!a.resource||actionKey&&c[actionKey]||c.battle.outOfTurn&&m.action!=='reaction'||!c.battle.outOfTurn&&c.battle.bonusSpell&&(Number(spell.level)>0||m.action!=='action');
 const formula=a.dice+sign(a.flat+(a.kind==='attack'&&(ctEffect('curse')||Battle.options.curse)?LiorCharacter.prof(character.level):0))+(a.kind==='attack'&&(ctEffect('hex')||Battle.options.hex)?'+1d6':'');
 document.getElementById('battleComposer').innerHTML=bHead(action,a.name,'')+`<div class="compose-body ct-compose">${ctTargetHTML()}<div class="ct-roll"><small>${a.kind==='save'?'SALVACIÓN DEL OBJETIVO':a.kind==='attack'?'TU TIRADA DE ATAQUE':'DADOS DEL EFECTO'}</small><strong>${a.kind==='save'?'CD '+a.save+' · '+(m.save||stSpellReference(spell)?.dc?.dc_type?.index||'atributo del conjuro').toUpperCase():a.kind==='attack'?(CombatFocus.advantage?'2d20, el mayor':'1d20')+' '+sign(a.bonus):esc(formula)}</strong><span>${a.kind==='save'?'El objetivo tira 1d20 + su salvación; supera la prueba si alcanza la CD.':a.kind==='attack'?'Daño por impacto: '+esc(formula)+(a.count>1?' · '+a.count+' impactos por resolver':''):'Resuelve el total en la mesa.'}</span></div>${a.kind==='attack'?stSelect('ctAdvantage','Tirada',[['normal','Normal'],['advantage','Ventaja']],CombatFocus.advantage?'advantage':'normal'):''}${spell?stSelect('ctResource','Gastar al confirmar',a.options.length?a.options.map(o=>[o.id,o.label]):[['','Sin recursos disponibles']],a.resource?.id||''):`<p class="ct-cost">Ataques usados: ${c.battle.attacksMade||0}/${stWeaponAttack(w).loadingLimited?1:stWeaponAttack(w).count}${ammo?' · Munición: '+ammoCount:''}</p>`}<h3 class="ct-label">Qué puedes aplicar ahora</h3>${ctEffects(a.kind,w)}<button class="action-commit" id="ctExecute" ${blocked?'disabled':''}>${blocked?'No disponible · revisa acciones y recursos':w?'Confirmar ataque':a.kind==='save'?'Lanzar y resolver salvación':'Confirmar lanzamiento'}</button><div id="ctEstimate">${ctEstimate(a)}</div><details><summary>${w?'Propiedades del arma':'Descripción y reglas del conjuro'}</summary><p class="battle-detail">${esc(w?(w.properties||'')+' · '+(w.notes||''):spell.description||'')}</p><button class="quiet-btn" id="ctEdit">Editar en la ficha</button></details></div>`;
 document.getElementById('ctTarget').onchange=e=>ctPickTarget(e.target.value);
 document.getElementById('ctShowMap')?.addEventListener('click',()=>switchTab('tactical'));
 document.getElementById('ctManualAC')?.addEventListener('input',e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=1&&n<=40){CombatFocus.manualAC=n;document.getElementById('ctEstimate').innerHTML=ctEstimate(ctAttackValues());ctBindEstimate()}});
 document.getElementById('ctAdvantage')?.addEventListener('change',e=>{CombatFocus.advantage=e.target.value==='advantage';renderBattleComposer()});
 document.getElementById('ctResource')?.addEventListener('change',e=>{Studio.castResource[spell.id]=e.target.value;renderBattleComposer()});
 document.querySelectorAll('[data-ct-effect]').forEach(el=>el.onchange=()=>{Battle.options[el.dataset.ctEffect]=el.checked;if(el.checked)Battle.options[el.dataset.ctEffect==='hex'?'curse':'hex']=false;renderBattleComposer()});
 document.querySelector('[data-ct-shroud]')?.addEventListener('click',async()=>{const selection={...Battle.selection};await bFeature('shroud');Battle.selection=selection;renderBattleComposer()});
 document.getElementById('ctExecute').onclick=w?bExecuteWeapon:bExecuteSpell;
 document.getElementById('ctEdit').onclick=()=>w?openItemModal(w.id):openSpellModal(spell.id);
 ctBindEstimate();
};
function ctBindEstimate(){document.querySelectorAll('[data-ct-sim]').forEach(e=>e.onchange=()=>{CombatFocus[e.dataset.ctSim]=e.checked;document.getElementById('ctEstimate').innerHTML=ctEstimate(ctAttackValues());ctBindEstimate()})}
const ctCastSpell=bExecuteSpell;bExecuteSpell=async function(){const a=ctAttackValues(),before=Battle.pending;await ctCastSpell();if(a?.spell&&Battle.pending?.spellId===a.spell.id&&Battle.pending!==before){Battle.pending.castLevel=a.resource?.level;Battle.pending.effectBase={dice:a.dice,flat:a.flat,bonus:a.bonus};renderBattleComposer()}};
const ctWeaponExecute=bExecuteWeapon;bExecuteWeapon=async function(){const a=ctAttackValues(),before=bCS().battle.attacksMade;await ctWeaponExecute();if(a?.weapon&&Battle.pending&&bCS().battle.attacksMade>before){Battle.pending.effectBase={dice:a.dice,flat:a.flat,bonus:a.bonus};renderBattleComposer()}};
const ctImpactRender=bRenderImpact;bRenderImpact=function(a){ctImpactRender(a);if(a.remaining>0&&a.spellId){const body=document.querySelector('#battleComposer .compose-body');if(!body)return;body.insertAdjacentHTML('afterbegin',ctTargetHTML());document.getElementById('ctTarget').onchange=e=>ctPickTarget(e.target.value);document.getElementById('ctShowMap')?.addEventListener('click',()=>switchTab('tactical'));const next=body.querySelector('.action-commit');if(next)next.onclick=()=>{const base=a.effectBase||stSpellFormula(spells.find(s=>s.id===a.spellId),a.castLevel),formula=base.dice+sign(base.flat+(ctEffect('curse')?LiorCharacter.prof(character.level):0))+(ctEffect('hex')?'+1d6':'');Battle.pending={...a,count:a.remaining,remaining:0,critical:false,formula,appliedEffects:[]};renderBattleComposer()}}};
// The calculator and resource list now belong to the selection and turn strip.
renderDamageCalculator=function(){document.getElementById('damageCalculator')?.remove()};
renderStudioCombat=function(){document.getElementById('studioCombat')?.remove();ctTurnStrip();};
function ctTurnStrip(){
 const strip=document.querySelector('#battleDesk .turn-strip');if(!strip)return;
 let bar=document.getElementById('ctTurnTools');if(!bar){bar=document.createElement('div');bar.id='ctTurnTools';strip.append(bar)}
 bar.innerHTML=`<span>Pacto ${bSlots()}/${bProg().slotCount} · N${bProg().slotLevel}</span><button class="quiet-btn" onclick="ctResetTurn()">Reiniciar controles</button><button class="quiet-btn" onclick="stEndTurn()">${bCS().battle.outOfTurn?'Fuera de tu turno':'Terminar turno'}</button><button class="quiet-btn" onclick="switchTab('tactical')">Mapa →</button>`;
}
function ctResetTurn(){try{stRequireReady();if(!confirm('Reiniciar acciones y límites de este turno. Los espacios, usos y munición ya gastados conservan su gasto. ¿Continuar?'))return;const c=bCS();for(const key of ['action_used','bonus_action_used','reaction_used'])c[key]=false;Object.assign(c.battle,{attacksMade:0,smiteUsed:false,shroudDamageUsed:false,bonusSpell:false,leveledActionSpell:false,reactionSpell:false,outOfTurn:false,minionActions:{}});Battle.pending=null;Battle.selection=null;persist();renderAll()}catch(e){toast(e.message)}}
const ctPreviousMain=renderBattleMain;
renderBattleMain=function(){
 if(Battle.section!=='weapons')return ctPreviousMain();
 const cs=bCS(),weapons=inventory.filter(w=>w.category==='arma'&&(w.is_pact_weapon?w.id===cs.battle.summonedWeaponId:w.is_carried&&w.is_equipped&&Number(w.quantity??1)>0));
 return `<div class="ct-selection"><h2>1 · Elige qué vas a usar</h2><div class="ct-weapons">${weapons.map(w=>`<button class="quiet-btn ${Battle.selection?.id===w.id?'ct-selected':''}" data-ct-weapon="${esc(w.id)}"><strong>${esc(bName(w))}</strong><small>1d20 ${sign(stWeaponAttack(w).bonus)} · ${esc(w.damage_dice)}</small></button>`).join('')}<button class="quiet-btn" onclick="tdOpenPicker('summon')">＋ Invocar arma</button></div><h3>Conjuros</h3><div class="ct-weapons">${spells.filter(s=>s.is_known&&(s.is_equipped||Number(s.level)===0)).slice(0,8).map(s=>`<button class="quiet-btn ${Battle.selection?.id===s.id?'ct-selected':''}" data-ct-spell="${esc(s.id)}">${esc(s.name.split(' (')[0])}</button>`).join('')}<button class="quiet-btn" onclick="tdOpenPicker('spell')">Todos los conocidos →</button></div><details><summary>Acompañantes y otras capacidades</summary>${companions.filter(c=>c.is_summoned).map(m=>`<button class="quiet-btn" data-ct-minion="${esc(m.id)}">${esc(m.name)}</button>`).join('')}<button class="quiet-btn" onclick="bSection('features')">Capacidades y descansos →</button>${(stDev().features||[]).filter(f=>f.resolution==='configured').map(f=>`<button class="quiet-btn" data-ct-feature="${esc(f.id)}">${esc(f.name)}${f.mechanics.max?' · '+Math.max(0,f.mechanics.max-Number(f.mechanics.used||0))+'/'+f.mechanics.max:''}</button>`).join('')}</details></div>`;
};
function ctBindMain(){for(const [attr,type]of [['weapon','weapon'],['spell','spell'],['minion','minion']])document.querySelectorAll('[data-ct-'+attr+']').forEach(b=>b.onclick=()=>bSelect(type,b.dataset['ct'+attr[0].toUpperCase()+attr.slice(1)]));document.querySelectorAll('[data-ct-feature]').forEach(b=>b.onclick=()=>stUseFeature(b.dataset.ctFeature))}
function ctVitalAmount(mode){try{stRequireReady();const n=Number(document.getElementById('ctHPAmount').value);if(!Number.isInteger(n)||n<0)throw Error('Escribe una cantidad válida.');const before=character.hp_current;let absorbed=0;if(mode==='damage'){absorbed=Math.min(character.hp_temp||0,n);character.hp_temp=Number(character.hp_temp||0)-absorbed;character.hp_current=Math.max(0,character.hp_current-(n-absorbed))}else if(mode==='heal')character.hp_current=Math.min(character.hp_max,character.hp_current+n);else character.hp_temp=Math.max(character.hp_temp||0,n);const p=profile();if(mode==='heal'&&character.hp_current>0){p.deathSuccesses=0;p.deathFailures=0;p.deathState=null}if(mode==='damage'&&before===0&&n>absorbed){if(p.deathState==='stable'){p.deathSuccesses=0;p.deathFailures=0}p.deathState=null;p.deathFailures=Math.min(3,Number(p.deathFailures||0)+1)}if(mode==='damage'&&n-absorbed>=before+Number(character.hp_max))p.deathState='dead';ctNormalizeDeath(p);p.healthTotals||={lost:0,healed:0};p.healthTotals.lost+=Math.max(0,before-character.hp_current);p.healthTotals.healed+=Math.max(0,character.hp_current-before);p.healthHistory||=[];p.healthHistory.unshift({at:stToday(),mode,amount:n,change:character.hp_current-before,absorbed});p.healthHistory=p.healthHistory.slice(0,30);persist();renderAll()}catch(e){toast(e.message)}}
function ctDeathSave(key,value){try{stRequireReady();const p=profile();p[key]=value;p.deathState=null;ctNormalizeDeath(p);persist();renderAll()}catch(e){toast(e.message)}}
function ctVitals(){
 const host=document.getElementById('ctVitality');if(!host)return;const p=profile(),history=p.healthHistory||[];
 host.innerHTML=`<div class="ct-vital-number"><small>VIDA DE LIOR</small><strong>${character.hp_current}<span> / ${character.hp_max} PG</span></strong><span>${character.hp_temp||0} temporales</span><small>Balance registrado: −${p.healthTotals?.lost||0} / ＋${p.healthTotals?.healed||0} PG</small></div><div><div class="ct-health-actions"><label>Cantidad<input id="ctHPAmount" type="number" min="0" value="1"></label><button class="quiet-btn" onclick="ctVitalAmount('damage')">− Daño</button><button class="quiet-btn" onclick="ctVitalAmount('heal')">＋ Curación</button><button class="quiet-btn" onclick="ctVitalAmount('temp')">PG temporales</button></div><details><summary>Últimos cambios de vida</summary>${history.slice(0,8).map(h=>`<p>${h.mode==='damage'?'Daño':h.mode==='heal'?'Curación':'Temporales'} ${h.amount} · PG ${sign(h.change)}${h.absorbed?' · absorbidos '+h.absorbed:''}</p>`).join('')||'<p>Los cambios rápidos quedarán registrados aquí.</p>'}</details></div><div class="ct-death-saves"><strong>Salvaciones de muerte</strong>${[['deathSuccesses','Éxitos'],['deathFailures','Fallos']].map(([key,label])=>`<div><span>${label}</span>${[1,2,3].map(n=>`<button aria-label="${label} ${n}" class="${Number(p[key]||0)>=n?'ct-marked':''}" onclick="ctDeathSave('${key}',${Number(p[key]||0)===n?n-1:n})">●</button>`).join('')}</div>`).join('')}<small>${p.deathState==='stable'?'Estabilizado a 0 PG.':Number(p.deathFailures||0)>=3?'Tres fallos: resuelve la muerte con el DM.':Number(p.deathSuccesses||0)>=3?'Tres éxitos: estabilizado.':'Tira 1d20: 10+ es éxito; 1 son dos fallos; 20 recupera 1 PG.'}</small><button class="quiet-btn" onclick="ctRollDeath()">Registrar d20</button></div>`;
 const heading=document.getElementById('ctDeathHeading');if(heading)heading.textContent='Muertes de Lior · '+(character.death_stamps||[]).filter(s=>s.stamped).length+' / 10 sellos';
}
function ctRollDeath(){try{stRequireReady();if(character.hp_current>0)throw Error('La salvación de muerte corresponde cuando estás a 0 PG.');if(['stable','dead'].includes(profile().deathState))throw Error('El estado actual no requiere otra salvación de muerte.');const raw=prompt('Resultado natural del d20 de salvación de muerte:');if(raw===null)return;const n=Number(raw);if(!Number.isInteger(n)||n<1||n>20)throw Error('El d20 debe estar entre 1 y 20.');const p=profile();if(n===20){character.hp_current=1;p.deathSuccesses=0;p.deathFailures=0;p.deathState=null}else if(n>=10)p.deathSuccesses=Math.min(3,Number(p.deathSuccesses||0)+1);else p.deathFailures=Math.min(3,Number(p.deathFailures||0)+(n===1?2:1));ctNormalizeDeath(p);persist();renderAll()}catch(e){toast(e.message)}}

function ctTokenEditor(id){
 const t=ctMap().tokens.find(t=>t.id===id)||{id:stId(),name:'Enemigo',type:'enemy',x:1,y:1,ac:10,hp:null};
 stModal(id?'Editar criatura':'Añadir criatura al mapa',`<div class="studio-grid">${stField('ctTokenName','Nombre',t.name)}${stSelect('ctTokenType','Bando',[['enemy','Enemigo'],['ally','Aliado']],t.type)}${stField('ctTokenAC','Clase de Armadura',t.ac??10,'number','min="1" max="40"')}${stField('ctTokenHP','PG actuales (opcional)',t.hp??'','number','min="0"')}${stField('ctTokenX','Columna (1–12)',t.x+1,'number','min="1" max="12"')}${stField('ctTokenY','Fila (1–10)',t.y+1,'number','min="1" max="10"')}</div>`,()=>{const name=stValue('ctTokenName').trim(),ac=stNumber('ctTokenAC'),x=stNumber('ctTokenX')-1,y=stNumber('ctTokenY')-1,hp=stValue('ctTokenHP')===''?null:stNumber('ctTokenHP');if(!name||!Number.isInteger(ac)||ac<1||ac>40||!Number.isInteger(x)||x<0||x>11||!Number.isInteger(y)||y<0||y>9||hp!==null&&(!Number.isInteger(hp)||hp<0))throw Error('Revisa el nombre, CA, PG y posición.');const next={...t,name,type:stValue('ctTokenType'),ac,hp,x,y};ctMapWrite(m=>{m.tokens=m.tokens.filter(v=>v.id!==t.id).concat(next);m.target=t.id});closeModal()});
}
function ctMove(x,y){try{if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=ctMap().columns||y<0||y>=ctMap().rows)throw Error('La posición queda fuera del mapa.');const id=ctMap().moving||'lior';ctMapWrite(m=>{const token=m.tokens.find(t=>t.id===id);if(token){token.x=x;token.y=y}})}catch(e){toast(e.message)}}
function renderTactical(){
 const host=document.getElementById('tab-tactical');if(!host)return;const map=ctMap(),lior=map.tokens.find(t=>t.type==='self'),target=ctTarget();
 host.innerHTML=`<div class="panel"><div class="ready-heading"><div><span class="eyebrow">Encuentro compartido en Supabase</span><h2>Mapa de combate</h2></div><button class="gold-btn" onclick="ctTokenEditor()">＋ Criatura</button></div><p>Selecciona qué ficha mover y toca una casilla. Cada casilla representa ${map.feet} pies; el mapa es una referencia de posiciones, sin obstáculos ni cálculo de línea de visión.</p><div class="studio-grid">${stSelect('ctMoveWho','Ficha que vas a mover',map.tokens.map(t=>[t.id,t.type==='self'?character.name:t.name]),map.moving||'lior')}${stSelect('ctMapTarget','Objetivo del combate',[['','Sin objetivo'],...map.tokens.filter(t=>t.type!=='self').map(t=>[t.id,t.name+' · CA '+ctAC(t)])],map.target||'')}</div><div class="ct-grid-scroll"><div class="ct-grid" role="group" aria-label="Mapa de doce columnas y diez filas">${Array.from({length:map.columns*map.rows},(_,i)=>{const x=i%map.columns,y=Math.floor(i/map.columns),tokens=map.tokens.filter(t=>t.x===x&&t.y===y);return `<button class="ct-cell ${tokens.length?'ct-occupied':''}" data-ct-x="${x}" data-ct-y="${y}" aria-label="Columna ${x+1}, fila ${y+1}${tokens.length?': '+tokens.map(t=>t.name).join(', '):''}">${tokens.map(t=>`<span class="ct-token ct-${t.type} ${map.target===t.id?'ct-targeted':''}">${esc(t.type==='self'?character.name.split(' ')[0]:t.name)}<small>CA ${ctAC(t)}</small></span>`).join('')}</button>`}).join('')}</div></div><p>${target&&lior?'Distancia de referencia a '+esc(target.name)+': '+Math.max(Math.abs(target.x-lior.x),Math.abs(target.y-lior.y))*map.feet+' pies.':'Elige un objetivo para utilizar su CA en el arma o conjuro.'}</p><div class="ct-token-list">${map.tokens.map(t=>`<article class="studio-row"><div><strong>${esc(t.type==='self'?character.name:t.name)}</strong><small>CA ${ctAC(t)}${t.type==='self'?' · '+character.hp_current+'/'+character.hp_max+' PG':t.hp!==null&&t.hp!==undefined?' · '+t.hp+' PG':''}</small></div>${t.type!=='self'?`<div><button class="quiet-btn" data-ct-target="${esc(t.id)}">Objetivo</button><button class="quiet-btn" data-ct-edit-token="${esc(t.id)}">Editar</button><button class="quiet-btn" data-ct-remove-token="${esc(t.id)}">Retirar</button></div>`:''}</article>`).join('')}</div><button class="quiet-btn" onclick="switchTab('combat')">← Volver al combate</button></div>`;
 document.getElementById('ctMoveWho').onchange=e=>{try{ctMapWrite(m=>{m.moving=e.target.value})}catch(error){toast(error.message)}};
 document.getElementById('ctMapTarget').onchange=e=>ctPickTarget(e.target.value);
 host.querySelectorAll('[data-ct-x]').forEach(b=>b.onclick=()=>ctMove(Number(b.dataset.ctX),Number(b.dataset.ctY)));
 host.querySelectorAll('[data-ct-target]').forEach(b=>b.onclick=()=>ctPickTarget(b.dataset.ctTarget));host.querySelectorAll('[data-ct-edit-token]').forEach(b=>b.onclick=()=>ctTokenEditor(b.dataset.ctEditToken));host.querySelectorAll('[data-ct-remove-token]').forEach(b=>b.onclick=()=>{if(confirm('¿Retirar esta criatura del mapa?'))ctMapWrite(m=>{m.tokens=m.tokens.filter(t=>t.id!==b.dataset.ctRemoveToken);if(m.target===b.dataset.ctRemoveToken)m.target=null;if(m.moving===b.dataset.ctRemoveToken)m.moving='lior'})});
}
const ctPreviousSwitch=switchTab;switchTab=function(t){document.getElementById('tab-tactical')?.classList.toggle('hidden',t!=='tactical');document.querySelector('[data-view="tactical"]')?.classList.toggle('active',t==='tactical');if(t==='tactical'){ctPreviousSwitch('profile');document.getElementById('tab-profile').classList.add('hidden');currentView='tactical';document.querySelector('[data-view="profile"]')?.classList.remove('active');document.querySelector('[data-view="tactical"]')?.classList.add('active');document.getElementById('viewTitle').textContent='Mapa de combate';renderTactical();return}ctPreviousSwitch(t);};
const ctPreviousAll=renderAll;renderAll=function(){ctPreviousAll();ctBindMain();ctVitals();ctTurnStrip();if(currentView==='tactical')renderTactical();};
const ctPreviousBattle=renderBattle;renderBattle=function(){ctPreviousBattle();ctBindMain();ctTurnStrip()};
const ctPreviousStamp=toggleDeathStamp;toggleDeathStamp=async function(index){try{stRequireReady();await ctPreviousStamp(index);ctVitals()}catch(e){toast(e.message)}};
function ctNormalizeDeath(p){if(Number(p.deathSuccesses||0)>=3){p.deathState='stable';p.deathSuccesses=0;p.deathFailures=0}else if(Number(p.deathFailures||0)>=3)p.deathState='dead'}
document.addEventListener('DOMContentLoaded',()=>{
 document.body.classList.add('ct-focused');const desk=document.getElementById('battleDesk');
 const life=document.createElement('section');life.id='ctVitality';life.className='panel';desk.querySelector('.turn-strip').after(life);
 const death=document.getElementById('battleStampHost');if(death){death.querySelector('h2').id='ctDeathHeading';desk.insertBefore(death,desk.querySelector('.battle-layout'))}
 const tab=document.createElement('section');tab.id='tab-tactical';tab.className='hidden';document.querySelector('main').append(tab);
 const button=document.createElement('button');button.dataset.view='tactical';button.innerHTML='<small>08</small>Mapa';button.onclick=()=>switchTab('tactical');document.querySelector('.side-nav').append(button);
 renderDamageCalculator();renderStudioCombat();renderAll();
});
