import test from 'node:test';
import assert from 'node:assert/strict';
import { CityGame, route } from '../web/sim.js';
import { play } from './strategies.mjs';
import { GATES, SERVICES, ARMOR, DISTRICTS, INCOME } from '../web/data.js';
const step = (g, s) => {
  for (let i = 0; i < Math.ceil(s * 30); i++) g.update(1 / 30);
};
function build(g, type, plot) {
  const p = plot ?? g.services.find(s => s.state === 'empty' || s.state === 'ruin');
  assert.notEqual(g.buildService(type, p.x, p.y), null, type);
  step(g, 4.1);
  return g.service(type);
}
/** Rule tests are not about the economy: give them a generous treasury. */
const funded = (level = 0) => Object.assign(new CityGame(level), { money: 5000 });
function base(g) {
  build(g, 'command');
  build(g, 'academy');
  build(g, 'workshop');
}
test('a new game contains exactly one building: the presidential palace, plus nine empty plots', () => {
  for (let level = 0; level < 6; level++) {
    const g = new CityGame(level);
    assert.equal(g.buildings.length, 1);
    assert.equal(g.buildings[0].id, 3);
    assert.equal(g.builtCount, 1);
    assert.equal(g.primary.name, 'PALAIS PRÉSIDENTIEL');
    assert.equal(g.services.length, 9);
    assert.ok(g.services.every(s => s.state === 'empty' && !s.type));
    assert.equal(g.units.length, 0);
    assert.equal(g.integrity, 100);
  }
});
test('construction pays once, needs a real empty plot and unlocks troops after four seconds', () => {
  const g = new CityGame();
  assert.equal(g.startWave(), false);
  assert.equal(g.place('patrol', 6, 3), null);
  assert.equal(g.buildService('command', 9, 9), null);
  const p = g.services[0];
  assert.equal(g.buildService('command', p.x, p.y), p.id);
  assert.equal(g.money, DISTRICTS[0].budget - 100);
  assert.equal(g.buildService('command', p.x, p.y), null);
  step(g, 3);
  assert.equal(g.service('command'), undefined);
  step(g, 1.1);
  assert.ok(g.place('patrol', 6, 3));
  assert.equal(g.builtCount, 2);
});
test('all nine constructible types have a purpose, and housing, trade and mediation pay their income', () => {
  const g = funded(5);
  for (const type of Object.keys(SERVICES)) build(g, type);
  assert.equal(g.services.filter(s => s.state === 'built').length, 9);
  g.wave = 1;
  assert.equal(g.waveReward(), 190);
  assert.equal(g.income(), INCOME.housing + INCOME.market + INCOME.civic);
  for (const s of g.services) assert.ok(SERVICES[s.type].desc.length > 20);
});
test('the clinic heals ground units within its radius', () => {
  const g = funded();
  build(g, 'command');
  const clinic = build(g, 'clinic');
  const id = g.place('patrol', clinic.access.x, clinic.access.y);
  const u = g.units.find(u => u.id === id);
  u.hp = 50;
  step(g, 2);
  assert.ok(u.hp > 57.99);
  assert.ok(u.healUntil > g.time - 0.1);
});
test('helicopters require aerial centre tier two and apply actual pressure and slowing to a dense crowd', () => {
  const g = funded(5);
  for (const type of ['command', 'academy', 'workshop', 'depot', 'lab']) build(g, type);
  assert.equal(g.place('helicopter', 9, 9), null);
  const lab = g.service('lab');
  assert.ok(g.upgradeService(lab.id));
  step(g, 6.1);
  const id = g.place('helicopter', 9, 9);
  assert.ok(id);
  g.wave = 1;
  for (let i = 0; i < 24; i++) {
    g.spawn({ gate: 0, release: 0, group: 1 });
    Object.assign(g.crowd.at(-1), { state: 'march', x: 9 + (i % 5) * 0.1, y: 9 + Math.floor(i / 5) * 0.1 });
  }
  const hp = g.crowd.reduce((n, p) => n + p.hp, 0);
  g.updateUnits(0.05);
  assert.ok(g.crowd.reduce((n, p) => n + p.hp, 0) < hp);
  assert.equal(g.crowd.filter(p => p.slow > 0).length, 18);
  assert.ok(g.effects.some(e => e.kind === 'airnet'));
  assert.ok(g.moveUnit(id, 15, 15));
  assert.deepEqual(g.units.at(-1).path, [{ x: 15, y: 15 }]);
});
test('facade armor absorbs damage before the structure and has separate repair and workshop gates', () => {
  const g = funded(5),
    p = g.primary;
  assert.ok(g.reinforce(3));
  assert.equal(p.armorHp, 120);
  const hp = p.hp;
  g.damageBuilding(p, 80);
  assert.equal(p.hp, hp);
  assert.equal(p.armorHp, 40);
  assert.ok(g.repairArmor(3));
  assert.equal(p.armorHp, 120);
  assert.equal(g.reinforce(3), false);
  base(g);
  assert.ok(g.reinforce(3));
  assert.equal(p.armorMax, 260);
  assert.equal(g.reinforce(3), false);
  assert.ok(g.upgradeService(g.service('workshop').id));
  step(g, 6.1);
  assert.ok(g.reinforce(3));
  assert.equal(p.armorMax, 440);
  g.damageBuilding(p, 450);
  assert.equal(p.armorHp, 0);
  assert.equal(p.hp, hp - 10);
  assert.ok(g.repairArmor(3));
  assert.ok(p.armorHp > 0);
  assert.equal(g.reinforce(3), false);
});
test('player-constructed services also receive destructible facade protections', () => {
  const g = funded();
  const c = build(g, 'command');
  assert.ok(g.reinforce(c.id));
  g.damageBuilding(c, 50);
  assert.equal(c.hp, c.maxHp);
  assert.equal(c.armorHp, 70);
  g.damageBuilding(c, 310);
  assert.equal(c.hp, 0);
  assert.equal(c.state, 'ruin');
  assert.equal(g.place('patrol', 9, 3), null);
  assert.equal(g.buildService('command', c.x, c.y), c.id);
  step(g, 4.1);
  assert.ok(g.service('command'));
});
test('building repair pauses under attack and never regenerates facade armor for free', () => {
  const g = funded();
  build(g, 'command');
  build(g, 'workshop');
  const p = g.primary;
  g.reinforce(3);
  g.damageBuilding(p, 200);
  const hp = p.hp;
  assert.ok(g.queueRepair(3));
  const remaining = g.repairJobs[0].remaining;
  g.updateConstruction(0.05);
  assert.equal(p.hp, hp);
  assert.equal(g.repairJobs[0].remaining, remaining);
  p.flash = 0;
  g.updateConstruction(0.05);
  assert.ok(p.hp > hp);
  assert.equal(p.armorHp, 0);
});
test('crowd impacts have real damage, facing targets, strike poses, particles and building shake', () => {
  const g = funded();
  g.spawn({ gate: 0, release: 0, group: 1 });
  const p = g.crowd[0];
  Object.assign(p, { state: 'march', x: 15, y: 12, target: 3 });
  const hp = g.primary.hp;
  g.updateCrowd(0.05);
  assert.ok(g.primary.hp < hp);
  assert.ok(p.attackUntil > g.time);
  assert.deepEqual(p.attackTarget, { x: 14, y: 12 });
  assert.ok(g.primary.shakeUntil > g.time);
  assert.ok(g.effects.some(e => e.kind === 'smash'));
});
test('police intervention and crowd movement carry animation state without changing their combat rules', () => {
  const g = funded();
  base(g);
  const id = g.place('shield', 15, 12);
  g.spawn({ gate: 0, release: 0, group: 1 });
  const p = g.crowd[0];
  Object.assign(p, { state: 'march', x: 15, y: 11.4, target: 3 });
  g.updateUnits(0.05);
  assert.ok(g.units.find(u => u.id === id).actionUntil > g.time);
  assert.ok(g.effects.some(e => e.kind === 'shield'));
  p.x = 3;
  p.y = -6.3;
  p.stun = 0;
  p.pathVersion = -1;
  g.time = 10;
  g.updateCrowd(0.05);
  assert.ok(p.moving);
});
test('approaches remain seven tiles longer, and roads recalculate around barricades', () => {
  const old = [
    { x: 3, y: 0 },
    { x: 18, y: 9 },
    { x: 9, y: 18 },
    { x: 0, y: 15 },
  ];
  for (let i = 0; i < 4; i++)
    assert.equal(route(GATES[i], { x: 15, y: 12 }).length - route(old[i], { x: 15, y: 12 }).length, 7);
  const path = route({ x: 3, y: 3 }, { x: 9, y: 3 }, [{ x: 6, y: 3, hp: 100 }]);
  assert.ok(path.length > 6);
  assert.ok(!path.some(p => p.x === 6 && p.y === 3));
});
test('the palace can survive below 25 percent; loss begins at zero and the crowd then actually crosses the door', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  g.primary.hp = 10;
  g.update(1 / 30);
  assert.equal(g.phase, 'wave');
  g.primary.hp = 0;
  g.trust = 0;
  g.update(1 / 30);
  assert.equal(g.phase, 'breach');
  assert.equal(g.breach.enteredCount, 0);
  step(g, 2.5);
  assert.equal(g.breach.enteredCount, 48);
  assert.ok(g.breach.actors.every(p => p.inside && p.y < 13.85));
  assert.equal(g.breach.leader.captured, false);
  step(g, 0.4);
  assert.equal(g.breach.leader.captured, true);
  assert.ok(g.breach.leader.y < 14.05);
  step(g, 1.6);
  assert.equal(g.phase, 'breach');
  assert.ok(g.breach.leader.y > 14.05);
  step(g, 0.4);
  assert.equal(g.phase, 'lost');
  assert.match(g.reason, /pénétré dans le palais/);
});
test('save and reload preserve construction, armor, helicopters and the exact interior sequence state', () => {
  const g = funded(5);
  base(g);
  g.reinforce(3);
  const snap = JSON.parse(JSON.stringify(g.snapshot())),
    h = CityGame.restore(snap);
  step(g, 2);
  step(h, 2);
  assert.deepEqual(g.snapshot(), h.snapshot());
  g.primary.hp = 0;
  g.beginBreach();
  step(g, 2);
  const resumed = CityGame.restore(JSON.parse(JSON.stringify(g.snapshot())));
  step(g, 0.5);
  step(resumed, 0.5);
  assert.deepEqual(g.breach, resumed.breach);
  snap.buildings[0].x = 900;
  assert.throws(() => CityGame.restore(snap));
});
test('prototype two saves lose the three imposed buildings, keep player services and retarget old crowds', () => {
  const g = funded();
  build(g, 'command');
  const old = g.snapshot();
  old.schema = 2;
  old.services = old.services.slice(0, 6);
  old.buildings.unshift(
    ...[0, 1, 2].map(id => ({ id, x: 6, y: 6, hp: 100, maxHp: 220, protection: 0, access: { x: 6, y: 3 } }))
  );
  g.spawn({ gate: 0, release: 0, group: 1 });
  old.crowd = structuredClone(g.crowd);
  old.crowd[0].target = 0;
  const h = CityGame.restore(old);
  assert.equal(h.buildings.length, 1);
  assert.equal(h.services.length, 9);
  assert.ok(h.service('command'));
  assert.equal(h.crowd[0].target, 3);
  assert.equal(h.snapshot().schema, 3);
});
test('survival opening: two different strategies hold three rounds on several seeds, a passive one falls', () => {
  for (const seed of [71, 5, 999]) {
    const lines = play('lines', seed),
      fortress = play('fortress', seed),
      passive = play('passive', seed);
    assert.equal(lines.phase, 'survived', JSON.stringify(lines));
    assert.equal(fortress.phase, 'survived', JSON.stringify(fortress));
    assert.equal(passive.phase, 'lost', JSON.stringify(passive));
    assert.ok(passive.debrief.length > 0, 'a defeat always names a cause');
  }
});
test('campaign smoke: every district ends (no freeze) and none is a wall at wave one', () => {
  for (let level = 0; level < 6; level++) {
    const r = play('adaptive', 71, level, level === 0 ? 6 : Infinity);
    assert.ok(['won', 'lost', 'survived'].includes(r.phase), `district ${level} froze in ${r.phase}`);
    assert.ok(r.wave >= 2, `district ${level} lost at wave ${r.wave}`);
  }
});
test('the tight start cannot build the whole country before the first wave', () => {
  const g = new CityGame();
  let built = 0;
  for (const type of ['command', 'housing', 'market', 'civic', 'clinic', 'workshop'])
    if (g.buildService(type, g.services[built].x, g.services[built].y) !== null) {
      built++;
      step(g, 4.1);
    }
  assert.ok(built <= 3, `built ${built}`);
  const money = g.money;
  step(g, 60);
  assert.equal(g.money, money, 'no income while preparing, so waiting is not a strategy');
});
test('announced waves are the waves that come, with their targets known at launch', () => {
  const g = new CityGame();
  build(g, 'command');
  for (let n = 1; n <= 3; n++) {
    const plan = g.wavePlan(n);
    g.phase = 'prepare';
    g.wave = n - 1;
    g.startWave();
    assert.deepEqual(
      g.rallies.map(r => ({ gate: r.gate, count: r.count })),
      plan
    );
    assert.ok(g.rallies.every(r => g.targets.some(b => b.id === r.target)));
    assert.ok(g.rallyEta(g.rallies[0]) > 5);
  }
  assert.deepEqual(
    g.wavePlan(1).map(p => p.gate),
    [0]
  );
});
test('flow-field paths match the optimal routes and detour around barricades', () => {
  for (const gate of GATES) {
    const g = new CityGame();
    assert.equal(g.path(gate, { x: 15, y: 12 }).length, route(gate, { x: 15, y: 12 }).length);
  }
  const g = new CityGame();
  g.barriers.push({ id: 1, x: 6, y: 3, hp: 100 });
  const path = g.path({ x: 3, y: 3 }, { x: 9, y: 3 });
  assert.ok(path.length > 6);
  assert.ok(!path.some(p => p.x === 6 && p.y === 3));
});
test('a crowd jostling at a waypoint keeps moving instead of freezing the wave', () => {
  const g = new CityGame();
  build(g, 'command');
  g.startWave();
  g.rallies = [];
  for (let i = 0; i < 4; i++) {
    g.spawn({ gate: 0, release: 0, group: 1, target: 3 });
    Object.assign(g.crowd.at(-1), {
      state: 'march',
      x: 6 + (i % 2) * 0.3 - 0.15,
      y: 3 + (i > 1 ? 0.15 : -0.15),
    });
  }
  for (const p of g.crowd) p.path = [{ x: 6, y: 3 }, ...g.path({ x: 6, y: 3 }, g.primary.access)];
  step(g, 20);
  assert.ok(
    g.crowd.every(p => p.x > 9 || p.y > 3.5),
    'everyone left the waypoint'
  );
});
test('builders restore a ruined service with its type and tier for half its price', () => {
  const g = funded();
  build(g, 'command');
  build(g, 'workshop');
  const market = build(g, 'market');
  g.upgradeService(market.id);
  step(g, 6.1);
  g.damageBuilding(market, 9999);
  assert.equal(market.state, 'ruin');
  const money = g.money;
  assert.ok(g.restore(market.id));
  assert.equal(g.money, money - 65);
  assert.equal(g.restore(market.id), false, 'one job at a time');
  step(g, 10.5); // the blow that ruined it pauses builders for a moment
  assert.equal(market.state, 'built');
  assert.equal(market.tier, 2);
  assert.equal(market.hp, market.maxHp);
  assert.deepEqual(g.stats.lost, ['Commerces']);
});
test('upgrading a service adds structure but no longer heals it to full for free', () => {
  const g = funded();
  const c = build(g, 'command');
  c.hp = 100;
  g.upgradeService(c.id);
  step(g, 6.1);
  assert.equal(c.maxHp, 320);
  assert.ok(c.hp < 200);
});
test('a lost command post does not freeze the lull: the next wave still comes', () => {
  const g = funded();
  const c = build(g, 'command');
  for (const [x, y] of [
    [3, 0],
    [3, 2],
    [15, 11],
    [15, 13],
  ])
    g.place('patrol', x, y);
  g.startWave();
  g.damageBuilding(c, 9999);
  for (let i = 0; i < 30 * 400 && g.phase === 'wave'; i++) g.update(1 / 30);
  assert.equal(g.phase, 'interval');
  g.pickCard(g.draft.cards[0]);
  step(g, 26);
  assert.equal(g.wave, 2);
});

