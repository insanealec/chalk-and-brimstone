'use strict';

const SAVE_KEY = 'chalk-and-brimstone-chicago-v1';
const MAX_HEALTH = 10;
const ACTIONS_PER_DAY = 3;
const MAX_RUNES = 3;
const HOUR_NAMES = ['Night', 'Evening', 'Afternoon', 'Morning'];

const FRAGMENTS = DEMONS.flatMap(d => d.lore.map((f, i) => ({ id: `${d.id}-${i}`, demon: d, ...f })));

let state = null;
let currentTab = 'chamber';
let manifestation = null; // result of the most recent summoning, shown in the chamber
let busy = false;         // true while the summoning animation plays

// ---------- utilities

const $ = sel => document.querySelector(sel);
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
const demonById = id => DEMONS.find(d => d.id === id);
const circleById = id => CIRCLES.find(c => c.id === id);
const pentacleById = id => PENTACLES.find(p => p.id === id);
const bold = d => `<b>${d.name}</b>`;

// ---------- state

function newState() {
  return {
    day: 1, actions: ACTIONS_PER_DAY, dollars: 30, health: MAX_HEALTH, rep: 0,
    circles: ['chalk'], pentacles: ['chalk'], runes: [...START_RUNES], languages: ['latin'],
    incense: { rosemary: 2, cedar: 1, frankincense: 1 },
    lore: ['nibbet-0'],
    newLore: 1,
    observations: {},
    servants: [],
    nextUid: 1,
    commission: 0,
    log: [],
    over: null, // 'dead' | 'won'
    deathCause: '',
    seenIntro: false,
    sel: { name: 'nibbet', language: 'latin', circle: 'chalk', pentacle: 'chalk', runes: [], incense: null },
    district: 'maxwell',    // district selected on the city map
    encounter: null,        // { district, id } awaiting a choice
    encounterResult: null,  // what happened on the last visit
    lastEncounter: {},      // district id -> last encounter id, to avoid immediate repeats
    doneEncounters: [],     // 'district:encounter' ids of resolved one-time encounters
  };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(newState(), JSON.parse(raw));
  } catch (e) { /* corrupt or unavailable */ }
  return null;
}

function rankIndex() {
  let r = 0;
  RANKS.forEach((k, i) => { if (state.rep >= k.rep) r = i; });
  return r;
}
const rankTier = () => rankIndex() + 1;
const maxServants = () => rankTier();

function log(html, kind = '') {
  const entry = { day: state.day, html, kind };
  state.log.unshift(entry);
  if (state.log.length > 150) state.log.length = 150;
  return entry;
}

function gainRep(n) {
  const oldRank = rankIndex();
  state.rep += n;
  if (rankIndex() > oldRank) {
    log(`You have risen to the rank of <b>${RANKS[rankIndex()].name}</b>. New wares, districts and lore are open to you, and you may hold ${maxServants()} spirits at once.`, 'good');
  }
}

// Adds `count` random incense no rarer than `maxRank`; returns a description like "2 cedar, 1 myrrh".
function grantRandomIncense(count, maxRank) {
  const pool = Object.keys(INCENSE).filter(k => INCENSE[k].rank <= maxRank);
  const got = {};
  for (let i = 0; i < count; i++) {
    const k = pick(pool);
    got[k] = (got[k] || 0) + 1;
    state.incense[k] = (state.incense[k] || 0) + 1;
  }
  return Object.entries(got).map(([k, n]) => `${n} ${INCENSE[k].name.toLowerCase()}`).join(', ');
}

function observe(demonId, text) {
  const list = state.observations[demonId] || (state.observations[demonId] = []);
  if (!list.includes(text)) list.push(text);
}

function hurt(n, cause) {
  state.health -= n;
  if (state.health <= 0) {
    state.health = 0;
    state.over = 'dead';
    state.deathCause = cause;
  }
}

// ---------- lore

function knownDemons() {
  return DEMONS.filter(d => d.lore.some((_, i) => state.lore.includes(`${d.id}-${i}`)));
}

function learnFragment(minTier, maxTier, demonId = null) {
  const pool = FRAGMENTS.filter(f => !state.lore.includes(f.id) && f.demon.tier >= minTier && f.demon.tier <= maxTier
    && (!demonId || f.demon.id === demonId));
  if (!pool.length) return null;
  const f = pick(pool);
  state.lore.push(f.id);
  state.newLore++;
  log(`<span class="src">${f.src}:</span> “${f.text}”`, 'lore');
  return f;
}

function study() {
  if (state.actions < 1 || state.over) return;
  state.actions--;
  const f = learnFragment(1, rankTier());
  if (!f) log('You spend the hour in the library, but find nothing new at your rank. Perhaps a grimoire, or a well-placed spy, would serve better.');
  render();
}

// ---------- summoning

function summonBlocker() {
  const s = state.sel;
  if (state.over) return 'The game is over.';
  if (state.actions < 1) return 'It is too late in the day. End the day and rest.';
  if (!s.name) return 'Choose the true name of a spirit.';
  if (!s.incense) return 'Choose an incense to burn.';
  if ((state.incense[s.incense] || 0) < 1) return `You have no ${INCENSE[s.incense].name.toLowerCase()} left.`;
  if (state.servants.some(sv => sv.demonId === s.name)) return `${demonById(s.name).name} is already in your service.`;
  if (state.servants.length >= maxServants()) return `At your rank you can hold only ${maxServants()} spirit${maxServants() > 1 ? 's' : ''} at once. Dismiss one first.`;
  return null;
}

function beginSummon() {
  if (busy || summonBlocker()) return;
  busy = true;
  manifestation = null;
  render();
  setTimeout(() => {
    manifestation = resolveSummon();
    busy = false;
    render();
  }, 1500);
}

