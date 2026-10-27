import {
  DISTRICTS,
  EQUIPMENT,
  CROWD,
  GATES,
  road,
  key,
  clamp,
  dist,
  buildings,
  SIZE,
  SERVICES,
  servicePlots,
  serviceFor,
  EDGE_MIN,
  EDGE_MAX,
  ARMOR,
  INCOME,
  CARDS,
  LULL,
} from './data.js';
export class Rng {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
  }
  next() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  pick(a) {
    return a[Math.floor(this.next() * a.length)];
  }
}
const NO_PLOT = 'Touchez un terrain marqué + pour bâtir ce service.';
/** Drones and helicopters fly: no crowd attack (contact, stones, sabotage) can reach them. */
/** Endless mode: the round from which each crowd profile appears. */
const ROUND_UNLOCKS = { walker: 1, runner: 1, heavy: 4, builder: 6, slinger: 8, saboteur: 10 };
export const airborne = u => u.type === 'drone' || u.type === 'helicopter';
const neighbors = p =>
  [
    { x: p.x + 1, y: p.y },
    { x: p.x - 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x, y: p.y - 1 },
  ].filter(n => road(n.x, n.y));
/** Weighted routing: closed arteries cause a detour, never a permanently stuck wave. */
export function route(from, to, barriers = [], hostile = [], vehicle = false) {
  const start = { x: Math.round(from.x), y: Math.round(from.y) },
    goal = key(to.x, to.y),
    open = [start],
    cost = new Map([[key(start.x, start.y), 0]]),
    prev = new Map();
  let end = null;
  for (let step = 0; open.length && step < 1200; step++) {
    open.sort((a, b) => cost.get(key(a.x, a.y)) - cost.get(key(b.x, b.y)));
    const p = open.shift(),
      pk = key(p.x, p.y);
    if (pk === goal) {
      end = pk;
      break;
    }
    for (const n of neighbors(p)) {
      const nk = key(n.x, n.y),
        wall = barriers.some(b => b.hp > 0 && key(b.x, b.y) === nk),
        block = hostile.some(b => b.hp > 0 && key(b.x, b.y) === nk);
      const next = cost.get(pk) + 1 + (wall ? 24 : 0) + (block ? (vehicle ? 18 : 4) : 0);
      if (next < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, next);
        prev.set(nk, pk);
        if (!open.some(v => key(v.x, v.y) === nk)) open.push(n);
      }
    }
  }
  if (!end) return [];
  const result = [];
  for (let p = end; p && p !== key(start.x, start.y); p = prev.get(p)) {
    const [x, y] = p.split(',').map(Number);
    result.unshift({ x, y });
  }
  return result;
}
/**
 * Flow field: one reverse Dijkstra per destination gives every road tile its cost to reach it.
 * The whole crowd then descends the same field, so groups move and detour together, and the
 * cost no longer grows with the number of agents (one field per target, not one search per person).
 */
