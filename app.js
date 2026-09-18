/* =========================================================
   LIOR KUROGANE — MOTOR DINÁMICO D&D 5E & SUPABASE
========================================================= */

const SUPABASE_URL = "https://zfuwwtjjamxhpzukbaaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_1K4B3vdMrBSclaTet_thcg_5a1PmciM";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const OFFICIAL_ATTACKS_BASE = [
  { name: "Pistola del pacto", isPact: true, dmgDie: "1d10", dmgType: "Perforante (Distancia 30/90)" },
  { name: "Mosquete del pacto", isPact: true, dmgDie: "1d12", dmgType: "Perforante (Distancia 40/120)" },
  { name: "Arpón del pacto", isPact: true, dmgDie: "1d10", dmgType: "Penetrante (Reduce 10 ft vel)" },
  { name: "Espada larga platinada", isPact: false, dmgDie: "1d8", dmgType: "Cortante (Versátil 1d10)" },
  { name: "Daga", isPact: false, dmgDie: "1d4", dmgType: "Perforante (Sutil, Arrojadiza)" },
  { name: "Red", isPact: false, dmgDie: "—", dmgType: "Especial (Apresa objetivo)" },
  { name: "Descarga sobrenatural", isPact: false, isSpell: true, dmgDie: "1d10", dmgType: "Fuerza (120 ft)" }
];

const OFFICIAL_SPELLS = [
  { name: "Descarga sobrenatural", level: "Truco", isCantrip: true, time: "1 acción", range: "120 ft", duration: "Instantáneo", damage: "1d10 fuerza por haz", desc: "Rayos independientes por ataque mágico." },
  { name: "Luz", level: "Truco", isCantrip: true, time: "1 acción", range: "10 ft", duration: "1 hora", damage: "Utilidad", desc: "Objeto emite luz en 20 ft." },
  { name: "Mano de mago", level: "Truco", isCantrip: true, time: "1 acción", range: "30 ft", duration: "1 minuto", damage: "Utilidad", desc: "Manipula hasta 10 lb de peso." },
  { name: "Toque helado", level: "Truco", isCantrip: true, time: "1 acción", range: "120 ft", duration: "1 asalto", damage: "2d8 necrótico", desc: "Impide curación al objetivo." },
  { name: "Armadura de Agathys", level: "Nivel 3", isCantrip: false, time: "1 acción", range: "Personal", duration: "1 hora", damage: "15 frío al atacante", desc: "Otorga 15 PV temporales." },
  { name: "Escudo", level: "Nivel 1", isCantrip: false, time: "1 reacción", range: "Personal", duration: "1 asalto", damage: "+5 CA", desc: "+5 CA contra el ataque activador." },
  { name: "Infligir heridas (Lady D.)", level: "Nivel 1", isCantrip: false, time: "1 acción", range: "Toque", duration: "Instantáneo", damage: "3d10 necrótico", desc: "Regla casera de sufrimiento." },
  { name: "Maleficio (Hex)", level: "Nivel 1", isCantrip: false, time: "1 acción adicional", range: "90 ft", duration: "8 horas", damage: "+1d6 necrótico", desc: "Desventaja en 1 característica." },
  { name: "Susurros disonantes", level: "Nivel 1", isCantrip: false, time: "1 acción", range: "60 ft", duration: "Instantáneo", damage: "3d6 psíquico", desc: "Fuerza a huir con reacción." },
  { name: "Castigo marcador", level: "Nivel 2", isCantrip: false, time: "1 acción adicional", range: "Personal", duration: "1 minuto", damage: "+3d6 radiante", desc: "Anula invisibilidad." },
  { name: "Paso brumoso", level: "Nivel 2", isCantrip: false, time: "1 acción adicional", range: "Personal", duration: "Instantáneo", damage: "Teletransporte", desc: "Hasta 30 ft a espacio visible." },
  { name: "Arma elemental", level: "Nivel 3", isCantrip: false, time: "1 acción", range: "Toque", duration: "1 hora", damage: "+1 ataque / +1d4 daño", desc: "Vuelve mágica el arma." },
  { name: "Desplazamiento (Blink)", level: "Nivel 3", isCantrip: false, time: "1 acción", range: "Personal", duration: "1 minuto", damage: "Defensivo", desc: "1d20 con 11+ viaja al etéreo." }
];

