'use strict';

const SAVE_KEY = 'chalk-and-brimstone-v3';
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
    circles: ['chalk'], pentacles: ['chalk'], runes: [...START_RUNES],
    incense: { rosemary: 2, cedar: 1, frankincense: 1 },
    lore: ['nibbet-0'],
    newLore: 1,
    facts: {},  // demon id -> facts observed in the chamber (lore facts are derived from state.lore)
    met: [],    // spirits that have appeared in your circle, even ones you never read about
    servants: [],
    nextUid: 1,
    commission: 0,
    log: [],
    over: null, // 'dead' | 'won'
    deathCause: '',
    seenIntro: false,
    sel: { name: 'nibbet', syllables: [], clause: 'service', circle: 'chalk', pentacle: 'chalk', runes: [], incense: null, overreach: false, brace: [] },
    familiarOut: { own: 0, ithzar: 0 },  // day each familiar is back from bracing a circle
    clauses: ['service'],   // binding clauses learned
    vessels: {},            // vessel type -> { cap, spirit } for vessels you own
    familiar: null,         // demon id of your familiar
    district: 'maxwell',    // district selected on the city map
    encounter: null,        // { district, id } street encounter awaiting a choice
    lastResult: null,       // what happened on the last action in the city
    lastStreet: {},         // district id -> last street encounter, to avoid immediate repeats
    used: {},               // action key -> day last used (for once and cooldown)
    events: {},             // event id -> { stage, since, done }
    flags: {},              // story flag -> day it was set
    standing: { machine: 0, union: 0, suspicion: 0, trust: 0 },  // trust: Ithzar's
    ithzar: { joined: false, heard: {}, asideDay: {}, warned: false, claims: {}, favor: null, favorDay: -99, askDay: null, awayDay: null },
  };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = Object.assign(newState(), JSON.parse(raw));
    // fill in nested fields added since the save was made
    saved.standing = { ...newState().standing, ...saved.standing };
    saved.ithzar = { ...newState().ithzar, ...saved.ithzar };
    saved.sel = { ...newState().sel, ...saved.sel };
    return saved;
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

// ---------- bound spirits: vessels and the familiar

const vesselTier = type => {
  const v = state.vessels[type];
  return v && v.spirit ? demonById(v.spirit).tier : 0;
};
// Ithzar is with you today: it has joined you and isn't out (its first term: it comes and goes as it pleases).
const ithzarHere = () => state.ithzar.joined && state.ithzar.awayDay !== state.day && !familiarResting('ithzar');
const familiarTier = () => Math.max(ownFamiliar() ? ownFamiliar().tier : 0, ithzarHere() ? ITHZAR.tier : 0);
// whoever speaks up with warnings: Ithzar when it's with you, otherwise your own familiar
const familiarVoice = () => (ithzarHere() ? ITHZAR.name : ownFamiliar() ? ownFamiliar().name : '');
const maxActions = () => ACTIONS_PER_DAY + (vesselTier('watch') ? watchHours(vesselTier('watch')) : 0) + (familiarTier() >= 5 ? 1 : 0);

// ---------- Ithzar (content in js/ithzar.js)

// Ithzar is around to talk from the day you meet it. Once you free it, it vanishes until it comes back
// with its terms; refuse twice and it's gone for good. Once it has joined you, it's around unless it's out.
const ithzarPresent = () => (state.ithzar.joined ? ithzarHere()
  : state.flags['met-ithzar'] !== undefined && state.flags['ithzar-freed'] === undefined && state.flags['ithzar-gone'] === undefined);
// chapter 3: you've agreed to break Cornelia's binding and haven't yet
const leashActive = () => state.flags['leash-agreed'] !== undefined && state.flags['ithzar-freed'] === undefined;

// Picks from a pool of lines, avoiding repeats until the pool has been used up.
function pickFresh(key, pool) {
  const heard = state.ithzar.heard[key] || (state.ithzar.heard[key] = []);
  let fresh = pool.map((_, i) => i).filter(i => !heard.includes(i));
  if (!fresh.length) {
    heard.length = 0;
    fresh = pool.map((_, i) => i);
  }
  const i = pick(fresh);
  heard.push(i);
  return pool[i];
}

// An aside is { lines: [{ name, text }], note }: a remark or an exchange, shown under a result and in the chronicle.
function ithzarLine(key, label = ITHZAR.name) {
  const pool = ITHZAR_LINES[key];
  if (!pool || !pool.length) return null;
  const line = pickFresh(key, pool);
  return typeof line === 'string'
    ? { lines: [{ name: label, text: line }] }
    : { lines: [{ name: label, text: line.text }], note: line.note };
}

function banter(familiar) {
  const key = BANTER[familiar.id] ? familiar.id : `class:${familiar.tier}`;
  const exchange = pickFresh(`banter:${key}`, BANTER[key]);
  return { lines: exchange.map(([who, text]) => ({ name: who === 'I' ? ITHZAR.name : familiar.name, text })) };
}

function summonAside(m) {
  const braced = m.overreach && m.overreach.bracers.includes('ithzar');
  if (!(ithzarPresent() || braced) || Math.random() > (state.ithzar.joined ? 0.7 : 0.5)) return null;
  const key = m.overreach ? `summon:overreach-${m.overreach.held ? 'held' : 'failed'}` : m.accident ? 'summon:accident' : `summon:${m.outcome}`;
  return ithzarLine(key,
    state.ithzar.joined ? ITHZAR.name : `${ITHZAR.name}, from the chimney`);
}

// After a city action Ithzar may remark on the district, or trade words with your familiar.
// At most once per district per day.
function cityAside(dist) {
  if (!ithzarPresent() || state.ithzar.asideDay[dist.id] === state.day) return null;
  const fam = ownFamiliar();
  let aside = null;
  if (fam && Math.random() < 0.25) aside = banter(fam);
  else if (Math.random() < 0.3) aside = ithzarLine(`city:${dist.id}`);
  if (aside) state.ithzar.asideDay[dist.id] = state.day;
  return aside;
}

function asideHTML(a) {
  return `<div class="aside">${a.lines.map(l => `<p><b>${l.name}:</b> ${l.text}</p>`).join('')}${a.note ? `<p class="footnote">${a.note}</p>` : ''}</div>`;
}

function logAside(a) {
  log(a.lines.map(l => `<b>${l.name}:</b> ${l.text}`).join(' ') + (a.note ? ` <span class="note">${a.note}</span>` : ''), 'aside');
}

// Each morning: Ithzar may be out for the day; otherwise a warning if the police are getting close,
// or a note on its doings.
function ithzarDawn() {
  if (state.ithzar.joined && Math.random() < 1 / 7) {
    state.ithzar.awayDay = state.day;
    log(pickFresh('away', ITHZAR_LINES.away), 'aside');
    return;
  }
  if (!ithzarPresent()) return;
  const crackdown = state.events.crackdown && !state.events.crackdown.done;
  if (state.standing.suspicion < 4) state.ithzar.warned = false;
  if (state.standing.trust >= 3 && state.standing.suspicion >= 4 && !crackdown && !state.ithzar.warned) {
    state.ithzar.warned = true;
    log(`<b>${ITHZAR.name}:</b> "Cornelia dined with the Mayor’s inspectors last night, and your name came up. I would tidy the workshop, if I were you."`, 'aside');
  } else if (Math.random() < 0.3) {
    log(pickFresh('dawn', ITHZAR_LINES.dawn), 'aside');
  }
}

// ---- Cornelia's binding (chapter 3): a small notebook sheet of its own

function corneliaSheet() {
  const B = CORNELIA_BINDING;
  const yes = new Set(), no = new Set(), notInc = new Set(), deduced = new Set();
  let incense = null, incDeduced = false;
  for (const [t, a] of (state.facts.cornelia || []).map(f => f.split(':'))) {
    if (t === 'rune') yes.add(a);
    if (t === 'norune') no.add(a);
    if (t === 'incense') incense = a;
    if (t === 'noincense') notInc.add(a);
  }
  const all = Object.keys(RUNES);
  if (yes.size === B.runes.length) all.forEach(r => { if (!yes.has(r) && !no.has(r)) { no.add(r); deduced.add(r); } });
  const open = all.filter(r => !yes.has(r) && !no.has(r));
  if (open.length && open.length === B.runes.length - yes.size) open.forEach(r => { yes.add(r); deduced.add(r); });
  if (!incense) {
    const left = Object.keys(INCENSE).filter(k => !notInc.has(k));
    if (left.length === 1) { incense = left[0]; incDeduced = true; }
  }
  return { yes: [...yes], no: [...no], deduced, incense, incDeduced, notInc: [...notInc] };
}

function corneliaFactText(fact) {
  const [t, a] = fact.split(':');
  if (t === 'rune') return `she used the ${RUNES[a].name} rune`;
  if (t === 'norune') return `she did not use the ${RUNES[a].name} rune`;
  if (t === 'incense') return `she burned ${INCENSE[a].name.toLowerCase()}`;
  return `she did not burn ${INCENSE[a].name.toLowerCase()}`;
}

// Records one thing about her binding you didn't know (kind 'norune': a rune she didn't use) and describes it.
function corneliaClue(kind) {
  const B = CORNELIA_BINDING;
  const k = corneliaSheet();
  const options = kind === 'norune'
    ? Object.keys(RUNES).filter(r => !B.runes.includes(r) && !k.no.includes(r)).map(r => `norune:${r}`)
    : [...B.runes.filter(r => !k.yes.includes(r)).map(r => `rune:${r}`), ...(k.incense ? [] : [`incense:${B.incense}`])];
  if (!options.length) return null;
  const fact = pick(options);
  recordFact('cornelia', fact);
  return corneliaFactText(fact);
}

function corneliaSheetHTML() {
  const B = CORNELIA_BINDING;
  const k = corneliaSheet();
  const rune = r => RUNES[r].name + (k.deduced.has(r) ? DEDUCED : '');
  const runes = [`needs ${B.runes.length}`];
  if (k.yes.length) runes.push(`✓ ${k.yes.map(rune).join(', ')}`);
  if (k.yes.length === B.runes.length) runes.push('no others');
  else if (k.no.length) runes.push(`✗ ${k.no.map(rune).join(', ')}`);
  const incense = k.incense
    ? INCENSE[k.incense].name.toLowerCase() + (k.incDeduced ? DEDUCED : '')
    : `?${k.notInc.length ? ` · not ${k.notInc.map(i => INCENSE[i].name.toLowerCase()).join(', ')}` : ''}`;
  return `<dl class="sheet">
    <dt>Circle</dt><dd>one that holds ${TIER_NAMES[B.circle].toLowerCase()}s</dd>
    <dt>Runes</dt><dd>${runes.join(' · ')}</dd>
    <dt>Incense</dt><dd>${incense}</dd>
  </dl>`;
}

// ---- the rite of Release, performed in the chamber with RITE as the "spirit"

const RITE = 'ithzar';

function resolveRite() {
  const s = state.sel;
  const B = CORNELIA_BINDING;
  const circle = circleById(s.circle);
  const incName = INCENSE[s.incense].name.toLowerCase();
  state.actions--;
  state.incense[s.incense]--;
  const m = { demon: { name: ITHZAR.name, tier: ITHZAR.tier }, rite: true, spoken: [], feedback: [], outcome: null, lines: [], greet: '', footnote: '' };
  log(`You light the ${incName} and begin the rite of Release.`);
  m.lines.push('Ithzar steps into your circle, closes its eyes, and speaks its own name, too quickly for you to catch. Then you begin the Clause of Release.');

  const right = s.runes.filter(r => B.runes.includes(r));
  const wrong = s.runes.filter(r => !B.runes.includes(r));
  const missing = B.runes.length - right.length;
  right.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune catches on something unseen and pulls it loose.`);
    recordFact('cornelia', `rune:${r}`);
  });
  wrong.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune finds nothing to unpick.`);
    recordFact('cornelia', `norune:${r}`);
  });
  if (missing) m.lines.push(`Cornelia used ${B.runes.length} runes; you have found ${right.length} of them.`);
  if (s.incense === B.incense) {
    m.lines.push(`The ${incName} smoke curls around Ithzar’s wrists like a leash, and loosens.`);
    recordFact('cornelia', `incense:${s.incense}`);
  } else {
    m.lines.push(`The ${incName} smoke means nothing to the binding.`);
    recordFact('cornelia', `noincense:${s.incense}`);
  }
  const circleOk = circle.tier >= B.circle;
  if (!circleOk) m.lines.push(`Your ${circle.name} cannot hold a djinni while its leash is being cut.`);

  if (circleOk && !wrong.length && !missing && s.incense === B.incense) {
    m.outcome = 'firm';
    m.lines.push('Something in the room goes taut, then parts like a fiddle string. Ithzar opens its eyes. For the first time since you met it, it has nothing to say. Then it is gone.');
    m.greet = '"Well," says a voice from somewhere near the ceiling, "that was competently done."¹';
    m.footnote = '¹ It will deny saying this.';
    state.flags['ithzar-freed'] = state.day;
    state.sel.name = null;
    log('<b>The rite holds.</b> Ithzar is free of Cornelia Ashby, and gone.', 'good');
  } else {
    m.outcome = 'broken';
    const taken = hurt(2, 'caught in the backlash of a failed rite of Release');
    state.standing.suspicion = Math.min(10, state.standing.suspicion + 1);
    m.lines.push(`The leash holds, and snaps back. (${hurtNote(taken, 2)}) Somewhere on LaSalle Street, Cornelia Ashby looks up from her dinner.`);
    log(`The rite of Release rebounds. (${hurtNote(taken, 2)}, the police take an interest)`, 'bad');
  }
  return m;
}

