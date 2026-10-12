'use strict';
// Ithzar's rules: when it is around, its remarks and banter, Cornelia's binding and the rite of
// Release, asking it things, and its favors. Its lines and story events are in js/ithzar.js.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

// Ithzar is with you today: it has joined you and isn't out (its first term: it comes and goes as it pleases).
const ithzarHere = () => state.ithzar.joined && state.ithzar.awayDay !== state.day && !familiarResting('ithzar');

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
  if (!(ithzarPresent() || braced) || random() > (state.ithzar.joined ? 0.7 : 0.5)) return null;
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
  if (fam && random() < 0.25) aside = banter(fam);
  else if (random() < 0.3) aside = ithzarLine(`city:${dist.id}`);
  if (aside) state.ithzar.asideDay[dist.id] = state.day;
  return aside;
}

function logAside(a) {
  log(a.lines.map(l => `<b>${l.name}:</b> ${l.text}`).join(' ') + (a.note ? ` <span class="note">${a.note}</span>` : ''), 'aside');
}

// Each morning: Ithzar may be out for the day; otherwise a warning if the police are getting close,
// or a note on its doings.
function ithzarDawn() {
  if (state.ithzar.joined && random() < 1 / 7) {
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
  } else if (random() < 0.3) {
    log(pickFresh('dawn', ITHZAR_LINES.dawn), 'aside');
  }
}

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
    m.lines.push(`The <b>${RUNES[r].name}</b> rune catches on the leash and pulls a strand of it loose.`);
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
    m.lines.push('The air in the room goes taut, then parts like a fiddle string. Ithzar opens its eyes. For the first time since you met it, it has nothing to say. Then it is gone.');
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
  const claim = random() < lieChance ? falseFact(d, truth) : truth;
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
