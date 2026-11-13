/* Adapter for the existing vanilla-JS sheet. Simulation preferences are UI-only. */
const DamagePreview = { id: '', ac: 16, advantage: false, hex: false, curse: false, thirst: true, shroud: false, smite: false };

function dcAttacks() {
  const cs = character.combat_state, inv = cs.invocations_known || [];
  const level = Number(character.level), warlock = Number(cs.class_levels?.Brujo ?? level);
  const prog = getWarlockProgression(warlock), prof = 2 + Math.floor((level - 1) / 4);
  const tier = level < 5 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
  const shared = { level, prof };
  const attacks = inventory.filter(w => w.category === 'arma' &&
    (w.is_pact_weapon ? w.id === cs.battle?.summonedWeaponId : w.is_carried && w.is_equipped && Number(w.quantity ?? 1) > 0))
    .filter(w => LiorDamage.dice(w.damage_dice)).map(w => {
      // Ranged weapons use DEX; thrown melee weapons retain STR (or finesse).
      const ranged = /pistol|musket/.test(bKind(w)) || /arco|ballesta|cerbatana|honda/i.test(w.name);
      const mod = w.is_pact_weapon || w.use_cha ? getMod(character.cha) : /sutil|finesse/i.test(w.properties || '')
        ? Math.max(getMod(character.str), getMod(character.dex)) : getMod(character[ranged ? 'dex' : 'str']);
      const magic = Number(w.magic_bonus) || 0;
      const loading = /de carga|loading/i.test(w.properties || '');
      const ignoresLoading = w.ignore_loading === true || (/pistol|musket/.test(bKind(w)) && (cs.feats || []).includes('gunner'))
        || (/ballesta/i.test(w.name) && (cs.feats || []).includes('crossbow_expert'));
      return { ...shared, id: 'weapon:' + w.id, sourceId: w.id, type: 'weapon', name: w.name,
        bonus: prof + mod + magic, dice: w.damage_dice,
        flat: mod + magic + (w.is_pact_weapon && warlock >= 12 && inv.includes('lifedrinker') ? getMod(character.cha) : 0), count: 1,
        thirst: w.is_pact_weapon && warlock >= 5 && inv.includes('thirsting_blade'),
        loadingLimited: loading && !ignoresLoading,
        smite: w.is_pact_weapon && warlock >= 5 && inv.includes('eldritch_smite') ? prog.smiteDice : null,
        ammo: bKind(w) === 'pistol' ? character.ammo_pistol : bKind(w) === 'musket' ? character.ammo_musket : null };
    });
  for (const sp of spells.filter(s => s.is_known)) {
    const blast = /descarga sobrenatural|eldritch blast/i.test(sp.name), chill = /toque helado|chill touch/i.test(sp.name);
    const wounds = /infligir heridas|inflict wounds/i.test(sp.name);
    // A saving-throw spell is never silently treated as an attack against AC.
    const attackRoll = blast || chill || wounds || /(?:tirada|ataque) de ataque|ataque (?:de conjuro|mágico)|spell attack/i.test(sp.description || '');
    if (!attackRoll || Number(sp.level) > prog.slotLevel) continue;
    let dice = blast ? '1d10' : chill ? tier + 'd8' : wounds ? (2 + prog.slotLevel) + 'd10' : sp.damage_dice;
    if (!LiorDamage.dice(dice)) continue;
    attacks.push({ ...shared, id: 'spell:' + sp.id, sourceId: sp.id, type: 'spell', name: sp.name,
      bonus: prof + getMod(character.cha), dice, count: blast ? tier : 1,
      flat: blast && inv.includes('agonizing_blast') ? getMod(character.cha) : 0,
      thirst: false, smite: null, slot: Number(sp.level) > 0 ? prog.slotLevel : 0 });
  }
  return attacks;
}

function dcSet(key, value, onlyResults = false) {
  if (key === 'ac') { const n = Number(value); if (!Number.isFinite(n)) return; value = Math.max(1, Math.min(40, Math.round(n))); }
  DamagePreview[key] = value;
  renderDamageCalculator(onlyResults);
}