// ---- Ithzar as your familiar: asking it things, and its weekly favor

function askBlocker(d) {
  if (!ithzarHere()) return 'Ithzar is out today.';
  if (state.ithzar.askDay === state.day) return 'You have already asked Ithzar something today.';
  if (!unknownFacts(d).length) return 'There is nothing left to ask about it.';
  return null;
}

// A plausible wrong version of a fact, for when Ithzar doesn't feel like telling the truth.
function falseFact(d, fact) {
  const [t, a] = fact.split(':');
  if (t === 'syl') return `syl:${a}:${pick(SYLLABLES.filter(x => !d.trueName.includes(x)))}`;
  if (t === 'rune') return `rune:${pick(Object.keys(RUNES).filter(r => !d.runes.includes(r)))}`;
  if (t === 'runes') return `runes:${d.runes.length === 3 ? 2 : d.runes.length + 1}`;
  if (t === 'likes') return `likes:${pick(Object.keys(INCENSE).filter(k => k !== d.likes && k !== d.hates))}`;
  return `hates:${pick(Object.keys(INCENSE).filter(k => k !== d.likes && k !== d.hates))}`;
}

// Once a day Ithzar tells you something about a spirit. The less it trusts you, the more likely it lies;
// its claims stay marked in the notebook until the chamber confirms or refutes them.
function askIthzar(id) {
  const d = demonById(id);
  if (!d || !state.ithzar.joined || askBlocker(d)) return;
  state.ithzar.askDay = state.day;
  const lieChance = state.standing.trust >= 8 ? 0 : state.standing.trust >= 5 ? 0.1 : 0.4;
  const truth = pick(unknownFacts(d));
  const claim = Math.random() < lieChance ? falseFact(d, truth) : truth;
  const claims = state.ithzar.claims[d.id] || (state.ithzar.claims[d.id] = []);
  if (!claims.includes(claim)) claims.push(claim);
  const said = factText(claim);
  log(`<b>${pickFresh('ask:lead', ITHZAR_LINES['ask:lead'])}:</b> "About ${d.name}? ${said[0].toUpperCase()}${said.slice(1)}."`, 'aside');
  render();
}

function claimStatus(k, claim) {
  const [t, a, b] = claim.split(':');
  if (t === 'syl') return k.name[a] ? (k.name[a] === b ? 'confirmed' : 'refuted') : k.absent.has(b) ? 'refuted' : 'unconfirmed';
  if (t === 'rune') return k.runeYes.includes(a) ? 'confirmed' : k.runeNo.includes(a) ? 'refuted' : 'unconfirmed';
  if (t === 'runes') return k.runeCount === null ? 'unconfirmed' : k.runeCount === Number(a) ? 'confirmed' : 'refuted';
  const known = t === 'likes' ? k.likes : k.hates;
  return known ? (known === a ? 'confirmed' : 'refuted') : 'unconfirmed';
}

// What Ithzar has told you about a spirit that the notebook hasn't settled yet, or that turned out to be a lie.
function claimsHTML(d) {
  const k = dossier(d);
  const shown = (state.ithzar.claims[d.id] || []).map(c => [c, claimStatus(k, c)]).filter(([, st]) => st !== 'confirmed');
  if (!shown.length) return '';
  return `<div class="claims"><h4>Ithzar says</h4><ul>${shown.map(([c, st]) =>
    `<li class="${st}">${factText(c)} <small>${st === 'refuted' ? 'a lie' : 'unconfirmed'}</small></li>`).join('')}</ul></div>`;
}

function askButton(d) {
  if (!state.ithzar.joined) return '';
  const blocker = askBlocker(d);
  return `<button class="ghost" data-action="ask" data-value="${d.id}" ${blocker ? 'disabled' : ''}>Ask Ithzar about ${d.name}</button>
    ${blocker ? `<p class="muted small">${blocker}</p>` : ''}`;
}

function favorBlocker() {
  if (!ithzarHere()) return 'Ithzar is out today.';
  if (state.standing.trust < 6) return 'Ithzar does not like you enough to run your errands.';
  const since = state.day - state.ithzar.favorDay;
  if (since < 7) return `Ithzar will do you another favor in ${7 - since} day${7 - since > 1 ? 's' : ''}.`;
  return null;
}

// Runs at nightfall: Ithzar's errand, if you asked one of it and it still agrees.
function runIthzarFavor() {
  const errand = state.ithzar.favor;
  state.ithzar.favor = null;
  if (!errand || favorBlocker()) return;
  state.ithzar.favorDay = state.day;
  state.standing.trust = Math.max(-10, state.standing.trust - 1);
  log(`As a favor, ${bold(ITHZAR)} runs an errand for you tonight. It will be insufferable about it. (Ithzar thinks less of you)`, 'aside');
  runErrand({ binding: 'firm', errand }, ITHZAR);
}

function ithzarFavorCard() {
  if (!state.ithzar.joined) return '';
  const blocker = favorBlocker();
  return `<article class="panel card servant ithzar">
    <header><h3>${ITHZAR.name}</h3><span class="tag">Djinni · a favor, not a servant</span></header>
    <p class="muted">Familiars do not run errands. Ithzar will make an exception, once a week, if it likes you enough, and it will cost you a little of its good opinion.</p>
    ${blocker ? `<p class="muted small">${blocker}</p>` : `<label>Ask a favor tonight
      <select data-favor="1">
        <option value="">No favor tonight</option>
        ${errandOptions({ binding: 'firm' }, ITHZAR.tier, state.ithzar.favor)}
      </select>
    </label>`}
  </article>`;
}

// The victory screen's last word on Ithzar, if you ever met it.
function ithzarEpilogue() {
  const f = state.flags;
  if (f['met-ithzar'] === undefined) return '';
  if (state.ithzar.joined) return ITHZAR_EPILOGUES.joined;
  if (f['kept-promise'] !== undefined) return ITHZAR_EPILOGUES.kept;
  if (f['ithzar-left'] !== undefined) return ITHZAR_EPILOGUES.left;
  if (f['ithzar-gone'] !== undefined) return ITHZAR_EPILOGUES.gone;
  return f['ithzar-freed'] === undefined ? ITHZAR_EPILOGUES.bound : '';
}

function ithzarCard() {
  if (state.flags['met-ithzar'] === undefined) return '';
  let status;
  if (state.ithzar.joined) {
    status = `Your second familiar. Familiar abilities work at the class of the stronger of your two familiars. Ask it about spirits from the chamber’s notebook, once a day; at high trust it will run the odd errand as a favor.${state.ithzar.awayDay === state.day ? ' <b>It is out today.</b>' : ''}${familiarResting('ithzar') ? ` <b>Resting after bracing a circle; back on ${dateLabel(state.familiarOut.ithzar, 'long')}.</b>` : ''}`;
  } else if (state.flags['ithzar-released'] !== undefined) {
    status = state.flags['kept-promise'] !== undefined
      ? 'Gone. You let it go, as you promised, before the thing under the lake.'
      : 'Gone. It asked you to let it go, and when you would not answer, it let itself go.';
  } else if (state.flags['ithzar-gone'] !== undefined) {
    status = 'Gone. You refused its terms twice.';
  } else if (state.flags['ithzar-freed'] !== undefined) {
    status = 'Free of Cornelia Ashby, and gone for now. It said it would be back.';
  } else if (leashActive()) {
    status = `Bound to Mrs. Cornelia Ashby. You have agreed to break her binding: piece it together, then perform the rite of Release in your chamber, choosing Ithzar as the spirit.</p>${corneliaSheetHTML()}<p>`;
  } else {
    status = 'Bound to Mrs. Cornelia Ashby. It visits when it likes, and lately it likes to. It is no use to you as a familiar while she holds its leash, but it does talk.';
  }
  return `<h2 class="section-title">Ithzar</h2>
    <article class="panel card ithzar">
      <header><h3>${ITHZAR.name}</h3><span class="tag">${TIER_NAMES[ITHZAR.tier]}</span></header>
      <p class="muted">Appears as ${ITHZAR.form}.</p>
      <p>${status}</p>
      ${state.flags['ithzar-gone'] === undefined && state.flags['ithzar-released'] === undefined ? `<p>Ithzar <b>${standingWord('trust')}</b>.</p>` : ''}
    </article>`;
}

// How a spirit is currently bound to you, as a phrase ("in your service"), or null if it is free.
function boundPhrase(demonId) {
  if (state.servants.some(sv => sv.demonId === demonId)) return 'in your service';
  if (state.familiar === demonId) return 'your familiar';
  const type = Object.keys(state.vessels).find(k => state.vessels[k].spirit === demonId);
  return type ? `sealed in your ${VESSELS[type].name.toLowerCase()}` : null;
}

function clauseLabel(clause) {
  return clause.startsWith('vessel:') ? `${CLAUSES.vessel.name}: ${VESSELS[clause.slice(7)].name}` : CLAUSES[clause].name;
}

function releaseVessel(type, quiet = false) {
  const v = state.vessels[type];
  if (!v || !v.spirit) return;
  if (!quiet) log(`You crack the seal. ${bold(demonById(v.spirit))} unfolds from your ${VESSELS[type].name.toLowerCase()}, stretches, and leaves with a remark about the accommodations.`);
  v.spirit = null;
}

function releaseFamiliar(quiet = false) {
  if (!state.familiar) return;
  if (!quiet) log(`You speak the words of parting. ${bold(demonById(state.familiar))} gives you a long look, and is gone.`);
  state.familiar = null;
}

function reinforce(type) {
  const v = state.vessels[type];
  const next = v && v.cap + 1;
  if (!v || next > 5 || rankIndex() < next - 1 || state.dollars < VESSEL_CAP_COST[next]) return;
  state.dollars -= VESSEL_CAP_COST[next];
  v.cap = next;
  log(`Your ${VESSELS[type].name.toLowerCase()} is reinforced. It can now hold a ${TIER_NAMES[next].toLowerCase()}.`);
  render();
}

// Facts about a spirit the notebook does not have yet, in notebook format.
function unknownFacts(d) {
  const k = dossier(d);
  const out = [];
  d.trueName.forEach((syl, i) => { if (!k.name[i]) out.push(`syl:${i}:${syl}`); });
  if (k.runeCount === null) out.push(`runes:${d.runes.length}`);
  d.runes.forEach(r => { if (!k.runeYes.includes(r)) out.push(`rune:${r}`); });
  if (!k.likes) out.push(`likes:${d.likes}`);
  if (!k.hates) out.push(`hates:${d.hates}`);
  return out;
}

function factText(fact) {
  const [t, a, b] = fact.split(':');
  switch (t) {
    case 'syl': return `${sylHTML(b)} is syllable ${Number(a) + 1} of its name`;
    case 'runes': return `it is held by ${a} rune${a > 1 ? 's' : ''}`;
    case 'rune': return `the ${RUNES[a].name} rune holds it`;
    case 'likes': return `it likes ${INCENSE[a].name.toLowerCase()}`;
    case 'hates': return `it hates ${INCENSE[a].name.toLowerCase()}`;
  }
  return fact;
}

