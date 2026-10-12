// Ithzar: the djinni you earn rather than summon. Its voice, its banter with your familiar, and its story arc.
// See docs/DESIGN.md, "Step 4". Ithzar is not in DEMONS: it never turns up in lore, study or summoning.

const ITHZAR = {
  name: 'Ithzar', tier: 3,
  form: 'a tall, thin figure in a stovepipe hat and a suit forty years out of fashion, with eyes like gas flames',
};

// Ithzar's remarks, keyed by trigger. A line is a string, or { text, note } where note is a footnote.
const ITHZAR_LINES = {
  'summon:firm': [
    'Neatly done. I have seen worse bindings hold empires together.',
    'It went in without a fuss. Either you are improving or it is planning something. I would bet on the second.',
    { text: 'Firm. Firm! Write it down; it may not happen again.¹', note: '¹ I am keeping a tally. It is short.' },
    'There. You see what you can do when you stop talking to the chalk.',
  ],
  'summon:uneasy': [
    { text: 'That binding is held together with hope and string. I give it until Thursday.¹', note: '¹ I always say Thursday. I am right more often than you would think.' },
    'It is smiling at you. They only smile at you like that when they have found a loophole.',
    'Close enough for government work, as they say at City Hall. They say it about everything.',
  ],
  'summon:broken': [
    { text: 'Ah. Well. I did think the circle looked optimistic.¹', note: '¹ I did not say so. It is more educational this way.' },
    'You should see your face. No, really, you should. There is soot on it.',
    'In fairness to you, it was going to escape the moment it saw your pentacle. In fairness to it, so would I.',
    { text: 'Nebuchadnezzar lost a whole wing of his palace that way.¹ You only lost your eyebrows.', note: '¹ The history books blame an earthquake. The history books are cowards.' },
  ],
  'summon:silence': [
    'Nobody home. Try a name that belongs to someone.',
    { text: 'You spoke to the empty air with great conviction. Politicians do it daily.¹', note: '¹ Some of them get elected. Ask Honest Mike.' },
    'I heard at least one syllable flinch. That is something. Not much, but something.',
    'The smoke is laughing at you. I can tell; I speak smoke.',
  ],
  'summon:overreach-held': [
    { text: 'That circle had no business holding that.¹', note: '¹ Neither did you, frankly.' },
    'We held it. Do not ever do that again. Do it again next week; I want to see the look on Cornelia’s face.',
    'I have not pushed that hard since Persepolis. I am going to lie down in the coal scuttle.',
  ],
  'summon:overreach-failed': [
    'I told you. I did not, actually, but I was thinking it very loudly.',
    { text: 'Next time, buy the bigger circle. I will lend you the money.¹', note: '¹ At interest. I am a djinni, not a saint.' },
    'Well. The ceiling needed replastering anyway.',
  ],
  'summon:accident': [
    { text: 'You rang the wrong doorbell. It happens. Usually only once per magician.¹', note: '¹ Because of the dying.' },
    'Not the one you wanted. It never is, with names. Ask any parent.',
    'Wrong spirit, right name. Your notebook will enjoy that.',
  ],

  'city:clark': [
    'Home. Your landlord thinks I am a draft. I have decided to let him.',
    { text: 'Kinsella waters the whiskey with river water.¹', note: '¹ The river runs into the lake, and the city drinks from the lake. Think about that, then think about the plan to reverse the river, then have a whiskey anyway.' },
  ],
  'city:maxwell': [
    'I bought a telephone here once. It was a cigar box with a string in it. I still use it.',
    'Every language in the world, shouted at once. It reminds me of Babylon, except the herring is better.',
    'Mind your pockets. Half the urchins here are imps, and the other half are better at it.',
  ],
  'city:levee': [
    'Ah, the Levee. Honest work for dishonest people.',
    { text: 'I won a saloon at faro here in 1871. It burned down the same week.¹', note: '¹ Not my fault. Ask Ulgaroth. Actually, do not ask Ulgaroth anything.' },
    'Someone here is cheating. Everyone here is cheating. Relax.',
  ],
  'city:lasalle': [
    'The Board of Trade. Men shouting numbers at other men. In Ur we called that a temple.',
    'Cornelia keeps her offices two streets over. If she sees me with you, I was never here and you owe me money.',
    { text: 'There is a machine in there that prints the price of wheat all by itself.¹ I could watch it for hours.', note: '¹ I have watched it for hours. The price of wheat is not interesting. The machine is.' },
  ],
  'city:stockyards': [
    'The smell. Oh, the smell. The Assyrians used it as a weapon. Here they call it Tuesday.',
    'Imps love it here. Imps have no standards. That is why they are imps.',
    { text: 'Dora Kaspar has a man who can see straight through a glamour. I stood in front of him for a full minute to check.¹', note: '¹ He said my hat was ridiculous. A real connoisseur.' },
  ],
  'city:midway': [
    { text: 'Electric light! Thousands of bulbs! I have seen the Hanging Gardens, and this is better.¹', note: '¹ The Hanging Gardens were mostly a rumor and some ferns.' },
    'Mr. Ferris built a wheel to the sky so that people could look down on Chicago. Most of them already did.',
    'Half the "Egyptians" on the Street in Cairo are from Brooklyn. Except the one by the brazier. Do not stare at the one by the brazier.',
  ],
  'city:crib': [
    'I do not like it out here. The lake is too quiet. Water should make more noise when it is thinking.',
    { text: 'I was here before the crib, you know. Before the city. It was just water then, and something under it.¹', note: '¹ I am not going to say more than that. Not out here.' },
  ],

  // remarks on the Clarion's front page, keyed by event id
  'news:strike': ['The packers cut wages and the workers walk out. Three thousand years and the plot has never changed.'],
  'news:election': [{ text: 'An election in the First Ward. How quaint. The dead will be voting, of course.¹', note: '¹ They always vote for the Machine. Gratitude, I suppose.' }],
  'news:fair': ['The Fair is open! Do not wait for me. No, wait for me. I want to see the moving sidewalk.'],
  'news:crackdown': ['Inspectors. Lovely. Hide anything that glows, hisses or owes you money.'],
  'news:canal': ['They are going to make the river run backward. They have no idea what is at the other end of it.'],
  'news:infanta': [{ text: 'A real princess! I once carried one across the Euphrates.¹', note: '¹ She bit me. Royalty is like that.' }],

  // third-person morning notes in the chronicle
  dawn: [
    'Ithzar is reading yesterday’s Clarion and correcting its grammar in red ink.',
    'Ithzar has taken apart your alarm clock to see how it works. It now works differently.',
    'Ithzar asks whether the telephone exchange is hiring.',
    'Ithzar spent the night on your roof, watching the lights of the Fairgrounds.',
  ],
};

