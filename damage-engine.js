/* D&D 5e (2014). Pure calculations: no DOM, storage, network or character writes. */
(function (root) {
  'use strict';
  function dice(expression) {
    const text = String(expression || '').replace(/\s/g, '');
    if (!/^[+-]?(?:\d*d\d+|\d+)(?:[+-](?:\d*d\d+|\d+))*$/i.test(text)) return null;
    let distribution = new Map([[0, 1]]), diceMean = 0, diceMin = 0, diceMax = 0, flat = 0, count = 0;
    for (const part of text.match(/[+-]?[^+-]+/g)) {
      const direction = part[0] === '-' ? -1 : 1;
      const token = part.replace(/^[+-]/, '');
      const match = token.match(/^(\d*)d(\d+)$/i);
      if (!match) { flat += direction * Number(token); continue; }
      const n = Number(match[1] || 1), sides = Number(match[2]);
      if (sides < 1 || sides > 100 || (count += n) > 100) return null;
      diceMean += direction * n * (sides + 1) / 2;
      diceMin += direction * n * (direction > 0 ? 1 : sides);
      diceMax += direction * n * (direction > 0 ? sides : 1);
      for (let i = 0; i < n; i++) {
        const next = new Map();
        for (const [total, probability] of distribution) for (let face = 1; face <= sides; face++) {
          const value = total + direction * face;
          next.set(value, (next.get(value) || 0) + probability / sides);
        }
        distribution = next;
      }
    }
    return { distribution, diceMean, diceMin, diceMax, flat };
  }
  function damage(expression, flat = 0) {
    const parsed = dice(expression);
    if (!parsed || !Number.isFinite(flat)) throw Error('Fórmula de daño no compatible');
    let mean = 0;
    for (const [value, probability] of parsed.distribution) mean += Math.max(0, value + parsed.flat + flat) * probability;
    return { min: Math.max(0, parsed.diceMin + parsed.flat + flat), max: Math.max(0, parsed.diceMax + parsed.flat + flat), mean, extraCritical: parsed.diceMean };
  }
  function probabilities(bonus, ac, advantage, criticalAt = 20) {
    let hit = 0, critical = 0;
    const total = advantage ? 400 : 20;
    for (let a = 1; a <= 20; a++) for (let b = 1; b <= (advantage ? 20 : 1); b++) {
      const roll = advantage ? Math.max(a, b) : a;
      const crit = roll >= criticalAt;
      if (crit) critical += 1 / total;
      if (crit || roll !== 1 && roll + bonus >= ac) hit += 1 / total;
    }
    return { hit, critical, normal: hit - critical };
  }
  function calculate(attack, options) {
    const count = options.thirst && attack.thirst && !attack.loadingLimited ? Math.max(2, attack.count) : attack.count;
    const p = probabilities(attack.bonus, options.ac, options.advantage, options.curse ? 19 : 20);
    const base = damage(attack.dice, attack.flat);
    const hex = options.hex ? damage('1d6') : null;
    const curse = options.curse ? attack.prof : 0;
    const expr = attack.dice + (hex ? '+1d6' : '');
    const afterHex = damage(expr, attack.flat);
    const perHit = damage(expr, attack.flat + curse);
    const criticalExpr = expr.replace(/(\d*)d(\d+)/gi, (_, n, d) => (Number(n || 1) * 2) + 'd' + d);
    const criticalHit = damage(criticalExpr, attack.flat + curse);
    const firstHit = 1 - Math.pow(1 - p.hit, count);
    // Once-per-turn damage is applied to the first successful hit, not each beam.
    const firstCritical = p.hit ? firstHit * p.critical / p.hit : 0;
    const smite = options.smite && attack.smite ? damage(attack.smite) : null;
    const shroud = options.shroud ? attack.level : 0;
    const parts = [
      { name: 'Arma / conjuro', mean: base.mean * count },
      { name: 'Maleficio', mean: (afterHex.mean - base.mean) * count },
      { name: 'Maldición del Filo', mean: (perHit.mean - afterHex.mean) * count },
      { name: 'Mortaja Necrótica', mean: shroud },
      { name: 'Castigo Arcano', mean: smite?.mean || 0 }
    ];
    return { count, ...p, firstHit, firstCritical, parts,
      min: perHit.min * count + shroud + (smite?.min || 0),
      max: perHit.max * count + shroud + (smite?.max || 0),
      mean: perHit.mean * count + shroud + (smite?.mean || 0),
      criticalMax: criticalHit.max * count + shroud + (smite ? smite.max + dice(attack.smite).diceMax : 0),
      dpr: count * (p.normal * perHit.mean + p.critical * criticalHit.mean)
        + firstHit * (shroud + (smite?.mean || 0)) + firstCritical * (smite?.extraCritical || 0)
    };
  }
  const api = { dice, damage, probabilities, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LiorDamage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