// Each dawn the spirit in the scrying glass shows you something about the spirit selected in the chamber
// (or another you know), as long as it is no more than one class above the spirit in the glass.
function scry() {
  const t = vesselTier('scrying');
  if (!t) return;
  const glass = demonById(state.vessels.scrying.spirit);
  if (leashActive() && t >= 2) {
    const clue = corneliaClue(1);
    if (clue) log(`In the scrying glass, ${bold(glass)} shows you Cornelia Ashby\u2019s workshop: ${clue}.`, 'lore');
  }
  const viewable = d => isKnown(d) && d.tier <= t + 1 && unknownFacts(d).length;
  const selected = state.sel.name && demonById(state.sel.name);
  const d = selected && viewable(selected) ? selected : pick(knownDemons().filter(viewable));
  if (!d) {
    log(`The scrying glass shows ${bold(glass)} examining its fingernails. There is nothing within its reach you do not already know.`);
    return;
  }
  const facts = unknownFacts(d).sort(() => Math.random() - 0.5).slice(0, t);
  facts.forEach(f => recordFact(d.id, f));
  log(`In the scrying glass, ${bold(glass)} shows you ${bold(d)}: ${facts.map(factText).join('; ')}.`, 'lore');
}

// Injuries are reduced by a cane's spirit and by a familiar of class 3 or more. Returns the damage taken.
function hurt(n, cause) {
  const guard = (vesselTier('cane') ? caneGuard(vesselTier('cane')) : 0) + (familiarTier() >= 3 ? 1 : 0);
  const taken = Math.max(0, n - guard);
  state.health -= taken;
  if (state.health <= 0) {
    state.health = 0;
    state.over = 'dead';
    state.deathCause = cause;
  }
  return taken;
}

const hurtNote = (taken, n) => `−${taken} health${taken < n ? `, ${n - taken} turned aside` : ''}`;

// ---------- lore and the notebook

const fmtLore = text => text.replace(/\[([A-Z]+)\]/g, '<span class="syl">$1</span>');
const sylHTML = (syl, cls = '') => `<span class="syl ${cls}">${syl}</span>`;

function isKnown(d) {
  return state.met.includes(d.id) || d.lore.some((_, i) => state.lore.includes(`${d.id}-${i}`));
}

function knownDemons() {
  return DEMONS.filter(isKnown);
}

function learnFragment(minTier, maxTier, demonId = null) {
  const pool = FRAGMENTS.filter(f => !state.lore.includes(f.id) && f.demon.tier >= minTier && f.demon.tier <= maxTier
    && (!demonId || f.demon.id === demonId));
  if (!pool.length) return null;
  const f = pick(pool);
  state.lore.push(f.id);
  state.newLore++;
  log(`<span class="src">${f.src}:</span> “${fmtLore(f.text)}”`, 'lore');
  return f;
}

function study() {
  if (state.actions < 1 || state.over) return;
  state.actions--;
  const f = learnFragment(1, rankTier());
  if (!f) log('You spend the hour in the library, but find nothing new at your rank. Perhaps a grimoire, or a well-placed spy, would serve better.');
  render();
}

// Facts use the formats documented above DEMONS in data.js.
function recordFact(demonId, fact) {
  const list = state.facts[demonId] || (state.facts[demonId] = []);
  if (!list.includes(fact)) list.push(fact);
}

// Everything the notebook knows about a spirit: facts from lore read and from chamber observations,
// plus whatever follows from them by elimination. Deduced entries are flagged so the sheet can mark them.
function dossier(d) {
  const facts = [
    ...FRAGMENTS.filter(f => f.demon === d && state.lore.includes(f.id)).flatMap(f => f.facts || []),
    ...(state.facts[d.id] || []),
  ].map(f => f.split(':'));

  const len = d.trueName.length;
  const name = Array(len).fill(null);        // confirmed syllable at each position
  const nameDeduced = Array(len).fill(false);
  const present = new Set();                 // syllables known to be in the name somewhere
  const absent = new Set();
  const notAt = {};                          // syllable -> positions it is known not to occupy
  const runeYes = new Set(), runeNo = new Set(), runeDeduced = new Set();
  let runeCount = null;
  let likes = null, hates = null, likesDeduced = false, hatesDeduced = false;
  const notLiked = new Set(), notHated = new Set();

  for (const [t, a, b] of facts) {
    switch (t) {
      case 'syl': name[+a] = b; present.add(b); break;
      case 'has': present.add(a); break;
      case 'at!': present.add(a); (notAt[a] || (notAt[a] = new Set())).add(+b); break;
      case 'not': absent.add(a); break;
      case 'rune': runeYes.add(a); break;
      case 'norune': runeNo.add(a); break;
      case 'runes': runeCount = +a; break;
      case 'likes': likes = a; break;
      case 'hates': hates = a; break;
      case 'neutral': notLiked.add(a); notHated.add(a); break;
    }
  }

  // name: place syllables that can only go one way, until nothing changes
  const candidates = pos => SYLLABLES.filter(s => !absent.has(s) && !(notAt[s] && notAt[s].has(pos))
    && !name.some((n, i) => n === s && i !== pos));
  for (let changed = true; changed;) {
    changed = false;
    const open = name.map((n, i) => (n ? -1 : i)).filter(i => i >= 0);
    const unplaced = [...present].filter(s => !name.includes(s));
    if (open.length && unplaced.length === open.length) {
      // the known syllables fill every gap, so nothing else is in the name
      SYLLABLES.forEach(s => { if (!present.has(s) && !absent.has(s)) { absent.add(s); changed = true; } });
    }
    for (const pos of open) {
      const c = candidates(pos);
      if (!name[pos] && c.length === 1) { name[pos] = c[0]; nameDeduced[pos] = true; present.add(c[0]); changed = true; }
    }
    for (const s of unplaced) {
      if (name.includes(s)) continue;
      const spots = open.filter(pos => !name[pos] && candidates(pos).includes(s));
      if (spots.length === 1) { name[spots[0]] = s; nameDeduced[spots[0]] = true; changed = true; }
    }
  }

  // runes: once the count is known, the rest can follow
  const allRunes = Object.keys(RUNES);
  runeYes.forEach(r => runeNo.delete(r));
  if (runeCount !== null) {
    if (runeYes.size === runeCount) {
      allRunes.forEach(r => { if (!runeYes.has(r) && !runeNo.has(r)) { runeNo.add(r); runeDeduced.add(r); } });
    }
    const open = allRunes.filter(r => !runeYes.has(r) && !runeNo.has(r));
    if (open.length && open.length === runeCount - runeYes.size) open.forEach(r => { runeYes.add(r); runeDeduced.add(r); });
  }

  // incense: every spirit likes exactly one and hates exactly one
  const incKeys = Object.keys(INCENSE);
  if (likes) { incKeys.forEach(k => k !== likes && notLiked.add(k)); notHated.add(likes); }
  if (hates) { incKeys.forEach(k => k !== hates && notHated.add(k)); notLiked.add(hates); }
  if (!likes) {
    const c = incKeys.filter(k => !notLiked.has(k));
    if (c.length === 1) { likes = c[0]; likesDeduced = true; notHated.add(likes); }
  }
  if (!hates) {
    const c = incKeys.filter(k => !notHated.has(k));
    if (c.length === 1) { hates = c[0]; hatesDeduced = true; }
  }
  const neutral = incKeys.filter(k => k !== likes && k !== hates && notLiked.has(k) && notHated.has(k));

  return {
    name, nameDeduced, absent,
    nearby: [...present].filter(s => !name.includes(s)),
    nameComplete: name.every(Boolean),
    runeYes: [...runeYes], runeNo: [...runeNo], runeDeduced, runeCount,
    likes, hates, likesDeduced, hatesDeduced, neutral,
  };
}

// ---------- summoning

// Rebuilds the incantation slots for the selected spirit, prefilled with every confirmed syllable.
function resetIncantation() {
  const s = state.sel;
  const d = s.name && demonById(s.name);
  s.syllables = d ? [...dossier(d).name] : [];
}

function toggleSyllable(syl) {
  const slots = state.sel.syllables;
  const at = slots.indexOf(syl);
  if (at >= 0) slots[at] = null;
  else {
    const empty = slots.indexOf(null);
    if (empty >= 0) slots[empty] = syl;
  }
}

function summonBlocker() {
  const s = state.sel;
  if (state.over) return 'The game is over.';
  if (state.actions < 1) return 'It is too late in the day. End the day and rest.';
  if (!s.name) return 'Choose the spirit you mean to call.';
  if (s.name === RITE) {
    if (!leashActive()) return 'Ithzar is no longer bound to anyone.';
    if (!s.incense) return 'Choose an incense to burn.';
    if ((state.incense[s.incense] || 0) < 1) return `You have no ${INCENSE[s.incense].name.toLowerCase()} left.`;
    return null;
  }
  const d = demonById(s.name);
  if (s.syllables.some(x => !x)) return `Speak all ${d.trueName.length} syllables of its true name.`;
  if (!s.incense) return 'Choose an incense to burn.';
  if ((state.incense[s.incense] || 0) < 1) return `You have no ${INCENSE[s.incense].name.toLowerCase()} left.`;
  const bound = boundPhrase(s.name);
  if (bound) return `${d.name} is already ${bound}.`;
  const reach = s.overreach && overreachCheck(d);
  if (reach && !reach.ok) return 'Your binding is no longer perfect enough to overreach. Fix it, or stop overreaching.';
  if (s.clause === 'service' && state.servants.length >= maxServants()) {
    return `At your rank you can hold only ${maxServants()} servant${maxServants() > 1 ? 's' : ''} at once. Dismiss one first.`;
  }
  if (s.clause.startsWith('vessel:')) {
    const type = s.clause.slice(7);
    if (d.tier > state.vessels[type].cap) {
      return `Your ${VESSELS[type].name.toLowerCase()} can hold nothing stronger than ${TIER_NAMES[state.vessels[type].cap].toLowerCase()}. Reinforce it in the workshop.`;
    }
  }
  return null;
}

function beginSummon() {
  if (busy || summonBlocker()) return;
  busy = true;
  manifestation = null;
  render();
  setTimeout(() => {
    manifestation = state.sel.name === RITE ? resolveRite() : resolveSummon();
    manifestation.aside = manifestation.rite ? null : summonAside(manifestation);
    if (manifestation.aside) logAside(manifestation.aside);
    busy = false;
    resetIncantation();
    render();
  }, 1500);
}

function nameFeedback(spoken, fb, target) {
  const groups = { exact: [], near: [], none: [] };
  spoken.forEach((syl, i) => groups[fb[i]].push(sylHTML(syl, fb[i])));
  const list = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0]);
  const many = (a, one, more) => (a.length > 1 ? more : one);
  const out = [];
  if (groups.exact.length) out.push(`${list(groups.exact)} ${many(groups.exact, 'rings', 'ring')} true, in place.`);
  if (groups.near.length) out.push(`${list(groups.near)} ${many(groups.near, 'belongs', 'belong')} in ${target.name}’s name, but not there.`);
  if (groups.none.length) out.push(`${list(groups.none)} ${many(groups.none, 'means', 'mean')} nothing to it.`);
  return out.join(' ');
}

