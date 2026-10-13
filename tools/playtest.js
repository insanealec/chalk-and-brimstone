'use strict';
// Automated playtesting for Chalk & Brimstone. Loaded by tools/playtest.html after the game scripts.
//
// playGame(seed, maxDays) plays one whole game with a scripted player and returns a summary.
// checkContent() looks for mistakes in the game's data. Both only call the game's own functions.
//
// The scripted player plays like a careful, friendly player:
//  - It only uses what a player can see: the notebook, the shops, the visible actions and their odds.
//    It never reads a spirit's true name, runes or incense from the data.
//  - In events it takes the friendly options (helps the strikers, keeps Ithzar's secret, lets it go)
//    and skips the betrayals.
//  - It guesses names Mastermind-style from the notebook, tests unknown runes and incense, dismisses
//    servants before their bonds snap, heeds "DO NOT GUESS" for the marid, and tells fortunes when broke.
//  - For income it keeps at least one servant it can bind reliably, prefers spirits it knows completely,
//    only stocks incense for spirits it plans to summon, and takes each event action at most once a day.
// It is a measuring stick, not a perfect player: when a change makes it win faster or die less,
// that is evidence, not proof.

const FRIENDLY_SKIP = /Report|Refuse|Send it away|packers’ money|stuff the ballot|Ask it to stay|buy its own|Ask the engineers/;

