// Districts of Chicago, visited from the City tab. Each visit costs an hour and draws one encounter.
//
// Encounter choices may have:
//   cost      dollars paid up front
//   req       { rank, servantTier, known } needed to pick it (known: a spirit you have heard of)
//             { lantern, ring } hide the choice entirely unless that vessel holds a spirit of at least this class
//   outcomes  [{ w (weight), text, fx }], one is drawn by weight
//
// Outcome effects (fx):
//   dollars        n or [min, max] (negative takes money, never below zero)
//   robbed         [min, max] dollars lost, capped at what you carry
//   health, rep    n
//   incense        { id: n }
//   incenseRandom  [count, maxRank] random incense up to that market rank
//   lore           [minTier, maxTier], or r => [min, max] given your rank tier (1-5)
//   loreDemon      a specific spirit's lore, falling back to lore of its class
//   rune           teaches a rune (or yields lore if already known)
//
// Encounters marked `once` disappear after they are resolved.

const DISTRICTS = [
  {
    id: 'maxwell', name: 'Maxwell Street', rank: 0, danger: 1, x: 278, y: 262,
    desc: 'An open-air market west of the river. A dozen languages, everything for sale, and some of it real.',
    encounters: [
      {
        id: 'peddler', title: 'A Peddler of Holy Smoke',
        text: 'A peddler with a cart of burlap sacks swears his incense comes "from the Holy Land, by way of Cincinnati."',
        choices: [
          { label: 'Buy a sack', cost: 6, outcomes: [
            { w: 7, text: 'The sack is mostly genuine. Mostly.', fx: { incenseRandom: [3, 1] } },
            { w: 3, text: 'It is sawdust and cinnamon. The peddler and his cart have already vanished into the crowd.', fx: {} },
          ] },
          { label: 'Haggle', req: { dollars: 3 }, outcomes: [
            { w: 5, text: 'After ten minutes of theatrical outrage on both sides, you walk away with two sacks for three dollars.', fx: { dollars: -3, incenseRandom: [2, 1] } },
            { w: 5, text: 'He takes your offer as a personal insult to his mother, his village and his incense. No sale.', fx: {} },
          ] },
          { label: 'Hold your lantern to the sacks', cost: 6, req: { lantern: 1 }, outcomes: [
            { w: 1, text: 'In the lantern\u2019s light one sack glows faintly: genuine stock. You buy that one.', fx: { incenseRandom: [4, 2] } },
          ] },
          { label: 'Walk on', outcomes: [{ w: 1, text: 'You leave the peddler to his next mark.', fx: {} }] },
        ],
      },
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
            { w: 6, text: 'It freezes mid-step, then grins. "Fair cop." It returns your purse and sweetens the deal with a little gossip.', fx: { lore: [1, 2] } },
            { w: 4, text: 'Your Latin is a fraction too slow. It bites your hand and is gone.', fx: { robbed: [3, 6], health: -1 } },
          ] },
          { label: 'Catch its true shape in your lantern', req: { lantern: 1 }, outcomes: [
            { w: 1, text: 'The light pins the imp in its real shape, mid-step and mortified. It hands back your purse, adds a coin for its dignity, and talks.', fx: { dollars: 4, lore: [1, 2] } },
          ] },
          { label: 'Let it go', outcomes: [{ w: 1, text: 'You decide it isn’t worth the trouble. The imp agrees, and waves.', fx: { robbed: [3, 6] } }] },
        ],
      },
      {
        id: 'bookstall', title: 'The Bookstall',
        text: 'A trestle table sags under water-stained books in Yiddish, Polish, Greek and Latin. The bookseller is asleep.',
        choices: [
          { label: 'Wake him and search the stacks', cost: 4, outcomes: [
            { w: 6, text: 'Between a hymnal and a cookbook you find a few pages torn from something much older.', fx: { lore: r => [1, r + 1] } },
            { w: 4, text: 'An hour of dust and nothing. The bookseller keeps your money anyway, on principle.', fx: {} },
          ] },
          { label: 'Let him sleep', outcomes: [{ w: 1, text: 'You tiptoe away. He snores on.', fx: {} }] },
        ],
      },
    ],
  },

  {
    id: 'levee', name: 'The Levee', rank: 0, danger: 2, x: 398, y: 270,
    desc: 'Saloons, gambling halls and dime museums south of the Loop. The aldermen take their cut; the spirits take the rest.',
    encounters: [
      {
        id: 'faro', title: 'The Faro Table',
        text: 'At the back of a saloon called the Gilded Anchor, a faro dealer with very clean cuffs beckons you over.',
        choices: [
          { label: 'Bet $5', cost: 5, outcomes: [
            { w: 45, text: 'The cards fall your way.', fx: { dollars: 10 } },
            { w: 55, text: 'The cards do not fall your way. They rarely do, here.', fx: {} },
          ] },
          { label: 'Bet $20', cost: 20, outcomes: [
            { w: 45, text: 'You win, loudly. Several people remember your face.', fx: { dollars: 40 } },
            { w: 55, text: 'The dealer sweeps your money away with a sympathetic smile.', fx: {} },
          ] },
          { label: 'Open your lantern on the dealing box', req: { lantern: 2 }, outcomes: [
            { w: 1, text: 'The imp in the box shrieks in the light. The dealer pays you a good deal to close the shutter and leave.', fx: { dollars: [15, 25] } },
          ] },
          { label: 'Watch the dealer instead', outcomes: [
            { w: 5, text: 'On the third hand you see it: an imp curled in the dealing box, whispering the cards. For a dollar, it whispers other things too.', fx: { dollars: -1, lore: [1, 2] } },
            { w: 5, text: 'You watch for an hour and learn nothing, except that the house always wins.', fx: {} },
          ] },
        ],
      },
      {
        id: 'bartender', title: 'A Talkative Bartender',
        text: 'The bartender at the Bucket of Blood polishes the same glass for ten minutes while watching you. In the Levee, that is an invitation.',
        choices: [
          { label: 'Buy a drink and listen', cost: 3, outcomes: [
            { w: 7, text: 'He leans in. "You didn’t hear this from me…"', fx: { lore: r => [1, r + 1] } },
            { w: 3, text: 'He tells you a long story about his brother-in-law. None of it is useful.', fx: {} },
          ] },
          { label: 'Buy the house a round', cost: 12, outcomes: [
            { w: 1, text: 'The whole saloon drinks your health, and the rumors start flowing faster than the beer.', fx: { lore: r => [1, r + 1], loreCount: 2 } },
          ] },
          { label: 'Leave', outcomes: [{ w: 1, text: 'You leave him to his glass.', fx: {} }] },
        ],
      },
      {
        id: 'pit', title: 'The Imp Pit',
        text: 'Behind a dime museum, magicians crowd around a chalk ring where two bound imps are tearing at each other. Money is changing hands fast.',
        choices: [
          { label: 'Enter your own servant', cost: 5, req: { servantTier: 1 }, outcomes: [
            { w: 55, text: 'Your servant wins with a dirty trick it refuses to explain. The purse is yours.', fx: { dollars: 20 } },
            { w: 45, text: 'Your servant loses, then spends the walk home explaining why it was not its fault.', fx: {} },
          ] },
          { label: 'Bet on the favorite', cost: 5, outcomes: [
            { w: 6, text: 'The favorite wins, as favorites do.', fx: { dollars: 8 } },
            { w: 4, text: 'The favorite trips over its own tail.', fx: {} },
          ] },
          { label: 'Tip off City Hall', outcomes: [
            { w: 6, text: 'City Hall pays a small bounty for the tip.', fx: { dollars: 8 } },
            { w: 4, text: 'City Hall pays a small bounty. The pit’s owners catch up with you in an alley before you can spend it.', fx: { dollars: 8, health: -2 } },
          ] },
        ],
      },
      {
        id: 'museum', once: true, title: 'A Genuine Bottled Djinni',
        text: 'A dime museum on State Street advertises A GENUINE BOTTLED DJINNI! Inside, on a velvet cushion, sits a green glass bottle. Something in it is swearing in Aramaic.',
        choices: [
          { label: 'Pay your dime and press your ear to the glass', cost: 1, outcomes: [
            { w: 1, text: 'It is a foliot, not a djinni, and it is very bored. It will talk to anyone who listens.', fx: { lore: [2, 3] } },
          ] },
          { label: 'Smash the bottle and free it', outcomes: [
            { w: 5, text: 'The foliot streaks out the window. That night a purse drops onto your doorstep with a note: "We’re even."', fx: { dollars: [15, 25] } },
            { w: 5, text: 'The foliot is grateful for about half a second, then remembers you are a magician.', fx: { health: -2 } },
          ] },
          { label: 'Leave it', outcomes: [{ w: 1, text: 'The swearing follows you out onto the street.', fx: {} }] },
        ],
      },
      {
        id: 'toughs', title: 'Three Men in an Alley',
        text: 'Three toughs step out of an alley off Custom House Place. One of them is holding a lead pipe and a very old grudge against magicians.',
        choices: [
          { label: 'Show them the Machine\u2019s signet', req: { ring: 1 }, outcomes: [
            { w: 1, text: 'They see the ring and melt back into the alley, apologizing to your boots.', fx: {} },
          ] },
          { label: 'Hand over your purse', outcomes: [{ w: 1, text: 'They take it and leave, almost politely.', fx: { robbed: [5, 15] } }] },
          { label: 'Fight', outcomes: [
            { w: 4, text: 'You shout a word that is not actually magic. They flee anyway.', fx: {} },
            { w: 6, text: 'The lead pipe wins.', fx: { health: -3, robbed: [3, 8] } },
          ] },
          { label: 'Set your servant on them', req: { servantTier: 1 }, outcomes: [
            { w: 85, text: 'Your servant appears behind them in a shape best left undescribed. They run, dropping their own purses.', fx: { dollars: [5, 12] } },
            { w: 15, text: 'Your servant takes its time arriving. Deliberately.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },

  {
    id: 'lasalle', name: 'LaSalle Street', rank: 1, danger: 1, x: 388, y: 202,
    desc: 'The Board of Trade, the banks, and the offices of the city’s richest magicians, who do not like to be bothered.',
    encounters: [
      {
        id: 'tip', title: 'A Tip on Wheat',
        text: 'A broker on the steps of the Board of Trade grabs your sleeve. He has a tip on wheat futures, and the frantic eyes of a man whose imp has been reading other people’s telegrams.',
        choices: [
          { label: 'Ask the Machine\u2019s friends on the floor instead', req: { ring: 1 }, outcomes: [
            { w: 1, text: 'A man with a ring like yours murmurs a better tip than the broker\u2019s. It pays.', fx: { dollars: [25, 35] } },
          ] },
          { label: 'Invest $20', cost: 20, outcomes: [
            { w: 5, text: 'Wheat goes up. Your money comes back fatter.', fx: { dollars: 45 } },
            { w: 5, text: 'Wheat goes down, and your twenty dollars go with it.', fx: {} },
          ] },
          { label: 'Invest $60', cost: 60, outcomes: [
            { w: 5, text: 'Wheat goes through the roof. You are briefly the toast of LaSalle Street.', fx: { dollars: 135 } },
            { w: 5, text: 'Wheat collapses. You are briefly the punchline of LaSalle Street.', fx: {} },
          ] },
          { label: 'Decline', outcomes: [{ w: 1, text: 'He finds another sleeve to grab.', fx: {} }] },
        ],
      },
      {
        id: 'rival', title: 'A Rival Magician',
        text: 'A magician in a silk hat recognizes you outside the Rookery. "Thwaite’s apprentice," she says, as if naming a stain.',
        choices: [
          { label: 'Exchange pleasantries', outcomes: [
            { w: 5, text: 'She can’t resist showing off what she knows. You let her.', fx: { lore: r => [1, r + 1] } },
            { w: 5, text: 'Ten minutes of veiled insults, and nothing learned.', fx: {} },
          ] },
          { label: 'Trade insults', outcomes: [
            { w: 5, text: 'You land a cutting remark about her pentacle. A passing clerk laughs out loud. Worth it.', fx: {} },
            { w: 5, text: 'She mutters something, and your shoes catch fire.', fx: { health: -2 } },
          ] },
        ],
      },
      {
        id: 'club', title: 'The Lake Shore Circle',
        text: 'The library of the Lake Shore Circle, the city’s oldest club for magicians, is members only. The doorman is enormous and, you suspect, not entirely human.',
        choices: [
          { label: 'Bribe the doorman', cost: 12, outcomes: [
            { w: 7, text: 'He looks the other way for exactly one hour. You use it well.', fx: { lore: r => [r, r + 2] } },
            { w: 3, text: 'He takes the money and does not look the other way.', fx: {} },
          ] },
          { label: 'Show your signet to the doorman', req: { ring: 2 }, outcomes: [
            { w: 1, text: 'The doorman bows. Friends of the Machine are always members.', fx: { lore: r => [r, r + 2] } },
          ] },
          { label: 'Present yourself as a member', req: { rank: 2 }, outcomes: [
            { w: 1, text: 'An alderman of the Machine is always expected. The librarian finds you something rare.', fx: { lore: r => [r, r + 1] } },
          ] },
          { label: 'Leave', outcomes: [{ w: 1, text: 'The doorman watches you all the way down the block.', fx: {} }] },
        ],
      },
      {
        id: 'banker', once: true, title: 'The Banker’s Problem',
        text: 'A bank president takes you aside. Something has been rearranging the numbers in his ledgers at night, and his own magicians are stumped.',
        choices: [
          { label: 'Lend him a servant', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'Your servant finds a foliot living in the inkwell. The bank president is grateful, and very well connected.', fx: { dollars: 40, rep: 1 } },
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
    encounters: [
      {
        id: 'spoil', title: 'Something in the Cold Room',
        text: 'A packinghouse foreman says something has been spoiling a side of beef every night and leaving tiny bootprints in the frost. He’ll pay to be rid of it.',
        choices: [
          { label: 'Send your servant into the cold room', req: { servantTier: 2 }, outcomes: [
            { w: 75, text: 'Your servant drags out a frost-imp by the ear. The foreman pays up, and tells the other foremen.', fx: { dollars: 30 } },
            { w: 25, text: 'Your servant and the imp come to an arrangement, which does not include you.', fx: {} },
          ] },
          { label: 'Go in yourself', outcomes: [
            { w: 5, text: 'You find a nest of three imps behind the ice and drive them out with salt and Latin.', fx: { dollars: 15 } },
            { w: 5, text: 'The imps find you first.', fx: { health: -2 } },
          ] },
          { label: 'Decline', outcomes: [{ w: 1, text: 'The foreman shrugs and goes back to his ledgers.', fx: {} }] },
        ],
      },
      {
        id: 'tallow', title: 'The Renderer',
        text: 'Behind the rendering works, a woman sells scraped resins and incense dregs out of a wheelbarrow. It smells of everything at once.',
        choices: [
          { label: 'Buy a bundle', cost: 5, outcomes: [{ w: 1, text: 'Rough, but it will burn.', fx: { incenseRandom: [3, 1] } }] },
          { label: 'Buy a big bundle', cost: 12, outcomes: [{ w: 1, text: 'She throws in something green and bitter she found "at the bottom."', fx: { incenseRandom: [6, 2] } }] },
          { label: 'Hold your nose and leave', outcomes: [{ w: 1, text: 'You leave. The smell follows you home.', fx: {} }] },
        ],
      },
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
            { w: 6, text: 'Two spirits, gossiping about their masters. You learn more than they meant to say.', fx: { lore: [2, 3] } },
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
    id: 'midway', name: 'The Midway Plaisance', rank: 2, danger: 1, x: 432, y: 455,
    desc: 'The World’s Columbian Exposition: electric light, the great Wheel, and a "Street in Cairo" where, rumor says, not all the Egyptians are human.',
    encounters: [
      {
        id: 'cairo', title: 'A Street in Cairo',
        text: 'Among the donkeys and dancers on the Street in Cairo, a spice merchant sits very still, and the smoke from his brazier moves against the wind.',
        choices: [
          { label: 'Buy galbanum (2 for $16)', cost: 16, outcomes: [
            { w: 1, text: 'He wraps it in paper printed with Coptic letters. You keep the paper too.', fx: { incense: { galbanum: 2 } } },
          ] },
          { label: 'Ask him about the spirits of the Nile', outcomes: [
            { w: 6, text: 'He studies you for a long moment, then speaks of an old temple-servant.', fx: { loreDemon: 'kethuun' } },
            { w: 4, text: 'He pretends not to speak English. He speaks it perfectly.', fx: {} },
          ] },
        ],
      },
      {
        id: 'wheel', title: 'The Great Wheel',
        text: 'Mr. Ferris’s Wheel lifts you 264 feet above the fairgrounds. From the top, through your spectacles of second sight, the whole city glitters with bound spirits.',
        choices: [
          { label: 'Study the city from the top', cost: 1, outcomes: [
            { w: 6, text: 'You spot a trail of scorched essence across the rooftops and trace it to its source.', fx: { lore: [3, 4] } },
            { w: 4, text: 'You see a great deal and understand none of it. The view, at least, is restful.', fx: { health: 1 } },
          ] },
          { label: 'Just enjoy the view', cost: 1, outcomes: [{ w: 1, text: 'For twenty minutes nothing wants to kill you. You feel much better.', fx: { health: 2 } }] },
        ],
      },
      {
        id: 'dynamo', title: 'Trouble at the Dynamo',
        text: 'The lights of the Electricity Building are flickering. An engineer swears there is something living inside the dynamo, and it is eating the current.',
        choices: [
          { label: 'Send your servant in', req: { servantTier: 2 }, outcomes: [
            { w: 8, text: 'Your servant hauls out a fat, glowing imp. The fair’s managers pay handsomely and ask no questions.', fx: { dollars: 40 } },
            { w: 2, text: 'Your servant comes out singed, furious and empty-handed.', fx: {} },
          ] },
          { label: 'Tinker with it yourself', outcomes: [
            { w: 4, text: 'You coax the imp out with a copper coin. The engineer tips you well.', fx: { dollars: 20 } },
            { w: 6, text: 'You touch the wrong part of the dynamo.', fx: { health: -2 } },
          ] },
        ],
      },
      {
        id: 'sarcophagus', title: 'The Egyptian Exhibit',
        text: 'In the Egyptian exhibit, a sarcophagus lid is carved with Coptic warnings. The guard is asleep. The warnings are not.',
        choices: [
          { label: 'Copy the inscriptions', outcomes: [
            { w: 6, text: 'The warnings are about an afrit. They are very specific.', fx: { loreDemon: 'ulgaroth' } },
            { w: 4, text: 'The guard wakes up and throws you out by the collar.', fx: { health: -1 } },
          ] },
          { label: 'Read the inscription only the lantern shows', req: { lantern: 3 }, outcomes: [
            { w: 1, text: 'Under the carved warnings is a second inscription, written in light. It was meant for magicians.', fx: { lore: [3, 5] } },
          ] },
          { label: 'Move along', outcomes: [{ w: 1, text: 'Something in the sarcophagus shifts as you leave.', fx: {} }] },
        ],
      },
    ],
  },

  {
    id: 'crib', name: 'The Water Crib', rank: 3, danger: 3, x: 572, y: 150,
    desc: 'Two miles out in Lake Michigan, the intake crib that drinks for the whole city. The engineers say the water down there is very deep and very cold, and that something in it is listening.',
    encounters: [
      {
        id: 'shaft', title: 'The Intake Shaft',
        text: 'The night engineer lets you lower a lantern into the intake shaft. The water below is black, and the light does not reach as far as it should.',
        choices: [
          { label: 'Look into the water with your second sight', outcomes: [
            { w: 6, text: 'Far below, something vast turns over in its sleep. You feel its name before you hear it.', fx: { loreDemon: 'shemashara' } },
            { w: 4, text: 'Something looks back.', fx: { health: -3 } },
          ] },
          { label: 'Lower your bound lantern instead', req: { lantern: 4 }, outcomes: [
            { w: 1, text: 'The spirit in your lantern goes down without fear and comes back with something the lake did not mean to give.', fx: { loreDemon: 'shemashara' } },
          ] },
          { label: 'Pull the lantern up', outcomes: [{ w: 1, text: 'The lantern comes up wet, though it never touched the water.', fx: {} }] },
        ],
      },
      {
        id: 'engineer', title: 'The Engineer’s Logbook',
        text: 'The crib’s engineer keeps a logbook of strange tides, moon-phases, and the nights the pumps ran backward. He would sell it, for the right price.',
        choices: [
          { label: 'Buy the logbook', cost: 25, outcomes: [{ w: 1, text: 'Most of it is about pumps. Some of it is not.', fx: { lore: [4, 5] } }] },
          { label: 'Decline', outcomes: [{ w: 1, text: 'He tucks the logbook back into his coat, relieved.', fx: {} }] },
        ],
      },
      {
        id: 'whaler', title: 'An Old Whaler',
        text: 'An old whaler who works the crib’s supply boat has a lump of something grey and waxy wrapped in oilcloth. "Ambergris," he says. "Off Nantucket, in ’61."',
        choices: [
          { label: 'Buy it (2 for $40)', cost: 40, outcomes: [{ w: 1, text: 'It smells of the sea, and of nothing you can name.', fx: { incense: { ambergris: 2 } } }] },
          { label: 'Decline', outcomes: [{ w: 1, text: 'He shrugs and goes back to mending his net.', fx: {} }] },
        ],
      },
      {
        id: 'fog', title: 'Fog on the Water',
        text: 'A fog rolls across the lake toward the crib. As it passes, it speaks to you in Greek, in a woman’s voice, bored and amused.',
        choices: [
          { label: 'Greet it as Tessaly', req: { known: 'tessaly' }, outcomes: [
            { w: 1, text: '"Finally," says the fog. "Someone who knows who I am." It tells you about itself, at length.', fx: { loreDemon: 'tessaly' } },
          ] },
          { label: 'Stay very still', outcomes: [
            { w: 6, text: 'The fog passes. Your coat smells of brine for a week.', fx: {} },
            { w: 4, text: 'The fog takes offense at being ignored and leaves you chilled to the bone.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },
];
