/* ==========================================================================
   LIOR KUROGANE — MOTOR DE PERSONAJE D&D 5E
   ========================================================================== */

const SUPABASE_URL = "https://zfuwwtjjamxhpzukbaaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_1K4B3vdMrBSclaTet_thcg_5a1PmciM";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const SKILL_DEFINITIONS = {
  acrobatics:     { name: "Acrobacias",       ability: "dexterity" },
  arcana:         { name: "Arcanos",          ability: "intelligence" },
  athletics:      { name: "Atletismo",        ability: "strength" },
  deception:      { name: "Engañar",          ability: "charisma" },
  history:        { name: "Historia",         ability: "intelligence" },
  insight:        { name: "Perspicacia",      ability: "wisdom" },
  intimidation:   { name: "Intimidar",        ability: "charisma" },
  investigation:  { name: "Investigación",    ability: "intelligence" },
  medicine:       { name: "Medicina",         ability: "wisdom" },
  nature:         { name: "Naturaleza",       ability: "intelligence" },
  perception:     { name: "Percepción",       ability: "wisdom" },
  performance:    { name: "Interpretación",   ability: "charisma" },
  persuasion:     { name: "Persuasión",       ability: "charisma" },
  religion:       { name: "Religión",         ability: "intelligence" },
  sleightOfHand:  { name: "Juego de Manos",   ability: "dexterity" },
  stealth:        { name: "Sigilo",           ability: "dexterity" },
  survival:       { name: "Supervivencia",    ability: "wisdom" },
  animalHandling: { name: "Trato con Animales", ability: "wisdom" }
};

const OFFICIAL_ATTACKS_CATALOG = [
  { name: "Pistola del pacto", isPact: true, isFirearm: true, dmgDie: "1d10", dmgType: "Perforante (30/90 ft)" },
  { name: "Mosquete del pacto", isPact: true, isFirearm: true, dmgDie: "1d12", dmgType: "Perforante (40/120 ft)" },
  { name: "Arpón del pacto", isPact: true, isFirearm: false, dmgDie: "1d10", dmgType: "Penetrante (-10 ft vel)" },
  { name: "Espada larga platinada", isPact: false, isFirearm: false, dmgDie: "1d8", dmgType: "Cortante (Versátil 1d10)" },
  { name: "Daga", isPact: false, isFirearm: false, dmgDie: "1d4", dmgType: "Perforante (Sutil, Arrojadiza)" },
  { name: "Red", isPact: false, isFirearm: false, dmgDie: "—", dmgType: "Especial (Apresa)" },
  { name: "Descarga sobrenatural", isPact: false, isSpell: true, dmgDie: "1d10", dmgType: "Fuerza (120 ft)" }
];

const OFFICIAL_SPELLS_CATALOG = [
  { name: "Descarga sobrenatural", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "120 ft", duration: "Instantáneo", damage: "1d10 fuerza por haz", desc: "Rayos independientes por ataque mágico a distancia (+8 al impacto)." },
  { name: "Luz", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "10 ft", duration: "1 hora", damage: "Utilidad", desc: "Un objeto emite luz brillante en 20 ft y tenue en 20 ft adicionales." },
  { name: "Mano de mago", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "30 ft", duration: "1 minuto", damage: "Utilidad", desc: "Mano espectral que manipula objetos hasta 10 lb de peso." },
  { name: "Toque helado", level: "Truco", isCantrip: true, concentration: false, time: "1 acción", range: "120 ft", duration: "1 asalto", damage: "2d8 necrótico", desc: "Ataque a distancia. Si impacta, impide la recuperación de PV al objetivo." },
  { name: "Armadura de Agathys", level: "Nivel 3", isCantrip: false, concentration: false, time: "1 acción", range: "Personal", duration: "1 hora", damage: "15 frío al atacante", desc: "Otorga 15 PV temporales. Si te golpean cuerpo a cuerpo, el atacante sufre 15 de frío." },
  { name: "Escudo", level: "Nivel 1", isCantrip: false, concentration: false, time: "1 reacción", range: "Personal", duration: "1 asalto", damage: "+5 CA", desc: "+5 CA contra el ataque activador y anula Proyectil Mágico." },
  { name: "Infligir heridas", level: "Regla Casera", isCantrip: false, concentration: false, time: "1 acción", range: "Toque", duration: "Instantáneo", damage: "3d10 necrótico", desc: "Canalización variable según la modalidad activa de Lady D." },
  { name: "Maleficio (Hex)", level: "Nivel 1", isCantrip: false, concentration: true, time: "1 acción adicional", range: "90 ft", duration: "8 horas", damage: "+1d6 necrótico", desc: "+1d6 necrótico por impacto y desventaja en pruebas de 1 característica elegida." },
  { name: "Susurros disonantes", level: "Nivel 1", isCantrip: false, concentration: false, time: "1 acción", range: "60 ft", duration: "Instantáneo", damage: "3d6 psíquico", desc: "Salvación de Sabiduría o sufre daño y gasta reacción para alejarse de ti." },
  { name: "Castigo marcador", level: "Nivel 2", isCantrip: false, concentration: true, time: "1 acción adicional", range: "Personal", duration: "1 minuto", damage: "+3d6 radiante", desc: "El siguiente impacto con arma inflige daño radiante y anula la invisibilidad del objetivo." },
  { name: "Paso brumoso", level: "Nivel 2", isCantrip: false, concentration: false, time: "1 acción adicional", range: "Personal", duration: "Instantáneo", damage: "Teletransporte", desc: "Teletransporte instantáneo hasta 30 ft a un espacio desocupado visible." },
  { name: "Arma elemental", level: "Nivel 3", isCantrip: false, concentration: true, time: "1 acción", range: "Toque", duration: "1 hora", damage: "+1 ataque / +1d4 daño", desc: "Convierte un arma en mágica otorgando +1 al impacto y +1d4 daño elemental." },
  { name: "Desplazamiento (Blink)", level: "Nivel 3", isCantrip: false, concentration: false, time: "1 acción", range: "Personal", duration: "1 minuto", damage: "Defensivo", desc: "Al final de tu turno tiras 1d20; con 11 o más pasas al Plano Etéreo." }
];

const LADY_D_CONFIGURATIONS = {
  cantrip_free: {
    name: "Truco Puro",
    pactCost: 0,
    selfDamage: false,
    damageDice: "3d10",
    desc: "1. Truco Puro: Coste 0 espacios de pacto y cero autodaño personal por favor de la Dama."
  },
  cantrip_damage: {
    name: "Pacto Doloroso",
    pactCost: 0,
    selfDamage: true,
    damageDice: "3d10",
    desc: "2. Pacto Doloroso: Coste 0 de pacto. La Dama exige una contra tirada de autodaño físico (1d4 PV)."
  },
  normal_slot: {
    name: "Normal (Espacio de Pacto)",
    pactCost: 1,
    selfDamage: false,
    damageDice: "5d10",
    desc: "3. Normal: Invocación estándar de Brujo. Consume 1 espacio de pacto de Nivel 3. Sin autodaño."
  },
  slot_plus_damage: {
    name: "Sobrecarga de Sufrimiento",
    pactCost: 1,
    selfDamage: true,
    damageDice: "5d10",
    desc: "4. Sobrecarga: Consume 1 espacio de pacto y exige 1d4 de autodaño como tributo adicional a la Dama del Dolor."
  }
};

