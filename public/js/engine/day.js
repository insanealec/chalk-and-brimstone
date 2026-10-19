'use strict';
// The passing of days and the career: nightfall, City Hall commissions, and the market.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

function endDay() {
  if (state.over || busy) return;
  log('Night falls.', 'info');
  runIthzarFavor();
  for (const sv of [...state.servants]) {
    if (sv.errand) runErrand(sv);
    if (state.over) break;
  }
  if (!state.over) {
    for (const sv of [...state.servants]) {
      sv.patience--;
      if (sv.patience <= 0 || (sv.strained && random() < 0.15)) expire(sv);
      if (state.over) break;
    }
  }
  if (!state.over) {
    state.health = Math.min(MAX_HEALTH, state.health + 1);
    state.day++;
    state.actions = maxActions();
    log(`${dateLabel(state.day, 'long')} dawns.`, 'info');
    for (const sv of state.servants.filter(x => x.patience <= 1)) {
      const d = demonById(sv.demonId);
      log(sv.binding === 'firm'
        ? `${bold(d)}’s service ends tonight. You can renew it on the Servants tab.`
        : `${bold(d)}’s bonds will snap tonight unless you dismiss it.`, sv.binding === 'firm' ? '' : 'bad');
    }
    const c = currentCommission();
    if (c && (c.wait || c.notBefore) && state.day === commissionDue()) {
      log(`City Hall sends for you. <b>${c.title}</b>: see the City Hall tab.`, 'news');
      sendFile();
    }
    if (offerJobs()) log('City Hall has posted new ward work.', 'info');
    processEvents();
    ithzarDawn();  // before suspicion fades, so its warning sees today's danger
    coolSuspicion();
    scry();
    if (state.familiar && random() < 0.4) log(fill(pick(FAMILIAR_QUIPS), { name: bold(demonById(state.familiar)) }));
  }
  manifestation = null;
  render();
}

const currentCommission = () => COMMISSIONS[state.commission] || null;

// The day City Hall asks for the current commission: `wait` days after the last was done, and not before
// `notBefore`. Most commissions come at once.
function commissionDue() {
  const c = currentCommission();
  return c ? Math.max(state.commissionDay + (c.wait || 0), c.notBefore || 0) : 0;
}

const commissionReady = () => Boolean(currentCommission()) && state.day >= commissionDue();

// City Hall sends a file on a suitable spirit when a binding commission comes up (see COMMISSIONS).
function sendFile() {
  const c = currentCommission();
  if (!c || !c.file || !commissionReady() || state.lore.includes(c.file)) return;
  const f = FRAGMENTS.find(x => x.id === c.file);
  state.lore.push(f.id);
  state.newLore++;
  log(`City Hall sends over a file for <b>${c.title}</b>. <span class="src">${f.src}:</span> “${fmtLore(f.text)}”`, 'lore');
}

// a signet ring with a spirit in it makes City Hall more generous
const commissionPay = c => Math.round(c.pay * (1 + 0.25 * vesselTier('ring')));

function checkBindCommission(d) {
  const c = currentCommission();
  if (c && c.type === 'bind' && commissionReady() && d.tier >= c.tier) completeCommission();
}

function completeCommission() {
  const c = currentCommission();
  const pay = commissionPay(c);
  state.dollars += pay;
  state.commission++;
  state.commissionDay = state.day;
  state.servants.forEach(s => { if (s.errand === 'commission') s.errand = null; });
  sendFile();
  const next = currentCommission();
  if (next && !commissionReady()) {
    log(`City Hall will be in touch about the lake. It expects to send word by ${dateLabel(commissionDue(), 'prose')}; until then, there is ward work.`, 'info');
  }
  offerJobs();
  log(`<b>Commission complete: ${c.title}.</b> ${c.done} (+${c.rep} reputation, +$${pay})`, 'good');
  gainRep(c.rep);
  if (c.gift && !state.vessels[c.gift]) {
    state.vessels[c.gift] = { cap: VESSELS[c.gift].cap, spirit: null };
    log(`You now own a ${VESSELS[c.gift].name.toLowerCase()}. See the workshop.`, 'good');
  }
  if (c.teaches && !state.clauses.includes(c.teaches)) {
    state.clauses.push(c.teaches);
    log(`You have learned the Clause ${CLAUSES[c.teaches].name}. ${CLAUSES[c.teaches].desc}`, 'good');
  }
  if (c.win) state.over = 'won';
}

function buy(kind, id, qty = 1) {
  const r = rankIndex();
  let price, rank, apply;
  switch (kind) {
    case 'incense': ({ price, rank } = INCENSE[id]); price *= qty;
      apply = () => { state.incense[id] = (state.incense[id] || 0) + qty; }; break;
    case 'circle': ({ price, rank } = circleById(id));
      apply = () => state.circles.push(id); break;
    case 'pentacle': ({ price, rank } = pentacleById(id));
      apply = () => state.pentacles.push(id); break;
    case 'rune': ({ price, rank } = RUNES[id]);
      apply = () => state.runes.push(id); break;
    case 'grimoire': price = grimoirePrice(); rank = 0;
      apply = () => {
        if (!learnFragment(1, Math.min(5, rankTier() + 1))) {
          log('The grimoire turns out to be a cookbook. The bookseller refunds you, grudgingly.');
          state.dollars += price;
        }
      }; break;
    case 'vessel': ({ price, rank } = VESSELS[id]);
      if (state.vessels[id]) return;
      apply = () => { state.vessels[id] = { cap: VESSELS[id].cap, spirit: null }; }; break;
    case 'poultice': price = 6; rank = 0;
      apply = () => { state.health = Math.min(MAX_HEALTH, state.health + 2); }; break;
    default: return;
  }
  if (rank > r || state.dollars < price || state.over) return;
  state.dollars -= price;
  apply();
  render();
}

const grimoirePrice = () => 10 + 5 * rankTier();