// P0 regressions found in the V03 hand-off audit (T01, T02, T03, T08).
test('T01: the construction preview gives the same verdict as the build itself', () => {
  const g = funded();
  const plot = g.services[0];
  for (const [x, y] of [
    [9, 9],
    [15, 12],
    [plot.x + 2.5, plot.y],
    [plot.x + 1.5, plot.y + 1],
    [plot.x, plot.y],
  ]) {
    const preview = g.canPlace('build:command', x, y);
    const probe = CityGame.restore(JSON.parse(JSON.stringify(g.snapshot())));
    const built = probe.place('build:command', x, y);
    assert.equal(preview === null, built !== null, `(${x},${y}) preview=${preview}`);
  }
  assert.match(g.canPlace('build:command', 9, 9), /terrain/);
  assert.equal(g.canBuild('command'), null, 'palette cards without coordinates only check the type');
});
test('T02: no crowd attack reaches aerial units', () => {
  const g = funded(5);
  for (const type of ['command', 'academy', 'workshop', 'depot', 'lab']) build(g, type);
  g.upgradeService(g.service('lab').id);
  step(g, 6.1);
  const heliId = g.place('helicopter', 9, 9);
  const heli = g.units.find(u => u.id === heliId);
  const droneId = g.place('drone', 15, 9);
  const drone = g.units.find(u => u.id === droneId);
  for (const [type, at] of [
    ['saboteur', heli],
    ['slinger', drone],
    ['walker', heli],
  ]) {
    g.spawn({ gate: 0, release: 0, group: 1 });
    Object.assign(g.crowd.at(-1), { type, state: 'march', x: at.x, y: at.y, lastSkill: 0, target: 3 });
  }
  const before = [heli.hp, drone.hp];
  g.updateCrowd(0.05);
  assert.deepEqual([heli.hp, drone.hp], before);
  const patrolId = g.place('patrol', 3, 9);
  const patrol = g.units.find(u => u.id === patrolId);
  g.spawn({ gate: 0, release: 0, group: 1 });
  Object.assign(g.crowd.at(-1), { type: 'saboteur', state: 'march', x: 3, y: 9.5, lastSkill: 0, target: 3 });
  const hp = patrol.hp;
  g.updateCrowd(0.05);
  assert.ok(patrol.hp <= hp - 18, 'ground units remain sabotage targets');
});
test('T03: a spawn refused by the crowd cap stays pending instead of being counted', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  const total = g.rallies.reduce((n, r) => n + r.count, 0);
  const filler = Array.from({ length: 420 }, (_, i) => ({ id: -i, state: 'gone' }));
  g.crowd.push(...filler);
  assert.equal(g.spawn(g.rallies[0]), false);
  g.crowd.length = 0;
  for (let i = 0; i < 30 * 600 && g.phase === 'wave'; i++) {
    g.update(1 / 30);
    // Saturate for the first ten seconds: nobody may appear, nobody may be lost.
    if (g.time < 10) {
      g.crowd = g.crowd.filter(p => p.state !== 'gone').concat(filler.slice(g.crowd.length));
      assert.equal(
        g.rallies.reduce((n, r) => n + r.spawned, 0),
        0
      );
    } else if (g.crowd[0]?.id <= 0) g.crowd = g.crowd.filter(p => p.id > 0);
  }
  assert.equal(
    g.rallies.reduce((n, r) => n + r.spawned, 0),
    total
  );
});
test('T08: every debit is reflected in stats.spent', () => {
  const g = funded(5);
  const start = g.money;
  base(g);
  g.place('patrol', 3, 9);
  g.place('barrier', 9, 5);
  g.reinforce(3);
  g.damageBuilding(g.primary, 300);
  g.repairArmor(3);
  g.queueRepair(3);
  g.upgradeService(g.service('academy').id);
  g.upgradeBarrier(g.barriers[0].id);
  g.units[0].hp = 10;
  g.repair('unit', g.units[0].id);
  g.upgradeUnit(g.units[0].id);
  assert.equal(g.stats.spent, start - g.money);
});

