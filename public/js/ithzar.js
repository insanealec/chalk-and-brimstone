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
    'It went in without a fuss. Watch it anyway. The quiet ones are saving it up.',
    { text: 'Firm. Thwaite managed that perhaps one time in three.¹', note: '¹ He blamed the chalk. It was never the chalk.' },
    'There. You stopped hurrying the last syllable. That is the whole trick, and it took Solomon ten years.',
  ],
  'summon:uneasy': [
    { text: 'That binding is held together with hope and string. I give it until Thursday.¹', note: '¹ I always say Thursday. I am right more often than you would think.' },
    'It is smiling at you. They only smile at you like that when they have found a loophole.',
    'It is bound the way a dog is tied with string: for exactly as long as it agrees to be.',
  ],
  'summon:broken': [
    { text: 'Ah. Well. I did think the circle looked optimistic.¹', note: '¹ I did not say so. It is more educational this way.' },
    'They go for the eyes first, as a rule, and then the door. You were lucky. This one wanted the door.',
    'In fairness to you, it was going to escape the moment it saw your pentacle. In fairness to it, so would I.',
    { text: 'Nebuchadnezzar lost a whole wing of his palace that way.¹ You only lost your eyebrows.', note: '¹ The chroniclers called it an earthquake. Nebuchadnezzar paid them to.' },
  ],
  'summon:silence': [
    'Nobody home. Try a name that belongs to someone.',
    { text: 'You spoke to the empty air with great conviction. Politicians do it daily.¹', note: '¹ Some of them get elected. Ask Honest Mike.' },
    'I heard at least one syllable flinch. That is something. Not much, but something.',
    'A name is a lock, not a prayer. Saying it louder does not help.',
  ],
  'summon:overreach-held': [
    { text: 'That circle had no business holding that.¹', note: '¹ Neither did you, frankly.' },
    'We held it. Do not ever do that again. Do it again next week; I want to see the look on Cornelia’s face.',
    'I have not pushed that hard since Persepolis. I am going to lie down in the coal scuttle.',
  ],
  'summon:overreach-failed': [
    'That circle was cut for something half its size, and it knew the moment it arrived. They can always tell.',
    { text: 'Next time, buy the bigger circle. I will lend you the money.¹', note: '¹ At interest. I am a djinni, not a saint.' },
    'Well. The ceiling needed replastering anyway.',
  ],
  'summon:accident': [
    { text: 'You rang the wrong doorbell. It happens. Usually only once per magician.¹', note: '¹ Because of the dying.' },
    'Two names that close together, and you said the other one. Write it down. You will do it again.',
    'Wrong spirit, right name. Your notebook will enjoy that.',
  ],

  'city:clark': [
    'Home. Your landlord thinks I am a draft. I have decided to let him.',
    { text: 'Kinsella waters the whiskey with river water.¹', note: '¹ The river runs into the lake, and the city drinks from the lake. Think about that, then think about the plan to reverse the river, then have a whiskey anyway.' },
  ],
  'city:maxwell': [
    { text: 'I came through here the week after the Fire, when it was all tents. The same woman was selling the same herring.¹', note: '¹ She has not aged. I have stopped asking.' },
    'Every language in the world, shouted at once. It reminds me of Babylon, except the herring is better.',
    'Mind your pockets. Half the urchins here are imps, and the other half are better at it.',
  ],
  'city:levee': [
    'Every saloon on this street pays the First Ward, and every one has a back door. Learn the back doors.',
    { text: 'I won a saloon at faro here in 1871. It burned down the same week.¹', note: '¹ Not my fault. Ask Ulgaroth, if you ever meet it. Ask from a long way off.' },
    'Someone here is cheating. Everyone here is cheating. Relax.',
  ],
  'city:lasalle': [
    'The Board of Trade. Men shouting numbers at other men. In Ur we called that a temple.',
    'Cornelia keeps her offices two streets over. If she sees me with you, I was never here and you owe me money.',
    { text: 'There is a machine in there that prints the price of wheat all by itself.¹ I could watch it for hours.', note: '¹ I have watched it for hours. The price of wheat is not interesting. The machine is.' },
  ],
  'city:stockyards': [
    'The Assyrians used to pile their dead upwind of a city they meant to take. It worked better than the rams. I mention it for no reason.',
    'Every packinghouse here keeps an imp in the cold room, and every foreman swears his doesn’t.',
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
  'news:crackdown': ['Inspectors. Put the lantern in the coal hole, and if anyone asks, I am a draft.'],
  'news:canal': ['They are going to make the river run backward. They have no idea what is at the other end of it.'],
  'news:cornelia-inquiry': ['An inquiry. She will have them all in a row, asking where they were on the night. I know where you were. I was there.'],
  'news:seance': ['A medium on Clark Street. Nine in ten are frauds, and the tenth has an imp under the table. Both kinds charge a dollar.'],
  'news:examination': [{ text: 'An examination. I sat one in Babylon, for a bet.¹', note: '¹ I was the examiner. It was still a very hard paper.' }],
  'news:panic': ['A panic. I have seen eleven. Sell the paper and buy bread; bread always comes back.'],
  'news:heatwave': ['Ice imps on strike. Every spirit in the Yards is watching to see how it ends, and so is every packer.'],
  'news:infanta': [{ text: 'A real princess! I once carried one across the Euphrates.¹', note: '¹ She bit me. Royalty is like that.' }],

  // how Ithzar starts an answer when you ask it about a spirit, and where it says it has gone
  'ask:lead': [
    'Ithzar thinks for a moment',
    'Ithzar, without looking up from the Clarion',
    'Ithzar, examining its fingernails',
    'Ithzar, after a long and theatrical sigh',
  ],
  away: [
    'Ithzar is out today. It does not say where.',
    'Ithzar has gone to watch them raise the Ferris wheel. It says it is checking their arithmetic.',
    'Ithzar left a note on the mantelpiece: "Back tomorrow. Do not touch my hat."',
  ],

  // third-person morning notes in the chronicle
  dawn: [
    'Ithzar is reading yesterday’s Clarion and correcting its grammar in red ink.',
    'Ithzar has taken apart your alarm clock to see how it works. It now works differently.',
    'Ithzar has written a letter to Mr. Edison. It will not tell you what about.',
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
  'class:4': [[['I', '(Ithzar has gone quiet, and is standing a little behind you.)']]],
  'class:5': [[['I', '(Ithzar has not said a word since you set out.)']]],
};

// How Ithzar introduces its mistress the night you meet it: when you met her, or where to find her.
function corneliaIntro(s) {
  const met = s.flags['met-cornelia'];
  return met !== undefined
    ? `I belong to Mrs. Cornelia Ashby. You met her outside the Rookery on ${dateLabel(met, 'prose')}. I was on her shoulder at the time; you did not see me.`
    : 'I belong to Mrs. Cornelia Ashby, of the Lake Shore Circle. You have not met her. You will. She keeps offices on LaSalle Street, and lately she has been asking about you.';
}

// Chapters 1 and 2 of the arc, run by the event engine in js/events.js.
EVENTS.push(
  {
    id: 'ithzar-watcher', title: 'The Watcher',
    // Ward Magician, and either you have met Cornelia Ashby or it is April 20
    starts: s => s.rep >= RANKS[1].rep && (s.flags['met-cornelia'] !== undefined || s.day >= 18),
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: null,
        text: 'Nothing in your workshop is missing, but everything has been moved half an inch.',
        announce: s => {
          const glass = s.vessels.scrying && s.vessels.scrying.spirit;
          return glass ? `Your scrying glass shows ${demonById(glass).name} pointing, agitated, at the chimney.` : null;
        },
        actions: [
          { label: 'Look over the workshop', once: true, outcomes: [
            { w: 1, text: 'Someone has been through everything, carefully, and has not bothered to hide it. Your chalks are sorted by length. Thwaite’s old pentacle has been taken out of its drawer and polished. Your notebook has been read cover to cover, and beside your last binding, in a neat copperplate hand that isn’t yours, someone has written one word: <i>Sloppy.</i>', fx: { advance: 1 } },
          ] },
        ],
      },
      {
        headline: null, place: 'clark:doorstep', days: null,
        text: 'Whoever it was will be back. The ink in your notebook is still wet.',
        actions: [
          { label: 'Wait up for the intruder', once: true, outcomes: [
            { w: 1, text: s => `Near midnight the fire sinks to nothing, though the coal is fresh. When you look up there is someone in Thwaite’s old chair: tall and thin, in a stovepipe hat and a frock coat forty years out of date, reading your notebook by the light of its own eyes. They are the blue at the bottom of a gas flame. "Thwaite kept a tidier notebook," it says, without looking up. "He used to leave the window open for me." It turns a page. "Ithzar. Djinni, of the third rank. ${corneliaIntro(s)} She sent me to see what Thwaite left behind." It closes the notebook and lays it on the arm of the chair. "I have seen it." Then it goes up the chimney like a draft, and the fire comes back as if it had never been out.`, fx: { flag: 'met-ithzar', advance: 'end' } },
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
            { w: 1, text: 'Ithzar folds itself into your vessel, complaining about the upholstery. Near midnight a woman in a silk hat walks the length of Clark Street twice, slowly, and goes away.', fx: { standing: { trust: 2 }, flag: 'ithzar-favor-1', advance: 'end' } },
          ] },
          { label: 'Let it sleep in the coal scuttle', outcomes: [
            { w: 1, text: '"The coal scuttle," says Ithzar. "I have slept in the treasuries of kings." It sleeps in the coal scuttle. In the morning it says thank you, which seems to surprise it.', fx: { standing: { trust: 1 }, flag: 'ithzar-favor-1', advance: 'end' } },
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
            { w: 1, text: 'Ithzar breathes the smoke in with its eyes closed, and for a moment looks a thousand years younger. Then it tells you about a spirit you have been reading up on, and leaves before you can thank it.', fx: { incense: { sandalwood: -1 }, standing: { trust: 1 }, lore: r => [r, r + 1], flag: 'ithzar-favor-2', advance: 'end' } },
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
          { w: 1, text: 'You say the words of parting. Ithzar takes off its hat, which it has never done before. "One thing for the road," it says, and tells you a piece of the marid’s name you did not have. "The rest you will have to find yourself; I am not a charity." It puts the hat back on. "Goodbye, magician. You were tolerable."¹ Then it goes up the chimney like smoke, and does not come back down.<span class="footnote">¹ In two thousand six hundred years, it had never said that to a magician before. It would deny it under oath.</span>', fx: { ithzarGift: true, releaseIthzar: 'kept', advance: 'end' } },
        ] },
        { label: 'Ask it to stay', cooldown: 1, outcomes: [
          { w: 1, text: '"No," says Ithzar, quite gently. "You promised. Take a day, if you need one. I will be on the stairs."', fx: {} },
        ] },
      ],
      expire: { next: 'end', text: 'When you come down in the morning, the stairs are empty. Ithzar has let itself go.', fx: { releaseIthzar: 'left' } },
    },
  ],
});