const DND_SKILLS = [
  { name: "Acrobacias", stat: "dexterity" },
  { name: "Arcanos", stat: "intelligence" },
  { name: "Atletismo", stat: "strength" },
  { name: "Engañar", stat: "charisma" },
  { name: "Historia", stat: "intelligence" },
  { name: "Interpretación", stat: "charisma" },
  { name: "Intimidar", stat: "charisma" },
  { name: "Investigación", stat: "intelligence" },
  { name: "Juego de Manos", stat: "dexterity" },
  { name: "Medicina", stat: "wisdom" },
  { name: "Naturaleza", stat: "intelligence" },
  { name: "Percepción", stat: "wisdom" },
  { name: "Perspicacia", stat: "wisdom" },
  { name: "Persuasión", stat: "charisma" },
  { name: "Religión", stat: "intelligence" },
  { name: "Sigilo", stat: "dexterity" },
  { name: "Supervivencia", stat: "wisdom" },
  { name: "Trato con Animales", stat: "wisdom" }
];

const state = {
  character: null,
  equipment: [],
  notes: [],
  spellSlots: 2,
  pourcoonHp: 9,
  pourcoonMaxHp: 9,
  deaths: 4,
  stampRotations: {},
  combat: { hexblade_curse_active: false, elemental_weapon_active: false },
  noteFilter: 'all',
  activeModalSpell: null
};

const $ = (id) => document.getElementById(id);

function calcMod(score) { return Math.floor(((Number(score) || 10) - 10) / 2); }
function signed(num) { const n = Number(num) || 0; return n >= 0 ? `+${n}` : `${n}`; }
function calcProf(level) { return Math.floor(((Number(level) || 1) - 1) / 4) + 2; }
function escapeHTML(str) { return String(str ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

/* SÍNTESIS DE AUDIO: GRITO DE CELEBRACIÓN (WEB AUDIO API) */
function playVictoryCheer() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Tonos de fanfarria alegre en arpegio rápido ascendente
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
    });

    // Modulación que emula el grito ("¡Yaaay!")
    const cheerOsc = ctx.createOscillator();
    const cheerGain = ctx.createGain();
    cheerOsc.type = 'sawtooth';
    cheerOsc.frequency.setValueAtTime(600, ctx.currentTime + 0.35);
    cheerOsc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.7);

    cheerGain.gain.setValueAtTime(0, ctx.currentTime + 0.35);
    cheerGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.45);
    cheerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);

    cheerOsc.connect(cheerGain);
    cheerGain.connect(ctx.destination);
    cheerOsc.start(ctx.currentTime + 0.35);
    cheerOsc.stop(ctx.currentTime + 1.0);
  } catch (err) {
    console.warn("Audio no disponible:", err);
  }
}

/* NAVEGACIÓN ENTRE PESTAÑAS */
function setupTabs() {
  document.querySelectorAll(".sheet-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sheet-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      $(target)?.classList.add("active");
    });
  });
}

/* CARGA INICIAL */
async function loadAll() {
  state.character = {
    id: "lior-kurogane",
    name: "Lior Kurogane",
    class_level: 6,
    max_hp: 48,
    current_hp: 48,
    strength: 13,
    dexterity: 15,
    constitution: 15,
    intelligence: 13,
    wisdom: 13,
    charisma: 20,
    speed: 30,
    gold: 599,
    silver: 99,
    copper: 15
  };

  try {
    const { data } = await db.from("characters").select("*").eq("name", "Lior Kurogane").maybeSingle();
    if (data) {
      state.character = { ...state.character, ...data };
      state.character.max_hp = data.max_hp ?? 48;
      state.character.current_hp = data.current_hp ?? 48;
      state.deaths = data.deaths ?? 4;
      state.spellSlots = data.spell_slots_level_3 ?? 2;
    }
  } catch (err) {
    console.warn("Usando datos locales:", err);
  }

  state.equipment = [
    { id: "eq-1", name: "Daga", location: "equipped", quantity: 1, type: "weapon" },
    { id: "eq-2", name: "Pistola del pacto", location: "equipped", quantity: 1, type: "weapon" },
    { id: "eq-3", name: "Arpón del pacto", location: "equipped", quantity: 1, type: "weapon" },
    { id: "eq-4", name: "Casco del arrecife", location: "equipped", quantity: 1, type: "item" },
    { id: "eq-5", name: "Mosquete del pacto", location: "equipped", quantity: 1, type: "weapon" },
    { id: "eq-6", name: "Red", location: "equipped", quantity: 1, type: "weapon" },
    { id: "eq-7", name: "Coraza", location: "carried", quantity: 1, type: "armor", baseAC: 14, maxDex: 2 },
    { id: "eq-8", name: "Broquel", location: "carried", quantity: 1, type: "shield", bonusAC: 2 },
    { id: "eq-9", name: "Espada larga platinada", location: "stored", quantity: 1, type: "weapon" },
    { id: "eq-10", name: "Herramientas de navegante", location: "carried", quantity: 1, type: "tool" },
    { id: "eq-11", name: "Paquete de explorador", location: "carried", quantity: 1, type: "item" },
    { id: "eq-12", name: "Kit de curación (10 usos)", location: "carried", quantity: 1, type: "item" },
    { id: "eq-13", name: "Suministros de alquimista", location: "carried", quantity: 1, type: "tool" },
    { id: "eq-14", name: "Pipa de la remembranza", location: "carried", quantity: 1, type: "item" },
    { id: "eq-15", name: "Poción 6 × 2d4 + 2", location: "carried", quantity: 1, type: "potion" },
    { id: "eq-16", name: "Poción 4d4 + 4", location: "carried", quantity: 1, type: "potion" },
    { id: "eq-17", name: "Pergamino de Ola Atronadora", location: "carried", quantity: 1, type: "scroll" }
  ];

  renderAll();
}