// V05 — arrests, vans and the new tactical kit.
const marcher = (g, x, y, extra = {}) => {
  g.spawn({ gate: 0, release: 0, group: 1, target: 3 });
  return Object.assign(g.crowd.at(-1), { state: 'march', x, y, ...extra });
};
test('a person subdued by a patrol is arrested, collected by a van and paid for on delivery', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  g.rallies = [];
  const ids = [9, 10, 11].map(x => marcher(g, x, 15, { hp: 1 }).id);
  for (const id of ids)
    g.hit(
      g.crowd.find(p => p.id === id),
      5,
      { type: 'patrol' }
    );
  assert.ok(g.crowd.filter(p => p.state === 'held').length === 3);
  const money = g.money;
  g.updateArrests(1 / 30);
  assert.equal(g.vans.length, 0, 'no van during the round');
  g.phase = 'interval';
  g.updateArrests(1 / 30);
  assert.equal(g.vans.length, 1, 'the lull sends one van per pile');
  let sawLoading = false;
  for (let i = 0; i < 30 * 60 && (g.vans.length || !sawLoading); i++) {
    g.updateArrests(1 / 30);
    g.updateCrowd(1 / 30);
    sawLoading ||= g.vans[0]?.state === 'load';
  }
  assert.ok(sawLoading);
  assert.equal(g.stats.arrested, 3);
  assert.equal(g.money, money + 12);
  assert.ok(
    g.crowd.filter(p => ids.includes(p.id)).every(p => p.state === 'gone'),
    'they left the map in the van'
  );
});
test('water and mediation disperse; a drone mark turns a dispersal into an arrest', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  const a = marcher(g, 9, 15, { hp: 1 }),
    b = marcher(g, 9, 14, { hp: 1, marked: true });
  g.hit(a, 5, { type: 'water' });
  g.hit(b, 5, { type: 'water' });
  assert.equal(a.state, 'leave');
  assert.equal(b.state, 'held');
});
test('held people wait for the end of the round and never count as an active crowd', () => {
  const g = new CityGame();
  build(g, 'command');
  g.startWave();
  g.rallies = [];
  const p = marcher(g, 9, 15, { hp: 1 });
  g.hit(p, 5, { type: 'shield' });
  assert.equal(g.activeCrowd, 0);
  g.time += 120;
  g.updateCrowd(1 / 30);
  assert.equal(p.state, 'held');
});
test('endless survival never ends in victory and escalates gates and profiles', () => {
  const g = new CityGame();
  assert.equal(g.def.waves, Infinity);
  assert.deepEqual(
    [4, 6, 9].map(n => g.wavePlan(n).length),
    [2, 3, 4]
  );
  assert.ok(g.wavePlan(12).reduce((n, w) => n + w.count, 0) > g.wavePlan(4).reduce((n, w) => n + w.count, 0));
  g.wave = 10;
  assert.ok(g.crowdTypes().includes('saboteur'));
  g.wave = 1;
  assert.deepEqual(g.crowdTypes(), ['walker', 'runner']);
});
test('a smoke screen closes a street in the flow field until it clears', () => {
  const g = funded();
  for (const t of ['command', 'workshop', 'depot']) build(g, t);
  const before = g.path({ x: 3, y: 3 }, { x: 9, y: 3 });
  assert.ok(g.place('smoke', 6, 3));
  const during = g.path({ x: 3, y: 3 }, { x: 9, y: 3 });
  assert.ok(during.length > before.length && !during.some(p => p.x === 6 && p.y === 3));
  step(g, 20.2);
  assert.equal(g.path({ x: 3, y: 3 }, { x: 9, y: 3 }).length, before.length);
});
test('the sound truck lures nearby groups away from their target, then expires', () => {
  const g = funded();
  for (const t of ['command', 'civic']) build(g, t);
  g.startWave();
  g.rallies = [];
  const near = marcher(g, 9, 10),
    far = marcher(g, 3, -5);
  const id = g.place('decoy', 9, 13);
  assert.equal(near.target, id);
  assert.equal(far.target, 3);
  assert.ok(g.targets.some(t => t.id === id));
  const trust = g.trust;
  g.damageBuilding(g.decoys[0], 999);
  assert.equal(g.trust, trust, 'losing a decoy costs no trust');
  g.update(1 / 30);
  assert.equal(g.decoys.length, 0);
});
test('the helicopter spotlight blocks crowd skills and it drops a net on the densest spot', () => {
  const g = funded(5);
  for (const t of ['command', 'academy', 'workshop', 'depot', 'lab']) build(g, t);
  g.upgradeService(g.service('lab').id);
  step(g, 6.1);
  g.place('helicopter', 9, 9);
  g.startWave();
  g.rallies = [];
  const s = marcher(g, 9.2, 9.1, { type: 'saboteur', lastSkill: 0 });
  marcher(g, 9.1, 9.2);
  const nets = g.fields.length;
  g.updateUnits(0.05);
  assert.ok(s.exposed > g.time);
  assert.equal(g.fields.length, nets + 1);
  assert.equal(g.fields.at(-1).type, 'net');
});