function resolveSummon() {
  const s = state.sel;
  const d = demonById(s.name);
  const circle = circleById(s.circle);
  const pent = pentacleById(s.pentacle);
  const inc = INCENSE[s.incense];
  const incName = inc.name.toLowerCase();
  const lang = LANGUAGES[s.language].name;
  state.actions--;
  state.incense[s.incense]--;

  const m = { demon: d, outcome: null, lines: [], greet: '', footnote: '' };
  log(`You light the ${incName} and call upon ${bold(d)} in ${lang}.`);

  if (s.language !== d.language) {
    m.outcome = 'silence';
    m.lines.push(`The ${lang} words fall dead upon the air. The ${incName} smoke curls, unbothered. Nothing answers.`);
    m.lines.push(`<i>Perhaps ${d.name} does not know that tongue.</i>`);
    observe(d.id, `Did not answer to ${lang}.`);
    log('Nothing answered. The incense is spent.', 'bad');
    return m;
  }

  observe(d.id, `Answers to ${lang}.`);
  m.lines.push(`The smoke thickens and turns. Something is in the circle: ${d.form}.`);

  const right = s.runes.filter(r => d.runes.includes(r));
  const wrong = s.runes.filter(r => !d.runes.includes(r));
  const missing = d.runes.filter(r => !s.runes.includes(r));
  right.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune burns clean and steady.`);
    observe(d.id, `The ${RUNES[r].name} rune holds it.`);
  });
  wrong.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune sputters and smokes — it has no hold here.`);
    observe(d.id, `The ${RUNES[r].name} rune does nothing.`);
  });
  if (missing.length) {
    m.lines.push(`There is a gap in the binding. ${d.name} is held by ${d.runes.length} rune${d.runes.length > 1 ? 's' : ''}; you drew ${right.length} of them.`);
    observe(d.id, `Held by ${d.runes.length} rune${d.runes.length > 1 ? 's' : ''} in all.`);
  }

  let incMod = 0;
  if (d.likes === s.incense) {
    incMod = 2;
    m.lines.push(`${d.name} breathes in the ${incName} with evident pleasure.`);
    observe(d.id, `Likes ${incName}.`);
  } else if (d.hates === s.incense) {
    incMod = -2;
    m.lines.push(`${d.name} recoils from the ${incName}, snarling.`);
    observe(d.id, `Hates ${incName}.`);
  } else {
    m.lines.push(`${d.name} seems indifferent to the ${incName}.`);
    observe(d.id, `Indifferent to ${incName}.`);
  }

  const circleBonus = clamp(circle.tier - d.tier, 0, 2);
  if (circle.tier < d.tier) {
    m.lines.push(`The ${circle.name} was never meant to hold a spirit of this power. It cracks like ice on a pond.`);
    m.outcome = 'broken';
  } else if (missing.length) {
    m.outcome = 'broken';
  } else {
    if (circleBonus) m.lines.push(`Your ${circle.name} is stronger than it needs to be. ${d.name} notices.`);
    const score = incMod - wrong.length + circleBonus;
    m.outcome = score >= 2 ? 'firm' : score >= 0 ? 'uneasy' : 'broken';
  }

  if (m.outcome === 'broken') {
    const safe = pent.tier >= d.tier;
    const dmg = safe ? Math.ceil(d.tier / 2) : d.tier * 2 + 1;
    m.lines.push(safe
      ? `The binding fails. ${d.name} hurls itself at you and breaks against your ${pent.name}. It settles for a parting blast of essence (−${dmg} health) and flees into the night.`
      : `The binding fails. ${d.name} comes for you, and your ${pent.name} is nowhere near strong enough. (−${dmg} health)`);
    const q = pick(BROKEN_QUIPS);
    m.greet = fill(q.greet, { name: d.name });
    m.footnote = q.footnote;
    hurt(dmg, `torn apart by ${d.name}, who slipped a faulty binding`);
    log(`The binding failed. ${bold(d)} broke free. (−${dmg} health)`, 'bad');
    return m;
  }

  const servant = {
    uid: state.nextUid++, demonId: d.id, binding: m.outcome,
    patience: PATIENCE[d.tier] + (m.outcome === 'firm' ? 2 : 0),
    pentTier: pent.tier, errand: null,
  };
  if (m.outcome === 'uneasy' && pent.tier < d.tier && Math.random() < 0.35) {
    m.lines.push(`Before submitting, ${d.name} tests the edge of your pentacle — and finds it wanting. (−${d.tier} health)`);
    hurt(d.tier, `scorched by ${d.name}, testing a pentacle too weak to hold it`);
  }
  m.lines.push(m.outcome === 'firm'
    ? `The binding holds firm. ${d.name} is yours to command — for now.`
    : `The binding holds, barely. ${d.name} strains against it, watching for a mistake.`);
  m.greet = d.greet;
  m.footnote = d.footnote;
  log(`${bold(d)} is bound ${m.outcome === 'firm' ? 'firmly' : 'uneasily'} to your service.`, 'good');
  if (!state.over) {
    state.servants.push(servant);
    checkBindCommission(d);
  }
  return m;
}

// ---------- servants and errands

function errandChance(sv, diff) {
  const d = demonById(sv.demonId);
  return clamp(0.55 + 0.2 * (d.tier - diff) + (sv.binding === 'firm' ? 0.15 : 0), 0.1, 0.95);
}

function errandDiff(sv, errand) {
  if (errand === 'commission') return currentCommission().diff;
  return ERRANDS[errand].diff(demonById(sv.demonId).tier);
}

function coinAmount(tier) {
  return [0, rand(5, 9), rand(12, 18), rand(24, 34), rand(45, 60), rand(80, 100)][tier];
}

function runErrand(sv) {
  const d = demonById(sv.demonId);
  const vars = { name: bold(d) };
  if (sv.errand === 'commission') {
    const c = currentCommission();
    if (!c || c.type !== 'errand') { sv.errand = null; return; }
  }
  const succeeded = Math.random() < errandChance(sv, errandDiff(sv, sv.errand));

  if (!succeeded) {
    if (sv.binding === 'uneasy' && Math.random() < 0.5) return twist(d);
    log(fill(pick(ERRAND_TEXT[sv.errand].fail), vars), 'bad');
    return;
  }

  switch (sv.errand) {
    case 'coin': {
      const amt = coinAmount(d.tier);
      state.dollars += amt;
      log(fill(pick(ERRAND_TEXT.coin.ok), { ...vars, amt }), 'good');
      break;
    }
    case 'pilfer': {
      const items = grantRandomIncense(d.tier + rand(0, 1), d.tier);
      log(fill(pick(ERRAND_TEXT.pilfer.ok), { ...vars, items }), 'good');
      break;
    }
    case 'gossip': {
      log(fill(pick(ERRAND_TEXT.gossip.ok), vars));
      if (!learnFragment(1, d.tier)) {
        state.log.shift();
        log(fill(pick(ERRAND_TEXT.gossip.none), vars));
      }
      break;
    }
    case 'spy': {
      const target = Math.min(5, d.tier + 1);
      log(fill(pick(ERRAND_TEXT.spy.ok), vars));
      if (!learnFragment(target, target) && !learnFragment(1, target)) {
        log('The notes contain nothing you did not already know.');
      }
      break;
    }
    case 'commission':
      completeCommission();
      break;
  }
}

