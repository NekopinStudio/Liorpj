/* =========================================================
   LIOR KUROGANE — MOTOR COMPLETO D&D 5E & SUPABASE
========================================================= */

const SUPABASE_URL = "https://zfuwwtjjamxhpzukbaaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_1K4B3vdMrBSclaTet_thcg_5a1PmciM";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const OFFICIAL_ATTACKS_BASE = [
  { name: "Pistola del pacto", isPact: true, isFirearm: true, dmgDie: "1d10", dmgType: "Perforante (Distancia 30/90)" },
  { name: "Mosquete del pacto", isPact: true, isFirearm: true, dmgDie: "1d12", dmgType: "Perforante (Distancia 40/120)" },
  { name: "Arpón del pacto", isPact: true, isFirearm: false, dmgDie: "1d10", dmgType: "Penetrante (Reduce 10 ft vel)" },
  { name: "Espada larga platinada", isPact: false, isFirearm: false, dmgDie: "1d8", dmgType: "Cortante (Versátil 1d10)" },
  { name: "Daga", isPact: false, isFirearm: false, dmgDie: "1d4", dmgType: "Perforante (Sutil, Arrojadiza)" },
  { name: "Red", isPact: false, isFirearm: false, dmgDie: "—", dmgType: "Especial (Apresa objetivo)" },
  { name: "Descarga sobrenatural", isPact: false, isSpell: true, dmgDie: "1d10", dmgType: "Fuerza (120 ft)" }
];

const OFFICIAL_SPELLS = [
  { name: "Descarga sobrenatural", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "120 ft", duration: "Instantáneo", damage: "1d10 fuerza por haz", desc: "Rayos independientes por ataque mágico." },
  { name: "Luz", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "10 ft", duration: "1 hora", damage: "Utilidad", desc: "Objeto emite luz en 20 ft." },
  { name: "Mano de mago", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "30 ft", duration: "1 minuto", damage: "Utilidad", desc: "Manipula hasta 10 lb de peso." },
  { name: "Toque helado", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "120 ft", duration: "1 asalto", damage: "2d8 necrótico", desc: "Impide curación al objetivo." },
  { name: "Armadura de Agathys", level: "Nivel 3", isCantrip: false, concentration: false, time: "1 acción", range: "Personal", duration: "1 hora", damage: "15 frío al atacante", desc: "Otorga 15 PV temporales." },
  { name: "Escudo", level: "Nivel 1", isCantrip: false, concentration: false, time: "1 reacción", range: "Personal", duration: "1 asalto", damage: "+5 CA", desc: "+5 CA contra el ataque activador." },
  { name: "Infligir heridas (Lady D.)", level: "Regla Casera", isCantrip: false, concentration: false, time: "1 acción", range: "Toque", duration: "Instantáneo", damage: "3d10 necrótico", desc: "Varía según la condición diaria de Lady D." },
  { name: "Maleficio (Hex)", level: "Nivel 1", isCantrip: false, concentration: true, time: "1 acción adicional", range: "90 ft", duration: "8 horas", damage: "+1d6 necrótico", desc: "Desventaja en 1 característica." },
  { name: "Susurros disonantes", level: "Nivel 1", isCantrip: false, concentration: false, time: "1 acción", range: "60 ft", duration: "Instantáneo", damage: "3d6 psíquico", desc: "Fuerza a huir con reacción." },
  { name: "Castigo marcador", level: "Nivel 2", isCantrip: false, concentration: true, time: "1 acción adicional", range: "Personal", duration: "1 minuto", damage: "+3d6 radiante", desc: "Anula invisibilidad." },
  { name: "Paso brumoso", level: "Nivel 2", isCantrip: false, concentration: false, time: "1 acción adicional", range: "Personal", duration: "Instantáneo", damage: "Teletransporte", desc: "Hasta 30 ft a espacio visible." },
  { name: "Arma elemental", level: "Nivel 3", isCantrip: false, concentration: true, time: "1 acción", range: "Toque", duration: "1 hora", damage: "+1 ataque / +1d4 daño", desc: "Vuelve mágica el arma." },
  { name: "Desplazamiento (Blink)", level: "Nivel 3", isCantrip: false, concentration: false, time: "1 acción", range: "Personal", duration: "1 minuto", damage: "Defensivo", desc: "1d20 con 11+ viaja al etéreo." }
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
  necroticShroudUsed: false,
  hexbladeCurseUsed: false,
  ammoCount: 20,
  specterState: 'ready',
  ladyDMode: 'cantrip_free',
  activeConcentration: null,
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

/* =========================================================
   CARGA INICIAL CON PERSISTENCIA
========================================================= */
async function loadAll() {
  state.character = {
    id: "lior-kurogane",
    name: "Lior Kurogane",
    class_level: 6,
    max_hp: 48,
    current_hp: 48,
    temporary_hp: 0,
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
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      state.character = { ...state.character, ...data };
      state.character.max_hp = data.max_hp ?? 48;
      state.character.current_hp = data.current_hp ?? 48;
      state.character.temporary_hp = data.temporary_hp ?? 0;
      state.deaths = data.deaths ?? 4;
      state.spellSlots = data.spell_slots_level_3 ?? 2;
      state.ammoCount = data.ammo ?? 20;
      state.specterState = data.specter_state ?? 'ready';
      state.hexbladeCurseUsed = data.hexblade_curse_used ?? false;
      state.necroticShroudUsed = data.necrotic_shroud_used ?? false;
      state.healingHandsUsed = data.healing_hands_used ?? false;
      state.ladyDMode = data.lady_d_mode ?? 'cantrip_free';
    }
  } catch (err) {
    console.warn("Supabase offline, usando almacenamiento local:", err);
    const localDeaths = localStorage.getItem("lior_deaths");
    const localAmmo = localStorage.getItem("lior_ammo");
    if (localDeaths !== null) state.deaths = Number(localDeaths);
    if (localAmmo !== null) state.ammoCount = Number(localAmmo);
  }

  safeSetText("ammoCountDisplay", state.ammoCount);
  const ladyDSel = $("ladyDModeSelect");
  if (ladyDSel) ladyDSel.value = state.ladyDMode;

  updateSpecterUI();
  updateTraitButtonsUI();
  await loadNotes();

  const savedEquip = localStorage.getItem("lior_equipment");
  if (savedEquip) {
    try { state.equipment = JSON.parse(savedEquip); } catch(e) { initDefaultEquipment(); }
  } else {
    initDefaultEquipment();
  }

  renderAll();
}

