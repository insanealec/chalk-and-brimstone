'use strict';
// Drawing the game: the stats bar, tabs and chronicle, shared pieces, the notebook and journal,
// servants, workshop, market, City Hall, the overlay, and Ithzar's cards and asides.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

function asideHTML(a) {
  return `<div class="aside">${a.lines.map(l => `<p><b>${l.name}:</b> ${l.text}</p>`).join('')}${a.note ? `<p class="footnote">${a.note}</p>` : ''}</div>`;
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

// Phone-sized layout: one column, the chronicle at the bottom and in a drawer, End day in a bottom bar.
const narrow = () => matchMedia('(max-width: 960px)').matches;

// The chronicle drawer: open or not, the newest entry the player has seen, and how many were new when it opened.
let drawerOpen = false;
let logSeen = null;
let drawerFresh = 0;
const unreadLog = () => {
  const i = state.log.indexOf(logSeen);
  return i < 0 ? state.log.length : i;
};

function openLog() {
  drawerOpen = true;
  drawerFresh = unreadLog();
  logSeen = state.log[0];
  render();
}
function closeLog() {
  drawerOpen = false;
  render();
}

// What the last hour of study turned up, shown under the Study button: { entries, lore }.
let journalNews = null;

// Runs an action and returns the chronicle entries it added, newest first.
function newEntries(fn) {
  const top = state.log[0];
  fn();
  const i = state.log.indexOf(top);
  return state.log.slice(0, i < 0 ? state.log.length : i);
}

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
    <div class="stat hours"><span class="k">Hours left</span><span class="v">${state.actions}</span></div>
    <div class="stat"><span class="k">Dollars</span><span class="v">$${state.dollars}</span></div>
    <div class="stat"><span class="k">Health</span><span class="v hearts" title="${state.health}/${MAX_HEALTH}">${hearts}</span></div>
    <div class="stat"><span class="k">Rank</span><span class="v">${RANKS[rankIndex()].name} <small>(${state.rep} rep)</small></span></div>
    <button class="primary end-day" data-action="end-day" ${state.over || busy ? 'disabled' : ''}>End day</button>`;
  const bar = $('#bottombar'); // not on the playtest page
  if (!bar) return;
  const unread = drawerOpen ? 0 : unreadLog();
  bar.innerHTML = `
    <button class="ghost log-btn" data-action="open-log">Chronicle${unread ? `<span class="badge">${unread}</span>` : ''}</button>
    <span class="bb-hours">${state.actions} hour${state.actions === 1 ? '' : 's'} left</span>
    <button class="primary" data-action="end-day" ${state.over || busy ? 'disabled' : ''}>End day</button>`;
}

function renderTabs() {
  const badges = {
    journal: state.newLore ? `<span class="badge">${state.newLore}</span>` : '',
    servants: state.servants.some(sv => sv.binding !== 'firm' && sv.patience <= 1) ? '<span class="badge alert" title="A servant’s bonds will snap tonight">!</span>'
      : state.servants.length ? `<span class="badge quiet">${state.servants.length}</span>` : '',
    cityhall: state.jobs.some(j => !j.done && j.kind !== 'errand' && !handInBlocker(j)) ? '<span class="badge alert" title="Ward work you can hand in">!</span>' : '',
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

function entryHTML(e, fresh = false) {
  return `<p class="entry ${e.kind}${fresh ? ' fresh' : ''}"><span class="day">${dateLabel(e.day, 'stamp')}</span>${e.html}</p>`;
}

function renderLog() {
  $('#log').innerHTML = `<h2>Chronicle</h2>` + state.log.map(e => entryHTML(e)).join('');
  const drawer = $('#drawer');
  if (!drawer) return;
  drawer.classList.toggle('open', drawerOpen);
  drawer.setAttribute('aria-hidden', String(!drawerOpen));
  document.body.classList.toggle('drawer-open', drawerOpen);
  if (drawerOpen) {
    $('#drawer-log').innerHTML = (drawerFresh ? '' : '<p class="muted small">Nothing new since you last looked.</p>')
      + state.log.map((e, i) => (i === drawerFresh && i ? '<p class="seen-divider">Earlier</p>' : '') + entryHTML(e, i < drawerFresh)).join('');
  }
}

function chip(kind, value, label, on, disabled = false) {
  return `<button class="chip ${on ? 'on' : ''}" data-pick="${kind}" data-value="${value}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function ctl(title, body) {
  return `<div class="ctl"><h3>${title}</h3><div class="chips">${body}</div></div>`;
}

const DEDUCED = '<span class="ded" title="Worked out by elimination">✶</span>';