function twist(d) {
  const t = pick(TWISTS);
  const vars = { name: bold(d) };
  if (t.effect === 'coin') {
    const amt = Math.min(state.dollars, rand(3, d.tier * 6));
    state.dollars -= amt;
    log(fill(t.text, { ...vars, amt }), 'bad');
  } else if (t.effect === 'hurt') {
    log(fill(t.text, vars) + ' (−1 health)', 'bad');
    hurt(1, `a fall arranged by ${d.name}`);
  } else if (t.effect === 'incense') {
    const owned = Object.keys(state.incense).filter(k => state.incense[k] > 0);
    if (!owned.length) return log(fill(TWISTS[3].text, vars), 'bad');
    const k = pick(owned);
    state.incense[k]--;
    log(fill(t.text, { ...vars, item: INCENSE[k].name.toLowerCase() }), 'bad');
  } else {
    log(fill(t.text, vars), 'bad');
  }
}

function dismiss(uid) {
  const sv = state.servants.find(s => s.uid === uid);
  if (!sv) return;
  state.servants = state.servants.filter(s => s !== sv);
  log(`You speak the Dismissal. ${bold(demonById(sv.demonId))} departs with a remark about your mother.`);
  render();
}

function expire(sv) {
  const d = demonById(sv.demonId);
  state.servants = state.servants.filter(s => s !== sv);
  if (sv.binding === 'firm') {
    log(`${bold(d)}’s term of service has worn thin. With a mocking bow, it unravels into smoke and is gone.`);
    return;
  }
  const dmg = sv.pentTier >= d.tier ? Math.ceil(d.tier / 2) : d.tier;
  log(`${bold(d)} has strained against its bonds too long. They snap — and it leaves you a parting gift. (−${dmg} health)`, 'bad');
  hurt(dmg, `ambushed by ${d.name}, whose bonds were left to fray`);
}

function endDay() {
  if (state.over || busy) return;
  log(`Night falls on day ${state.day}.`, 'info');
  for (const sv of [...state.servants]) {
    if (sv.errand) runErrand(sv);
    if (state.over) break;
  }
  if (!state.over) {
    for (const sv of [...state.servants]) {
      sv.patience--;
      if (sv.patience <= 0) expire(sv);
      if (state.over) break;
    }
  }
  if (!state.over) {
    state.health = Math.min(MAX_HEALTH, state.health + 1);
    state.day++;
    state.actions = ACTIONS_PER_DAY;
    log(`Day ${state.day} dawns.`, 'info');
  }
  manifestation = null;
  render();
}

// ---------- commissions

const currentCommission = () => COMMISSIONS[state.commission] || null;

function checkBindCommission(d) {
  const c = currentCommission();
  if (c && c.type === 'bind' && d.tier >= c.tier) completeCommission();
}

function completeCommission() {
  const c = currentCommission();
  state.dollars += c.pay;
  state.commission++;
  state.servants.forEach(s => { if (s.errand === 'commission') s.errand = null; });
  log(`<b>Commission complete: ${c.title}.</b> ${c.done} (+${c.rep} reputation, +$${c.pay})`, 'good');
  gainRep(c.rep);
  if (c.win) state.over = 'won';
}

// ---------- the city

const districtById = id => DISTRICTS.find(d => d.id === id);

function currentEncounter() {
  if (!state.encounter) return null;
  const dist = districtById(state.encounter.district);
  const enc = dist && dist.encounters.find(e => e.id === state.encounter.id);
  return enc ? { dist, enc } : null;
}

function visitBlocker(dist) {
  if (state.over) return 'The game is over.';
  if (dist.rank > rankIndex()) return `Only a ${RANKS[dist.rank].name} or higher has business here.`;
  if (state.encounter) return 'Finish what you started first.';
  if (state.actions < 1) return 'It is too late in the day. End the day and rest.';
  return null;
}

function visitDistrict(id) {
  const dist = districtById(id);
  if (!dist || visitBlocker(dist)) return;
  const available = dist.encounters.filter(e => !(e.once && state.doneEncounters.includes(`${id}:${e.id}`)));
  const fresh = available.filter(e => e.id !== state.lastEncounter[id]);
  const enc = pick(fresh.length ? fresh : available);
  state.actions--;
  state.encounter = { district: id, id: enc.id };
  state.lastEncounter[id] = enc.id;
  state.encounterResult = null;
  log(`You spend an hour in ${dist.name}.`);
  render();
}

function choiceBlocker(ch) {
  const r = ch.req || {};
  if (ch.cost && state.dollars < ch.cost) return `You need $${ch.cost}.`;
  if (r.dollars && state.dollars < r.dollars) return `You need $${r.dollars}.`;
  if (r.rank && rankIndex() < r.rank) return `Requires the rank of ${RANKS[r.rank].name}.`;
  if (r.servantTier && !state.servants.some(sv => demonById(sv.demonId).tier >= r.servantTier)) {
    return `Requires a bound ${TIER_NAMES[r.servantTier]} or stronger.`;
  }
  if (r.language && !state.languages.includes(r.language)) return `Requires ${LANGUAGES[r.language].name}.`;
  return null;
}

function chooseOption(i) {
  const cur = currentEncounter();
  if (!cur || state.over) return;
  const { dist, enc } = cur;
  const ch = enc.choices[i];
  if (!ch || choiceBlocker(ch)) return;

  if (ch.cost) state.dollars -= ch.cost;
  let roll = Math.random() * ch.outcomes.reduce((a, o) => a + o.w, 0);
  const out = ch.outcomes.find(o => (roll -= o.w) < 0) || ch.outcomes[ch.outcomes.length - 1];

  state.encounter = null;
  if (enc.once) state.doneEncounters.push(`${dist.id}:${enc.id}`);
  // log the outcome first so any lore it reveals appears after it in the chronicle
  const entry = log(`<b>${enc.title}.</b> ${out.text}`);
  const { notes, frags } = applyEffects(out.fx, `lost in ${dist.name}`);
  if (ch.cost) notes.unshift(`−$${ch.cost}`);
  if (notes.length) entry.html += ` <span class="fx">(${notes.join(', ')})</span>`;
  const bad = notes.some(n => n.startsWith('−'));
  const good = notes.some(n => !n.startsWith('−'));
  entry.kind = good && !bad ? 'good' : bad && !good ? 'bad' : '';
  state.encounterResult = { district: dist.id, title: enc.title, choice: ch.label, text: out.text, notes, frags: frags.map(f => f.id) };
  render();
}