/* TARJETA DE FIDELIDAD DE MUERTES (10 SELLOS CON LOGO Y CELEBRACIÓN) */
function renderLoyaltyCard() {
  const container = $("loyaltySlotsContainer");
  $("deathLoyaltyCount").textContent = state.deaths;
  
  let html = "";
  for (let i = 1; i <= 10; i++) {
    const isStamped = i <= state.deaths;
    
    if (isStamped && !state.stampRotations[i]) {
      state.stampRotations[i] = Math.floor(Math.random() * 91) - 45;
    }

    const rot = state.stampRotations[i] || 0;

    html += `
      <div class="loyalty-slot" onclick="toggleDeathStamp(${i})">
        ${isStamped 
          ? `<img src="logo.png" class="stamp-img" style="transform: rotate(${rot}deg);" alt="Sello">` 
          : `<span class="slot-number">${i}</span>`}
      </div>
    `;
  }
  container.innerHTML = html;
}

window.toggleDeathStamp = async function(slotNum) {
  if (slotNum === state.deaths) {
    state.deaths = slotNum - 1;
    delete state.stampRotations[slotNum];
  } else {
    state.deaths = slotNum;
    state.stampRotations[slotNum] = Math.floor(Math.random() * 91) - 45;
  }

  renderLoyaltyCard();

  if (state.deaths === 10) {
    playVictoryCheer();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }

  try {
    await db.from("characters").update({ deaths: state.deaths }).eq("name", "Lior Kurogane");
  } catch (e) {
    console.warn("Guardado local de muertes:", e);
  }
};

/* CÁLCULO DE CA */
function calculateAC() {
  const dexMod = calcMod(state.character.dexterity);
  const equippedArmor = state.equipment.find(i => i.type === 'armor' && i.location === 'equipped');
  const equippedShield = state.equipment.find(i => i.type === 'shield' && i.location === 'equipped');

  let baseAC = 10 + dexMod;

  if (equippedArmor) {
    const allowedDex = equippedArmor.maxDex !== undefined ? Math.min(dexMod, equippedArmor.maxDex) : dexMod;
    baseAC = (equippedArmor.baseAC || 14) + allowedDex;
  }

  if (equippedShield) {
    baseAC += (equippedShield.bonusAC || 2);
  }

  return baseAC;
}