function resolveSummon() {
  const s = state.sel;
  const target = demonById(s.name);
  const spoken = [...s.syllables];
  const circle = circleById(s.circle);
  const pent = pentacleById(s.pentacle);
  const inc = INCENSE[s.incense];
  const incName = inc.name.toLowerCase();
  state.actions--;
  state.incense[s.incense]--;

  // each spoken syllable resonates against the spirit you meant to call
  const feedback = spoken.map((syl, i) => (syl === target.trueName[i] ? 'exact' : target.trueName.includes(syl) ? 'near' : 'none'));
  spoken.forEach((syl, i) => recordFact(target.id,
    feedback[i] === 'exact' ? `syl:${i}:${syl}` : feedback[i] === 'near' ? `at!:${syl}:${i}` : `not:${syl}`));

  const m = { demon: target, target, spoken, feedback, outcome: null, lines: [], greet: '', footnote: '' };
  log(`You light the ${incName} and speak a name meant for ${bold(target)}: ${spoken.map(x => sylHTML(x)).join('·')}, <i>${clauseLabel(s.clause)}</i>.`);

  const d = DEMONS.find(x => x.trueName.join() === spoken.join());
  if (!d || boundPhrase(d.id)) {
    m.outcome = 'silence';
    m.lines.push(nameFeedback(spoken, feedback, target));
    m.lines.push(d
      ? `${d.name} — already ${boundPhrase(d.id)} — flickers in the circle, irritated, and is gone.`
      : feedback.includes('exact') || feedback.includes('near')
        ? `Something stirs at the edge of hearing, then subsides. The ${incName} is spent.`
        : `The ${incName} smoke curls, unbothered. Nothing answers.`);
    log('Nothing answered. The incense is spent.', 'bad');
    return m;
  }

  m.demon = d;
  if (!state.met.includes(d.id)) state.met.push(d.id);
  if (d !== target) {
    m.accident = true;
    d.trueName.forEach((syl, i) => recordFact(d.id, `syl:${i}:${syl}`));
    m.lines.push(nameFeedback(spoken, feedback, target));
    m.lines.push(`But that name is not ${target.name}’s. It belongs to someone else — and <b>${d.name}</b>, ${TIER_NAMES[d.tier].toLowerCase()}, answers instead.`);
    log(`The wrong spirit answered: ${bold(d)}.`, 'bad');
  } else {
    m.lines.push(`Every syllable rings true. ${d.name} cannot refuse its own name.`);
  }
  m.lines.push(`The smoke thickens and turns. Something is in the circle: ${d.form}.`);

  const right = s.runes.filter(r => d.runes.includes(r));
  const wrong = s.runes.filter(r => !d.runes.includes(r));
  const missing = d.runes.filter(r => !s.runes.includes(r));
  recordFact(d.id, `runes:${d.runes.length}`);
  right.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune burns clean and steady.`);
    recordFact(d.id, `rune:${r}`);
  });
  wrong.forEach(r => {
    m.lines.push(`The <b>${RUNES[r].name}</b> rune sputters and smokes — it has no hold here.`);
    recordFact(d.id, `norune:${r}`);
  });
  if (missing.length) {
    m.lines.push(`There is a gap in the binding. ${d.name} is held by ${d.runes.length} rune${d.runes.length > 1 ? 's' : ''}; you drew ${right.length} of them.`);
  }

  let incMod = 0;
  if (d.likes === s.incense) {
    incMod = 2;
    m.lines.push(`${d.name} breathes in the ${incName} with evident pleasure.`);
    recordFact(d.id, `likes:${s.incense}`);
  } else if (d.hates === s.incense) {
    incMod = -2;
    m.lines.push(`${d.name} recoils from the ${incName}, snarling.`);
    recordFact(d.id, `hates:${s.incense}`);
  } else {
    m.lines.push(`${d.name} seems indifferent to the ${incName}.`);
    recordFact(d.id, `neutral:${s.incense}`);
  }

  const circleBonus = clamp(circle.tier - d.tier, 0, 2);
  const reach = circle.tier < d.tier && s.overreach && d === target ? overreachCheck(d) : null;
  if (reach && reach.ok && !wrong.length && !missing.length && d.likes === s.incense) {
    const held = Math.random() * 100 < reach.odds;
    m.overreach = { bracers: reach.bracers.map(b => b.key), odds: reach.odds, held };
    const names = reach.bracers.map(b => b.name);
    const who = names.length
      ? `${names.join(' and ')} ${names.length > 1 ? 'throw their' : 'throws its'} weight against the chalk`
      : 'You hold the lines with nothing but your will';
    m.lines.push(`Your ${circle.name} was never meant to hold a spirit of this power. ${d.name} feels it give, and pushes. ${who}${held ? ', and the circle holds.' : '. It is not enough.'}`);
    m.outcome = held ? 'uneasy' : 'broken';
  } else if (circle.tier < d.tier) {
    m.lines.push(`The ${circle.name} was never meant to hold a spirit of this power. It cracks like ice on a pond.`);
    m.outcome = 'broken';
  } else if (missing.length) {
    m.outcome = 'broken';
  } else {
    if (circleBonus) m.lines.push(`Your ${circle.name} is stronger than it needs to be. ${d.name} notices.`);
    const score = incMod - wrong.length + circleBonus;
    m.outcome = score >= 2 ? 'firm' : score >= 0 ? 'uneasy' : 'broken';
  }
  const vesselType = s.clause.startsWith('vessel:') ? s.clause.slice(7) : null;
  if (m.outcome !== 'broken' && vesselType && d.tier > state.vessels[vesselType].cap) {
    m.lines.push(`Your ${VESSELS[vesselType].name.toLowerCase()} was never meant to hold a spirit of this power. It rings like a struck bell, and ${d.name} is out.`);
    m.outcome = 'broken';
  } else if (m.outcome === 'uneasy' && s.clause !== 'service') {
    m.lines.push(`A binding ${clauseLabel(s.clause).split(':')[0]} must be perfect. This one is not, and ${d.name} tears free of it.`);
    m.outcome = 'broken';
  }

  if (m.outcome === 'broken') {
    const safe = !m.overreach && pent.tier >= d.tier;  // a failed overreach comes at you at full fury
    const dmg = safe ? Math.ceil(d.tier / 2) : d.tier * 2 + 1;
    const taken = hurt(dmg, `torn apart by ${d.name}, who slipped a faulty binding`);
    m.lines.push(safe
      ? `The binding fails. ${d.name} hurls itself at you and breaks against your ${pent.name}. It settles for a parting blast of essence (${hurtNote(taken, dmg)}) and flees into the night.`
      : `The binding fails. ${d.name} comes for you, and your ${pent.name} is nowhere near strong enough. (${hurtNote(taken, dmg)})`);
    const q = pick(BROKEN_QUIPS);
    m.greet = fill(q.greet, { name: d.name });
    m.footnote = q.footnote;
    if (m.overreach) {
      state.standing.suspicion = Math.min(10, state.standing.suspicion + 2);
      m.lines.push('A loose spirit on Clark Street makes the papers. (the police take an interest)');
    }
    settleBracing(m, d);
    log(`The binding failed. ${bold(d)} broke free. (${hurtNote(taken, dmg)})`, 'bad');
    return m;
  }

  m.greet = d.greet;
  m.footnote = d.footnote;
  if (s.clause === 'service') {
    settleBracing(m, d);
    if (m.overreach) m.lines.push(`It is held by a circle too small for it, and it knows. It will be testing that circle every night.`);
    if (m.outcome === 'uneasy' && !m.overreach && pent.tier < d.tier && Math.random() < 0.35) {
      const taken = hurt(d.tier, `scorched by ${d.name}, testing a pentacle too weak to hold it`);
      m.lines.push(`Before submitting, ${d.name} tests the edge of your pentacle \u2014 and finds it wanting. (${hurtNote(taken, d.tier)})`);
    }
    m.lines.push(m.outcome === 'firm'
      ? `The binding holds firm. ${d.name} is yours to command \u2014 for now.`
      : `The binding holds, barely. ${d.name} strains against it, watching for a mistake.`);
    log(`${bold(d)} is bound ${m.outcome === 'firm' ? 'firmly' : 'uneasily'} to your service.`, 'good');
    if (!state.over) {
      state.servants.push({
        uid: state.nextUid++, demonId: d.id, binding: m.outcome,
        patience: m.overreach ? Math.ceil(PATIENCE[d.tier] / 2) : PATIENCE[d.tier] + (m.outcome === 'firm' ? 2 : 0),
        pentTier: pent.tier, errand: null, strained: !!m.overreach,
      });
    }
  } else if (s.clause === 'familiar') {
    if (state.familiar) {
      log(`${bold(demonById(state.familiar))} is released to make room, and leaves without a backward glance.`);
      releaseFamiliar(true);
    }
    state.familiar = d.id;
    state.familiarOut.own = 0;
    m.lines.push(`The binding holds, perfectly. The circle fades, and ${d.name} steps out of it to take its place at your side. It is your familiar now, for good.`);
    log(`${bold(d)} is bound as your familiar.`, 'good');
  } else {
    const v = state.vessels[vesselType];
    if (v.spirit) {
      log(`${bold(demonById(v.spirit))} is released from your ${VESSELS[vesselType].name.toLowerCase()} to make room.`);
      releaseVessel(vesselType, true);
    }
    v.spirit = d.id;
    m.lines.push(`The binding holds, perfectly. ${d.name} folds itself smaller and smaller and is drawn into your ${VESSELS[vesselType].name.toLowerCase()}, protesting all the way.`);
    log(`${bold(d)} is sealed in your ${VESSELS[vesselType].name.toLowerCase()}.`, 'good');
  }
  if (!state.over) checkBindCommission(d);
  return m;
}

// ---------- overreaching: binding a spirit one class above your circle

// A familiar recovering from bracing a circle is no use to you while state.day < its familiarOut day.
const familiarResting = key => state.day < (state.familiarOut[key] || 0);
const ownFamiliar = () => (state.familiar && !familiarResting('own') ? demonById(state.familiar) : null);

// Familiars who could brace the circle right now, and what each adds to the odds.
function availableBracers() {
  const list = [];
  const own = ownFamiliar();
  if (own) list.push({ key: 'own', name: own.name, bonus: Math.min(25, 5 * own.tier) });
  if (ithzarHere()) list.push({ key: 'ithzar', name: ITHZAR.name, bonus: 15 });
  return list;
}

// Whether the chamber's setup could overreach for spirit d. Null when overreaching doesn't apply
// (the circle is strong enough, the clause isn't Service, or the spirit is more than one class too strong);
// otherwise { ok, reason } or { ok, odds, bracers, pentOk }. The gate is the notebook: overreaching needs a
// binding the notebook says is perfect.
function overreachCheck(d) {
  const s = state.sel;
  const circle = circleById(s.circle);
  if (!d || s.clause !== 'service' || d.tier !== circle.tier + 1) return null;
  if (d.tier === 5) return { ok: false, reason: 'Nobody overreaches for a marid. Not twice, anyway.' };
  const k = dossier(d);
  const needed = [];
  if (!k.nameComplete || k.name.some((syl, i) => syl !== s.syllables[i])) needed.push('its full true name');
  if (k.runeCount === null || k.runeYes.length < k.runeCount || s.runes.length !== k.runeCount
    || s.runes.some(r => !k.runeYes.includes(r))) needed.push('exactly the runes that hold it');
  if (!k.likes || s.incense !== k.likes) needed.push('the incense it likes');
  if (needed.length) {
    return { ok: false, reason: `You can only overreach with a binding your notebook says is perfect. Still needed: ${needed.join('; ')}.` };
  }
  const bracers = availableBracers().filter(b => s.brace.includes(b.key));
  const pentOk = pentacleById(s.pentacle).tier >= d.tier;
  const odds = Math.min(90, 40 + (pentOk ? 15 : 0) + bracers.reduce((a, b) => a + b.bonus, 0));
  return { ok: true, odds, bracers, pentOk };
}

// After an overreach, bracing familiars pay for it: spent for the day if the circle held,
// out for as many days as the spirit's class if it didn't. Ithzar also resents being dragged in.
function settleBracing(m, d) {
  if (!m.overreach) return;
  const days = m.overreach.held ? 1 : d.tier;
  for (const key of m.overreach.bracers) {
    state.familiarOut[key] = state.day + days;
    const name = key === 'ithzar' ? ITHZAR.name : demonById(state.familiar).name;
    m.lines.push(m.overreach.held
      ? `${name} is spent, and will be no use to you until tomorrow.`
      : `${name} took the backlash, and will be out for ${days} day${days > 1 ? 's' : ''}.`);
    if (key === 'ithzar' && !m.overreach.held) {
      state.standing.trust = Math.max(-10, state.standing.trust - 1);
      m.lines.push('"You dragged me into that," says Ithzar. (Ithzar thinks less of you)');
    }
  }
}

function overreachHTML(d) {
  const check = overreachCheck(d);
  if (!check) return '';
  const s = state.sel;
  const circle = circleById(s.circle);
  const head = `<h3>Overreach</h3>
    <p class="muted small">Your ${circle.name} holds nothing stronger than ${TIER_NAMES[circle.tier].toLowerCase()}s, and ${d.name} is a ${TIER_NAMES[d.tier].toLowerCase()}. Without a stronger circle it will break free, unless you overreach.</p>`;
  if (!check.ok) return `<div class="ctl overreach">${head}<p class="small">${check.reason}</p></div>`;
  const bracers = availableBracers();
  return `<div class="ctl overreach ${s.overreach ? 'on' : ''}">${head}
    <div class="chips">${chip('overreach', '1', 'Attempt to overreach', s.overreach)}</div>
    ${s.overreach ? `
      ${bracers.length
        ? `<p class="small">Familiars on standby:</p><div class="chips">${bracers.map(b =>
          chip('brace', b.key, `${b.name} braces the circle<small>+${b.bonus}%</small>`, s.brace.includes(b.key))).join('')}</div>`
        : '<p class="muted small">No familiar is free to brace the circle.</p>'}
      <p class="odds">Chance the circle holds: <b>${check.odds}%</b>${check.pentOk ? '' : ' <span class="muted small">(+15% with a pentacle that could contain it)</span>'}</p>
      <p class="muted small">If it holds: a strained, uneasily bound servant with half the usual patience, which may break loose any night, and bracing familiars are spent for the day. If it fails: ${d.name} breaks free at full fury (${d.tier * 2 + 1} damage before protections), the police take an interest, and bracing familiars are out for ${d.tier} days.</p>` : ''}
  </div>`;
}

// ---------- servants and errands

function errandChance(sv, diff, tier = demonById(sv.demonId).tier) {
  return clamp(0.55 + 0.2 * (tier - diff) + (sv.binding === 'firm' ? 0.15 : 0), 0.1, 0.95);
}

function errandDiff(errand, tier) {
  if (errand === 'commission') return currentCommission().diff;
  return ERRANDS[errand].diff(tier);
}

function coinAmount(tier) {
  return [0, rand(5, 9), rand(12, 18), rand(24, 34), rand(45, 60), rand(80, 100)][tier];
}

function runErrand(sv, d = demonById(sv.demonId)) {
  const vars = { name: bold(d) };
  if (sv.errand === 'commission') {
    const c = currentCommission();
    if (!c || c.type !== 'errand') { sv.errand = null; return; }
  }
  const e = ERRANDS[sv.errand];
  if (e && e.available && !e.available(state)) { sv.errand = null; return; }
  const succeeded = Math.random() < errandChance(sv, errandDiff(sv.errand, d.tier), d.tier);

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
    case 'cornelia': {
      const clue = corneliaClue(1);
      log(`${fill(pick(ERRAND_TEXT.cornelia.ok), vars)} ${clue ? `From what it saw, ${clue}.` : 'It learned nothing you did not already know.'}`, 'lore');
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
    const taken = hurt(1, `a fall arranged by ${d.name}`);
    log(`${fill(t.text, vars)} (${hurtNote(taken, 1)})`, 'bad');
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
  const taken = hurt(dmg, `ambushed by ${d.name}, whose bonds were left to fray`);
  if (sv.patience > 0) log(`${bold(d)} has been testing your too-small circle every night. Tonight it finds the gap. (${hurtNote(taken, dmg)})`, 'bad');
  else log(`${bold(d)} has strained against its bonds too long. They snap — and it leaves you a parting gift. (${hurtNote(taken, dmg)})`, 'bad');
}

function endDay() {
  if (state.over || busy) return;
  log(`Night falls on day ${state.day}.`, 'info');
  runIthzarFavor();
  for (const sv of [...state.servants]) {
    if (sv.errand) runErrand(sv);
    if (state.over) break;
  }
  if (!state.over) {
    for (const sv of [...state.servants]) {
      sv.patience--;
      if (sv.patience <= 0 || (sv.strained && Math.random() < 0.15)) expire(sv);
      if (state.over) break;
    }
  }
  if (!state.over) {
    state.health = Math.min(MAX_HEALTH, state.health + 1);
    state.day++;
    state.actions = maxActions();
    log(`${dateLabel(state.day, 'long')} dawns.`, 'info');
    processEvents();
    ithzarDawn();  // before suspicion fades, so its warning sees today's danger
    coolSuspicion();
    scry();
    if (state.familiar && Math.random() < 0.4) log(fill(pick(FAMILIAR_QUIPS), { name: bold(demonById(state.familiar)) }));
  }
  manifestation = null;
  render();
}

// ---------- commissions

const currentCommission = () => COMMISSIONS[state.commission] || null;
// a signet ring with a spirit in it makes City Hall more generous
const commissionPay = c => Math.round(c.pay * (1 + 0.25 * vesselTier('ring')));

function checkBindCommission(d) {
  const c = currentCommission();
  if (c && c.type === 'bind' && d.tier >= c.tier) completeCommission();
}

function completeCommission() {
  const c = currentCommission();
  const pay = commissionPay(c);
  state.dollars += pay;
  state.commission++;
  state.servants.forEach(s => { if (s.errand === 'commission') s.errand = null; });
  log(`<b>Commission complete: ${c.title}.</b> ${c.done} (+${c.rep} reputation, +$${pay})`, 'good');
  gainRep(c.rep);
  if (c.gift && !state.vessels[c.gift]) {
    state.vessels[c.gift] = { cap: VESSELS[c.gift].cap, spirit: null };
    log(`You now own a ${VESSELS[c.gift].name.toLowerCase()}. See the workshop.`, 'good');
  }
  if (c.teaches && !state.clauses.includes(c.teaches)) {
    state.clauses.push(c.teaches);
    log(`You have learned the Clause ${CLAUSES[c.teaches].name}. ${CLAUSES[c.teaches].desc}`, 'good');
  }
  if (c.win) state.over = 'won';
}

// ---------- the city

const districtById = id => DISTRICTS.find(d => d.id === id);
const placeById = (dist, id) => dist.places.find(p => p.id === id);
const eventById = id => EVENTS.find(e => e.id === id);

// ---- the calendar and the news

function dateLabel(day, style = 'short') {
  const date = new Date(START_DATE[0], START_DATE[1], START_DATE[2] + day - 1);
  return date.toLocaleDateString('en-US', style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' });
}

function activeEvents() {
  return EVENTS.filter(ev => state.events[ev.id] && !state.events[ev.id].done)
    .map(ev => ({ ev, st: state.events[ev.id], stage: ev.stages[state.events[ev.id].stage] }));
}

// Today's front page: running events, newest first, or filler when nothing much is happening.
function headlines() {
  const news = activeEvents().filter(a => a.stage.headline)
    .sort((a, b) => b.st.since - a.st.since).map(a => a.stage.headline);
  return news.length ? news : [FILLER_HEADLINES[state.day % FILLER_HEADLINES.length]];
}

function setStage(ev, next) {
  const st = state.events[ev.id];
  if (next === 'end') {
    st.done = true;
    return;
  }
  st.stage = next;
  st.since = state.day;
  const stage = ev.stages[next];
  if (stage.headline) {
    log(`<span class="paper">${NEWSPAPER}:</span> ${stage.headline}`, 'news');
    const remark = ithzarPresent() && Math.random() < 0.6 && ithzarLine(`news:${ev.id}`);
    if (remark) logAside(remark);
  } else {
    const [d, p] = stage.place.split(':');
    log(`<b>${ev.title}.</b> ${stage.text || `Something is waiting for you at ${placeById(districtById(d), p).name.replace(/^Your /, 'your ')}.`}`, 'news');
  }
  const extra = stage.announce && stage.announce(state);
  if (extra) log(extra, 'news');
}

// Starts, expires and advances current events. Runs at dawn.
function processEvents() {
  for (const ev of EVENTS) {
    const st = state.events[ev.id];
    if (st && !st.done) {
      const stage = ev.stages[st.stage];
      if (stage.days && state.day - st.since >= stage.days) {
        const ex = typeof stage.expire === 'function' ? stage.expire(state) : stage.expire;
        if (ex.text || ex.fx) {
          const entry = log(`<b>${ev.title}.</b> ${ex.text || ''}`, 'news');
          if (ex.fx) {
            const { notes } = applyEffects(ex.fx, `caught up in ${ev.title.toLowerCase()}`);
            if (notes.length) entry.html += ` <span class="fx">(${notes.join(', ')})</span>`;
          }
        }
        setStage(ev, ex.next);
      }
    } else if ((!st || ev.repeat) && ev.starts(state)) {
      state.events[ev.id] = { stage: 0, since: state.day, done: false };
      setStage(ev, 0);
    }
  }
}

// ---- hidden standings

const STANDING_WORDS = {
  machine: [[-99, 'distrusted'], [-1, 'nobody in particular'], [2, 'a useful friend'], [5, 'one of their own']],
  union: [[-99, 'an enemy'], [-1, 'a stranger'], [2, 'a friend'], [5, 'trusted']],
  suspicion: [[0, 'not interested in you'], [3, 'watching you'], [6, 'closing in']],
  trust: [[-99, 'wants nothing to do with you'], [0, 'tolerates you'], [3, 'finds you interesting'], [5, 'likes you, against its better judgment'], [8, 'trusts you']],
};
const STANDING_NOTES = {
  machine: ['the Machine disapproves', 'the Machine approves'],
  union: ['the workers trust you less', 'the workers trust you more'],
  suspicion: ['the police lose interest', 'the police take an interest'],
  trust: ['Ithzar thinks less of you', 'Ithzar thinks better of you'],
};
const isBadNote = n => n.startsWith('−') || /disapproves|trust you less|take an interest|thinks less/.test(n);

function standingWord(kind) {
  let word = '';
  for (const [min, w] of STANDING_WORDS[kind]) if (state.standing[kind] >= min) word = w;
  return word;
}

// Suspicion fades with time: faster under the Machine's alderman, slower under the reformer.
function coolSuspicion() {
  const every = state.flags.rourke !== undefined ? 1 : state.flags.vance !== undefined ? 3 : 2;
  if (state.standing.suspicion > 0 && state.day % every === 0) state.standing.suspicion--;
}

// ---- requirements shared by place actions and street choices

function districtBlocker(dist) {
  if (dist.rank > rankIndex()) return `Only a ${RANKS[dist.rank].name} or higher has business here.`;
  if (dist.opensDay && state.day < dist.opensDay) return `The Fair opens on ${dateLabel(dist.opensDay, 'long')}.`;
  return null;
}

function choiceBlocker(ch) {
  const r = ch.req || {};
  if (ch.cost && state.dollars < ch.cost) return `You need $${ch.cost}.`;
  if (r.dollars && state.dollars < r.dollars) return `You need $${r.dollars}.`;
  if (r.rank && rankIndex() < r.rank) return `Requires the rank of ${RANKS[r.rank].name}.`;
  // your familiar is at your side, so it counts as well as servants
  if (r.servantTier && familiarTier() < r.servantTier && !state.servants.some(sv => demonById(sv.demonId).tier >= r.servantTier)) {
    return `Requires a servant or familiar: ${TIER_NAMES[r.servantTier]} or stronger.`;
  }
  if (r.known && !isKnown(demonById(r.known))) return 'You would need to know what it is.';
  if (r.emptyVessel && !Object.values(state.vessels).some(v => !v.spirit)) return 'You need an empty vessel.';
  for (const [k, n] of Object.entries(r.incense || {})) {
    if ((state.incense[k] || 0) < n) return `You need ${INCENSE[k].name.toLowerCase()}.`;
  }
  if (r.machine !== undefined && state.standing.machine < r.machine) return 'The Machine does not know you well enough.';
  if (r.union !== undefined && state.standing.union < r.union) return 'The workers do not trust you enough.';
  return null;
}

// Lantern, signet and story-flag choices are invisible until you qualify for them.
function choiceHidden(ch) {
  const r = ch.req || {};
  return Boolean((r.lantern && vesselTier('lantern') < r.lantern) || (r.ring && vesselTier('ring') < r.ring)
    || (r.flag && state.flags[r.flag] === undefined) || (r.ithzar && !ithzarPresent())
    || (ch.unless && state.flags[ch.unless] !== undefined));
}

// A familiar warns about choices that can hurt you; a strong one tells you the odds.
function familiarWarning(ch) {
  const ft = familiarTier();
  if (!ft) return '';
  const total = ch.outcomes.reduce((a, o) => a + o.w, 0);
  const risk = ch.outcomes.filter(o => o.fx.health < 0).reduce((a, o) => a + o.w, 0) / total;
  if (!risk) return '';
  const fam = familiarVoice();
  return ft >= 4 ? `${fam}: ${Math.round(risk * 100)}% chance this hurts` : `${fam} looks uneasy about this`;
}

// ---- places

// Everything you can do at a place right now: its standing actions plus any from current events.
// Keys: 'p:district:place:index' for standing actions, 'e:event:stage:index' for event actions.
function placeActions(dist, place) {
  const where = `${dist.id}:${place.id}`;
  const list = place.actions.map((a, i) => ({ a, key: `p:${where}:${i}` }));
  for (const { ev, st, stage } of activeEvents()) {
    if (stage.place === where) stage.actions.forEach((a, i) => list.push({ a, key: `e:${ev.id}:${st.stage}:${i}`, ev }));
  }
  return list.filter(({ a, key }) => !choiceHidden(a) && !(a.once && state.used[key] !== undefined));
}

function findAction(key) {
  const [kind, x, y, i] = key.split(':');
  if (kind === 'p') {
    const dist = districtById(x);
    const place = dist && placeById(dist, y);
    return place && place.actions[i] ? { a: place.actions[i], dist, place } : null;
  }
  const ev = eventById(x);
  const st = ev && state.events[ev.id];
  if (!st || st.done || st.stage !== Number(y)) return null; // the event has moved on
  const stage = ev.stages[st.stage];
  const [d, p] = stage.place.split(':');
  const dist = districtById(d);
  return stage.actions[i] ? { a: stage.actions[i], dist, place: placeById(dist, p), ev } : null;
}

function actionBlocker(a, key) {
  if (state.over) return 'The game is over.';
  if (state.encounter) return 'Finish what you started in the streets first.';
  if (state.actions < 1) return 'It is too late in the day.';
  const last = state.used[key];
  if (a.cooldown && last !== undefined && state.day < last + a.cooldown) {
    const wait = last + a.cooldown - state.day;
    return wait === 1 ? 'Not again until tomorrow.' : `Not again for ${wait} days.`;
  }
  return choiceBlocker(a);
}

function doAction(key) {
  const found = findAction(key);
  if (!found) return;
  const { a, dist, place, ev } = found;
  const closed = place.unless && state.flags[place.unless] !== undefined;
  if (closed || districtBlocker(dist) || choiceHidden(a) || actionBlocker(a, key) || (a.once && state.used[key] !== undefined)) return;
  state.actions--;
  state.used[key] = state.day;
  const out = resolveChoice(a, ev ? ev.title : place.name, dist, place.id);
  if (ev && out.fx.advance !== undefined && !state.over) setStage(ev, out.fx.advance);
  render();
}

// ---- the streets

function streetEncounters(dist) {
  return dist.street.filter(e => !(e.once && state.used[`s:${dist.id}:${e.id}`] !== undefined)
    && !(e.unless && state.flags[e.unless] !== undefined));
}

function currentEncounter() {
  if (!state.encounter) return null;
  const dist = districtById(state.encounter.district);
  const enc = dist && dist.street.find(e => e.id === state.encounter.id);
  return enc ? { dist, enc } : null;
}

function walkStreets(id) {
  const dist = districtById(id);
  const pool = dist ? streetEncounters(dist) : [];
  if (!pool.length || districtBlocker(dist) || state.encounter || state.actions < 1 || state.over) return;
  const fresh = pool.filter(e => e.id !== state.lastStreet[id]);
  const enc = pick(fresh.length ? fresh : pool);
  state.actions--;
  state.encounter = { district: id, id: enc.id };
  state.lastStreet[id] = enc.id;
  if (enc.flag && state.flags[enc.flag] === undefined) state.flags[enc.flag] = state.day;
  state.lastResult = null;
  log(`You spend an hour wandering ${dist.name}.`);
  render();
}

function chooseOption(i) {
  const cur = currentEncounter();
  if (!cur || state.over) return;
  const { dist, enc } = cur;
  const ch = enc.choices[i];
  if (!ch || choiceHidden(ch) || choiceBlocker(ch)) return;
  state.encounter = null;
  if (enc.once) state.used[`s:${dist.id}:${enc.id}`] = state.day;
  resolveChoice(ch, enc.title, dist, null);
  render();
}

// Pays a choice's cost, draws its outcome, applies the effects and records the result for display.
function resolveChoice(ch, title, dist, placeId) {
  if (ch.cost) state.dollars -= ch.cost;
  let roll = Math.random() * ch.outcomes.reduce((a, o) => a + o.w, 0);
  const out = ch.outcomes.find(o => (roll -= o.w) < 0) || ch.outcomes[ch.outcomes.length - 1];
  // log the outcome first so any lore it reveals appears after it in the chronicle
  const entry = log(`<b>${title}.</b> ${out.text}`);
  const { notes, frags } = applyEffects(out.fx, `lost in ${dist.name}`);
  if (ch.cost) notes.unshift(`−$${ch.cost}`);
  if (notes.length) entry.html += ` <span class="fx">(${notes.join(', ')})</span>`;
  const bad = notes.some(isBadNote);
  const good = notes.some(n => !isBadNote(n));
  entry.kind = good && !bad ? 'good' : bad && !good ? 'bad' : '';
  state.lastResult = { district: dist.id, place: placeId, title, choice: ch.label, text: out.text, notes, frags: frags.map(f => f.id) };
  const aside = !state.over && cityAside(dist);
  if (aside) {
    state.lastResult.aside = aside;
    logAside(aside);
  }
  return out;
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
      state.incense[k] = Math.max(0, (state.incense[k] || 0) + n);
      notes.push(`${n > 0 ? '+' : '\u2212'}${Math.abs(n)} ${INCENSE[k].name.toLowerCase()}`);
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

  if (fx.revealName) {
    const d = demonById(fx.revealName);
    d.trueName.forEach((syl, i) => recordFact(d.id, `syl:${i}:${syl}`));
    if (!state.met.includes(d.id)) state.met.push(d.id);
    notes.push(`${d.name}\u2019s true name is in your notebook`);
  }
  if (fx.standing) {
    for (const [k, v] of Object.entries(fx.standing)) {
      state.standing[k] = clamp(state.standing[k] + v, k === 'suspicion' ? 0 : -10, 10);
      notes.push(STANDING_NOTES[k][v > 0 ? 1 : 0]);
    }
  }
  for (const f of [].concat(fx.flag || [])) if (state.flags[f] === undefined) state.flags[f] = state.day;
  if (fx.clause && !state.clauses.includes(fx.clause)) {
    state.clauses.push(fx.clause);
    notes.push(`learned the Clause ${CLAUSES[fx.clause].name}`);
  }
  if (fx.corneliaClue) {
    const clue = corneliaClue(fx.corneliaClue);
    notes.push(clue ? `Cornelia\u2019s binding: ${clue}` : 'nothing new about Cornelia\u2019s binding');
  }
  if (fx.notebook) {
    const [id, ...facts] = fx.notebook;
    facts.forEach(f => recordFact(id, f));
    if (!state.met.includes(id)) state.met.push(id);
    notes.push(`${demonById(id).name}’s notebook: ${facts.map(factText).join('; ')}`);
  }
  if (fx.releaseIthzar) {
    state.ithzar.joined = false;
    state.flags['ithzar-released'] = state.day;
    state.flags[fx.releaseIthzar === 'kept' ? 'kept-promise' : 'ithzar-left'] = state.day;
    notes.push('Ithzar is gone');
  }
  if (fx.joinIthzar) {
    state.ithzar.joined = true;
    if (state.flags['ithzar-joined'] === undefined) state.flags['ithzar-joined'] = state.day;
    notes.push('Ithzar is your familiar');
  }
  if (fx.rep) {
    notes.push(`+${fx.rep} reputation`);
    gainRep(fx.rep);
  }
  if (fx.health > 0) {
    const before = state.health;
    state.health = Math.min(MAX_HEALTH, state.health + fx.health);
    if (state.health > before) notes.push(`+${state.health - before} health`);
  } else if (fx.health < 0) {
    notes.push(hurtNote(hurt(-fx.health, cause), -fx.health));
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
    case 'grimoire': price = grimoirePrice(); rank = 0;
      apply = () => {
        if (!learnFragment(1, Math.min(5, rankTier() + 1))) {
          log('The grimoire turns out to be a cookbook. The bookseller refunds you, grudgingly.');
          state.dollars += price;
        }
      }; break;
    case 'vessel': ({ price, rank } = VESSELS[id]);
      if (state.vessels[id]) return;
      apply = () => { state.vessels[id] = { cap: VESSELS[id].cap, spirit: null }; }; break;
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
    <div class="stat"><span class="k">Date</span><span class="v">${dateLabel(state.day)} · ${HOUR_NAMES[Math.ceil(state.actions / maxActions() * 3)]}</span></div>
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
    city: state.encounter || activeEvents().some(a => a.stage.place.startsWith('clark:')) ? '<span class="badge alert">!</span>' : '',
  };
  document.querySelectorAll('#tabs [data-tab]').forEach(b => {
    const t = b.dataset.tab;
    b.classList.toggle('active', t === currentTab);
    b.innerHTML = b.dataset.label + (badges[t] || '');
  });
}

function renderView() {
  const views = { chamber: viewChamber, city: viewCity, journal: viewJournal, servants: viewServants, workshop: viewWorkshop, market: viewMarket, cityhall: viewCityHall };
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
      ${ctl('Spirit to call', knownDemons().map(k => chip('name', k.id, `${k.name}<small>${TIER_NAMES[k.tier]}</small>`, s.name === k.id)).join('')
        + (leashActive() && state.clauses.includes('release') ? chip('name', RITE, 'Ithzar<small>release from Cornelia</small>', s.name === RITE) : ''))}
      ${d ? incantationHTML(d) : s.name === RITE ? riteHTML() : ''}
      ${s.name === RITE ? '' : clauseHTML()}
      ${ctl('Summoning circle', CIRCLES.filter(c => state.circles.includes(c.id)).map(c =>
        chip('circle', c.id, `${c.name}<small>holds up to ${TIER_NAMES[c.tier]}</small>`, s.circle === c.id)).join(''))}
      ${ctl('Your pentacle', PENTACLES.filter(p => state.pentacles.includes(p.id)).map(p =>
        chip('pentacle', p.id, `${p.name}<small>shields from ${TIER_NAMES[p.tier]}</small>`, s.pentacle === p.id)).join(''))}
      ${ctl(`Runes <small>${s.runes.length}/${MAX_RUNES}</small>`, state.runes.map(r =>
        chip('rune', r, `<span class="glyph">${RUNES[r].glyph}</span>${RUNES[r].name}`, s.runes.includes(r),
          !s.runes.includes(r) && s.runes.length >= MAX_RUNES)).join(''))}
      ${ctl('Incense', Object.keys(INCENSE).filter(k => state.incense[k] !== undefined).map(k =>
        chip('incense', k, `${INCENSE[k].name}<small>×${state.incense[k]}</small>`, s.incense === k, state.incense[k] < 1)).join(''))}
      ${d ? overreachHTML(d) : ''}
      <button class="primary big" data-action="summon" ${blocker || busy ? 'disabled' : ''}>Speak the summons <small>(1 hour)</small></button>
      <p class="hint">${busy ? 'The air grows thick…' : blocker || 'Speak carefully.'}</p>
      ${d && !busy ? familiarAdvice(d) : ''}
      ${d ? `<div class="notes"><h3>Notebook: ${d.name}</h3>${demonNotes(d, false)}${askButton(d)}</div>`
        : s.name === RITE ? `<div class="notes"><h3>Notebook: Cornelia\u2019s binding</h3>${corneliaSheetHTML()}</div>` : ''}
    </div>
  </div>`;
}

