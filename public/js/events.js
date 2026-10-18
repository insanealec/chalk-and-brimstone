// The calendar, the newspaper, and current events in the city. Ithzar's story events are in js/ithzar.js;
// the engine that runs events is in js/engine/city.js.

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
            { w: 1, text: 'Your servant spends the night going from tenement to tenement, whispering in the strikers’ ears. By morning the line is breaking. The packers pay well. Dora Kaspar will not forget this.', fx: { dollars: 50, standing: { machine: 2, union: -3, suspicion: 2 }, flag: 'strike-broken', advance: 'end' } },
          ] },
          { label: 'Carry messages for the strikers', cooldown: 1, outcomes: [
            { w: 7, text: 'You carry notes in your hatband past a police line that never thinks to check a magician’s hat.', fx: { standing: { union: 1 } } },
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
            { w: 1, text: 'Ellen Vance reads the list twice, thanks you gravely, and asks whether you would consider testifying. You change the subject.', fx: { standing: { machine: -2, union: 1 }, flag: 'tipped-reform' } },
          ] },
          { label: 'Drink to Honest Mike’s health', cost: 2, cooldown: 1, outcomes: [
            { w: 1, text: 'Free beer, a cigar, and a handshake that checks your pockets. Mike’s people remember faces.', fx: { standing: { machine: 1 } } },
          ] },
        ],
        expire: s => ((s.flags.stuffed !== undefined || (s.flags['tipped-reform'] === undefined && random() < 0.6))
          ? { next: 1, text: 'Rourke holds the First Ward.', fx: { flag: 'rourke' } }
          : { next: 2, text: 'Vance takes the First Ward.', fx: { flag: 'vance' } }),
      },
      { // 1: the Machine wins
        headline: 'ROURKE RETURNED IN LANDSLIDE; 412 VOTES CAST FROM THE GRAVEYARD',
        place: 'levee:anchor', days: 4,
        actions: [
          { label: 'Call in a favor from Honest Mike', req: { machine: 2 }, once: true, outcomes: [
            { w: 1, text: 'Mike pumps your hand. "The Levee looks after its friends." Word goes down the alleys that you are a friend of Mike’s.', fx: { dollars: 30, rep: 1 } },
          ] },
        ],
        expire: { next: 'end' },
      },
      { // 2: the reformer wins
        headline: 'REFORMER VANCE TAKES THE FIRST WARD; IMP PIT PADLOCKED',
        place: 'levee:anchor', days: 4,
        actions: [
          { label: 'Toast the new alderman', cost: 2, once: true, outcomes: [
            { w: 1, text: 'Ellen Vance is unexpectedly funny. She also has a long memory, and asks after your servants by name.', fx: { standing: { machine: -1, suspicion: -2 } } },
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
  {
    id: 'seance', title: 'The Medium',
    starts: s => s.day >= 5,
    stages: [
      {
        headline: 'SPIRITUALIST TAKES ROOMS ON CLARK STREET; THE DEAD SAID TO BE "UNUSUALLY FORTHCOMING"',
        place: 'clark:kinsellas', days: 6,
        text: 'A spiritualist, Madame Ottoline Reese, has taken Kinsella’s back room for séances, Tuesdays and Fridays, a dollar a head. The dead, by every account, have a great deal to say, and most of it is about money.',
        actions: [
          { label: 'Sit in on a séance', cost: 1, outcomes: [
            { w: 7, text: 'The table knocks, the lamp dims, and the dead speak through Madame Reese. Halfway through, a small hand with too many knuckles reaches up from under the tablecloth and raps twice.', fx: { advance: 1 } },
            { w: 3, text: 'The dead speak at length about a sister in Joliet. You learn nothing, except that the sister is not to be trusted.', fx: {} },
          ] },
          { label: 'Ask Kinsella about his lodger', outcomes: [
            { w: 1, text: 'She pays a month ahead, Kinsella says, in silver, and the silver is always cold. He would take it kindly if you looked into it, as a neighbor.', fx: { advance: 1 } },
          ] },
        ],
        expire: { next: 'end', text: 'Madame Reese has taken her séances to Milwaukee.' },
      },
      {
        headline: null, place: 'clark:kinsellas', days: 5,
        text: 'You know what is knocking under Madame Reese’s table: an imp, bound badly and paid worse.',
        actions: [
          { label: 'Expose her in front of the room', outcomes: [
            { w: 1, text: 'You lift the tablecloth. The imp under it blinks in the lamplight, and a dozen dockworkers who paid a dollar each to hear from their mothers turn slowly toward Madame Reese. Kinsella stands you drinks for a week.', fx: { rep: 1, standing: { union: 2 }, advance: 'end' } },
          ] },
          { label: 'Offer to improve the act, for a share', outcomes: [
            { w: 1, text: 'With your coaching the dead become a great deal more convincing. Madame Reese pays you twenty dollars, and the patrolman on the corner starts attending on Fridays.', fx: { dollars: 20, standing: { suspicion: 1 }, advance: 'end' } },
          ] },
          { label: 'Speak the Dismissal over the imp', outcomes: [
            { w: 1, text: 'The imp hears the words and goes, and on its way out, for spite, it tells you everything it knows about its mistress’s other bindings. Madame Reese’s next séance is a quiet one.', fx: { lore: [1, 2], loreCount: 2, advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'Madame Reese has taken her séances, and her imp, to Milwaukee.' },
      },
    ],
  },

  {
    id: 'examination', title: 'The Spring Examination',
    starts: s => s.day >= 16 && s.rep >= RANKS[1].rep,
    stages: [
      {
        headline: 'LAKE SHORE CIRCLE’S SPRING EXAMINATION: CITY’S MAGICIANS TO BE TESTED BEFORE A PANEL',
        place: 'lasalle:club', days: 6,
        text: 'The Lake Shore Circle’s spring examination is open to any magician in good standing with City Hall. Pass, and your name goes on the brass board in the front hall, where the Machine reads it.',
        actions: [
          { label: 'Sit the written paper', outcomes: [
            { w: 6, text: 'Three hours on the correspondences of the lesser runes, in a room so quiet you can hear the examiner’s watch. You pass, a little better than you expected.', fx: { rep: 2, advance: 'end' } },
            { w: 4, text: 'Question four asks for the true name of a foliot you have never heard of. You write a polite essay on the dangers of guessing at names, and the examiner gives you half marks for prudence.', fx: { rep: 1, advance: 'end' } },
          ] },
          { label: 'Bind a spirit before the panel', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'You call your spirit into a chalk circle on the Circle’s parquet and put it through its paces. The panel applauds, which it has not done since 1886, and the Machine reads your name on the brass board that afternoon.', fx: { rep: 3, standing: { machine: 1 }, advance: 'end' } },
          ] },
          { label: 'Buy a copy of the questions', cost: 15, outcomes: [
            { w: 1, text: 'A porter sells you the questions for fifteen dollars, and you pass with distinction. Mrs. Ashby, who set question four, reads your answer twice and looks at you down the length of the hall.', fx: { rep: 2, standing: { suspicion: 1 }, advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The spring examination has closed, and your name is not on the brass board.' },
      },
    ],
  },

  {
    // the Panic of 1893 broke on May 5, the day after National Cordage failed
    id: 'panic', title: 'The Panic',
    starts: s => s.day >= 33,
    stages: [
      {
        headline: 'PANIC ON LASALLE STREET! NATIONAL CORDAGE FAILS, STOCKS IN FREEFALL',
        place: 'lasalle:board', days: 3,
        text: 'National Cordage has failed, and the Board of Trade has lost its mind. Brokers are selling anything to anyone at any price, and men who were rich at breakfast are pawning their watches by lunch.',
        actions: [
          { label: 'Read tomorrow’s prices in your scrying glass', req: { glass: 2 }, once: true, outcomes: [
            { w: 1, text: 'The spirit in the glass shows you tomorrow’s board, chalked up in a clerk’s hand. You buy what will rise and sell what will not, and by the closing bell the Board’s secretary is asking who you are.', fx: { dollars: [40, 70], standing: { suspicion: 1 } } },
          ] },
          { label: 'Buy at the bottom', cost: 30, once: true, outcomes: [
            { w: 6, text: 'You buy railroad stock at a third of what it was worth on Monday, and sell it on Friday for half. The broker who sold it to you shakes your hand and goes home to tell his wife.', fx: { dollars: 50 } },
            { w: 4, text: 'It turns out not to be the bottom. There was a great deal further to go.', fx: { dollars: 12 } },
          ] },
          { label: 'See a ruined broker home', once: true, outcomes: [
            { w: 1, text: 'He is a ward man of the Machine, it turns out. In the morning he does not remember your name, but his wife does.', fx: { standing: { machine: 1 } } },
          ] },
        ],
        expire: { next: 1 },
      },
      {
        headline: 'RUN ON THE BANKS: DEPOSITORS QUEUE ALL NIGHT ON HALSTED STREET',
        place: 'maxwell:stalls', days: 4,
        text: 'The panic has reached the banks. Half of Maxwell Street keeps its savings in the Dime Savings Bank on Halsted Street, and the Dime Savings Bank has closed its doors “for inventory.”',
        actions: [
          { label: 'Lend a servant to hold the stallholders’ place in line', req: { servantTier: 1 }, outcomes: [
            { w: 1, text: 'Your servant stands in the queue all night in the shape of a patient old woman. In the morning the bank opens for an hour, and the stallholders get their money out before it shuts again.', fx: { rep: 1, standing: { union: 2 }, advance: 'end' } },
          ] },
          { label: 'Tell the herring woman to get her savings out now', outcomes: [
            { w: 1, text: 'She goes, and gets it, and tells the whole street who told her. You are paid in herring for a month.', fx: { standing: { union: 1 }, advance: 'end' } },
          ] },
          { label: 'Buy a ruined stallholder’s stock cheap', cost: 10, outcomes: [
            { w: 1, text: 'He sells you a crate of incense for ten dollars because he needs ten dollars. You both know what it is worth.', fx: { incenseRandom: [4, 2], standing: { union: -1 }, advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The Dime Savings Bank does not reopen.' },
      },
    ],
  },

  {
    id: 'heatwave', title: 'The Heat Wave',
    starts: s => s.day >= 30 && (!s.events.strike || s.events.strike.done),
    stages: [
      {
        headline: 'EARLY HEAT SPOILS A MILLION POUNDS OF BEEF; PACKERS BLAME "LABOR TROUBLE IN THE COLD ROOMS"',
        place: 'stockyards:row', days: 5,
        text: 'An early heat has settled on the Yards, and the cold rooms are failing one by one. The ice imps that keep them cold have downed tools, the foremen say, and will not go back until they are paid in snow.',
        actions: [
          { label: 'Negotiate with the ice imps', outcomes: [
            { w: 6, text: 'You sit down with the imps in the last cold room on the Row, which is the most comfortable meeting you have had all week. They settle for a sack of rock salt each and Sundays off. The packers pay you for the peace.', fx: { dollars: 25, standing: { union: 1 }, advance: 'end' } },
            { w: 4, text: 'The ice imps are in no mood for a magician. You come out with frost in your eyebrows and two fingers you cannot feel until evening.', fx: { health: -1 } },
          ] },
          { label: 'Have your servant drive them back to work', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'Your servant goes from cold room to cold room, and the imps go back to work in silence. The packers pay well. The imps will remember who sent it.', fx: { dollars: 35, standing: { machine: 1, union: -1 }, advance: 'end' } },
          ] },
        ],
        expire: { next: 'end', text: 'The heat breaks on its own. The Yards smell, briefly, even worse than usual.' },
      },
    ],
  }
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
        text: 'The Sanitary District’s surveyors have been sounding the lake bed from the crib. Their charts have a blank patch where the sounding line ran out of rope, and nobody will explain it.',
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
  'THIRD WARD ALDERMAN DENIES OWNING THE RACEHORSE NAMED AFTER HIM',
  'CABLE CAR STRUCK BY FALLING GARGOYLE; NO ONE HURT BUT THE GARGOYLE',
  'SANITARY DISTRICT ASSURES PUBLIC THE RIVER WILL FLOW BACKWARD "IN DUE COURSE"',
  'STOCKYARDS SMELL REACHES EVANSTON; EVANSTON OBJECTS',
  'BOARD OF TRADE PIT HALTED AN HOUR; BROKER SAYS THE TICKER "SPOKE TO HIM"',
  'MYSTERIOUS LIGHTS OVER THE WATER CRIB; ENGINEERS "NOT CONCERNED"',
  'MAGICIANS’ CLUB REJECTS APPLICANT WHO IS "ALMOST CERTAINLY A HEDGEHOG"',
  'FAIRGROUNDS RACE TO FINISH BEFORE MAY 1; WORKMEN REPORT TOOLS "MOVING ON THEIR OWN"',
  'LETTERS: A READER ASKS WHY HIS CHIMNEY TALKS BACK',
];