// V07 — replay loop: card draft, grades, daily seed, combos.
test('clearing a round offers distinct cards and freezes the lull until one is picked', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  g.rallies = [];
  g.update(1 / 30);
  assert.equal(g.phase, 'interval');
  assert.equal(new Set(g.draft.cards).size, 3);
  const countdown = g.countdown;
  step(g, 5);
  assert.equal(g.countdown, countdown, 'the lull waits for the choice');
  assert.equal(g.startWave(), false);
  assert.ok(g.pickCard(g.draft.cards[0]));
  assert.equal(g.draft, null);
  step(g, 1);
  assert.ok(g.countdown < countdown);
});
test('cards change the rules they promise', () => {
  const g = funded();
  build(g, 'command');
  const card = id => {
    g.draft = { cards: [id], rerolls: 0 };
    assert.ok(g.pickCard(id), id);
  };
  const before = g.costOf('patrol');
  card('surplus');
  assert.equal(g.costOf('patrol'), Math.round(before * 0.8));
  const crowd = g.wavePlan(4).reduce((n, w) => n + w.count, 0);
  card('gamble');
  assert.ok(g.wavePlan(4).reduce((n, w) => n + w.count, 0) > crowd);
  assert.equal(g.waveReward(), Math.round(150 * 1.6));
  const units = g.units.length;
  card('reinforcement');
  assert.equal(g.units.length, units + 1);
  card('shutters');
  assert.equal(g.primary.protection, 1);
  assert.deepEqual(g.perks, ['surplus', 'gamble', 'reinforcement', 'shutters']);
});
test('grades: more credits, a fourth card, a reroll and an opening card', () => {
  assert.equal(new CityGame(0, 71, { grade: 1 }).money, new CityGame().money + 60);
  const g = new CityGame(0, 71, { grade: 4 });
  assert.equal(g.draft.cards.length, 4, 'opening card offered before round one');
  const first = [...g.draft.cards];
  assert.ok(g.rerollCards());
  assert.equal(g.rerollCards(), false, 'one reroll only');
  assert.notDeepEqual(g.draft.cards, first);
});
test('the same seed deals the same cards (fair daily challenge), and saves keep the run', () => {
  const a = new CityGame(0, 20261027, { grade: 4, daily: true }),
    b = new CityGame(0, 20261027, { grade: 4, daily: true });
  assert.deepEqual(a.draft.cards, b.draft.cards);
  a.pickCard(a.draft.cards[0]);
  const r = CityGame.restore(JSON.parse(JSON.stringify(a.snapshot())));
  assert.deepEqual(r.perks, a.perks);
  assert.deepEqual(r.mods, a.mods);
  assert.equal(r.opts.daily, true);
});
test('quick arrests build a rafle combo', () => {
  const g = funded();
  build(g, 'command');
  g.startWave();
  for (let i = 0; i < 4; i++) g.hit(marcher(g, 9, 15, { hp: 1 }), 5, { type: 'patrol' });
  assert.equal(g.combo.count, 4);
  g.time += 3;
  g.hit(marcher(g, 9, 15, { hp: 1 }), 5, { type: 'patrol' });
  assert.equal(g.combo.count, 1);
  assert.equal(g.combo.best, 4);
});

