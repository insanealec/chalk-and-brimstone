'use strict';
// Lore and the notebook: reading fragments, recording facts, and working out by elimination
// what is known about each spirit.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

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
    nearby: [...present].filter(s => !name.includes(s)), notAt,
    nameComplete: name.every(Boolean),
    runeYes: [...runeYes], runeNo: [...runeNo], runeDeduced, runeCount,
    likes, hates, likesDeduced, hatesDeduced, neutral,
  };
}
