// The calendar, the newspaper, and current events in the city.

// Day 1 is Monday, April 3, 1893. The World's Fair opens on May 1.
const START_DATE = [1893, 3, 3];
const FAIR_OPENS_DAY = 29;

const NEWSPAPER = 'The Chicago Clarion';

// Current events. An event starts at dawn on the first day `starts(state)` is true, then runs
// through its `stages`. A stage:
//   headline   what the Clarion prints while the stage runs (null for private events)
//   place      'district:place' where the stage's actions appear
//   actions    the same shape as place actions in js/districts.js; their outcome fx may include
//              advance: a stage index or 'end'
//   days       how many days the stage lasts before it expires (null = until an action advances it)
//   expire     what happens when it runs out: { next: stage index or 'end', text?, fx? },
//              or a function of state returning one
// `repeat: true` lets an event start again after it ends.
const EVENTS = [
  {
    id: 'fair', title: 'The World’s Fair',
    starts: s => s.day >= FAIR_OPENS_DAY,
    stages: [
      {
        headline: 'THE FAIR IS OPEN! PRESIDENT CLEVELAND PRESSES THE GOLDEN KEY, AND THE WHITE CITY BLAZES WITH LIGHT',
        place: 'midway:electricity', days: 7,
        actions: [
          { label: 'Hire out to the Exposition guards', req: { servantTier: 1 }, cooldown: 1, outcomes: [
            { w: 8, text: 'The opening crowds are thick with pickpocket imps. Your servant catches a dozen, and the guards pay by the head.', fx: { dollars: [20, 30] } },
            { w: 2, text: 'Your servant catches eleven imps and lets the twelfth go "for professional reasons."', fx: { dollars: 10 } },
          ] },
          { label: 'Work the opening-week crowds for gossip', outcomes: [
            { w: 7, text: 'Half the magicians in the country are here, and all of them talk too much.', fx: { lore: r => [1, r + 1] } },
            { w: 3, text: 'You are trodden on by a delegation from Ohio.', fx: { health: -1 } },
          ] },
        ],
        expire: { next: 'end' },
      },
    ],
  },

  {
    id: 'strike', title: 'Trouble in the Yards',
    starts: s => s.day >= 8,
    stages: [
      { // 0: grumbling
        headline: 'PACKERS CUT WAGES A DIME AN HOUR; GRUMBLING IN THE YARDS',
        place: 'stockyards:row', days: 4,
        actions: [
          { label: 'Attend the meeting behind Schultz’s saloon', once: true, outcomes: [
            { w: 1, text: 'Forty packinghouse hands, and an organizer named Dora Kaspar who notices the chalk on your cuffs. "Some of my people can see straight through a glamour," she says. "So don’t try one." You don’t.', fx: { standing: { union: 1 }, flag: 'met-dora' } },
          ] },
          { label: 'Report the meeting to City Hall', once: true, outcomes: [
            { w: 1, text: 'A clerk writes down every name you give him and pays you for the trouble.', fx: { dollars: 10, standing: { machine: 1, union: -2 } } },
          ] },
        ],
        expire: { next: 1 },
      },
      { // 1: the strike
        headline: 'STRIKE! THE YARDS STAND IDLE AS PACKINGHOUSE HANDS WALK OUT',
        place: 'stockyards:row', days: 5,
        actions: [
          { label: 'Take the packers’ money to break the strike', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'Your servant spends the night souring milk, spooking horses and whispering in the strikers’ ears. By morning the line is breaking. The packers pay well. Dora Kaspar will not forget this.', fx: { dollars: 50, standing: { machine: 2, union: -3, suspicion: 2 }, flag: 'strike-broken', advance: 'end' } },
          ] },
          { label: 'Carry messages for the strikers', cooldown: 1, outcomes: [
            { w: 7, text: 'Policemen are easy to slip past when you know which of them are bound to look the other way.', fx: { standing: { union: 1 } } },
            { w: 3, text: 'A Pinkerton man recognizes you and makes a note.', fx: { standing: { union: 1, suspicion: 2 } } },
          ] },
          { label: 'Broker a settlement', req: { machine: 3, union: 2 }, outcomes: [
            { w: 1, text: 'You get the packers’ man and Dora Kaspar into the same back room at Kinsella’s, and nobody leaves until there is a deal. Both sides think they owe you.', fx: { rep: 2, standing: { machine: 1, union: 1 }, flag: 'packingtown-friends', advance: 'end' } },
          ] },
        ],
        expire: s => (s.standing.union >= 3
          ? { next: 2, text: 'In the Yards, the packers blink first.' }
          : { next: 3, text: 'In the Yards, the strike breaks.' }),
      },
      { // 2: the workers win
        headline: 'PACKERS YIELD: WAGES RESTORED, STRIKERS RETURN IN TRIUMPH',
        place: 'stockyards:row', days: 4,
        actions: [
          { label: 'Celebrate with the strikers', once: true, outcomes: [
            { w: 1, text: 'Dora Kaspar raises a glass to you. "Come by the rendering works whenever you like," she says. "We’ll keep something aside."', fx: { standing: { union: 1 }, flag: 'packingtown-friends' } },
          ] },
        ],
        expire: { next: 'end' },
      },
      { // 3: the strike is crushed
        headline: 'STRIKE COLLAPSES; RINGLEADERS JAILED',
        place: 'stockyards:row', days: 4,
        actions: [
          { label: 'Visit Dora Kaspar in the county jail', once: true, outcomes: [
            { w: 1, text: '"You tried," she says, which is worse than if she had said you hadn’t. Then she tells you about a spirit the packers keep in their smokestacks.', fx: { standing: { union: 1 }, lore: [2, 3] } },
          ] },
        ],
        expire: { next: 'end' },
      },
    ],
  },

  {
    id: 'election', title: 'The First Ward Race',
    starts: s => s.day >= 14,
    stages: [
      { // 0: the campaign
        headline: 'FIRST WARD RACE: "HONEST MIKE" ROURKE FACES REFORMER ELLEN VANCE',
        place: 'levee:anchor', days: 5,
        actions: [
          { label: 'Lend your servants to stuff the ballot boxes', req: { servantTier: 1 }, once: true, outcomes: [
            { w: 1, text: 'Imps are excellent at voting. They vote early, often, and as several hundred deceased residents of the First Ward.', fx: { standing: { machine: 2, suspicion: 2 }, flag: 'stuffed' } },
          ] },
          { label: 'Pass the reformers a list of the Machine’s tricks', once: true, outcomes: [
            { w: 1, text: 'Ellen Vance reads the list twice, thanks you gravely, and asks whether you would consider testifying. You would not.', fx: { standing: { machine: -2, union: 1 }, flag: 'tipped-reform' } },
          ] },
          { label: 'Drink to Honest Mike’s health', cost: 2, cooldown: 1, outcomes: [
            { w: 1, text: 'Free beer, a cigar, and a handshake that checks your pockets. Mike’s people remember faces.', fx: { standing: { machine: 1 } } },
          ] },
        ],
        expire: s => ((s.flags.stuffed !== undefined || (s.flags['tipped-reform'] === undefined && Math.random() < 0.6))
          ? { next: 1, text: 'Rourke holds the First Ward.', fx: { flag: 'rourke' } }
          : { next: 2, text: 'Vance takes the First Ward.', fx: { flag: 'vance' } }),
      },
      { // 1: the Machine wins
        headline: 'ROURKE RETURNED IN LANDSLIDE; 412 VOTES CAST FROM THE GRAVEYARD',
        place: 'levee:anchor', days: 4,
        actions: [
          { label: 'Call in a favor from Honest Mike', req: { machine: 2 }, once: true, outcomes: [
            { w: 1, text: 'Mike pumps your hand. "The Levee looks after its friends." The alley toughs have been told to look the other way when you pass.', fx: { dollars: 30, rep: 1 } },
          ] },
        ],
        expire: { next: 'end' },
      },
      { // 2: the reformer wins
        headline: 'REFORMER VANCE TAKES THE FIRST WARD; IMP PIT PADLOCKED',
        place: 'levee:anchor', days: 4,
        actions: [
          { label: 'Toast the new alderman', cost: 2, once: true, outcomes: [
            { w: 1, text: 'Ellen Vance is unexpectedly funny. She also keeps a list of magicians she is watching. You may or may not be on it.', fx: { standing: { machine: -1, suspicion: -2 } } },
          ] },
        ],
        expire: { next: 'end' },
      },
    ],
  },

  {
    id: 'bottle', title: 'A Knock at the Door',
    starts: s => s.flags['freed-foliot'] !== undefined && s.day >= s.flags['freed-foliot'] + 4,
    stages: [
      {
        headline: null, place: 'clark:doorstep', days: 5,
        actions: [
          { label: 'Answer the knocking', outcomes: [
            { w: 1, text: 'On your doorstep is a squat brass kettle with a face: the foliot from the dime-museum bottle. "Phebbet," it says. "I pay my debts." Before you can stop it, it says its true name, in order, slowly, so you can write it down. "Now we’re square. Don’t call me."', fx: { revealName: 'phebbet', advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Whatever was knocking at your door has given up.' },
      },
    ],
  },

  {
    id: 'crackdown', title: 'The Crackdown', repeat: true,
    starts: s => s.standing.suspicion >= 6,
    stages: [
      {
        headline: 'MAYOR VOWS CRACKDOWN ON STREET SORCERY; INSPECTORS TO CALL ON KNOWN MAGICIANS',
        place: 'clark:doorstep', days: 3,
        actions: [
          { label: 'Pay the inspectors’ "fine"', cost: 25, outcomes: [
            { w: 1, text: 'The inspectors count the money twice and agree that your workshop is a perfectly ordinary workshop.', fx: { standing: { suspicion: -5 }, advance: 'end' } },
          ] },
          { label: 'Have a word with the ward boss', req: { machine: 3 }, outcomes: [
            { w: 1, text: 'A word in the right ear, and the inspectors discover urgent business elsewhere. The Machine will want something for this, someday.', fx: { standing: { suspicion: -5, machine: -2 }, advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The inspectors come anyway. They take what they like and call it evidence.', fx: { robbed: [15, 40], standing: { suspicion: -6 } } },
      },
    ],
  },
];

// Later events, so May isn't empty. Both are loosely historical: the Sanitary and Ship Canal was dug in
// the 1890s to reverse the river, and the Infanta Eulalia of Spain visited the Fair (in June, really).
EVENTS.push(
  {
    id: 'canal', title: 'The Great Canal',
    // once the Stolen Seal is recovered, which also means you can reach the Water Crib
    starts: s => s.commission >= 6,
    stages: [
      {
        headline: 'SANITARY DISTRICT SURVEYORS DRIVE THE FIRST STAKES FOR THE GREAT CANAL; RIVER TO RUN BACKWARD "BY 1900"',
        place: 'crib:quarters', days: 10,
        text: 'The Sanitary District’s surveyors have been sounding the lake bed from the crib. Their charts have a blank patch, very deep, that nobody will explain.',
        actions: [
          { label: 'Read the surveyors’ soundings', cost: 10, once: true, outcomes: [
            { w: 1, text: 'The soundings are mostly numbers. In the margin beside the blank patch, a surveyor has written down a sound he heard come up the line, five times, in capitals: <span class="syl">ITH</span>.', fx: { notebook: ['shemashara', 'syl:4:ITH'] } },
          ] },
          { label: 'Ask the engineers about the blank patch', once: true, outcomes: [
            { w: 1, text: 'The engineers change the subject to pumps, firmly and at length. One of them makes the sign against the evil eye when he thinks you are not looking.', fx: {} },
          ] },
        ],
        expire: { next: 'end' },
      },
    ],
  },

  {
    id: 'infanta', title: 'The Infanta’s Visit',
    starts: s => s.day >= 38, // May 10
    stages: [
      {
        headline: 'SPANISH PRINCESS TOURS THE MIDWAY; ASKS TO SEE A REAL DJINNI, IS SHOWN THE FERRIS WHEEL INSTEAD',
        place: 'midway:wheel', days: 6,
        text: 'The Infanta Eulalia of Spain is touring the Fair, and its managers are desperate to show her something remarkable.',
        actions: [
          { label: 'Put on a spectacle for the Infanta', req: { servantTier: 3 }, once: true, outcomes: [
            { w: 1, text: 'Your servant turns the Great Wheel into a ring of blue fire for exactly one revolution. The Infanta applauds. The Fair’s managers pay you handsomely, and City Hall hears about it.', fx: { dollars: 60, rep: 1, standing: { machine: 1 } } },
          ] },
          { label: 'Watch the procession from the Wheel', cost: 1, outcomes: [
            { w: 1, text: 'Half the magicians in Chicago are in the crowd, hoping to be noticed. You overhear a great deal.', fx: { lore: r => [r, r + 1] } },
          ] },
        ],
        expire: { next: 'end' },
      },
    ],
  },
);

// What the Clarion prints when nothing is happening.
const FILLER_HEADLINES = [
  'ALDERMEN DENY ALL KNOWLEDGE OF ANYTHING',
  'CABLE CAR STRUCK BY FALLING GARGOYLE; NO ONE HURT BUT THE GARGOYLE',
  'SANITARY DISTRICT ASSURES PUBLIC THE RIVER WILL FLOW BACKWARD "IN DUE COURSE"',
  'STOCKYARDS SMELL REACHES EVANSTON; EVANSTON OBJECTS',
  'BOARD OF TRADE: WHEAT UP, MORALS DOWN',
  'MYSTERIOUS LIGHTS OVER THE WATER CRIB; ENGINEERS "NOT CONCERNED"',
  'MAGICIANS’ CLUB REJECTS APPLICANT WHO IS "ALMOST CERTAINLY A HEDGEHOG"',
  'FAIRGROUNDS RACE TO FINISH BEFORE MAY 1; WORKMEN REPORT TOOLS "MOVING ON THEIR OWN"',
  'LETTERS: A READER ASKS WHY HIS CHIMNEY TALKS BACK',
];