// The last part of the incantation: what kind of binding this is.
function clauseHTML() {
  const s = state.sel;
  const options = [chip('clause', 'service', `${CLAUSES.service.name}<small>servant ${state.servants.length}/${maxServants()}</small>`, s.clause === 'service')];
  if (state.clauses.includes('vessel')) {
    Object.keys(VESSELS).filter(k => state.vessels[k]).forEach(k => {
      const v = state.vessels[k];
      const inside = v.spirit ? `holds ${demonById(v.spirit).name}` : 'empty';
      options.push(chip('clause', `vessel:${k}`, `${CLAUSES.vessel.name}: ${VESSELS[k].name}<small>${inside} \u00b7 up to ${TIER_NAMES[v.cap]}</small>`, s.clause === `vessel:${k}`));
    });
  }
  if (state.clauses.includes('familiar')) {
    const current = state.familiar ? `replaces ${demonById(state.familiar).name}` : 'none yet';
    options.push(chip('clause', 'familiar', `${CLAUSES.familiar.name}<small>${current}</small>`, s.clause === 'familiar'));
  }
  const kind = s.clause.startsWith('vessel:') ? 'vessel' : s.clause;
  return `<div class="ctl"><h3>Binding clause</h3><div class="chips">${options.join('')}</div>
    <p class="muted small clause-desc">${CLAUSES[kind].desc}</p></div>`;
}

