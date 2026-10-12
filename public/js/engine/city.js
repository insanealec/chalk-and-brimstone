'use strict';
// The city: the calendar and the news, current events, hidden standings, places and their actions,
// street encounters, and the effects of every choice.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

const districtById = id => DISTRICTS.find(d => d.id === id);
const placeById = (dist, id) => dist.places.find(p => p.id === id);
const eventById = id => EVENTS.find(e => e.id === id);

// style: 'long' (Monday, April 3, 1893), 'short' (Mon, Apr 3) or 'stamp' (Apr 3, for the chronicle)
function dateLabel(day, style = 'short') {
  const date = new Date(START_DATE[0], START_DATE[1], START_DATE[2] + day - 1);
  return date.toLocaleDateString('en-US', style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : style === 'prose' ? { weekday: 'long', month: 'long', day: 'numeric' }
    : style === 'stamp' ? { month: 'short', day: 'numeric' }
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
    const remark = state.ithzar.joined && ithzarPresent() && random() < 0.6 && ithzarLine(`news:${ev.id}`);
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
  let roll = random() * ch.outcomes.reduce((a, o) => a + o.w, 0);
  const out = ch.outcomes.find(o => (roll -= o.w) < 0) || ch.outcomes[ch.outcomes.length - 1];
  const text = typeof out.text === 'function' ? out.text(state) : out.text;
  // log the outcome first so any lore it reveals appears after it in the chronicle
  const entry = log(`<b>${title}.</b> ${text}`);
  const { notes, frags } = applyEffects(out.fx, `lost in ${dist.name}`);
  if (ch.cost) notes.unshift(`−$${ch.cost}`);
  if (notes.length) entry.html += ` <span class="fx">(${notes.join(', ')})</span>`;
  const bad = notes.some(isBadNote);
  const good = notes.some(n => !isBadNote(n));
  entry.kind = good && !bad ? 'good' : bad && !good ? 'bad' : '';
  state.lastResult = { district: dist.id, place: placeId, title, choice: ch.label, text, notes, frags: frags.map(f => f.id) };
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
  if (fx.ithzarGift) {
    // a syllable of the marid's name you don't have yet, if there is one
    const marid = DEMONS.find(x => x.tier === 5);
    const k = dossier(marid);
    const i = k.name.findIndex(x => !x);
    if (!state.met.includes(marid.id)) state.met.push(marid.id);
    if (i >= 0) {
      recordFact(marid.id, `syl:${i}:${marid.trueName[i]}`);
      notes.push(`Ithzar’s parting gift: ${sylHTML(marid.trueName[i])} is syllable ${i + 1} of ${marid.name}’s name`);
    } else {
      notes.push('Ithzar’s parting gift: nothing you did not already know, which seems to disappoint it');
    }
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