/* ATAQUES */
function renderAttacks() {
  const tbody = $("attacksTableBody");
  const c = state.character;
  const prof = calcProf(c.class_level);
  const chaMod = calcMod(c.charisma);
  const dexMod = calcMod(c.dexterity);
  const strMod = calcMod(c.strength);

  tbody.innerHTML = OFFICIAL_ATTACKS_BASE.map(atk => {
    let bonus = 0;
    let damageText = atk.dmgDie;

    if (atk.name === "Red") {
      bonus = prof + dexMod;
      damageText = "—";
    } else if (atk.name === "Descarga sobrenatural") {
      bonus = prof + chaMod;
      damageText = `${atk.dmgDie} (2 rayos)`;
    } else if (atk.isPact) {
      bonus = prof + chaMod + 1;
      let dmgBonus = chaMod + 1;
      if (state.combat.elemental_weapon_active) {
        bonus += 1;
        damageText = `${atk.dmgDie} + ${dmgBonus} + 1d4 elem`;
      } else {
        damageText = `${atk.dmgDie} + ${dmgBonus}`;
      }
    } else if (atk.name === "Espada larga platinada") {
      bonus = prof + strMod + 1;
      damageText = `${atk.dmgDie} + ${strMod + 1}`;
    } else if (atk.name === "Daga") {
      bonus = prof + dexMod;
      damageText = `${atk.dmgDie} + ${dexMod}`;
    }

    return `
      <tr onclick="rollAttack('${atk.name}', ${bonus}, '${damageText}', '${atk.dmgDie}')">
        <td><strong>${atk.name}</strong></td>
        <td><b style="color:var(--bronze);">${signed(bonus)}</b></td>
        <td>${damageText}</td>
        <td><small style="color:var(--muted);">${atk.dmgType}</small></td>
      </tr>
    `;
  }).join("");
}

function rollAttack(name, bonus, damageText, dmgDie) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const isCrit = (state.combat.hexblade_curse_active && d20 >= 19) || d20 === 20;
  const total = d20 + bonus;

  const box = $("rollResultBox");
  box.style.display = "block";
  $("rollSkillTitle").textContent = `ATAQUE: ${name.toUpperCase()}`;
  $("rollMath").textContent = isCrit ? `¡CRÍTICO! (${total})` : `Impacto: ${total}`;
  $("rollDetail").textContent = `d20 (${d20}) + ${bonus} | Daño: ${damageText} ${isCrit ? `· ¡Crítico duplica los dados (${dmgDie})!` : ''}`;
}

/* TIRADAS DE SALVACIÓN INTERACTIVAS */
window.rollSavingThrow = function(statName, bonus) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + bonus;
  const box = $("rollResultBox");
  box.style.display = "block";
  $("rollSkillTitle").textContent = `SALVACIÓN: ${statName.toUpperCase()}`;
  $("rollMath").textContent = `Resultado: ${total}`;
  $("rollDetail").textContent = `d20 (${d20}) + bono (${signed(bonus)})`;
};

/* RENDER DE DERIVADOS Y SALVACIONES */
function renderDerived() {
  const c = state.character;
  const level = c.class_level;
  const prof = calcProf(level);
  
  const mods = {
    strength: calcMod(c.strength),
    dexterity: calcMod(c.dexterity),
    constitution: calcMod(c.constitution),
    intelligence: calcMod(c.intelligence),
    wisdom: calcMod(c.wisdom),
    charisma: calcMod(c.charisma)
  };

  $("headerLevel").textContent = level;
  $("levelValueDisplay").textContent = level;
  $("profDisplay").textContent = prof;
  $("guideProfDmg").textContent = prof;
  $("curseDmgBonus").textContent = prof;
  $("curseHealBonus").textContent = level + mods.charisma;

  const currentAC = calculateAC();
  $("combatAC").textContent = currentAC;
  $("combatInit").textContent = signed(mods.dexterity);

  Object.keys(mods).forEach(s => {
    $(`score_${s}`).value = c[s];
    $(`mod_${s}`).textContent = signed(mods[s]);
  });

  // Actualizar valores de salvaciones en el HTML
  if ($("st_fue_val")) $("st_fue_val").textContent = signed(mods.strength);
  if ($("st_des_val")) $("st_des_val").textContent = signed(mods.dexterity);
  if ($("st_con_val")) $("st_con_val").textContent = signed(mods.constitution);
  if ($("st_int_val")) $("st_int_val").textContent = signed(mods.intelligence);
  if ($("st_sab_val")) $("st_sab_val").textContent = signed(mods.wisdom + prof);
  if ($("st_car_val")) $("st_car_val").textContent = signed(mods.charisma + prof);

  // Habilidades
  const proficientSkills = ["atletismo", "percepción", "religión"];
  const expertiseSkills = ["engañar"];
  $("fullSkillsList").innerHTML = DND_SKILLS.map(sk => {
    const key = sk.name.toLowerCase();
    let total = mods[sk.stat];
    let mark = "";
    if (expertiseSkills.includes(key)) { total += prof * 2; mark = " ✦✦"; }
    else if (proficientSkills.includes(key)) { total += prof; mark = " ✦"; }

    return `
      <div onclick="rollSkillCheck('${sk.name}', ${total})" style="cursor:pointer;">
        <span>${sk.name}${mark} <small style="color:var(--muted)">(${sk.stat.substring(0,3).toUpperCase()})</small></span>
        <b>${signed(total)}</b>
      </div>
    `;
  }).join("");

  $("magicDCDisplay").textContent = 8 + prof + mods.charisma;
  $("magicAtkDisplay").textContent = signed(prof + mods.charisma);

  renderCompanions();
  renderAttacks();
}

