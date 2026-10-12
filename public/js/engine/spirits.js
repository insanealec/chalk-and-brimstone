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
  const facts = unknownFacts(d).sort(() => random() - 0.5).slice(0, t);
  facts.forEach(f => recordFact(d.id, f));
  log(`In the scrying glass, ${bold(glass)} shows you ${bold(d)}: ${facts.map(factText).join('; ')}.`, 'lore');
}

// A familiar recovering from bracing a circle is no use to you while state.day < its familiarOut day.
const familiarResting = key => state.day < (state.familiarOut[key] || 0);

const ownFamiliar = () => (state.familiar && !familiarResting('own') ? demonById(state.familiar) : null);

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
  const succeeded = random() < errandChance(sv, errandDiff(sv.errand, d.tier), d.tier);

  if (!succeeded) {
    if (sv.binding === 'uneasy' && random() < 0.5) return twist(d);
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
