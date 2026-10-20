'use strict';
// Spirits bound to you: servants and their errands, vessels, familiars, and the scrying glass.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

const vesselTier = type => {
  const v = state.vessels[type];
  return v && v.spirit ? demonById(v.spirit).tier : 0;
};

const familiarTier = () => Math.max(ownFamiliar() ? ownFamiliar().tier : 0, ithzarHere() ? ITHZAR.tier : 0);

// whoever speaks up with warnings: Ithzar when it's with you, otherwise your own familiar
const familiarVoice = () => (ithzarHere() ? ITHZAR.name : ownFamiliar() ? ownFamiliar().name : '');

const maxActions = () => ACTIONS_PER_DAY + (vesselTier('watch') ? watchHours(vesselTier('watch')) : 0) + (familiarTier() >= 5 ? 1 : 0);

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

// Spirits remember how their last time with you ended, and it colors the next summoning:
//   kind     you dismissed it with nights still owed, or released it from a vessel or as a familiar (+1 to the next binding)
//   grudge   you let its uneasy bonds snap (−1)
//   escaped  it broke out of your circle
//   served   its term ran out
// While a spirit is in your service its parting is null. Greetings for each mood are in DEMONS[].returns.
const MEMORY_MOD = { kind: 1, grudge: -1 };

function remember(id, parting) {
  const mem = state.memory[id] || (state.memory[id] = { times: 0, parting: null });
  mem.parting = parting;
}

function releaseVessel(type, quiet = false) {
  const v = state.vessels[type];
  if (!v || !v.spirit) return;
  remember(v.spirit, 'kind');
  if (!quiet) log(`You crack the seal. ${bold(demonById(v.spirit))} unfolds from your ${VESSELS[type].name.toLowerCase()}, stretches, and leaves with a remark about the accommodations.`);
  v.spirit = null;
}

function releaseFamiliar(quiet = false) {
  if (!state.familiar) return;
  remember(state.familiar, 'kind');
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
    const idle = [
      `The scrying glass shows ${bold(glass)} examining its fingernails. There is nothing within its reach you do not already know.`,
      `${bold(glass)} has fogged the scrying glass from the inside and drawn a face in it. It has nothing new to show you.`,
      `The scrying glass shows only ${bold(glass)}, asleep. Everything it can see, you already know.`,
    ];
    log(idle[state.day % idle.length]);
    return;
  }
  const facts = unknownFacts(d).sort(() => random() - 0.5).slice(0, t);
  facts.forEach(f => recordFact(d.id, f));
  log(`In the scrying glass, ${bold(glass)} shows you ${bold(d)}: ${facts.map(factText).join('; ')}.`, 'lore');
}

// A familiar recovering from bracing a circle is no use to you while state.day < its familiarOut day.
const familiarResting = key => state.day < (state.familiarOut[key] || 0);

const ownFamiliar = () => (state.familiar && !familiarResting('own') ? demonById(state.familiar) : null);

// What a spirit is good and bad at (DEMONS[].temper): +1 for its specialty, -1 for the errand it dislikes, else 0.
// City Hall's commission and ward errands count together as 'cityhall'.
const errandKind = errand => (errand === 'commission' || (errand || '').startsWith('job:') ? 'cityhall' : errand);
function temperOf(d, errand) {
  const t = d && d.temper;
  if (!t || !errand) return 0;
  const kind = errandKind(errand);
  return [].concat(t.good).includes(kind) ? 1 : t.bad === kind ? -1 : 0;
}

// The notebook learns a spirit's temper the first time it runs an errand for you.
const temperKnown = d => state.tempers[d.id] !== undefined;

function temperText(d) {
  const t = d.temper;
  return `good at ${[].concat(t.good).map(k => TEMPER_WORDS[k]).join(' or ')} and bad at ${TEMPER_WORDS[t.bad]}`;
}

function errandChance(sv, diff, tier = demonById(sv.demonId).tier, errand = null) {
  const temper = sv.demonId ? temperOf(demonById(sv.demonId), errand) : 0;
  return clamp(0.55 + 0.2 * (tier - diff) + (sv.binding === 'firm' ? 0.15 : 0) + [ -0.15, 0, 0.2 ][temper + 1], 0.1, 0.95);
}

function errandDiff(errand, tier) {
  if (errand === 'commission') return currentCommission().diff;
  if (errand.startsWith('job:')) return jobForErrand(errand).diff;
  return ERRANDS[errand].diff(tier);
}

// Errands this spirit can be sent on tonight: the shared ones, and its own.
const errandsFor = d => Object.entries(ERRANDS).filter(([, e]) => (!e.for || e.for === d.id) && (!e.available || e.available(state)));