// A familiar of class 2 or more points out mistakes the notebook already knows about.
function familiarAdvice(d) {
  if (familiarTier() < 2) return '';
  const s = state.sel;
  const k = dossier(d);
  const notes = [];
  s.syllables.forEach((syl, i) => {
    if (syl && (k.absent.has(syl) || (k.name[i] && k.name[i] !== syl))) notes.push(`${sylHTML(syl, 'none')} does not go there`);
  });
  if (circleById(s.circle).tier < d.tier) notes.push(`that circle will not hold a ${TIER_NAMES[d.tier].toLowerCase()}`);
  s.runes.forEach(r => { if (k.runeNo.includes(r)) notes.push(`the ${RUNES[r].name} rune does nothing for it`); });
  k.runeYes.forEach(r => { if (!s.runes.includes(r)) notes.push(`you have left out the ${RUNES[r].name} rune`); });
  if (s.incense && s.incense === k.hates) notes.push(`it hates ${INCENSE[s.incense].name.toLowerCase()}`);
  if (!notes.length) return '';
  return `<p class="familiar-says"><b>${familiarVoice()}</b> clears its throat: ${notes.join('; ')}.</p>`;
}

function riteHTML() {
  return `<div class="ctl incantation"><h3>The rite of Release</h3>
    <p class="muted small">Ithzar will speak its own name. Set out the circle, runes and incense Cornelia used, and you speak the Clause of Release. Get it wrong and the leash snaps back.</p></div>`;
}