// The requirements sheet: everything known about a spirit, filled in automatically.
function dossierHTML(d) {
  const k = dossier(d);
  const nameRow = k.name.map((syl, i) => (syl
    ? sylHTML(syl, 'exact') + (k.nameDeduced[i] ? DEDUCED : '')
    : '<span class="syl unknown">?</span>')).join('<span class="dot">·</span>');
  const nameExtra = [];
  const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  const notWhere = x => (k.notAt[x] ? ` <small>(not ${[...k.notAt[x]].sort().map(i => ORDINALS[i]).join(', ')})</small>` : '');
  if (!k.nameComplete && k.nearby.length) nameExtra.push(`also in it: ${k.nearby.map(x => sylHTML(x, 'near') + notWhere(x)).join(', ')}`);
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
    ${memoryHTML(d)}
  </dl>`;
}

// How the spirit remembers you, once it has answered you at least once.
function memoryHTML(d) {
  const mem = state.memory[d.id];
  if (!mem || !mem.times) return '';
  const times = mem.times === 1 ? 'answered you once' : `answered you ${mem.times} times`;
  const how = {
    kind: 'you let it go early last time <span class="mem good">+1 to its next binding</span>',
    grudge: 'holds a grudge: you let its bonds snap <span class="mem bad">−1 to its next binding</span>',
    escaped: 'remembers getting away from you',
    served: 'served out its term',
  }[mem.parting] || (boundPhrase(d.id) ? `${boundPhrase(d.id)} now` : '');
  return `<dt>Memory</dt><dd>${times}${how ? ` · ${how}` : ''}</dd>`;
}

function demonNotes(d, openLore, freshLore = []) {
  const frags = d.lore.map((f, i) => [f, `${d.id}-${i}`]).filter(([, id]) => state.lore.includes(id));
  return `${dossierHTML(d)}${claimsHTML(d)}
    ${frags.length ? `<details class="lore" ${openLore ? 'open' : ''}><summary>Lore (${frags.length} of ${d.lore.length})</summary>
      ${frags.map(([f, id]) => `<p class="frag${freshLore.includes(id) ? ' fresh' : ''}"><span class="src">${f.src}</span>“${fmtLore(f.text)}”</p>`).join('')}
    </details>` : '<p class="muted small">You have read nothing about it. Everything here came from the chamber.</p>'}`;
}

function viewJournal() {
  const known = knownDemons().sort((a, b) => a.tier - b.tier);
  const unknown = DEMONS.length - known.length;
  const readCount = state.lore.length;
  const news = journalNews;
  const freshIds = news ? news.lore : [];
  const isFresh = d => freshIds.some(id => id.startsWith(`${d.id}-`));
  return `
  <div class="journal">
    <div class="panel row">
      <div>
        <h2>The Journal</h2>
        <p>Lore fragments read: ${readCount} of ${FRAGMENTS.length}. ${unknown ? `${unknown} spirit${unknown > 1 ? 's' : ''} remain unnamed to you.` : 'You know every name worth knowing.'}</p>
      </div>
      <button class="primary" data-action="study" ${state.actions < 1 || state.over ? 'disabled' : ''}>Study in the library <small>(1 hour)</small></button>
      ${news ? `<div class="result study-result">${news.entries.map(e => `<p class="entry ${e.kind}">${e.html}</p>`).join('')}
        ${freshIds.length ? `<p class="small muted">Added to the notebook: ${known.filter(d => isFresh(d)).map(d => `<a href="#j-${d.id}">${d.name}</a>`).join(', ')}.</p>` : ''}</div>` : ''}
    </div>
    ${known.length > 3 ? `<nav class="jump">${known.map(d => `<a href="#j-${d.id}" class="${isFresh(d) ? 'fresh' : ''}">${d.name}</a>`).join('')}</nav>` : ''}
    <div class="cards">
      ${known.map(d => `
        <article class="panel card tier-${d.tier}${isFresh(d) ? ' fresh' : ''}" id="j-${d.id}">
          <header><h3>${d.name}</h3><span class="tag">${TIER_NAMES[d.tier]}</span></header>
          ${demonNotes(d, !narrow() || isFresh(d), freshIds)}
          <button class="ghost" data-action="prepare" data-value="${d.id}">Prepare a summoning</button>
        </article>`).join('')}
    </div>
  </div>`;
}

// The errands a spirit of this class could run tonight, with its odds, as <option>s.
function errandOptions(sv, tier, selected) {
  const c = currentCommission();
  const opts = Object.entries(ERRANDS).filter(([, e]) => !e.available || e.available(state)).map(([k, e]) =>
    `<option value="${k}" ${selected === k ? 'selected' : ''}>${e.name} (${Math.round(errandChance(sv, e.diff(tier), tier) * 100)}%)</option>`);
  if (c && c.type === 'errand') {
    opts.push(`<option value="commission" ${selected === 'commission' ? 'selected' : ''}>City Hall: ${c.title} (${Math.round(errandChance(sv, c.diff, tier) * 100)}%)</option>`);
  }
  state.jobs.filter(j => j.kind === 'errand' && !j.done).forEach(j => {
    const v = `job:${j.uid}`;
    opts.push(`<option value="${v}" ${selected === v ? 'selected' : ''}>Ward work: ${j.title}, $${j.pay} (${Math.round(errandChance(sv, j.diff, tier) * 100)}%)</option>`);
  });
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
      const job = jobForErrand(sv.errand);
      const desc = job ? job.text : sv.errand === 'commission' ? c.text : sv.errand && ERRANDS[sv.errand] ? ERRANDS[sv.errand].desc : '';
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
        ${sv.patience <= 2 && sv.binding === 'firm' && !sv.strained ? (renewBlocker(sv)
          ? `<p class="muted small">${renewBlocker(sv)}</p>`
          : `<button class="primary" data-action="renew" data-value="${sv.uid}">Renew its term <small>(${renewCost(sv)} ${INCENSE[dossier(d).likes].name.toLowerCase()})</small></button>`) : ''}
        <button class="ghost" data-action="dismiss" data-value="${sv.uid}">Speak the Dismissal</button>
        ${sv.patience >= 2 ? '<p class="muted small">Let it go before its term is up and it will remember you kindly next time.</p>' : ''}
      </article>`;
    }).join('')}
  </div>`;
}

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

// City Hall's board of small paid jobs (js/engine/jobs.js).
function wardWorkHTML() {
  if (state.commission < 1) return '';
  const jobs = state.jobs.filter(j => !j.done);
  const card = j => {
    const how = j.kind === 'errand'
      ? `<p class="muted small">Send a servant on it from the Servants tab. Difficulty ${j.diff}.</p>`
      : handInBlocker(j)
        ? `<button class="ghost" disabled>${j.kind === 'supply' ? 'Hand over the incense' : 'Hand in your account'}</button><p class="muted small">${handInBlocker(j)}</p>`
        : `<button class="primary" data-action="job" data-value="${j.uid}">${j.kind === 'supply' ? `Hand over ${j.n} ${INCENSE[j.incense].name.toLowerCase()}` : 'Hand in your account'}</button>`;
    return `<article class="panel card job">
      <header><h3>${j.title}</h3><span class="tag">$${j.pay}${j.rep ? ` · +${j.rep} rep` : ''}</span></header>
      <p>${j.text}</p>${how}
      <p class="muted small">Open until ${dateLabel(j.until, 'prose')}.</p>
    </article>`;
  };
  return `<section class="panel"><h2>Ward work</h2>
    <p class="muted">Small jobs, paid on completion. City Hall posts new ones as old ones are done or given to someone else.${state.jobsDone ? ` You have done ${state.jobsDone}.` : ''}</p>
    ${jobs.length ? `<div class="cards">${jobs.map(card).join('')}</div>` : '<p class="muted">Nothing on the board today.</p>'}
  </section>`;
}

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
      ${c && !commissionReady()
          ? `<h3>The lake</h3><p>City Hall is drawing up its plans for whatever sleeps under the lake, and will send for you when it is ready: by ${dateLabel(commissionDue(), 'prose')}, the clerks say. Until then, there is ward work.</p>`
        : c ? `<h3>${c.title}</h3><p>${c.text}</p><p>${req}</p><p class="muted">Reward: ${c.rep} reputation, $${commissionPay(c)}${c.gift ? `, a ${VESSELS[c.gift].name.toLowerCase()}` : ''}${c.teaches ? `, and the Clause ${CLAUSES[c.teaches].name}` : ''}.</p>`
          : '<p>City Hall has nothing further to ask of you. It is, frankly, a little afraid of you.</p>'}
    </section>
    ${wardWorkHTML()}
    <section class="panel"><h2>Your standing</h2>
      <p>To the Machine, you are <b>${standingWord('machine')}</b>. To the workers in the Yards, you are <b>${standingWord('union')}</b>. The police are <b>${standingWord('suspicion')}</b>.</p>
    </section>
    <section class="panel"><h2>Ranks</h2><ol class="ladder">${ladder}</ol></section>
    ${done ? `<section class="panel"><h2>Completed commissions</h2><ul class="done">${done}</ul></section>` : ''}
  </div>`;
}

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
  } else if (state.over === 'won' || state.over === 'freed') {
    const ending = FINALE.endings[state.over];
    html = `<h1>${ending.title}</h1>
      ${ending.text.map(x => `<p>${fill(x, { date: dateLabel(state.day, 'long') })}</p>`).join('')}
      ${[ithzarEpilogue(), corneliaEpilogue()].filter(Boolean).map(x => `<p><i>${x}</i></p>`).join('')}
      <button class="primary big" data-action="restart">Begin anew</button>
      <button class="ghost" data-action="close-overlay">Admire your handiwork</button>`;
  }
  if (state.finale) html = finaleHTML(); // the scene at the Crib comes before anything it leads to
  o.hidden = !html || (!state.finale && !!state.over && state.dismissedOverlay === state.over);
  o.innerHTML = html ? `<div class="dialog">${html}</div>` : '';
}