function coinAmount(tier) {
  return [0, rand(5, 9), rand(12, 18), rand(24, 34), rand(45, 60), rand(80, 100)][tier];
}

function runErrand(sv, d = demonById(sv.demonId)) {
  if (errandOutcome(sv, d) !== false) learnTemper(d);
}

// Runs one night's errand and reports it. Returns false if the errand could not be run at all.
function errandOutcome(sv, d) {
  const vars = { name: bold(d) };
  if (sv.errand === 'commission') {
    const c = currentCommission();
    if (!c || c.type !== 'errand') { sv.errand = null; return false; }
  }
  if (sv.errand.startsWith('job:') && !jobForErrand(sv.errand)) { sv.errand = 'coin'; } // the job lapsed or was done
  const job = jobForErrand(sv.errand);
  const e = ERRANDS[sv.errand];
  if (e && ((e.available && !e.available(state)) || (e.for && e.for !== d.id))) { sv.errand = null; return false; }
  const temper = temperOf(d, sv.errand);
  const own = (key, base) => (d.temper && d.temper[key] && d.temper[key].length ? d.temper[key] : base);
  const succeeded = random() < errandChance(sv, errandDiff(sv.errand, d.tier), d.tier, sv.errand);

  if (!succeeded) {
    if (sv.binding === 'uneasy' && random() < 0.5) return twist(d);
    const base = ERRAND_TEXT[job ? 'commission' : sv.errand].fail;
    log(fill(pick(temper < 0 ? own('badText', base) : base), vars), 'bad');
    return;
  }

  const good = temper > 0;
  // the better haul a spirit brings home from its specialty
  if (job || sv.errand === 'commission') {
    if (good && d.temper.goodText) {
      log(fill(pick(d.temper.goodText), vars));
      learnFragment(1, d.tier); // Querrin reads the mail on the way
    }
    return job ? completeJob(job) : completeCommission();
  }
  switch (sv.errand) {
    case 'coin': {
      const amt = Math.round(coinAmount(d.tier) * (good ? 1.5 : 1));
      state.dollars += amt;
      log(fill(pick(good ? own('goodText', ERRAND_TEXT.coin.ok) : ERRAND_TEXT.coin.ok), { ...vars, amt }), 'good');
      break;
    }
    case 'pilfer': {
      const items = grantRandomIncense(d.tier + rand(0, 1) + (good ? 2 : 0), d.tier);
      log(fill(pick(good ? own('goodText', ERRAND_TEXT.pilfer.ok) : ERRAND_TEXT.pilfer.ok), { ...vars, items }), 'good');
      if (good && d.temper.extra === 'brag' && random() < 0.4) {
        state.standing.suspicion = Math.min(10, state.standing.suspicion + 1);
        log(`${bold(d)} has also told half the Levee about it. (the police take an interest)`, 'bad');
      }
      break;
    }
    case 'gossip': {
      log(fill(pick(good ? own('goodText', ERRAND_TEXT.gossip.ok) : ERRAND_TEXT.gossip.ok), vars));
      const heard = [learnFragment(1, d.tier), good && learnFragment(1, d.tier)].filter(Boolean);
      if (!heard.length) {
        state.log.shift();
        log(fill(pick(ERRAND_TEXT.gossip.none), vars));
      }
      break;
    }
    case 'spy': {
      const target = Math.min(5, d.tier + 1);
      log(fill(pick(good ? own('goodText', ERRAND_TEXT.spy.ok) : ERRAND_TEXT.spy.ok), vars));
      const read = [learnFragment(target, target) || learnFragment(1, target), good && learnFragment(1, target)].filter(Boolean);
      if (good && d.temper.extra === 'notes') noteFromSpy(d);
      else if (!read.length) log('The notes contain nothing you did not already know.');
      break;
    }
    case 'cornelia': {
      const clue = corneliaClue(1);
      log(`${fill(pick(ERRAND_TEXT.cornelia.ok), vars)} ${clue ? `From what it saw, ${clue}.` : 'It learned nothing you did not already know.'}`, 'lore');
      break;
    }
    case 'house':
      state.health = Math.min(MAX_HEALTH, state.health + 1);
      state.keptHouse = state.day + 1; // guarded until dawn: see the raid and the crackdown
      log(fill(pick(ERRAND_TEXT.house.ok), vars), 'good');
      break;
    case 'debts':
    case 'workers': {
      const forMachine = sv.errand === 'debts';
      const amt = Math.round(coinAmount(d.tier) * (forMachine ? 1.6 : 0.6));
      state.dollars += amt;
      const s = state.standing;
      if (forMachine) { s.machine = Math.min(10, s.machine + 1); s.union = Math.max(-10, s.union - 1); }
      else s.union = Math.min(10, s.union + 1);
      log(`${fill(pick(ERRAND_TEXT[sv.errand].ok), { ...vars, amt })} (${forMachine ? 'the Machine approves; the workers do not' : 'the workers won’t forget it'})`, 'good');
      break;
    }
  }
}