function applyEffects(fx, cause) {
  const notes = [];
  const frags = [];
  const money = n => (n > 0 ? `+$${n}` : `−$${-n}`);

  if (fx.dollars !== undefined) {
    const n = Array.isArray(fx.dollars) ? rand(...fx.dollars) : fx.dollars;
    const before = state.dollars;
    state.dollars = Math.max(0, state.dollars + n);
    if (state.dollars !== before) notes.push(money(state.dollars - before));
  }
  if (fx.robbed) {
    const n = Math.min(state.dollars, rand(...fx.robbed));
    state.dollars -= n;
    if (n) notes.push(money(-n));
  }
  if (fx.incense) {
    for (const [k, n] of Object.entries(fx.incense)) {
      state.incense[k] = (state.incense[k] || 0) + n;
      notes.push(`+${n} ${INCENSE[k].name.toLowerCase()}`);
    }
  }
  if (fx.incenseRandom) notes.push(`+${grantRandomIncense(...fx.incenseRandom)}`);

  const learn = (lo, hi, demonId) => {
    const f = learnFragment(clamp(lo, 1, 5), clamp(hi, 1, 5), demonId);
    if (f) frags.push(f);
    return f;
  };
  let wantedLore = false;
  if (fx.rune) {
    if (!state.runes.includes(fx.rune)) {
      state.runes.push(fx.rune);
      notes.push(`learned the ${RUNES[fx.rune].name} rune`);
    } else {
      wantedLore = true;
      learn(1, rankTier() + 1);
    }
  }
  if (fx.loreDemon) {
    wantedLore = true;
    const d = demonById(fx.loreDemon);
    if (!learn(d.tier, d.tier, d.id)) learn(d.tier, d.tier);
  }
  if (fx.lore) {
    wantedLore = true;
    const [lo, hi] = typeof fx.lore === 'function' ? fx.lore(rankTier()) : fx.lore;
    for (let i = 0; i < (fx.loreCount || 1); i++) learn(lo, hi);
  }
  if (frags.length) notes.push(`new lore: ${frags.map(f => f.demon.name).join(', ')}`);
  else if (wantedLore) notes.push('nothing you didn’t already know');

  if (fx.rep) {
    notes.push(`+${fx.rep} reputation`);
    gainRep(fx.rep);
  }
  if (fx.health > 0) {
    const before = state.health;
    state.health = Math.min(MAX_HEALTH, state.health + fx.health);
    if (state.health > before) notes.push(`+${state.health - before} health`);
  } else if (fx.health < 0) {
    notes.push(`−${-fx.health} health`);
    hurt(-fx.health, cause);
  }
  return { notes, frags };
}

// ---------- market

function buy(kind, id, qty = 1) {
  const r = rankIndex();
  let price, rank, apply;
  switch (kind) {
    case 'incense': ({ price, rank } = INCENSE[id]); price *= qty;
      apply = () => { state.incense[id] = (state.incense[id] || 0) + qty; }; break;
    case 'circle': ({ price, rank } = circleById(id));
      apply = () => state.circles.push(id); break;
    case 'pentacle': ({ price, rank } = pentacleById(id));
      apply = () => state.pentacles.push(id); break;
    case 'rune': ({ price, rank } = RUNES[id]);
      apply = () => state.runes.push(id); break;
    case 'language': ({ price, rank } = LANGUAGES[id]);
      apply = () => state.languages.push(id); break;
    case 'grimoire': price = grimoirePrice(); rank = 0;
      apply = () => {
        if (!learnFragment(1, Math.min(5, rankTier() + 1))) {
          log('The grimoire turns out to be a cookbook. The bookseller refunds you, grudgingly.');
          state.dollars += price;
        }
      }; break;
    case 'poultice': price = 6; rank = 0;
      apply = () => { state.health = Math.min(MAX_HEALTH, state.health + 2); }; break;
    default: return;
  }
  if (rank > r || state.dollars < price || state.over) return;
  state.dollars -= price;
  apply();
  render();
}

const grimoirePrice = () => 10 + 5 * rankTier();

// ---------- rendering

function render() {
  renderStats();
  renderTabs();
  renderView();
  renderLog();
  renderOverlay();
  save();
}

function renderStats() {
  const hearts = Array.from({ length: MAX_HEALTH }, (_, i) => `<span class="heart ${i < state.health ? 'full' : ''}"></span>`).join('');
  $('#stats').innerHTML = `
    <div class="stat"><span class="k">Day</span><span class="v">${state.day} · ${HOUR_NAMES[state.actions]}</span></div>
    <div class="stat"><span class="k">Hours left</span><span class="v">${state.actions}</span></div>
    <div class="stat"><span class="k">Dollars</span><span class="v">$${state.dollars}</span></div>
    <div class="stat"><span class="k">Health</span><span class="v hearts" title="${state.health}/${MAX_HEALTH}">${hearts}</span></div>
    <div class="stat"><span class="k">Rank</span><span class="v">${RANKS[rankIndex()].name} <small>(${state.rep} rep)</small></span></div>
    <button class="primary" data-action="end-day" ${state.over || busy ? 'disabled' : ''}>End day</button>`;
}

function renderTabs() {
  const badges = {
    journal: state.newLore ? `<span class="badge">${state.newLore}</span>` : '',
    servants: state.servants.length ? `<span class="badge quiet">${state.servants.length}</span>` : '',
    city: state.encounter ? '<span class="badge alert">!</span>' : '',
  };
  document.querySelectorAll('#tabs [data-tab]').forEach(b => {
    const t = b.dataset.tab;
    b.classList.toggle('active', t === currentTab);
    b.innerHTML = b.dataset.label + (badges[t] || '');
  });
}

function renderView() {
  const views = { chamber: viewChamber, city: viewCity, journal: viewJournal, servants: viewServants, market: viewMarket, cityhall: viewCityHall };
  $('#view').innerHTML = views[currentTab]();
}

function renderLog() {
  $('#log').innerHTML = `<h2>Chronicle</h2>` + state.log.map(e =>
    `<p class="entry ${e.kind}"><span class="day">D${e.day}</span>${e.html}</p>`).join('');
}

// ---- chamber

