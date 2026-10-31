import {
  DISTRICTS,
  EQUIPMENT,
  clamp,
  road,
  SERVICES,
  serviceFor,
  FORTIFICATIONS,
  REVISION,
  GATES,
  CARDS,
  GRADES,
  gradeFor,
} from './data.js';
import { CityGame } from './sim.js';
import { CityRenderer } from './render.js';
import { icon } from './icons.js';
import { AudioFx } from './audio.js';
const $ = id => document.getElementById(id),
  STORE = 'emmet.city.v1';
document.querySelectorAll('[data-icon]').forEach(el => (el.innerHTML = icon(el.dataset.icon)));
document.getElementById('build-label').textContent = `PROTOTYPE ${REVISION} · FONDATIONS`;
const fresh = () => ({
  v: 1,
  completed: [0, 0, 0, 0, 0, 0],
  xp: 0,
  sound: true,
  music: true,
  mission: null,
  played: false,
  daily: null,
  best: 0,
  arrestedTotal: 0,
});
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE));
    if (raw?.v !== 1) return fresh();
    return {
      ...fresh(),
      ...raw,
      completed: Array.from({ length: 6 }, (_, i) => clamp(Number(raw.completed?.[i]) || 0, 0, 3)),
      xp: Math.max(0, Number(raw.xp) || 0),
      best: Math.max(0, Number(raw.best) || 0),
      arrestedTotal: Math.max(0, Number(raw.arrestedTotal) || 0),
    };
  } catch {
    return fresh();
  }
}
let save = load(),
  selectedLevel = Math.min(
    5,
    save.completed.findIndex(n => n === 0) < 0 ? 5 : save.completed.findIndex(n => n === 0)
  ),
  game = null,
  mode = 'home',
  paused = false,
  speed = 1,
  tool = null,
  selected = null,
  moving = null,
  paletteMode = 'build',
  techKey = '',
  lastSaved = 0,
  toastUntil = 0,
  drag = null;
const canvas = $('city'),
  view = new CityRenderer(canvas);