function initDefaultEquipment() {
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
  saveEquipmentLocal();
}

function saveEquipmentLocal() {
  localStorage.setItem("lior_equipment", JSON.stringify(state.equipment));
}

/* =========================================================
   PUNTOS DE GOLPE (CON PV TEMPORALES)
========================================================= */
function updateHPUI() {
  if (!state.character) return;
  const cur = Number(state.character.current_hp);
  const max = Number(state.character.max_hp) || 48;
  const temp = Number(state.character.temporary_hp) || 0;

  safeSetText("hpValue", `${cur} / ${max}`);
  
  const tempBadge = $("tempHpBadge");
  if (tempBadge) {
    if (temp > 0) {
      tempBadge.style.display = "inline-block";
      tempBadge.textContent = `+${temp} Temp`;
    } else {
      tempBadge.style.display = "none";
    }
  }

  const bar = $("hpBar");
  if (bar) {
    const percentage = Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
    bar.style.width = `${percentage}%`;
  }
}

async function modifyHP(delta) {
  if (!state.character) return;
  let current = Number(state.character.current_hp) || 0;
  let temp = Number(state.character.temporary_hp) || 0;
  const max = Number(state.character.max_hp) || 48;

  if (delta < 0) {
    let damage = Math.abs(delta);
    if (temp > 0) {
      if (damage <= temp) {
        temp -= damage;
        damage = 0;
      } else {
        damage -= temp;
        temp = 0;
      }
      state.character.temporary_hp = temp;
    }
    current = Math.max(0, current - damage);
  } else {
    current = Math.min(max, current + delta);
  }

  state.character.current_hp = current;
  updateHPUI();

  try {
    await db.from("characters").update({ 
      current_hp: current, 
      temporary_hp: temp 
    }).eq("name", "Lior Kurogane");
  } catch (e) {
    console.warn("Guardado local de PV:", e);
  }
}

/* =========================================================
   CONCENTRACIÓN EN COMBATE
========================================================= */
function setConcentration(spellName) {
  if (state.activeConcentration && state.activeConcentration !== spellName) {
    showRollModal("CONCENTRACIÓN ROTA", "⚡", `Has roto tu concentración previa en ${state.activeConcentration} para concentrarte en ${spellName}.`);
  }
  state.activeConcentration = spellName;
  updateConcentrationUI();
}

function breakConcentration() {
  state.activeConcentration = null;
  state.combat.elemental_weapon_active = false;
  const elemBtn = document.querySelector("[data-combat-toggle='elemental_weapon_active']");
  if (elemBtn) elemBtn.classList.remove("active");
  const check = $("check_elemental_weapon_active");
  if (check) check.textContent = "○";

  updateConcentrationUI();
  renderAttacks();
}

function updateConcentrationUI() {
  const display = $("concentrationDisplay");
  if (!display) return;
  if (state.activeConcentration) {
    display.innerHTML = `<span>🔮 Concentración: <strong>${escapeHTML(state.activeConcentration)}</strong></span> <button class="tiny-button" style="color:var(--danger);" onclick="breakConcentration()">✕ Romper</button>`;
  } else {
    display.innerHTML = `<span>🔮 Concentración: <strong>Ninguna</strong></span>`;
  }
}

