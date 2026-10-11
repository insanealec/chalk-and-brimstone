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
