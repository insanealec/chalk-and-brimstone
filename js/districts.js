// Districts of Chicago, shown on the City map. Each district has fixed places with standing actions,
// and most have streets: walking them draws a one-off encounter with choices. Current events
// (js/events.js) add more actions to particular places for a while.
//
// District: { id, name, rank, opensDay?, danger, x, y, desc, places, street, streetLabel? }
// Place:    { id, name, desc, actions, unless?, closed? }   unless: a flag that closes the place (closed: why)
// Action / encounter choice:
//   label, cost (dollars, paid up front), once (gone after use), cooldown (days before it can be used again)
//   req       { rank, servantTier, known, machine, union } needed to pick it
//             (servantTier: a servant or your familiar; known: a spirit you have heard of;
//              machine / union: at least this standing with the Machine / the workers)
//             { lantern, ring, flag, ithzar } hide it entirely unless that vessel holds a spirit of at
//             least this class, that flag has been set, or Ithzar is around
//   unless    a flag that hides the action once it has been set
//   outcomes  [{ w (weight), text, fx }], one is drawn by weight
// Street encounter: { id, title, text, choices, once?, unless?, flag? }   flag: set when the encounter happens
//
// Outcome effects (fx):
//   dollars        n or [min, max] (negative takes money, never below zero)
//   robbed         [min, max] dollars lost, capped at what you carry
//   health, rep    n
//   incense        { id: n }
//   incenseRandom  [count, maxRank] random incense up to that market rank
//   lore           [minTier, maxTier], or r => [min, max] given your rank tier (1-5)
//   loreCount      how many fragments `lore` gives (default 1)
//   loreDemon      a specific spirit's lore, falling back to lore of its class
//   rune           teaches a rune (or yields lore if already known)
//   revealName     a spirit whose whole true name goes into the notebook
//   standing       { machine, union, suspicion } changes to your hidden standings
//   flag           sets a story flag (remembered with the day it was set)
//   advance        (event actions only) moves the event to a stage index, or 'end'

