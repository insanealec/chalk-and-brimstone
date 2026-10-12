'use strict';
// The summoning chamber: setting up an incantation, speaking it, binding rules, and overreaching.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

// Sets the chamber up from what the notebook knows about the selected spirit (or Cornelia's binding):
// its confirmed syllables, the runes known to hold it, the incense it likes, and your strongest circle
// and pentacle. Unknowns are left for you to fill in.
function applyNotebook() {
  const s = state.sel;
  const strongest = (ids, byId) => ids.slice().sort((a, b) => byId(b).tier - byId(a).tier)[0];
  s.circle = strongest(state.circles, circleById);
  s.pentacle = strongest(state.pentacles, pentacleById);
  if (s.name === RITE) {
    const k = corneliaSheet();
    s.syllables = [];  // Ithzar speaks its own name
    s.runes = k.yes.filter(r => state.runes.includes(r));
    if (k.incense && state.incense[k.incense] > 0) s.incense = k.incense;
    return;
  }
  resetIncantation();
  const d = s.name && demonById(s.name);
  if (!d) return;
  const k = dossier(d);
  s.runes = k.runeYes.filter(r => state.runes.includes(r)).slice(0, MAX_RUNES);
  if (k.likes && state.incense[k.likes] > 0) s.incense = k.likes;
  else if (s.incense && s.incense === k.hates) s.incense = null;
}

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
    applyNotebook();
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

  // the marid hears its name even half-spoken, and comes up to complain about the spelling
  const exact = feedback.filter(f => f === 'exact').length;
  if (!d && target.tier === 5 && exact >= target.trueName.length - 2 && !boundPhrase(target.id)) {
    m.lines.push(nameFeedback(spoken, feedback, target));
    if (!state.met.includes(target.id)) state.met.push(target.id);
    const safe = pent.tier >= target.tier;
    const dmg = safe ? Math.ceil(target.tier / 2) : target.tier * 2 + 1;
    const taken = hurt(dmg, `drowned in your own workshop by ${target.name}, who did not care for your spelling`);
    m.outcome = 'broken';
    m.lines.push(`That is not quite its name. It is close enough. ${target.name} hears itself half-called from the bottom of the lake, and comes up to tell you what it thinks of your spelling.`);
    m.lines.push(safe
      ? `Your ${pent.name} holds, just. (${hurtNote(taken, dmg)}) Then the room is dry again, and it is gone.`
      : `Nothing you are standing in was ever going to stop it. (${hurtNote(taken, dmg)})`);
    m.greet = '"Again," says a voice like deep water, "and I will not leave."¹';
    m.footnote = '¹ Ask Superintendent Rowe. You can’t, of course.';
    log(`${bold(target)} answered a name that was nearly its own. (${hurtNote(taken, dmg)})`, 'bad');
    return m;
  }

  if (!d || boundPhrase(d.id)) {
    m.outcome = 'silence';
    m.lines.push(nameFeedback(spoken, feedback, target));
    m.lines.push(d
      ? `${d.name} — already ${boundPhrase(d.id)} — flickers in the circle, irritated, and is gone.`
      : feedback.includes('exact') || feedback.includes('near')
        ? `For a moment the room feels listened to. Then it doesn’t. The ${incName} is spent.`
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
  m.lines.push(`The smoke thickens, turns, and settles into a shape: ${d.form}.`);

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
    const held = random() * 100 < reach.odds;
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
    if (m.outcome === 'uneasy' && !m.overreach && pent.tier < d.tier && random() < 0.35) {
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
        pentTier: pent.tier, errand: 'coin', strained: !!m.overreach,  // starts earning tonight unless told otherwise
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