function rollSkillCheck(name, bonus) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + bonus;
  const box = $("rollResultBox");
  box.style.display = "block";
  $("rollSkillTitle").textContent = `PRUEBA: ${name.toUpperCase()}`;
  $("rollMath").textContent = `Resultado: ${total}`;
  $("rollDetail").textContent = `d20 (${d20}) + bono (${signed(bonus)})`;
}

window.stepLevel = function(delta) {
  state.character.class_level = Math.max(1, Math.min(20, state.character.class_level + delta));
  renderDerived();
};

window.stepStat = function(stat, delta) {
  state.character[stat] = Math.max(1, Math.min(30, state.character[stat] + delta));
  renderDerived();
};

/* INVENTARIO */
function renderEquipment() {
  $("equipmentListCategorized").innerHTML = state.equipment.map(item => `
    <div class="item-row">
      <div style="flex:1;">
        <strong>${escapeHTML(item.name)}</strong>
        <small style="color:var(--muted);">Cantidad: ${item.quantity} ${item.type === 'armor' ? '(Armadura)' : (item.type === 'shield' ? '(Escudo)' : '')}</small>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button class="secondary-action ${item.location === 'equipped' ? 'active' : ''}" onclick="cycleItem('${item.id}')">
          ${item.location === 'equipped' ? '⚔ Equipado' : (item.location === 'stored' ? '📦 Almacenado' : '🎒 Cargado')}
        </button>
        <button class="tiny-button" style="color:var(--danger); font-size:16px; padding:4px 6px;" onclick="deleteItem('${item.id}')" title="Eliminar objeto">✕</button>
      </div>
    </div>
  `).join("");
}

window.cycleItem = function(id) {
  const item = state.equipment.find(i => i.id === id);
  if (!item) return;
  const states = ['equipped', 'carried', 'stored'];
  item.location = states[(states.indexOf(item.location) + 1) % states.length];
  renderEquipment();
  renderDerived();
};

window.deleteItem = function(id) {
  if (!confirm("¿Deseas eliminar este objeto del inventario?")) return;
  state.equipment = state.equipment.filter(i => i.id !== id);
  renderEquipment();
  renderDerived();
};

/* CONJUROS */
function renderSpells() {
  $("magicSlotDisplay").textContent = `${state.spellSlots} / 2`;
  $("spellsFullList").innerHTML = OFFICIAL_SPELLS.map((sp, idx) => `
    <div class="item-row" onclick="openSpellModal(${idx})" style="cursor:pointer;">
      <div>
        <strong>${sp.name}</strong>
        <small style="color:var(--muted);">${sp.time} · ${sp.range}</small>
      </div>
      <span class="tag">${sp.level}</span>
    </div>
  `).join("");
}

window.openSpellModal = function(idx) {
  const sp = OFFICIAL_SPELLS[idx];
  state.activeModalSpell = sp;
  $("modalSpellName").textContent = sp.name;
  $("modalSpellLevel").textContent = sp.level;
  $("modalSpellTime").textContent = sp.time;
  $("modalSpellRange").textContent = sp.range;
  $("modalSpellDuration").textContent = sp.duration;
  $("modalSpellEffect").innerHTML = `<b>Efecto:</b> ${sp.damage}<br><br>${sp.desc}`;

  const btn = $("modalCastSpellBtn");
  if (sp.isCantrip) {
    btn.textContent = "Lanzar Truco (Sin Coste)";
    btn.disabled = false;
  } else {
    btn.textContent = `Lanzar (${state.spellSlots}/2 Espacios)`;
    btn.disabled = state.spellSlots <= 0;
  }

  $("spellModal").classList.add("active");
};