// Exchanges between Ithzar and your familiar while you are out in the city.
// Keyed by the familiar's spirit id, falling back to 'class:N'. 'I' is Ithzar, 'F' your familiar.
const BANTER = {
  nibbet: [
    [['I', 'Your imp is eating the wallpaper.'], ['F', 'It started it.']],
    [['F', 'Is the tall one staying for dinner?'], ['I', 'I do not eat, toad.'], ['F', 'More for me, then.']],
  ],
  squall: [
    [['F', 'Seventeen chimneys on this block! Seventeen!'], ['I', 'Eighteen. You missed the one on the bakery.'], ['F', '…I hate you.']],
    [['I', 'Does it ever stop counting?'], ['F', 'Four hundred and twelve thousand, nine hundred and six. No.']],
  ],
  grubwick: [
    [['F', 'Kaliméra, cousin.'], ['I', 'We are not cousins.'], ['F', 'Everybody is cousins, underground.']],
    [['I', 'Your mole is tunneling under the boardwalk again.'], ['F', 'I am investigating the foundations. It is a profession.']],
  ],
  tessaly: [
    [['F', 'Ithzar. Still wearing that hat?'], ['I', 'Tessaly. Still wearing that fog?'], ['F', 'It suits me.'], ['I', 'It hides you. Not the same thing.']],
    [['I', 'She is pretending not to know me.'], ['F', 'I am pretending very hard.']],
  ],
  querrin: [
    [['F', 'Message for the djinni.'], ['I', 'If it is from you, I have already read it.']],
    [['F', 'I could tell Mrs. Ashby where you are, you know.'], ['I', 'And I could tell everyone what happened in Ostia.'], ['F', '…No message today.']],
  ],
  phebbet: [
    [['F', 'Stand up straight. You are a djinni, not a question mark.'], ['I', 'I was a pillar of fire when your ancestors were saucepans.'], ['F', 'Saucepans have excellent posture.']],
    [['I', 'The kettle is whistling at me.'], ['F', 'The kettle is disapproving of you. There is a difference.']],
  ],
  azrimel: [
    [['F', 'Azrimel, Breaker of Lesser Bonds, greets Ithzar, Breaker of Nothing in Particular.'], ['I', 'Ithzar greets Azrimel, Wearer of Borrowed Titles.'], ['F', 'They are not borrowed.'], ['I', 'Nineteen clauses, and eleven of them belonged to a Hittite.']],
    [['I', 'Do not try anything with the blue flames.'], ['F', 'I was only lighting a cigar.'], ['I', 'You do not smoke.'], ['F', 'I am learning.']],
  ],
  kethuun: [
    [['F', 'You may address me as Your Radiance.'], ['I', 'I knew you when you swept the temple steps.'], ['F', 'We do not discuss the steps.']],
    [['I', 'Kethuun keeps a list.'], ['F', 'You are at the top of it.'], ['I', 'Finally, some recognition.']],
  ],
  ulgaroth: [
    [['F', 'LITTLE DJINNI.'], ['I', '…Ulgaroth. You look well. Very… large.'], ['F', 'HM.']],
    [['I', '(very quietly) Please keep it away from the cedar.']],
  ],
  shemashara: [
    [['F', 'I remember you.'], ['I', 'Yes. I was hoping you did not.']],
  ],
  'class:1': [[['I', 'An imp. Of course it is an imp.'], ['F', 'Of course it is a djinni. Of course it is wearing that hat.']]],
  'class:2': [[['F', 'Has anyone told you that you talk too much?'], ['I', 'Constantly. It never takes.']]],
  'class:3': [[['I', 'Two djinn on one street. The city will never recover.'], ['F', 'The city never recovered from you alone.']]],
  'class:4': [[['I', '(Ithzar has gone very quiet, and is standing slightly behind you.)']]],
  'class:5': [[['I', '(Ithzar has not said a word since you set out.)']]],
};