/* =========================================================
   VENTANA FLOTANTE DE RESULTADOS
========================================================= */
function showRollModal(title, total, detail) {
  safeSetText("rollModalTitle", title);
  safeSetText("rollModalTotal", total);
  safeSetText("rollModalDetail", detail);
  const modal = $("rollModal");
  if (modal) modal.classList.add("active");
}

window.closeRollModal = function(e) {
  if (e) e.stopPropagation();
  const modal = $("rollModal");
  if (modal) modal.classList.remove("active");
};

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
    showRollModal("SALVACIÓN CONTRA LA MUERTE", "COMPLETADO", "Las tiradas ya terminaron. Usa 'Limpiar' para reiniciar.");
    return;
  }

  const d20 = Math.floor(Math.random() * 20) + 1;

  if (d20 === 20) {
    state.character.current_hp = 1;
    state.deathSuccesses = 0;
    state.deathFailures = 0;
    updateHPUI();
    renderDeathSaves();
    showRollModal("SALVACIÓN CONTRA LA MUERTE", "¡20 NATURAL!", "¡Milagro! Recuperas la consciencia inmediatamente con 1 PV.");
    return;
  } else if (d20 === 1) {
    state.deathFailures = Math.min(3, state.deathFailures + 2);
    showRollModal("SALVACIÓN CONTRA LA MUERTE", "¡PIFIA! (1)", "Fallo crítico: Recibes 2 fallos automáticos.");
  } else if (d20 >= 10) {
    state.deathSuccesses = Math.min(3, state.deathSuccesses + 1);
    showRollModal("SALVACIÓN CONTRA LA MUERTE", `ÉXITO (${d20})`, "Tirada de 10 o superior: Sumas 1 éxito.");
  } else {
    state.deathFailures = Math.min(3, state.deathFailures + 1);
    showRollModal("SALVACIÓN CONTRA LA MUERTE", `FALLO (${d20})`, "Tirada de 9 o inferior: Sumas 1 fallo.");
  }

  renderDeathSaves();
  checkDeathSavesCondition();
};