window.closeSpellModal = function(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  $("spellModal").classList.remove("active");
  state.activeModalSpell = null;
};

async function castModalSpell() {
  const sp = state.activeModalSpell;
  if (!sp) return;
  if (!sp.isCantrip) {
    if (state.spellSlots <= 0) return alert("Sin espacios de pacto disponibles.");
    state.spellSlots--;
    renderSpells();
    try {
      await db.from("characters").update({ spell_slots_level_3: state.spellSlots }).eq("name", "Lior Kurogane");
    } catch (e) {
      console.warn("Descuento local:", e);
    }
  }
  alert(`¡Has lanzado ${sp.name}!`);
  closeSpellModal();
}

/* RASGOS */
function renderFeats() {
  $("racialTraitsList").innerHTML = `
    <div class="item-row"><strong>Resistencia Celestial</strong><span>Resistencia a daño necrótico y radiante.</span></div>
    <div class="item-row"><strong>Manos Curativas</strong><span>Acción: sana ${state.character.class_level} PV (1/descanso largo).</span></div>
    <div class="item-row"><strong>Mortaja Necrótica</strong><span>Acción: alas esqueléticas, asusta en 10 ft y suma +${state.character.class_level} daño necrótico.</span></div>
  `;

  $("classTraitsList").innerHTML = `
    <div class="item-row"><strong>Guerrero Maléfico</strong><span>Usa Carisma (+5) para atacar y dañar con armas del pacto.</span></div>
    <div class="item-row"><strong>Maldición del Filo Maléfico</strong><span>Crítico 19-20, +${calcProf(state.character.class_level)} daño y cura ${state.character.class_level + calcMod(state.character.charisma)} PV al morir.</span></div>
    <div class="item-row"><strong>Espectro Maldito</strong><span>Al matar a un humanoide, alza su espectro con ${Math.floor(state.character.class_level / 2)} PV temp.</span></div>
  `;

  $("customTraitsList").innerHTML = `
    <div class="item-row"><strong>Toque Feérico (Dote)</strong><span>Aprende Paso Brumoso y Susurros Disonantes.</span></div>
    <div class="item-row"><strong>Marca de Lady D. (Regla DM)</strong><span>Otorga Infligir Heridas a cambio de dolor físico.</span></div>
  `;

  $("invocationsFullList").innerHTML = `
    <div class="item-row"><strong>Arma de Pacto Mejorada</strong><span>+1 a ataque y daño, foco de conjuros.</span></div>
    <div class="item-row"><strong>Castigo Arcano (Eldritch Smite)</strong><span>Gasta slot para +4d8 fuerza y derriba.</span></div>
    <div class="item-row"><strong>Filo Sediento (Thirsting Blade)</strong><span>2 ataques con arma de pacto.</span></div>
  `;
}

/* COMPAÑEROS */
function renderCompanions() {
  $("pourcoonHpDisplay").textContent = `${state.pourcoonHp} / ${state.pourcoonMaxHp}`;
  const specterHp = Math.floor(state.character.class_level / 2);
  $("specterHpDisplay").textContent = `${specterHp} PV`;
  $("specterFormulaText").textContent = `${specterHp} PV`;
  $("specterAtkBonus").textContent = signed(calcMod(state.character.charisma));
  $("specterModText").textContent = signed(calcMod(state.character.charisma));
}

/* ACTUALIZACIÓN VISUAL FORZADA DE PUNTOS DE VIDA */
function updateHPUI() {
  const current = Number(state.character.current_hp) || 0;
  const max = Number(state.character.max_hp) || 48;
  
  $("hpValue").textContent = `${current} / ${max}`;
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  $("hpBar").style.width = `${pct}%`;
}