// V08 — fewer taps: buildings train their troops, one repair-everything action.
test('upgrading a building trains all its troops, and new recruits arrive trained', () => {
  const g = funded();
  const command = build(g, 'command');
  const id = g.place('patrol', 3, 2);
  const u = g.units.find(u => u.id === id);
  assert.equal(u.tier, 1);
  g.upgradeService(command.id);
  step(g, 6.1);
  assert.equal(u.tier, 2);
  assert.equal(u.maxHp, Math.round(150 * 1.25));
  const freshId = g.place('patrol', 9, 2),
    fresh = g.units.find(v => v.id === freshId);
  assert.equal(fresh.tier, 2);
  assert.equal(fresh.maxHp, Math.round(150 * 1.25));
});
test('repair everything: one action, palace first, priced in advance, never overspends', () => {
  const g = funded();
  build(g, 'command');
  build(g, 'workshop');
  g.reinforce(3);
  const unitId = g.place('patrol', 3, 2),
    unit = g.units.find(u => u.id === unitId);
  g.damageBuilding(g.primary, 300);
  unit.hp = 20;
  const cost = g.repairAllCost();
  assert.equal(cost, 50 + 30 + 30);
  const money = g.money;
  assert.equal(g.repairAll(), 3);
  assert.equal(g.money, money - cost);
  assert.equal(g.repairAllCost(), 30, 'only the second unit heal step is left');
  g.money = 40;
  g.damageBuilding(g.primary, 10);
  assert.ok(g.repairAll() >= 1);
  assert.ok(g.money >= 0);
});
