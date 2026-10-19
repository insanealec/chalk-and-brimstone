'use strict';
// Input and start-up. Loaded last: it wires up clicks and keys, and starts or resumes a game.

// On a phone the thing you just did can land far from your thumb: bring it into view.
function reveal(selector) {
  if (!narrow()) return;
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action],[data-pick],[data-tab],[data-buy],[data-district]');
  if (!el || el.disabled) return;

  if (el.dataset.district) {
    state.district = el.dataset.district;
    render();
    reveal('.panel.district');
    return;
  }

  if (el.dataset.tab) {
    if (el.dataset.tab !== currentTab) journalNews = null;
    currentTab = el.dataset.tab;
    if (currentTab === 'journal') state.newLore = 0;
    render();
    return;
  }

  if (el.dataset.buy) {
    const [kind, id, qty] = el.dataset.buy.split(':');
    buy(kind, id, Number(qty) || 1);
    return;
  }

  if (el.dataset.pick) {
    if (busy) return;
    const s = state.sel;
    const v = el.dataset.value;
    switch (el.dataset.pick) {
      case 'rune':
        if (s.runes.includes(v)) s.runes = s.runes.filter(r => r !== v);
        else if (s.runes.length < MAX_RUNES) s.runes.push(v);
        break;
      case 'incense': s.incense = s.incense === v ? null : v; break;
      case 'overreach': s.overreach = !s.overreach; break;
      case 'brace': s.brace = s.brace.includes(v) ? s.brace.filter(b => b !== v) : [...s.brace, v]; break;
      case 'name': s.name = v; applyNotebook(); break;
      default: s[el.dataset.pick] = v;
    }
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'summon':
      beginSummon();
      if (busy) reveal('.stage');
      break;
    case 'notebook-fill': if (!busy) { applyNotebook(); render(); } break;
    case 'syl': if (!busy) { toggleSyllable(el.dataset.value); render(); } break;
    case 'slot': if (!busy) { state.sel.syllables[Number(el.dataset.value)] = null; render(); } break;
    case 'end-day':
      endDay();
      // the night's news is the point of ending the day: on a phone, open the chronicle to it
      if (narrow() && !state.over) openLog();
      break;
    case 'open-log': openLog(); break;
    case 'close-log': closeLog(); break;
    case 'study': {
      const lore = [...state.lore];
      const entries = newEntries(study);
      journalNews = entries.length ? { entries: entries.reverse(), lore: state.lore.filter(id => !lore.includes(id)) } : null;
      state.newLore = 0; // read on the spot
      render();
      break;
    }
    case 'reinforce': reinforce(el.dataset.value); break;
    case 'release-vessel': releaseVessel(el.dataset.value); render(); break;
    case 'release-familiar': releaseFamiliar(); render(); break;
    case 'bind-into':
      state.sel.clause = el.dataset.value;
      currentTab = 'chamber';
      render();
      break;
    case 'walk': walkStreets(el.dataset.value); break;
    case 'act': doAction(el.dataset.value); break;
    case 'choose': chooseOption(Number(el.dataset.value)); break;
    case 'dismiss': dismiss(Number(el.dataset.value)); break;
    case 'renew': renewServant(Number(el.dataset.value)); break;
    case 'job': handInJob(Number(el.dataset.value)); break;
    case 'ask': askIthzar(el.dataset.value); break;
    case 'prepare':
      state.sel.name = el.dataset.value;
      applyNotebook();
      currentTab = 'chamber';
      render();
      break;
    case 'close-intro': state.seenIntro = true; render(); break;
    case 'finale-next': {
      finaleNext();
      const beat = document.querySelector('.finale .beat.new');
      if (beat) beat.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'finale-close': finaleClose(); break;
    case 'finale-bind': finaleChoose('bind'); break;
    case 'finale-free': finaleChoose('free'); break;
    case 'close-overlay': state.dismissedOverlay = state.over; render(); break;
    case 'restart': restart(false); break;
    case 'new-game':
      if (confirm('Abandon this magician and start a new game?')) restart(true);
      break;
  }
});

// map markers are SVG groups, so give them button-like keyboard behavior
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawerOpen) {
    closeLog();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-district]')) {
    e.preventDefault();
    e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});

document.addEventListener('change', e => {
  if (e.target.dataset.favor) {
    if (!favorBlocker()) state.ithzar.favor = e.target.value || null;
    render();
    return;
  }
  const uid = e.target.dataset.errand;
  if (!uid) return;
  const sv = state.servants.find(s => s.uid === Number(uid));
  if (sv) sv.errand = e.target.value || null;
  render();
});

function restart(showIntro) {
  state = newState();
  state.seenIntro = !showIntro;
  manifestation = null;
  currentTab = 'chamber';
  resetIncantation();
  log('You unlock the door of Mr. Thwaite’s workshop. It smells of chalk and something burnt.', 'info');
  logSeen = state.log[0];
  render();
}

state = load();
if (!state) restart(true);
else {
  const d = state.sel.name && demonById(state.sel.name);
  if (!d || state.sel.syllables.length !== d.trueName.length) resetIncantation();
  logSeen = state.log[0];
  render();
}
