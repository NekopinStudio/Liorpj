/* Pure progression and resource rules. No writes, DOM, network, or mutable globals. */
(function(root){
'use strict';
const names={Barbaro:'barbarian',Bardo:'bard',Brujo:'warlock',Clerigo:'cleric',Druida:'druid',Explorador:'ranger',Guerrero:'fighter',Hechicero:'sorcerer',Mago:'wizard',Monje:'monk',Paladin:'paladin',Picaro:'rogue'};
const labels={Barbaro:'Bárbaro',Bardo:'Bardo',Brujo:'Brujo',Clerigo:'Clérigo',Druida:'Druida',Explorador:'Explorador',Guerrero:'Guerrero',Hechicero:'Hechicero',Mago:'Mago',Monje:'Monje',Paladin:'Paladín',Picaro:'Pícaro'};
const abilities={Bardo:'cha',Brujo:'cha',Clerigo:'wis',Druida:'wis',Explorador:'wis',Hechicero:'cha',Mago:'int',Paladin:'cha'};
const skillNames={'acrobatics':'Acrobacias','animal-handling':'Trato con animales','arcana':'Arcanos','athletics':'Atletismo','deception':'Engaño','history':'Historia','insight':'Perspicacia','intimidation':'Intimidación','investigation':'Investigación','medicine':'Medicina','nature':'Naturaleza','perception':'Percepción','performance':'Interpretación','persuasion':'Persuasión','religion':'Religión','sleight-of-hand':'Juego de manos','stealth':'Sigilo','survival':'Supervivencia'};
const slots=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const clone=x=>JSON.parse(JSON.stringify(x));
const mod=n=>Math.floor((Number(n)-10)/2);
const prof=level=>2+Math.floor((Number(level)-1)/4);
function levels(character){return character.combat_state?.class_levels||{Brujo:Number(character.level)}}
function row(catalog,key,level){return catalog.levels.find(r=>!r.subclass&&r.class.index===(names[key]||key)&&r.level===level)}
function classInfo(catalog,key){return catalog.classes.find(c=>c.index===(names[key]||key))}
function catalogSpell(catalog,index,key,id){const s=catalog.spells.find(x=>x.index===index);if(!s)throw Error('Conjuro SRD no encontrado.');const damage=s.damage?.[0];return{id,name:s.name,level:s.level,class_origin:s.classes.map(c=>c.name).join(' / '),casting_time:s.casting_time.replace('bonus action','acción adicional').replace('reaction','reacción').replace('action','acción'),range_info:s.range,duration:s.duration,concentration:s.concentration,damage_dice:damage?.damage_at_slot_level?.[s.level]||damage?.damage_at_character_level?.[1]||s.heal_at_slot_level?.[s.level]||'',damage_type:damage?.damage_type?.name||'',description:s.desc.concat(s.higher_level||[]).join('\n'),is_known:true,is_equipped:true,catalog_index:s.index,srd:clone(s),mechanics:{version:1,ability:abilities[key]||'int',pool:'auto',kind:s.attack_type?'attack':s.dc?'save':s.heal_at_slot_level?'heal':'reference',source:labels[key]+' · subida de nivel'}}}
function prerequisites(character,key){
 const c=character,checks={Barbaro:c.str>=13,Bardo:c.cha>=13,Brujo:c.cha>=13,Clerigo:c.wis>=13,Druida:c.wis>=13,Explorador:c.dex>=13&&c.wis>=13,Guerrero:c.str>=13||c.dex>=13,Hechicero:c.cha>=13,Mago:c.int>=13,Monje:c.dex>=13&&c.wis>=13,Paladin:c.str>=13&&c.cha>=13,Picaro:c.dex>=13};
 return checks[key]===true;
}
function slotMaximum(character){
 const cs=character.combat_state||{},ls=levels(character),contributions=[];
 for(const [key,n]of Object.entries(ls)){
   if(!n||key==='Brujo')continue;
   if(['Bardo','Clerigo','Druida','Hechicero','Mago'].includes(key))contributions.push({n,div:1});
   else if(['Paladin','Explorador'].includes(key)&&n>=2)contributions.push({n,div:2});
   else if(['Guerrero','Picaro'].includes(key)&&n>=3&&cs.development?.thirdCasters?.includes(key))contributions.push({n,div:3});
 }
 let effective=contributions.reduce((s,c)=>s+Math.floor(c.n/c.div),0);
 if(contributions.length===1)effective=Math.ceil(contributions[0].n/contributions[0].div);
 return Array.from({length:9},(_,i)=>slots[Math.max(0,Math.min(20,effective))]?.[i]||0);
}
function extraAttacks(character,pact){
 const ls=levels(character);let n=1;
 if((ls.Guerrero||0)>=20)n=4;else if((ls.Guerrero||0)>=11)n=3;
 else if(['Guerrero','Barbaro','Paladin','Explorador','Monje'].some(k=>(ls[k]||0)>=5))n=2;
 if(pact&&(ls.Brujo||0)>=5&&character.combat_state?.invocations_known?.includes('thirsting_blade'))n=Math.max(2,n);
 return n;
}
function choiceGroups(catalog,key,next,subclass){
 const r=row(catalog,key,next);let refs=r?.features||[];
 if(subclass)refs=refs.concat(catalog.levels.filter(x=>x.subclass?.index===subclass&&x.level===next).flatMap(x=>x.features||[]));
 const groups=[];
 for(const ref of refs){const f=catalog.features.find(x=>x.index===ref.index);for(const [key,value]of Object.entries(f?.feature_specific||{})){
   if(value?.from?.options){groups.push({id:ref.index+':'+key,name:f.name,choose:Number(value.choose)||1,options:value.from.options.map((x,i)=>typeof x==='string'?{index:x,name:x}:x.item||x.of||{index:'option-'+i,name:x.desc||x.action_name||JSON.stringify(x)})})}
 }}
 if(next===1){const info=classInfo(catalog,key);for(const [i,g]of(info?.multi_classing?.proficiency_choices||[]).entries())groups.push({id:'multiclass:'+key+':'+i,name:'Competencia de multiclase · '+(g.desc||info.name),choose:g.choose,kind:'proficiency',options:g.from.options.filter(o=>o.item?.index).map(o=>o.item)})}
 return groups;
}
function preview(snapshot,draft,catalog){
 const next=clone(snapshot),c=next.character,cs=c.combat_state,ls=levels(c),key=draft.classKey,oldTotal=Number(c.level),n=Number(ls[key]||0)+1;
 if(oldTotal>=20)throw Error('El nivel total máximo de las reglas 2014 es 20.');
 if(Object.values(ls).reduce((a,b)=>a+Number(b),0)!==oldTotal)throw Error('El desglose de clases no coincide con el nivel total. Corrígelo antes de subir.');
 const info=classInfo(catalog,key);if(!info)throw Error('Selecciona una clase válida.');
 const multiclass=Object.keys(ls).some(k=>k!==key&&ls[k]>0);
 if(multiclass&&(!prerequisites(c,key)||Object.keys(ls).some(k=>ls[k]>0&&!prerequisites(c,k)))&&!draft.dmOverride?.trim())throw Error('Faltan requisitos de multiclase. Registra una excepción del DM para continuar.');
 const before=row(catalog,key,n-1),after=row(catalog,key,n);
 if(!after)throw Error('No hay progresión para este nivel.');
 const asi=Number(after.ability_score_bonuses||0)>Number(before?.ability_score_bonuses||0);
 const oldCon=mod(c.con);let feat=null;
 if(asi){
   if(draft.asiMode==='feat'){
     feat=draft.feat;if(!feat?.name?.trim())throw Error('Selecciona o escribe la dote.');
     if(cs.feats?.includes(feat.id))throw Error('La dote ya está adquirida.');
     if(feat.bonusStat){if(!['str','dex','con','int','wis','cha'].includes(feat.bonusStat))throw Error('Atributo inválido.');c[feat.bonusStat]=Number(c[feat.bonusStat])+Number(feat.bonusVal||1)}
     (cs.feats||=[]).push(feat.id);(cs.development||={}).customFeats||=[];cs.development.customFeats.push(clone(feat));
   }else{
     const changes=draft.asi||{};
     if(Object.values(changes).some(v=>!Number.isInteger(v)||v<0||v>2)||Object.values(changes).reduce((a,b)=>a+b,0)!==2)throw Error('Distribuye exactamente dos puntos de característica.');
     for(const [stat,delta]of Object.entries(changes)){if(!['str','dex','con','int','wis','cha'].includes(stat))throw Error('Atributo inválido.');c[stat]=Number(c[stat])+delta}
   }
   if(['str','dex','con','int','wis','cha'].some(k=>c[k]>20)&&!draft.dmOverride?.trim())throw Error('Una característica excede 20. Revisa la elección o registra la excepción del DM.');
 }
 const die=draft.hpMethod==='manual'?Number(draft.hpRoll):info.hit_die/2+1;
 if(!Number.isInteger(die)||die<1||die>info.hit_die)throw Error('La tirada de PG debe estar entre 1 y '+info.hit_die+'.');
 let hp=Math.max(1,die+mod(c.con))+(mod(c.con)-oldCon)*oldTotal;
 if(cs.feats?.includes('tough'))hp+=feat?.id==='tough'?2*(oldTotal+1):2;
 c.level=oldTotal+1;cs.class_levels={...ls,[key]:n};c.class_name=Object.entries(cs.class_levels).filter(([,v])=>v>0).map(([k,v])=>(labels[k]||k)+' '+v).join(' / ');
 c.hp_max=Number(c.hp_max)+hp;c.hp_current=Math.min(c.hp_max,Math.max(0,Number(c.hp_current)+hp));
 cs.development||={};cs.development.subclasses||={};if(draft.subclass?.trim())cs.development.subclasses[key]=draft.subclass.trim();
 const refs=(after.features||[]).concat(catalog.levels.filter(x=>x.subclass?.index===draft.subclass&&x.level===n).flatMap(x=>x.features||[]));
 const gained=refs.map(r=>catalog.features.find(x=>x.index===r.index)).filter(Boolean);
 const resolveSpell=id=>{if(!id?.startsWith('catalog:'))return next.spells.find(s=>s.id===id);const index=id.slice(8),existing=next.spells.find(s=>s.catalog_index===index);if(existing)return existing;const added=catalogSpell(catalog,index,key,draft.id+'-spell-'+index);next.spells.push(added);return added};
 const addProficiency=p=>{
  cs.profile||={};cs.profile.skills||={};const skill=skillNames[p.index.replace(/^skill-/,'')];
  if(skill)cs.profile.skills[skill]=Math.max(1,Number(cs.profile.skills[skill]||0));
  else{const field=/armor|shields/.test(p.index)?'armorProficiencies':/weapons|swords|bows/.test(p.index)?'weaponProficiencies':'tools';if(!(cs.profile[field]||'').includes(p.name))cs.profile[field]=[cs.profile[field],p.name].filter(Boolean).join('; ')}
 };
 if(n===1)for(const p of info.multi_classing?.proficiencies||[])addProficiency(p);
 for(const group of choiceGroups(catalog,key,n,draft.subclass)){
   const selected=draft.choices?.[group.id]||[];
   if(selected.length!==group.choose||new Set(selected).size!==selected.length||selected.some(x=>!group.options.some(o=>o.index===x)))throw Error('Completa la elección: '+group.name);
   for(const id of selected){if(group.kind==='proficiency')addProficiency(group.options.find(o=>o.index===id));else{const f=catalog.features.find(x=>x.index===id);if(f)gained.push(f);else gained.push({index:draft.id+'-'+group.id+'-'+id,name:group.name+' · '+group.options.find(o=>o.index===id).name,desc:['Elección registrada en la subida de nivel.']})}}
 }
 cs.development.features||=[];
 for(const f of gained)if(!cs.development.features.some(x=>x.id===f.index))cs.development.features.push({id:f.index,name:f.name,description:f.desc.join('\n'),source:labels[key]+' '+n,resolution:'reference'});
 if(draft.notes?.trim())cs.development.features.push({id:draft.id+'-notes',name:'Elecciones de '+labels[key]+' '+n,description:draft.notes,source:'Nivel',resolution:'reference'});
 if(draft.proficiencies?.trim()){
   cs.development.proficiencies||=[];cs.development.proficiencies.push({source:labels[key]+' '+n,text:draft.proficiencies.trim()});
 }
 if(key==='Brujo'){
   const ids=draft.invocations||cs.invocations_known||[],required=after.class_specific?.invocations_known||0;
   if(ids.length!==required||new Set(ids).size!==ids.length)throw Error('Selecciona exactamente '+required+' invocaciones.');
   const invs=draft.invocationCatalog||[];
   for(const id of ids){const inv=invs.find(x=>x.id===id);if(!inv||inv.minLevel>n)throw Error('Invocación no disponible: '+id);
    if(!draft.dmOverride?.trim()){
     if(['thirsting_blade','lifedrinker','improved_pact_weapon','eldritch_smite'].includes(id)&&(cs.development?.pact||'blade')!=='blade')throw Error('La invocación requiere Pacto del Filo: '+inv.name);
     if(['agonizing_blast','repelling_blast','eldritch_spear'].includes(id)&&!next.spells.some(s=>(s.is_known||(draft.learn||[]).includes(s.id))&&/descarga sobrenatural|eldritch blast/i.test(s.name)))throw Error('La invocación requiere Descarga Sobrenatural: '+inv.name);
    }
   }
   cs.invocations_known=[...ids];
   const arc={11:6,13:7,15:8,17:9}[n];if(arc){const sp=resolveSpell(draft.arcanum);if(!sp||Number(sp.level)!==arc)throw Error('Selecciona un Arcanum de nivel '+arc+'.');cs.arcanum||={};cs.arcanum[arc]=sp.name;sp.is_known=true;sp.is_equipped=true}
 }
 const maxSpellLevel=key==='Brujo'?Math.min(5,n>=9?5:n>=7?4:n>=5?3:n>=3?2:1):Math.max(0,...Object.entries(after.spellcasting||{}).filter(([k,v])=>k.startsWith('spell_slots_level_')&&v>0).map(([k])=>Number(k.split('_').pop())));
 const initiallyKnown=new Set(next.spells.filter(s=>s.is_known).map(s=>s.id));
 const selectedSpells=(draft.learn||[]).map(resolveSpell);
 if(selectedSpells.some(s=>!s))throw Error('Conjuro no encontrado.');
 if(selectedSpells.some(s=>Number(s.level)>maxSpellLevel||s.srd?.classes&&!s.srd.classes.some(cl=>cl.index===names[key]))&&!draft.dmOverride?.trim())throw Error('Un conjuro elegido no corresponde al nivel o clase. Registra la concesión del DM o cambia la selección.');
 const knownDelta=Number(after.spellcasting?.spells_known||0)-Number(before?.spellcasting?.spells_known||0);
 const normalKnown=['Brujo','Bardo','Hechicero','Explorador'].includes(key);
 const replacement=draft.forget?next.spells.find(s=>s.id===draft.forget):null;
 if(replacement&&(!initiallyKnown.has(replacement.id)||Number(replacement.level)===0||selectedSpells.some(s=>s.id===replacement.id)))throw Error('El conjuro a reemplazar debe estar conocido y ser distinto a los añadidos.');
 const newlyKnown=selectedSpells.filter(s=>!initiallyKnown.has(s.id)&&Number(s.level)>0).length;
 if(normalKnown&&newlyKnown!==Math.max(0,knownDelta)+(replacement?1:0)&&!draft.dmOverride?.trim())throw Error('Debes elegir '+(Math.max(0,knownDelta)+(replacement?1:0))+' conjuros de nivel 1 o superior para esta subida, o registrar un acuerdo del DM.');
 if(replacement){replacement.is_known=false;replacement.is_equipped=false}
 for(const sp of selectedSpells){
  if(!initiallyKnown.has(sp.id)&&!sp.mechanics){const match=catalog.spells.find(r=>r.index===sp.catalog_index||r.name.toLowerCase()===sp.name.toLowerCase()||sp.name.toLowerCase().includes('('+r.name.toLowerCase()+')'));if(match)sp.srd=clone(match);sp.mechanics={version:1,ability:abilities[key]||'int',pool:'auto',kind:match?.attack_type?'attack':match?.dc?'save':match?.heal_at_slot_level?'heal':'reference',source:labels[key]+' '+n}}
  sp.is_known=true;sp.is_equipped=true;
 }
 // Common class resource pools are updated without refreshing spent uses.
 cs.development.resources||=[];
 const reserve=(id,name,max,recovery)=>{let r=cs.development.resources.find(x=>x.id===id);if(r){r.max=max;r.used=Math.min(Number(r.used||0),max);r.recovery=recovery}else cs.development.resources.push({id,name,max,used:0,recovery,source:labels[key]+' '+n})};
 if(key==='Monje'&&n>=2)reserve('class-ki','Ki',n,'short');
 if(key==='Hechicero'&&n>=2)reserve('class-sorcery','Puntos de hechicería',n,'long');
 if(key==='Paladin')reserve('class-lay-hands','Imposición de manos · puntos',5*n,'long');
 if(key==='Barbaro')reserve('class-rage','Furia',after.class_specific?.rage_count||2,'long');
 if(key==='Bardo')reserve('class-inspiration','Inspiración bárdica',Math.max(1,mod(c.cha)),n>=5?'short':'long');
 if(key==='Guerrero'){reserve('class-second-wind','Tomar aliento',1,'short');if(n>=2)reserve('class-action-surge','Oleada de acción',n>=17?2:1,'short')}
 const savedChoices=clone(draft);delete savedChoices.base;delete savedChoices.invocationCatalog;
 const record={id:draft.id,from:oldTotal,to:c.level,class:key,hp,date:draft.date,dmOverride:draft.dmOverride||'',choices:savedChoices,features:gained.map(f=>f.name)};
 (cs.level_history||=[]).push(record);
 return{snapshot:next,record,hp,asi,newClassLevel:n,slots:slotMaximum(c),classProgression:after};
}
function resourceOptions(character,spell){
 const cs=character.combat_state||{},m=spell.mechanics||{},level=Number(spell.level)||0,options=[];
 if(m.requiresPreparation&&!m.prepared)return [];
 if(m.pool==='uses')return Number(m.used||0)<Number(m.max||0)?[{id:'uses',label:'Uso propio '+(m.max-m.used||m.max)+' / '+m.max,level:Number(m.castLevel||level)}]:[];
 if(m.pool==='resource'){
  const r=cs.development?.resources?.find(x=>x.id===m.resource);return r&&Number(r.max)-Number(r.used||0)>=Number(m.cost||1)?[{id:'resource:'+r.id,label:r.name,level:Number(m.castLevel||level)}]:[];
 }
 if(level===0||m.pool==='atwill')return[{id:'atwill',label:'A voluntad',level:Number(m.castLevel||level)}];
 if((cs.arcanum||{})[level]===spell.name&&!cs.arcanum_used?.[level])options.push({id:'arcanum',label:'Arcanum · uso propio',level});
 const warlock=Number(levels(character).Brujo||0),pactLevel=warlock>=9?5:warlock>=7?4:warlock>=5?3:warlock>=3?2:warlock?1:0,pactCount=warlock>=17?4:warlock>=11?3:warlock>=2?2:warlock?1:0;
 if(m.pool!=='standard'&&pactLevel>=level&&Number(character.spell_slots_used||0)<pactCount)options.push({id:'pact',label:'Pacto · nivel '+pactLevel,level:pactLevel});
 if(m.pool!=='pact')slotMaximum(character).forEach((max,i)=>{if(i+1>=level&&max>Number(cs.development?.spellSlotsUsed?.[i]||0))options.push({id:'slot:'+i,label:'Espacio nivel '+(i+1),level:i+1})});
 return options;
}
function spend(character,spell,option){
 const valid=resourceOptions(character,spell).find(x=>x.id===option);if(!valid)throw Error('El recurso ya no está disponible.');
 const c=clone(character),cs=c.combat_state,m=spell.mechanics||{};cs.development||={};
 if(option==='pact')c.spell_slots_used=Number(c.spell_slots_used||0)+1;
 else if(option.startsWith('slot:')){const i=Number(option.split(':')[1]);cs.development.spellSlotsUsed||=Array(9).fill(0);cs.development.spellSlotsUsed[i]=Number(cs.development.spellSlotsUsed[i]||0)+1}
 else if(option==='arcanum'){cs.arcanum_used||={};cs.arcanum_used[spell.level]=true}
 else if(option.startsWith('resource:')){const r=cs.development.resources.find(x=>x.id===m.resource);r.used=Number(r.used||0)+Number(m.cost||1)}
 return{character:c,spell:option==='uses'?{...clone(spell),mechanics:{...m,used:Number(m.used||0)+1}}:clone(spell),option:valid};
}
const api={names,labels,abilities,slots,clone,mod,prof,levels,row,classInfo,catalogSpell,prerequisites,slotMaximum,extraAttacks,choiceGroups,preview,resourceOptions,spend};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LiorCharacter=api;
})(typeof globalThis!=='undefined'?globalThis:this);