function checkDeathSavesCondition() {
  if (state.deathSuccesses >= 3) {
    showRollModal("ESTABILIZADO", "✨ VIVO", "Has acumulado 3 éxitos. Lior está fuera de peligro inmediato a 0 PV.");
  } else if (state.deathFailures >= 3) {
    showRollModal("HAS MUERTO", "☠ 3 FALLOS", "Lior ha muerto. Se añadirá un sello a tu Tarjeta de Lealtad.");
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

  localStorage.setItem("lior_deaths", state.deaths);
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
   CA CON DESGLOSE DINÁMICO
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
   ATAQUES SINCRONIZADOS CON EL INVENTARIO DE EQUIPO
========================================================= */
function renderAttacks() {
  const tbody = $("attacksTableBody");
  if (!tbody || !state.character) return;

  const c = state.character;
  const prof = calcProf(c.class_level);
  const chaMod = calcMod(c.charisma);
  const dexMod = calcMod(c.dexterity);
  const strMod = calcMod(c.strength);

  // Filtrar para mostrar sólo las armas que sigan existiendo y estén equipadas (salvo el truco mágico)
  const activeAttacks = OFFICIAL_ATTACKS_BASE.filter(atk => {
    if (atk.isSpell) return true; // Descarga sobrenatural siempre disponible
    // Comprobar si existe un arma en el equipo que coincida en nombre y esté "equipped"
    return state.equipment.some(item => 
      item.type === 'weapon' && 
      item.location === 'equipped' && 
      item.name.trim().toLowerCase() === atk.name.trim().toLowerCase()
    );
  });

  if (activeAttacks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:12px;">No tienes armas equipadas en el inventario.</td></tr>`;
    return;
  }

  tbody.innerHTML = activeAttacks.map(atk => {
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
      <tr onclick="rollAttack('${safeName.replaceAll("'", "\\'")}', ${bonus}, '${safeDamage.replaceAll("'", "\\'")}', '${safeDie.replaceAll("'", "\\'")}', ${Boolean(atk.isFirearm)})">
        <td><strong>${safeName}</strong></td>
        <td><b style="color:var(--bronze);">${signed(bonus)}</b></td>
        <td>${damageText}</td>
        <td><small style="color:var(--muted);">${safeType}</small></td>
      </tr>
    `;
  }).join("");
}

window.rollAttack = async function(name, bonus, damageText, dmgDie, isFirearm) {
  if (isFirearm) {
    if (state.ammoCount <= 0) {
      showRollModal("SIN MUNICIÓN", "⚠️ 0 BALAS", "Debes recargar tu cartuchera antes de disparar.");
      return;
    }
    state.ammoCount--;
    safeSetText("ammoCountDisplay", state.ammoCount);
    localStorage.setItem("lior_ammo", state.ammoCount);
    try {
      await db.from("characters").update({ ammo: state.ammoCount }).eq("name", "Lior Kurogane");
    } catch(e) {}
  }

  const d20 = Math.floor(Math.random() * 20) + 1;
  const isCrit = (state.combat.hexblade_curse_active && d20 >= 19) || d20 === 20;
  const total = d20 + Number(bonus);

  let title = isCrit ? `⚔ ¡CRÍTICO CON ${name.toUpperCase()}!` : `⚔ ATAQUE: ${name.toUpperCase()}`;
  let totalText = isCrit ? `¡${total}! (CRÍTICO)` : `Impacto: ${total}`;
  let smiteNotice = isCrit ? " · ¡CRÍTICO! Duplica dados del arma y Eldritch Smite (8d8)." : "";
  let ammoNotice = isFirearm ? ` [Balas restantes: ${state.ammoCount}]` : "";
  let detail = `d20 (${d20}) + ${bonus} | Daño: ${damageText}${smiteNotice}${ammoNotice}`;

  showRollModal(title, totalText, detail);
};

/* =========================================================
   DERIVADOS & HABILIDADES
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
  showRollModal(`PRUEBA DE ${name.toUpperCase()}`, `Resultado: ${total}`, `d20 (${d20}) + bono (${signed(bonus)})`);
};

/* ACCIONES DE RASGOS */
window.useTraitAction = function(type) {
  if (type === 'passage') {
    showRollModal("PASAJE MARÍTIMO", "⚓ VIAJE GRATUITO", "Puedes asegurar transporte gratuito para el grupo en cualquier embarcación bajo las condiciones del DM, a cambio de que sirvan a la tripulación.");
  }
};

window.useNecroticShroud = async function() {
  if (state.necroticShroudUsed) {
    showRollModal("MORTAJA NECRÓTICA", "⚠️ YA UTILIZADA", "Ya usaste Mortaja Necrótica hoy. Se restaura al finalizar un Descanso Largo.");
    return;
  }
  const prof = calcProf(state.character.class_level);
  const chaMod = calcMod(state.character.charisma);
  const dc = 8 + prof + chaMod;
  const dmg = state.character.class_level;

  state.necroticShroudUsed = true;
  updateTraitButtonsUI();
  try { await db.from("characters").update({ necrotic_shroud_used: true }).eq("name", "Lior Kurogane"); } catch(e){}

  showRollModal("MORTAJA NECRÓTICA", "💀 ACTIVADA", `• Criaturas a 10 pies deben superar salvación de CARISMA (CD ${dc}) o quedarán asustadas.\n• Infliges +${dmg} de daño necrótico adicional 1/turno.`);
};

window.useHealingHands = async function() {
  if (state.healingHandsUsed) {
    showRollModal("MANOS CURATIVAS", "⚠️ AGOTADO", "Ya utilizaste Manos Curativas hoy. Se restaura al finalizar un Descanso Largo.");
    return;
  }
  const heal = Number(state.character.class_level) || 6;
  modifyHP(heal);
  state.healingHandsUsed = true;
  updateTraitButtonsUI();
  try { await db.from("characters").update({ healing_hands_used: true }).eq("name", "Lior Kurogane"); } catch(e){}

  showRollModal("MANOS CURATIVAS", `💚 +${heal} PV`, `Has tocado a un aliado (o a ti misma) para sanar ${heal} puntos de golpe.`);
};

function updateTraitButtonsUI() {
  const hhBtn = $("btnHealingHands");
  if (hhBtn) hhBtn.disabled = state.healingHandsUsed;

  const nsBtn = $("btnNecroticShroud");
  if (nsBtn) nsBtn.disabled = state.necroticShroudUsed;

  const curseBtn = $("btnHexbladeCurseToggle");
  if (curseBtn) {
    if (state.hexbladeCurseUsed && !state.combat.hexblade_curse_active) {
      curseBtn.disabled = true;
      safeSetText("curseStatusText", "⚠️ Maldición ya consumida (Restablece en Descanso Corto/Largo)");
    } else {
      curseBtn.disabled = false;
      safeSetText("curseStatusText", `Crítico 19-20 · +${calcProf(state.character?.class_level || 6)} daño · Sana al morir`);
    }
  }
}

/* =========================================================
   REGLA CASERA DE LADY D. (4 MODALIDADES)
========================================================= */
window.changeLadyDMode = async function(mode) {
  state.ladyDMode = mode;
  renderSpells();
  try {
    await db.from("characters").update({ lady_d_mode: mode }).eq("name", "Lior Kurogane");
  } catch(e) {}
  
  const labels = {
    cantrip_free: "Truco Puro (Coste 0 · Cero Daño)",
    cantrip_damage: "Pacto Doloroso (Coste 0 · Contra Tirada de Daño)",
    normal_slot: "Normal (Consume Espacio de Pacto)",
    slot_plus_damage: "Sobrecarga (Espacio de Pacto + Daño Personal)"
  };
  showRollModal("MARCA DE LADY D.", "CONDICIÓN DIARIA", `Modo activo: ${labels[mode]}`);
};

window.stepLevel = function(delta) {
  if (!state.character) return;
  state.character.class_level = Math.max(1, Math.min(20, Number(state.character.class_level) + Number(delta)));
  renderDerived();
  db.from("characters").update({ class_level: state.character.class_level }).eq("name", "Lior Kurogane");
};

window.stepStat = function(stat, delta) {
  if (!state.character || !(stat in state.character)) return;
  state.character[stat] = Math.max(1, Math.min(30, Number(state.character[stat]) + Number(delta)));
  renderDerived();
  db.from("characters").update({ [stat]: state.character[stat] }).eq("name", "Lior Kurogane");
};

/* =========================================================
   INVENTARIO & ELIMINACIÓN CON SINCRONIZACIÓN DE ARMAS
========================================================= */
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
          <button class="tiny-button" style="color:var(--danger); font-size:16px; padding:4px 8px;" onclick="deleteItem('${item.id}')" title="Eliminar objeto">✕</button>
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
  saveEquipmentLocal();
  renderEquipment();
  renderDerived(); // Recalcula CA y lista de ataques activos
};

window.deleteItem = function(id) {
  state.equipment = state.equipment.filter(i => i.id !== id);
  saveEquipmentLocal();
  renderEquipment();
  renderDerived(); // Elimina el arma de los ataques si correspondía
};

/* =========================================================
   CONJUROS CON LADY D. INTEGRADA
========================================================= */
function renderSpells() {
  safeSetText("magicSlotDisplay", `${state.spellSlots} / 2`);
  const container = $("spellsFullList");
  if (!container) return;

  container.innerHTML = OFFICIAL_SPELLS.map((sp, idx) => {
    let levelTag = sp.level;
    let subtitle = `${sp.time} · ${sp.range} ${sp.concentration ? '· [Concentración]' : ''}`;

    if (sp.name.includes("Infligir heridas")) {
      switch (state.ladyDMode) {
        case 'cantrip_free':
          levelTag = "Truco (Coste 0)";
          subtitle = "Ilimitado · Sin daño personal";
          break;
        case 'cantrip_damage':
          levelTag = "Truco (Dolor)";
          subtitle = "Ilimitado · Requiere contra tirada de daño";
          break;
        case 'normal_slot':
          levelTag = "Nivel 3 (Pacto)";
          subtitle = "Consume 1 espacio de pacto";
          break;
        case 'slot_plus_damage':
          levelTag = "Sobrecarga";
          subtitle = "Consume espacio de pacto + Daño personal";
          break;
      }
    }

    return `
      <div class="item-row" onclick="openSpellModal(${idx})" style="cursor:pointer;">
        <div>
          <strong>${escapeHTML(sp.name)}</strong>
          <small style="color:var(--muted);">${escapeHTML(subtitle)}</small>
        </div>
        <span class="tag">${escapeHTML(levelTag)}</span>
      </div>
    `;
  }).join("");
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

  let effectText = sp.damage;
  let descText = sp.desc;

  if (sp.name.includes("Infligir heridas")) {
    switch (state.ladyDMode) {
      case 'cantrip_free':
        effectText = "3d10 daño necrótico";
        descText = "Modo Truco Puro: 0 coste de pacto y 0 daño personal por gracia de la Dama.";
        break;
      case 'cantrip_damage':
        effectText = "3d10 necrótico Y sufres 1d4 de daño inevitable";
        descText = "Modo Pacto Doloroso: Canalizas sufrimiento personal para herir sin gastar recursos mágicos.";
        break;
      case 'normal_slot':
        effectText = "5d10 daño necrótico (Slot Nivel 3)";
        descText = "Modo Normal: Invocas el conjuro utilizando un espacio de pacto de Brujo regular.";
        break;
      case 'slot_plus_damage':
        effectText = "5d10 daño necrótico Y sufres 1d4 de daño inevitable";
        descText = "Modo Sobrecarga: Gastas un espacio de pacto y ofreces sufrimiento personal a la Dama del Dolor.";
        break;
    }
  }

  const eff = $("modalSpellEffect");
  if (eff) eff.innerHTML = `<b>Efecto:</b> ${escapeHTML(effectText)}<br><br>${escapeHTML(descText)} ${sp.concentration ? '<br><b style="color:var(--bronze);">Requiere Concentración</b>' : ''}`;

  const btn = $("modalCastSpellBtn");
  if (btn) {
    if (sp.isCantrip || (sp.name.includes("Infligir heridas") && (state.ladyDMode === 'cantrip_free' || state.ladyDMode === 'cantrip_damage'))) {
      btn.textContent = "Lanzar (Sin Espacios de Pacto)";
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

  // Manejo especial de Infligir Heridas
  if (sp.name.includes("Infligir heridas")) {
    if (state.ladyDMode === 'cantrip_free') {
      showRollModal("INFLIGIR HERIDAS", "💀 3d10 NECRÓTICO", "Lanzado como truco puro: 0 coste de espacios y 0 daño personal.");
      closeSpellModal();
      return;
    } 
    else if (state.ladyDMode === 'cantrip_damage') {
      const selfDmg = Math.floor(Math.random() * 4) + 1;
      modifyHP(-selfDmg);
      showRollModal("INFLIGIR HERIDAS (DOLOR)", "💀 3d10 NECRÓTICO", `Coste 0 de pacto. La contra tirada de dolor te inflige ${selfDmg} puntos de daño a ti misma.`);
      closeSpellModal();
      return;
    } 
    else if (state.ladyDMode === 'normal_slot') {
      if (state.spellSlots <= 0) {
        showRollModal("SIN ESPACIOS", "0 / 2", "No tienes espacios de pacto disponibles.");
        return;
      }
      state.spellSlots--;
      renderSpells();
      try { await db.from("characters").update({ spell_slots_level_3: state.spellSlots }).eq("name", "Lior Kurogane"); } catch(e){}
      showRollModal("INFLIGIR HERIDAS", "💀 5d10 NECRÓTICO", "Lanzado con espacio de pacto de Nivel 3. Espacio consumido.");
      closeSpellModal();
      return;
    } 
    else if (state.ladyDMode === 'slot_plus_damage') {
      if (state.spellSlots <= 0) {
        showRollModal("SIN ESPACIOS", "0 / 2", "No tienes espacios de pacto disponibles.");
        return;
      }
      state.spellSlots--;
      const selfDmg = Math.floor(Math.random() * 4) + 1;
      modifyHP(-selfDmg);
      renderSpells();
      try { await db.from("characters").update({ spell_slots_level_3: state.spellSlots }).eq("name", "Lior Kurogane"); } catch(e){}
      showRollModal("INFLIGIR HERIDAS (SOBRECARGA)", "💀 5d10 NECRÓTICO", `Espacio consumido y contra tirada aplicada: sufres ${selfDmg} PV de daño personal.`);
      closeSpellModal();
      return;
    }
  }

  // Resto de conjuros
  if (sp.concentration) setConcentration(sp.name);

  if (sp.name.includes("Armadura de Agathys")) {
    state.character.temporary_hp = 15;
    updateHPUI();
    try {
      await db.from("characters").update({ temporary_hp: 15 }).eq("name", "Lior Kurogane");
    } catch(e) {}
  }

  if (!sp.isCantrip) {
    if (state.spellSlots <= 0) {
      showRollModal("SIN ESPACIOS", "0 / 2", "No tienes espacios de pacto disponibles.");
      return;
    }
    state.spellSlots--;
    renderSpells();
    try {
      await db.from("characters").update({ spell_slots_level_3: state.spellSlots }).eq("name", "Lior Kurogane");
    } catch (e) {}
  }
  showRollModal("CONJURO LANZADO", `✨ ${sp.name}`, `Has lanzado ${sp.name} con éxito.`);
  closeSpellModal();
}

/* =========================================================
   COMPAÑEROS (ESPECTRO CON 3 ESTADOS)
========================================================= */
function renderCompanions() {
  if (!state.character) return;
  safeSetText("pourcoonHpDisplay", `${state.pourcoonHp} / ${state.pourcoonMaxHp}`);

  const specterHp = Math.floor(state.character.class_level / 2);
  safeSetText("specterHpDisplay", `${specterHp} PV`);
  safeSetText("specterFormulaText", `${specterHp} PV`);

  const chaMod = calcMod(state.character.charisma);
  safeSetText("specterAtkBonus", signed(chaMod));
  safeSetText("specterModText", signed(chaMod));
  updateSpecterUI();
}

function updateSpecterUI() {
  const btn = $("btnSpecterState");
  if (!btn) return;
  btn.classList.remove("active");

  if (state.specterState === 'ready') {
    btn.textContent = "💤 En reposo (Disponible)";
    btn.style.borderColor = "var(--bronze)";
    btn.style.color = "var(--text)";
  } else if (state.specterState === 'summoned') {
    btn.textContent = "👻 Convocado (Activo)";
    btn.classList.add("active");
  } else {
    btn.textContent = "💀 Consumido (Muerto)";
    btn.style.borderColor = "var(--danger)";
    btn.style.color = "var(--danger)";
  }
}

window.cycleSpecterState = async function() {
  const states = ['ready', 'summoned', 'consumed'];
  const next = states[(states.indexOf(state.specterState) + 1) % states.length];
  state.specterState = next;
  updateSpecterUI();
  try {
    await db.from("characters").update({ specter_state: next }).eq("name", "Lior Kurogane");
  } catch(e) {}
};

/* =========================================================
   DESCANSOS CON REINICIO EN BASE DE DATOS
========================================================= */
function resetCombatToggles() {
  state.combat.hexblade_curse_active = false;
  state.combat.elemental_weapon_active = false;
  state.activeConcentration = null;

  document.querySelectorAll("[data-combat-toggle]").forEach(btn => {
    btn.classList.remove("active");
    const key = btn.dataset.combatToggle;
    const check = $(`check_${key}`);
    if (check) check.textContent = "○";
  });
  updateConcentrationUI();
}

function setupRests() {
  const triggerShortRest = async () => {
    state.spellSlots = 2;
    state.hexbladeCurseUsed = false;
    resetCombatToggles();
    updateTraitButtonsUI();
    renderSpells();
    renderAttacks();

    try {
      await db.from("characters").update({ 
        spell_slots_level_3: 2,
        hexblade_curse_used: false
      }).eq("name", "Lior Kurogane");
    } catch (e) {}

    showRollModal("DESCANSO CORTO (1H)", "⏳ COMPLETADO", "• Espacios de pacto restaurados a 2/2.\n• Maldición del Filo lista para usarse de nuevo.");
  };

  $("btnShortRest")?.addEventListener("click", triggerShortRest);

  $("btnLongRest")?.addEventListener("click", async () => {
    state.character.max_hp = 48;
    state.character.current_hp = 48;
    state.character.temporary_hp = 0;
    state.spellSlots = 2;
    state.pourcoonHp = state.pourcoonMaxHp;
    state.deathSuccesses = 0;
    state.deathFailures = 0;
    state.healingHandsUsed = false;
    state.necroticShroudUsed = false;
    state.hexbladeCurseUsed = false;
    state.specterState = 'ready';

    resetCombatToggles();

    updateHPUI();
    renderDeathSaves();
    renderSpells();
    renderCompanions();
    renderAttacks();
    updateTraitButtonsUI();

    try {
      await db.from("characters").update({ 
        current_hp: 48, 
        temporary_hp: 0,
        spell_slots_level_3: 2,
        specter_state: 'ready',
        hexblade_curse_used: false,
        necrotic_shroud_used: false,
        healing_hands_used: false
      }).eq("name", "Lior Kurogane");
    } catch (e) {}

    showRollModal("DESCANSO LARGO (8H)", "⛺ COMPLETADO", "• Vida restaurada al 100% (48/48 PV).\n• Espacios de pacto restaurados (2/2).\n• Salud de Pourcoon recuperada.\n• Espectro y rasgos diarios restablecidos.\n• Munición conservada intacta.");
  });
}

/* =========================================================
   DIARIO DE CAMPAÑA PERSISTENTE
========================================================= */
async function loadNotes() {
  try {
    const { data, error } = await db
      .from("campaign_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      state.notes = data;
      renderNotes();
    }
  } catch (err) {
    console.warn("Carga de notas offline:", err);
  }
}

function renderNotes() {
  const container = $("notesContainer");
  if (!container) return;

  const filtered = state.noteFilter === 'all' 
    ? state.notes 
    : state.notes.filter(n => n.note_type === state.noteFilter);

  if (!filtered.length) {
    container.innerHTML = `<p class="small-note">No hay entradas guardadas en esta categoría.</p>`;
    return;
  }

  container.innerHTML = filtered.map(n => {
    const typeBadge = n.note_type === 'npc' ? '👤 PNJ' : (n.note_type === 'quest' ? '🎯 MISIÓN' : '📖 SESIÓN');
    return `
      <div class="sheet-card" style="margin-bottom:8px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:var(--text); font-size:14px;">${escapeHTML(n.title)}</strong>
          <span class="tag">${typeBadge}</span>
        </div>
        <p style="margin:8px 0 0; font-size:12px; color:#c9c7c2; white-space:pre-wrap; line-height:1.5;">${escapeHTML(n.content)}</p>
      </div>
    `;
  }).join("");
}

function setupNotes() {
  $("addNoteBtn")?.addEventListener("click", async () => {
    const title = $("newNoteTitle")?.value.trim();
    const content = $("newNoteContent")?.value.trim();
    const note_type = $("newNoteType")?.value;

    if (!title) return alert("Escribe un título para la entrada.");

    const payload = {
      character_id: state.character.id !== "lior-kurogane" ? state.character.id : null,
      title,
      content,
      note_type
    };

    try {
      const { data, error } = await db.from("campaign_notes").insert([payload]).select();
      if (!error && data) {
        state.notes.unshift(data[0]);
        $("newNoteTitle").value = "";
        $("newNoteContent").value = "";
        renderNotes();
        showRollModal("BITÁCORA", "ENTRADA GUARDADA", "La nota se ha sincronizado correctamente con la base de datos de Supabase.");
      } else {
        throw error;
      }
    } catch (e) {
      console.warn("Fallo guardado remoto, guardando local:", e);
      payload.id = `note-${Date.now()}`;
      state.notes.unshift(payload);
      $("newNoteTitle").value = "";
      $("newNoteContent").value = "";
      renderNotes();
      showRollModal("BITÁCORA", "GUARDADO LOCAL", "Nota archivada en el almacenamiento local.");
    }
  });

  document.querySelectorAll(".note-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".note-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.noteFilter = btn.dataset.filter;
      renderNotes();
    });
  });
}

/* =========================================================
   CONTROLES DE COMBATE & TOGGLES
========================================================= */
function setupCombatToggles() {
  $("btnHexbladeCurseToggle")?.addEventListener("click", async () => {
    if (state.hexbladeCurseUsed && !state.combat.hexblade_curse_active) {
      showRollModal("MALDICIÓN DEL FILO", "⚠️ AGOTADA", "Ya usaste la Maldición del Filo. Se recupera al completar un Descanso Corto o Largo.");
      return;
    }

    state.combat.hexblade_curse_active = !state.combat.hexblade_curse_active;
    const btn = $("btnHexbladeCurseToggle");
    if (btn) btn.classList.toggle("active", state.combat.hexblade_curse_active);
    const check = $("check_hexblade_curse_active");
    if (check) check.textContent = state.combat.hexblade_curse_active ? "✓" : "○";

    if (state.combat.hexblade_curse_active) {
      state.hexbladeCurseUsed = true;
      try { await db.from("characters").update({ hexblade_curse_used: true }).eq("name", "Lior Kurogane"); } catch(e){}
    }
    renderAttacks();
  });

  document.querySelector("[data-combat-toggle='elemental_weapon_active']")?.addEventListener("click", () => {
    state.combat.elemental_weapon_active = !state.combat.elemental_weapon_active;
    const btn = document.querySelector("[data-combat-toggle='elemental_weapon_active']");
    btn?.classList.toggle("active", state.combat.elemental_weapon_active);
    const check = $("check_elemental_weapon_active");
    if (check) check.textContent = state.combat.elemental_weapon_active ? "✓" : "○";

    if (state.combat.elemental_weapon_active) {
      setConcentration("Arma elemental");
    } else if (state.activeConcentration === "Arma elemental") {
      breakConcentration();
    }
    renderAttacks();
  });

  $("hpMinus10Btn")?.addEventListener("click", () => modifyHP(-10));
  $("hpMinusBtn")?.addEventListener("click", () => modifyHP(-1));
  $("hpPlusBtn")?.addEventListener("click", () => modifyHP(1));
  $("hpPlus10Btn")?.addEventListener("click", () => modifyHP(10));

  $("btnSetTempHp")?.addEventListener("click", async () => {
    const val = prompt("Introduce puntos de golpe temporales a asignar:", state.character.temporary_hp || "15");
    if (val !== null && val.trim() !== "") {
      const parsed = Math.max(0, parseInt(val, 10) || 0);
      state.character.temporary_hp = parsed;
      updateHPUI();
      try {
        await db.from("characters").update({ temporary_hp: parsed }).eq("name", "Lior Kurogane");
      } catch(e) {}
    }
  });

  $("btnShootAmmo")?.addEventListener("click", async () => {
    if (state.ammoCount <= 0) return showRollModal("SIN MUNICIÓN", "⚠️ 0 BALAS", "No tienes balas en la cartuchera.");
    state.ammoCount--;
    safeSetText("ammoCountDisplay", state.ammoCount);
    localStorage.setItem("lior_ammo", state.ammoCount);
    try {
      await db.from("characters").update({ ammo: state.ammoCount }).eq("name", "Lior Kurogane");
    } catch(e) {}
  });

  $("btnReloadAmmo")?.addEventListener("click", async () => {
    state.ammoCount += 10;
    safeSetText("ammoCountDisplay", state.ammoCount);
    localStorage.setItem("lior_ammo", state.ammoCount);
    try {
      await db.from("characters").update({ ammo: state.ammoCount }).eq("name", "Lior Kurogane");
    } catch(e) {}
  });

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
    } else if (
      lower.includes('pistola') || 
      lower.includes('mosquete') || 
      lower.includes('arpón') || 
      lower.includes('arpon') || 
      lower.includes('espada') || 
      lower.includes('daga') || 
      lower.includes('red')
    ) {
      type = 'weapon';
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

    saveEquipmentLocal();
    nameInput.value = "";
    if (qtyInput) qtyInput.value = 1;
    renderEquipment();
    renderDerived(); // Recalcula CA y ataques
  });
}

/* =========================================================
   RENDER CENTRAL
========================================================= */
function renderAll() {
  updateHPUI();
  renderLoyaltyCard();
  renderDerived();
  renderEquipment();
  renderSpells();
  renderCompanions();
  renderDeathSaves();
  updateConcentrationUI();
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupCombatToggles();
  setupRests();
  setupNotes();

  $("modalCastSpellBtn")?.addEventListener("click", castModalSpell);

  const modal = $("spellModal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) window.closeSpellModal(e);
  });

  loadAll();
});