function chip(kind, value, label, on, disabled = false) {
  return `<button class="chip ${on ? 'on' : ''}" data-pick="${kind}" data-value="${value}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function ctl(title, body) {
  return `<div class="ctl"><h3>${title}</h3><div class="chips">${body}</div></div>`;
}

function viewChamber() {
  const s = state.sel;
  const blocker = summonBlocker();
  const d = s.name ? demonById(s.name) : null;
  return `
  <div class="chamber">
    <div class="stage-col">
      <div class="stage">${chamberSVG()}</div>
      ${manifestHTML()}
    </div>
    <div class="controls panel">
      ${ctl('True name', knownDemons().map(k => chip('name', k.id, `${k.name}<small>${TIER_NAMES[k.tier]}</small>`, s.name === k.id)).join(''))}
      ${ctl('Tongue', state.languages.map(l => chip('language', l, LANGUAGES[l].name, s.language === l)).join(''))}
      ${ctl('Summoning circle', CIRCLES.filter(c => state.circles.includes(c.id)).map(c =>
        chip('circle', c.id, `${c.name}<small>holds up to ${TIER_NAMES[c.tier]}</small>`, s.circle === c.id)).join(''))}
      ${ctl('Your pentacle', PENTACLES.filter(p => state.pentacles.includes(p.id)).map(p =>
        chip('pentacle', p.id, `${p.name}<small>shields from ${TIER_NAMES[p.tier]}</small>`, s.pentacle === p.id)).join(''))}
      ${ctl(`Runes <small>${s.runes.length}/${MAX_RUNES}</small>`, state.runes.map(r =>
        chip('rune', r, `<span class="glyph">${RUNES[r].glyph}</span>${RUNES[r].name}`, s.runes.includes(r),
          !s.runes.includes(r) && s.runes.length >= MAX_RUNES)).join(''))}
      ${ctl('Incense', Object.keys(INCENSE).filter(k => state.incense[k] !== undefined).map(k =>
        chip('incense', k, `${INCENSE[k].name}<small>×${state.incense[k]}</small>`, s.incense === k, state.incense[k] < 1)).join(''))}
      <button class="primary big" data-action="summon" ${blocker || busy ? 'disabled' : ''}>Begin the summoning <small>(1 hour)</small></button>
      <p class="hint">${busy ? 'The air grows thick…' : blocker || 'Speak carefully.'}</p>
      ${d ? `<div class="notes"><h3>Your notes on ${d.name}</h3>${demonNotes(d)}</div>` : ''}
    </div>
  </div>`;
}

function manifestHTML() {
  if (busy) return `<div class="manifest pending"><p>You begin the incantation. The candles gutter; the chalk lines shiver…</p></div>`;
  if (!manifestation) return `<div class="manifest empty"><p>Choose a true name, a tongue, a circle, runes and incense. Get them right and the spirit is yours. Get them wrong and you had better trust your pentacle.</p></div>`;
  const m = manifestation;
  const labels = { firm: 'Bound firmly', uneasy: 'Bound uneasily', broken: 'Broke free', silence: 'No answer' };
  return `<div class="manifest outcome-${m.outcome}">
    <div class="m-head"><h3>${m.demon.name} <small>${TIER_NAMES[m.demon.tier]}</small></h3><span class="tag">${labels[m.outcome]}</span></div>
    ${m.lines.map(l => `<p>${l}</p>`).join('')}
    ${m.greet ? `<blockquote>${m.greet}</blockquote><p class="footnote">${m.footnote}</p>` : ''}
  </div>`;
}

function polar(cx, cy, r, deg) {
  const a = deg * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function starPath(cx, cy, r) {
  const pts = [0, 2, 4, 1, 3].map(i => polar(cx, cy, r, -90 + i * 72));
  return 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join(' L') + ' Z';
}

const RING_STYLES = {
  1: { color: '#e9e3d3', rings: [[0, 2.5, '7 4']] },
  2: { color: '#d8dde0', rings: [[0, 4], [-14, 3, null, '#7d7f84']], dots: -7 },
  3: { color: '#c9d2dc', rings: [[0, 2.5], [-18, 2.5]], band: -9 },
  4: { color: '#c9d2dc', rings: [[0, 2.5], [-10, 5, null, '#9c4a2f'], [-20, 2.5]], band: -30 },
  5: { color: '#9a7bff', rings: [[0, 3], [-12, 3], [-24, 3]], band: -36, glow: true },
};

const BAND_GLYPHS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';

function ringGroup(tier, cx, cy, r, idPrefix) {
  const st = RING_STYLES[tier];
  const out = [`<g class="${st.glow ? 'glow' : ''}">`];
  st.rings.forEach(([off, w, dash, color]) => {
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r + off}" fill="none" stroke="${color || st.color}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`);
  });
  if (st.dots) {
    for (let i = 0; i < 30; i++) {
      const [x, y] = polar(cx, cy, r + st.dots, i * 12);
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${st.color}"/>`);
    }
  }
  if (st.band) {
    const rb = r + st.band;
    const len = (2 * Math.PI * rb).toFixed(0);
    out.push(`<path id="${idPrefix}-band" d="M ${cx - rb} ${cy} a ${rb} ${rb} 0 1 1 ${2 * rb} 0 a ${rb} ${rb} 0 1 1 ${-2 * rb} 0" fill="none"/>`);
    out.push(`<text class="band" fill="${st.color}"><textPath href="#${idPrefix}-band" textLength="${len}" lengthAdjust="spacing">${BAND_GLYPHS.repeat(2)}</textPath></text>`);
  }
  out.push(`<path d="${starPath(cx, cy, r - (st.rings.length > 1 ? 22 : 8))}" fill="none" stroke="${st.color}" stroke-width="1.5" opacity="0.8"/>`);
  out.push('</g>');
  return out.join('');
}