// The true-name builder: one slot per syllable, and a palette of syllables colored by what the notebook knows.
function incantationHTML(d) {
  const s = state.sel;
  const k = dossier(d);
  const slots = s.syllables.map((syl, i) => {
    const cls = !syl ? 'empty' : k.name[i] === syl ? 'exact' : '';
    return `<button class="slot ${cls}" data-action="slot" data-value="${i}" ${busy ? 'disabled' : ''}
      title="${syl ? 'Click to clear' : 'Choose a syllable below'}">${syl || '?'}</button>`;
  }).join('<span class="dot">·</span>');
  const keyState = syl => (k.name.includes(syl) ? 'exact' : k.nearby.includes(syl) ? 'near' : k.absent.has(syl) ? 'none' : '');
  const keyTitle = { exact: 'Confirmed in the name', near: 'In the name, position unknown', none: 'Not in this name', '': 'Untested' };
  const palette = SYLLABLES.map(syl => {
    const st = keyState(syl);
    return `<button class="syl-key ${st} ${s.syllables.includes(syl) ? 'used' : ''}" data-action="syl" data-value="${syl}"
      title="${keyTitle[st]}" ${busy ? 'disabled' : ''}>${syl}</button>`;
  }).join('');
  return `<div class="ctl incantation">
    <h3>True name <small>${d.trueName.length} syllables</small></h3>
    <div class="slots">${slots}</div>
    <div class="palette">${palette}</div>
  </div>`;
}

function manifestHTML() {
  if (busy) return `<div class="manifest pending"><p>You begin the incantation. The candles gutter; the chalk lines shiver…</p></div>`;
  if (!manifestation) return `<div class="manifest empty"><p>Choose a spirit, speak its true name syllable by syllable, and set out the right circle, runes and incense. Every attempt teaches you something, and your notebook keeps track. Get it wrong and you had better trust your pentacle.</p></div>`;
  const m = manifestation;
  const labels = m.rite ? { firm: 'Released', broken: 'Rebounded' }
    : { firm: 'Bound firmly', uneasy: 'Bound uneasily', broken: 'Broke free', silence: 'No answer' };
  return `<div class="manifest outcome-${m.outcome}">
    <div class="m-head"><h3>${m.demon.name} <small>${TIER_NAMES[m.demon.tier]}</small></h3><span class="tag">${labels[m.outcome]}</span></div>
    <div class="slots spoken">${m.spoken.map((syl, i) => sylHTML(syl, m.feedback[i])).join('<span class="dot">·</span>')}</div>
    ${m.lines.map(l => `<p>${l}</p>`).join('')}
    ${m.greet ? `<blockquote>${m.greet}</blockquote><p class="footnote">${m.footnote}</p>` : ''}
    ${m.aside ? asideHTML(m.aside) : ''}
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

  const spoken = s.name === RITE ? 'ITHZAR' : s.syllables.map(x => x || '\u2014').join(' \u00b7 ');

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
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="true-name ${s.syllables.length > 3 ? 'long' : ''}">${spoken}</text>
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
  <div class="newspaper panel">
    <div class="masthead"><span class="paper-name">${NEWSPAPER}</span><span class="paper-date">${dateLabel(state.day, 'long')}</span></div>
    ${headlines().map(h => `<p class="headline">${h}</p>`).join('')}
  </div>
  <div class="city">
    <div class="stage map">${cityMapSVG(dist.id)}</div>
    <div class="panel district">${cur ? encounterHTML(cur) : districtHTML(dist)}</div>
  </div>`;
}

