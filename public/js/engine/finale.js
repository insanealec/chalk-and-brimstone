'use strict';
// The last summoning. The marid is not called up in your workshop: you prepare it in the chamber as usual, then
// row out to the Water Crib and speak the name over the lake. It is resolved by the ordinary rules
// (resolveSummon), then played back as a scene in beats (state.finale). If the binding holds, the scene ends
// in a choice: bind the marid for City Hall (the Machine's ending) or let it go back to sleep.
// Its text is in js/finale.js.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

const FINALE_SPIRIT = 'shemashara';

const isFinaleSummons = () => state.sel.name === FINALE_SPIRIT;

// The marid can only be called up once City Hall has asked for it.
function finaleBlocker() {
  const c = currentCommission();
  if (!c || !c.win) return 'City Hall has not asked for the deep one yet, and you would not want to wake it for nothing.';
  return null;
}

function beginFinale() {
  if (busy || summonBlocker()) return;
  state.sel.clause = 'service'; // the Machine wants it bound, whatever else you meant to do with it
  const m = resolveSummon();     // spends the incense, records what the notebook learns, and does any damage
  state.actions = 0;             // rowing out and back takes the rest of the day
  manifestation = m;
  state.finale = { beats: finaleBeats(m), shown: 1, holds: !!m.finale };
  log(`You row out to the Water Crib after dark to call up ${bold(demonById(FINALE_SPIRIT))}.`, 'info');
  render();
}

function finaleNext() {
  if (state.finale && state.finale.shown < state.finale.beats.length) state.finale.shown++;
  render();
}

// After a summoning at the Crib that failed: back to the workshop, to try again another night.
function finaleClose() {
  state.finale = null;
  render();
}

// The choice at the end of a binding that held.
function finaleChoose(choice) {
  const f = state.finale;
  if (!f || !f.holds || f.shown < f.beats.length) return;
  state.finale = null;
  if (choice === 'bind') {
    log(FINALE.bound, 'good');
    completeCommission(); // the last commission: the game is won
  } else {
    log(FINALE.freed, 'good');
    remember(FINALE_SPIRIT, 'kind');
    state.over = 'freed';
  }
  render();
}

// Turns the result of the summoning into the scene's beats, each an HTML string of one or more paragraphs.
function finaleBeats(m) {
  const s = state.sel;
  const marid = demonById(FINALE_SPIRIT);
  const p = text => `<p>${text}</p>`;
  const beats = [];

  // the boat, and who is in it (the first time; after that, the crossing is quicker in the telling)
  const trip = state.cribTrips++;
  if (trip) beats.push(p(FINALE.rowingAgain[(trip - 1) % FINALE.rowingAgain.length]));
  const company = [FINALE.rowing];
  const fam = ownFamiliar();
  if (fam) company.push(fill(FINALE.familiar[Math.min(fam.tier, 4)], { name: bold(fam) }));
  const ithzar = ithzarAtTheCrib();
  if (ithzar) company.push(FINALE.ithzar[ithzar]);
  if (!trip) beats.push(company.map(p).join(''));

  // the circle and runes
  const circle = circleById(s.circle);
  const chalk = [fill(circle.tier >= marid.tier ? FINALE.circle.strong : FINALE.circle.weak, { circle: circle.name })];
  s.runes.forEach(r => chalk.push(fill(marid.runes.includes(r) ? FINALE.rune.right : FINALE.rune.wrong, { rune: `<b>${RUNES[r].name}</b>` })));
  const have = s.runes.filter(r => marid.runes.includes(r)).length;
  if (have < marid.runes.length) chalk.push(fill(FINALE.rune.missing, { need: marid.runes.length, have }));
  beats.push(chalk.map(p).join(''));

  // the name, a syllable at a time
  beats.push(m.spoken.map((syl, i) => p(`<span class="syl ${m.feedback[i]}">${syl}.</span> `
    + (m.feedback[i] === 'exact' ? FINALE.syllables[i] : m.feedback[i] === 'near' ? FINALE.near : FINALE.none))).join(''));

  const hurtLine = () => p(m.lines[m.lines.length - 1]);
  const incName = INCENSE[s.incense].name.toLowerCase();
  if (m.outcome === 'silence') {
    beats.push(p(fill(FINALE.silence, { incense: incName })));
  } else if (m.nearMiss) {
    beats.push(p(FINALE.nearMiss) + hurtLine());
  } else if (m.demon.id !== FINALE_SPIRIT) {
    beats.push(p(fill(FINALE.accident, { name: bold(m.demon) })) + m.lines.slice(2).map(p).join(''));
  } else {
    const rising = [fill(FINALE.rises, { form: marid.form })];
    rising.push(s.incense === marid.likes ? FINALE.incense.likes
      : s.incense === marid.hates ? FINALE.incense.hates : fill(FINALE.incense.neutral, { incense: incName }));
    beats.push(rising.map(p).join(''));
    if (m.outcome === 'broken') {
      beats.push(p(FINALE.breaks) + hurtLine());
    } else {
      beats.push(p(FINALE.holds[m.outcome]) + (ithzar === 'with' ? p(FINALE.ithzarMeets) : ''));
      beats.push(`<blockquote>${m.greet}</blockquote>${m.footnote ? `<p class="footnote">${m.footnote}</p>` : ''}${p(FINALE.offer)}`);
    }
  }
  return beats;
}

// Where Ithzar is on the last night, as a key of FINALE.ithzar, or null if it never came into your story.
function ithzarAtTheCrib() {
  const f = state.flags;
  if (state.ithzar.joined) return ithzarHere() ? 'with' : 'away';
  if (f['kept-promise'] !== undefined) return 'kept';
  if (f['ithzar-left'] !== undefined) return 'left';
  if (f['met-ithzar'] !== undefined && f['ithzar-freed'] === undefined) return 'bound';
  return null;
}