/* DESCANSOS (RESTABLECIMIENTO COMPLETO DE VIDA) */
function setupRests() {
  // Descanso Corto
  const triggerShortRest = async () => {
    state.spellSlots = 2;
    state.combat.hexblade_curse_active = false;
    state.combat.elemental_weapon_active = false;
    
    document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
      btn.classList.remove("active");
      const key = btn.dataset.combatToggle;
      state.combat[key] = false;
      const check = $(`check_${key}`);
      if (check) check.textContent = "○";
    });

    renderSpells();
    renderAttacks();

    try {
      await db.from("characters").update({ spell_slots_level_3: 2 }).eq("name", "Lior Kurogane");
    } catch (e) {
      console.warn("Guardado local:", e);
    }

    alert("⏳ Descanso Corto completado:\n• Espacios de pacto restaurados a 2/2.");
  };

  $("btnShortRest").addEventListener("click", triggerShortRest);
  $("btnMagicShortRest").addEventListener("click", triggerShortRest);

  // Descanso Largo
  $("btnLongRest").addEventListener("click", async () => {
    if (!confirm("¿Deseas iniciar un Descanso Largo (8 horas)? Se recuperará toda tu vida (48/48) y tus espacios de pacto.")) return;

    // 1. Restaurar vida obligatoriamente al máximo
    state.character.current_hp = state.character.max_hp;
    state.spellSlots = 2;
    state.pourcoonHp = state.pourcoonMaxHp;
    
    // 2. Apagar estados de combate activos
    document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
      btn.classList.remove("active");
      const key = btn.dataset.combatToggle;
      state.combat[key] = false;
      const check = $(`check_${key}`);
      if (check) check.textContent = "○";
    });

    // 3. Forzar redibujado síncrono inmediato en la interfaz
    updateHPUI();
    renderSpells();
    renderCompanions();
    renderAttacks();

    // 4. Actualizar base de datos
    try {
      await db.from("characters").update({ 
        current_hp: state.character.max_hp, 
        spell_slots_level_3: 2 
      }).eq("name", "Lior Kurogane");
    } catch (e) {
      console.warn("Guardado local:", e);
    }

    alert("⛺ Descanso Largo completado:\n• Vida restaurada al 100% (48/48 PV).\n• Espacios de pacto restaurados (2/2).\n• Salud de Pourcoon recuperada.");
  });
}

function setupCombatToggles() {
  document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.combatToggle;
      state.combat[key] = !state.combat[key];
      btn.classList.toggle("active", state.combat[key]);
      const check = $(`check_${key}`);
      if (check) check.textContent = state.combat[key] ? "✓" : "○";
      renderAttacks();
    });
  });

  $("hpMinusBtn").addEventListener("click", async () => {
    state.character.current_hp = Math.max(0, state.character.current_hp - 1);
    updateHPUI();
    try {
      await db.from("characters").update({ current_hp: state.character.current_hp }).eq("name", "Lior Kurogane");
    } catch (e) {
      console.warn("Guardado local:", e);
    }
  });

  $("hpPlusBtn").addEventListener("click", async () => {
    state.character.current_hp = Math.min(state.character.max_hp, state.character.current_hp + 1);
    updateHPUI();
    try {
      await db.from("characters").update({ current_hp: state.character.current_hp }).eq("name", "Lior Kurogane");
    } catch (e) {
      console.warn("Guardado local:", e);
    }
  });

  $("btnPourcoonHpMinus").addEventListener("click", () => { state.pourcoonHp = Math.max(0, state.pourcoonHp - 1); renderCompanions(); });
  $("btnPourcoonHpPlus").addEventListener("click", () => { state.pourcoonHp = Math.min(9, state.pourcoonHp + 1); renderCompanions(); });
  $("btnPourcoonReset").addEventListener("click", () => { state.pourcoonHp = 9; renderCompanions(); });

  $("addItemBtn").addEventListener("click", () => {
    const name = $("newItemName").value.trim();
    const qty = Number($("newItemQty").value) || 1;
    if (!name) return;

    let type = 'item';
    let baseAC, maxDex, bonusAC;
    const lower = name.toLowerCase();

    if (lower.includes('escudo') || lower.includes('broquel')) {
      type = 'shield';
      bonusAC = 2;
    } else if (lower.includes('coraza') || lower.includes('armadura')) {
      type = 'armor';
      baseAC = 14;
      maxDex = 2;
    }

    state.equipment.push({
      id: `eq-${Date.now()}`,
      name,
      quantity: qty,
      location: 'carried',
      type,
      baseAC,
      maxDex,
      bonusAC
    });

    $("newItemName").value = "";
    $("newItemQty").value = 1;
    renderEquipment();
    renderDerived();
  });
}

function renderAll() {
  updateHPUI();
  renderLoyaltyCard();
  renderDerived();
  renderFeats();
  renderEquipment();
  renderSpells();
  renderCompanions();
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupCombatToggles();
  setupRests();
  $("modalCastSpellBtn").addEventListener("click", castModalSpell);
  loadAll();
});