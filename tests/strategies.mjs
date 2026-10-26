// Reference strategies for the mission témoin (district 0). Used by tests and balance checks.
import { CityGame } from '../web/sim.js';
import { SERVICES } from '../web/data.js';
const step = (g, s) => {
  for (let i = 0; i < Math.ceil(s * 30); i++) g.update(1 / 30);
};
const plot = (g, x, y) =>
  g.services.reduce((a, b) => (Math.hypot(a.x - x, a.y - y) < Math.hypot(b.x - x, b.y - y) ? a : b));
const build = (g, t, x, y) => {
  const p = plot(g, x, y);
  return g.buildService(t, p.x, p.y) !== null;
};
const SPOTS = [
  [15, 11],
  [15, 13],
  [14, 9],
  [9, 14],
  [15, 10],
  [13, 15],
  [9, 12],
  [12, 9],
  [3, 3],
  [9, 3],
  [3, 9],
  [15, 15],
];
export const strategies = {
  // Spends everything each lull: services in order of usefulness, then troops around the palace.
  adaptive(g, w) {
    for (const [t, x, y] of [
      ['command', 12, 6],
      ['market', 17, 12],
      ['academy', 6, 12],
      ['workshop', 17, 6],
      ['housing', 6, 6],
    ])
      if (
        !g.services.some(s => s.type === t && s.state !== 'ruin') &&
        g.money >= SERVICES[t].cost + (t === 'command' ? 0 : 160) &&
        build(g, t, x, y)
      )
        step(g, 4.1);
    if (w > 0 && g.primary.protection < 1) g.reinforce(3);
    for (const u of g.units) g.repair('unit', u.id);
    g.setOrder('intercept');
    for (const [x, y] of SPOTS) {
      const type = g.service('academy') && g.money >= 100 && (x + y) % 2 ? 'shield' : 'patrol';
      if (g.money < 75) break;
      g.place(type, x, y);
    }
  },
  passive(g, w) {
    if (w === 0) {
      build(g, 'command', 6, 1);
      step(g, 4.1);
      g.place('patrol', 15, 11);
    }
  },
  // Lines on the streets: barricade the north artery, patrols at the palace, then trade income and shields.
  lines(g, w) {
    if (w === 0) {
      build(g, 'command', 6, 1);
      step(g, 4.1);
      g.place('patrol', 3, 1);
      g.place('patrol', 4, 3);
      g.place('barrier', 3, -2);
    }
    if (w === 1) {
      build(g, 'market', 17, 6);
      step(g, 4.1);
      g.place('patrol', 15, 9);
      g.setOrder('intercept');
    }
    if (w === 2) {
      build(g, 'academy', 1, 6);
      step(g, 4.1);
      g.place('shield', 15, 12);
      g.place('shield', 9, 15);
      g.place('patrol', 3, 15);
    }
    for (const u of g.units) g.repair('unit', u.id);
  },
  // Mediation and palace façade: fewer troops, more trust and armor.
  fortress(g, w) {
    if (w === 0) {
      build(g, 'command', 12, 6);
      step(g, 4.1);
      g.place('patrol', 15, 11);
      g.place('patrol', 15, 13);
      g.reinforce(3);
    }
    if (w === 1) {
      build(g, 'market', 17, 12);
      step(g, 4.1);
      g.place('patrol', 14, 9);
    }
    if (w === 2) {
      build(g, 'academy', 6, 12);
      step(g, 4.1);
      g.place('shield', 15, 12);
      g.repairArmor(3);
      g.setOrder('intercept');
    }
    for (const u of g.units) g.repair('unit', u.id);
  },
};
/** Plays a whole mission with one strategy; the strategy acts once at the start of each preparation. */
export function play(name, seed = 71, level = 0, rounds = 3) {
  const g = new CityGame(level, seed);
  let prepared = -1;
  const log = [];
  for (let i = 0; i < 30 * 1800 && !['won', 'lost'].includes(g.phase) && g.wave <= rounds; i++) {
    if (['prepare', 'interval'].includes(g.phase) && prepared !== g.wave) {
      log.push(`w${g.wave}:$${Math.round(g.money)} pal${Math.round(g.primary.hp)}`);
      prepared = g.wave;
      strategies[name](g, g.wave);
      if (g.phase === 'prepare') g.startWave();
    }
    g.update(1 / 30);
  }
  return {
    name,
    seed,
    phase: ['won', 'lost'].includes(g.phase) ? g.phase : g.wave > rounds ? 'survived' : g.phase,
    wave: g.wave,
    stars: g.stars,
    money: Math.round(g.money),
    pal: Math.round(g.integrity),
    trust: Math.round(g.trust),
    disp: g.stats.dispersed,
    log: log.join(' '),
    debrief: g.debrief(),
  };
}