const demo = new CityGame(0, 8);
demo.events = [];
const sound = new AudioFx(save.sound, save.music);
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(save));
    $('saved-state').textContent = 'SAUVEGARDE LOCALE · OK';
  } catch {
    $('saved-state').textContent = 'SAUVEGARDE INDISPONIBLE';
  }
}
function saveMission() {
  if (game && ['prepare', 'wave', 'interval', 'breach'].includes(game.phase)) {
    save.mission = game.snapshot();
    persist();
  }
}
const heldCount = () => game.crowd.filter(p => p.state === 'held').length;
/** Help bubble for a locked card: the whole chain of buildings still missing, then what it does. */
function unlockHelp(type) {
  const d = EQUIPMENT[type] ?? SERVICES[type],
    chain = t => [...SERVICES[t].requires.flatMap(chain), t],
    root = SERVICES[type] ? type : serviceFor(type);
  const steps = root ? [...new Set(chain(root))].filter(t => t !== type && !game.service(t)) : [];
  const parts = [];
  if (steps.length) parts.push('bâtissez ' + steps.map(t => SERVICES[t].short).join(' → '));
  if (type === 'helicopter' && (game.service('lab')?.tier ?? 0) < 2)
    parts.push('améliorez le Centre aérien au niveau 2 (touchez-le sur la carte)');
  return `${d.name} : ${parts.length ? parts.join(', puis ') + '. ' : ''}${d.desc}`;
}
function toast(text, duration = 2.8) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  toastUntil = performance.now() + duration * 1000;
}
function unlocked(level) {
  return level === 0 || save.completed[level - 1] > 0;
}
function home() {
  document.body.classList.remove('breach-mode');
  saveMission();
  mode = 'home';
  game = null;
  paused = false;
  tool = null;
  selected = null;
  moving = null;
  view.menu = true;
  view.zoom = 1;
  view.pan = { x: 0, y: 0 };
  view.tool = null;
  view.selected = null;
  $('hud').hidden = true;
  $('home').hidden = false;
  closeOverlay(false);
  renderCampaign();
}
function renderCampaign() {
  // Survival by rounds replaces the six-map campaign: one city, rounds until the palace falls.
  selectedLevel = 0;
  document.querySelector('.campaign').hidden = true;
  const g = gradeFor(save.xp),
    next = GRADES[g + 1];
  $('home-progress').textContent =
    `GRADE ${GRADES[g].name.toUpperCase()} · ${save.xp} XP${next ? ` · ${next.name} à ${next.xp} XP` : ''} · RECORD : ${save.best ? 'MANCHE ' + save.best : 'À ÉTABLIR'}`;
  const done = save.daily?.date === today();
  $('daily').innerHTML =
    `DÉFI DU JOUR <small>${done ? 'record du jour : manche ' + save.daily.best : 'même ville, mêmes cartes pour tous'}</small>`;
  $('resume').hidden = !save.mission;
  $('start').innerHTML = `JOUER ${icon('arrow')}`;
}
const today = () => new Date().toISOString().slice(0, 10);
function start(level, resume = false, daily = false) {
  sound.unlock();
  if (!unlocked(level) && !resume) return;
  try {
    // Daily challenge: everyone gets the same seed (date), so the same rounds and the same cards.
    const seed = daily ? Number(today().replaceAll('-', '')) : 71 + save.xp + Math.floor(Math.random() * 1e6);
    game = resume
      ? CityGame.restore(save.mission)
      : new CityGame(level, seed, { grade: gradeFor(save.xp), daily });
  } catch {
    save.mission = null;
    persist();
    toast('La session précédente ne peut pas être reprise.');
    return;
  }
  selectedLevel = game.level;
  mode = 'game';
  paused = false;
  speed = 1;
  paletteMode = game.service('command') ? 'units' : 'build';
  tool = game.service('command') ? null : 'build:command';
  selected = null;
  moving = null;
  view.menu = false;
  view.pan = { x: 0, y: 0 };
  view.zoom = view.height > view.width ? 1.6 : 1.16;
  view.tool = tool;
  view.selected = null;
  $('home').hidden = true;
  $('hud').hidden = false;
  $('speed').textContent = '1×';
  closeOverlay(false);
  renderPalette();
  updateHud();
  save.played = true;
  saveMission();
  toast(
    resume
      ? 'Partie reprise : ville et services sauvegardés.'
      : 'Vous partez avec le palais seul. Tout le pays est à construire sur les terrains +.',
    5
  );
}
function selectTool(type) {
  tool = tool === type ? null : type;
  moving = null;
  selected = null;
  view.tool = tool;
  view.selected = null;
  $('selection').hidden = true;
  renderPalette();
  updateDescription();
  sound.play('place');
}
function upgradeLabel(s) {
  const cost = 80 + s.tier * 40;
  if (s.state === 'building') return { text: 'EN COURS' };
  if (s.state === 'ruin') return { text: 'RUINE' };
  if (s.upgrading) return { text: `⬆ ${Math.ceil(s.upgrading)} s` };
  if (s.tier >= 3) return { text: 'NIV. MAX' };
  return { text: `NIV.${s.tier} ⬆${cost}`, ready: game.money >= cost };
}
function renderPalette() {
  if (!game) return;
  // A construction tool whose building now exists has done its job: drop it.
  if (tool?.startsWith('build:') && game.canBuild(tool.slice(6)) === 'Ce service existe déjà') {
    tool = null;
    view.tool = null;
  }
  const constructing = paletteMode === 'build';
  $('palette').classList.toggle('building-palette', constructing);
  document
    .querySelectorAll('[data-palette]')
    .forEach(b => b.classList.toggle('active', b.dataset.palette === paletteMode));
  $('palette').replaceChildren();
  const entries = Object.entries(constructing ? SERVICES : EQUIPMENT);
  entries.forEach(([type, d], i) => {
    const actual = constructing ? 'build:' + type : type,
      existing = constructing ? game.services.find(s => s.type === type && s.state !== 'ruin') : null,
      issue = constructing ? game.canBuild(type) : game.equipmentIssue(type),
      b = document.createElement('button');
    b.className = 'tool' + (actual === tool ? ' selected' : '');
    b.disabled = false;
    b.classList.toggle('locked-construction', constructing && !!issue && !existing);
    b.dataset.tool = actual;
    b.style.setProperty('--tool-color', d.color);
    b.setAttribute(
      'aria-label',
      `${d.name} · ${existing ? (existing.state === 'building' ? 'en construction' : 'niveau ' + existing.tier) : issue || (constructing ? d.cost : game.costOf(type)) + ' crédits'}`
    );
    b.setAttribute('aria-pressed', String(actual === tool));
    b.title = issue || d.desc;
    const up = existing && upgradeLabel(existing);
    b.classList.toggle('can-upgrade', !!up?.ready);
    b.innerHTML = `<span class="tool-top">${icon(d.icon)}<span class="price${issue ? ' locked' : ''}">${existing ? up.text : issue && issue !== 'Budget insuffisant' ? 'REQUIS' : constructing ? d.cost : game.costOf(type)}</span></span><b>${d.short}</b><kbd>${i + 1}</kbd>`;
    b.onclick = () => {
      // A built service's card upgrades it in one tap (and trains its troops); otherwise show details.
      if (existing && upgradeLabel(existing).ready) {
        game.upgradeService(existing.id);
        toast(`${SERVICES[type].short} → niveau ${existing.tier + 1} dans 6 s · troupes formées`);
        sound.play('place');
        renderPalette();
        saveMission();
        return;
      }
      if (existing) return showSelection({ type: 'service', id: existing.id });
      // Locked cards stay tappable: they explain how to unlock them instead of doing nothing.
      if (issue && issue !== 'Budget insuffisant') return toast(unlockHelp(type), 7);
      selectTool(actual);
    };
    $('palette').append(b);
  });
  updateDescription();
}
function updateDescription() {
  const d = EQUIPMENT[tool] ?? SERVICES[tool?.slice(6)];
  $('tool-name').textContent = moving
    ? 'DÉPLACER L’UNITÉ'
    : d
      ? d.name.toUpperCase()
      : paletteMode === 'build'
        ? 'RECONSTRUIRE LE PAYS'
        : 'VOTRE VILLE, VOS LIGNES.';
  $('tool-detail').textContent = moving
    ? 'Touchez la rue à rejoindre.'
    : d
      ? d.desc +
        (tool?.startsWith('build:') && game.canBuild(tool.slice(6))
          ? ' · ' + game.canBuild(tool.slice(6))
          : '')
      : paletteMode === 'build'
        ? 'Neuf types de bâtiments. Faites défiler la palette, puis choisissez un terrain +.'
        : 'Touchez une unité ou un bâtiment pour agir.';
  $('cancel-tool').hidden = !tool && !moving;
}
/** Card draft between rounds: an overlay that cannot be dismissed without choosing. */
function showDraft() {
  const d = game.draft,
    label = { boost: 'IMMÉDIAT', build: 'PERMANENT', risk: 'PARI' };
  showOverlay(
    `<p class="eyebrow">MANCHE ${game.wave} TENUE · CHOISISSEZ UN ATOUT</p><h2>${game.wave ? 'La ville respire.' : 'Avant la première manche.'}</h2><div class="draft">${d.cards
      .map(
        id =>
          `<button class="draft-card ${CARDS[id].kind}" data-card="${id}"><small>${label[CARDS[id].kind]}</small><b>${CARDS[id].name}</b><span>${CARDS[id].text}</span></button>`
      )
      .join(
        ''
      )}</div>${d.rerolls ? `<div class="overlay-actions"><button class="secondary" id="reroll">RELANCER (${d.rerolls})</button></div>` : ''}`,
    card => {
      for (const b of card.querySelectorAll('[data-card]'))
        b.onclick = () => {
          game.pickCard(b.dataset.card);
          sound.play('place');
          closeOverlay();
          renderPalette();
          events();
          saveMission();
        };
      const r = card.querySelector('#reroll');
      if (r)
        r.onclick = () => {
          game.rerollCards();
          showDraft();
        };
    }
  );
}
function updateHud() {
  if (game.draft && $('overlay').hidden && mode === 'game') showDraft();
  const repairCost = game.repairAllCost();
  $('repair-all').disabled = !repairCost || game.money < 30;
  $('repair-all').innerHTML = repairCost
    ? `TOUT RÉPARER <small>${repairCost} CR.</small>`
    : 'TOUT RÉPARER <small>RIEN À FAIRE</small>';
  if (!game) return;
  $('district-name').textContent = 'V' + REVISION + ' · ' + DISTRICTS[game.level].name;
  $('district-name').title = DISTRICTS[game.level].objective;
  document.body.classList.toggle('breach-mode', game.phase === 'breach');
  $('phase').textContent =
    game.phase === 'breach'
      ? 'PALAIS ENVAHI'
      : game.phase === 'prepare'
        ? 'PRÉPARATION'
        : game.phase === 'interval'
          ? 'ACCALMIE'
          : game.phase === 'wave'
            ? 'INTERVENTION EN COURS'
            : 'OPÉRATION TERMINÉE';
  $('wave-text').textContent = game.def.endless
    ? `MANCHE ${Math.max(1, game.wave)}`
    : `VAGUE ${Math.max(1, game.wave)} / ${game.def.waves}`;
  $('crowd-text').textContent =
    game.phase === 'wave'
      ? `${game.activeCrowd} dans la foule · ${game.units.length} unités`
      : game.phase === 'interval'
        ? `${Math.ceil(game.countdown)} s avant le prochain rassemblement`
        : 'Un palais · bâtissez vos premiers services';
  $('budget').textContent = Math.floor(game.money);
  $('integrity-text').textContent = Math.round(game.integrity) + '%';
  $('trust-text').textContent = Math.max(0, Math.round(game.trust)) + '%';
  $('integrity-fill').style.width = game.integrity + '%';
  $('trust-fill').style.width = Math.max(0, game.trust) + '%';
  $('mission-objective').textContent =
    `${game.builtCount} bâtiment${game.builtCount > 1 ? 's' : ''} · ${game.services.filter(s => s.state === 'empty').length} terrains libres · +${Math.round(game.income() * 60)} crédits / min · ${game.stats.arrested ?? 0} interpellés${heldCount() ? ` · ${heldCount()} à ramasser en fin de manche` : ''}`;
  $('launch').hidden = !['prepare', 'interval'].includes(game.phase);
  $('launch-label').textContent =
    game.phase === 'interval'
      ? `MANCHE ${game.wave + 1} · ${Math.ceil(game.countdown)} s`
      : 'LANCER LA MANCHE';
  $('launch-help').textContent =
    game.phase === 'interval'
      ? 'Touchez pour lancer maintenant'
      : game.service('command')
        ? game
            .wavePlan(game.wave + 1)
            .map(({ gate, count }) => `${count} · ${GATES[gate].name}`)
            .join(' + ')
        : 'Bâtissez votre poste de commandement';
  for (const b of document.querySelectorAll('[data-order]'))
    b.classList.toggle('active', b.dataset.order === game.command);
  $('force').disabled = game.rank < 3;
  $('force').classList.toggle('active', game.force);
  $('force').innerHTML =
    `RENFORCÉ <small>${game.rank < 3 ? 'RANG 3' : game.force ? 'ACTIF · CONFIANCE ↓' : 'DISPONIBLE'}</small>`;
  const nextTech =
    game.services
      .map(
        s =>
          `${s.type}:${s.state}:${s.tier}:${Math.ceil(s.upgrading ?? 0)}:${game.money >= 80 + s.tier * 40 ? 1 : 0}`
      )
      .join('|') +
    Object.values(SERVICES)
      .map(d => (game.money >= d.cost ? '1' : '0'))
      .join('');
  if (nextTech !== techKey) {
    techKey = nextTech;
    renderPalette();
  }
  for (const b of $('palette').children) {
    const d = EQUIPMENT[b.dataset.tool] ?? SERVICES[b.dataset.tool.slice(6)];
    b.classList.toggle('unaffordable', game.money < d.cost);
  }
  updateSelection();
}
function showSelection(pick) {
  selected = pick;
  view.selected = pick;
  tool = null;
  view.tool = null;
  moving = null;
  renderPalette();
  updateSelection(true);
}
let selectionKey = '';
function updateSelection(force = false) {
  const panel = $('selection');
  if (!selected || !game) {
    panel.hidden = true;
    selectionKey = '';
    return;
  }
  const obj =
    selected.type === 'building'
      ? game.buildings.find(b => b.id === selected.id)
      : selected.type === 'unit'
        ? game.units.find(u => u.id === selected.id)
        : selected.type === 'service'
          ? game.services.find(s => s.id === selected.id)
          : game.barriers.find(b => b.id === selected.id);
  if (!obj) {
    selected = null;
    view.selected = null;
    panel.hidden = true;
    return;
  }
  const k = JSON.stringify([
    selected,
    Math.ceil(obj.hp),
    Math.ceil(obj.armorHp ?? 0),
    obj.tier,
    obj.protection,
    obj.state,
    Math.ceil(obj.upgrading || 0),
    Math.ceil(obj.progress || 0),
    Math.floor(game.money),
  ]);
  if (k === selectionKey && !force) return;
  selectionKey = k;
  panel.hidden = false;
  const name =
    selected.type === 'building'
      ? obj.name
      : selected.type === 'unit'
        ? EQUIPMENT[obj.type].name
        : selected.type === 'service'
          ? (SERVICES[obj.type]?.name ?? 'Terrain à bâtir')
          : 'Barricade';
  panel.innerHTML = `<div class="sel-head"><h3>${name}</h3><button class="close" aria-label="Fermer la sélection">✕</button></div><div class="sel-hp"><i style="width:${Math.max(0, (obj.hp / obj.maxHp) * 100)}%"></i></div><p>${Math.ceil(obj.hp)} / ${obj.maxHp} protection${selected.type === 'unit' ? ` · niveau ${obj.tier} · touchez une rue pour l’y envoyer` : selected.type === 'building' ? ` · renfort ${obj.protection}/3` : ''}</p><div class="sel-actions"></div>`;
  panel.querySelector('.close').onclick = () => {
    selected = null;
    view.selected = null;
    panel.hidden = true;
  };
  const actions = panel.querySelector('.sel-actions');
  const add = (text, fn, disabled = false, primary = false) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.disabled = disabled;
    b.classList.toggle('sel-primary', primary);
    b.onclick = () => {
      if (!fn()) toast('Budget insuffisant ou amélioration impossible.');
      else {
        sound.play('place');
        updateSelection(true);
        saveMission();
      }
    };
    actions.append(b);
  };
  const fortify = () => {
    const tier = obj.protection ?? 0,
      info = document.createElement('div');
    info.className = 'fortification-info';
    info.innerHTML = `<b>${FORTIFICATIONS[tier]}</b><span>${Math.ceil(obj.armorHp ?? 0)} / ${obj.armorMax ?? 0} résistance de façade</span><div><i style="width:${((obj.armorHp ?? 0) / (obj.armorMax || 1)) * 100}%"></i></div>`;
    actions.before(info);
    const issue = game.fortificationIssue(obj),
      price = 55 + tier * 30;
    add(
      tier >= 3 ? 'PÉRIMÈTRE MAX.' : issue || `FAÇADE NIV. ${tier + 1} · ${price}`,
      () => game.reinforce(obj.id),
      !!issue || game.money < price,
      true
    );
    if (obj.armorMax)
      add(
        'RÉPARER LA FAÇADE · 30',
        () => game.repairArmor(obj.id),
        obj.armorHp >= obj.armorMax || game.money < 30
      );
  };
  if (selected.type === 'service') {
    panel.querySelector('p').textContent =
      obj.state === 'empty'
        ? 'Terrain libre. Choisissez le bâtiment que vous voulez construire.'
        : obj.state === 'building'
          ? `Construction · ${Math.ceil(obj.duration - obj.progress)} s restantes`
          : obj.state === 'ruin'
            ? 'Service détruit. Les bâtisseurs du chantier peuvent le restaurer avec son niveau, ou bâtissez autre chose ici.'
            : `Niveau ${obj.tier}/3 · ${SERVICES[obj.type].desc}`;
    if (obj.state === 'ruin' && obj.type) {
      const issue = game.restoreIssue(obj);
      add(
        issue && issue !== 'Restauration en cours'
          ? issue.toUpperCase()
          : issue
            ? 'RESTAURATION EN COURS'
            : `RESTAURER · ${game.restoreCost(obj)}`,
        () => game.restore(obj.id),
        !!issue || game.money < game.restoreCost(obj),
        true
      );
    }
    if (obj.state === 'built') {
      const cost = 80 + obj.tier * 40;
      add(
        obj.upgrading
          ? `TRAVAUX · ${Math.ceil(obj.upgrading)} s`
          : obj.tier >= 3
            ? 'NIVEAU MAX.'
            : `AMÉLIORER · ${cost}`,
        () => game.upgradeService(obj.id),
        obj.tier >= 3 || !!obj.upgrading || game.money < cost,
        true
      );
      fortify();
      if (game.service('workshop'))
        add(
          'RÉPARER LA STRUCTURE · 50',
          () => game.queueRepair(obj.id),
          obj.hp >= obj.maxHp || game.money < 50 || game.repairJobs.some(j => j.id === obj.id)
        );
    }
  } else if (selected.type === 'building') {
    panel.querySelector('p').textContent =
      'Institution centrale · Le chef d’État est à l’intérieur. Si le palais cède, la foule entre et la partie est perdue.';
    fortify();
    if (game.service('workshop'))
      add(
        'RÉPARER LA STRUCTURE · 50',
        () => game.queueRepair(obj.id),
        obj.hp >= obj.maxHp || game.money < 50 || game.repairJobs.some(j => j.id === obj.id)
      );
  } else if (selected.type === 'unit') {
    add(
      'DÉPLACER',
      () => {
        moving = obj.id;
        tool = null;
        view.tool = null;
        panel.hidden = true;
        selected = null;
        view.selected = null;
        updateDescription();
        toast('Touchez la zone de destination.');
        return true;
      },
      false,
      true
    );
    add('SOIGNER · 30', () => game.repair('unit', obj.id), obj.hp >= obj.maxHp || game.money < 30);
  } else {
    add('RÉPARER · 30', () => game.repair('barrier', obj.id), obj.hp >= obj.maxHp || game.money < 30);
    const cost = 30 + (obj.tier ?? 1) * 20;
    add(
      `RENFORCER NIV. ${(obj.tier ?? 1) + 1} · ${cost}`,
      () => game.upgradeBarrier(obj.id),
      (obj.tier ?? 1) >= 3 ||
        !game.service('workshop') ||
        (obj.tier ?? 1) > (game.service('workshop')?.tier ?? 0) ||
        game.money < cost,
      true
    );
  }
}