function renderDamageCalculator(onlyResults = false) {
  const host = document.getElementById('damageCalculator');
  if (!host) return;
  const attacks = dcAttacks(), cs = character.combat_state;
  const attack = attacks.find(a => a.id === DamagePreview.id) || attacks[0];
  const knownHex = spells.some(s => s.is_known && /maleficio|^hex\b/i.test(s.name));
  const canCurse = /filo|hexblade/i.test(character.class_name || '') || Object.prototype.hasOwnProperty.call(cs, 'hexblade_curse');
  const opts = { ...DamagePreview, hex: DamagePreview.hex && knownHex,
    thirst: DamagePreview.thirst && Boolean(attack?.thirst), smite: DamagePreview.smite && Boolean(attack?.smite),
    shroud: DamagePreview.shroud && Number(character.level) >= 3 };
  const f = n => Number(n.toFixed(2)).toLocaleString('es');
  const pct = n => f(n * 100) + '%';
  const toggle = (key, label, eligible, reason) => `<label class="dc-toggle"><input type="checkbox" data-dc="${key}" ${opts[key] ? 'checked' : ''} ${eligible ? '' : 'disabled'}><span>${esc(label)}${!eligible ? '<small>' + esc(reason) + '</small>' : ''}</span></label>`;
  if (!onlyResults) host.innerHTML = `<div class="ready-heading"><div><span class="eyebrow">D&D 5e · 2014</span><h2>Calculadora de daño</h2></div><span class="condition-mark">Simulación · sin consumo</span></div>
    <p class="battle-subtext">Compara un turno completo con los efectos ya preparados sobre un mismo objetivo. No cambia acciones, concentración, munición ni espacios.</p>
    ${attack ? `<div class="dc-controls"><label>Ataque disponible<select data-dc="id">${attacks.map(a => `<option value="${esc(a.id)}" ${attack.id === a.id ? 'selected' : ''}>${esc(a.name)} (${sign(a.bonus)})</option>`).join('')}</select></label>
      <label>Tirada<select data-dc="advantage"><option value="normal" ${!opts.advantage ? 'selected' : ''}>Normal</option><option value="advantage" ${opts.advantage ? 'selected' : ''}>Ventaja</option></select></label>
      <label>CA del objetivo<input type="number" min="1" max="40" data-dc="ac" value="${opts.ac}"></label></div>
      <div class="dc-toggles">${toggle('hex', 'Maleficio · +1d6 por impacto', knownHex, 'No conocido')}${toggle('curse', 'Maldición del Filo · +' + attack.prof + ' y crítico 19–20', canCurse, 'Requiere Filo Maléfico')}${toggle('thirst', 'Filo Sediento · 2 ataques', attack.thirst, 'Requiere arma del pacto e invocación (brujo 5)')}${toggle('shroud', 'Mortaja Necrótica · +' + attack.level + ' una vez/turno', attack.level >= 3, 'Requiere nivel 3')}${toggle('smite', 'Castigo Arcano · +' + (attack.smite || getWarlockProgression(cs.class_levels?.Brujo ?? character.level).smiteDice) + ' una vez/turno', Boolean(attack.smite), 'Requiere arma del pacto e invocación (brujo 5)')}</div>
      <div id="dcResults" aria-live="polite"></div>
      <details class="battle-options"><summary>Cómo se calcula y recursos actuales</summary><p class="battle-detail">Daño mínimo, máximo y promedio: todos los ataques impactan, sin crítico. DPR: incluye fallos y críticos; el 1 natural falla y el crítico impacta automáticamente. Con ventaja se toma el mayor de dos d20. Los dados de Maleficio y Castigo se duplican en crítico; los bonos fijos y Mortaja no. Mortaja y Castigo se aplican al primer impacto del turno, cada uno una sola vez. No se anticipa un crítico posterior para gastar Castigo.</p><p class="battle-detail">Se supone que Maleficio, Maldición y Mortaja ya estaban activos: prepararlos puede requerir turnos anteriores. Sin resistencias, inmunidades, cobertura, derribo ni otros efectos del objetivo. Filo Sediento solo se aplica al arma del pacto. Los conjuros con salvación quedan fuera del cálculo contra CA. Otros conjuros de ataque usan sus dados guardados; Descarga, Toque helado e Infligir heridas escalan según nivel.</p><p class="battle-detail">Espacios disponibles: ${Math.max(0, getWarlockProgression(cs.class_levels?.Brujo ?? character.level).slotCount - Number(character.spell_slots_used || 0))}. ${attack.ammo !== null && attack.ammo !== undefined ? 'Munición: ' + Number(attack.ammo) + '.' : ''} ${attack.slot ? 'Este ataque requiere un espacio de nivel ' + attack.slot + '.' : ''} La comparación permite proyectar efectos aunque sus recursos estén agotados. Para actuar, utiliza los controles de combate que validan y guardan el gasto real.</p></details>` : '<p class="battle-detail">No hay ataques compatibles disponibles. Equipa un arma, invoca tu arma del pacto o aprende un conjuro de ataque en Magia.</p>'}`;
  if (attack) {
    // Drop incompatible effects without changing either the character or spell data.
    opts.curse = opts.curse && canCurse;
    const r = LiorDamage.calculate(attack, opts), total = r.parts.reduce((n, p) => n + Math.max(0, p.mean), 0);
    const colors = ['#9fcce4', '#c5b5e5', '#63cda8', '#e4c378', '#dfa0ca'];
    document.getElementById('dcResults').innerHTML = `${attack.loadingLimited && opts.thirst ? '<p class="battle-note">De carga limita esta arma a un disparo por acción (5e 2014). Filo Sediento no elimina esa propiedad. Artillero, Experto en ballestas o una excepción explícita del arma permiten ignorarla según corresponda.</p>' : ''}<div class="dc-metrics"><div><small>Promedio · todos impactan</small><strong>${f(r.mean)}</strong><span>${r.count} ${r.count === 1 ? 'ataque' : 'ataques'} · ${esc(attack.dice)} ${sign(attack.flat)} por impacto</span></div><div><small>Daño esperado por ronda (DPR)</small><strong>${f(r.dpr)}</strong><span>${pct(r.hit)} impacto (incluye ${pct(r.critical)} crítico) por ataque</span></div><div><small>Mínimo – máximo · sin crítico</small><strong>${f(r.min)} – ${f(r.max)}</strong><span>Máximo si todos son críticos: ${f(r.criticalMax)}</span></div></div>
      <div class="dc-breakdown"><p>Desglose del promedio al impactar todos</p><div class="dc-bar" role="img" aria-label="${esc(r.parts.map(p => p.name + ': ' + f(p.mean)).join('; '))}">${r.parts.map((p, i) => p.mean > 0 ? `<span style="flex:${p.mean};background:${colors[i]}" title="${esc(p.name)}: ${f(p.mean)}">${total && p.mean / total > .08 ? f(p.mean) : ''}</span>` : '').join('')}</div><ul>${r.parts.map((p, i) => `<li><i style="background:${colors[i]}"></i>${esc(p.name)}: ${f(p.mean)}</li>`).join('')}</ul></div>`;
  }
  if (!onlyResults) host.querySelectorAll('[data-dc]').forEach(el => {
    if (el.dataset.dc === 'ac') el.addEventListener('input', () => dcSet('ac', el.value, true));
    el.addEventListener('change', () => dcSet(el.dataset.dc,
      el.type === 'checkbox' ? el.checked : el.dataset.dc === 'advantage' ? el.value === 'advantage' : el.value));
  });
}

const dcPreviousRender = renderAll;
renderAll = function () { dcPreviousRender(); renderDamageCalculator(); };
document.addEventListener('DOMContentLoaded', () => {
  const host = document.createElement('section'); host.id = 'damageCalculator'; host.className = 'battle-panel dc-panel';
  document.getElementById('battleDesk').append(host);
  renderDamageCalculator();
});
