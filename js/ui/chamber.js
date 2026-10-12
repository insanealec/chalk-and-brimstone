'use strict';
// Drawing the chamber: its controls, the result of a summoning, and the circle itself.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

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
      ${s.name ? `<button class="ghost tiny fill" data-action="notebook-fill" ${busy ? 'disabled' : ''}
        title="Known syllables, runes and incense, with your strongest circle and pentacle">Set up from the notebook</button>` : ''}
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
    const wrong = syl && (k.absent.has(syl) || (k.name[i] && k.name[i] !== syl) || (k.notAt[syl] && k.notAt[syl].has(i)));
    const cls = !syl ? 'empty' : k.name[i] === syl ? 'exact' : wrong ? 'wrong' : '';
    return `<button class="slot ${cls}" data-action="slot" data-value="${i}" ${busy ? 'disabled' : ''}
      title="${wrong ? 'Your notebook says this is wrong here. Click to clear' : syl ? 'Click to clear' : 'Choose a syllable below'}">${syl || '?'}</button>`;
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