function closeOverlay(resume = true) {
  if (resume && game && ['won', 'lost'].includes(game.phase)) return;
  $('overlay').hidden = true;
  if (resume && mode === 'game') paused = false;
}
function showOverlay(html, bind) {
  $('overlay-card').innerHTML = html;
  $('overlay').hidden = false;
  paused = true;
  bind?.($('overlay-card'));
}
function pauseMenu() {
  sound.setMood('pause');
  if (!game || ['won', 'lost'].includes(game.phase)) return;
  saveMission();
  showOverlay(
    `<p class="eyebrow">EMMET · ${game.def.name.toUpperCase()}</p><h2>La ville attend.</h2><p>La partie est en pause. Votre quartier et vos escouades sont sauvegardés sur cet appareil.</p><div class="overlay-actions"><button class="primary" id="continue">REPRENDRE ${icon('play')}</button><button class="secondary" id="to-home">CAMPAGNE</button></div>`,
    card => {
      card.querySelector('#continue').onclick = () => closeOverlay();
      card.querySelector('#to-home').onclick = home;
    }
  );
}
function help() {
  const wasGame = mode === 'game';
  showOverlay(
    `<p class="eyebrow">EMMET · MODE D’EMPLOI</p><h2>Votre ville, vos lignes.</h2><div class="help-steps"><div class="help-step"><i>${icon('squad')}</i><div><b>Tenez le plus de manches</b><span>Les manches s’enchaînent et durcissent ; la partie s’arrête quand le palais tombe. Les personnes interpellées sont ramassées par les fourgons en fin de manche. Vous partez avec un seul bâtiment : le palais. Commandement, logements, commerces, secours et services aériens sont tous à bâtir. Chaque carte explique sa fonction.</span></div></div><div class="help-step"><i>${icon('city')}</i><div><b>Protégez les bâtiments</b><span>Les façades ont leur propre résistance : volets, grilles et périmètre. Touchez un bâtiment pour les améliorer ou réparer séparément sa façade et sa structure.</span></div></div><div class="help-step"><i>${icon('arrow')}</i><div><b>Gardez la main</b><span>Touchez une unité, puis une rue : elle y va. TENIR conserve les positions ; INTERCEPTER envoie les équipes au contact. Une carte grisée se touche aussi : elle explique comment la débloquer.</span></div></div><div class="help-step"><i>${icon('heart')}</i><div><b>Gardez la confiance</b><span>La médiation l’améliore. L’ordre renforcé, débloqué au rang 3, disperse plus vite mais l’épuise. À zéro, le commandement est relevé.</span></div></div></div><p>Glissez pour explorer, pincez ou utilisez + / − pour zoomer. Le centre aérien niveau 2 ouvre l’hélicoptère de soutien. Sur ordinateur : touches 1–9, P pour pause, Entrée pour lancer une vague.</p><div class="overlay-actions"><button class="primary" id="help-close">${wasGame ? 'REPRENDRE' : 'COMPRIS'} ${icon('arrow')}</button></div>`,
    card => (card.querySelector('#help-close').onclick = () => closeOverlay(wasGame))
  );
}
function result() {
  save.mission = null;
  const reached = Math.max(1, game.wave),
    record = reached > save.best;
  save.best = Math.max(save.best, reached);
  save.arrestedTotal += game.stats.arrested ?? 0;
  const before = gradeFor(save.xp),
    xp = reached * 20 + (game.stats.arrested ?? 0);
  save.xp += xp;
  const promoted = gradeFor(save.xp) > before ? GRADES[gradeFor(save.xp)] : null;
  if (game.opts?.daily) {
    const best = save.daily?.date === today() ? save.daily.best : 0;
    save.daily = { date: today(), best: Math.max(best, reached) };
  }
  persist();
  const causes = game.debrief();
  showOverlay(
    `<p class="eyebrow">${game.def.name.toUpperCase()} · BILAN</p><h2>${record ? 'Nouveau record.' : 'Le palais est tombé.'}</h2><p>${game.reason}</p><div class="result-stats"><div><b>${reached}</b><span>MANCHE ATTEINTE</span></div><div><b>${game.stats.arrested ?? 0}</b><span>INTERPELLÉS</span></div><div><b>${save.best}</b><span>RECORD</span></div></div>${
      causes.length ? `<ul class="debrief">${causes.map(line => `<li>${line}</li>`).join('')}</ul>` : ''
    }<p>+${xp} XP${promoted ? ` · <b>Promotion : ${promoted.name}</b> — ${promoted.perk}` : ''}</p><div class="overlay-actions"><button class="primary" id="result-next">REJOUER ${icon('arrow')}</button><button class="secondary" id="result-home">ACCUEIL</button></div>`,
    card => {
      card.querySelector('#result-next').onclick = () => start(0);
      card.querySelector('#result-home').onclick = home;
    }
  );
}
function events() {
  for (const e of game.events.splice(0)) {
    if (e.type === 'toast') toast(e.text);
    else if (e.type === 'breach') {
      tool = null;
      selected = null;
      view.tool = null;
      view.selected = null;
      saveMission();
      sound.play('wave');
    } else if (e.type === 'wave') {
      toast(`${game.def.endless ? 'Manche' : 'Vague'} ${game.wave} : les rassemblements arrivent.`, 3);
      sound.play('wave');
    } else if (e.type === 'clear') {
      toast(`Manche ${game.wave} tenue · +${game.waveReward()} crédits`, 3);
      sound.play('place');
      saveMission();
    } else if (e.type === 'place') sound.play('place');
    else if (e.type === 'impact') {
      sound.play('hit');
      if (e.kind === 'pulse') view.shake = 2;
    } else if (e.type === 'building') {
      toast('Un bâtiment a cédé. Redistribuez vos forces.', 4);
      view.shake = 3;
    } else if (e.type === 'end') {
      result();
      break;
    }
  }
}
$('start').onclick = () => start(selectedLevel);
$('daily').onclick = () => start(0, false, true);
$('repair-all').onclick = () => {
  if (game.repairAll()) sound.play('place');
  events();
  saveMission();
};
$('resume').onclick = () => start(save.mission?.level ?? 0, true);
$('home-help').onclick = help;
$('guide').onclick = help;
$('pause').onclick = pauseMenu;
$('game-home').onclick = pauseMenu;
$('launch').onclick = () => {
  sound.unlock();
  if (game.startWave()) {
    tool = null;
    moving = null;
    view.tool = null;
    selected = null;
    view.selected = null;
    renderPalette();
    events();
    saveMission();
  } else events();
};
$('speed').onclick = () => {
  speed = speed === 3 ? 1 : speed + 1;
  $('speed').textContent = speed + '×';
};
$('cancel-tool').onclick = () => {
  tool = null;
  moving = null;
  view.tool = null;
  renderPalette();
};
for (const b of document.querySelectorAll('[data-order]'))
  b.onclick = () => {
    game.setOrder(b.dataset.order);
    events();
  };