const state = {
  character: null,

  combat: {
    currentHp: 48,
    maxHp: 48,
    temporaryHp: 0,
    activeConcentration: null,
    hexbladeCurseActive: false,
    elementalWeaponActive: false,
    hexbladeCurseUsed: false,
    necroticShroudUsed: false,
    healingHandsUsed: false,
    deathSaves: { successes: 0, failures: 0 }
  },

  resources: {
    pactSlots: 2,
    pactSlotsMax: 2,
    ammunition: 20,
    deaths: 4,
    currency: { gp: 599, sp: 99, cp: 15 }
  },

  equipment: [],
  spells: OFFICIAL_SPELLS_CATALOG,
  skills: [],
  notes: [],

  companions: {
    pourcoon: { currentHp: 9, maxHp: 9 },
    specter: { state: "ready", currentHp: 3, maxHp: 3 }
  },

  ladyD: { mode: "cantrip_free" },

  ui: {
    activeTab: "combat",
    stampRotations: {},
    noteFilter: "all"
  }
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function signed(num) {
  const n = Number(num) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function safeSetText(id, val) {
  const el = $(id);
  if (el) el.textContent = val;
}

function showStatus(text, ok = true) {
  const el = $("saveStatus");
  if (!el) return;
  el.textContent = text;
  el.className = ok ? "" : "error";
}

/* --------------------------------------------------------------------------
   MOTOR MATEMÁTICO
   -------------------------------------------------------------------------- */
function getAbilityScore(ability) {
  return Number(state.character?.[ability] ?? 10);
}

function getAbilityModifier(score) {
  return Math.floor((Number(score) - 10) / 2);
}

function getProficiencyBonus(level) {
  const lvl = Number(level ?? state.character?.class_level ?? 6);
  return Math.floor((lvl - 1) / 4) + 2;
}

function getSavingThrowBonus(ability) {
  const mod = getAbilityModifier(getAbilityScore(ability));
  const prof = getProficiencyBonus();
  if (ability === "wisdom" || ability === "charisma") {
    return mod + prof;
  }
  return mod;
}

function getSkillBonus(skillKey) {
  const def = SKILL_DEFINITIONS[skillKey];
  if (!def) return 0;

  const statMod = getAbilityModifier(getAbilityScore(def.ability));
  const prof = getProficiencyBonus();
  const skillData = state.skills.find(s => s.key === skillKey);

  let bonus = statMod;
  if (skillData?.expertise) {
    bonus += prof * 2;
  } else if (skillData?.proficient) {
    bonus += prof;
  }
  return bonus;
}

function getPassivePerception() {
  return 10 + getSkillBonus("perception");
}

function getPassiveInvestigation() {
  return 10 + getSkillBonus("investigation");
}

function getSpellSaveDC() {
  return 8 + getProficiencyBonus() + getAbilityModifier(getAbilityScore("charisma"));
}

function getSpellAttackBonus() {
  return getProficiencyBonus() + getAbilityModifier(getAbilityScore("charisma"));
}

function calculateArmorClass() {
  const dexMod = getAbilityModifier(getAbilityScore("dexterity"));
  const equippedArmor = state.equipment.find(i => i.type === "armor" && i.location === "equipped");
  const equippedShield = state.equipment.find(i => i.type === "shield" && i.location === "equipped");

  let baseAC = 10 + dexMod;
  let detail = `10 + DES (${signed(dexMod)})`;

  if (equippedArmor) {
    const maxDex = equippedArmor.maxDex !== undefined ? equippedArmor.maxDex : 2;
    const allowedDex = Math.min(dexMod, maxDex);
    const armorBase = Number(equippedArmor.baseAC ?? 14);
    baseAC = armorBase + allowedDex;
    detail = `${equippedArmor.name} (${armorBase}) + DES (${signed(allowedDex)})`;
  }

  if (equippedShield) {
    const shieldBonus = Number(equippedShield.bonusAC ?? 2);
    baseAC += shieldBonus;
    detail += ` + ${equippedShield.name} (+${shieldBonus})`;
  }

  return { total: baseAC, detail };
}

function calculateInitiative() {
  return getAbilityModifier(getAbilityScore("dexterity"));
}

/* --------------------------------------------------------------------------
   DADOS Y COMBATE
   -------------------------------------------------------------------------- */
function rollDice(count, sides) {
  const rolls = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }
  return { rolls, total };
}

function applyDamage(amount) {
  let remaining = Math.max(0, Number(amount));

  if (state.combat.temporaryHp > 0) {
    const absorbed = Math.min(state.combat.temporaryHp, remaining);
    state.combat.temporaryHp -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    state.combat.currentHp = Math.max(0, state.combat.currentHp - remaining);
  }

  renderCombat();
  persistCombatState();
}

function healCharacter(amount) {
  const heal = Math.max(0, Number(amount));
  state.combat.currentHp = Math.min(state.combat.maxHp, state.combat.currentHp + heal);
  renderCombat();
  persistCombatState();
}

function setTemporaryHp(amount) {
  state.combat.temporaryHp = Math.max(0, Number(amount));
  renderCombat();
  persistCombatState();
}

function rollDeathSave() {
  if (state.combat.currentHp > 0) {
    showToast("Lior tiene puntos de golpe conscientes.");
    return;
  }

  if (state.combat.deathSaves.successes >= 3 || state.combat.deathSaves.failures >= 3) {
    showToast("Las salvaciones han concluido. Limpia para reiniciar.");
    return;
  }

  const d20 = rollDice(1, 20).total;

  if (d20 === 20) {
    state.combat.currentHp = 1;
    resetDeathSaves();
    openModal("¡20 NATURAL EN SALVACIÓN!", `
      <div class="roll-result">
        <div class="d20">20</div>
        <div class="total ok">¡Milagro!</div>
        <p>Lior recupera la consciencia inmediatamente con 1 PV.</p>
      </div>
    `);
  } else if (d20 === 1) {
    state.combat.deathSaves.failures = Math.min(3, state.combat.deathSaves.failures + 2);
    openModal("PIFIA EN SALVACIÓN", `
      <div class="roll-result">
        <div class="d20" style="color:var(--danger)">1</div>
        <div class="total error">Pifia Crítica</div>
        <p>Recibes 2 fallos automáticos contra la muerte.</p>
      </div>
    `);
  } else if (d20 >= 10) {
    state.combat.deathSaves.successes = Math.min(3, state.combat.deathSaves.successes + 1);
    openModal("SALVACIÓN EXITOSA", `
      <div class="roll-result">
        <div class="d20">${d20}</div>
        <div class="total ok">Éxito</div>
        <p>Tirada ≥ 10. Se anota un éxito.</p>
      </div>
    `);
  } else {
    state.combat.deathSaves.failures = Math.min(3, state.combat.deathSaves.failures + 1);
    openModal("SALVACIÓN FALLIDA", `
      <div class="roll-result">
        <div class="d20" style="color:var(--danger)">${d20}</div>
        <div class="total error">Fallo</div>
        <p>Tirada &lt; 10. Se anota un fallo.</p>
      </div>
    `);
  }

  if (state.combat.deathSaves.successes >= 3) {
    showToast("✨ Lior se ha estabilizado a 0 PV.");
  } else if (state.combat.deathSaves.failures >= 3) {
    toggleLoyaltyStamp(Math.min(10, state.resources.deaths + 1));
    resetDeathSaves();
  }

  renderCombat();
  persistCombatState();
}

function resetDeathSaves() {
  state.combat.deathSaves.successes = 0;
  state.combat.deathSaves.failures = 0;
  renderCombat();
  persistCombatState();
}

/* Sincronización Estricta: Armas equipadas -> Ataques */
function getEquippedWeapons() {
  const equippedInventoryWeapons = state.equipment.filter(
    item => item.type === "weapon" && item.location === "equipped"
  );

  const matched = [];
  equippedInventoryWeapons.forEach(item => {
    const found = OFFICIAL_ATTACKS_CATALOG.find(
      c => c.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    if (found) {
      matched.push(found);
    } else {
      matched.push({
        name: item.name,
        isPact: false,
        isFirearm: false,
        dmgDie: item.damage || "1d6",
        dmgType: item.damageType || "Cortante"
      });
    }
  });

  const eldritch = OFFICIAL_ATTACKS_CATALOG.find(c => c.isSpell);
  if (eldritch && !matched.some(m => m.name === eldritch.name)) {
    matched.push(eldritch);
  }

  return matched;
}

function getAttackCalculations(weapon) {
  const prof = getProficiencyBonus();
  const chaMod = getAbilityModifier(getAbilityScore("charisma"));
  const dexMod = getAbilityModifier(getAbilityScore("dexterity"));
  const strMod = getAbilityModifier(getAbilityScore("strength"));

  let bonus = 0;
  let damageFormula = weapon.dmgDie;

  if (weapon.name === "Red") {
    bonus = prof + dexMod;
    damageFormula = "—";
  } else if (weapon.isSpell) {
    bonus = prof + chaMod;
    damageFormula = `${weapon.dmgDie} (2 rayos)`;
  } else if (weapon.isPact) {
    bonus = prof + chaMod + 1;
    let dmgMod = chaMod + 1;
    if (state.combat.elementalWeaponActive) {
      bonus += 1;
      damageFormula = `${weapon.dmgDie} + ${dmgMod} + 1d4 elem`;
    } else {
      damageFormula = `${weapon.dmgDie} + ${dmgMod}`;
    }
  } else if (weapon.name === "Espada larga platinada") {
    bonus = prof + strMod + 1;
    damageFormula = `${weapon.dmgDie} + ${strMod + 1}`;
  } else {
    bonus = prof + dexMod;
    damageFormula = `${weapon.dmgDie} + ${dexMod}`;
  }

  return { bonus, damageFormula };
}

function performAttack(weaponName) {
  const weapon = getEquippedWeapons().find(w => w.name === weaponName);
  if (!weapon) {
    showToast("El arma no se encuentra equipada.");
    return;
  }

  if (weapon.isFirearm) {
    if (state.resources.ammunition <= 0) {
      showToast("¡Cartuchera vacía! Recarga antes de disparar.");
      return;
    }
    state.resources.ammunition -= 1;
    persistResources();
  }

  const { bonus, damageFormula } = getAttackCalculations(weapon);
  const d20 = rollDice(1, 20).total;
  const isCrit = (state.combat.hexbladeCurseActive && d20 >= 19) || d20 === 20;
  const total = d20 + bonus;

  let title = isCrit ? `⚔ ¡CRÍTICO CON ${weapon.name.toUpperCase()}!` : `ATAQUE: ${weapon.name.toUpperCase()}`;
  let details = `Tirada d20 (${d20}) + Bono (${signed(bonus)})`;

  let smitePrompt = "";
  if (weapon.isPact && state.resources.pactSlots > 0) {
    smitePrompt = `
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--border);">
        <small style="color:var(--bronze)">¿Deseas aplicar Eldritch Smite?</small>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button class="primary full" onclick="triggerSmite(${isCrit})">
            Consumir Slot (+${isCrit ? '8d8' : '4d8'} Fuerza y Derribo)
          </button>
        </div>
      </div>
    `;
  }

  openModal(title, `
    <div class="roll-result">
      <div class="d20" style="${isCrit ? 'color:var(--crimson2)' : ''}">${total}</div>
      <div class="total">${isCrit ? 'Impacto Crítico' : 'Tirada de Impacto'}</div>
      <p>${details}</p>
      <p><b>Daño Base:</b> ${damageFormula} ${isCrit ? '(¡Dados duplicados!)' : ''}</p>
      ${weapon.isFirearm ? `<small>Balas restantes: ${state.resources.ammunition}</small>` : ''}
      ${smitePrompt}
    </div>
  `);

  renderCombat();
}

function triggerSmite(isCrit = false) {
  if (state.resources.pactSlots <= 0) {
    showToast("No quedan espacios de pacto.");
    return;
  }
  state.resources.pactSlots -= 1;
  const diceCount = isCrit ? 8 : 4;
  const smiteDmg = rollDice(diceCount, 8);

  openModal("CASTIGO ARCANO (ELDRITCH SMITE)", `
    <div class="roll-result">
      <div class="d20" style="color:var(--crimson2)">+${smiteDmg.total}</div>
      <div class="total">Daño de Fuerza</div>
      <p>Tirada: [${smiteDmg.rolls.join(" + ")}] (${diceCount}d8)</p>
      <p class="ok">Objetivo Enorme o menor queda automáticamente DERRIBADO.</p>
      <small>Espacios de pacto restantes: ${state.resources.pactSlots}/2</small>
    </div>
  `);

  renderCombat();
  renderSpells();
  persistResources();
}

/* --------------------------------------------------------------------------
   CONCENTRACIÓN Y DESCANSOS
   -------------------------------------------------------------------------- */
function setConcentration(spellName) {
  if (state.combat.activeConcentration && state.combat.activeConcentration !== spellName) {
    showToast(`Concentración en ${state.combat.activeConcentration} rota.`);
  }
  state.combat.activeConcentration = spellName;
  renderCombat();
}

function breakConcentration() {
  if (!state.combat.activeConcentration) return;
  const prev = state.combat.activeConcentration;
  state.combat.activeConcentration = null;

  if (prev === "Arma elemental") {
    state.combat.elementalWeaponActive = false;
  }

  renderCombat();
  showToast(`Concentración en ${prev} finalizada.`);
}

function shortRest() {
  state.resources.pactSlots = state.resources.pactSlotsMax;
  state.combat.hexbladeCurseUsed = false;
  state.combat.hexbladeCurseActive = false;
  breakConcentration();

  renderCombat();
  renderTraits();
  renderSpells();
  persistCombatState();
  persistResources();
  showToast("⏳ Descanso Corto completado.");
}

function longRest() {
  state.combat.currentHp = state.combat.maxHp;
  state.combat.temporaryHp = 0;
  state.resources.pactSlots = state.resources.pactSlotsMax;
  
  state.combat.hexbladeCurseUsed = false;
  state.combat.hexbladeCurseActive = false;
  state.combat.necroticShroudUsed = false;
  state.combat.healingHandsUsed = false;

  state.companions.pourcoon.currentHp = state.companions.pourcoon.maxHp;
  state.companions.specter.state = "ready";

  resetDeathSaves();
  breakConcentration();

  renderApp();
  persistCombatState();
  persistResources();
  showToast("⛺ Descanso Largo: 100% PV y recursos restablecidos.");
}

/* --------------------------------------------------------------------------
   REGLA CASERA DE LADY D.
   -------------------------------------------------------------------------- */
function setLadyDMode(modeKey) {
  if (!LADY_D_CONFIGURATIONS[modeKey]) return;
  state.ladyD.mode = modeKey;
  renderTraits();
  renderSpells();
  persistCombatState();
  showToast(`Lady D: Modo ajustado.`);
}

function castInflictWounds() {
  const config = LADY_D_CONFIGURATIONS[state.ladyD.mode];

  if (config.pactCost > 0) {
    if (state.resources.pactSlots <= 0) {
      showToast("No tienes espacios de pacto disponibles.");
      return;
    }
    state.resources.pactSlots -= 1;
    persistResources();
  }

  let selfDmgMsg = "";
  if (config.selfDamage) {
    const selfDmg = rollDice(1, 4).total;
    applyDamage(selfDmg);
    selfDmgMsg = `<p style="color:var(--danger)"><b>Autodaño de dolor:</b> Sufres ${selfDmg} puntos de daño personal.</p>`;
  }

  const atkRoll = rollDice(1, 20).total + getSpellAttackBonus();

  openModal("INFLIGIR HERIDAS (LADY D.)", `
    <div class="roll-result">
      <div class="d20">${atkRoll}</div>
      <div class="total">Ataque de Conjuro Cuerpo a Cuerpo</div>
      <p>Modo: <b>${config.name}</b></p>
      <p><b>Daño al impactar:</b> ${config.damageDice} necrótico</p>
      ${selfDmgMsg}
      <small>Espacios de pacto: ${state.resources.pactSlots}/2</small>
    </div>
  `);

  renderApp();
}

/* --------------------------------------------------------------------------
   COMPAÑEROS & TARJETA DE LEALTAD
   -------------------------------------------------------------------------- */
function cycleSpecterState() {
  const current = state.companions.specter.state;
  if (current === "ready") {
    state.companions.specter.state = "summoned";
    showToast("Espectro convocado.");
  } else if (current === "summoned") {
    state.companions.specter.state = "consumed";
    showToast("Espectro disipado hasta descanso largo.");
  } else {
    showToast("El espectro está consumido. Requiere Descanso Largo.");
    return;
  }
  renderCompanions();
  persistCombatState();
}

function toggleLoyaltyStamp(index) {
  if (index === state.resources.deaths) {
    state.resources.deaths = index - 1;
    delete state.ui.stampRotations[index];
  } else {
    state.resources.deaths = index;
    state.ui.stampRotations[index] = Math.floor(Math.random() * 91) - 45;
  }

  if (state.resources.deaths === 10) {
    playGruntBirthdayParty();
  }

  renderCombat();
  persistResources();
}

function playGruntBirthdayParty() {
  try {
    const audio = new Audio("https://www.myinstants.com/media/sounds/grunt-birthday-party.mp3");
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch (e) {}

  if (typeof confetti === "function") {
    confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
  }
}

/* --------------------------------------------------------------------------
   RENDERIZADORES DE LA INTERFAZ
   -------------------------------------------------------------------------- */
function renderApp() {
  renderIdentityHead();
  renderCombat();
  renderSheet();
  renderTraits();
  renderEquipment();
  renderSpells();
  renderCompanions();
  renderDiary();
}

function renderIdentityHead() {
  safeSetText("headName", state.character?.name || "Lior Kurogane");
  safeSetText("headLevel", state.character?.class_level || 6);
  safeSetText("sheetLevel", state.character?.class_level || 6);
}

function renderCombat() {
  const curHp = state.combat.currentHp;
  const maxHp = state.combat.maxHp;
  safeSetText("hpText", `${curHp} / ${maxHp}`);
  const hpPercent = clamp((curHp / maxHp) * 100, 0, 100);
  const barEl = $("hpBar");
  if (barEl) barEl.style.width = `${hpPercent}%`;

  const badge = $("tempBadge");
  if (badge) {
    if (state.combat.temporaryHp > 0) {
      badge.classList.remove("hidden");
      badge.textContent = `+${state.combat.temporaryHp} temp`;
    } else {
      badge.classList.add("hidden");
    }
  }

  const acData = calculateArmorClass();
  safeSetText("acText", acData.total);
  safeSetText("acDetail", acData.detail);
  safeSetText("initiativeText", signed(calculateInitiative()));

  safeSetText("concentrationText", state.combat.activeConcentration || "Ninguna");
  const breakBtn = $("breakConcentration");
  if (breakBtn) breakBtn.classList.toggle("hidden", !state.combat.activeConcentration);

  const curseToggle = $("curseToggle");
  if (curseToggle) {
    curseToggle.classList.toggle("active", state.combat.hexbladeCurseActive);
    curseToggle.querySelector("span").textContent = state.combat.hexbladeCurseActive ? "✓" : "○";
  }

  const elemToggle = $("elementalToggle");
  if (elemToggle) {
    elemToggle.classList.toggle("active", state.combat.elementalWeaponActive);
    elemToggle.querySelector("span").textContent = state.combat.elementalWeaponActive ? "✓" : "○";
  }

  renderDots("successDots", state.combat.deathSaves.successes, "success");
  renderDots("failureDots", state.combat.deathSaves.failures, "failure");
  safeSetText("ammoText", state.resources.ammunition);

  // Tabla de Ataques (armas equipadas)
  const attacksBody = $("attacksBody");
  if (attacksBody) {
    const weapons = getEquippedWeapons();
    if (weapons.length === 0) {
      attacksBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted)">Sin armas equipadas en el inventario.</td></tr>`;
    } else {
      attacksBody.innerHTML = weapons.map(w => {
        const { bonus, damageFormula } = getAttackCalculations(w);
        return `
          <tr class="attack-row" onclick="performAttack('${escapeHtml(w.name)}')">
            <td><strong>${escapeHtml(w.name)}</strong></td>
            <td><b style="color:var(--bronze)">${signed(bonus)}</b></td>
            <td>${damageFormula}</td>
            <td><small>${w.dmgType}</small></td>
          </tr>
        `;
      }).join("");
    }
  }

  // Habilidades rápidas
  const skillsGrid = $("skillsGrid");
  if (skillsGrid) {
    skillsGrid.innerHTML = Object.keys(SKILL_DEFINITIONS).map(k => {
      const def = SKILL_DEFINITIONS[k];
      const bonus = getSkillBonus(k);
      return `
        <div class="skill" onclick="rollSkillCheck('${k}')">
          <div><strong>${def.name}</strong><small>${def.ability.substring(0,3).toUpperCase()}</small></div>
          <b>${signed(bonus)}</b>
        </div>
      `;
    }).join("");
  }

  // Tarjeta de Lealtad Mortal (Solo icono puro con rotación de -45° a +45°)
  safeSetText("deathCount", state.resources.deaths);
  const stampsContainer = $("deathStamps");
  if (stampsContainer) {
    let html = "";
    for (let i = 1; i <= 10; i++) {
      const stamped = i <= state.resources.deaths;
      const rot = state.ui.stampRotations[i] || 0;
      html += `
        <div class="stamp ${stamped ? 'filled' : ''}" onclick="toggleLoyaltyStamp(${i})" title="Sello ${i}">
          ${stamped ? `
            <img src="logo.png" class="stamp-icon-pure" style="transform:rotate(${rot}deg)" alt="Sello Pourcoon">
          ` : i}
        </div>
      `;
    }
    stampsContainer.innerHTML = html;
  }
}

function renderDots(containerId, filledCount, type) {
  const el = $(containerId);
  if (!el) return;
  let html = "";
  for (let i = 1; i <= 3; i++) {
    html += `<span class="dot ${type} ${i <= filledCount ? 'filled' : ''}"></span>`;
  }
  el.innerHTML = html;
}

function renderSheet() {
  // Atributos limpios sin botones
  const abilityGrid = $("abilityGrid");
  if (abilityGrid) {
    const stats = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    abilityGrid.innerHTML = stats.map(s => {
      const score = getAbilityScore(s);
      const mod = getAbilityModifier(score);
      return `
        <div class="clean-ability-cell">
          <h3>${s.substring(0,3).toUpperCase()}</h3>
          <div class="val">${score}</div>
          <div class="mod" style="color:var(--bronze)">${signed(mod)}</div>
        </div>
      `;
    }).join("");
  }

  safeSetText("profText", signed(getProficiencyBonus()));
  safeSetText("spellDcText", getSpellSaveDC());
  safeSetText("spellAttackText", signed(getSpellAttackBonus()));
  safeSetText("passivePerception", getPassivePerception());
  safeSetText("passiveInvestigation", getPassiveInvestigation());

  const savingGrid = $("savingGrid");
  if (savingGrid) {
    const stats = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    savingGrid.innerHTML = stats.map(s => {
      const bonus = getSavingThrowBonus(s);
      const isProf = s === "wisdom" || s === "charisma";
      return `
        <div onclick="rollSavingThrow('${s}')" style="cursor:pointer">
          <span>${s.substring(0,3).toUpperCase()} ${isProf ? '✦' : ''}</span>
          <b style="color:var(--bronze)">${signed(bonus)}</b>
        </div>
      `;
    }).join("");
  }

  const sheetSkills = $("sheetSkills");
  if (sheetSkills) {
    sheetSkills.innerHTML = Object.keys(SKILL_DEFINITIONS).map(k => {
      const def = SKILL_DEFINITIONS[k];
      const data = state.skills.find(s => s.key === k) || { proficient: false, expertise: false };
      return `
        <div class="edit-skill">
          <label>${def.name} (${signed(getSkillBonus(k))})</label>
          <button class="${data.proficient ? 'primary' : ''}" onclick="toggleSkillProficiency('${k}')">
            ${data.proficient ? '✦ Comp' : '○ Comp'}
          </button>
          <button class="${data.expertise ? 'primary' : ''}" onclick="toggleSkillExpertise('${k}')">
            ${data.expertise ? '✦✦ Pericia' : '○ Pericia'}
          </button>
        </div>
      `;
    }).join("");
  }
}

function renderTraits() {
  const ladyDesc = $("ladyModeDescription");
  if (ladyDesc) {
    ladyDesc.textContent = LADY_D_CONFIGURATIONS[state.ladyD.mode]?.desc || "";
  }
  const ladySel = $("ladyMode");
  if (ladySel) ladySel.value = state.ladyD.mode;

  const racialContainer = $("racialTraits");
  if (racialContainer) {
    racialContainer.innerHTML = `
      <div class="trait">
        <div><strong>Mortaja Necrótica</strong><small>Asusta a 10 ft (CD ${getSpellSaveDC()}) y suma +${state.character?.class_level || 6} daño necrótico.</small></div>
        <button class="small-btn ${state.combat.necroticShroudUsed ? '' : 'primary'}" onclick="useNecroticShroud()" ${state.combat.necroticShroudUsed ? 'disabled' : ''}>
          ${state.combat.necroticShroudUsed ? 'Agotado' : 'Desatar'}
        </button>
      </div>
      <div class="trait">
        <div><strong>Manos Curativas</strong><small>Toca para sanar ${state.character?.class_level || 6} PV (1/Descanso largo).</small></div>
        <button class="small-btn ${state.combat.healingHandsUsed ? '' : 'primary'}" onclick="useHealingHands()" ${state.combat.healingHandsUsed ? 'disabled' : ''}>
          ${state.combat.healingHandsUsed ? 'Agotado' : 'Sanar'}
        </button>
      </div>
      <div class="trait">
        <div><strong>Resistencia Celestial</strong><small>Resistencia a daño necrótico y radiante.</small></div>
        <span class="badge green">Pasivo</span>
      </div>
    `;
  }

  const classContainer = $("classTraits");
  if (classContainer) {
    classContainer.innerHTML = `
      <div class="trait">
        <div><strong>Guerrero Maléfico</strong><small>Usa Carisma (+${getAbilityModifier(getAbilityScore("charisma"))}) para impactar y dañar.</small></div>
        <span class="badge green">Activo</span>
      </div>
      <div class="trait">
        <div><strong>Maldición del Filo</strong><small>Crítico 19-20, +${getProficiencyBonus()} daño y sana al morir el objetivo.</small></div>
        <button class="small-btn ${state.combat.hexbladeCurseUsed ? '' : 'primary'}" onclick="toggleHexbladeCurse()" ${state.combat.hexbladeCurseUsed ? 'disabled' : ''}>
          ${state.combat.hexbladeCurseUsed ? 'Consumida' : 'Activar'}
        </button>
      </div>
    `;
  }

  const invocationsContainer = $("invocations");
  if (invocationsContainer) {
    invocationsContainer.innerHTML = `
      <div class="trait"><div><strong>Arma de Pacto Mejorada</strong><small>Foco de conjuro y bonificador +1 al ataque y daño.</small></div></div>
      <div class="trait"><div><strong>Castigo Arcano (Eldritch Smite)</strong><small>Consume espacio para 4d8 fuerza y derribar al objetivo.</small></div></div>
      <div class="trait"><div><strong>Filo Sediento (Thirsting Blade)</strong><small>Permite 2 ataques con arma de pacto al usar acción de Ataque.</small></div></div>
    `;
  }
}

function renderEquipment() {
  safeSetText("gp", state.resources.currency.gp);
  safeSetText("sp", state.resources.currency.sp);
  safeSetText("cp", state.resources.currency.cp);

  const container = $("equipmentList");
  if (!container) return;

  container.innerHTML = state.equipment.map(item => {
    const locClass = item.location;
    const locLabel = item.location === "equipped" ? "⚔ Equipado" : (item.location === "carried" ? "🎒 Cargado" : "📦 Almacenado");
    return `
      <div class="equip ${locClass}">
        <div class="equip-info">
          <strong>${escapeHtml(item.name)}</strong>
          <small>Cantidad: ${item.quantity || 1} · Tipo: ${item.type || 'objeto'}</small>
        </div>
        <div class="equip-actions">
          <button onclick="cycleEquipmentLocation('${item.id}')">${locLabel}</button>
          <button class="delete-note" onclick="deleteEquipmentItem('${item.id}')">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderSpells() {
  // Espacios de pacto limpios sin más/menos
  safeSetText("slotText", `${state.resources.pactSlots} / ${state.resources.pactSlotsMax}`);
  const listEl = $("spellList");
  if (!listEl) return;

  listEl.innerHTML = state.spells.map((sp, idx) => {
    let tag = sp.level;
    if (sp.name === "Infligir heridas") {
      tag = LADY_D_CONFIGURATIONS[state.ladyD.mode]?.name || "Lady D.";
    }
    return `
      <div class="spell" onclick="openSpellDetails(${idx})">
        <div>
          <strong>${escapeHtml(sp.name)}</strong>
          <small>${sp.time} · ${sp.range} ${sp.concentration ? '· [Concentración]' : ''}</small>
        </div>
        <span class="spell-tag">${tag}</span>
      </div>
    `;
  }).join("");
}

function renderCompanions() {
  safeSetText("pourHp", `${state.companions.pourcoon.currentHp}/${state.companions.pourcoon.maxHp}`);
  const pourPercent = clamp((state.companions.pourcoon.currentHp / state.companions.pourcoon.maxHp) * 100, 0, 100);
  const pourBar = $("pourBar");
  if (pourBar) pourBar.style.width = `${pourPercent}%`;

  const specterHp = Math.floor((state.character?.class_level || 6) / 2);
  safeSetText("specterHp", specterHp);
  safeSetText("specterAttack", signed(getAbilityModifier(getAbilityScore("charisma"))));

  const specterEl = $("specterState");
  if (specterEl) {
    const st = state.companions.specter.state;
    specterEl.className = `specter-state ${st === 'ready' ? 'rest' : (st === 'summoned' ? 'active' : 'spent')}`;
    if (st === "ready") specterEl.textContent = "💤 En reposo (Listo para convocar)";
    else if (st === "summoned") specterEl.textContent = "👻 Convocado (Activo en combate)";
    else specterEl.textContent = "💀 Consumido (Agotado hasta descanso largo)";
  }
}

function renderDiary() {
  const container = $("notesList");
  if (!container) return;

  const filter = state.ui.noteFilter;
  const filtered = filter === "all" ? state.notes : state.notes.filter(n => n.note_type === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="note"><small>Sin notas en esta categoría.</small></div>`;
    return;
  }

  container.innerHTML = filtered.map(n => `
    <div class="note">
      <div class="note-head">
        <strong>${escapeHtml(n.title)}</strong>
        <span class="badge green">${n.note_type?.toUpperCase() || 'NOTA'}</span>
      </div>
      <p style="margin:6px 0;font-size:12px;white-space:pre-wrap;">${escapeHtml(n.content)}</p>
      <button class="delete-note" onclick="deleteNoteItem('${n.id}')">Eliminar</button>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   ACCIONES DE RASGOS Y CONJUROS
   -------------------------------------------------------------------------- */
function useNecroticShroud() {
  if (state.combat.necroticShroudUsed) {
    showToast("Mortaja Necrótica ya fue utilizada.");
    return;
  }
  state.combat.necroticShroudUsed = true;
  openModal("MORTAJA NECRÓTICA", `
    <div class="roll-result">
      <div class="d20" style="color:var(--crimson2)">💀</div>
      <div class="total">Alas de Sombra Desatadas</div>
      <p>Criaturas a 10 ft deben superar salvación de CARISMA (CD ${getSpellSaveDC()}) o estarán asustadas.</p>
      <p class="ok">+${state.character?.class_level || 6} daño necrótico en un ataque por turno durante 1 minuto.</p>
    </div>
  `);
  renderTraits();
  persistCombatState();
}

function useHealingHands() {
  if (state.combat.healingHandsUsed) {
    showToast("Manos Curativas ya fue utilizada.");
    return;
  }
  const amount = state.character?.class_level || 6;
  state.combat.healingHandsUsed = true;
  healCharacter(amount);
  showToast(`Manos Curativas: Has recuperado ${amount} PV.`);
  renderTraits();
  persistCombatState();
}

function toggleHexbladeCurse() {
  if (state.combat.hexbladeCurseUsed && !state.combat.hexbladeCurseActive) {
    showToast("La Maldición del Filo ya fue consumida.");
    return;
  }
  state.combat.hexbladeCurseActive = !state.combat.hexbladeCurseActive;
  if (state.combat.hexbladeCurseActive) {
    state.combat.hexbladeCurseUsed = true;
  }
  renderCombat();
  renderTraits();
  persistCombatState();
}

function openSpellDetails(spellIndex) {
  const sp = state.spells[spellIndex];
  if (!sp) return;

  if (sp.name === "Infligir heridas") {
    castInflictWounds();
    return;
  }

  let actionBtn = "";
  if (sp.isCantrip) {
    actionBtn = `<button class="primary full" onclick="castSpellFromModal('${escapeHtml(sp.name)}', true, ${Boolean(sp.concentration)})">Lanzar Truco (Sin Coste)</button>`;
  } else {
    actionBtn = `
      <button class="primary full" onclick="castSpellFromModal('${escapeHtml(sp.name)}', false, ${Boolean(sp.concentration)})" ${state.resources.pactSlots <= 0 ? 'disabled' : ''}>
        Lanzar Conjuro (Consume 1 Espacio · ${state.resources.pactSlots}/2 disponibles)
      </button>
    `;
  }

  openModal(sp.name, `
    <div>
      <span class="badge green">${sp.level}</span>
      <p><b>Tiempo:</b> ${sp.time} · <b>Alcance:</b> ${sp.range} · <b>Duración:</b> ${sp.duration}</p>
      <p><b>Efecto / Daño:</b> ${sp.damage}</p>
      <p>${sp.desc}</p>
      ${sp.concentration ? '<p style="color:var(--bronze)"><b>Requiere Concentración</b></p>' : ''}
      <div class="modal-actions">${actionBtn}</div>
    </div>
  `);
}

function castSpellFromModal(name, isCantrip, isConcentration) {
  if (!isCantrip) {
    if (state.resources.pactSlots <= 0) {
      showToast("Sin espacios de pacto disponibles.");
      return;
    }
    state.resources.pactSlots -= 1;
    persistResources();
  }

  if (isConcentration) {
    setConcentration(name);
  }

  if (name.includes("Armadura de Agathys")) {
    setTemporaryHp(15);
  }

  closeModal();
  renderApp();
  showToast(`¡Has lanzado ${name}!`);
}

/* --------------------------------------------------------------------------
   GESTIÓN DE EQUIPO
   -------------------------------------------------------------------------- */
function cycleEquipmentLocation(itemId) {
  const item = state.equipment.find(i => i.id === itemId);
  if (!item) return;

  const cycle = ["equipped", "carried", "stored"];
  item.location = cycle[(cycle.indexOf(item.location) + 1) % cycle.length];

  saveLocalBackup();
  renderApp();
  persistEquipment(item);
}

function deleteEquipmentItem(itemId) {
  state.equipment = state.equipment.filter(i => i.id !== itemId);
  saveLocalBackup();
  renderApp();
  deleteEquipmentFromDB(itemId);
}

function addNewEquipment() {
  const name = prompt("Nombre del nuevo objeto:");
  if (!name || !name.trim()) return;

  const lower = name.toLowerCase();
  let type = "item";
  let baseAC = null;
  let maxDex = null;
  let bonusAC = null;

  if (lower.includes("coraza") || lower.includes("armadura")) {
    type = "armor";
    baseAC = 14;
    maxDex = 2;
  } else if (lower.includes("broquel") || lower.includes("escudo")) {
    type = "shield";
    bonusAC = 2;
  } else if (lower.includes("pistola") || lower.includes("mosquete") || lower.includes("arpón") || lower.includes("arpon") || lower.includes("espada") || lower.includes("daga") || lower.includes("red")) {
    type = "weapon";
  }

  const newItem = {
    id: `eq-${Date.now()}`,
    name: name.trim(),
    quantity: 1,
    location: "carried",
    type,
    baseAC,
    maxDex,
    bonusAC
  };

  state.equipment.push(newItem);
  saveLocalBackup();
  renderApp();
  persistEquipment(newItem);
}

/* --------------------------------------------------------------------------
   MODAL Y TOASTS
   -------------------------------------------------------------------------- */
function openModal(title, htmlContent) {
  const modal = $("modal");
  const content = $("modalContent");
  if (!modal || !content) return;

  content.innerHTML = `<h2>${escapeHtml(title)}</h2>${htmlContent}`;
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = $("modal");
  if (modal) modal.classList.add("hidden");
}

function showToast(message) {
  showStatus(message);
  setTimeout(() => showStatus("Sincronizado"), 3000);
}

/* --------------------------------------------------------------------------
   PERSISTENCIA
   -------------------------------------------------------------------------- */
async function loadAllData() {
  try {
    showStatus("Cargando...");
    
    const { data: char } = await db
      .from("characters")
      .select("*")
      .eq("name", "Lior Kurogane")
      .limit(1)
      .maybeSingle();

    if (char) {
      state.character = char;
      state.combat.currentHp = char.current_hp ?? 48;
      state.combat.maxHp = char.max_hp ?? 48;
      state.combat.temporaryHp = char.temporary_hp ?? 0;
      state.resources.pactSlots = char.spell_slots_level_3 ?? 2;
      state.resources.ammunition = char.ammo ?? 20;
      state.resources.deaths = char.deaths ?? 4;
      state.combat.hexbladeCurseUsed = char.hexblade_curse_used ?? false;
      state.combat.necroticShroudUsed = char.necrotic_shroud_used ?? false;
      state.combat.healingHandsUsed = char.healing_hands_used ?? false;
      state.companions.specter.state = char.specter_state ?? "ready";
      state.ladyD.mode = char.lady_d_mode ?? "cantrip_free";
    }

    const { data: notes } = await db
      .from("campaign_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (notes) state.notes = notes;

    const localEquip = localStorage.getItem("lior_equipment");
    if (localEquip) {
      try { state.equipment = JSON.parse(localEquip); } catch (e) { initDefaultEquipment(); }
    } else {
      initDefaultEquipment();
    }

    initializeOfficialSkills();
    showStatus("Sincronizado");
  } catch (err) {
    console.warn("Fallo en Supabase, usando respaldo local:", err);
    loadLocalBackup();
    showStatus("Modo Local", false);
  }
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
  saveLocalBackup();
}

function initializeOfficialSkills() {
  state.skills = Object.keys(SKILL_DEFINITIONS).map(k => {
    let proficient = false;
    let expertise = false;
    if (k === "athletics" || k === "perception" || k === "religion") proficient = true;
    if (k === "deception") { proficient = true; expertise = true; }
    return { key: k, proficient, expertise };
  });
}

function saveLocalBackup() {
  localStorage.setItem("lior_equipment", JSON.stringify(state.equipment));
  localStorage.setItem("lior_state_backup", JSON.stringify({
    combat: state.combat,
    resources: state.resources,
    companions: state.companions,
    ladyD: state.ladyD,
    equipment: state.equipment
  }));
}

function loadLocalBackup() {
  const raw = localStorage.getItem("lior_state_backup");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state.combat, parsed.combat);
    Object.assign(state.resources, parsed.resources);
    Object.assign(state.companions, parsed.companions);
    Object.assign(state.ladyD, parsed.ladyD);
    if (parsed.equipment) state.equipment = parsed.equipment;
  } catch (e) {}
}

async function persistCombatState() {
  saveLocalBackup();
  try {
    await db.from("characters").update({
      current_hp: state.combat.currentHp,
      temporary_hp: state.combat.temporaryHp,
      hexblade_curse_used: state.combat.hexbladeCurseUsed,
      necrotic_shroud_used: state.combat.necroticShroudUsed,
      healing_hands_used: state.combat.healingHandsUsed,
      specter_state: state.companions.specter.state,
      lady_d_mode: state.ladyD.mode
    }).eq("name", "Lior Kurogane");
  } catch (e) {}
}

async function persistResources() {
  saveLocalBackup();
  try {
    await db.from("characters").update({
      spell_slots_level_3: state.resources.pactSlots,
      ammo: state.resources.ammunition,
      deaths: state.resources.deaths,
      gold: state.resources.currency.gp,
      silver: state.resources.currency.sp,
      copper: state.resources.currency.cp
    }).eq("name", "Lior Kurogane");
  } catch (e) {}
}

async function persistEquipment(item) {
  try {
    await db.from("character_equipment").upsert({
      id: item.id.includes("eq-") ? undefined : item.id,
      name: item.name,
      quantity: item.quantity,
      location: item.location
    });
  } catch (e) {}
}

async function deleteEquipmentFromDB(itemId) {
  try {
    await db.from("character_equipment").delete().eq("id", itemId);
  } catch (e) {}
}

/* --------------------------------------------------------------------------
   EXPOSICIÓN GLOBAL
   -------------------------------------------------------------------------- */
window.performAttack = performAttack;
window.triggerSmite = triggerSmite;
window.cycleEquipmentLocation = cycleEquipmentLocation;
window.deleteEquipmentItem = deleteEquipmentItem;
window.openSpellDetails = openSpellDetails;
window.castSpellFromModal = castSpellFromModal;
window.toggleLoyaltyStamp = toggleLoyaltyStamp;
window.useNecroticShroud = useNecroticShroud;
window.useHealingHands = useHealingHands;
window.toggleHexbladeCurse = toggleHexbladeCurse;

window.rollSkillCheck = function(skillKey) {
  const def = SKILL_DEFINITIONS[skillKey];
  const bonus = getSkillBonus(skillKey);
  const d20 = rollDice(1, 20).total;
  const total = d20 + bonus;

  openModal(`PRUEBA: ${def.name.toUpperCase()}`, `
    <div class="roll-result">
      <div class="d20">${d20}</div>
      <div class="total">${total}</div>
      <p>d20 (${d20}) + Bono (${signed(bonus)}) [${def.ability.substring(0,3).toUpperCase()}]</p>
    </div>
  `);
};

window.rollSavingThrow = function(ability) {
  const bonus = getSavingThrowBonus(ability);
  const d20 = rollDice(1, 20).total;
  const total = d20 + bonus;

  openModal(`SALVACIÓN: ${ability.toUpperCase()}`, `
    <div class="roll-result">
      <div class="d20">${d20}</div>
      <div class="total">${total}</div>
      <p>d20 (${d20}) + Salvación (${signed(bonus)})</p>
    </div>
  `);
};

window.toggleSkillProficiency = function(skillKey) {
  const sk = state.skills.find(s => s.key === skillKey);
  if (!sk) return;
  sk.proficient = !sk.proficient;
  if (!sk.proficient) sk.expertise = false;
  renderSheet();
  renderCombat();
};

window.toggleSkillExpertise = function(skillKey) {
  const sk = state.skills.find(s => s.key === skillKey);
  if (!sk) return;
  sk.expertise = !sk.expertise;
  if (sk.expertise) sk.proficient = true;
  renderSheet();
  renderCombat();
};

window.deleteNoteItem = async function(noteId) {
  state.notes = state.notes.filter(n => n.id !== noteId);
  renderDiary();
  try {
    await db.from("campaign_notes").delete().eq("id", noteId);
  } catch (e) {}
};

function bindEvents() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      $(target)?.classList.add("active");
    });
  });

  document.querySelectorAll("[data-hp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const delta = parseInt(btn.dataset.hp, 10);
      if (delta < 0) applyDamage(Math.abs(delta));
      else healCharacter(delta);
    });
  });

  $("tempHpBtn")?.addEventListener("click", () => {
    const val = prompt("Puntos de golpe temporales a asignar:", state.combat.temporaryHp);
    if (val !== null) setTemporaryHp(parseInt(val, 10) || 0);
  });

  $("curseToggle")?.addEventListener("click", toggleHexbladeCurse);
  $("elementalToggle")?.addEventListener("click", () => {
    state.combat.elementalWeaponActive = !state.combat.elementalWeaponActive;
    if (state.combat.elementalWeaponActive) setConcentration("Arma elemental");
    else if (state.combat.activeConcentration === "Arma elemental") breakConcentration();
    renderCombat();
  });

  $("breakConcentration")?.addEventListener("click", breakConcentration);

  $("rollDeath")?.addEventListener("click", rollDeathSave);
  $("clearSaves")?.addEventListener("click", resetDeathSaves);

  $("shootBtn")?.addEventListener("click", () => {
    if (state.resources.ammunition > 0) {
      state.resources.ammunition -= 1;
      renderCombat();
      persistResources();
    } else {
      showToast("Sin balas.");
    }
  });

  $("reloadBtn")?.addEventListener("click", () => {
    state.resources.ammunition += 10;
    renderCombat();
    persistResources();
  });

  $("ammoMinus5")?.addEventListener("click", () => {
    state.resources.ammunition = Math.max(0, state.resources.ammunition - 5);
    renderCombat();
    persistResources();
  });

  $("ammoSet")?.addEventListener("click", () => {
    const val = prompt("Establecer cantidad de balas:", state.resources.ammunition);
    if (val !== null) {
      state.resources.ammunition = Math.max(0, parseInt(val, 10) || 0);
      renderCombat();
      persistResources();
    }
  });

  $("shortRest")?.addEventListener("click", shortRest);
  $("longRest")?.addEventListener("click", longRest);

  document.querySelectorAll("[data-coin]").forEach(btn => {
    btn.addEventListener("click", () => {
      const coin = btn.dataset.coin;
      const delta = parseInt(btn.dataset.delta, 10);
      state.resources.currency[coin] = Math.max(0, state.resources.currency[coin] + delta);
      renderEquipment();
      persistResources();
    });
  });

  $("ladyMode")?.addEventListener("change", (e) => setLadyDMode(e.target.value));
  $("addEquipment")?.addEventListener("click", addNewEquipment);

  document.querySelectorAll("[data-pour]").forEach(btn => {
    btn.addEventListener("click", () => {
      const d = parseInt(btn.dataset.pour, 10);
      state.companions.pourcoon.currentHp = clamp(
        state.companions.pourcoon.currentHp + d, 0, state.companions.pourcoon.maxHp
      );
      renderCompanions();
    });
  });

  $("pourReset")?.addEventListener("click", () => {
    state.companions.pourcoon.currentHp = state.companions.pourcoon.maxHp;
    renderCompanions();
  });

  $("pourDie")?.addEventListener("click", () => {
    const d20 = rollDice(1, 20).total;
    if (d20 === 12) {
      state.companions.pourcoon.currentHp = 0;
      openModal("POURCOON", `<p class="error">¡Crítico 12! Se muere solito.</p>`);
    } else {
      openModal("POURCOON", `<p class="ok">Tirada ${d20}. Sobrevive a la reacción.</p>`);
    }
    renderCompanions();
  });

  $("specterCycle")?.addEventListener("click", cycleSpecterState);

  $("saveNote")?.addEventListener("click", async () => {
    const title = $("noteTitle")?.value.trim();
    const note_type = $("noteType")?.value;
    const content = $("noteContent")?.value.trim();

    if (!title) return showToast("Escribe un título.");

    const payload = {
      title,
      note_type,
      content,
      character_id: state.character?.id
    };

    try {
      const { data, error } = await db.from("campaign_notes").insert([payload]).select();
      if (!error && data) {
        state.notes.unshift(data[0]);
        $("noteTitle").value = "";
        $("noteContent").value = "";
        renderDiary();
        showToast("Nota guardada en Supabase.");
      }
    } catch (e) {
      payload.id = `note-${Date.now()}`;
      state.notes.unshift(payload);
      $("noteTitle").value = "";
      $("noteContent").value = "";
      renderDiary();
      showToast("Nota guardada en local.");
    }
  });

  $("noteFilter")?.addEventListener("change", (e) => {
    state.ui.noteFilter = e.target.value;
    renderDiary();
  });

  $("modalClose")?.addEventListener("click", closeModal);
  $("modal")?.addEventListener("click", (e) => {
    if (e.target === $("modal")) closeModal();
  });

  $("syncBtn")?.addEventListener("click", async () => {
    await loadAllData();
    renderApp();
    showToast("Sincronizado");
  });

  document.querySelectorAll("[data-social]").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.social;
      if (type === "pasaje") {
        openModal("PASAJE MARÍTIMO", `
          <p>Puedes asegurar pasaje gratuito para ti y tus compañeros sirviendo a la tripulación.</p>
          <button class="primary full" onclick="rollSkillCheck('persuasion')">Tirar Persuasión</button>
        `);
      } else {
        openModal("PELEA DE TABERNA", `
          <p>Resuelve una disputa ruda o gana el respeto del puerto.</p>
          <div class="modal-actions">
            <button class="primary" onclick="rollSkillCheck('athletics')">Atletismo (Fuerza)</button>
            <button class="secondary" onclick="rollSkillCheck('intimidation')">Intimidar (Carisma)</button>
          </div>
        `);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   INICIALIZACIÓN
   -------------------------------------------------------------------------- */
async function initApp() {
  try {
    bindEvents();
    await loadAllData();
    renderApp();
  } catch (error) {
    console.error("Error inicializando aplicación:", error);
    showStatus("Error", false);
  }
}

window.addEventListener("DOMContentLoaded", initApp);