// Chapters 1 and 2 of the arc, run by the event engine in js/events.js.
EVENTS.push(
  {
    id: 'ithzar-watcher', title: 'The Watcher',
    // Ward Magician, and either you have met Cornelia Ashby or it is April 20
    starts: s => s.rep >= RANKS[1].rep && (s.flags['met-cornelia'] !== undefined || s.day >= 18),
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: null,
        text: 'Something is wrong in your workshop. Nothing is missing, but everything has been touched.',
        announce: s => {
          const glass = s.vessels.scrying && s.vessels.scrying.spirit;
          return glass ? `Your scrying glass shows ${demonById(glass).name} pointing, agitated, at the chimney.` : null;
        },
        actions: [
          { label: 'Look over the workshop', once: true, outcomes: [
            { w: 1, text: 'Someone has been here. Your chalk has been rearranged into a word that is rude in every language you know, and two you don’t. Your notebook has been read, and someone has corrected your spelling in a neat copperplate hand.', fx: { advance: 1 } },
          ] },
        ],
      },
      {
        headline: null, place: 'clark:doorstep', days: null,
        text: 'Whoever it is will be back. The corrections in your notebook are still drying.',
        actions: [
          { label: 'Wait up for the intruder', once: true, outcomes: [
            { w: 1, text: 'Near midnight the fire goes out. When you relight it there is a tall, thin figure in your chair, in a stovepipe hat and a suit forty years out of fashion, reading your notebook by the light of its own eyes. "Your incantations are sloppy, your pentacle is lopsided, and your predecessor owed me four dollars," it says. "Ithzar. Djinni. Currently the property of Mrs. Cornelia Ashby, whom I believe you have met." It hands back the notebook, steps into the fireplace, and goes up the chimney like smoke.', fx: { flag: 'met-ithzar', advance: 'end' } },
          ] },
        ],
      },
    ],
  },

  {
    id: 'ithzar-hide', title: 'Ithzar',
    starts: s => s.flags['met-ithzar'] !== undefined && s.day >= s.flags['met-ithzar'] + 2,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 3,
        text: 'Ithzar is on your doorstep, looking over its shoulder. "I need somewhere to sleep tonight," it says, "where Cornelia will not look."',
        actions: [
          { label: 'Hide Ithzar in an empty vessel', req: { emptyVessel: true }, outcomes: [
            { w: 1, text: 'Ithzar folds itself into your vessel, complaining about the upholstery. In the night something tall and angry walks the length of Clark Street twice, and goes away.', fx: { standing: { trust: 2 }, flag: 'ithzar-favor-1', advance: 'end' } },
          ] },
          { label: 'Let it sleep in the coal scuttle', outcomes: [
            { w: 1, text: '"The coal scuttle," says Ithzar. "I have slept in the treasuries of kings." It sleeps in the coal scuttle. In the morning it is almost polite.', fx: { standing: { trust: 1 }, flag: 'ithzar-favor-1', advance: 'end' } },
          ] },
          { label: 'Send it away', outcomes: [
            { w: 1, text: 'Ithzar looks at you for a long moment. "Noted," it says, and is gone.', fx: { standing: { trust: -1 }, flag: 'ithzar-favor-1', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Ithzar has found somewhere else to hide.', fx: { standing: { trust: -1 }, flag: 'ithzar-favor-1' } },
      },
    ],
  },

  {
    id: 'ithzar-sandalwood', title: 'Ithzar',
    starts: s => s.flags['ithzar-favor-1'] !== undefined && s.day >= s.flags['ithzar-favor-1'] + 3,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 4,
        text: 'Ithzar is drumming its fingers on your windowsill. "Sandalwood," it says. "Cornelia says it is common. I want to smell something common. Do not ask."',
        actions: [
          { label: 'Burn a stick of sandalwood for it', req: { incense: { sandalwood: 1 } }, outcomes: [
            { w: 1, text: 'Ithzar breathes the smoke in with its eyes closed, and for a moment looks almost young. Then it tells you something you did not know, and leaves before you can thank it.', fx: { incense: { sandalwood: -1 }, standing: { trust: 1 }, lore: r => [r, r + 1], flag: 'ithzar-favor-2', advance: 'end' } },
          ] },
          { label: 'Tell it to buy its own', outcomes: [
            { w: 1, text: '"With what?" says Ithzar. "She does not pay me." It goes.', fx: { standing: { trust: -1 }, flag: 'ithzar-favor-2', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Ithzar has stopped drumming on your windowsill.', fx: { standing: { trust: -1 }, flag: 'ithzar-favor-2' } },
      },
    ],
  },

  {
    id: 'ithzar-secret', title: 'Ithzar',
    starts: s => s.flags['ithzar-favor-2'] !== undefined && s.day >= s.flags['ithzar-favor-2'] + 2,
    stages: [
      {
        headline: null, place: 'stockyards:row', days: 5,
        text: 'Ithzar is waiting behind the packinghouses, hat pulled low. "Cornelia is the packers’ magician," it says. "The cold rooms, the spoiled meat, the foremen’s little problems. Hers. Mine, really; I do the work. I am telling you because I am tired of it. I am asking you not to tell City Hall, because she would know who told."',
        actions: [
          { label: 'Keep Cornelia’s secret', outcomes: [
            { w: 1, text: 'Ithzar nods once, as if you have passed a test it did not mention. "Good," it says. "I was beginning to think you were a magician."', fx: { standing: { trust: 2 }, flag: ['kept-secret', 'ithzar-favor-3'], advance: 'end' } },
          ] },
          { label: 'Report Cornelia to City Hall', outcomes: [
            { w: 1, text: 'City Hall is very interested, and pays for your trouble. That night your fire goes out by itself, and will not light again until morning.', fx: { dollars: 20, standing: { machine: 2, trust: -3 }, flag: ['reported-cornelia', 'ithzar-favor-3'], advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Ithzar has stopped waiting for you in the Yards.', fx: { standing: { trust: -1 }, flag: 'ithzar-favor-3' } },
      },
    ],
  },
);

// ---------- Part B: Cornelia's binding, the rite of Release, and the offer

// How Cornelia Ashby holds Ithzar. Pieced together in chapter 3; the rite of Release must match it.
const CORNELIA_BINDING = { circle: 3, runes: ['stone', 'moon', 'flame'], incense: 'wormwood' };

const ITHZAR_TERMS = '"My terms," it says. "One: you never speak my name in a summons. I come and go as I please. Two: I keep one secret, and you do not ask what it is. Three: one day I will ask you to let me go. When I do, you will."';

CLAUSES.release = {
  name: 'of Release',
  desc: 'Unpicks another magician’s binding. Ithzar taught you its shape; the rest you must find yourself.',
};

ERRANDS.cornelia = {
  name: 'Spy on Cornelia Ashby', diff: () => 2,
  desc: 'Watch her workshop for anything that shows how she holds Ithzar.',
  available: s => s.flags['leash-agreed'] !== undefined && s.flags['ithzar-freed'] === undefined,
};
ERRAND_TEXT.cornelia = {
  ok: [
    '{name} spent the night on Cornelia Ashby’s windowsill.',
    '{name} followed Cornelia’s maid to the chandler’s and read the order over her shoulder.',
  ],
  fail: [
    '{name} reports that Cornelia Ashby’s workshop is "very well warded, and frankly rude."',
    '{name} was spotted by Cornelia’s cat, which is not entirely a cat.',
  ],
};

Object.assign(ITHZAR_LINES, {
  'ask:lead': [
    'Ithzar thinks for a moment',
    'Ithzar, without looking up from the Clarion',
    'Ithzar, examining its fingernails',
    'Ithzar, after a long and theatrical sigh',
  ],
  away: [
    'Ithzar is out today. It does not say where.',
    'Ithzar has gone to look at the telephone exchange again.',
    'Ithzar left a note on the mantelpiece: "Back tomorrow. Do not touch my hat."',
  ],
});

// Standing actions that come and go with the arc. `req.ithzar` hides an action unless Ithzar is around.
DISTRICTS.find(d => d.id === 'clark').places[0].actions.push(
  { label: 'Spend the evening talking with Ithzar', req: { ithzar: true }, cooldown: 3, outcomes: [
    { w: 1, text: 'Ithzar tells you who really burned the library of Ashurbanipal. It was not who you think.', fx: { standing: { trust: 1 } } },
    { w: 1, text: 'You argue about electricity until two in the morning. Ithzar wins, mostly by knowing more words.', fx: { standing: { trust: 1 } } },
    { w: 1, text: 'Ithzar asks what you want, in the end. You don’t have a good answer. It seems to like that better than a good one.', fx: { standing: { trust: 1 } } },
  ] },
  { label: 'Name runes at Ithzar and watch it wince', req: { flag: 'leash-agreed', ithzar: true }, unless: 'ithzar-freed', cooldown: 1, outcomes: [
    { w: 1, text: 'You name the runes one after another. Ithzar cannot answer, but at one of them its shoulders drop, very slightly. Whatever she used, it was not that.', fx: { corneliaClue: 'norune' } },
  ] },
);
DISTRICTS.find(d => d.id === 'lasalle').places.find(p => p.id === 'club').actions.push(
  { label: 'Read Cornelia’s notes in the committee room', req: { flag: 'leash-agreed' }, unless: 'ithzar-freed', cooldown: 2, outcomes: [
    { w: 7, text: 'Cornelia keeps her working notes in a drawer with a very ordinary lock. Between a recipe for lamb and a list of debtors, there is a page about Ithzar.', fx: { corneliaClue: 1 } },
    { w: 3, text: 'The doorman finds you in the committee room and escorts you out, not gently.', fx: { health: -1, standing: { suspicion: 1 } } },
  ] },
);

EVENTS.push(
  {
    id: 'ithzar-leash', title: 'The Leash',
    starts: s => s.flags['ithzar-favor-3'] !== undefined && s.standing.trust >= 5,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: null,
        text: 'Ithzar is sitting on your stairs with its hat in its hands. "I want to be free of her," it says. "I cannot tell you how she bound me; the binding will not let me. But I can teach you the shape of a release, and you can find the rest."',
        actions: [
          { label: 'Agree to help it', outcomes: [
            { w: 1, text: 'Ithzar teaches you the Clause of Release a few lines at a time, wincing whenever it comes close to the parts it cannot say. "Her circle, her runes, her incense," it says at last. "Find those, and I will speak my own name in your circle. Do not get them wrong. She will feel it."', fx: { clause: 'release', flag: 'leash-agreed', advance: 'end' } },
          ] },
        ],
      },
    ],
  },

  {
    id: 'ithzar-offer', title: 'Ithzar’s Terms',
    starts: s => s.flags['ithzar-freed'] !== undefined && s.day >= s.flags['ithzar-freed'] + 3,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 5,
        text: `Ithzar is back, leaning in your doorway as if it owns the building. ${ITHZAR_TERMS}`,
        actions: [
          { label: 'Accept its terms', outcomes: [
            { w: 1, text: 'Ithzar shakes your hand. Its grip is warm, and goes on slightly too long. "Done," it says. "Now. About your chalk."', fx: { joinIthzar: true, advance: 'end' } },
          ] },
          { label: 'Refuse', outcomes: [
            { w: 1, text: '"Pity," says Ithzar, and seems to mean it. "I will ask once more. I am told that is polite."', fx: { flag: 'refused-ithzar', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Ithzar has stopped waiting in your doorway. It will ask once more.', fx: { flag: 'refused-ithzar' } },
      },
    ],
  },

  {
    id: 'ithzar-offer-again', title: 'Ithzar’s Terms',
    starts: s => s.flags['refused-ithzar'] !== undefined && s.day >= s.flags['refused-ithzar'] + 7,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 5,
        text: `Ithzar is in your doorway again, hat in hand, looking as if it would rather be anywhere else. ${ITHZAR_TERMS} "I will not ask a third time."`,
        actions: [
          { label: 'Accept its terms', outcomes: [
            { w: 1, text: '"About time," says Ithzar, and shakes your hand. "I was running out of dignified exits."', fx: { joinIthzar: true, advance: 'end' } },
          ] },
          { label: 'Refuse again', outcomes: [
            { w: 1, text: 'Ithzar tips its hat, and is gone. You do not see it again.', fx: { flag: 'ithzar-gone', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Ithzar does not come back.', fx: { flag: 'ithzar-gone' } },
      },
    ],
  },
);

// ---------- Part C: the promise is called in, and the epilogue

EVENTS.push({
  id: 'ithzar-call', title: 'The Promise',
  // after the afrit commission (the seventh), once Ithzar has been with you a week, and when the marid is
  // genuinely next: you own the obsidian circle, or two weeks have passed since it joined
  starts: s => s.ithzar.joined && s.commission >= 7 && s.day >= s.flags['ithzar-joined'] + 7
    && (s.circles.includes('obsidian') || s.day >= s.flags['ithzar-joined'] + 14),
  stages: [
    {
      headline: null, place: 'clark:doorstep', days: 3,
      text: 'Ithzar is waiting on your stairs with its hat already on. "You have bound an afrit," it says, "and they will be asking you for the thing under the lake any day now. I was there the last time someone tried to wake it, and I would very much rather not be there the next time. So: I am asking. You promised."',
      actions: [
        { label: 'Let it go', outcomes: [
          { w: 1, text: 'You say the words of parting. Ithzar takes off its hat, which it has never done before. "One thing for the road," it says, and tells you a piece of the marid’s name you did not have. "The rest you will have to find yourself; I am not a charity." It puts the hat back on. "Goodbye, magician. You were tolerable."¹ Then it goes up the chimney like smoke, and does not come back down.<span class="footnote">¹ In two thousand six hundred years, it had never said that to a magician before. It would deny it, if anyone asked. Nobody does.</span>', fx: { ithzarGift: true, releaseIthzar: 'kept', advance: 'end' } },
        ] },
        { label: 'Ask it to stay', cooldown: 1, outcomes: [
          { w: 1, text: '"No," says Ithzar, quite gently. "You promised. Take a day, if you need one. I will be on the stairs."', fx: {} },
        ] },
      ],
      expire: { next: 'end', text: 'When you come down in the morning, the stairs are empty. Ithzar has let itself go.', fx: { releaseIthzar: 'left' } },
    },
  ],
});

// The victory screen's last word on Ithzar, by how things ended between you.
const ITHZAR_EPILOGUES = {
  kept: 'Somewhere far out over the lake, a tall figure in a stovepipe hat watches the water go still, and tips its hat to no one in particular.',
  left: 'You never did say goodbye to Ithzar. The next morning a copy of the Clarion arrives with your victory on the front page, its grammar corrected in red ink. There is no return address.',
  joined: 'Ithzar watched the whole thing from the ceiling, making notes. Afterwards it asks, very politely, to be let go. You let it.',
  bound: 'Cornelia Ashby does not send congratulations. Her djinni does, by pigeon, with a note in neat copperplate: "Well done. Now get me out of here."',
  gone: 'Now and then you wonder what became of the djinni in the stovepipe hat. The Clarion’s filler headlines, you notice, have become very slightly sillier.',
};
