'use strict';
// Drawing the city: the newspaper, the map, districts, places and street encounters.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

function viewCity() {
  const cur = currentEncounter();
  const dist = cur ? cur.dist : districtById(state.district) || DISTRICTS[0];
  return `
  <div class="newspaper panel">
    <div class="masthead"><span class="paper-name">${NEWSPAPER}</span><span class="paper-date">${dateLabel(state.day, 'long')}</span></div>
    ${headlines().map(h => `<p class="headline">${h}</p>`).join('')}
  </div>
  <div class="city">
    <div class="stage map">${cityMapSVG(dist.id)}</div>
    <div class="panel district">${cur ? encounterHTML(cur) : districtHTML(dist)}</div>
  </div>`;
}

function dangerPips(n) {
  return `<span class="pips" title="Danger ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

// One button for a place action or a street choice, with its cost, the familiar's warning and any blocker.
function choiceButton(ch, action, value, blocker, eventTitle = '') {
  const warning = familiarWarning(ch);
  const via = ch.req && ch.req.lantern ? 'lantern' : ch.req && ch.req.ring ? 'signet' : '';
  return `<button class="choice ${via ? 'revealed' : ''} ${eventTitle ? 'event' : ''}" data-action="${action}" data-value="${value}" ${blocker ? 'disabled' : ''}>
    <span>${ch.label}</span>${eventTitle ? `<small class="via">${eventTitle}</small>` : ''}${via ? `<small class="via">${via}</small>` : ''}${ch.cost && !ch.label.includes('$') ? `<small class="cost">$${ch.cost}</small>` : ''}
    ${warning ? `<small class="risk">⚠ ${warning}</small>` : ''}
    ${blocker ? `<small class="why">${blocker}</small>` : ''}
  </button>`;
}

function resultHTML(r) {
  return `<div class="result">
    <p>${r.text}</p>
    ${r.frags.map(id => FRAGMENTS.find(f => f.id === id)).map(f => `<p class="frag"><span class="src">${f.src}</span>“${fmtLore(f.text)}”</p>`).join('')}
    ${r.notes.length ? `<p class="fx">${r.notes.join(' · ')}</p>` : ''}
    ${r.aside ? asideHTML(r.aside) : ''}
  </div>`;
}

function districtHTML(dist) {
  const blocked = districtBlocker(dist);
  const head = `<div class="d-head"><h2>${dist.name}</h2>${dist.danger
    ? `<span class="tag">Danger ${dangerPips(dist.danger)}</span>` : '<span class="tag">Home</span>'}</div>
    <p>${dist.desc}</p>`;
  if (blocked) return `${head}<p class="hint">${blocked}</p>`;
  const r = state.lastResult && state.lastResult.district === dist.id ? state.lastResult : null;

  const places = dist.places.map(place => {
    if (place.unless && state.flags[place.unless] !== undefined) {
      return `<section class="place closed"><h3>${place.name}</h3><p class="muted small">${place.closed}</p></section>`;
    }
    const acts = placeActions(dist, place);
    return `<section class="place ${acts.some(x => x.ev) ? 'has-event' : ''}">
      <h3>${place.name}</h3>
      <p class="muted small">${place.desc}</p>
      ${activeEvents().filter(x => x.stage.place === `${dist.id}:${place.id}` && x.stage.text).map(x => `<p class="event-text">${x.stage.text}</p>`).join('')}
      <div class="choices">${acts.map(({ a, key, ev }) => choiceButton(a, 'act', key, actionBlocker(a, key), ev ? ev.title : '')).join('')}</div>
      ${r && r.place === place.id ? resultHTML(r) : ''}
    </section>`;
  }).join('');

  const label = dist.streetLabel || 'Walk the streets';
  const streetBlocker = state.over ? 'The game is over.' : state.actions < 1 ? 'It is too late in the day.' : null;
  const streets = streetEncounters(dist).length ? `<section class="place streets">
      <h3>${label}</h3>
      <p class="muted small">Wander for an hour and see what turns up.</p>
      <div class="choices"><button class="choice" data-action="walk" data-value="${dist.id}" ${streetBlocker ? 'disabled' : ''}>
        <span>${label}</span>${streetBlocker ? `<small class="why">${streetBlocker}</small>` : ''}</button></div>
      ${r && r.place === null ? `<h4>${r.title}</h4>${resultHTML(r)}` : ''}
    </section>` : '';

  return `${head}<p class="muted small">Everything here takes an hour. You have ${state.actions} left today.</p>${places}${streets}`;
}

function encounterHTML({ dist, enc }) {
  return `
    <div class="d-head"><h2>${enc.title}</h2><span class="tag">${dist.name}</span></div>
    <p>${enc.text}</p>
    <div class="choices">
      ${enc.choices.map((ch, i) => (choiceHidden(ch) ? '' : choiceButton(ch, 'choose', i, choiceBlocker(ch)))).join('')}
    </div>`;
}

function cityMapSVG(selectedId) {
  const grid = [];
  for (let x = 20; x < 480; x += 28) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="520"/>`);
  for (let y = 14; y < 520; y += 28) grid.push(`<line x1="0" y1="${y}" x2="480" y2="${y}"/>`);
  const shore = 'M 478 0 C 468 90, 482 170, 470 250 S 462 400, 492 520';
  const events = activeEvents();

  const markers = DISTRICTS.map(d => {
    const locked = !!districtBlocker(d);
    const sel = d.id === selectedId;
    const pending = state.encounter && state.encounter.district === d.id;
    const news = !locked && events.some(a => a.stage.place.startsWith(`${d.id}:`));
    const lockText = d.rank > rankIndex() ? RANKS[d.rank].name : locked ? `Opens ${dateLabel(d.opensDay)}` : '';
    const labelY = d.y + 34;
    return `<g class="d-marker ${locked ? 'locked' : ''} ${sel ? 'sel' : ''} ${pending ? 'pending' : ''} ${d.id === 'clark' ? 'home' : ''}" data-district="${d.id}" tabindex="0" role="button" aria-label="${d.name}">
      <circle class="halo" cx="${d.x}" cy="${d.y}" r="24"/>
      <circle class="dot" cx="${d.x}" cy="${d.y}" r="15"/>
      <text class="initial" x="${d.x}" y="${d.y + 5}" text-anchor="middle">${d.id === 'clark' ? '⌂' : d.name.replace(/^The /, '')[0]}</text>
      ${news ? `<circle class="news" cx="${d.x + 13}" cy="${d.y - 13}" r="6"/>` : ''}
      <text class="name" x="${d.x}" y="${labelY}" text-anchor="middle">${d.name}</text>
      ${lockText ? `<text class="lock" x="${d.x}" y="${labelY + 15}" text-anchor="middle">${lockText}</text>` : ''}
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 640 520" class="city-svg" role="img" aria-label="Map of Chicago">
    <g class="grid">${grid.join('')}</g>
    <path class="lake" d="${shore} L 640 520 L 640 0 Z"/>
    <path class="shore" d="${shore}"/>
    <g class="waves">
      ${[[530, 60], [600, 250], [540, 330], [610, 420], [520, 480], [610, 70]].map(([x, y]) =>
        `<path d="M ${x} ${y} q 8 -6 16 0 t 16 0"/>`).join('')}
    </g>
    <text class="lake-label" x="600" y="390" transform="rotate(90 600 390)" text-anchor="middle">LAKE MICHIGAN</text>
    <path class="river" d="M 474 176 L 332 178"/>
    <path class="river" d="M 332 178 C 316 130, 292 80, 250 0"/>
    <path class="river" d="M 332 178 C 336 240, 322 292, 292 322 C 262 352, 222 362, 120 368"/>
    <text class="river-label" x="420" y="166" text-anchor="middle">Chicago River</text>
    <text class="area-label" x="447" y="208" text-anchor="middle">THE LOOP</text>
    ${markers}
  </svg>`;
}
