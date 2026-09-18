/* =========================================================
   LIOR KUROGANE — MOTOR COMPLETO D&D 5E & SUPABASE
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
  deathSuccesses: 0,
  deathFailures: 0,
  healingHandsUsed: false,
  combat: {
    hexblade_curse_active: false,
    elemental_weapon_active: false
  },
  noteFilter: "all",
  activeModalSpell: null
};

const $ = (id) => document.getElementById(id);

function calcMod(score) { return Math.floor(((Number(score) || 10) - 10) / 2); }
function signed(num) { const n = Number(num) || 0; return n >= 0 ? `+${n}` : `${n}`; }
function calcProf(level) { return Math.floor(((Number(level) || 1) - 1) / 4) + 2; }
function escapeHTML(str) { return String(str ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function safeSetText(id, val) { const el = $(id); if (el) el.textContent = val; }

/* NAVEGACIÓN */
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

/* AUDIO CELEBRACIÓN GRUNT */
function playGruntCheer() {
  try {
    const audio = new Audio("https://www.myinstants.com/media/sounds/grunt-birthday-party.mp3");
    audio.volume = 0.85;
    audio.play().catch(() => playSynthCheer());
  } catch (e) {
    playSynthCheer();
  }
}

function playSynthCheer() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.85);
    });
  } catch (err) {}
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
    const { data, error } = await db
      .from("characters")
      .select("*")
      .eq("name", "Lior Kurogane")
      .maybeSingle();

    if (error) throw error;
    if (data) {
      state.character = { ...state.character, ...data };
      state.character.max_hp = data.max_hp ?? 48;
      state.character.current_hp = data.current_hp ?? 48;
      state.deaths = data.deaths ?? 4;
      state.spellSlots = data.spell_slots_level_3 ?? 2;
    }
  } catch (err) {
    console.warn("Usando respaldo local:", err);
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

/* =========================================================
   PUNTOS DE GOLPE
========================================================= */
function updateHPUI() {
  if (!state.character) return;
  const cur = Number(state.character.current_hp);
  const max = Number(state.character.max_hp) || 48;

  safeSetText("hpValue", `${cur} / ${max}`);
  const bar = $("hpBar");
  if (bar) {
    const percentage = Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
    bar.style.width = `${percentage}%`;
  }
}

async function modifyHP(delta) {
  if (!state.character) return;
  const current = Number(state.character.current_hp) || 0;
  const max = Number(state.character.max_hp) || 48;
  const next = Math.max(0, Math.min(max, current + delta));

  state.character.current_hp = next;
  updateHPUI();

  try {
    await db.from("characters").update({ current_hp: next }).eq("name", "Lior Kurogane");
  } catch (e) {
    console.warn("Guardado local de PV:", e);
  }
}

/* =========================================================
   DEATH SAVES
========================================================= */
function renderDeathSaves() {
  for (let i = 1; i <= 3; i++) {
    const succ = $(`succ_${i}`);
    const fail = $(`fail_${i}`);
    if (succ) succ.classList.toggle("filled", i <= state.deathSuccesses);
    if (fail) fail.classList.toggle("filled", i <= state.deathFailures);
  }
}

window.toggleDeathDot = function(type, index) {
  if (type === 'success') {
    state.deathSuccesses = (state.deathSuccesses === index) ? index - 1 : index;
  } else {
    state.deathFailures = (state.deathFailures === index) ? index - 1 : index;
  }
  renderDeathSaves();
  checkDeathSavesCondition();
};

window.resetDeathSaves = function() {
  state.deathSuccesses = 0;
  state.deathFailures = 0;
  renderDeathSaves();
};

window.rollDeathSave = function() {
  if (state.deathSuccesses >= 3 || state.deathFailures >= 3) {
    alert("Las tiradas de salvación contra muerte ya terminaron. Usa 'Limpiar' para reiniciar.");
    return;
  }

  const d20 = Math.floor(Math.random() * 20) + 1;
  const box = $("rollResultBox");
  if (box) box.style.display = "block";

  safeSetText("rollSkillTitle", "SALVACIÓN CONTRA LA MUERTE");

  if (d20 === 20) {
    state.character.current_hp = 1;
    state.deathSuccesses = 0;
    state.deathFailures = 0;
    updateHPUI();
    renderDeathSaves();
    safeSetText("rollMath", "¡20 NATURAL!");
    safeSetText("rollDetail", "¡Milagro! Recuperas la consciencia inmediatamente con 1 PV.");
    return;
  } else if (d20 === 1) {
    state.deathFailures = Math.min(3, state.deathFailures + 2);
    safeSetText("rollMath", "¡PIFIA! (1 Natural)");
    safeSetText("rollDetail", "Fallo crítico: Recibes 2 fallos automáticos.");
  } else if (d20 >= 10) {
    state.deathSuccesses = Math.min(3, state.deathSuccesses + 1);
    safeSetText("rollMath", `Éxito (${d20})`);
    safeSetText("rollDetail", "Tirada de 10 o superior: Sumas 1 éxito.");
  } else {
    state.deathFailures = Math.min(3, state.deathFailures + 1);
    safeSetText("rollMath", `Fallo (${d20})`);
    safeSetText("rollDetail", "Tirada de 9 o inferior: Sumas 1 fallo.");
  }

  renderDeathSaves();
  checkDeathSavesCondition();
};

function checkDeathSavesCondition() {
  if (state.deathSuccesses >= 3) {
    alert("✨ ¡Estabilizado! Has acumulado 3 éxitos. Tu personaje está seguro a 0 PV.");
  } else if (state.deathFailures >= 3) {
    alert("☠ Has acumulado 3 fallos: Lior ha muerto. Se añadirá un sello a tu Tarjeta de Lealtad.");
    window.toggleDeathStamp(Math.min(10, state.deaths + 1));
    state.deathSuccesses = 0;
    state.deathFailures = 0;
    renderDeathSaves();
  }
}

/* =========================================================
   TARJETA DE FIDELIDAD DE MUERTES
========================================================= */
function renderLoyaltyCard() {
  const container = $("loyaltySlotsContainer");
  if (!container) return;

  safeSetText("deathLoyaltyCount", state.deaths);

  let html = "";
  for (let i = 1; i <= 10; i++) {
    const isStamped = i <= state.deaths;
    if (isStamped && !state.stampRotations[i]) {
      state.stampRotations[i] = Math.floor(Math.random() * 91) - 45;
    }
    const rot = state.stampRotations[i] || 0;

    html += `
      <div class="loyalty-slot" onclick="toggleDeathStamp(${i})" title="Sello ${i}">
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
    playGruntCheer();
    if (typeof confetti === "function") {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }

  try {
    await db.from("characters").update({ deaths: state.deaths }).eq("name", "Lior Kurogane");
  } catch (e) {
    console.warn("Guardado local muertes:", e);
  }
};

/* =========================================================
   CA CON DESGLOSE
========================================================= */
function calculateACDetails() {
  const dexMod = calcMod(state.character.dexterity);
  const equippedArmor = state.equipment.find(i => i.type === 'armor' && i.location === 'equipped');
  const equippedShield = state.equipment.find(i => i.type === 'shield' && i.location === 'equipped');

  let totalAC = 10 + dexMod;
  let breakdown = `Base 10 + DES (${signed(dexMod)})`;

  if (equippedArmor) {
    const allowedDex = equippedArmor.maxDex !== undefined ? Math.min(dexMod, equippedArmor.maxDex) : dexMod;
    totalAC = (equippedArmor.baseAC || 14) + allowedDex;
    breakdown = `${equippedArmor.name} (${equippedArmor.baseAC}) + DES (${signed(allowedDex)})`;
  }

  if (equippedShield) {
    totalAC += (equippedShield.bonusAC || 2);
    breakdown += ` + ${equippedShield.name} (+${equippedShield.bonusAC || 2})`;
  }

  return { totalAC, breakdown };
}

/* =========================================================
   ATAQUES
========================================================= */
function renderAttacks() {
  const tbody = $("attacksTableBody");
  if (!tbody || !state.character) return;

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

    const safeName = escapeHTML(atk.name);
    const safeDamage = escapeHTML(damageText);
    const safeDie = escapeHTML(atk.dmgDie);
    const safeType = escapeHTML(atk.dmgType);

    return `
      <tr onclick="rollAttack('${safeName.replaceAll("'", "\\'")}', ${bonus}, '${safeDamage.replaceAll("'", "\\'")}', '${safeDie.replaceAll("'", "\\'")}')">
        <td><strong>${safeName}</strong></td>
        <td><b style="color:var(--bronze);">${signed(bonus)}</b></td>
        <td>${damageText}</td>
        <td><small style="color:var(--muted);">${safeType}</small></td>
      </tr>
    `;
  }).join("");
}

window.rollAttack = function(name, bonus, damageText, dmgDie) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const isCrit = (state.combat.hexblade_curse_active && d20 >= 19) || d20 === 20;
  const total = d20 + Number(bonus);

  const box = $("rollResultBox");
  if (!box) return;

  box.style.display = "block";
  safeSetText("rollSkillTitle", `ATAQUE: ${name.toUpperCase()}`);
  safeSetText("rollMath", isCrit ? `¡CRÍTICO! (${total})` : `Impacto: ${total}`);
  safeSetText("rollDetail", `d20 (${d20}) + ${bonus} | Daño: ${damageText}${isCrit ? ` · ¡Crítico duplica dados (${dmgDie})!` : ''}`);
};

/* =========================================================
   DERIVADOS Y RASGOS PRÁCTICOS
========================================================= */
function renderDerived() {
  const c = state.character;
  if (!c) return;

  const level = Number(c.class_level) || 1;
  const prof = calcProf(level);

  const mods = {
    strength: calcMod(c.strength),
    dexterity: calcMod(c.dexterity),
    constitution: calcMod(c.constitution),
    intelligence: calcMod(c.intelligence),
    wisdom: calcMod(c.wisdom),
    charisma: calcMod(c.charisma)
  };

  safeSetText("headerLevel", level);
  safeSetText("levelValueDisplay", level);
  safeSetText("profDisplay", prof);
  safeSetText("guideProfDmg", prof);
  safeSetText("curseDmgBonus", prof);
  safeSetText("curseHealBonus", level + mods.charisma);

  // Valores interactivos en Rasgos
  safeSetText("necroticDcDisplay", 8 + prof + mods.charisma);
  safeSetText("necroticDmgDisplay", level);
  safeSetText("healingHandsValue", level);

  const acInfo = calculateACDetails();
  safeSetText("combatAC", acInfo.totalAC);
  safeSetText("acBreakdownText", acInfo.breakdown);
  safeSetText("combatInit", signed(mods.dexterity));

  Object.keys(mods).forEach(stat => {
    const input = $(`score_${stat}`);
    const modDisplay = $(`mod_${stat}`);
    if (input) input.value = c[stat];
    if (modDisplay) modDisplay.textContent = signed(mods[stat]);
  });

  const proficientSkills = ["atletismo", "percepción", "religión"];
  const expertiseSkills = ["engañar"];
  const skillsContainer = $("fullSkillsList");

  if (skillsContainer) {
    skillsContainer.innerHTML = DND_SKILLS.map(skill => {
      const key = skill.name.toLowerCase();
      let total = mods[skill.stat];
      let mark = "";

      if (expertiseSkills.includes(key)) {
        total += prof * 2;
        mark = " ✦✦";
      } else if (proficientSkills.includes(key)) {
        total += prof;
        mark = " ✦";
      }

      return `
        <div onclick="rollSkillCheck('${escapeHTML(skill.name).replaceAll("'", "\\'")}', ${total})">
          <span>${escapeHTML(skill.name)}${mark} <small style="color:var(--muted)">(${skill.stat.substring(0,3).toUpperCase()})</small></span>
          <b>${signed(total)}</b>
        </div>
      `;
    }).join("");
  }

  safeSetText("magicDCDisplay", 8 + prof + mods.charisma);
  safeSetText("magicAtkDisplay", signed(prof + mods.charisma));

  renderCompanions();
  renderAttacks();
  renderDeathSaves();
}

window.rollSkillCheck = function(name, bonus) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + Number(bonus);

  const box = $("rollResultBox");
  if (!box) return;

  box.style.display = "block";
  safeSetText("rollSkillTitle", `PRUEBA: ${name.toUpperCase()}`);
  safeSetText("rollMath", `Resultado: ${total}`);
  safeSetText("rollDetail", `d20 (${d20}) + bono (${signed(bonus)})`);
};

/* =========================================================
   ACCIONES DIRECTAS DE RASGOS (SOCIAL & UTILIDAD)
========================================================= */
window.useTraitAction = function(type) {
  if (type === 'passage') {
    alert("⚓ Pasaje Marítimo Activado:\nPuedes asegurar viaje gratuito para el grupo en cualquier embarcación bajo las condiciones del DM, a cambio de que sirvan a la tripulación durante la travesía.");
  }
};

window.useNecroticShroud = function() {
  const prof = calcProf(state.character.class_level);
  const chaMod = calcMod(state.character.charisma);
  const dc = 8 + prof + chaMod;
  const dmg = state.character.class_level;

  alert(`💀 Mortaja Necrótica Activada (1 minuto):\n• Criaturas a 10 pies deben superar salvación de CARISMA (CD ${dc}) o quedarán asustadas hasta el final de tu próximo turno.\n• Una vez por turno, infliges +${dmg} de daño necrótico adicional al dañar a un objetivo.`);
};

window.useHealingHands = function() {
  if (state.healingHandsUsed) {
    alert("Ya utilizaste Manos Curativas hoy. Se restaura con un Descanso Largo.");
    return;
  }
  const heal = Number(state.character.class_level) || 6;
  modifyHP(heal);
  state.healingHandsUsed = true;
  const btn = $("btnHealingHands");
  if (btn) btn.disabled = true;
  alert(`💚 Manos Curativas: Has tocado para sanar ${heal} PV. Tu salud se ha actualizado en la ficha.`);
};

window.stepLevel = function(delta) {
  if (!state.character) return;
  state.character.class_level = Math.max(1, Math.min(20, Number(state.character.class_level) + Number(delta)));
  renderDerived();
};

window.stepStat = function(stat, delta) {
  if (!state.character || !(stat in state.character)) return;
  state.character[stat] = Math.max(1, Math.min(30, Number(state.character[stat]) + Number(delta)));
  renderDerived();
};

/* INVENTARIO */
function renderEquipment() {
  const container = $("equipmentListCategorized");
  if (!container) return;

  container.innerHTML = state.equipment.map(item => {
    const locText = item.location === "equipped" ? "⚔ Equipado" : (item.location === "stored" ? "📦 Almacenado" : "🎒 Cargado");
    const extraType = item.type === "armor" ? " (Armadura)" : (item.type === "shield" ? " (Escudo)" : "");

    return `
      <div class="item-row">
        <div style="flex:1;">
          <strong>${escapeHTML(item.name)}</strong>
          <small style="color:var(--muted);">Cantidad: ${item.quantity}${extraType}</small>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="secondary-action ${item.location === 'equipped' ? 'active' : ''}" onclick="cycleItem('${item.id}')">
            ${locText}
          </button>
          <button class="tiny-button" style="color:var(--danger); font-size:16px; padding:4px 6px;" onclick="deleteItem('${item.id}')" title="Eliminar objeto">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

window.cycleItem = function(id) {
  const item = state.equipment.find(i => i.id === id);
  if (!item) return;

  const states = ["equipped", "carried", "stored"];
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
  safeSetText("magicSlotDisplay", `${state.spellSlots} / 2`);
  const container = $("spellsFullList");
  if (!container) return;

  container.innerHTML = OFFICIAL_SPELLS.map((sp, idx) => `
    <div class="item-row" onclick="openSpellModal(${idx})" style="cursor:pointer;">
      <div>
        <strong>${escapeHTML(sp.name)}</strong>
        <small style="color:var(--muted);">${escapeHTML(sp.time)} · ${escapeHTML(sp.range)}</small>
      </div>
      <span class="tag">${escapeHTML(sp.level)}</span>
    </div>
  `).join("");
}

window.openSpellModal = function(idx) {
  const sp = OFFICIAL_SPELLS[idx];
  if (!sp) return;

  state.activeModalSpell = sp;
  safeSetText("modalSpellName", sp.name);
  safeSetText("modalSpellLevel", sp.level);
  safeSetText("modalSpellTime", sp.time);
  safeSetText("modalSpellRange", sp.range);
  safeSetText("modalSpellDuration", sp.duration);

  const eff = $("modalSpellEffect");
  if (eff) eff.innerHTML = `<b>Efecto:</b> ${escapeHTML(sp.damage)}<br><br>${escapeHTML(sp.desc)}`;

  const btn = $("modalCastSpellBtn");
  if (btn) {
    if (sp.isCantrip) {
      btn.textContent = "Lanzar Truco (Sin Coste)";
      btn.disabled = false;
    } else {
      btn.textContent = `Lanzar (${state.spellSlots}/2 Espacios)`;
      btn.disabled = state.spellSlots <= 0;
    }
  }

  const modal = $("spellModal");
  if (modal) modal.classList.add("active");
};

window.closeSpellModal = function(e) {
  if (e) e.stopPropagation();
  const modal = $("spellModal");
  if (modal) modal.classList.remove("active");
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

/* COMPAÑEROS */
function renderCompanions() {
  if (!state.character) return;
  safeSetText("pourcoonHpDisplay", `${state.pourcoonHp} / ${state.pourcoonMaxHp}`);

  const specterHp = Math.floor(state.character.class_level / 2);
  safeSetText("specterHpDisplay", `${specterHp} PV`);
  safeSetText("specterFormulaText", `${specterHp} PV`);

  const chaMod = calcMod(state.character.charisma);
  safeSetText("specterAtkBonus", signed(chaMod));
  safeSetText("specterModText", signed(chaMod));
}

/* DESCANSOS */
function resetCombatToggles() {
  state.combat.hexblade_curse_active = false;
  state.combat.elemental_weapon_active = false;

  document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
    btn.classList.remove("active");
    const key = btn.dataset.combatToggle;
    const check = $(`check_${key}`);
    if (check) check.textContent = "○";
  });
}

function setupRests() {
  const triggerShortRest = async () => {
    state.spellSlots = 2;
    resetCombatToggles();
    renderSpells();
    renderAttacks();

    try {
      await db.from("characters").update({ spell_slots_level_3: 2 }).eq("name", "Lior Kurogane");
    } catch (e) {}

    alert("⏳ Descanso Corto completado:\n• Espacios de pacto restaurados a 2/2.");
  };

  $("btnShortRest")?.addEventListener("click", triggerShortRest);
  $("btnMagicShortRest")?.addEventListener("click", triggerShortRest);

  $("btnLongRest")?.addEventListener("click", async () => {
    if (!confirm("¿Deseas iniciar un Descanso Largo (8 horas)? Se recuperará toda tu vida (48/48), tus espacios de pacto y se limpiarán los fallos de muerte.")) return;

    state.character.max_hp = 48;
    state.character.current_hp = 48;
    state.spellSlots = 2;
    state.pourcoonHp = state.pourcoonMaxHp;
    state.deathSuccesses = 0;
    state.deathFailures = 0;
    state.healingHandsUsed = false;

    const hhBtn = $("btnHealingHands");
    if (hhBtn) hhBtn.disabled = false;

    resetCombatToggles();

    updateHPUI();
    renderDeathSaves();
    renderSpells();
    renderCompanions();
    renderAttacks();

    try {
      await db.from("characters").update({ current_hp: 48, spell_slots_level_3: 2 }).eq("name", "Lior Kurogane");
    } catch (e) {}

    alert("⛺ Descanso Largo completado:\n• Vida restaurada al 100% (48/48 PV).\n• Espacios de pacto restaurados (2/2).\n• Salud de Pourcoon recuperada.\n• Rasgos y salvaciones de muerte reiniciados.");
  });
}

function setupCombatToggles() {
  document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.combatToggle;
      if (!(key in state.combat)) return;

      state.combat[key] = !state.combat[key];
      btn.classList.toggle("active", state.combat[key]);
      const check = $(`check_${key}`);
      if (check) check.textContent = state.combat[key] ? "✓" : "○";
      renderAttacks();
    });
  });

  $("hpMinus10Btn")?.addEventListener("click", () => modifyHP(-10));
  $("hpMinusBtn")?.addEventListener("click", () => modifyHP(-1));
  $("hpPlusBtn")?.addEventListener("click", () => modifyHP(1));
  $("hpPlus10Btn")?.addEventListener("click", () => modifyHP(10));

  $("btnPourcoonHpMinus")?.addEventListener("click", () => {
    state.pourcoonHp = Math.max(0, state.pourcoonHp - 1);
    renderCompanions();
  });

  $("btnPourcoonHpPlus")?.addEventListener("click", () => {
    state.pourcoonHp = Math.min(state.pourcoonMaxHp, state.pourcoonHp + 1);
    renderCompanions();
  });

  $("btnPourcoonReset")?.addEventListener("click", () => {
    state.pourcoonHp = state.pourcoonMaxHp;
    renderCompanions();
  });

  $("addItemBtn")?.addEventListener("click", () => {
    const nameInput = $("newItemName");
    const qtyInput = $("newItemQty");
    if (!nameInput) return;

    const name = nameInput.value.trim();
    const qty = Number(qtyInput?.value) || 1;
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

    nameInput.value = "";
    if (qtyInput) qtyInput.value = 1;
    renderEquipment();
    renderDerived();
  });
}

function renderAll() {
  updateHPUI();
  renderLoyaltyCard();
  renderDerived();
  renderEquipment();
  renderSpells();
  renderCompanions();
  renderDeathSaves();
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupCombatToggles();
  setupRests();

  $("modalCastSpellBtn")?.addEventListener("click", castModalSpell);

  const modal = $("spellModal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) window.closeSpellModal(e);
  });

  loadAll();
});