// ---------- Part D: Cornelia's reckoning
// After the rite, Cornelia Ashby knows someone cut her djinni's leash. Three chapters, each waiting at a place
// for a few days, so the story only goes as far as the player's wandering takes it. It ends in a truce
// ('cornelia-truce') or an enemy ('cornelia-enemy'), which the Water Crib and the endings remember.

const CORNELIA_EPILOGUES = {
  truce: 'Cornelia Ashby sends a card with no message on it, only two teacups, drawn in ink. You keep it on the mantelpiece.',
  enemy: 'Cornelia Ashby leaves the Lake Shore Circle that summer and takes a house in Milwaukee. You hear she is writing a book about the profession. You hear you are in it.',
};

EVENTS.push(
  {
    id: 'cornelia-inquiry', title: 'The Inquiry',
    starts: s => s.flags['ithzar-freed'] !== undefined && s.day >= s.flags['ithzar-freed'] + 3,
    stages: [
      {
        headline: 'LAKE SHORE CIRCLE CONVENES INQUIRY INTO SOCIETY MAGICIAN’S MISSING DJINNI',
        place: 'lasalle:club', days: 5,
        text: 'The Lake Shore Circle has convened an inquiry into the loss of Mrs. Ashby’s djinni. Members of the profession are invited, one at a time and with great courtesy, to say where they were on the night it went.',
        actions: [
          { label: 'Give an account of yourself', outcomes: [
            { w: 6, text: 'You were at Kinsella’s, you tell them, reading palms. The committee thanks you and writes something down. Mrs. Ashby, at the end of the table, writes something else.', fx: { flag: 'inquiry-done', advance: 'end' } },
            { w: 4, text: 'Halfway through, Mrs. Ashby asks, as if idly, which rune you would draw first for a djinni of the third rank, and you answer before you think. The room goes quiet. The chairman thanks you for your time.', fx: { standing: { suspicion: 1 }, flag: ['inquiry-done', 'inquiry-slipped'], advance: 'end' } },
          ] },
          { label: 'Send a servant to read the committee’s minutes', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'The minutes run to eleven pages. Mrs. Ashby suspects four magicians, and you are third on her list, below a man in Evanston who has never bound anything larger than a moth. Beside your name she has written <i>wormwood</i>, and underlined it twice.', fx: { flag: ['inquiry-done', 'inquiry-read'], advance: 'end' } },
          ] },
          { label: 'Attend with Ithzar', req: { ithzar: true }, outcomes: [
            { w: 1, text: '"Ithzar," says Mrs. Ashby, in a voice that could etch glass. "Cornelia," says Ithzar, and lifts its hat. Nobody on the committee says anything at all. After a minute the chairman remembers another appointment, and the inquiry is adjourned.', fx: { standing: { trust: 1 }, flag: ['inquiry-done', 'inquiry-ithzar'], advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The Lake Shore Circle’s inquiry closes without hearing from you. Your absence is noted in the minutes.', fx: { flag: 'inquiry-done' } },
      },
    ],
  },

  {
    id: 'cornelia-raid', title: 'A Visitor in the Night',
    starts: s => s.flags['inquiry-done'] !== undefined && s.day >= s.flags['inquiry-done'] + 2,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 3,
        text: 'Someone has been at your door in the night. The lock is scratched bright around the keyhole, and the landing smells of wormwood.',
        actions: [
          { label: 'Sit up in the dark and wait', outcomes: [
            { w: 1, text: 'Near three in the morning someone comes up the stairs: a woman in a silk hat, a stub of chalk in one gloved hand. She sees you sitting in the dark, and stops. After a long moment she goes back down. Neither of you says a word.', fx: { flag: ['raid-done', 'raid-faced'], advance: 'end' } },
          ] },
          { label: 'Hide your vessels in Kinsella’s cellar', cost: 10, outcomes: [
            { w: 1, text: 'Kinsella asks no questions for ten dollars. Your vessels spend the night among the beer barrels, and in the morning your door is open and your empty workshop has been searched with great care.', fx: { flag: ['raid-done', 'raid-hidden'], advance: 'end' } },
          ] },
          { label: 'Set a spirit to watch the stairs', req: { servantTier: 1 }, outcomes: [
            { w: 1, text: 'At three in the morning your spirit hears chalk on the landing, and makes such a noise that half of Clark Street lights its lamps. Whoever it was does not come back.', fx: { flag: ['raid-done', 'raid-scared'], advance: 'end' } },
          ] },
        ],
        // nobody stopped her: she unseals the strongest spirit you keep in a vessel, or leaves you a message
        expire: s => (Object.values(s.vessels).some(v => v.spirit)
          ? { next: 'end', text: 'In the morning your door is open and your workshop is tidier than you left it. One of your vessels has been unsealed, and whatever was inside it is gone.', fx: { crackVessel: true, flag: 'raid-done' } }
          : { next: 'end', text: 'In the morning your door is open. Nothing is missing. In your notebook, under your last binding, someone has written two words in a hand you don’t know: <i>I know.</i>', fx: { standing: { suspicion: 1 }, flag: 'raid-done' } }),
      },
    ],
  },

  {
    id: 'cornelia-terms', title: 'Mrs. Ashby',
    starts: s => s.flags['raid-done'] !== undefined && s.day >= s.flags['raid-done'] + 2,
    stages: [
      {
        headline: null, place: 'lasalle:club', days: 5,
        text: 'Mrs. Ashby is waiting in the Circle’s reading room, alone, with two cups of tea already poured. "Sit down," she says. "I would like to know why."',
        actions: [
          { label: 'Tell her the truth', outcomes: [
            { w: 1, text: s => `You tell her. She listens to the end without interrupting. "It was never happy with me," she says at last. "I thought that was simply what djinn were like." She drinks her tea.${s.ithzar.joined ? ' "Tell it the tea was good."' : ''}`, fx: { standing: { suspicion: -1 }, flag: 'cornelia-truce', advance: 'end' } },
          ] },
          { label: 'Deny everything', outcomes: [
            { w: 1, text: 'She lets you finish. Then she sets down her cup with great care, and you understand that you will be paying for this for a long time.', fx: { standing: { machine: -1, suspicion: 1 }, flag: 'cornelia-enemy', advance: 'end' } },
          ] },
          { label: 'Offer to pay for a new servant', cost: 60, outcomes: [
            { w: 1, text: 'She takes the money without counting it. "A djinni costs a great deal more than sixty dollars," she says. "But I accept the apology it stands for."', fx: { flag: 'cornelia-truce', advance: 'end' } },
          ] },
          { label: 'Let Ithzar speak for itself', req: { ithzar: true }, outcomes: [
            { w: 1, text: '"I asked you to let me go," says Ithzar, "every spring for eleven years. You never once heard me." Cornelia looks at it for a long time. "No," she says. "I don’t suppose I did." She pays for the tea.', fx: { standing: { trust: 1 }, flag: 'cornelia-truce', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The tea in the Circle’s reading room goes cold. Mrs. Ashby does not wait for you a second time.', fx: { flag: 'cornelia-enemy' } },
      },
    ],
  },
);

// The victory screen's last word on Ithzar, by how things ended between you.
const ITHZAR_EPILOGUES = {
  kept: 'Somewhere far out over the lake, a tall figure in a stovepipe hat watches the water go still, and tips its hat to no one in particular.',
  left: 'You never did say goodbye to Ithzar. The next morning a copy of the Clarion arrives with your victory on the front page, its grammar corrected in red ink. There is no return address.',
  joined: 'Ithzar watched the whole thing from the ceiling, making notes. Afterwards it asks, very politely, to be let go. You let it.',
  bound: 'Cornelia Ashby does not send congratulations. Her djinni does, by pigeon, with a note in neat copperplate: "Well done. Now get me out of here."',
  gone: 'Now and then you wonder what became of the djinni in the stovepipe hat. The Clarion’s filler headlines, you notice, have become very slightly sillier.',
};
