'use strict';
// City Hall's ward work: small paid jobs alongside the commissions, from WARD_JOBS in js/data.js. Once you have
// done your first commission, two are on offer at a time. Each lasts JOB_DAYS; a job you finish, or one that
// lapses, is replaced at the next dawn. Errand jobs are run by a servant overnight (errand 'job:<uid>');
// supply and report jobs are handed in on the City Hall tab.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

const JOB_OFFERS = 2;
const JOB_DAYS = 5;

// pay grows with your rank, so ward work stays worth a servant's night late in the game
const jobPay = base => Math.round(base * (1 + 0.25 * rankIndex()));

const jobByUid = uid => state.jobs.find(j => j.uid === uid && !j.done) || null;

// The job a servant has been sent on, if its errand is one.
const jobForErrand = errand => (errand && errand.startsWith('job:') ? jobByUid(Number(errand.slice(4))) : null);

// A spirit's notebook sheet is complete: true name, runes and the incense it likes.
function sheetComplete(d) {
  const k = dossier(d);
  return k.nameComplete && k.runeCount !== null && k.runeYes.length === k.runeCount && Boolean(k.likes);
}

// Fills the board back up to JOB_OFFERS. Returns how many new jobs were posted.
function offerJobs() {
  if (state.commission < 1 || state.over) return 0;
  state.jobs = state.jobs.filter(j => !j.done && state.day < j.until);
  let posted = 0;
  while (state.jobs.length < JOB_OFFERS) {
    const job = makeJob();
    if (!job) break;
    state.jobs.push(job);
    posted++;
  }
  return posted;
}

// A new job from the templates that can be offered now, avoiding ones on the board or done lately.
function makeJob() {
  const taken = state.jobs.map(j => j.id).concat(state.recentJobs);
  const options = WARD_JOBS.map(t => [t, jobDetails(t)]).filter(([t, x]) => x && !taken.includes(t.id));
  if (!options.length) return null;
  const [t, x] = pick(options);
  state.recentJobs = [t.id, ...state.recentJobs].slice(0, 4);
  return {
    uid: state.nextUid++, id: t.id, kind: t.kind, title: t.title, until: state.day + JOB_DAYS,
    rep: t.kind === 'supply' ? 0 : 1, standing: t.standing || null, ...x,
    text: fill(t.text, { n: x.n, incense: x.incense && INCENSE[x.incense].name.toLowerCase(), name: x.demon && demonById(x.demon).name }),
  };
}

// What this template would ask and pay right now, or null if it can't be offered at your rank.
function jobDetails(t) {
  if (t.kind === 'errand') {
    if (t.diff > Math.max(1, rankTier())) return null;
    return { diff: t.diff, pay: jobPay([0, 18, 35, 60][t.diff]) };
  }
  if (t.kind === 'supply') {
    const sold = Object.keys(INCENSE).filter(k => INCENSE[k].rank <= rankIndex());
    const incense = pick(sold);
    const n = INCENSE[incense].price >= 12 ? rand(1, 2) : rand(2, 4);
    return { incense, n, pay: Math.ceil(INCENSE[incense].price * n * 1.8) + 5 };
  }
  // report: a spirit you know of and could bind at your rank, whose sheet still has gaps
  const unfinished = knownDemons().filter(d => d.tier <= Math.max(1, rankTier() - 1) && !sheetComplete(d));
  if (!unfinished.length) return null;
  const d = pick(unfinished);
  return { demon: d.id, pay: jobPay(10 + 12 * d.tier) };
}

// Why a supply or report job can't be handed in yet, or null if it can.
function handInBlocker(job) {
  if (job.kind === 'supply') {
    const have = state.incense[job.incense] || 0;
    return have < job.n ? `You have ${have} of the ${job.n} sticks.` : null;
  }
  if (job.kind === 'report') {
    return sheetComplete(demonById(job.demon)) ? null : `Your notebook sheet on ${demonById(job.demon).name} is not complete yet.`;
  }
  return 'A servant does this one, overnight.';
}

function handInJob(uid) {
  const job = jobByUid(uid);
  if (!job || state.over || handInBlocker(job)) return;
  if (job.kind === 'supply') state.incense[job.incense] -= job.n;
  completeJob(job);
  render();
}

function completeJob(job) {
  job.done = true;
  state.jobsDone++;
  state.dollars += job.pay;
  const notes = [`+$${job.pay}`];
  if (job.rep) notes.push(`+${job.rep} reputation`);
  log(`<b>Ward work done: ${job.title}.</b> City Hall pays on the nail. (${notes.join(', ')})`, 'good');
  if (job.rep) gainRep(job.rep);
  for (const [k, v] of Object.entries(job.standing || {})) {
    state.standing[k] = clamp(state.standing[k] + v, k === 'suspicion' ? 0 : -10, 10);
  }
  state.servants.forEach(sv => { if (sv.errand === `job:${job.uid}`) sv.errand = 'coin'; });
}
