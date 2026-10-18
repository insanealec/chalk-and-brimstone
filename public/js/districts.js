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
//             { lantern, ring, glass, flag, ithzar } hide it entirely unless that vessel (glass: the scrying
//             glass) holds a spirit of at least this class, that flag has been set, or Ithzar is around
//   unless    a flag that hides the action once it has been set
//   outcomes  [{ w (weight), text, fx }], one is drawn by weight
// Street encounter: { id, title, text, choices, once?, unless?, when?, flag? }
//   flag: set when the encounter happens; when(state): only met while this is true (an event running, say).
//   A walk avoids the district's last few encounters.
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
    street: [
      {
        id: 'organ', title: 'The Organ Grinder',
        text: 'An organ grinder works the corner outside Kinsella’s. His monkey wears a red fez and collects pennies in a tin cup, and when it looks at you its eyes catch the light the way no monkey’s should.',
        choices: [
          { label: 'Drop a penny in the cup', cost: 1, outcomes: [
            { w: 6, text: 'The monkey bows, and as it straightens it whispers in a voice like a rusty hinge: the name of a magician who owes it money, and what he keeps in his cellar.', fx: { lore: [1, 2] } },
            { w: 4, text: 'The monkey bites the penny, finds it genuine, and loses interest in you.', fx: {} },
          ] },
          { label: 'Tell the grinder what his monkey is', outcomes: [
            { w: 1, text: 'The grinder goes pale and gives you a dollar to keep it to yourself. Behind his back, the monkey makes a gesture you have only seen sailors make.', fx: { dollars: 1 } },
          ] },
          { label: 'Walk on', outcomes: [{ w: 1, text: 'Behind you, the organ starts “After the Ball” for the fourth time this hour.', fx: {} }] },
        ],
      },
      {
        id: 'landlady', title: 'Mrs. Dunphy',
        text: 'Your landlady, Mrs. Dunphy, catches you on the stairs. There is a scorch mark on her ceiling in the shape of a pentacle, and she would like to know what you propose to do about it.',
        choices: [
          { label: 'Pay for the plasterer', cost: 4, outcomes: [
            { w: 1, text: 'She takes the money, and stops mentioning you to the patrolman on the corner.', fx: { standing: { suspicion: -1 } } },
          ] },
          { label: 'Have your servant fix the ceiling', req: { servantTier: 1 }, outcomes: [
            { w: 7, text: 'By evening the ceiling is whiter than it has been since the Fire. Mrs. Dunphy is delighted, and a little afraid of you.', fx: { standing: { suspicion: -1 } } },
            { w: 3, text: 'Your servant fixes the ceiling, and leaves a small rude face in the plaster where only you will notice it.', fx: {} },
          ] },
          { label: 'Promise to be more careful', outcomes: [
            { w: 6, text: 'She does not believe you, but she likes being promised things.', fx: {} },
            { w: 4, text: 'She does not believe you, and says so to the patrolman on the corner.', fx: { standing: { suspicion: 1 } } },
          ] },
        ],
      },
      {
        id: 'wallet', once: true, title: 'A Wallet in the Gutter',
        text: 'A fat calfskin wallet lies in the gutter outside the Sherman House. Inside: forty dollars, a railway pass, and a card engraved with the name of an alderman.',
        choices: [
          { label: 'Return it to the alderman', outcomes: [
            { w: 1, text: 'The alderman’s secretary counts the money in front of you, finds it all there, and looks at you as if you were a new kind of insect. The alderman remembers your name.', fx: { rep: 1, standing: { machine: 2 } } },
          ] },
          { label: 'Keep the money and post the wallet back', outcomes: [
            { w: 1, text: 'You keep the forty dollars and drop the wallet in a mailbox. In the First Ward this counts as civic virtue.', fx: { dollars: 40 } },
          ] },
          { label: 'Give the money to the Mission on Van Buren Street', outcomes: [
            { w: 1, text: 'The sister at the Mission thanks you, and tells everyone in the soup line.', fx: { standing: { union: 2 } } },
          ] },
        ],
      },
    ],
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
        id: 'elixir', title: 'Dr. Fennimore’s Elixir',
        text: 'A man on a soapbox is selling Dr. Fennimore’s Galvanic Elixir, a dollar the bottle, against gout, grief and the tremors. One bottle in his crate is glowing faintly, and he has not noticed.',
        choices: [
          { label: 'Buy the glowing bottle', cost: 1, outcomes: [
            { w: 6, text: 'It tastes of copper and thunderstorms. Your bruises are gone by evening.', fx: { health: 2 } },
            { w: 4, text: 'It is lamp oil and food coloring. The glow was the light off the river.', fx: {} },
          ] },
          { label: 'Ask him where he gets it', outcomes: [
            { w: 1, text: 'From a chemist on Halsted Street who pays his rent in bottles, he says. The chemist keeps a foliot in his still, it turns out, and talks about it to anyone who buys a drink.', fx: { lore: [2, 2] } },
          ] },
          { label: 'Walk on', outcomes: [{ w: 1, text: 'Behind you, a woman buys three bottles for her husband’s gout.', fx: {} }] },
        ],
      },
      {
        id: 'chess', title: 'The Chess Player',
        text: 'An old man in a skullcap plays chess against all comers on an upturned crate, a nickel a game. He has not lost today. Whenever his opponent looks away, one of the opponent’s pawns edges back a square.',
        choices: [
          { label: 'Play him for five dollars', cost: 5, outcomes: [
            { w: 4, text: 'You watch your pawns instead of the board, and win. He pays up with a sigh, and calls the imp under the crate a name in Yiddish that it seems to deserve.', fx: { dollars: 12 } },
            { w: 6, text: 'You watch your pawns so closely that you lose your queen to an ordinary bishop. He is also, it turns out, good at chess.', fx: {} },
          ] },
          { label: 'Speak to the imp under the crate', outcomes: [
            { w: 1, text: 'The imp lodges with the old man and pays its rent in won games. For your silence it tells you about another imp, a street over, that does the same thing with dice.', fx: { lore: [1, 1] } },
          ] },
          { label: 'Watch a game', outcomes: [{ w: 1, text: 'A broker from LaSalle Street loses four games in a row, then a fifth, and leaves blaming the light.', fx: {} }] },
        ],
      },
      {
        id: 'ragman', once: true, title: 'The Rag-and-Bone Man',
        text: 'A rag-and-bone man’s cart is piled with the leavings of a house on Prairie Avenue: hat boxes, a birdcage, and a stack of leather notebooks tied with string. The top one has a circle chalked on the cover.',
        choices: [
          { label: 'Buy the notebooks', cost: 12, outcomes: [
            { w: 1, text: 'Most of them are household accounts. The last one is a dead magician’s working notes, and it teaches you a rune.', fx: { rune: 'serpent' } },
          ] },
          { label: 'Let the cart go by', outcomes: [{ w: 1, text: 'The cart rattles off toward the river, the birdcage swinging.', fx: {} }] },
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
        id: 'grady', title: 'Officer Grady',
        text: 'Officer Grady of the Harrison Street station falls into step beside you. He hears you have been doing a little business, he says, and he would hate for anyone to make trouble over it.',
        choices: [
          { label: 'Pay him to keep it that way', cost: 5, outcomes: [
            { w: 1, text: 'Grady pockets the money without looking at it and touches his helmet. Somewhere at the station a report goes into a drawer instead of onto a desk.', fx: { standing: { suspicion: -1 } } },
          ] },
          { label: 'Show him the Machine’s signet', req: { ring: 1 }, outcomes: [
            { w: 1, text: 'Grady sees the ring, remembers an appointment, and walks away faster than a policeman should.', fx: { standing: { suspicion: -1 } } },
          ] },
          { label: 'Tell him you have no idea what he means', outcomes: [
            { w: 5, text: 'Grady laughs, says he likes a magician with a sense of humor, and lets it go.', fx: {} },
            { w: 5, text: 'Grady stops laughing, and writes your name in his little book.', fx: { standing: { suspicion: 1 } } },
          ] },
        ],
      },
      {
        id: 'gambler', once: true, title: 'A Gambler’s Debt',
        text: 'A gambler in a checked suit, three days into a losing streak, offers to sell you the true name of an imp he won at cards in Cincinnati. He wants eight dollars and a drink.',
        choices: [
          { label: 'Buy him the drink and the name', cost: 8, outcomes: [
            { w: 7, text: 'He writes what he remembers on a beer mat. It is not the whole name, but it is not nothing.', fx: { lore: [1, 1] } },
            { w: 3, text: 'He writes it on a beer mat. Your notebook already knows it. You drink the drink yourself.', fx: {} },
          ] },
          { label: 'Wish him luck', outcomes: [{ w: 1, text: 'He thanks you, and goes back to the faro table to test it.', fx: {} }] },
        ],
      },
      {
        id: 'parade', title: 'A Torchlight Parade', when: s => s.events.election && !s.events.election.done,
        text: 'A torchlight parade for Honest Mike Rourke comes down Clark Street: a brass band, two hundred men in borrowed coats, and a banner of Rourke so large it takes six to carry it. Several of the marchers cast no shadow.',
        choices: [
          { label: 'Fall in and march', outcomes: [
            { w: 1, text: 'You march to the end of the route and are handed a free sandwich and a ballot already filled in.', fx: { standing: { machine: 1 } } },
          ] },
          { label: 'Heckle the banner', outcomes: [
            { w: 6, text: 'The crowd on the sidewalk laughs with you, and somebody from Ellen Vance’s campaign buys you a beer.', fx: { standing: { union: 1, machine: -1 } } },
            { w: 4, text: 'One of the marchers without a shadow steps out of line and walks you into a lamppost.', fx: { health: -1, standing: { union: 1, machine: -1 } } },
          ] },
          { label: 'Count the marchers without shadows', outcomes: [
            { w: 1, text: 'Eleven. Three of them answer to the names on headstones in the North Side cemetery, and one of them, cornered, tells you what it really is.', fx: { lore: [1, 2] } },
          ] },
        ],
      },
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
        id: 'clerk', title: 'A Clerk at Lunch',
        text: 'A City Hall clerk with ink to the elbows is eating his lunch on the steps of the Rookery. He copies out the commissions, and he looks as if nobody has bought him lunch in years.',
        choices: [
          { label: 'Buy him a better lunch', cost: 3, outcomes: [
            { w: 6, text: 'Over oysters at Rector’s he tells you which files sit in the cabinet behind his desk, and what one of them says.', fx: { lore: r => [Math.max(1, r - 1), r] } },
            { w: 4, text: 'He eats the lunch, thanks you warmly, and tells you nothing, because he is honest. You had not expected that.', fx: {} },
          ] },
          { label: 'Leave him to his sandwich', outcomes: [{ w: 1, text: 'He nods to you, the way one clerk nods to another.', fx: {} }] },
        ],
      },
      {
        id: 'ticker', title: 'A Strip of Ticker Tape',
        text: 'A strip of ticker tape blows down LaSalle Street and wraps itself around your ankle. The prices on it are tomorrow’s.',
        choices: [
          { label: 'Buy what it says will rise', cost: 10, outcomes: [
            { w: 6, text: 'It rises. You sell at noon, and the man who buys from you looks at you the way people look at magicians.', fx: { dollars: 22 } },
            { w: 4, text: 'It rises the day after tomorrow. Either the tape was a day early or you were a day late.', fx: { dollars: 4 } },
          ] },
          { label: 'Take it to the secretary of the Board of Trade', outcomes: [
            { w: 1, text: 'The secretary burns it in his ashtray, thanks you for your public spirit, and remembers your face.', fx: { standing: { machine: 1 } } },
          ] },
          { label: 'Let it blow away', outcomes: [{ w: 1, text: 'It flutters off toward the river. A broker chases it for a block and a half.', fx: {} }] },
        ],
      },
      {
        id: 'petitioner', title: 'A Petitioner', when: s => s.rep >= RANKS[2].rep,
        text: 'A widow in good black follows you down from City Hall. She has heard you are a magician the Machine listens to, and her late husband’s ghost is keeping the lodgers up.',
        choices: [
          { label: 'Send your servant to lay the ghost', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'It is not a ghost. It is an imp her husband bound in 1879 and forgot to dismiss, and it is delighted to be let go. The widow pays you, and tells her friends.', fx: { dollars: [15, 25], rep: 1 } },
          ] },
          { label: 'See to it yourself', outcomes: [
            { w: 6, text: 'You chalk a small circle in her attic and speak the Dismissal. The knocking stops. She pays you in banknotes that smell of camphor.', fx: { dollars: 12 } },
            { w: 4, text: 'The imp in the attic is not ready to go, and says so with a coal scuttle.', fx: { health: -2, dollars: 6 } },
          ] },
          { label: 'Send her to Mrs. Ashby', outcomes: [{ w: 1, text: 'She thanks you. Mrs. Ashby, you hear later, charged her forty dollars.', fx: {} }] },
        ],
      },
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
        id: 'steer', title: 'A Runaway Steer',
        text: 'A steer has broken out of the pens and is coming down Halsted Street at a gallop, scattering wagons. Its eyes are lit like lamps, and a small grinning shape is riding between its horns.',
        choices: [
          { label: 'Stand your ground and speak the Dismissal', outcomes: [
            { w: 6, text: 'The rider hears the Dismissal and lets go, and the steer stops dead a yard from your boots, astonished at itself. The drovers stand you a drink.', fx: { rep: 1, standing: { union: 1 } } },
            { w: 4, text: 'The rider hears the Dismissal and ignores it. You spend the afternoon on your back in the mud, being stepped around.', fx: { health: -2 } },
          ] },
          { label: 'Set your servant on the rider', req: { servantTier: 2 }, outcomes: [
            { w: 1, text: 'Your servant plucks the imp off the steer like a burr off a coat. The packinghouse that owns the steer pays you a finder’s fee.', fx: { dollars: [10, 20] } },
          ] },
          { label: 'Climb the nearest fence', outcomes: [{ w: 1, text: 'You sit on the fence with three drovers and a newsboy and watch it go by.', fx: {} }] },
        ],
      },
      {
        id: 'meeting', title: 'A Meeting in a Back Room',
        text: 'Behind a saloon on Ashland Avenue, forty packinghouse workers are crowded into a back room, arguing in four languages about wages. They go quiet when you come in.',
        choices: [
          { label: 'Speak for the workers', outcomes: [
            { w: 1, text: 'You do not say much, but you say it in the right language. They let you stay to the end.', fx: { standing: { union: 2, machine: -1 } } },
          ] },
          { label: 'Report the meeting to the Machine', outcomes: [
            { w: 1, text: 'The Machine is grateful in the way it is always grateful: briefly, and with a note in a file.', fx: { standing: { machine: 2, union: -2 } } },
          ] },
          { label: 'Leave quietly', outcomes: [{ w: 1, text: 'You go. The argument starts again before the door has closed.', fx: {} }] },
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
    id: 'midway', name: 'The Midway Plaisance', rank: 2, opensDay: 29, danger: 1, x: 432, y: 455, streetLabel: 'Walk the Midway',
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
    street: [
      {
        id: 'lions', title: 'Hagenbeck’s Lions',
        text: 'At Hagenbeck’s Animal Arena a lion has ridden a tricycle twice a day since the Fair opened. Today it has stopped in the middle of the ring and is staring at the audience, as if looking for someone in particular.',
        choices: [
          { label: 'Look the lion in the eye', outcomes: [
            { w: 6, text: 'There is a spirit in the lion, looking for a magician who owes it a favor. It is disappointed that you are not him, and tells you so at length.', fx: { lore: [2, 3] } },
            { w: 4, text: 'Whatever is in the lion takes offense. The keepers get you out of the front row with a torn coat and a long scratch.', fx: { health: -2 } },
          ] },
          { label: 'Send your servant into the cage', req: { servantTier: 3 }, outcomes: [
            { w: 1, text: 'A foliot shoots out of the lion’s ear like a cork from a bottle and makes for the lake. The lion finishes its ride to applause, and the arena’s manager pays you in gold.', fx: { dollars: 40, rep: 1 } },
          ] },
          { label: 'Watch the show', cost: 1, outcomes: [{ w: 1, text: 'The lion finishes the act without enthusiasm. The children love it anyway.', fx: {} }] },
        ],
      },
      {
        id: 'balloon', title: 'The Captive Balloon',
        text: 'The captive balloon at the west end of the Midway goes up a thousand feet on its cable, two dollars a ride. From the top, they say, you can see four states.',
        choices: [
          { label: 'Ride it up', cost: 2, outcomes: [
            { w: 5, text: 'From the top the whole city is laid out like a map, and if you know how to look you can see where spirits are at work: a flicker here, a curl of wrong-colored smoke there. You note down two of them.', fx: { lore: [1, 3] } },
            { w: 3, text: 'The wind picks up. The balloon bucks on its cable, and you spend the ride on the floor of the basket with a schoolteacher from Ohio.', fx: { health: -1 } },
            { w: 2, text: 'A sooty sparrow lands on the rim of the basket, counts the chimneys of the South Side aloud, and is gone before you can ask its name.', fx: {} },
          ] },
          { label: 'Watch it from the ground', outcomes: [{ w: 1, text: 'It goes up, comes down, and goes up again, like the price of wheat.', fx: {} }] },
        ],
      },
      {
        id: 'photographer', title: 'The Photographer',
        text: 'A photographer offers to take your likeness against a painted Court of Honor, a dollar. When he shows you the wet plate, there is someone standing behind you who was not there.',
        choices: [
          { label: 'Buy the print', cost: 1, outcomes: [
            { w: 1, text: s => (s.ithzar.joined ? 'It is Ithzar, of course, in its stovepipe hat, holding two fingers up behind your head.'
              : ownFamiliar() ? `It is ${ownFamiliar().name}, of course, pulling a face at the camera.`
              : 'It is no one you know, and by the time the print is dry it has gone from the paper.'), fx: {} },
          ] },
          { label: 'Ask him to take another', outcomes: [
            { w: 1, text: 'The second plate shows only you, looking startled. He charges you for both.', fx: { dollars: -1 } },
          ] },
        ],
      },
    ],
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
        id: 'net', title: 'The Fisherman’s Net',
        text: 'A fisherman has tied up at the Crib’s ladder to wait out the weather. He will not fish near the Crib any more, he says. His nets come up with things in them that were never alive.',
        choices: [
          { label: 'Buy what was in his last net', cost: 6, outcomes: [
            { w: 4, text: 'A lump of grey wax as big as your fist, greasy and sweet. Ambergris, from a lake that has never had a whale in it.', fx: { incense: { ambergris: 1 } } },
            { w: 6, text: 'A brass doorknob, a child’s shoe, and a bottle with a letter in it in a language you cannot read. You keep the letter.', fx: {} },
          ] },
          { label: 'Ask him what he has seen', outcomes: [
            { w: 1, text: 'A light under the water at night, he says, moving against the current, as big as a streetcar. He has not told his wife.', fx: {} },
          ] },
        ],
      },
      {
        id: 'storm', title: 'Weather on the Lake',
        text: 'A squall comes across the lake out of a clear sky, black and fast, and hits the gallery like a thrown bucket. The engineers run for the pump house.',
        choices: [
          { label: 'Run for the pump house', outcomes: [{ w: 1, text: 'You wait it out with the engineers, who play cards and do not talk about the weather.', fx: {} }] },
          { label: 'Call to Squall by name', req: { known: 'squall' }, outcomes: [
            { w: 1, text: 'The wind drops at once. A sooty sparrow lands on the rail, puffed up with pride, says it was only practicing, and leaves you a stick of incense it stole from the engineers.', fx: { incenseRandom: [1, 3] } },
          ] },
          { label: 'Stand in it and listen', outcomes: [
            { w: 5, text: 'Under the wind, in the gaps between the waves, the lake says a syllable under its breath.', fx: { loreDemon: 'shemashara' } },
            { w: 5, text: 'You hear nothing but wind, and catch a chill that lasts the week.', fx: { health: -2 } },
          ] },
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
            { w: 4, text: 'The fog takes offense at being ignored, and leaves frost in your eyebrows.', fx: { health: -1 } },
          ] },
        ],
      },
    ],
  },
];