function playGame(seed, maxDays = 200) {
  seedRandom(seed);
  restart(false);
  const S = { seed, log: [], silence: 0, broken: 0, firm: 0, uneasy: 0, minHealth: MAX_HEALTH, fortunes: 0, commissions: {} };
  const note = msg => S.log.push(`${dateLabel(state.day, 'stamp')}: ${msg}`);

  const owned = i => (state.incense[i] || 0) > 0;
  const bestCircleId = () => state.circles.slice().sort((a, b) => circleById(b).tier - circleById(a).tier)[0];
  const bestPentacleId = () => state.pentacles.slice().sort((a, b) => pentacleById(b).tier - pentacleById(a).tier)[0];
  const circleTier = () => circleById(bestCircleId()).tier;

  // Takes the first available action anywhere in the city whose label matches.
  function act(pattern, eventsOnly = false) {
    for (const dist of DISTRICTS) {
      if (districtBlocker(dist)) continue;
      for (const place of dist.places) {
        if (place.unless && state.flags[place.unless] !== undefined) continue;
        for (const { a, key, ev } of placeActions(dist, place)) {
          if ((eventsOnly && !ev) || !pattern.test(a.label) || (eventsOnly && FRIENDLY_SKIP.test(a.label)) || actionBlocker(a, key)) continue;
          if (eventsOnly && state.used[key] === state.day) continue; // once a day is enough for any event action
          doAction(key);
          if (ev) note(`${ev.title}: ${a.label}`);
          return true;
        }
      }
    }
    return false;
  }

  // ---- what to put in the circle, from the notebook alone

  function guessName(d) {
    const k = dossier(d);
    const slots = k.name.slice();
    const used = new Set(slots.filter(Boolean));
    const untested = SYLLABLES.filter(x => !k.absent.has(x) && !k.nearby.includes(x) && !k.name.includes(x));
    slots.forEach((syl, i) => {
      if (syl) return;
      const pickSyl = k.nearby.find(x => !used.has(x) && !(k.notAt[x] && k.notAt[x].has(i)))
        || untested.find(x => !used.has(x)) || k.nearby.find(x => !used.has(x));
      slots[i] = pickSyl;
      used.add(pickSyl);
    });
    return slots;
  }

  function chooseRunes(d) {
    const k = dossier(d);
    if (k.runeCount !== null && k.runeYes.length >= k.runeCount) {
      return k.runeYes.every(r => state.runes.includes(r)) ? k.runeYes : null;
    }
    const untested = state.runes.filter(r => !k.runeYes.includes(r) && !k.runeNo.includes(r));
    return [...k.runeYes.filter(r => state.runes.includes(r)), ...untested].slice(0, MAX_RUNES);
  }

  function chooseIncense(d) {
    const k = dossier(d);
    if (k.likes) return owned(k.likes) ? k.likes : null;
    const options = Object.keys(INCENSE).filter(i => owned(i) && i !== k.hates);
    return options.find(i => !k.neutral.includes(i)) || options[0] || null;
  }

  function readyForPermanent(d) {
    const k = dossier(d);
    return k.nameComplete && k.runeCount !== null && k.runeYes.length === k.runeCount
      && k.runeYes.every(r => state.runes.includes(r)) && k.likes && owned(k.likes) && circleTier() >= d.tier;
  }

  // Would a failure here be survivable?
  function safeToTry(d) {
    const k = dossier(d);
    const pentacle = pentacleById(bestPentacleId()).tier;
    if (d.tier === 5 && !k.nameComplete && pentacle < 5) return false; // the marid's lore says DO NOT GUESS
    const runesKnown = k.runeCount !== null && k.runeYes.length === k.runeCount;
    if (runesKnown && !(k.hates && chooseIncense(d) === k.hates) && state.health > d.tier + 1) return true;
    return state.health > (pentacle >= d.tier ? Math.ceil(d.tier / 2) : d.tier * 2 + 1) + 1;
  }

  function summon(d, clause = 'service') {
    const runes = chooseRunes(d);
    const incense = chooseIncense(d);
    if (!runes || !incense) return false;
    Object.assign(state.sel, { name: d.id, syllables: guessName(d), runes, incense, clause, circle: bestCircleId(), pentacle: bestPentacleId(), overreach: false, brace: [] });
    if (summonBlocker()) return false;
    let m;
    if (isFinaleSummons()) {
      // the marid is called up at the Water Crib: play the scene through, and bind it for City Hall if it holds
      beginFinale();
      m = manifestation;
      if (state.finale && state.finale.holds) {
        state.finale.shown = state.finale.beats.length;
        finaleChoose('bind');
      } else {
        finaleClose();
      }
    } else {
      m = resolveSummon();
    }
    resetIncantation();
    S[m.outcome]++;
    if (m.outcome === 'firm' || m.outcome === 'uneasy') note(`bound ${m.demon.name} (${m.outcome}, ${clauseLabel(clause)})`);
    if (m.outcome === 'broken') note(`${m.demon.name} broke free; health ${state.health}`);
    return true;
  }

  // ---- each morning: shopping and orders

  function shop() {
    const rank = rankIndex();
    const c = currentCommission();
    const canBuy = (item, n = 1, reserve = 0) => item.rank <= rank && state.dollars >= item.price * n + reserve;
    if (state.health <= 5 && state.dollars >= 6) buy('poultice', 'x');
    const planned = new Set([nextTarget(false), ...state.servants.map(sv => demonById(sv.demonId))].filter(Boolean).map(d => d.id));
    for (const d of knownDemons()) {
      if (d.tier > circleTier() && !(c && c.tier === d.tier)) continue;
      const k = dossier(d);
      if (!planned.has(d.id) && !(c && c.tier === d.tier)) continue;
      k.runeYes.forEach(r => { if (!state.runes.includes(r) && canBuy(RUNES[r])) buy('rune', r); });
      if (k.likes && (state.incense[k.likes] || 0) < 2 && canBuy(INCENSE[k.likes], 2, 5)) buy('incense', k.likes, 2);
    }
    ['rosemary', 'cedar', 'frankincense', 'myrrh'].forEach(i => { if (!owned(i) && state.dollars >= 10) buy('incense', i, 1); });
    const favor = state.events['ithzar-sandalwood'];
    if (favor && !favor.done && !owned('sandalwood') && canBuy(INCENSE.sandalwood)) buy('incense', 'sandalwood', 1);
    if (leashActive()) {
      const k = corneliaSheet();
      k.yes.forEach(r => { if (!state.runes.includes(r) && canBuy(RUNES[r])) buy('rune', r); });
      if (k.incense && !owned(k.incense) && canBuy(INCENSE[k.incense])) buy('incense', k.incense, 1);
    }
    const needTier = c && c.type === 'bind' ? c.tier : 0;
    const nextCircle = CIRCLES.find(x => x.tier === circleTier() + 1);
    if (nextCircle && canBuy(nextCircle) && (needTier > circleTier() || (leashActive() && circleTier() < 3) || state.dollars > nextCircle.price + 100)) {
      buy('circle', nextCircle.id);
      note(`bought the ${nextCircle.name}`);
    }
    const nextPentacle = PENTACLES.find(x => x.tier === pentacleById(bestPentacleId()).tier + 1);
    const wantObsidian = needTier === 5 && !dossier(DEMONS.find(d => d.tier === 5)).nameComplete;
    if (nextPentacle && nextPentacle.tier <= circleTier() && canBuy(nextPentacle, 1, wantObsidian ? 0 : 40)) {
      buy('pentacle', nextPentacle.id);
      note(`bought the ${nextPentacle.name}`);
    }
    Object.entries(RUNES).forEach(([r, info]) => { if (!state.runes.includes(r) && canBuy(info, 1, 80)) buy('rune', r); });
    if (state.clauses.includes('vessel')) {
      ['lantern', 'cane', 'watch', 'ring'].forEach(v => { if (!state.vessels[v] && canBuy(VESSELS[v], 1, 80)) buy('vessel', v); });
    }
  }

  function giveOrders() {
    const c = currentCommission();
    state.servants.forEach((sv, i) => {
      if (c && c.type === 'errand') sv.errand = 'commission';
      else if (leashActive() && i === 0) sv.errand = 'cornelia';
      else sv.errand = state.dollars < 700 ? 'coin' : (i % 2 ? 'gossip' : 'spy');
    });
    if (state.ithzar.joined && !favorBlocker()) state.ithzar.favor = 'coin';
    state.servants.filter(sv => sv.binding !== 'firm' && sv.patience <= 1).forEach(sv => dismiss(sv.uid));
  }

  // ---- what to do with each hour

  // makeRoom: dismiss a servant if one must go to make room for the commission's spirit
  function nextTarget(makeRoom = true) {
    const c = currentCommission();
    const available = knownDemons().filter(d => !boundPhrase(d.id) && d.tier <= circleTier());
    // with no servant earning, first bind something reliable for income
    if (!state.servants.length) {
      const earner = available.filter(readyForPermanent).sort((a, b) => b.tier - a.tier)[0];
      if (earner) return earner;
    }
    if (c && c.type === 'bind') {
      const t = available.filter(d => d.tier >= c.tier).sort((a, b) => a.tier - b.tier)[0];
      if (t) {
        if (makeRoom && state.servants.length >= maxServants()) dismiss(state.servants[0].uid);
        return t;
      }
    }
    if (state.servants.length >= maxServants()) return null;
    // for income, a spirit you can bind reliably beats a stronger one you're still guessing at
    const score = d => (readyForPermanent(d) ? 100 : dossier(d).nameComplete ? 50 : 0) + d.tier;
    return available.sort((a, b) => score(b) - score(a))[0] || null;
  }

  function permanentGoal() {
    if (!state.servants.length) return null; // keep a servant earning before sealing spirits away
    const ready = knownDemons().filter(d => !boundPhrase(d.id) && readyForPermanent(d)).sort((a, b) => b.tier - a.tier);
    if (state.clauses.includes('familiar') && !state.familiar && ready[0]) return [ready[0], 'familiar'];
    if (state.clauses.includes('vessel')) {
      for (const [type, v] of Object.entries(state.vessels)) {
        const inside = v.spirit ? demonById(v.spirit).tier : 0;
        const d = ready.find(x => x.tier <= v.cap && x.tier > inside);
        if (d) return [d, `vessel:${type}`];
      }
    }
    return null;
  }

  function tryRite() {
    if (!leashActive() || !state.clauses.includes('release')) return false;
    const k = corneliaSheet();
    if (k.yes.length < CORNELIA_BINDING.runes.length || !k.incense || !k.yes.every(r => state.runes.includes(r))
      || !owned(k.incense) || circleTier() < CORNELIA_BINDING.circle || state.health < 5) return false;
    Object.assign(state.sel, { name: RITE, runes: k.yes, incense: k.incense, circle: bestCircleId(), pentacle: bestPentacleId(), overreach: false });
    if (summonBlocker()) return false;
    note(`rite of Release: ${resolveRite().outcome === 'firm' ? 'Ithzar is free' : 'it rebounded'}`);
    return true;
  }

  function readLore() {
    const unread = maxTier => FRAGMENTS.some(f => !state.lore.includes(f.id) && f.demon.tier <= maxTier);
    if (unread(rankTier())) { study(); return true; }
    if (!unread(Math.min(5, rankTier() + 2))) return false;
    return (state.dollars >= 30 && act(/Bribe the doorman/)) || (state.dollars >= 20 && act(/search the stacks/))
      || (state.dollars >= 20 && act(/bartender a drink/));
  }

  function playDay() {
    shop();
    giveOrders();
    const target = nextTarget();
    if (target && state.ithzar.joined && !askBlocker(target)) askIthzar(target.id);
    const marid = DEMONS.find(d => d.tier === 5);
    if (state.ithzar.joined && isKnown(marid) && !askBlocker(marid)) askIthzar(marid.id);

    for (let guard = 0; state.actions > 0 && !state.over && guard < 12; guard++) {
      if (state.encounter) { chooseOption(0); continue; }
      if (state.health <= 4 && act(/Sleep off/)) continue;
      if (act(/./, true)) continue;
      if (tryRite()) continue;
      const goal = permanentGoal();
      if (goal && safeToTry(goal[0]) && summon(goal[0], goal[1])) continue;
      const t = nextTarget();
      if (t && safeToTry(t) && summon(t)) continue;
      if (leashActive() && act(/Name runes at Ithzar|Read Cornelia/)) continue;
      if (state.flags['ithzar-favor-3'] !== undefined && !state.ithzar.joined && state.standing.trust < 5 && act(/Spend the evening/)) continue;
      if (readLore()) continue;
      if (state.dollars < 25 && act(/Tell fortunes/)) { S.fortunes++; continue; }
      break;
    }
    S.minHealth = Math.min(S.minHealth, state.health);
    if (!state.over) endDay();
  }

  while (!state.over && state.day < maxDays) {
    const before = state.commission;
    playDay();
    if (state.commission !== before) S.commissions[state.commission] = state.day;
  }

  S.result = state.over || 'unfinished';
  S.day = state.day;
  S.date = dateLabel(state.day, 'long');
  S.deathCause = state.deathCause;
  S.ithzarJoined = state.flags['ithzar-joined'];
  S.ithzarReleased = state.flags['ithzar-released'];
  S.dollars = state.dollars;
  return S;
}

