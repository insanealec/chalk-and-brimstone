'use strict';
// Core: constants, dice, game state and saving, the chronicle, health and rank.
// Part of the game engine. All of js/ is plain scripts sharing one global scope, loaded in the order
// listed in index.html; functions may call into files loaded later, but top-level code may not.

const SAVE_KEY = 'chalk-and-brimstone-v3';

// tools/playtest.html sets this before loading the game, so automated games never touch the player's save
const PLAYTEST = window.CHALK_PLAYTEST === true;

const MAX_HEALTH = 10;
const ACTIONS_PER_DAY = 3;
const MAX_RUNES = 3;
const HOUR_NAMES = ['Night', 'Evening', 'Afternoon', 'Morning'];
const FRAGMENTS = DEMONS.flatMap(d => d.lore.map((f, i) => ({ id: `${d.id}-${i}`, demon: d, ...f })));
let state = null;
let currentTab = 'chamber';
let manifestation = null; // result of the most recent summoning, shown in the chamber
let busy = false;         // true while the summoning animation plays
const $ = sel => document.querySelector(sel);

// Every roll of the dice goes through random(), so the playtest tool can seed it and replay a game exactly.
let random = Math.random;

function seedRandom(seed) {
  let a = seed >>> 0;  // mulberry32
  random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = (a, b) => a + Math.floor(random() * (b - a + 1));
const pick = arr => arr[Math.floor(random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
const demonById = id => DEMONS.find(d => d.id === id);
const circleById = id => CIRCLES.find(c => c.id === id);
const pentacleById = id => PENTACLES.find(p => p.id === id);
const bold = d => `<b>${d.name}</b>`;

function newState() {
  return {
    day: 1, actions: ACTIONS_PER_DAY, dollars: 30, health: MAX_HEALTH, rep: 0,
    circles: ['chalk'], pentacles: ['chalk'], runes: [...START_RUNES],
    incense: { rosemary: 2, cedar: 1, frankincense: 1 },
    lore: ['nibbet-0'],
    newLore: 1,
    facts: {},  // demon id -> facts observed in the chamber (lore facts are derived from state.lore)
    met: [],    // spirits that have appeared in your circle, even ones you never read about
    cribTrips: 0, // times you have rowed out to the Water Crib to call up the marid (js/engine/finale.js)
    tempers: {},  // spirit id -> the day the notebook learned what it is good and bad at
    keptHouse: 0, // the dawn after a night Phebbet kept house: the workshop was guarded
    memory: {}, // per spirit: { times it has answered you, how its last stint with you ended } (see remember())
    servants: [],
    nextUid: 1,
    commission: 0,
    commissionDay: 0,       // the day the last commission was done (a commission with `wait` waits from then)
    jobs: [],               // City Hall's ward work on offer (js/engine/jobs.js)
    jobsDone: 0,
    recentJobs: [],         // ids of jobs offered lately, so the board doesn't repeat itself
    log: [],
    over: null, // 'dead' | 'won'
    deathCause: '',
    seenIntro: false,
    sel: { name: 'nibbet', syllables: [], clause: 'service', circle: 'chalk', pentacle: 'chalk', runes: [], incense: null, overreach: false, brace: [] },
    familiarOut: { own: 0, ithzar: 0 },  // day each familiar is back from bracing a circle
    clauses: ['service'],   // binding clauses learned
    vessels: {},            // vessel type -> { cap, spirit } for vessels you own
    familiar: null,         // demon id of your familiar
    district: 'maxwell',    // district selected on the city map
    encounter: null,        // { district, id } street encounter awaiting a choice
    lastResult: null,       // what happened on the last action in the city
    lastStreet: {},         // district id -> its last few street encounters, newest first, to avoid repeats
    used: {},               // action key -> day last used (for once and cooldown)
    events: {},             // event id -> { stage, since, done }
    flags: {},              // story flag -> day it was set
    standing: { machine: 0, union: 0, suspicion: 0, trust: 0 },  // trust: Ithzar's
    ithzar: { joined: false, heard: {}, asideDay: {}, warned: false, claims: {}, favor: null, favorDay: -99, askDay: null, awayDay: null },
  };
}

function save() {
  if (PLAYTEST) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

function load() {
  if (PLAYTEST) return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = Object.assign(newState(), JSON.parse(raw));
    // fill in nested fields added since the save was made
    saved.standing = { ...newState().standing, ...saved.standing };
    saved.ithzar = { ...newState().ithzar, ...saved.ithzar };
    saved.sel = { ...newState().sel, ...saved.sel };
    return saved;
  } catch (e) { /* corrupt or unavailable */ }
  return null;
}

function rankIndex() {
  let r = 0;
  RANKS.forEach((k, i) => { if (state.rep >= k.rep) r = i; });
  return r;
}

const rankTier = () => rankIndex() + 1;
const maxServants = () => rankTier();

function log(html, kind = '') {
  const entry = { day: state.day, html, kind };
  state.log.unshift(entry);
  if (state.log.length > 150) state.log.length = 150;
  return entry;
}

function gainRep(n) {
  const oldRank = rankIndex();
  state.rep += n;
  if (rankIndex() > oldRank) {
    log(`You have risen to the rank of <b>${RANKS[rankIndex()].name}</b>. New wares, districts and lore are open to you, and you may hold ${maxServants()} spirits at once.`, 'good');
  }
}

// Adds `count` random incense no rarer than `maxRank`; returns a description like "2 cedar, 1 myrrh".
function grantRandomIncense(count, maxRank) {
  const pool = Object.keys(INCENSE).filter(k => INCENSE[k].rank <= maxRank);
  const got = {};
  for (let i = 0; i < count; i++) {
    const k = pick(pool);
    got[k] = (got[k] || 0) + 1;
    state.incense[k] = (state.incense[k] || 0) + 1;
  }
  return Object.entries(got).map(([k, n]) => `${n} ${INCENSE[k].name.toLowerCase()}`).join(', ');
}

// Injuries are reduced by a cane's spirit and by a familiar of class 3 or more. Returns the damage taken.
function hurt(n, cause) {
  const guard = (vesselTier('cane') ? caneGuard(vesselTier('cane')) : 0) + (familiarTier() >= 3 ? 1 : 0);
  const taken = Math.max(0, n - guard);
  state.health -= taken;
  if (state.health <= 0) {
    state.health = 0;
    state.over = 'dead';
    state.deathCause = cause;
  }
  return taken;
}

const hurtNote = (taken, n) => `−${taken} health${taken < n ? `, ${n - taken} turned aside` : ''}`;