export function flowField(to, barriers = [], hostile = [], vehicle = false) {
  const walls = new Set(barriers.filter(b => b.hp > 0).map(b => key(b.x, b.y))),
    blocks = new Set(hostile.filter(b => b.hp > 0).map(b => key(b.x, b.y))),
    penalty = k => 1 + (walls.has(k) ? 24 : 0) + (blocks.has(k) ? (vehicle ? 18 : 4) : 0),
    goal = { x: Math.round(to.x), y: Math.round(to.y) },
    cost = new Map(),
    heap = [];
  if (!road(goal.x, goal.y)) return { cost, penalty };
  const push = (c, p) => {
    heap.push([c, p]);
    for (let i = heap.length - 1; i > 0; ) {
      const j = (i - 1) >> 1;
      if (heap[j][0] <= heap[i][0]) break;
      [heap[i], heap[j]] = [heap[j], heap[i]];
      i = j;
    }
  };
  const pop = () => {
    const top = heap[0],
      last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1,
          r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  cost.set(key(goal.x, goal.y), 0);
  push(0, goal);
  while (heap.length) {
    const [c, p] = pop(),
      pk = key(p.x, p.y);
    if (c > cost.get(pk)) continue;
    // Stepping from a neighbour onto p costs p's penalty.
    const next = c + penalty(pk);
    for (const n of neighbors(p)) {
      const nk = key(n.x, n.y);
      if (next < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, next);
        push(next, n);
      }
    }
  }
  return { cost, penalty };
}
/** Steepest descent from `from` along a field; same shape as route(): start excluded, goal included. */
export function descend(field, from) {
  let p = { x: Math.round(from.x), y: Math.round(from.y) };
  const result = [];
  if (!field.cost.has(key(p.x, p.y))) return result;
  for (let i = 0; i < 400 && field.cost.get(key(p.x, p.y)) > 0; i++) {
    let best = null,
      bestCost = Infinity;
    for (const n of neighbors(p)) {
      const nk = key(n.x, n.y),
        c = (field.cost.get(nk) ?? Infinity) + field.penalty(nk);
      if (c < bestCost) {
        bestCost = c;
        best = n;
      }
    }
    if (!best) break;
    result.push(best);
    p = best;
  }
  return result;
}
export class CityGame {
  /** opts: { grade } from the player's permanent progression; { daily } for the daily challenge. */
  constructor(level = 0, seed = 71, opts = {}) {
    this.opts = { grade: 0, daily: false, ...opts };
    this.level = clamp(level, 0, 5);
    this.def = DISTRICTS[this.level];
    this.rng = new Rng(seed + level * 101);
    this.time = 0;
    this.phase = 'prepare';
    this.wave = 0;
    this.countdown = -1;
    this.money = this.def.budget;
    this.trust = 75;
    this.buildings = buildings(this.level);
    this.services = servicePlots();
    this.repairJobs = [];
    this.breach = null;
    this.nextRepairFx = 0;
    this.units = [];
    this.barriers = [];
    this.hostile = [];
    this.fields = [];
    this.crowd = [];
    this.rallies = [];
    this.effects = [];
    this.events = [];
    this.nextId = 1;
    this.routeCache = new Map();
    this.version = 0;
    this.command = 'hold';
    this.force = false;
    this.nextImpulse = 0;
    this.stats = {
      dispersed: 0,
      damage: 0,
      spent: 0,
      groups: 0,
      barricades: 0,
      gateDamage: [0, 0, 0, 0],
      lost: [],
      arrested: 0,
    };
    this.vans = [];
    this.decoys = [];
    // Run modifiers bought with cards; every rule that a card touches reads from here.
    this.mods = {
      income: 1,
      reward: 1,
      arrestPay: 0,
      ground: 1,
      unitCost: 1,
      crowd: 1,
      crowdSpeed: 1,
      impulse: 8,
      tactical: 1,
    };
    this.perks = [];
    this.draft = null;
    this.combo = { count: 0, until: 0, x: 0, y: 0 };
    if (this.opts.grade >= 1) this.money += 60;
    if (this.opts.grade >= 4) this.offerCards();
    this.selected = null;
    this.reason = '';
  }
  get targets() {
    return [
      ...this.buildings,
      ...this.services.filter(b => b.state === 'built'),
      ...this.decoys.filter(d => d.hp > 0),
    ];
  }
  service(type) {
    return this.services.find(s => s.type === type && s.state === 'built' && s.hp > 0);
  }
  get builtCount() {
    return (
      this.buildings.filter(b => b.hp > 0).length + this.services.filter(s => s.state === 'built').length
    );
  }
  waveReward() {
    return Math.round((150 + this.wave * 40) * this.mods.reward);
  }
  /** Price after card discounts (units, then smoke and decoy). */
  costOf(type) {
    const d = EQUIPMENT[type];
    if (!d) return Infinity;
    const factor = d.unit ? this.mods.unitCost : ['smoke', 'decoy'].includes(type) ? this.mods.tactical : 1;
    return Math.round(d.cost * factor);
  }
  /** Draft: three (four from grade 2) distinct cards, drawn from the seeded RNG so a daily run is fair. */
  offerCards() {
    const pool = Object.keys(CARDS),
      size = this.opts.grade >= 2 ? 4 : 3,
      hand = [];
    while (hand.length < size) {
      const id = pool[Math.floor(this.rng.next() * pool.length)];
      if (!hand.includes(id)) hand.push(id);
    }
    this.draft = { cards: hand, rerolls: this.opts.grade >= 3 ? 1 : 0 };
    return hand;
  }
  rerollCards() {
    if (!this.draft?.rerolls) return false;
    const left = this.draft.rerolls - 1;
    this.offerCards();
    this.draft.rerolls = left;
    return true;
  }
  pickCard(id) {
    if (!this.draft?.cards.includes(id)) return false;
    const m = this.mods,
      palace = this.primary;
    ({
      treasury: () => (this.money += 150),
      commerce: () => (m.income *= 1.5),
      bounty: () => (m.arrestPay += 3),
      drill: () => (m.ground *= 1.3),
      surplus: () => (m.unitCost *= 0.8),
      reinforcement: () => {
        const id = this.nextId++;
        this.units.push({
          id,
          type: 'patrol',
          x: 15,
          y: 13,
          hp: 150,
          maxHp: 150,
          tier: 1,
          born: this.time,
          cooldown: 0,
          path: [],
          goal: { x: 15, y: 13 },
          flash: 0,
          heading: 0,
        });
      },
      masonry: () => {
        for (const b of this.targets) b.hp = b.maxHp;
      },
      shutters: () => {
        if ((palace.protection ?? 0) < 3) {
          palace.protection = (palace.protection ?? 0) + 1;
          palace.armorMax = ARMOR[palace.protection];
          palace.armorHp = palace.armorMax;
        }
      },
      speech: () => (this.trust = Math.min(100, this.trust + 15)),
      curfew: () => (m.crowdSpeed *= 0.9),
      quickpulse: () => (m.impulse = 4),
      smokes: () => (m.tactical *= 0.5),
      gamble: () => {
        m.reward *= 1.6;
        m.crowd *= 1.25;
      },
      loan: () => {
        this.money += 300;
        m.crowd *= 1.15;
      },
    })[id]();
    this.perks.push(id);
    this.draft = null;
    this.emit('card', { id });
    return true;
  }
  /** Arrests in quick succession build a "rafle" combo (purely feedback, shown on the map). */
  noteArrest(p) {
    const c = this.combo;
    c.count = this.time < c.until ? c.count + 1 : 1;
    c.until = this.time + 2.5;
    c.x = p.x;
    c.y = p.y;
    c.best = Math.max(c.best ?? 0, c.count);
  }
  /** Credits per second from living services (paid during waves and lulls only). */
  income() {
    return (
      Object.entries(INCOME).reduce((n, [type, rate]) => n + (this.service(type)?.tier ?? 0) * rate, 0) *
      this.mods.income
    );
  }
  equipmentIssue(type) {
    if (type === 'helicopter' && (this.service('lab')?.tier ?? 0) < 2) return 'Centre aérien niveau 2 requis';
    const required = serviceFor(type);
    return required && !this.service(required) ? `Construisez : ${SERVICES[required].name}` : null;
  }
  get integrity() {
    return (
      (this.buildings.reduce((n, b) => n + b.hp, 0) / this.buildings.reduce((n, b) => n + b.maxHp, 0)) * 100
    );
  }
  get primary() {
    return this.buildings.find(b => b.primary);
  }
  get activeCrowd() {
    return this.crowd.filter(p => p.state === 'march' || p.state === 'rally').length;
  }
  get rank() {
    // Endless: the reinforced order (rank 3) opens at round 8.
    return this.def.endless ? 1 + Math.floor(this.wave / 4) : 1 + Math.floor(this.level / 2);
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
    if (this.events.length > 120) this.events.shift();
  }
  fx(kind, x, y, color = '#a7e9e5', size = 1) {
    this.effects.push({ kind, x, y, color, size, born: this.time, id: this.nextId++ });
    if (this.effects.length > 100) this.effects.shift();
  }
  clearRoutes() {
    this.routeCache.clear();
    this.version++;
  }
  /** Fields are cached per destination and dropped whenever the road topology changes (bounded cache). */
  path(from, to, vehicle = false) {
    const k = key(to.x, to.y) + ':' + vehicle;
    let field = this.routeCache.get(k);
    if (!field) {
      const smoke = this.fields.filter(f => f.type === 'smoke').map(f => ({ x: f.x, y: f.y, hp: 1 }));
      field = flowField(to, [...this.barriers, ...smoke], this.hostile, vehicle);
      this.routeCache.set(k, field);
    }
    return descend(field, from);
  }
  /** Every debit goes through here so stats.spent always matches the money actually paid. */
  spend(amount) {
    if (this.money < amount) return false;
    this.money -= amount;
    this.stats.spent += amount;
    return true;
  }
  canPlace(type, x, y) {
    if (type?.startsWith('build:')) return this.canBuild(type.slice(6), x, y);
    const d = EQUIPMENT[type];
    x = Math.round(x);
    y = Math.round(y);
    if (!d) return 'Choisissez un équipement';
    if (!['prepare', 'wave', 'interval'].includes(this.phase)) return 'La manche est terminée';
    if (this.equipmentIssue(type)) return this.equipmentIssue(type);
    if (this.money < this.costOf(type)) return 'Budget insuffisant';
    if (!road(x, y)) return 'Choisissez une rue';
    if (x < EDGE_MIN + 2 || y < EDGE_MIN + 2 || x > EDGE_MAX - 2 || y > EDGE_MAX - 2)
      return 'Laissez les accès de rassemblement libres';
    if (type === 'impulse' && this.time < this.nextImpulse) return 'Impulsion en recharge';
    if (type === 'barrier' && this.barriers.some(b => key(b.x, b.y) === key(x, y)))
      return 'Un barrage occupe cette rue';
    if (d.unit && this.units.filter(u => u.hp > 0).length >= 14 + (this.service('command')?.tier ?? 1) * 2)
      return 'Limite d’unités atteinte';
    if (d.unit && this.units.some(u => u.hp > 0 && dist(u, { x, y }) < 0.7))
      return 'Une unité occupe cet emplacement';
    return null;
  }
  place(type, x, y) {
    if (type?.startsWith('build:')) return this.buildService(type.slice(6), x, y);
    x = Math.round(x);
    y = Math.round(y);
    const issue = this.canPlace(type, x, y);
    if (issue) {
      this.emit('toast', { text: issue });
      return null;
    }
    const d = EQUIPMENT[type];
    this.spend(this.costOf(type));
    const id = this.nextId++;
    if (d.unit) {
      this.units.push({
        id,
        type,
        x,
        y,
        hp: d.hp,
        maxHp: d.hp,
        tier: 1,
        born: this.time,
        cooldown: 0,
        path: [],
        goal: { x, y },
        flash: 0,
        heading: 0,
      });
      this.stats.groups++;
    } else if (type === 'barrier') {
      this.barriers.push({ id, x, y, hp: d.hp, maxHp: d.hp, tier: 1 });
      this.stats.barricades++;
      this.clearRoutes();
    } else if (type === 'net') this.fields.push({ id, type, x, y, radius: d.range, until: this.time + 28 });
    else if (type === 'smoke') {
      this.fields.push({ id, type, x, y, radius: d.range, until: this.time + 20 });
      this.clearRoutes();
    } else if (type === 'decoy') {
      const decoy = {
        id,
        x,
        y,
        access: { x, y },
        hp: d.hp,
        maxHp: d.hp,
        name: 'CAMION SONO',
        decoy: true,
        until: this.time + 30,
      };
      this.decoys.push(decoy);
      for (const p of this.crowd)
        if (p.state === 'march' && dist(p, decoy) < d.range) {
          p.target = id;
          p.pathVersion = -1;
        }
    } else if (type === 'impulse') {
      this.nextImpulse = this.time + this.mods.impulse;
      for (const p of this.crowd)
        if (p.state === 'march' && dist(p, { x, y }) < d.range) {
          p.stun = Math.max(p.stun, 1.8);
          p.hp -= 22;
          this.push(p, { x, y }, 0.7);
        }
      this.fx('shock', x, y, '#f2c49d', d.range);
      this.emit('impact', { kind: 'pulse' });
      if (this.force) this.trust -= 5;
    }
    this.fx('deploy', x, y, d.color, 1);
    this.emit('place', { type });
    return id;
  }
  upgradeUnit(id) {
    const u = this.units.find(u => u.id === id && u.hp > 0);
    if (!u || u.tier >= 3 || (this.service(serviceFor(u.type))?.tier ?? 0) < u.tier + 1) return false;
    const price = Math.round(EQUIPMENT[u.type].cost * 0.65);
    if (!this.spend(price)) return false;
    u.tier++;
    u.maxHp = Math.round(u.maxHp * 1.25);
    u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.35);
    this.fx('deploy', u.x, u.y, '#f5dc9d', 1.1);
    return true;
  }
  fortificationIssue(b) {
    if (!b || b.hp <= 0 || (b.state && b.state !== 'built')) return 'Bâtiment indisponible';
    if ((b.protection ?? 0) >= 3) return 'Protection maximale';
    if ((b.protection ?? 0) > 0 && (this.service('workshop')?.tier ?? 0) < b.protection)
      return `Chantier niveau ${b.protection} requis`;
    return null;
  }
  reinforce(id) {
    const b = this.targets.find(b => b.id === id);
    if (this.fortificationIssue(b)) return false;
    const price = 55 + (b.protection ?? 0) * 30;
    if (!this.spend(price)) return false;
    b.protection = (b.protection ?? 0) + 1;
    b.armorMax = ARMOR[b.protection];
    b.armorHp = b.armorMax;
    this.fx('deploy', b.x, b.y, '#ebd29e', 2);
    return true;
  }
  repairArmor(id) {
    const b = this.targets.find(b => b.id === id);
    if (!b || !b.armorMax || b.armorHp >= b.armorMax || !this.spend(30)) return false;
    b.armorHp = Math.min(b.armorMax, b.armorHp + 160);
    this.fx('heal', b.x, b.y, '#f2d397', 1.2);
    return true;
  }
  damageBuilding(b, amount) {
    b.flash = 0.18;
    b.shakeUntil = this.time + 0.16;
    const absorbed = Math.min(b.armorHp ?? 0, amount);
    b.armorHp = Math.max(0, (b.armorHp ?? 0) - absorbed);
    amount -= absorbed;
    if (absorbed > 0 && b.armorHp === 0) {
      this.fx('shatter', b.x, b.y, '#f0cd8a', 1.7);
      this.emit('toast', {
        text: 'Les protections de ' + (b.name ?? SERVICES[b.type]?.short) + ' ont cédé.',
      });
    }
    b.hp = Math.max(0, b.hp - amount);
    this.stats.damage += amount;
    if (b.hp === 0 && b.decoy) {
      this.fx('shatter', b.x, b.y, '#f0b6d0', 1.4);
      return;
    }
    if (b.hp === 0) {
      (this.stats.lost ??= []).push(b.name ?? SERVICES[b.type]?.short);
      if (b.state) b.state = 'ruin';
      this.fx('collapse', b.x, b.y, '#c6b49a', 2);
      this.trust -= 12;
      this.emit('building', { id: b.id });
    }
  }
  strike(p, target, kind = 'smash') {
    if (this.time < (p.nextStrike ?? 0)) return;
    p.nextStrike = this.time + 0.55 + p.seed * 0.28;
    p.attackUntil = this.time + 0.48;
    p.attackTarget = { ...target };
    this.fx(kind, target.x, target.y, kind === 'shield' ? '#a5d5e8' : '#edc699', 0.7);
  }

  repair(type, id) {
    const list = type === 'unit' ? this.units : this.barriers,
      u = list.find(v => v.id === id);
    if (!u || u.hp <= 0 || u.hp >= u.maxHp || !this.spend(30)) return false;
    u.hp = Math.min(u.maxHp, u.hp + 100);
    this.fx('heal', u.x, u.y, '#a9dfc2', 1);
    return true;
  }
  moveUnit(id, x, y) {
    const u = this.units.find(u => u.id === id && u.hp > 0);
    x = Math.round(x);
    y = Math.round(y);
    if (!u || !road(x, y)) return false;
    u.goal = { x, y };
    u.path = airborne(u) ? [{ x, y }] : this.path(u, u.goal, u.type === 'water');
    u.pathVersion = this.version;
    this.fx('order', x, y, '#97ceef', 0.8);
    return true;
  }
  setOrder(order) {
    if (!['hold', 'intercept', 'regroup'].includes(order)) return false;
    this.command = order;
    if (order === 'regroup') for (const u of this.units) this.moveUnit(u.id, 15, 12);
    this.emit('toast', {
      text:
        order === 'intercept'
          ? 'Interception : les escouades vont au contact.'
          : order === 'regroup'
            ? 'Repli vers le bâtiment principal.'
            : 'Positions tenues.',
    });
    return true;
  }
  setForce(on) {
    if (on && this.rank < 3) {
      this.emit('toast', { text: 'Ordre renforcé disponible au rang 3.' });
      return false;
    }
    this.force = on;
    this.emit('toast', {
      text: on ? 'Ordre renforcé : action accrue, confiance fragilisée.' : 'Intervention mesurée rétablie.',
    });
    return true;
  }
  startWave() {
    // Only the first launch needs a command post: a lost post must not freeze the lull forever.
    if (this.phase === 'prepare' && !this.service('command')) {
      this.emit('toast', { text: 'Construisez d’abord le poste de commandement.' });
      return false;
    }
    if (!['prepare', 'interval'].includes(this.phase)) return false;
    if (this.draft) {
      this.emit('toast', { text: 'Choisissez d’abord une carte.' });
      return false;
    }
    this.phase = 'wave';
    this.wave++;
    this.countdown = 0;
    this.rallies = this.wavePlan(this.wave).map(({ gate, count }, i) => ({
      id: this.nextId++,
      gate,
      count,
      spawned: 0,
      start: this.time + i * 2.4,
      release: this.time + 5 + i * 2.4,
      group: this.nextId++,
      target: this.targetFor(gate),
    }));
    this.emit('wave', { wave: this.wave });
    return true;
  }
  /** Deterministic composition of wave n, so it can be announced before it starts. */
  wavePlan(n) {
    if (n < 1 || n > this.def.waves) return [];
    const planned = this.def.plan?.[n - 1] ?? (this.def.endless ? this.escalateRound(n) : null);
    const total = Math.round(
        (planned?.count ?? Math.round(this.def.base * 0.6) + (n - 1) * 14) * this.mods.crowd
      ),
      available = this.def.entrances,
      gates =
        planned?.gates ??
        available
          .slice(0, Math.min(available.length, n + 1))
          .map((_, i) => available[(i + n - 1) % available.length]),
      per = Math.ceil(total / gates.length);
    return gates
      .map((gate, i) => ({ gate, count: Math.max(0, Math.min(per, total - i * per)) }))
      .filter(g => g.count > 0);
  }
  /** Endless rounds after the written opening: more people, then more gates (2 → 3 → 4). */
  escalateRound(n) {
    const gates = n < 6 ? 2 : n < 9 ? 3 : 4,
      start = n % 4;
    return {
      count: 44 + (n - 3) * 10,
      gates: Array.from({ length: gates }, (_, i) => (start + i) % 4),
    };
  }
  /** Crowd profiles join the endless rounds one by one; fixed districts keep their own list. */
  crowdTypes() {
    if (!this.def.endless) return this.def.types;
    return Object.entries(ROUND_UNLOCKS)
      .filter(([, round]) => Math.max(1, this.wave) >= round)
      .map(([type]) => type);
  }
  /** Seconds before a rally reaches its target, at walking pace, from now. */
  rallyEta(r) {
    const target = this.targets.find(b => b.id === r.target);
    if (!target) return null;
    return Math.max(0, r.release - this.time) + this.path(GATES[r.gate], target.access).length / 0.95;
  }
  targetFor(gate) {
    const alive = this.targets.filter(b => b.hp > 0),
      g = GATES[gate];
    const scored = alive
      .map(b => ({
        b,
        s:
          dist(g, b.access) +
          (b.protection ?? 0) * 2 +
          (b.state ? 8 : 0) +
          (b.primary ? Math.max(-10, 8 - this.wave * 3 - this.level) : 0) +
          this.rng.next() * 5,
      }))
      .sort((a, b) => a.s - b.s);
    return scored[0]?.b.id ?? 3;
  }
  /** Returns false when the crowd cap refuses the spawn, so the caller keeps that person pending. */
  spawn(r) {
    if (this.crowd.length >= 420) return false;
    const g = GATES[r.gate],
      type = this.rng.pick(this.crowdTypes()),
      d = CROWD[type],
      offset = this.rng.next() - 0.5;
    const tier = 1 + Math.floor((this.level + this.wave - 1) / 3);
    const p = {
      tier,
      id: this.nextId++,
      type,
      x: g.x + offset * 0.8,
      y: g.y + (this.rng.next() - 0.5) * 0.8,
      hp: d.hp * (1 + (tier - 1) * 0.16),
      maxHp: d.hp * (1 + (tier - 1) * 0.16),
      state: 'rally',
      group: r.group,
      release: r.release,
      gate: r.gate,
      target: r.target ?? (r.target = this.targetFor(r.gate)),
      speed: d.speed * (0.9 + this.rng.next() * 0.2) * (1 + (tier - 1) * 0.05) * this.mods.crowdSpeed,
      path: [],
      pathVersion: -1,
      stun: 0,
      flash: 0,
      heading: 0,
      seed: this.rng.next(),
      lastSkill: this.time + 10 + this.rng.next() * 8,
    };
    this.crowd.push(p);
    return true;
  }
  push(p, source, amount) {
    const dx = p.x - source.x,
      dy = p.y - source.y,
      n = Math.hypot(dx, dy) || 1;
    const x = p.x + (dx / n) * amount,
      y = p.y + (dy / n) * amount;
    if (road(Math.round(x), Math.round(y))) {
      p.x = clamp(x, EDGE_MIN, EDGE_MAX);
      p.y = clamp(y, EDGE_MIN, EDGE_MAX);
      p.pathVersion = -1;
    }
  }
  hit(p, power, u) {
    p.hp -= power;
    p.flash = 0.12;
    if (p.hp <= 0 && p.state === 'march') {
      this.stats.dispersed++;
      // Ground police contact (or a drone mark) means an arrest: the person sits and waits for a van.
      if (p.marked || u?.type === 'patrol' || u?.type === 'shield') {
        Object.assign(p, { state: 'held', heldAt: this.time, path: [], van: null, moving: false });
        this.noteArrest(p);
        this.fx('disperse', p.x, p.y, '#9fc7ef', 0.5);
        return;
      }
      p.state = 'leave';
      p.path = this.path(p, GATES[p.gate]);
      p.pathVersion = this.version;
      if (this.force) this.trust -= 0.35;
      this.fx('disperse', p.x, p.y, u?.type === 'mediation' ? '#b3e5bb' : '#aadbef', 0.6);
    }
  }
  walk(entity, speed, dt, vehicle = false) {
    if (!entity.path.length) return;
    const next = entity.path[0],
      d = dist(entity, next);
    // A waypoint also counts as reached once the following one is no farther than a tile: in a dense
    // group, separation keeps people from ever standing on the exact point, which used to freeze them.
    const after = entity.path[1];
    if (d < 0.12 || (after && dist(entity, after) <= 1)) {
      entity.path.shift();
      return;
    }
    const wall = this.barriers.find(b => b.hp > 0 && dist(b, next) < 0.2);
    if (wall && entity.state === 'march') return wall;
    const hostile = this.hostile.find(b => b.hp > 0 && dist(b, next) < 0.3);
    if (hostile && vehicle) return hostile;
    const step = Math.min(d, speed * dt);
    entity.moving = step > 0;
    entity.heading = Math.atan2(next.y - entity.y, next.x - entity.x);
    entity.x += ((next.x - entity.x) / d) * step;
    entity.y += ((next.y - entity.y) / d) * step;
    return null;
  }
  updateUnits(dt) {
    for (const u of this.units) {
      if (u.hp <= 0) continue;
      u.moving = false;
      u.flash = Math.max(0, u.flash - dt);
      u.cooldown -= dt;
      const d = EQUIPMENT[u.type],
        near = this.crowd.filter(p => p.state === 'march').sort((a, b) => dist(a, u) - dist(b, u));
      if (
        (this.command === 'intercept' || u.type === 'helicopter') &&
        near[0] &&
        u.type !== 'water' &&
        u.type !== 'mediation' &&
        this.time > (u.nextOrder ?? 0)
      ) {
        u.nextOrder = this.time + 1.5;
        const q = u.type === 'helicopter' ? this.densest(near) : near[0];
        if (dist(q, u) > d.range * 0.7) this.moveUnit(u.id, Math.round(q.x), Math.round(q.y));
      }
      if (u.path.length) {
        if (u.pathVersion !== this.version) this.moveUnit(u.id, u.goal.x, u.goal.y);
        const block = this.walk(
          u,
          u.type === 'helicopter' ? 2.5 : u.type === 'drone' ? 2.1 : 2,
          dt,
          u.type === 'water'
        );
        if (block) {
          block.hp -= 28 * dt;
          this.fxSparingly('impact', block.x, block.y, '#f0c294', 0.6);
        }
      }
      const range = d.range * (1 + (u.tier - 1) * 0.08),
        targets = near.filter(p => dist(p, u) < range);
      if (!targets.length) continue;
      const power =
          d.power *
          (1 + (u.tier - 1) * 0.42) *
          (this.force ? 1.6 : 1) *
          (['patrol', 'shield'].includes(u.type) ? this.mods.ground : 1),
        cap =
          u.type === 'helicopter'
            ? 18
            : u.type === 'water'
              ? 8
              : u.type === 'shield'
                ? 5
                : u.type === 'mediation'
                  ? 8
                  : u.type === 'drone'
                    ? 5
                    : 3;
      for (const p of targets.slice(0, cap)) {
        this.hit(p, power * dt, u);
        if (u.type === 'shield') p.stun = Math.max(p.stun, 0.08);
        if (u.type === 'water') {
          p.slow = Math.max(p.slow ?? 0, 0.3);
          if (u.cooldown <= 0) this.push(p, u, 0.12);
        }
        if (u.type === 'helicopter') {
          p.slow = Math.max(p.slow ?? 0, 0.35);
          p.exposed = this.time + 0.6;
          if (u.cooldown <= 0) this.push(p, u, 0.24);
        }
        if (u.type === 'drone') {
          p.stun = Math.max(p.stun, 0.12);
          p.marked = true;
        }
      }
      if (u.type === 'mediation') this.trust = Math.min(100, this.trust + 0.18 * dt);
      if (u.type === 'helicopter' && this.time >= (u.nextDrop ?? 0)) {
        const at = this.densest(targets);
        u.nextDrop = this.time + 10;
        this.fields.push({
          id: this.nextId++,
          type: 'net',
          x: at.x,
          y: at.y,
          radius: 1.5,
          until: this.time + 10,
        });
        this.fx('airnet', at.x, at.y, '#e7d393', 2.4);
        this.emit('impact', { kind: 'helicopter' });
      }
      if (u.cooldown <= 0) {
        const p = targets[0];
        u.target = { x: p.x, y: p.y, until: this.time + 0.32 };
        u.heading = Math.atan2(p.y - u.y, p.x - u.x);
        u.actionUntil = this.time + 0.46;
        u.cooldown =
          u.type === 'helicopter' ? 1 : u.type === 'water' ? 0.22 : u.type === 'drone' ? 0.9 : 0.65;
        this.fx(
          u.type === 'helicopter'
            ? 'airnet'
            : u.type === 'water'
              ? 'splash'
              : u.type === 'drone'
                ? 'net'
                : u.type === 'shield'
                  ? 'shield'
                  : 'baton',
          p.x,
          p.y,
          d.color,
          u.type === 'helicopter' ? 2 : u.type === 'water' ? 0.65 : 0.65
        );
        this.emit('impact', { kind: u.type });
      }
    }
  }
  /** Centre of the busiest tile among `list`, in one pass (was a quadratic neighbour count). */
  densest(list) {
    const counts = new Map();
    let best = list[0],
      top = 0;
    for (const p of list) {
      const k = key(p.x, p.y),
        n = (counts.get(k) ?? 0) + 1;
      counts.set(k, n);
      if (n > top) {
        top = n;
        best = p;
      }
    }
    return best;
  }
  /**
   * End of round only: when the lull begins, vans leave the command post, each collects one pile
   * of held people (up to eight close together) and drives them back to the post. +4 per person.
   */
  updateArrests(dt) {
    const base = this.service('command')?.access ?? GATES[0],
      waiting = this.crowd.filter(p => p.state === 'held' && !p.van);
    if (this.phase === 'interval' && waiting.length && this.vans.length < 6) {
      const first = waiting[0],
        load = waiting.filter(p => dist(p, first) < 3).slice(0, 8),
        stop = { x: Math.round(first.x), y: Math.round(first.y) },
        van = {
          id: this.nextId++,
          x: base.x,
          y: base.y,
          state: 'go',
          stop,
          cargo: 0,
          load: load.map(p => p.id),
          heading: 0,
          wait: 0,
        };
      van.path = this.path(van, stop, true);
      for (const p of load) p.van = van.id;
      this.vans.push(van);
    }
    for (const van of this.vans) {
      van.moving = false;
      if (van.state === 'go' || van.state === 'back') {
        const next = van.path[0];
        if (!next) {
          if (van.state === 'back') {
            const pay = van.cargo * (4 + this.mods.arrestPay);
            this.money += pay;
            this.stats.arrested = (this.stats.arrested ?? 0) + van.cargo;
            if (van.cargo) {
              this.fx('deploy', van.x, van.y, '#9fc7ef', 0.9);
              this.emit('toast', { text: `${van.cargo} interpellés conduits au poste · +${pay}` });
              this.effects.push({
                kind: 'gain',
                x: van.x,
                y: van.y,
                amount: pay,
                born: this.time,
                color: '#ffd166',
                size: 1,
                id: this.nextId++,
              });
            }
            van.state = 'done';
          } else {
            van.state = 'load';
            for (const p of this.crowd)
              if (van.load.includes(p.id) && p.state === 'held') p.state = 'boarding';
          }
          continue;
        }
        const d = dist(van, next),
          step = Math.min(d, 3.2 * dt);
        if (d < 0.05) {
          van.path.shift();
          continue;
        }
        van.heading = Math.atan2(next.y - van.y, next.x - van.x);
        van.x += ((next.x - van.x) / d) * step;
        van.y += ((next.y - van.y) / d) * step;
        van.moving = true;
      } else if (van.state === 'load') {
        van.wait += dt;
        const pending = this.crowd.some(p => p.van === van.id && ['held', 'boarding'].includes(p.state));
        if (!pending || van.wait > 6) {
          for (const p of this.crowd) if (p.van === van.id && p.state !== 'gone') p.van = null;
          van.state = 'back';
          van.path = this.path(van, base, true);
        }
      }
    }
    this.vans = this.vans.filter(v => v.state !== 'done');
  }
  fxSparingly(kind, x, y, c, size) {
    if (this.rng.next() < 0.04) this.fx(kind, x, y, c, size);
  }
  updateCrowd(dt) {
    for (const p of this.crowd) {
      p.moving = false;
      p.flash = Math.max(0, p.flash - dt);
      p.stun = Math.max(0, p.stun - dt);
      p.slow = Math.max(0, (p.slow ?? 0) - dt);
      if (p.state === 'rally') {
        if (this.time >= p.release) {
          p.state = 'march';
          p.pathVersion = -1;
        } else continue;
      }
      if (p.state === 'gone') continue;
      if (p.state === 'held') {
        continue; // waits for the end-of-round vans
      }
      if (p.state === 'boarding') {
        const van = this.vans.find(v => v.id === p.van);
        if (!van) {
          p.state = 'leave';
          p.path = this.path(p, GATES[p.gate]);
          continue;
        }
        const d = dist(p, van);
        if (d < 0.25) {
          p.state = 'gone';
          van.cargo++;
          continue;
        }
        const step = Math.min(d, 1.5 * dt);
        p.heading = Math.atan2(van.y - p.y, van.x - p.x);
        p.x += ((van.x - p.x) / d) * step;
        p.y += ((van.y - p.y) / d) * step;
        p.moving = true;
        continue;
      }
      if (p.hp <= 0 && p.state === 'march') this.hit(p, 0);
      if (p.state === 'leave') {
        if (!p.path.length) {
          p.state = 'gone';
          continue;
        }
        this.walk(p, 1.6, dt);
        continue;
      }
      if (p.stun > 0) continue;
      const b = this.targets.find(b => b.id === p.target && b.hp > 0);
      if (!b) {
        p.target = this.targetFor(p.gate);
        p.pathVersion = -1;
        continue;
      }
      if (p.pathVersion !== this.version) {
        p.path = this.path(p, b.access);
        p.pathVersion = this.version;
      }
      const closeUnit = this.units.find(u => u.hp > 0 && !airborne(u) && dist(u, p) < 1.05);
      if (closeUnit) {
        closeUnit.hp -=
          CROWD[p.type].damage * (1 + (p.tier - 1) * 0.12) * dt * (closeUnit.type === 'shield' ? 0.35 : 1);
        closeUnit.flash = 0.1;
        this.strike(p, closeUnit, 'shield');
      }
      if (p.type === 'slinger' && this.time >= p.lastSkill && !(p.exposed > this.time)) {
        const u = this.units.find(u => u.hp > 0 && !airborne(u) && dist(u, p) < 3.2);
        if (u) {
          p.attackUntil = this.time + 0.5;
          p.attackTarget = { x: u.x, y: u.y };
          u.hp -= 8;
          u.flash = 0.2;
          this.effects.push({
            kind: 'stone',
            x: p.x,
            y: p.y,
            tx: u.x,
            ty: u.y,
            born: this.time,
            color: '#c9b8a4',
            size: 0.4,
          });
          p.lastSkill = this.time + 3.5;
        }
      }
      if (
        p.type === 'builder' &&
        this.time >= p.lastSkill &&
        this.hostile.length < 8 &&
        !(p.exposed > this.time)
      ) {
        const x = Math.round(p.x),
          y = Math.round(p.y);
        if (
          road(x, y) &&
          !this.hostile.some(h => dist(h, { x, y }) < 1.5) &&
          x > 1 &&
          x < 17 &&
          y > 1 &&
          y < 17
        ) {
          this.hostile.push({ id: this.nextId++, x, y, hp: 90 + p.tier * 25, maxHp: 90 + p.tier * 25 });
          this.clearRoutes();
          this.fx('deploy', x, y, '#d893a3', 1);
          p.lastSkill = this.time + Math.max(9, 20 - (p.tier - 1) * 3);
        }
      }
      if (p.type === 'saboteur' && this.time >= p.lastSkill && !(p.exposed > this.time)) {
        const u = this.units.find(u => u.hp > 0 && !airborne(u) && dist(u, p) < 2);
        if (u) {
          u.hp -= 18;
          this.fx('shock', u.x, u.y, '#e7af95', 1.1);
          p.lastSkill = this.time + 9;
        }
      }
      let speed = p.speed * (p.slow > 0 ? 0.45 : 1) * (closeUnit?.type === 'shield' ? 0.22 : 1);
      for (const f of this.fields)
        if (p.state === 'march' && dist(f, p) < f.radius) {
          speed *= f.type === 'smoke' ? 0.5 : 0.3;
          this.hit(p, (f.type === 'smoke' ? 4 : 9) * dt);
        }
      if (p.state !== 'march') continue;
      if (dist(p, b.access) < 0.72) {
        const amount = CROWD[p.type].damage * (1 + (p.tier - 1) * 0.12) * dt;
        const wall = b.primary ? { x: 14, y: 12 } : { x: b.x + (p.x > b.x ? 1 : -1), y: b.y };
        this.strike(p, wall, (b.armorHp ?? 0) > 0 ? 'shatter' : 'smash');
        if (this.stats.gateDamage) this.stats.gateDamage[p.gate] += amount;
        this.damageBuilding(b, amount);
        continue;
      }
      const wall = this.walk(p, speed, dt);
      if (wall) {
        wall.hp -=
          CROWD[p.type].damage * (1 + (p.tier - 1) * 0.12) * dt * 2.5 * (1 - ((wall.tier ?? 1) - 1) * 0.12);
        wall.flash = 0.1;
        this.strike(p, wall, 'shatter');
      }
    }
    // Gentle lane separation makes a crowd readable without pushing people through blocks.
    const buckets = new Map();
    for (const p of this.crowd)
      if (p.state === 'march') {
        const k = key(p.x * 2, p.y * 2),
          arr = buckets.get(k) ?? [];
        arr.push(p);
        buckets.set(k, arr);
      }
    for (const arr of buckets.values())
      for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i],
            b = arr[j],
            d = dist(a, b);
          if (d < 0.34) {
            const dx = a.x - b.x || 0.01,
              dy = a.y - b.y || 0.02,
              n = Math.hypot(dx, dy),
              step = (0.34 - d) * 0.18;
            const ax = a.x + (dx / n) * step,
              ay = a.y + (dy / n) * step,
              bx = b.x - (dx / n) * step,
              by = b.y - (dy / n) * step;
            if (road(Math.round(ax), Math.round(ay))) {
              a.x = ax;
              a.y = ay;
            }
            if (road(Math.round(bx), Math.round(by))) {
              b.x = bx;
              b.y = by;
            }
          }
        }
  }
  update(dt) {
    if (this.phase === 'breach') {
      this.updateBreach(Math.min(0.05, dt));
      return;
    }
    if (!['prepare', 'wave', 'interval'].includes(this.phase)) return;
    dt = Math.min(0.05, dt);
    this.time += dt;
    this.updateConstruction(dt);
    if (this.phase !== 'prepare') this.money += this.income() * dt;
    this.effects = this.effects.filter(e => this.time - e.born < (e.kind === 'stone' ? 0.7 : 1.1));
    const smoked = this.fields.some(f => f.type === 'smoke' && f.until <= this.time);
    this.fields = this.fields.filter(f => f.until > this.time);
    if (smoked) this.clearRoutes();
    this.decoys = this.decoys.filter(d => d.hp > 0 && d.until > this.time);
    for (const b of [...this.buildings, ...this.services]) b.flash = Math.max(0, (b.flash ?? 0) - dt);
    this.updateUnits(dt);
    this.updateArrests(dt);
    if (this.phase === 'interval') {
      this.updateCrowd(dt);
      if (!this.draft) this.countdown -= dt;
      if (this.countdown <= 0) this.startWave();
    }
    if (this.phase === 'wave') {
      for (const r of this.rallies)
        if (this.time >= r.start && r.spawned < r.count) {
          r.clock = (r.clock ?? 0) + dt;
          while (r.clock > 0.13 && r.spawned < r.count) {
            if (!this.spawn(r)) {
              r.clock = 0.13;
              break;
            }
            r.spawned++;
            r.clock -= 0.13;
          }
        }
      this.updateCrowd(dt);
      if (this.primary.hp <= 0) {
        this.beginBreach();
        return;
      }
      if (this.trust <= 0) {
        this.end(false, 'Commandement relevé : la confiance de la ville est épuisée.');
        return;
      }
      const pending = this.rallies.some(r => r.spawned < r.count);
      if (!pending && this.activeCrowd === 0) {
        this.money += this.waveReward();
        for (const u of this.units) if (u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + 35);
        this.emit('clear', { wave: this.wave });
        if (this.wave >= this.def.waves) this.end(true, 'Les rassemblements sont dispersés. La ville tient.');
        else {
          this.phase = 'interval';
          this.countdown = LULL;
          this.rallies = [];
          if (this.def.endless) this.offerCards();
        }
      }
    }
    const before = this.barriers.length + this.hostile.length;
    this.barriers = this.barriers.filter(b => b.hp > 0);
    this.hostile = this.hostile.filter(b => b.hp > 0);
    if (before !== this.barriers.length + this.hostile.length) this.clearRoutes();
    this.crowd = this.crowd.filter(p => p.state !== 'gone');
    this.units = this.units.filter(u => u.hp > 0);
  }
  /** Nearest free plot within reach of (x, y): the same lookup for the hover preview and the actual build. */
  buildPlot(x, y) {
    const plot = this.services
      .filter(s => ['empty', 'ruin'].includes(s.state))
      .sort((a, b) => dist(a, { x, y }) - dist(b, { x, y }))[0];
    return plot && dist(plot, { x, y }) <= 2.2 ? plot : null;
  }
  /** Without coordinates, only the type is checked (palette cards); with them, the plot is checked too. */
  canBuild(type, x, y) {
    const d = SERVICES[type];
    if (!d || !['prepare', 'wave', 'interval'].includes(this.phase)) return 'Construction indisponible';
    if (this.services.some(s => s.type === type && ['built', 'building'].includes(s.state)))
      return 'Ce service existe déjà';
    const missing = d.requires.find(t => !this.service(t));
    if (missing) return `Requis : ${SERVICES[missing].name}`;
    if (this.money < d.cost) return 'Budget insuffisant';
    if (x !== undefined && !this.buildPlot(x, y)) return NO_PLOT;
    return null;
  }
  buildService(type, x, y) {
    const issue = this.canBuild(type, x ?? NaN, y ?? NaN);
    if (issue) {
      this.emit('toast', { text: issue });
      return null;
    }
    const plot = this.buildPlot(x, y);
    this.spend(SERVICES[type].cost);
    this.repairJobs = this.repairJobs.filter(j => j.id !== plot.id);
    Object.assign(plot, {
      type,
      state: 'building',
      tier: 1,
      hp: 240,
      maxHp: 240,
      protection: 0,
      armorHp: 0,
      armorMax: 0,
      progress: 0,
      duration: 4,
      upgrading: 0,
    });
    this.fx('deploy', plot.x, plot.y, SERVICES[type].color, 1.5);
    return plot.id;
  }
  upgradeService(id) {
    const s = this.services.find(s => s.id === id && s.state === 'built');
    if (!s || s.tier >= 3 || s.upgrading) return false;
    const cost = 80 + s.tier * 40;
    if (!this.spend(cost)) return false;
    s.upgrading = 6;
    return true;
  }
  upgradeBarrier(id) {
    const b = this.barriers.find(b => b.id === id),
      work = this.service('workshop');
    if (!b || !work || (b.tier ?? 1) >= 3 || (b.tier ?? 1) > work.tier) return false;
    const cost = 30 + (b.tier ?? 1) * 20;
    if (!this.spend(cost)) return false;
    b.tier = (b.tier ?? 1) + 1;
    b.maxHp = 180 + (b.tier - 1) * 170;
    b.hp = b.maxHp;
    this.clearRoutes();
    this.fx('deploy', b.x, b.y, '#f4d49b', 1);
    return true;
  }
  /** Builders bring a ruined service back with its type and tier, for half its construction price. */
  restoreIssue(s) {
    if (!s || s.state !== 'ruin' || !s.type) return 'Rien à restaurer';
    if (!this.service('workshop')) return 'Chantier requis';
    if (this.repairJobs.some(j => j.id === s.id)) return 'Restauration en cours';
    if (this.services.some(o => o !== s && o.type === s.type && ['built', 'building'].includes(o.state)))
      return 'Ce service existe déjà ailleurs';
    return null;
  }
  restoreCost(s) {
    return Math.round(SERVICES[s.type].cost * 0.5);
  }
  restore(id) {
    const s = this.services.find(s => s.id === id);
    if (this.restoreIssue(s) || !this.spend(this.restoreCost(s))) return false;
    this.repairJobs.push({ id, remaining: 10, rate: s.maxHp / 10, restore: true });
    this.fx('deploy', s.x, s.y, '#e0bc80', 1.4);
    return true;
  }
  queueRepair(id) {
    const b = this.targets.find(b => b.id === id) ?? this.buildings.find(b => b.id === id);
    if (
      !b ||
      (b.primary && b.hp <= 0) ||
      !this.service('workshop') ||
      b.hp >= b.maxHp ||
      this.repairJobs.some(j => j.id === id)
    )
      return false;
    const cost = b.hp <= 0 ? 90 : 50;
    if (!this.spend(cost)) return false;
    this.repairJobs.push({
      id,
      remaining: b.hp <= 0 ? 12 : 8,
      rate: b.hp <= 0 ? b.maxHp / 12 : 25,
      restore: b.hp <= 0,
    });
    return true;
  }
  updateConstruction(dt) {
    for (const s of this.services) {
      if (s.state === 'building') {
        s.progress += dt;
        if (s.progress >= s.duration) {
          s.state = 'built';
          s.progress = s.duration;
          this.emit('toast', { text: SERVICES[s.type].name + ' opérationnel.' });
          this.fx('deploy', s.x, s.y, SERVICES[s.type].color, 1.7);
        }
      }
      if (s.state === 'built' && s.upgrading) {
        s.upgrading -= dt;
        if (s.upgrading <= 0) {
          s.upgrading = 0;
          s.tier++;
          s.maxHp += 80;
          s.hp = Math.min(s.maxHp, s.hp + 80);
          this.emit('toast', { text: SERVICES[s.type].short + ' · niveau ' + s.tier });
        }
      }
    }
    const workshop = this.service('workshop');
    this.builderTarget = null;
    if (workshop) {
      for (const j of this.repairJobs) {
        const b = [...this.buildings, ...this.services].find(b => b.id === j.id);
        if (!b) continue;
        if ((b.flash ?? 0) > 0) {
          this.builderTarget = b.id;
          continue;
        }
        j.remaining -= dt;
        b.hp = Math.min(b.maxHp, b.hp + j.rate * dt);
        this.builderTarget = b.id;
        if (j.restore && j.remaining <= 0 && b.state === 'ruin') {
          b.state = 'built';
          b.hp = b.maxHp;
          b.armorHp = 0;
          this.emit('toast', { text: SERVICES[b.type].name + ' restauré par les bâtisseurs.' });
          this.fx('deploy', b.x, b.y, SERVICES[b.type].color, 1.7);
        }
      }
      this.repairJobs = this.repairJobs.filter(j => j.remaining > 0);
      const damaged = this.targets
        .filter(b => b.hp > 0 && b.hp < b.maxHp && !(b.flash > 0))
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (damaged) {
        damaged.hp = Math.min(
          damaged.maxHp,
          damaged.hp + (this.phase === 'prepare' ? 5 : 2.3) * workshop.tier * dt
        );
        this.builderTarget = damaged.id;
        if (this.time > this.nextRepairFx) {
          this.fx('heal', damaged.x, damaged.y, '#afe3ad', 1.5);
          this.nextRepairFx = this.time + 2;
        }
      }
    }
    const clinic = this.service('clinic');
    if (clinic)
      for (const u of this.units)
        if (dist(u, clinic.access) < 4 && u.hp > 0 && !airborne(u)) {
          u.hp = Math.min(u.maxHp, u.hp + (this.phase === 'wave' ? 2 : 4) * clinic.tier * dt);
          u.healUntil = this.time + 0.1;
        }
    const civic = this.service('civic');
    if (civic) this.trust = Math.min(100, this.trust + 0.08 * civic.tier * dt);
  }
  beginBreach() {
    if (this.phase === 'breach') return;
    this.phase = 'breach';
    this.force = false;
    const actors = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      seed: (i * 0.618) % 1,
      type: i % 4 ? 'walker' : 'heavy',
      x: 10.2 + (i % 8) * 0.5,
      y: 14.7 + Math.floor(i / 8) * 0.43,
      sx: 10.2 + (i % 8) * 0.5,
      sy: 14.7 + Math.floor(i / 8) * 0.43,
      tx: 10.9 + (i % 6) * 0.43,
      ty: 10.7 + Math.floor(i / 6) * 0.34,
      inside: false,
      entryAt: i * 0.018,
    }));
    this.breach = {
      elapsed: 0,
      duration: 4.8,
      stage: 'portail',
      actors,
      enteredCount: 0,
      leader: { x: 12, y: 11.35, captured: false },
    };
    this.emit('breach');
    this.fx('shatter', 12, 14, '#e8d2a1', 2);
  }
  updateBreach(dt) {
    this.time += dt;
    this.breach.elapsed += dt;
    const t = this.breach.elapsed;
    let entered = 0;
    for (const p of this.breach.actors) {
      const f = clamp((t - p.entryAt) / 1.7, 0, 1),
        door = { x: 12 + ((p.id % 3) - 1) * 0.12, y: 14.05 };
      if (f < 0.5) {
        p.x = p.sx + (door.x - p.sx) * f * 2;
        p.y = p.sy + (door.y - p.sy) * f * 2;
      } else {
        p.x = door.x + (p.tx - door.x) * (f - 0.5) * 2;
        p.y = door.y + (p.ty - door.y) * (f - 0.5) * 2;
      }
      p.inside = f > 0.5 && p.y < 13.85;
      p.moving = f < 1;
      if (p.inside) entered++;
    }
    this.breach.enteredCount = entered;
    const leader = this.breach.leader;
    leader.captured = t >= 2.7 && entered >= 12;
    const exit = clamp((t - 3) / 1.45, 0, 1);
    leader.y = 11.35 + (15.6 - 11.35) * exit;
    this.breach.stage =
      t < 0.8 ? 'portail' : !leader.captured ? 'entrée' : t < 4.3 ? 'capture' : 'renversement';
    if (t >= this.breach.duration)
      this.end(
        false,
        'La foule a pénétré dans le palais. Le chef d’État est capturé, puis escorté dehors. Le régime est renversé.'
      );
  }

  end(win, reason) {
    this.phase = win ? 'won' : 'lost';
    this.reason = reason;
    this.force = false;
    this.emit('end', { win });
  }
  /** Plain-language causes for the result screen, derived from what actually happened. */
  debrief() {
    const lines = [],
      gd = this.stats.gateDamage ?? [],
      total = gd.reduce((n, v) => n + v, 0);
    if (total > 0) {
      const worst = gd.indexOf(Math.max(...gd));
      lines.push(
        `${Math.round((gd[worst] / total) * 100)} % des dégâts sont venus de ${GATES[worst].name}. Barrez cette artère plus tôt.`
      );
    }
    const lost = (this.stats.lost ?? []).filter(n => n && n !== this.primary.name);
    if (lost.length) lines.push(`Services perdus : ${[...new Set(lost)].join(', ')}.`);
    if (this.trust < 40)
      lines.push('La confiance s’est effondrée : plus de médiation, moins d’ordre renforcé.');
    if (this.phase === 'won') {
      if (this.integrity < 65)
        lines.push('Le palais a trop souffert : renforcez sa façade avant la dernière vague.');
      if (this.trust < 70) lines.push('Gardez la confiance au-dessus de 70 % pour la troisième étoile.');
    } else if (!this.service('workshop')) lines.push('Sans chantier, aucune réparation ni restauration.');
    return lines.slice(0, 3);
  }
  get stars() {
    return this.phase === 'won' ? 1 + (this.integrity >= 65 ? 1 : 0) + (this.trust >= 70 ? 1 : 0) : 0;
  }
  snapshot() {
    const keys = [
      'level',
      'time',
      'phase',
      'wave',
      'countdown',
      'money',
      'trust',
      'buildings',
      'units',
      'barriers',
      'hostile',
      'fields',
      'crowd',
      'rallies',
      'effects',
      'nextId',
      'version',
      'command',
      'force',
      'nextImpulse',
      'stats',
      'reason',
      'services',
      'repairJobs',
      'breach',
      'nextRepairFx',
      'vans',
      'decoys',
      'opts',
      'mods',
      'perks',
      'draft',
      'combo',
    ];
    const data = { schema: 3, seed: this.rng.seed };
    for (const k of keys) data[k] = structuredClone(this[k]);
    return data;
  }
  static restore(data) {
    if (
      ![1, 2, 3].includes(data?.schema) ||
      !Number.isInteger(data.level) ||
      data.level < 0 ||
      data.level > 5 ||
      !['prepare', 'wave', 'interval', 'breach'].includes(data.phase)
    )
      throw Error('Session invalide');
    for (const k of ['time', 'wave', 'money', 'trust', 'nextId', 'seed'])
      if (!Number.isFinite(data[k])) throw Error('Session invalide');
    for (const k of ['units', 'barriers', 'hostile', 'fields', 'crowd', 'rallies', 'buildings', 'effects'])
      if (!Array.isArray(data[k]) || data[k].length > 500) throw Error('Session invalide');
    for (const k of ['units', 'barriers', 'hostile', 'fields', 'crowd', 'buildings'])
      for (const p of data[k])
        if (
          !Number.isFinite(p.x + p.y) ||
          p.x < EDGE_MIN - 1 ||
          p.x > EDGE_MAX + 1 ||
          p.y < EDGE_MIN - 1 ||
          p.y > EDGE_MAX + 1
        )
          throw Error('Position invalide');
    if (
      !data.buildings.some(b => b.primary) ||
      data.buildings.length > 4 ||
      data.units.some(u => !EQUIPMENT[u.type]?.unit) ||
      data.crowd.some(p => !CROWD[p.type])
    )
      throw Error('Objets invalides');
    const g = new CityGame(data.level);
    for (const k of Object.keys(g.snapshot()))
      if (k !== 'schema' && k !== 'seed' && k in data) g[k] = structuredClone(data[k]);
    if (data.schema === 1) {
      for (const p of g.crowd) p.tier ??= 1;
      for (const b of g.barriers) b.tier ??= 1;
      for (const type of ['command', 'academy', 'workshop', 'depot', 'lab', 'civic']) {
        const plot = g.services.find(s => s.state === 'empty');
        Object.assign(plot, { type, state: 'built', tier: 2, hp: 240 });
      }
      Object.assign(g.primary, { name: 'PALAIS D’AZUR', kind: 'civic', h: 3.2 });
    }
    if (data.schema < 3) {
      g.buildings = g.buildings.filter(b => b.primary);
      Object.assign(g.primary, { name: 'PALAIS PRÉSIDENTIEL', kind: 'civic', h: 3.7 });
      const legacy = g.services;
      g.services = servicePlots().map(s => ({ ...s, ...legacy.find(o => o.id === s.id) }));
      for (const b of g.targets) {
        b.armorMax = ARMOR[b.protection ?? 0];
        b.armorHp = b.armorMax;
      }
      for (const p of g.crowd) {
        p.pathVersion = -1;
        if (!g.targets.some(b => b.id === p.target)) p.target = 3;
      }
      if (g.phase === 'breach') {
        const elapsed = g.breach?.elapsed ?? 0;
        g.phase = 'wave';
        g.beginBreach();
        g.updateBreach(Math.min(4.6, elapsed));
      }
    }
    if (
      !Array.isArray(g.services) ||
      g.services.length !== 9 ||
      g.services.some(s => s.type && !SERVICES[s.type])
    )
      throw Error('Services invalides');
    if (g.phase === 'breach' && (!g.breach || !Number.isFinite(g.breach.elapsed)))
      throw Error('Séquence invalide');
    g.rng = new Rng(data.seed);
    g.routeCache = new Map();
    g.events = [];
    return g;
  }
}