// Kethuun's spying fills in a fact your notebook didn't have, about a spirit you know of.
function noteFromSpy(d) {
  const known = knownDemons().filter(x => unknownFacts(x).length);
  if (!known.length) return;
  const x = pick(known);
  const fact = pick(unknownFacts(x));
  recordFact(x.id, fact);
  log(`In ${bold(d)}’s margins: ${bold(x)}, ${factText(fact)}.`, 'lore');
}

// The first errand a spirit runs for you shows what it is good and bad at.
function learnTemper(d) {
  if (!d.temper || temperKnown(d)) return;
  state.tempers[d.id] = state.day;
  log(`Your notebook notes that ${bold(d)} is ${temperText(d)}.`, 'info');
}

// At dawn, two of your spirits may have words.
function servantBanter() {
  const here = [...state.servants.map(sv => sv.demonId), ownFamiliar() && ownFamiliar().id].filter(Boolean);
  const pairs = SERVANT_BANTER.filter(b => b.pair.every(id => here.includes(id)));
  if (!pairs.length || random() > 0.3) return;
  const b = pickFresh('servant-banter', pairs);
  log(b.lines.map(([id, text]) => `<b>${demonById(id).name}:</b> ${text}`).join(' '), 'aside');
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

// A firmly bound servant in its last two nights can be kept on for another term, for sticks of the incense it
// likes: no summoning, no hour spent. Each renewal of the same servant costs one stick more than the last.
const renewCost = sv => (sv.renewals || 0) + 1;

// Why this servant can't be renewed, or null.
function renewBlocker(sv) {
  const d = demonById(sv.demonId);
  if (sv.binding !== 'firm' || sv.strained) return 'Only a firm binding can be renewed.';
  const likes = dossier(d).likes;
  if (!likes) return `Your notebook doesn’t know what incense ${d.name} likes.`;
  const n = renewCost(sv);
  if ((state.incense[likes] || 0) < n) return `Renewing it takes ${n} ${n > 1 ? 'sticks' : 'stick'} of ${INCENSE[likes].name.toLowerCase()}, and you have ${state.incense[likes] || 0}.`;
  return null;
}

function renewServant(uid) {
  const sv = state.servants.find(s => s.uid === uid);
  if (!sv || sv.patience > 2 || renewBlocker(sv) || state.over) return;
  const d = demonById(sv.demonId);
  const likes = dossier(d).likes;
  const n = renewCost(sv);
  state.incense[likes] -= n;
  sv.patience += PATIENCE[d.tier] + 2;
  sv.renewals = (sv.renewals || 0) + 1;
  log(`You burn ${n > 1 ? `${n} sticks` : 'a stick'} of ${INCENSE[likes].name.toLowerCase()} and renew ${bold(d)}’s term. It agrees, and makes a note of the terms${n > 1 ? ', which are getting steeper' : ''}.`, 'good');
  render();
}

function dismiss(uid) {
  const sv = state.servants.find(s => s.uid === uid);
  if (!sv) return;
  state.servants = state.servants.filter(s => s !== sv);
  const early = sv.patience >= 2; // it still owed you at least one more night
  remember(sv.demonId, early ? 'kind' : 'served');
  log(early
    ? `You speak the Dismissal early. ${bold(demonById(sv.demonId))} hesitates, as if suspecting a trick, then goes. It will remember this.`
    : `You speak the Dismissal. ${bold(demonById(sv.demonId))} departs with a remark about your mother.`);
  render();
}

function expire(sv) {
  const d = demonById(sv.demonId);
  state.servants = state.servants.filter(s => s !== sv);
  remember(d.id, sv.binding === 'firm' ? 'served' : sv.patience > 0 ? 'escaped' : 'grudge');
  if (sv.binding === 'firm') {
    log(`${bold(d)}’s term of service has worn thin. With a mocking bow, it unravels into smoke and is gone.`);
    return;
  }
  const dmg = sv.pentTier >= d.tier ? Math.ceil(d.tier / 2) : d.tier;
  const taken = hurt(dmg, `ambushed by ${d.name}, whose bonds were left to fray`);
  if (sv.patience > 0) log(`${bold(d)} has been testing your too-small circle every night. Tonight it finds the gap. (${hurtNote(taken, dmg)})`, 'bad');
  else log(`${bold(d)} has strained against its bonds too long. They snap — and it leaves you a parting gift. (${hurtNote(taken, dmg)})`, 'bad');
}