// Looks for mistakes in the game's data. Returns a list of problems (empty when all is well).
function checkContent() {
  const problems = [];
  const fail = msg => problems.push(msg);
  const truth = (d, fact) => {
    const [t, a, b] = fact.split(':');
    switch (t) {
      case 'syl': return d.trueName[+a] === b;
      case 'has': return d.trueName.includes(a);
      case 'at!': return d.trueName.includes(a) && d.trueName[+b] !== a;
      case 'not': return !d.trueName.includes(a);
      case 'rune': return d.runes.includes(a);
      case 'norune': return !d.runes.includes(a);
      case 'runes': return d.runes.length === +a;
      case 'likes': return d.likes === a;
      case 'hates': return d.hates === a;
      case 'neutral': return d.likes !== a && d.hates !== a;
      default: return false;
    }
  };

  const names = new Set();
  for (const d of DEMONS) {
    if (d.trueName.length !== d.tier + 1) fail(`${d.id}: a ${TIER_NAMES[d.tier]}'s name should have ${d.tier + 1} syllables`);
    if (new Set(d.trueName).size !== d.trueName.length) fail(`${d.id}: repeats a syllable`);
    d.trueName.forEach(s => { if (!SYLLABLES.includes(s)) fail(`${d.id}: ${s} is not in SYLLABLES`); });
    if (names.has(d.trueName.join())) fail(`${d.id}: shares a true name`);
    names.add(d.trueName.join());
    if (d.likes === d.hates) fail(`${d.id}: likes and hates the same incense`);
    [d.likes, d.hates].forEach(i => { if (!INCENSE[i]) fail(`${d.id}: unknown incense ${i}`); });
    d.runes.forEach(r => { if (!RUNES[r]) fail(`${d.id}: unknown rune ${r}`); });
    d.lore.forEach((fr, i) => (fr.facts || []).forEach(f => {
      if (!truth(d, f)) fail(`${d.id}-${i}: fact "${f}" is not true of ${d.name}`);
      const [t, a, b] = f.split(':');
      const syl = t === 'syl' ? b : t === 'has' ? a : null;
      if (syl && !fr.text.includes(`[${syl}]`)) fail(`${d.id}-${i}: the text never mentions [${syl}]`);
    }));
  }

  const fragmentIds = new Set(FRAGMENTS.map(f => f.id));
  COMMISSIONS.forEach(c => {
    if (c.file && !fragmentIds.has(c.file)) fail(`commission "${c.title}": file ${c.file} does not exist`);
    if (c.gift && !VESSELS[c.gift]) fail(`commission "${c.title}": gift ${c.gift} is not a vessel`);
    if (c.teaches && !CLAUSES[c.teaches]) fail(`commission "${c.title}": teaches unknown clause ${c.teaches}`);
  });

  const placeExists = where => {
    const [d, p] = where.split(':');
    const dist = DISTRICTS.find(x => x.id === d);
    return dist && dist.places.some(x => x.id === p);
  };
  const ids = new Set();
  EVENTS.forEach(ev => {
    if (ids.has(ev.id)) fail(`event ${ev.id}: duplicate id`);
    ids.add(ev.id);
    ev.stages.forEach((st, i) => {
      if (!placeExists(st.place)) fail(`event ${ev.id} stage ${i}: no place "${st.place}"`);
      st.actions.forEach(a => {
        const adv = a.outcomes.map(o => o.fx.advance).filter(x => x !== undefined);
        adv.forEach(x => { if (x !== 'end' && !ev.stages[x]) fail(`event ${ev.id} stage ${i}: "${a.label}" advances to missing stage ${x}`); });
      });
      if (st.expire && typeof st.expire !== 'function' && st.expire.next !== 'end' && !ev.stages[st.expire.next]) {
        fail(`event ${ev.id} stage ${i}: expires into missing stage ${st.expire.next}`);
      }
    });
  });

  const demonIds = new Set(DEMONS.map(d => d.id));
  const checkFx = (fx, where) => {
    if (fx.loreDemon && !demonIds.has(fx.loreDemon)) fail(`${where}: loreDemon ${fx.loreDemon} does not exist`);
    if (fx.rune && !RUNES[fx.rune]) fail(`${where}: rune ${fx.rune} does not exist`);
    Object.keys(fx.incense || {}).forEach(i => { if (!INCENSE[i]) fail(`${where}: incense ${i} does not exist`); });
    if (fx.notebook && !demonIds.has(fx.notebook[0])) fail(`${where}: notebook spirit ${fx.notebook[0]} does not exist`);
  };
  DISTRICTS.forEach(dist => {
    dist.places.forEach(p => p.actions.forEach(a => a.outcomes.forEach(o => checkFx(o.fx, `${dist.id}:${p.id} "${a.label}"`))));
    dist.street.forEach(e => e.choices.forEach(ch => ch.outcomes.forEach(o => checkFx(o.fx, `${dist.id} street ${e.id}`))));
  });
  EVENTS.forEach(ev => ev.stages.forEach(st => st.actions.forEach(a => a.outcomes.forEach(o => checkFx(o.fx, `event ${ev.id}`)))));
  return problems;
}