function dangerPips(n) {
  return `<span class="pips" title="Danger ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

// One button for a place action or a street choice, with its cost, the familiar's warning and any blocker.
function choiceButton(ch, action, value, blocker, eventTitle = '') {
  const warning = familiarWarning(ch);
  const via = ch.req && ch.req.lantern ? 'lantern' : ch.req && ch.req.ring ? 'signet' : '';
  return `<button class="choice ${via ? 'revealed' : ''} ${eventTitle ? 'event' : ''}" data-action="${action}" data-value="${value}" ${blocker ? 'disabled' : ''}>
    <span>${ch.label}</span>${eventTitle ? `<small class="via">${eventTitle}</small>` : ''}${via ? `<small class="via">${via}</small>` : ''}${ch.cost && !ch.label.includes('$') ? `<small class="cost">$${ch.cost}</small>` : ''}
    ${warning ? `<small class="risk">⚠ ${warning}</small>` : ''}
    ${blocker ? `<small class="why">${blocker}</small>` : ''}
  </button>`;
}

function resultHTML(r) {
  return `<div class="result">
    <p>${r.text}</p>
    ${r.frags.map(id => FRAGMENTS.find(f => f.id === id)).map(f => `<p class="frag"><span class="src">${f.src}</span>“${fmtLore(f.text)}”</p>`).join('')}
    ${r.notes.length ? `<p class="fx">${r.notes.join(' · ')}</p>` : ''}
    ${r.aside ? asideHTML(r.aside) : ''}
  </div>`;
}

function districtHTML(dist) {
  const blocked = districtBlocker(dist);
  const head = `<div class="d-head"><h2>${dist.name}</h2>${dist.danger
    ? `<span class="tag">Danger ${dangerPips(dist.danger)}</span>` : '<span class="tag">Home</span>'}</div>
    <p>${dist.desc}</p>`;
  if (blocked) return `${head}<p class="hint">${blocked}</p>`;
  const r = state.lastResult && state.lastResult.district === dist.id ? state.lastResult : null;

  const places = dist.places.map(place => {
    if (place.unless && state.flags[place.unless] !== undefined) {
      return `<section class="place closed"><h3>${place.name}</h3><p class="muted small">${place.closed}</p></section>`;
    }
    const acts = placeActions(dist, place);
    return `<section class="place ${acts.some(x => x.ev) ? 'has-event' : ''}">
      <h3>${place.name}</h3>
      <p class="muted small">${place.desc}</p>
      ${activeEvents().filter(x => x.stage.place === `${dist.id}:${place.id}` && x.stage.text).map(x => `<p class="event-text">${x.stage.text}</p>`).join('')}
      <div class="choices">${acts.map(({ a, key, ev }) => choiceButton(a, 'act', key, actionBlocker(a, key), ev ? ev.title : '')).join('')}</div>
      ${r && r.place === place.id ? resultHTML(r) : ''}
    </section>`;
  }).join('');

  const label = dist.streetLabel || 'Walk the streets';
  const streetBlocker = state.over ? 'The game is over.' : state.actions < 1 ? 'It is too late in the day.' : null;
  const streets = streetEncounters(dist).length ? `<section class="place streets">
      <h3>${label}</h3>
      <p class="muted small">Wander for an hour and see what turns up.</p>
      <div class="choices"><button class="choice" data-action="walk" data-value="${dist.id}" ${streetBlocker ? 'disabled' : ''}>
        <span>${label}</span>${streetBlocker ? `<small class="why">${streetBlocker}</small>` : ''}</button></div>
      ${r && r.place === null ? `<h4>${r.title}</h4>${resultHTML(r)}` : ''}
    </section>` : '';

  return `${head}<p class="muted small">Everything here takes an hour. You have ${state.actions} left today.</p>${places}${streets}`;
}

function encounterHTML({ dist, enc }) {
  return `
    <div class="d-head"><h2>${enc.title}</h2><span class="tag">${dist.name}</span></div>
    <p>${enc.text}</p>
    <div class="choices">
      ${enc.choices.map((ch, i) => (choiceHidden(ch) ? '' : choiceButton(ch, 'choose', i, choiceBlocker(ch)))).join('')}
    </div>`;
}

function cityMapSVG(selectedId) {
  const grid = [];
  for (let x = 20; x < 480; x += 28) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="520"/>`);
  for (let y = 14; y < 520; y += 28) grid.push(`<line x1="0" y1="${y}" x2="480" y2="${y}"/>`);
  const shore = 'M 478 0 C 468 90, 482 170, 470 250 S 462 400, 492 520';
  const events = activeEvents();

  const markers = DISTRICTS.map(d => {
    const locked = !!districtBlocker(d);
    const sel = d.id === selectedId;
    const pending = state.encounter && state.encounter.district === d.id;
    const news = !locked && events.some(a => a.stage.place.startsWith(`${d.id}:`));
    const lockText = d.rank > rankIndex() ? RANKS[d.rank].name : locked ? `Opens ${dateLabel(d.opensDay)}` : '';
    const labelY = d.y + 34;
    return `<g class="d-marker ${locked ? 'locked' : ''} ${sel ? 'sel' : ''} ${pending ? 'pending' : ''} ${d.id === 'clark' ? 'home' : ''}" data-district="${d.id}" tabindex="0" role="button" aria-label="${d.name}">
      <circle class="halo" cx="${d.x}" cy="${d.y}" r="24"/>
      <circle class="dot" cx="${d.x}" cy="${d.y}" r="15"/>
      <text class="initial" x="${d.x}" y="${d.y + 5}" text-anchor="middle">${d.id === 'clark' ? '⌂' : d.name.replace(/^The /, '')[0]}</text>
      ${news ? `<circle class="news" cx="${d.x + 13}" cy="${d.y - 13}" r="6"/>` : ''}
      <text class="name" x="${d.x}" y="${labelY}" text-anchor="middle">${d.name}</text>
      ${lockText ? `<text class="lock" x="${d.x}" y="${labelY + 15}" text-anchor="middle">${lockText}</text>` : ''}
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
    <text class="river-label" x="420" y="166" text-anchor="middle">Chicago River</text>
    <text class="area-label" x="447" y="208" text-anchor="middle">THE LOOP</text>
    ${markers}
  </svg>`;
}

// ---- journal

const DEDUCED = '<span class="ded" title="Worked out by elimination">✶</span>';

// The requirements sheet: everything known about a spirit, filled in automatically.
function dossierHTML(d) {
  const k = dossier(d);
  const nameRow = k.name.map((syl, i) => (syl
    ? sylHTML(syl, 'exact') + (k.nameDeduced[i] ? DEDUCED : '')
    : '<span class="syl unknown">?</span>')).join('<span class="dot">·</span>');
  const nameExtra = [];
  if (!k.nameComplete && k.nearby.length) nameExtra.push(`also in it: ${k.nearby.map(x => sylHTML(x, 'near')).join(' ')}`);
  if (!k.nameComplete && k.absent.size) nameExtra.push(`not in it: ${[...k.absent].map(x => sylHTML(x, 'none')).join(' ')}`);

  const runeLabel = r => `${RUNES[r].name}${k.runeDeduced.has(r) ? DEDUCED : ''}`;
  const runeBits = [];
  if (k.runeCount !== null) runeBits.push(`needs ${k.runeCount}`);
  if (k.runeYes.length) runeBits.push(`✓ ${k.runeYes.map(runeLabel).join(', ')}`);
  if (k.runeCount !== null && k.runeYes.length === k.runeCount) runeBits.push('no others');
  else if (k.runeNo.length) runeBits.push(`✗ ${k.runeNo.map(runeLabel).join(', ')}`);

  const incName = i => INCENSE[i].name.toLowerCase();
  const incBits = [
    `likes ${k.likes ? incName(k.likes) + (k.likesDeduced ? DEDUCED : '') : '?'}`,
    `hates ${k.hates ? incName(k.hates) + (k.hatesDeduced ? DEDUCED : '') : '?'}`,
  ];
  if (k.neutral.length && !(k.likes && k.hates)) incBits.push(`indifferent to ${k.neutral.map(incName).join(', ')}`);

  return `<dl class="sheet">
    <dt>Name</dt><dd><div class="slots small">${nameRow}</div>${nameExtra.length ? `<div class="small muted">${nameExtra.join(' · ')}</div>` : ''}</dd>
    <dt>Runes</dt><dd>${runeBits.join(' · ') || '?'}</dd>
    <dt>Incense</dt><dd>${incBits.join(' · ')}</dd>
    <dt>Circle</dt><dd>one that holds ${TIER_NAMES[d.tier].toLowerCase()}s</dd>
  </dl>`;
}

function demonNotes(d, openLore) {
  const frags = d.lore.filter((_, i) => state.lore.includes(`${d.id}-${i}`));
  return `${dossierHTML(d)}${claimsHTML(d)}
    ${frags.length ? `<details class="lore" ${openLore ? 'open' : ''}><summary>Lore (${frags.length} of ${d.lore.length})</summary>
      ${frags.map(f => `<p class="frag"><span class="src">${f.src}</span>“${fmtLore(f.text)}”</p>`).join('')}
    </details>` : '<p class="muted small">You have read nothing about it. Everything here came from the chamber.</p>'}`;
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
          ${demonNotes(d, true)}
          <button class="ghost" data-action="prepare" data-value="${d.id}">Prepare a summoning</button>
        </article>`).join('')}
    </div>
  </div>`;
}

// ---- servants

// The errands a spirit of this class could run tonight, with its odds, as <option>s.
function errandOptions(sv, tier, selected) {
  const c = currentCommission();
  const opts = Object.entries(ERRANDS).filter(([, e]) => !e.available || e.available(state)).map(([k, e]) =>
    `<option value="${k}" ${selected === k ? 'selected' : ''}>${e.name} (${Math.round(errandChance(sv, e.diff(tier), tier) * 100)}%)</option>`);
  if (c && c.type === 'errand') {
    opts.push(`<option value="commission" ${selected === 'commission' ? 'selected' : ''}>City Hall: ${c.title} (${Math.round(errandChance(sv, c.diff, tier) * 100)}%)</option>`);
  }
  return opts.join('');
}

function viewServants() {
  const cap = `<p>You may hold ${maxServants()} spirit${maxServants() > 1 ? 's' : ''} at your rank. Errands are carried out overnight, and repeat each night until changed.</p>`;
  if (!state.servants.length) {
    return `<div class="panel"><h2>Your Servants</h2>${cap}<p class="muted">No spirit currently serves you. The chamber awaits.</p></div>
      ${state.ithzar.joined ? `<div class="cards">${ithzarFavorCard()}</div>` : ''}`;
  }
  const c = currentCommission();
  return `<div class="panel"><h2>Your Servants</h2>${cap}</div>
  <div class="cards">
    ${ithzarFavorCard()}
    ${state.servants.map(sv => {
      const d = demonById(sv.demonId);
      const opts = [errandOptions(sv, d.tier, sv.errand)];
      const desc = sv.errand && sv.errand !== 'commission' ? ERRANDS[sv.errand].desc : sv.errand === 'commission' ? c.text : '';
      return `<article class="panel card servant ${sv.binding}">
        <header><h3>${d.name}</h3><span class="tag">${TIER_NAMES[d.tier]} · ${sv.binding === 'firm' ? 'firmly bound' : 'uneasily bound'}</span></header>
        <p class="muted">Appears as ${d.form}.</p>
        <p class="${sv.patience <= 1 ? 'warn' : ''}">${sv.patience <= 1
          ? (sv.binding === 'firm' ? 'Its service ends tonight.' : 'Its bonds will snap tonight unless you dismiss it!')
          : `Will serve ${sv.patience} more nights.`}</p>
        ${sv.strained ? '<p class="warn small">Strained: held by a circle too small for it. It may break loose any night.</p>' : ''}
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

// ---- workshop

function viewWorkshop() {
  return `
  <div class="workshop">
    <div class="panel">
      <h2>The Workshop</h2>
      <p>Spirits bound here are yours for good. Vessels and familiars never run errands and never run out of patience, but binding one takes a firm, perfect binding.</p>
      <p class="muted small">Clauses you know: ${state.clauses.map(c => `<i>${CLAUSES[c].name}</i>`).join(', ')}.</p>
    </div>
    ${ithzarCard()}
    <h2 class="section-title">Familiar</h2>
    ${familiarCard()}
    <h2 class="section-title">Vessels</h2>
    ${!state.clauses.includes('vessel') ? '<p class="muted">You have not learned the Clause of the Vessel, so these are only curios for now.</p>' : ''}
    <div class="cards">${Object.keys(VESSELS).filter(k => state.vessels[k]).map(vesselCard).join('')
      || '<p class="muted">You own no vessels. Wabash Avenue sells them.</p>'}</div>
  </div>`;
}

function familiarCard() {
  if (!state.clauses.includes('familiar')) {
    return '<p class="muted">You have not learned the Clause of the Familiar. City Hall may have reason to teach it to you, in time.</p>';
  }
  const fam = state.familiar && demonById(state.familiar);
  const ft = familiarTier();
  return `<article class="panel card familiar">
    <header><h3>${fam ? fam.name : 'No familiar yet'}</h3>${fam ? `<span class="tag">${TIER_NAMES[fam.tier]}</span>` : ''}</header>
    ${fam && familiarResting('own') ? `<p class="warn small">Resting after bracing a circle. Back on ${dateLabel(state.familiarOut.own, 'long')}.</p>` : ''}
    <p class="muted">${fam ? `Appears as ${fam.form}. It goes everywhere with you, and counts as a servant at your side in the city.`
      : 'Bind one in the chamber with the Clause of the Familiar. A stronger spirit makes a more useful familiar.'}</p>
    <ul class="abilities">
      ${FAMILIAR_ABILITIES.map(a => `<li class="${a.tier <= ft ? 'on' : ''}"><span class="tag">${TIER_NAMES[a.tier]}</span>${a.text}</li>`).join('')}
    </ul>
    <div class="row-btns">
      <button class="ghost" data-action="bind-into" data-value="familiar">${fam ? 'Bind a stronger familiar' : 'Bind a familiar'}</button>
      ${fam ? `<button class="ghost" data-action="release-familiar">Release ${fam.name}</button>` : ''}
    </div>
  </article>`;
}

function vesselCard(type) {
  const v = state.vessels[type];
  const def = VESSELS[type];
  const sp = v.spirit && demonById(v.spirit);
  const t = sp ? sp.tier : 0;
  const next = v.cap + 1;
  let reinforceBtn = '';
  if (next <= 5) {
    reinforceBtn = rankIndex() >= next - 1
      ? `<button data-action="reinforce" data-value="${type}" ${state.dollars < VESSEL_CAP_COST[next] ? 'disabled' : ''}>Reinforce to hold ${TIER_NAMES[next].toLowerCase()}s · $${VESSEL_CAP_COST[next]}</button>`
      : `<span class="locked">Reinforce: ${RANKS[next - 1].name}</span>`;
  }
  const studying = type === 'scrying' && sp
    ? `<p class="muted small">Studying ${state.sel.name ? demonById(state.sel.name).name : 'nothing'}: whichever spirit is selected in the chamber.</p>` : '';
  return `<article class="panel card vessel ${sp ? 'filled' : ''}">
    <header><h3>${def.name}</h3><span class="tag">holds up to ${TIER_NAMES[v.cap]}</span></header>
    <p class="muted small">${def.desc}</p>
    ${sp ? `<p><b>${sp.name}</b> (${TIER_NAMES[t].toLowerCase()}) is sealed inside. ${def.effect(t)}</p>`
      : `<p>Empty. With an imp inside: ${def.effect(1)}</p>`}
    ${sp && t < 5 ? `<p class="muted small">With a ${TIER_NAMES[t + 1].toLowerCase()} inside: ${def.effect(t + 1)}</p>` : ''}
    ${studying}
    <div class="row-btns">
      ${state.clauses.includes('vessel') ? `<button class="ghost" data-action="bind-into" data-value="vessel:${type}">${sp ? 'Bind a stronger spirit' : 'Bind a spirit into it'}</button>` : ''}
      ${sp ? `<button class="ghost" data-action="release-vessel" data-value="${type}">Release ${sp.name}</button>` : ''}
      ${reinforceBtn}
    </div>
  </article>`;
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
  const vessels = Object.entries(VESSELS).map(([k, v]) => shopRow(`${v.name} <small>holds up to ${TIER_NAMES[v.cap]}</small>`, v.desc, v.price, v.rank, !!state.vessels[k], `vessel:${k}`)).join('');
  return `
  <div class="market">
    <section class="panel"><h2>Hobb &amp; Daughters, Maxwell Street</h2><p class="muted">Incense, candles, and no questions.</p>${incense}</section>
    <section class="panel"><h2>A Dearborn Street Bookseller</h2>
      ${shopRow('A battered grimoire', 'May contain lore on spirits up to one rank above your own. May contain recipes.', grimoirePrice(), 0, false, 'grimoire:x')}
      ${runes}
    </section>
    <section class="panel"><h2>The South Branch Foundries</h2><p class="muted">Circles for your spirits; pentacles for yourself.</p>${circles}${pents}</section>
    <section class="panel"><h2>Curiosities of Wabash Avenue</h2><p class="muted">Vessels for spirits. ${state.clauses.includes('vessel') ? 'Bind a spirit into one with the Clause of the Vessel.' : 'Of little use until you learn the Clause of the Vessel.'}</p>${vessels}</section>
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
      ${c ? `<h3>${c.title}</h3><p>${c.text}</p><p>${req}</p><p class="muted">Reward: ${c.rep} reputation, $${commissionPay(c)}${c.gift ? `, a ${VESSELS[c.gift].name.toLowerCase()}` : ''}${c.teaches ? `, and the Clause ${CLAUSES[c.teaches].name}` : ''}.</p>`
          : '<p>City Hall has nothing further to ask of you. It is, frankly, a little afraid of you.</p>'}
    </section>
    <section class="panel"><h2>Your standing</h2>
      <p>To the Machine, you are <b>${standingWord('machine')}</b>. To the workers in the Yards, you are <b>${standingWord('union')}</b>. The police are <b>${standingWord('suspicion')}</b>.</p>
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
        <li>In the <b>Chamber</b>, speak a spirit’s <b>true name</b> syllable by syllable, and set out the right circle, runes and incense. Every failure teaches you something, and your notebook fills itself in.</li>
        <li>In time you will learn to seal spirits into <b>vessels</b>, tools that grow stronger with a stronger spirit inside, and to bind a <b>familiar</b> that stays at your side.</li>
        <li>Bound spirits run <b>errands</b> overnight: coin, stolen incense, secrets.</li>
        <li>Complete <b>City Hall</b> commissions to rise through the Machine and unlock stronger circles, rarer incense and new parts of the city.</li>
        <li>A failed binding sets the spirit loose. Only your <b>pentacle</b> stands between you and it.</li>
      </ul>
      <button class="primary big" data-action="close-intro">Pick up the chalk</button>`;
  } else if (state.over === 'dead') {
    html = `<h1>The Chalk Is Swept Away</h1>
      <p>On ${dateLabel(state.day, 'long')}, you were ${state.deathCause}.</p>
      <p>City Hall sends a clerk to inventory your workshop. He finds a scorched pair of shoes and a journal, which he files under <i>Cautionary</i>.</p>
      <button class="primary big" data-action="restart">Begin anew</button>`;
  } else if (state.over === 'won') {
    html = `<h1>The Deep One Is Bound</h1>
      <p>On ${dateLabel(state.day, 'long')}, Shem-Ashara rose from beneath Lake Michigan and knelt — after a fashion — within your obsidian rings.</p>
      <p>You are, by any measure, the most powerful magician in Chicago. Which is, of course, precisely when the trouble starts.</p>
      ${ithzarEpilogue() ? `<p><i>${ithzarEpilogue()}</i></p>` : ''}
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
      case 'overreach': s.overreach = !s.overreach; break;
      case 'brace': s.brace = s.brace.includes(v) ? s.brace.filter(b => b !== v) : [...s.brace, v]; break;
      case 'name': s.name = v; resetIncantation(); break;
      default: s[el.dataset.pick] = v;
    }
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'summon': beginSummon(); break;
    case 'syl': if (!busy) { toggleSyllable(el.dataset.value); render(); } break;
    case 'slot': if (!busy) { state.sel.syllables[Number(el.dataset.value)] = null; render(); } break;
    case 'end-day': endDay(); break;
    case 'study': study(); break;
    case 'reinforce': reinforce(el.dataset.value); break;
    case 'release-vessel': releaseVessel(el.dataset.value); render(); break;
    case 'release-familiar': releaseFamiliar(); render(); break;
    case 'bind-into':
      state.sel.clause = el.dataset.value;
      currentTab = 'chamber';
      render();
      break;
    case 'walk': walkStreets(el.dataset.value); break;
    case 'act': doAction(el.dataset.value); break;
    case 'choose': chooseOption(Number(el.dataset.value)); break;
    case 'dismiss': dismiss(Number(el.dataset.value)); break;
    case 'ask': askIthzar(el.dataset.value); break;
    case 'prepare':
      state.sel.name = el.dataset.value;
      resetIncantation();
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
  if (e.target.dataset.favor) {
    if (!favorBlocker()) state.ithzar.favor = e.target.value || null;
    render();
    return;
  }
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
  resetIncantation();
  log('You unlock the door of Mr. Thwaite’s workshop. It smells of chalk and something burnt.', 'info');
  render();
}

// ---------- boot

state = load();
if (!state) restart(true);
else {
  const d = state.sel.name && demonById(state.sel.name);
  if (!d || state.sel.syllables.length !== d.trueName.length) resetIncantation();
  render();
}