function chamberSVG() {
  const s = state.sel;
  const circle = circleById(s.circle);
  const pent = pentacleById(s.pentacle);
  const [cx, cy, r] = [220, 200, 160];
  const [px, py, pr] = [530, 190, 70];
  const cls = ['chamber-svg', busy ? 'summoning' : '', manifestation ? `m-${manifestation.outcome}` : ''].join(' ');

  const slots = [-90, 30, 150].map((deg, i) => {
    const [x, y] = polar(cx, cy, r, deg);
    const rune = s.runes[i];
    return rune
      ? `<g class="rune-slot"><circle cx="${x}" cy="${y}" r="19" fill="#1b1612" stroke="#c9a24a" stroke-width="2"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="rune-glyph">${RUNES[rune].glyph}</text></g>`
      : `<circle cx="${x}" cy="${y}" r="15" fill="#15110e" stroke="#5a4a3a" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  }).join('');

  const inc = s.incense ? INCENSE[s.incense] : null;
  const smoke = inc ? [0, 1, 2].map(i =>
    `<path class="smoke s${i}" d="M ${425 + i * 8} 340 q -12 -25 0 -50 q 12 -25 0 -50" stroke="${inc.color}" fill="none" stroke-width="3" stroke-linecap="round"/>`).join('') : '';

  const name = s.name ? demonById(s.name).name : '';

  return `<svg viewBox="0 0 640 400" class="${cls}" role="img" aria-label="Summoning chamber">
    <defs>
      <radialGradient id="ess-grad">
        <stop offset="0%" style="stop-color:var(--ess)" stop-opacity="0.95"/>
        <stop offset="60%" style="stop-color:var(--ess)" stop-opacity="0.35"/>
        <stop offset="100%" style="stop-color:var(--ess)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g class="spin" style="transform-origin:${cx}px ${cy}px">${ringGroup(circle.tier, cx, cy, r, 'c')}</g>
    ${slots}
    <circle class="essence" cx="${cx}" cy="${cy}" r="70" fill="url(#ess-grad)"/>
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="true-name">${name}</text>
    <text x="${cx}" y="390" text-anchor="middle" class="label">${circle.name}</text>

    <g>${ringGroup(pent.tier, px, py, pr, 'p')}</g>
    <circle cx="${px}" cy="${py - 6}" r="6" fill="#e9dfc9"/>
    <path d="M ${px} ${py} v 22 M ${px - 10} ${py + 8} h 20 M ${px} ${py + 22} l -7 12 M ${px} ${py + 22} l 7 12" stroke="#e9dfc9" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="${px}" y="${py + pr + 22}" text-anchor="middle" class="label">${pent.name}</text>

    <g class="brazier">
      <path d="M 410 340 Q 433 372 456 340 Z" fill="#3a2c20" stroke="#6b5440" stroke-width="1.5"/>
      <path d="M 420 362 l -8 18 M 446 362 l 8 18" stroke="#6b5440" stroke-width="2"/>
      ${smoke}
      <text x="433" y="${inc ? 395 : 395}" text-anchor="middle" class="label small">${inc ? inc.name : 'no incense'}</text>
    </g>
  </svg>`;
}

// ---- city

function viewCity() {
  const cur = currentEncounter();
  const dist = cur ? cur.dist : districtById(state.district) || DISTRICTS[0];
  return `
  <div class="city">
    <div class="stage map">${cityMapSVG(dist.id)}</div>
    <div class="panel district">${cur ? encounterHTML(cur) : districtHTML(dist)}</div>
  </div>`;
}

function dangerPips(n) {
  return `<span class="pips" title="Danger ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

function districtHTML(dist) {
  const blocker = visitBlocker(dist);
  const r = state.encounterResult && state.encounterResult.district === dist.id ? state.encounterResult : null;
  return `
    <div class="d-head"><h2>${dist.name}</h2><span class="tag">Danger ${dangerPips(dist.danger)}</span></div>
    <p>${dist.desc}</p>
    <button class="primary big" data-action="visit" data-value="${dist.id}" ${blocker ? 'disabled' : ''}>Go there <small>(1 hour)</small></button>
    <p class="hint">${blocker || 'Anything might happen. That is rather the point.'}</p>
    ${r ? `<div class="result">
      <h3>${r.title}</h3>
      <p class="muted small">You chose: ${r.choice}</p>
      <p>${r.text}</p>
      ${r.frags.map(id => FRAGMENTS.find(f => f.id === id)).map(f => `<p class="frag"><span class="src">${f.src}</span>“${f.text}”</p>`).join('')}
      ${r.notes.length ? `<p class="fx">${r.notes.join(' · ')}</p>` : ''}
    </div>` : ''}`;
}

function encounterHTML({ dist, enc }) {
  return `
    <div class="d-head"><h2>${enc.title}</h2><span class="tag">${dist.name}</span></div>
    <p>${enc.text}</p>
    <div class="choices">
      ${enc.choices.map((ch, i) => {
        const blocker = choiceBlocker(ch);
        return `<button class="choice" data-action="choose" data-value="${i}" ${blocker ? 'disabled' : ''}>
          <span>${ch.label}</span>${ch.cost && !ch.label.includes('$') ? `<small class="cost">$${ch.cost}</small>` : ''}
          ${blocker ? `<small class="why">${blocker}</small>` : ''}
        </button>`;
      }).join('')}
    </div>`;
}

function cityMapSVG(selectedId) {
  const grid = [];
  for (let x = 20; x < 480; x += 28) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="520"/>`);
  for (let y = 14; y < 520; y += 28) grid.push(`<line x1="0" y1="${y}" x2="480" y2="${y}"/>`);
  const shore = 'M 478 0 C 468 90, 482 170, 470 250 S 462 400, 492 520';

  const markers = DISTRICTS.map(d => {
    const locked = d.rank > rankIndex();
    const sel = d.id === selectedId;
    const pending = state.encounter && state.encounter.district === d.id;
    const labelY = d.y + 34;
    return `<g class="d-marker ${locked ? 'locked' : ''} ${sel ? 'sel' : ''} ${pending ? 'pending' : ''}" data-district="${d.id}" tabindex="0" role="button" aria-label="${d.name}">
      <circle class="halo" cx="${d.x}" cy="${d.y}" r="24"/>
      <circle class="dot" cx="${d.x}" cy="${d.y}" r="15"/>
      <text class="initial" x="${d.x}" y="${d.y + 5}" text-anchor="middle">${d.name.replace(/^The /, '')[0]}</text>
      <text class="name" x="${d.x}" y="${labelY}" text-anchor="middle">${d.name}</text>
      ${locked ? `<text class="lock" x="${d.x}" y="${labelY + 15}" text-anchor="middle">${RANKS[d.rank].name}</text>` : ''}
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 640 520" class="city-svg" role="img" aria-label="Map of Chicago">
    <g class="grid">${grid.join('')}</g>
    <path class="lake" d="${shore} L 640 520 L 640 0 Z"/>
    <path class="shore" d="${shore}"/>
    <g class="waves">
      ${[[530, 60], [600, 250], [540, 330], [610, 420], [520, 480], [610, 70]].map(([x, y]) =>
        `<path d="M ${x} ${y} q 8 -6 16 0 t 16 0"/>`).join('')}
    </g>
    <text class="lake-label" x="600" y="390" transform="rotate(90 600 390)" text-anchor="middle">LAKE MICHIGAN</text>
    <path class="river" d="M 474 176 L 332 178"/>
    <path class="river" d="M 332 178 C 316 130, 292 80, 250 0"/>
    <path class="river" d="M 332 178 C 336 240, 322 292, 292 322 C 262 352, 222 362, 120 368"/>
    <text class="river-label" x="410" y="168" text-anchor="middle">Chicago River</text>
    <text class="area-label" x="447" y="208" text-anchor="middle">THE LOOP</text>
    ${markers}
  </svg>`;
}

// ---- journal

function demonNotes(d) {
  const frags = d.lore.map((f, i) => state.lore.includes(`${d.id}-${i}`) ? f : null).filter(Boolean);
  const obs = state.observations[d.id] || [];
  return `
    ${frags.map(f => `<p class="frag"><span class="src">${f.src}</span>“${f.text}”</p>`).join('')}
    ${obs.length ? `<h4>Observed in the chamber</h4><ul class="obs">${obs.map(o => `<li>${o}</li>`).join('')}</ul>` : ''}`;
}

function viewJournal() {
  const known = knownDemons().sort((a, b) => a.tier - b.tier);
  const unknown = DEMONS.length - known.length;
  const readCount = state.lore.length;
  return `
  <div class="journal">
    <div class="panel row">
      <div>
        <h2>The Journal</h2>
        <p>Lore fragments read: ${readCount} of ${FRAGMENTS.length}. ${unknown ? `${unknown} spirit${unknown > 1 ? 's' : ''} remain unnamed to you.` : 'You know every name worth knowing.'}</p>
      </div>
      <button class="primary" data-action="study" ${state.actions < 1 || state.over ? 'disabled' : ''}>Study in the library <small>(1 hour)</small></button>
    </div>
    <div class="cards">
      ${known.map(d => `
        <article class="panel card tier-${d.tier}">
          <header><h3>${d.name}</h3><span class="tag">${TIER_NAMES[d.tier]}</span></header>
          ${demonNotes(d)}
          <button class="ghost" data-action="prepare" data-value="${d.id}">Prepare a summoning</button>
        </article>`).join('')}
    </div>
  </div>`;
}

// ---- servants

function viewServants() {
  const cap = `<p>You may hold ${maxServants()} spirit${maxServants() > 1 ? 's' : ''} at your rank. Errands are carried out overnight, and repeat each night until changed.</p>`;
  if (!state.servants.length) {
    return `<div class="panel"><h2>Your Servants</h2>${cap}<p class="muted">No spirit currently serves you. The chamber awaits.</p></div>`;
  }
  const c = currentCommission();
  return `<div class="panel"><h2>Your Servants</h2>${cap}</div>
  <div class="cards">
    ${state.servants.map(sv => {
      const d = demonById(sv.demonId);
      const opts = Object.entries(ERRANDS).map(([k, e]) =>
        `<option value="${k}" ${sv.errand === k ? 'selected' : ''}>${e.name} (${Math.round(errandChance(sv, e.diff(d.tier)) * 100)}%)</option>`);
      if (c && c.type === 'errand') {
        opts.push(`<option value="commission" ${sv.errand === 'commission' ? 'selected' : ''}>City Hall: ${c.title} (${Math.round(errandChance(sv, c.diff) * 100)}%)</option>`);
      }
      const desc = sv.errand && sv.errand !== 'commission' ? ERRANDS[sv.errand].desc : sv.errand === 'commission' ? c.text : '';
      return `<article class="panel card servant ${sv.binding}">
        <header><h3>${d.name}</h3><span class="tag">${TIER_NAMES[d.tier]} · ${sv.binding === 'firm' ? 'firmly bound' : 'uneasily bound'}</span></header>
        <p class="muted">Appears as ${d.form}.</p>
        <p class="${sv.patience <= 1 ? 'warn' : ''}">${sv.patience <= 1
          ? (sv.binding === 'firm' ? 'Its service ends tonight.' : 'Its bonds will snap tonight unless you dismiss it!')
          : `Will serve ${sv.patience} more nights.`}</p>
        <label>Tonight’s errand
          <select data-errand="${sv.uid}">
            <option value="">Idle in its circle</option>
            ${opts.join('')}
          </select>
        </label>
        ${desc ? `<p class="muted small">${desc}</p>` : ''}
        <button class="ghost" data-action="dismiss" data-value="${sv.uid}">Speak the Dismissal</button>
      </article>`;
    }).join('')}
  </div>`;
}

// ---- market

function shopRow(name, desc, price, rank, owned, buyAttrs, extra = '') {
  const r = rankIndex();
  let btn;
  if (owned) btn = `<span class="owned">Owned</span>`;
  else if (rank > r) btn = `<span class="locked">${RANKS[rank].name}</span>`;
  else btn = `<button data-buy="${buyAttrs}" ${state.dollars < price ? 'disabled' : ''}>Buy · $${price}</button>${extra}`;
  return `<div class="shop-row ${rank > r ? 'is-locked' : ''}"><div><b>${name}</b><p class="muted small">${desc}</p></div><div class="buy">${btn}</div></div>`;
}

function viewMarket() {
  const incense = Object.entries(INCENSE).map(([k, i]) => shopRow(
    `${i.name} <small>(own ${state.incense[k] || 0})</small>`, 'Burned to draw and soothe a spirit.', i.price, i.rank, false, `incense:${k}:1`,
    i.rank <= rankIndex() ? `<button data-buy="incense:${k}:5" ${state.dollars < i.price * 5 ? 'disabled' : ''}>×5</button>` : '')).join('');
  const circles = CIRCLES.filter(c => c.price).map(c => shopRow(`${c.name} <small>holds up to ${TIER_NAMES[c.tier]}</small>`, c.desc, c.price, c.rank, state.circles.includes(c.id), `circle:${c.id}`)).join('');
  const pents = PENTACLES.filter(p => p.price).map(p => shopRow(`${p.name} <small>shields from ${TIER_NAMES[p.tier]}</small>`, p.desc, p.price, p.rank, state.pentacles.includes(p.id), `pentacle:${p.id}`)).join('');
  const runes = Object.entries(RUNES).filter(([, r]) => r.price).map(([k, r]) => shopRow(`<span class="glyph">${r.glyph}</span> Primer of the ${r.name}`, 'Teaches you to inscribe the rune.', r.price, r.rank, state.runes.includes(k), `rune:${k}`)).join('');
  const langs = Object.entries(LANGUAGES).filter(([, l]) => l.price).map(([k, l]) => shopRow(`Lessons in ${l.name}`, l.desc, l.price, l.rank, state.languages.includes(k), `language:${k}`)).join('');
  return `
  <div class="market">
    <section class="panel"><h2>Hobb &amp; Daughters, Maxwell Street</h2><p class="muted">Incense, candles, and no questions.</p>${incense}</section>
    <section class="panel"><h2>A Dearborn Street Bookseller</h2>
      ${shopRow('A battered grimoire', 'May contain lore on spirits up to one rank above your own. May contain recipes.', grimoirePrice(), 0, false, 'grimoire:x')}
      ${runes}${langs}
    </section>
    <section class="panel"><h2>The South Branch Foundries</h2><p class="muted">Circles for your spirits; pentacles for yourself.</p>${circles}${pents}</section>
    <section class="panel"><h2>The Apothecary</h2>
      ${shopRow('Poultice of comfrey and gunpowder', 'Restores 2 health. Smells alarming.', 6, 0, false, 'poultice:x')}
    </section>
  </div>`;
}

// ---- city hall

function viewCityHall() {
  const c = currentCommission();
  const r = rankIndex();
  const ladder = RANKS.map((k, i) => `<li class="${i <= r ? 'reached' : ''}">${k.name} <small>${k.rep} rep</small></li>`).join('');
  const done = COMMISSIONS.slice(0, state.commission).map(x => `<li><b>${x.title}</b> — ${x.done}</li>`).join('');
  const req = c ? (c.type === 'bind'
    ? `Requirement: bind a spirit of class <b>${TIER_NAMES[c.tier]}</b> or greater.`
    : `Requirement: assign a servant to this errand from the Servants tab. Difficulty ${c.diff}.`) : '';
  return `
  <div class="cityhall">
    <section class="panel">
      <h2>City Hall</h2>
      ${c ? `<h3>${c.title}</h3><p>${c.text}</p><p>${req}</p><p class="muted">Reward: ${c.rep} reputation, $${c.pay}.</p>`
          : '<p>City Hall has nothing further to ask of you. It is, frankly, a little afraid of you.</p>'}
    </section>
    <section class="panel"><h2>Ranks</h2><ol class="ladder">${ladder}</ol></section>
    ${done ? `<section class="panel"><h2>Completed commissions</h2><ul class="done">${done}</ul></section>` : ''}
  </div>`;
}

// ---- overlay

function renderOverlay() {
  const o = $('#overlay');
  let html = '';
  if (!state.seenIntro) {
    html = `<h1>Chalk &amp; Brimstone</h1>
      <p>Chicago, 1893. The White City is rising on the lakefront for the World’s Fair, the magicians of the Machine run City Hall, and everyone else knows better than to ask questions.</p>
      <p>Your master, the venerable Mr. Ambrose Thwaite, has died — of natural causes, says the coroner, though the scorch marks suggest otherwise. He has left you a cramped workshop above a saloon on Clark Street, thirty dollars, a box of chalk, and a notebook.</p>
      <p>City Hall has taken notice. Bind a spirit, and the Machine may have work for you. Fail, and — well. Mr. Thwaite was an expert, and look what happened to him.</p>
      <ul>
        <li>Learn spirits’ <b>true names</b> and what binds them in the <b>Journal</b>.</li>
        <li>In the <b>Chamber</b>, combine the right name, tongue, circle, runes and incense.</li>
        <li>Bound spirits run <b>errands</b> overnight: coin, stolen incense, secrets.</li>
        <li>Complete <b>City Hall</b> commissions to rise through the Machine and unlock stronger circles, rarer incense and older tongues.</li>
        <li>A failed binding sets the spirit loose. Only your <b>pentacle</b> stands between you and it.</li>
      </ul>
      <button class="primary big" data-action="close-intro">Pick up the chalk</button>`;
  } else if (state.over === 'dead') {
    html = `<h1>The Chalk Is Swept Away</h1>
      <p>On day ${state.day}, you were ${state.deathCause}.</p>
      <p>City Hall sends a clerk to inventory your workshop. He finds a scorched pair of shoes and a journal, which he files under <i>Cautionary</i>.</p>
      <button class="primary big" data-action="restart">Begin anew</button>`;
  } else if (state.over === 'won') {
    html = `<h1>The Deep One Is Bound</h1>
      <p>On day ${state.day}, Shem-Ashara rose from beneath Lake Michigan and knelt — after a fashion — within your obsidian rings.</p>
      <p>You are, by any measure, the most powerful magician in Chicago. Which is, of course, precisely when the trouble starts.</p>
      <button class="primary big" data-action="restart">Begin anew</button>
      <button class="ghost" data-action="close-overlay">Admire your handiwork</button>`;
  }
  o.hidden = !html || state.dismissedOverlay === state.over;
  o.innerHTML = html ? `<div class="dialog">${html}</div>` : '';
}

// ---------- input

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action],[data-pick],[data-tab],[data-buy],[data-district]');
  if (!el || el.disabled) return;

  if (el.dataset.district) {
    state.district = el.dataset.district;
    render();
    return;
  }

  if (el.dataset.tab) {
    currentTab = el.dataset.tab;
    if (currentTab === 'journal') state.newLore = 0;
    render();
    return;
  }

  if (el.dataset.buy) {
    const [kind, id, qty] = el.dataset.buy.split(':');
    buy(kind, id, Number(qty) || 1);
    return;
  }

  if (el.dataset.pick) {
    if (busy) return;
    const s = state.sel;
    const v = el.dataset.value;
    switch (el.dataset.pick) {
      case 'rune':
        if (s.runes.includes(v)) s.runes = s.runes.filter(r => r !== v);
        else if (s.runes.length < MAX_RUNES) s.runes.push(v);
        break;
      case 'incense': s.incense = s.incense === v ? null : v; break;
      default: s[el.dataset.pick] = v;
    }
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'summon': beginSummon(); break;
    case 'end-day': endDay(); break;
    case 'study': study(); break;
    case 'visit': visitDistrict(el.dataset.value); break;
    case 'choose': chooseOption(Number(el.dataset.value)); break;
    case 'dismiss': dismiss(Number(el.dataset.value)); break;
    case 'prepare':
      state.sel.name = el.dataset.value;
      currentTab = 'chamber';
      render();
      break;
    case 'close-intro': state.seenIntro = true; render(); break;
    case 'close-overlay': state.dismissedOverlay = state.over; render(); break;
    case 'restart': restart(false); break;
    case 'new-game':
      if (confirm('Abandon this magician and start a new game?')) restart(true);
      break;
  }
});

// map markers are SVG groups, so give them button-like keyboard behavior
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-district]')) {
    e.preventDefault();
    e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});

document.addEventListener('change', e => {
  const uid = e.target.dataset.errand;
  if (!uid) return;
  const sv = state.servants.find(s => s.uid === Number(uid));
  if (sv) sv.errand = e.target.value || null;
  render();
});

function restart(showIntro) {
  state = newState();
  state.seenIntro = !showIntro;
  manifestation = null;
  currentTab = 'chamber';
  log('You unlock the door of Mr. Thwaite’s workshop. It smells of chalk and something burnt.', 'info');
  render();
}

// ---------- boot

state = load();
if (!state) restart(true);
else render();