const DISTRICTS = [
  {
    id: 'clark', name: 'Clark Street', rank: 0, danger: 0, x: 345, y: 110,
    desc: 'Your street. The workshop is up the stairs above Kinsella’s saloon, and anything that wants you knows where to knock.',
    places: [
      {
        id: 'doorstep', name: 'Your Doorstep',
        desc: 'Letters, visitors and trouble arrive here. So does the milk, eventually.',
        actions: [
          { label: 'Sleep off your injuries', cooldown: 1, outcomes: [
            { w: 1, text: 'You sleep through the afternoon, to the sound of Kinsella’s customers disagreeing downstairs.', fx: { health: 2 } },
          ] },
          // Ithzar's arc (js/ithzar.js): `req.ithzar` hides an action unless Ithzar is around
          { label: 'Spend the evening talking with Ithzar', req: { ithzar: true }, cooldown: 3, outcomes: [
            { w: 1, text: 'Ithzar tells you who really burned the library of Ashurbanipal. It was not who you think.', fx: { standing: { trust: 1 } } },
            { w: 1, text: 'You argue about electricity until two in the morning. Ithzar wins, mostly by knowing more words.', fx: { standing: { trust: 1 } } },
            { w: 1, text: 'Ithzar asks what you want, in the end. You don’t have a good answer. It seems to like that better than a good one.', fx: { standing: { trust: 1 } } },
          ] },
          { label: 'Name runes at Ithzar and watch it wince', req: { flag: 'leash-agreed', ithzar: true }, unless: 'ithzar-freed', cooldown: 1, outcomes: [
            { w: 1, text: 'You name the runes one after another. Ithzar cannot answer, but at one of them its shoulders drop a quarter of an inch. Whatever she used, it wasn’t that.', fx: { corneliaClue: 'norune' } },
          ] },
        ],
      },
      {
        // always open and never costs anything, so a player with no money, servants or incense can recover
        id: 'kinsellas', name: 'Kinsella’s Saloon',
        desc: 'Downstairs. Kinsella lets you tell fortunes at the end of the bar, as long as the fortunes are good and the customers keep drinking.',
        actions: [
          { label: 'Tell fortunes at the end of the bar', outcomes: [
            { w: 6, text: 'You read three palms and a teacup. Everyone is going to be rich and loved. Everyone tips.', fx: { dollars: [3, 6] } },
            { w: 3, text: 'A slow night. A teamster pays you in pennies to tell him his horse loves him.', fx: { dollars: [1, 3] } },
            { w: 1, text: 'You tell a man his wife is faithful. His wife, it turns out, is standing behind him. Nobody tips.', fx: {} },
          ] },
        ],
      },
    ],
    street: [],
  },

  {
    id: 'maxwell', name: 'Maxwell Street', rank: 0, danger: 1, x: 278, y: 262,
    desc: 'An open-air market west of the river, loud in a dozen languages. On a Sunday you can buy anything here, and some of it is even what the seller says it is.',
    places: [
      {
        id: 'stalls', name: 'The Market Stalls',
        desc: 'Sacks, crates and barrows from Halsted to Jefferson. One peddler swears his incense comes "from the Holy Land, by way of Cincinnati."',
        actions: [
          { label: 'Buy a sack of the peddler’s incense', cost: 6, outcomes: [
            { w: 7, text: 'About two thirds of the sack is incense. The rest is sawdust, but good sawdust.', fx: { incenseRandom: [3, 1] } },
            { w: 3, text: 'It is sawdust and cinnamon. The peddler and his cart have already vanished into the crowd.', fx: {} },
          ] },
          { label: 'Haggle with the peddler', req: { dollars: 3 }, outcomes: [
            { w: 5, text: 'After ten minutes of theatrical outrage on both sides, you walk away with two sacks for three dollars.', fx: { dollars: -3, incenseRandom: [2, 1] } },
            { w: 5, text: 'He takes your offer as an insult to his mother, and goes off to tell her about it.', fx: {} },
          ] },
          { label: 'Hold your lantern to the sacks', cost: 6, req: { lantern: 1 }, outcomes: [
            { w: 1, text: 'In the lantern’s light one sack glows faintly: genuine stock. You buy that one.', fx: { incenseRandom: [4, 2] } },
          ] },
        ],
      },
      {
        id: 'bookstall', name: 'The Bookstall',
        desc: 'A trestle table sagging under water-stained books in Yiddish, Polish, Greek and Latin. The bookseller is usually asleep.',
        actions: [
          { label: 'Wake him and search the stacks', cost: 4, outcomes: [
            { w: 6, text: 'Between a Polish hymnal and a cookbook you find four pages torn from a grimoire, the margins full of somebody else’s mistakes.', fx: { lore: r => [1, r + 1] } },
            { w: 4, text: 'An hour of dust and nothing. The bookseller keeps your money anyway, on principle.', fx: {} },
          ] },
        ],
      },
    ],
    street: [
      {
        id: 'herring', once: true, title: 'The Herring Woman',
        text: 'An old woman selling pickled herring absently traces a rune in the brine with one finger. It glows, faintly, then fades.',
        choices: [
          { label: 'Buy a herring and ask about the rune', cost: 2, outcomes: [
            { w: 1, text: '"My grandmother drew it on the boat, to keep the sea calm," she says, and shows you how. It is the rune of the Tide.', fx: { rune: 'tide' } },
          ] },
          { label: 'Leave her be', outcomes: [{ w: 1, text: 'You leave. The brine ripples, though nothing has touched it.', fx: {} }] },
        ],
      },
      {
        id: 'pickpocket', title: 'Light Fingers',
        text: 'A boy in a cloth cap brushes past you, and your coat feels lighter. When he glances back, his eyes flash orange. An imp, in a borrowed shape.',
        choices: [
          { label: 'Give chase', outcomes: [
            { w: 5, text: 'You corner it behind a fish stall. It hands back your purse and, to save face, a few coins that are not yours.', fx: { dollars: [3, 7] } },
            { w: 5, text: 'You lose it in the crowd and go sprawling over a crate of onions.', fx: { robbed: [3, 8], health: -1 } },
          ] },
          { label: 'Snap a binding word at it', outcomes: [
            { w: 6, text: 'It freezes mid-step, then grins. "All right, all right." It hands back your purse and, to keep you sweet, tells you about a friend of its.', fx: { lore: [1, 2] } },
            { w: 4, text: 'You are a fraction too slow. It bites your hand and is gone.', fx: { robbed: [3, 6], health: -1 } },
          ] },
          { label: 'Catch its true shape in your lantern', req: { lantern: 1 }, outcomes: [
            { w: 1, text: 'The light pins the imp in its real shape, mid-step and mortified. It hands back your purse, adds a coin for its dignity, and talks.', fx: { dollars: 4, lore: [1, 2] } },
          ] },
          { label: 'Let it go', outcomes: [{ w: 1, text: 'You decide it isn’t worth the trouble. The imp agrees, and waves.', fx: { robbed: [3, 6] } }] },
        ],
      },
    ],
  },

  {
    id: 'levee', name: 'The Levee', rank: 0, danger: 2, x: 398, y: 270,
    desc: 'Saloons, gambling halls and dime museums south of the Loop. The aldermen take their cut; the spirits take the rest.',
    places: [
      {
        id: 'anchor', name: 'The Gilded Anchor',
        desc: 'A saloon with a faro table at the back, a bartender who hears everything, and sawdust that has seen things.',
        actions: [
          { label: 'Bet $5 at faro', cost: 5, outcomes: [
            { w: 45, text: 'The cards fall your way.', fx: { dollars: 10 } },
            { w: 55, text: 'The cards do not fall your way. They rarely do, here.', fx: {} },
          ] },
          { label: 'Bet $20 at faro', cost: 20, outcomes: [
            { w: 45, text: 'You win, loudly. Several people remember your face.', fx: { dollars: 40 } },
            { w: 55, text: 'The dealer sweeps your money away with a sympathetic smile.', fx: {} },
          ] },
          { label: 'Watch the faro dealer', outcomes: [
            { w: 5, text: 'On the third hand you see it: an imp curled in the dealing box, whispering the cards. For a dollar, it whispers other things too.', fx: { dollars: -1, lore: [1, 2] } },
            { w: 5, text: 'You watch for an hour and learn only that the dealer’s mustache is false.', fx: {} },
          ] },
          { label: 'Open your lantern on the dealing box', req: { lantern: 2 }, cooldown: 3, outcomes: [
            { w: 1, text: 'The imp in the box shrieks in the light. The dealer pays you a good deal to close the shutter and leave.', fx: { dollars: [15, 25], standing: { suspicion: 1 } } },
          ] },
          { label: 'Buy the bartender a drink and listen', cost: 3, outcomes: [
            { w: 7, text: 'He leans in. "You didn’t hear this from me…"', fx: { lore: r => [1, r + 1] } },
            { w: 3, text: 'He tells you a long story about his brother-in-law. None of it is useful.', fx: {} },
          ] },
          { label: 'Buy the house a round', cost: 12, outcomes: [
            { w: 1, text: 'The whole saloon drinks your health, and by the third round people are telling you things they shouldn’t.', fx: { lore: r => [1, r + 1], loreCount: 2 } },
          ] },
        ],
      },
      {
        id: 'pit', name: 'The Imp Pit', unless: 'vance', closed: 'Padlocked by order of Alderman Vance.',
        desc: 'Behind a dime museum, magicians crowd a chalk ring where bound imps tear at each other. Money changes hands fast.',
        actions: [
          { label: 'Enter your own servant', cost: 5, req: { servantTier: 1 }, outcomes: [
            { w: 55, text: 'Your servant wins with a dirty trick it refuses to explain. The purse is yours.', fx: { dollars: 20, standing: { suspicion: 1 } } },
            { w: 45, text: 'Your servant loses, then spends the walk home explaining why it was not its fault.', fx: { standing: { suspicion: 1 } } },
          ] },
          { label: 'Bet on the favorite', cost: 5, outcomes: [
            { w: 6, text: 'The favorite wins, as favorites do.', fx: { dollars: 8 } },
            { w: 4, text: 'The favorite trips over its own tail.', fx: {} },
          ] },
          { label: 'Tip off City Hall', cooldown: 4, outcomes: [
            { w: 6, text: 'City Hall pays a small bounty for the tip.', fx: { dollars: 8, standing: { machine: 1 } } },
            { w: 4, text: 'City Hall pays a small bounty. The pit’s owners catch up with you in an alley before you can spend it.', fx: { dollars: 8, health: -2, standing: { machine: 1 } } },
          ] },
        ],
      },
    ],
    street: [
      {
        id: 'museum', once: true, title: 'A Genuine Bottled Djinni',
        text: 'A dime museum on State Street advertises A GENUINE BOTTLED DJINNI! Inside, on a velvet cushion, sits a green glass bottle. Something in it is swearing, fluently, in several dead languages.',
        choices: [
          { label: 'Pay your dime and press your ear to the glass', cost: 1, outcomes: [
            { w: 1, text: 'It is a foliot, not a djinni, and it has been bored in that bottle since the Grant administration. It will talk to anyone.', fx: { lore: [2, 3] } },
          ] },
          { label: 'Smash the bottle and free it', outcomes: [
            { w: 5, text: 'The foliot streaks out the window, shouting what might be thanks, in Aramaic.', fx: { standing: { suspicion: 1 }, flag: 'freed-foliot' } },
            { w: 5, text: 'The foliot is grateful for about half a second, then remembers you are a magician.', fx: { health: -2, standing: { suspicion: 1 } } },
          ] },
          { label: 'Leave it', outcomes: [{ w: 1, text: 'The swearing follows you out onto the street.', fx: {} }] },
        ],
      },
      {
        id: 'toughs', unless: 'rourke', title: 'Three Men in an Alley',
        text: 'Three toughs step out of an alley off Custom House Place. One of them is holding a lead pipe and a grudge against magicians that goes back to the Fire.',
        choices: [
          { label: 'Show them the Machine’s signet', req: { ring: 1 }, outcomes: [
            { w: 1, text: 'They see the ring and melt back into the alley, apologizing to your boots.', fx: {} },
          ] },
          { label: 'Hand over your purse', outcomes: [{ w: 1, text: 'They take it, count it, and give you back a nickel for the streetcar.', fx: { robbed: [5, 15] } }] },
          { label: 'Fight', outcomes: [
            { w: 4, text: 'You shout a word that is not actually magic. They flee anyway.', fx: {} },
            { w: 6, text: 'The lead pipe wins.', fx: { health: -3, robbed: [3, 8] } },
          ] },
          { label: 'Set your servant on them', req: { servantTier: 1 }, outcomes: [
            { w: 85, text: 'Your servant appears behind them in a shape best left undescribed. They run, dropping their own purses.', fx: { dollars: [5, 12], standing: { suspicion: 1 } } },
            { w: 15, text: 'Your servant takes its time arriving, and makes sure you notice.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },

  {
    id: 'lasalle', name: 'LaSalle Street', rank: 1, danger: 1, x: 388, y: 202,
    desc: 'The Board of Trade, the banks, and the offices of the city’s richest magicians, who do not like to be bothered.',
    places: [
      {
        id: 'board', name: 'The Board of Trade',
        desc: 'Brokers shouting in the wheat pit, and imps reading telegrams over their shoulders.',
        actions: [
          { label: 'Take a broker’s tip: invest $20', cost: 20, outcomes: [
            { w: 5, text: 'Wheat goes up. Your money comes back fatter.', fx: { dollars: 45 } },
            { w: 5, text: 'Wheat goes down, and your twenty dollars go with it.', fx: {} },
          ] },
          { label: 'Take a broker’s tip: invest $60', cost: 60, outcomes: [
            { w: 5, text: 'Wheat goes through the roof. You are briefly the toast of LaSalle Street.', fx: { dollars: 135 } },
            { w: 5, text: 'Wheat collapses. You are briefly the punchline of LaSalle Street.', fx: {} },
          ] },
          { label: 'Ask the Machine’s friends on the floor', req: { ring: 1 }, cooldown: 2, outcomes: [
            { w: 1, text: 'A man with a ring like yours murmurs a better tip than any broker’s. Wheat goes up by noon, as promised.', fx: { dollars: [25, 35], standing: { suspicion: 1 } } },
          ] },
        ],
      },
      {
        id: 'club', name: 'The Lake Shore Circle',
        desc: 'The city’s oldest club for magicians, and its best library. Members only. The doorman is seven feet tall and has not been seen to blink since the club was founded.',
        actions: [
          { label: 'Bribe the doorman', cost: 12, outcomes: [
            { w: 7, text: 'He looks the other way for exactly one hour, by his watch. You read as fast as you can.', fx: { lore: r => [r, r + 2] } },
            { w: 3, text: 'He takes the money, thanks you, and goes on looking at you.', fx: {} },
          ] },
          { label: 'Present yourself as a member', req: { rank: 2 }, outcomes: [
            { w: 1, text: 'An alderman of the Machine is always expected. The librarian brings you a volume the public catalogue doesn’t list.', fx: { lore: r => [r, r + 1] } },
          ] },
          { label: 'Show your signet to the doorman', req: { ring: 2 }, outcomes: [
            { w: 1, text: 'The doorman bows. Friends of the Machine are always members.', fx: { lore: r => [r, r + 2] } },
          ] },
          // chapter 3 of Ithzar's arc (js/ithzar.js)
          { label: 'Read Cornelia’s notes in the committee room', req: { flag: 'leash-agreed' }, unless: 'ithzar-freed', cooldown: 2, outcomes: [
            { w: 7, text: 'Cornelia keeps her working notes in a drawer with a lock a hairpin could open. Between a recipe for lamb and a list of debtors, there is a page about Ithzar.', fx: { corneliaClue: 1 } },
            { w: 3, text: 'The doorman finds you in the committee room and escorts you out, not gently.', fx: { health: -1, standing: { suspicion: 1 } } },
          ] },
        ],
      },
    ],
    street: [
      {
        id: 'rival', title: 'A Rival Magician', flag: 'met-cornelia',
        text: 'A magician in a silk hat recognizes you outside the Rookery: Mrs. Cornelia Ashby, who sits on the Lake Shore Circle’s committee and keeps a djinni the way other women keep a lapdog. "Thwaite’s apprentice," she says, as if naming a stain.',
        choices: [
          { label: 'Exchange pleasantries', outcomes: [
            { w: 5, text: 'She can’t resist showing off what she knows. You let her.', fx: { lore: r => [1, r + 1] } },
            { w: 5, text: 'Ten minutes of veiled insults, and nothing learned.', fx: {} },
          ] },
          { label: 'Trade insults', outcomes: [
            { w: 5, text: 'You land a cutting remark about her pentacle. A passing clerk laughs out loud, and by evening it is all over LaSalle Street.', fx: {} },
            { w: 5, text: 'She mutters a word in Coptic, and your shoes catch fire.', fx: { health: -2 } },
          ] },
        ],
      },
      {
        id: 'banker', once: true, title: 'The Banker’s Problem',
        text: 'A bank president takes you aside. Every night the numbers in his ledgers rearrange themselves, and his own magicians are stumped.',
        choices: [
          { label: 'Lend him a servant', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'Your servant finds a foliot living in the inkwell. The bank president is grateful, and he dines with half the Board of Trade.', fx: { dollars: 40, rep: 1, standing: { machine: 1 } } },
          ] },
          { label: 'Look into it yourself', outcomes: [
            { w: 5, text: 'You find the culprit: a junior clerk with a bad imp habit. The president pays a finder’s fee.', fx: { dollars: 20 } },
            { w: 5, text: 'The ledger bites you. You did not know ledgers could bite.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },

  {
    id: 'stockyards', name: 'Union Stock Yards', rank: 1, danger: 2, x: 205, y: 405,
    desc: 'A square mile of pens, packinghouses and smoke. On a south wind you can smell it in the Loop. Imps adore it.',
    places: [
      {
        id: 'row', name: 'Packinghouse Row',
        desc: 'Brick packinghouses and cold rooms, run by foremen with problems. The problems usually have teeth.',
        actions: [
          { label: 'Send your servant to clear a cold room', req: { servantTier: 2 }, cooldown: 2, outcomes: [
            { w: 75, text: 'Your servant drags out a frost-imp by the ear. The foreman pays up, and tells the other foremen.', fx: { dollars: 30 } },
            { w: 25, text: 'Your servant and the imp come to an arrangement, which does not include you.', fx: {} },
          ] },
          { label: 'Clear a cold room yourself', cooldown: 2, outcomes: [
            { w: 5, text: 'You find a nest of three imps behind the ice and drive them out with salt and stern words.', fx: { dollars: 15 } },
            { w: 5, text: 'The imps find you first.', fx: { health: -2 } },
          ] },
        ],
      },
      {
        id: 'rendering', name: 'The Rendering Works',
        desc: 'Behind the works, a woman sells scraped resins and incense dregs out of a wheelbarrow. It smells of everything at once.',
        actions: [
          { label: 'Buy a bundle of dregs', cost: 5, outcomes: [{ w: 1, text: 'Rough, but it will burn.', fx: { incenseRandom: [3, 1] } }] },
          { label: 'Buy a big bundle', cost: 12, outcomes: [{ w: 1, text: 'She throws in a green, bitter lump she found "at the bottom," and won’t say the bottom of what.', fx: { incenseRandom: [6, 2] } }] },
          { label: 'Collect what Dora’s people set aside', req: { flag: 'packingtown-friends' }, cooldown: 3, outcomes: [
            { w: 1, text: 'A bundle wrapped in newspaper, with a note in Dora Kaspar’s hand: "From the Yards."', fx: { incenseRandom: [4, 3] } },
          ] },
        ],
      },
    ],
    street: [
      {
        id: 'mole', once: true, title: 'Diggings under Packingtown',
        text: 'Under a boardwalk you spot a lumpish thing with a monocle, tunneling with great dignity through the muck.',
        choices: [
          { label: 'Follow it', outcomes: [{ w: 1, text: 'It complains about its last master in Greek for an hour while you take notes.', fx: { loreDemon: 'grubwick' } }] },
          { label: 'Leave it to its work', outcomes: [{ w: 1, text: 'It tips its monocle to you and vanishes into the mud.', fx: {} }] },
        ],
      },
      {
        id: 'drains', title: 'The Killing-Floor Drains',
        text: 'Spirits gather where blood runs. At the drains under the killing floor, you hear voices in the dark that do not belong to the workmen.',
        choices: [
          { label: 'Listen', outcomes: [
            { w: 6, text: 'Two spirits are comparing masters, and neither is complimentary. One of them describes a binding in passing, in detail.', fx: { lore: [2, 3] } },
            { w: 4, text: 'They notice you listening.', fx: { health: -2 } },
          ] },
          { label: 'Unshutter your lantern and look properly', req: { lantern: 2 }, outcomes: [
            { w: 1, text: 'The spirits at the drains freeze in the light like rats in a kitchen, and you take your time reading them.', fx: { lore: [2, 4] } },
          ] },
          { label: 'Leave quickly', outcomes: [{ w: 1, text: 'Wise.', fx: {} }] },
        ],
      },
    ],
  },

  {
    id: 'midway', name: 'The Midway Plaisance', rank: 2, opensDay: 29, danger: 1, x: 432, y: 455,
    desc: 'The World’s Columbian Exposition: electric light, the great Wheel, and a "Street in Cairo" where, rumor says, not all the Egyptians are human.',
    places: [
      {
        id: 'cairo', name: 'A Street in Cairo',
        desc: 'Donkeys, dancers and a spice merchant who sits very still. The smoke from his brazier moves against the wind.',
        actions: [
          { label: 'Buy galbanum (2 for $16)', cost: 16, outcomes: [
            { w: 1, text: 'He wraps it in paper printed with Coptic letters. You keep the paper too.', fx: { incense: { galbanum: 2 } } },
          ] },
          { label: 'Ask him about the spirits of the Nile', outcomes: [
            { w: 6, text: 'He looks at you for a while, then tells you about a temple-servant he knew, as if he had known it personally. He may have.', fx: { loreDemon: 'kethuun' } },
            { w: 4, text: 'He pretends not to speak English. He speaks it perfectly.', fx: {} },
          ] },
        ],
      },
      {
        id: 'wheel', name: 'The Great Wheel',
        desc: 'Mr. Ferris’s Wheel lifts you 264 feet above the fairgrounds. From the top, through your spectacles of second sight, the whole city glitters with bound spirits.',
        actions: [
          { label: 'Study the city from the top', cost: 1, outcomes: [
            { w: 6, text: 'You spot a trail of scorched essence across the rooftops and trace it to its source.', fx: { lore: [3, 4] } },
            { w: 4, text: 'You see a great deal and understand none of it. The view, at least, is restful.', fx: { health: 1 } },
          ] },
          { label: 'Just enjoy the view', cost: 1, outcomes: [{ w: 1, text: 'For twenty minutes nothing wants to kill you. You feel much better.', fx: { health: 2 } }] },
        ],
      },
      {
        id: 'electricity', name: 'The Electricity Building',
        desc: 'Dynamos the size of houses, and lights that dim now and then, as if someone inside were drinking from them.',
        actions: [
          { label: 'Send your servant into the dynamo', req: { servantTier: 2 }, cooldown: 2, outcomes: [
            { w: 8, text: 'Your servant hauls out a fat, glowing imp. The fair’s managers pay handsomely and ask no questions.', fx: { dollars: 40 } },
            { w: 2, text: 'Your servant comes out singed, furious and empty-handed.', fx: {} },
          ] },
          { label: 'Tinker with the dynamo yourself', cooldown: 2, outcomes: [
            { w: 4, text: 'You coax an imp out with a copper coin. The engineer tips you well.', fx: { dollars: 20 } },
            { w: 6, text: 'You touch the wrong part of the dynamo.', fx: { health: -2 } },
          ] },
        ],
      },
      {
        id: 'egypt', name: 'The Egyptian Exhibit',
        desc: 'A sarcophagus whose lid is carved with Coptic warnings. The guard is asleep. The warnings are not.',
        actions: [
          { label: 'Copy the inscriptions', outcomes: [
            { w: 6, text: 'The warnings are about an afrit, and they include diagrams.', fx: { loreDemon: 'ulgaroth' } },
            { w: 4, text: 'The guard wakes up and throws you out by the collar.', fx: { health: -1 } },
          ] },
          { label: 'Read the inscription only the lantern shows', req: { lantern: 3 }, outcomes: [
            { w: 1, text: 'Under the carved warnings is a second inscription, written in light. It was meant for magicians.', fx: { lore: [3, 5] } },
          ] },
        ],
      },
    ],
    street: [],
  },

  {
    id: 'crib', name: 'The Water Crib', rank: 3, danger: 3, x: 572, y: 150, streetLabel: 'Walk the gallery',
    desc: 'Two miles out in Lake Michigan, the intake crib that drinks for the whole city. The engineers say the water down there is deeper than it has any right to be, and that on still nights the pumps sound as though someone is listening to them.',
    places: [
      {
        id: 'shaft', name: 'The Intake Shaft',
        desc: 'Black water, a long way down. The lantern light does not reach as far as it should.',
        actions: [
          { label: 'Look into the water with your second sight', outcomes: [
            { w: 6, text: 'Far below, the dark moves, slowly, the way a sleeper turns over. A syllable rises through the water and sits on your tongue.', fx: { loreDemon: 'shemashara' } },
            { w: 4, text: 'The dark looks up.', fx: { health: -3 } },
          ] },
          { label: 'Lower your bound lantern into the shaft', req: { lantern: 4 }, outcomes: [
            { w: 1, text: 'The spirit in your lantern goes down without fear and comes back cold to the touch, with a word the lake did not mean to give.', fx: { loreDemon: 'shemashara' } },
          ] },
        ],
      },
      {
        id: 'quarters', name: 'The Engineer’s Quarters',
        desc: 'A warm room full of pump schedules, and an engineer with a logbook he would rather not discuss. The supply boat ties up below.',
        actions: [
          { label: 'Buy the engineer’s logbook of strange tides', cost: 25, outcomes: [
            { w: 1, text: 'Most of it is about pumps. Some of it is not.', fx: { lore: [4, 5] } },
          ] },
          { label: 'Buy ambergris from the old whaler (2 for $40)', cost: 40, outcomes: [
            { w: 1, text: '"Off Nantucket, in ’61," he says. It smells of the sea, and of nothing you can name.', fx: { incense: { ambergris: 2 } } },
          ] },
        ],
      },
    ],
    street: [
      {
        id: 'fog', title: 'Fog on the Water',
        text: 'A fog rolls across the lake toward the crib. As it passes, it speaks to you in Greek, in a woman’s voice, bored and amused.',
        choices: [
          { label: 'Greet it as Tessaly', req: { known: 'tessaly' }, outcomes: [
            { w: 1, text: '"Finally," says the fog. "Someone who knows who I am." It tells you about itself, at length.', fx: { loreDemon: 'tessaly' } },
          ] },
          { label: 'Stay very still', outcomes: [
            { w: 6, text: 'The fog passes. Your coat smells of brine for a week.', fx: {} },
            { w: 4, text: 'The fog takes offense at being ignored, and leaves frost in your eyebrows.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },
];