$('force').onclick = () => {
  game.setForce(!game.force);
  events();
};
$('zoom-in').onclick = () => (view.zoom = clamp(view.zoom * 1.25, 0.75, 2.5));
$('zoom-out').onclick = () => (view.zoom = clamp(view.zoom / 1.25, 0.75, 2.5));
$('center').onclick = () => {
  view.zoom = view.height > view.width ? 1.6 : 1.16;
  view.pan = { x: 0, y: 0 };
};
document.querySelectorAll('[data-palette]').forEach(
  b =>
    (b.onclick = () => {
      paletteMode = b.dataset.palette;
      tool = null;
      moving = null;
      view.tool = null;
      selected = null;
      view.selected = null;
      renderPalette();
    })
);
$('music').onclick = () => {
  sound.music = !sound.music;
  save.music = sound.music;
  sound.unlock();
  $('music').textContent = sound.music ? '♫ MUSIQUE' : '♫ MUSIQUE OFF';
  persist();
};
$('sound').onclick = () => {
  sound.enabled = !sound.enabled;
  save.sound = sound.enabled;
  sound.unlock();
  $('sound').innerHTML = icon('sound') + (sound.enabled ? ' SON' : ' MUET');
  persist();
};
const pointers = new Map();
let pinch = null;
canvas.addEventListener('pointerdown', e => {
  if (mode !== 'game' || paused) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const a = [...pointers.values()];
    pinch = { distance: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), zoom: view.zoom };
    drag = null;
  } else drag = { x: e.clientX, y: e.clientY, px: view.pan.x, py: view.pan.y, moved: false };
});
canvas.addEventListener('pointermove', e => {
  if (mode !== 'game' || paused) return;
  view.hover = view.unproject(e.clientX, e.clientY);
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2 && pinch) {
    const a = [...pointers.values()];
    view.zoom = clamp(
      (pinch.zoom * Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)) / pinch.distance,
      0.75,
      2.5
    );
    return;
  }
  if (drag) {
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 7) drag.moved = true;
    if (drag.moved) {
      view.pan.x = clamp(drag.px + dx, -thisWidth(), thisWidth());
      view.pan.y = clamp(drag.py + dy, -view.height * 0.7, view.height * 0.7);
    }
  }
});
const thisWidth = () => view.width * 0.8;
canvas.addEventListener('pointerup', e => {
  const click = drag && !drag.moved && pointers.size === 1;
  pointers.delete(e.pointerId);
  if (!pointers.size) {
    pinch = null;
    drag = null;
  }
  if (!click || !game || paused || game.phase === 'breach') return;
  const ground = view.unproject(e.clientX, e.clientY),
    pick = view.pick(e.clientX, e.clientY, game);
  if (moving) {
    if (game.moveUnit(moving, ground.x, ground.y)) {
      moving = null;
      updateDescription();
      sound.play('place');
      saveMission();
    } else toast('Choisissez une rue pour déplacer cette unité.');
    return;
  }
  if (
    !tool &&
    selected?.type === 'unit' &&
    pick.type !== 'unit' &&
    road(Math.round(ground.x), Math.round(ground.y))
  ) {
    if (game.moveUnit(selected.id, ground.x, ground.y)) {
      sound.play('place');
      saveMission();
    }
    return;
  }
  if (tool?.startsWith('build:')) {
    const plot =
      game.services.find(s => s.id === pick.id) ||
      game.services
        .filter(s => s.state === 'empty' || s.state === 'ruin')
        .sort(
          (a, b) => Math.hypot(a.x - ground.x, a.y - ground.y) - Math.hypot(b.x - ground.x, b.y - ground.y)
        )[0];
    const near = plot && (pick.type === 'service' || Math.hypot(plot.x - ground.x, plot.y - ground.y) < 2.2);
    const id = game.place(tool, near ? plot.x : ground.x, near ? plot.y : ground.y);
    if (id !== null) {
      tool = null;
      view.tool = null;
      renderPalette();
      saveMission();
    }
    events();
    return;
  }
  if (pick.type === 'service') {
    showSelection(pick);
    return;
  }
  if (
    (pick.type === 'building' && !(tool && road(Math.round(ground.x), Math.round(ground.y)))) ||
    (pick.type === 'unit' && (!tool || EQUIPMENT[tool].unit)) ||
    (pick.type === 'barrier' && (!tool || tool === 'barrier'))
  ) {
    showSelection(pick);
    return;
  }
  if (tool) {
    const id = game.place(tool, ground.x, ground.y);
    events();
    if (id !== null) {
      selected = null;
      view.selected = null;
      $('selection').hidden = true;
      saveMission();
    }
    return;
  }
  if (pick.type === 'unit' || pick.type === 'barrier') showSelection(pick);
  else {
    selected = null;
    view.selected = null;
    $('selection').hidden = true;
  }
});
canvas.addEventListener('pointercancel', e => {
  pointers.delete(e.pointerId);
  drag = null;
  pinch = null;
});
canvas.addEventListener(
  'wheel',
  e => {
    if (mode !== 'game' || paused) return;
    e.preventDefault();
    view.zoom = clamp(view.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.75, 2.5);
  },
  { passive: false }
);
addEventListener('keydown', e => {
  if (mode !== 'game') return;
  if (e.key === 'Escape') {
    if (!$('overlay').hidden) closeOverlay();
    else {
      tool = null;
      moving = null;
      selected = null;
      view.selected = null;
      view.tool = null;
      renderPalette();
    }
  } else if (e.key.toLowerCase() === 'p' || e.code === 'Space') {
    e.preventDefault();
    if (paused) closeOverlay();
    else pauseMenu();
  } else if (e.key === 'Enter' && ['prepare', 'interval'].includes(game.phase)) $('launch').click();
  else if (!paused && /^[1-9]$/.test(e.key)) {
    const type = Object.keys(EQUIPMENT)[Number(e.key) - 1];
    if (!game.equipmentIssue(type)) {
      paletteMode = 'units';
      selectTool(type);
    }
  } else if (e.key === '+') $('zoom-in').click();
  else if (e.key === '-') $('zoom-out').click();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'game' && !['won', 'lost'].includes(game.phase)) {
    saveMission();
    pauseMenu();
  }
});
let prev = performance.now(),
  acc = 0,
  uiAcc = 0;
function frame(now) {
  sound.setMood(mode === 'game' && !paused ? game.phase : 'pause');
  const dt = Math.min(0.1, (now - prev) / 1000);
  prev = now;
  if (mode === 'game' && game) {
    if (!paused) {
      acc += dt * (game.phase === 'breach' ? 1 : speed);
      let steps = 0;
      while (acc >= 1 / 30 && steps++ < 8) {
        game.update(1 / 30);
        acc -= 1 / 30;
      }
      events();
    } else acc = 0;
    uiAcc += dt;
    if (uiAcc > 0.12) {
      updateHud();
      uiAcc = 0;
    }
    if (now - lastSaved > 3500 && !paused) {
      saveMission();
      lastSaved = now;
    }
    view.render(game, dt);
  } else {
    demo.time += dt;
    view.render(demo, dt);
  }
  if (toastUntil && now > toastUntil) {
    $('toast').classList.remove('show');
    toastUntil = 0;
  }
  requestAnimationFrame(frame);
}
$('music').textContent = save.music ? '♫ MUSIQUE' : '♫ MUSIQUE OFF';
$('sound').innerHTML = icon('sound') + (save.sound ? ' SON' : ' MUET');
renderCampaign();
requestAnimationFrame(frame);
