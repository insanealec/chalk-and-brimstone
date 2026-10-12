// All static game content: spirits, materials, errands, commissions.
// Everything here is plain data so new spirits and items can be added without touching game logic.

const TIER_NAMES = ['', 'Imp', 'Foliot', 'Djinni', 'Afrit', 'Marid'];

// rep needed for each rank; rank index also gates the market (item.rank)
const RANKS = [
  { name: 'Apprentice', rep: 0 },
  { name: 'Ward Magician', rep: 3 },
  { name: 'Alderman', rep: 8 },
  { name: 'Commissioner', rep: 15 },
  { name: 'Boss', rep: 24 },
];

const RUNES = {
  thorn:   { name: 'Thorn',   glyph: 'ᚦ', price: 0,  rank: 0 },
  gale:    { name: 'Gale',    glyph: 'ᚹ', price: 0,  rank: 0 },
  stone:   { name: 'Stone',   glyph: 'ᛟ', price: 0,  rank: 0 },
  tide:    { name: 'Tide',    glyph: 'ᛚ', price: 15, rank: 0 },
  moon:    { name: 'Moon',    glyph: 'ᛃ', price: 18, rank: 1 },
  flame:   { name: 'Flame',   glyph: 'ᚲ', price: 20, rank: 1 },
  serpent: { name: 'Serpent', glyph: 'ᛉ', price: 40, rank: 2 },
  crown:   { name: 'Crown',   glyph: 'ᛞ', price: 55, rank: 2 },
};
const START_RUNES = ['thorn', 'gale', 'stone'];

// The syllables of the binding tongue. Every true name is built from these, with no syllable used twice
// in one name. A spirit's true name has one syllable more than its class: imps 2, foliots 3 ... marids 6.
const SYLLABLES = ['ASH', 'BEL', 'ITH', 'KHA', 'KOR', 'MAR', 'NEB', 'OTH', 'RU', 'SAR', 'UL', 'ZEPH'];

const INCENSE = {
  rosemary:     { name: 'Rosemary',     price: 2,  rank: 0, color: '#9fc39a' },
  cedar:        { name: 'Cedar',        price: 3,  rank: 0, color: '#c79a6a' },
  frankincense: { name: 'Frankincense', price: 4,  rank: 0, color: '#e6d7a8' },
  myrrh:        { name: 'Myrrh',        price: 4,  rank: 0, color: '#c4776a' },
  wormwood:     { name: 'Wormwood',     price: 6,  rank: 1, color: '#9bb0a0' },
  sandalwood:   { name: 'Sandalwood',   price: 7,  rank: 1, color: '#e0b48a' },
  galbanum:     { name: 'Galbanum',     price: 12, rank: 2, color: '#a6c46a' },
  ambergris:    { name: 'Ambergris',    price: 25, rank: 3, color: '#d8c7e8' },
};

// The circle the spirit appears in. Its tier is the most powerful class it can contain.
const CIRCLES = [
  { id: 'chalk',    tier: 1, price: 0,   rank: 0, name: 'Chalk Circle',             desc: 'Drawn freehand. Adequate for imps, if you keep your hand steady.' },
  { id: 'salt',     tier: 2, price: 25,  rank: 1, name: 'Salt-and-Iron Ring',       desc: 'A ring of iron filings sealed with salt. Foliots find it tiresome.' },
  { id: 'silver',   tier: 3, price: 70,  rank: 2, name: 'Silver-Inlaid Circle',     desc: 'Silver set into the floorboards. Djinn dislike silver intensely.' },
  { id: 'rowan',    tier: 4, price: 180, rank: 3, name: 'Silver-and-Rowan Ring',    desc: 'Twin silver bands with rowan between. Rated for afrits, allegedly.' },
  { id: 'obsidian', tier: 5, price: 320, rank: 4, name: 'Triple Obsidian Ring',     desc: 'Three rings of volcanic glass. Nothing short of a marid needs this.' },
];

// The circle the magician stands in. If it is weaker than a spirit that breaks loose, it will not save you.
const PENTACLES = [
  { id: 'chalk',    tier: 1, price: 0,   rank: 0, name: 'Chalk Pentacle',            desc: 'Better than nothing. Marginally.' },
  { id: 'copper',   tier: 2, price: 20,  rank: 1, name: 'Copper-Wire Pentacle',      desc: 'Copper wire pinned to the floor in a five-pointed star.' },
  { id: 'silver',   tier: 3, price: 60,  rank: 2, name: 'Silver Pentacle',           desc: 'A proper magician’s pentacle. Polish it regularly.' },
  { id: 'rowan',    tier: 4, price: 120, rank: 3, name: 'Rowan-Wood Pentacle',       desc: 'Carved rowan bound in silver. Afrits have been known to sulk at it.' },
  { id: 'obsidian', tier: 5, price: 220, rank: 4, name: 'Obsidian Pentacle',         desc: 'Black glass, cold to the touch. The only sane choice for a marid.' },
];

// days a spirit will serve before its bonds wear thin (firm bindings add 2)
const PATIENCE = [0, 3, 5, 5, 6, 6];

// The last part of every incantation: what kind of binding you are making.
// Vessel and familiar bindings are for good, so they must be firm, or the spirit tears free.
const CLAUSES = {
  service:  { name: 'of Service',      desc: 'A servant for errands, for as long as its patience lasts.' },
  vessel:   { name: 'of the Vessel',   desc: 'Sealed into a tool for good. Needs a firm binding, or the spirit tears free.' },
  familiar: { name: 'of the Familiar', desc: 'A companion for good. It follows you and helps, but never runs errands. Needs a firm binding.' },
};

// Tools a spirit can be sealed into. The effect scales with the class (tier) of the spirit inside;
// the housing caps the class it can hold and can be reinforced. `cap` is the cap when bought.
const VESSELS = {
  scrying: {
    name: 'Scrying Glass', price: 25, rank: 0, cap: 1,
    desc: 'A hand mirror backed with silver. Something inside it can see a long way.',
    effect: t => `Each dawn, shows you ${t} unknown thing${t > 1 ? 's' : ''} about the spirit you are studying, if that spirit is no more than one class above the one in the glass.`,
  },
  lantern: {
    name: 'Hooded Lantern', price: 20, rank: 0, cap: 1,
    desc: 'A dark-lantern with a shutter. Whatever burns inside it shows things as they are.',
    effect: t => `Reveals hidden options in the city (strength ${t} of 5).`,
  },
  cane: {
    name: 'Sword-Cane', price: 30, rank: 1, cap: 1,
    desc: 'Malacca wood, silver-topped, with a blade inside and room for something else.',
    effect: t => `Turns aside ${caneGuard(t)} damage from every injury.`,
  },
  watch: {
    name: 'Pocket Watch', price: 60, rank: 1, cap: 1,
    desc: 'A railroad watch that keeps perfect time. With help, it keeps a little extra.',
    effect: t => `+${watchHours(t)} hour${watchHours(t) > 1 ? 's' : ''} every day.`,
  },
  ring: {
    name: 'Signet Ring', price: 40, rank: 1, cap: 1,
    desc: 'A heavy gold signet. The Machine knows its friends by their rings.',
    effect: t => `City Hall pays ${25 * t}% more, and some doors open that otherwise would not (strength ${t} of 5).`,
  },
};
const caneGuard = t => Math.ceil(t / 2);
const watchHours = t => Math.ceil(t / 2);

// Cost to reinforce a vessel so it can hold a spirit of each class. Requires the rank before that class.
const VESSEL_CAP_COST = [0, 0, 40, 90, 180, 300];

// What a familiar does for you. A familiar has every ability up to its own class.
const FAMILIAR_ABILITIES = [
  { tier: 1, text: 'Warns you which choices in the city could get you hurt.' },
  { tier: 2, text: 'Points out mistakes your notebook already knows about before you speak a summons.' },
  { tier: 3, text: 'Watches your back: one less damage from every injury.' },
  { tier: 4, text: 'Tells you the odds of getting hurt in the city.' },
  { tier: 5, text: 'Keeps your days in order: one extra hour every day.' },
];

const FAMILIAR_QUIPS = [
  '{name} spends the morning reading over your shoulder and sighing.',
  '{name} has rearranged your bookshelves "by threat level."',
  '{name} asks, not for the first time, what exactly you think you are doing with your life.',
  '{name} has eaten the cheese. It does not deny it.',
  '{name} critiques your chalk lines from the mantelpiece.',
  '{name} wonders aloud whether your predecessor also snored.',
];

// Each spirit likes exactly one incense and hates exactly one; the notebook's deductions rely on that.
//
// Lore fragments carry `facts` the notebook records automatically when the fragment is read.
// [SYL] in lore text is rendered as a syllable. Fact formats (also used for chamber observations):
//   syl:POS:SYL   SYL is the syllable at position POS (0-based)
//   has:SYL       SYL is somewhere in the name
//   at!:SYL:POS   SYL is in the name, but not at POS
//   not:SYL       SYL is not in the name
//   rune:R / norune:R / runes:N     R holds it / R does nothing / it needs N runes in all
//   likes:I / hates:I / neutral:I   its feelings about incense I
const DEMONS = [
  // ---- Imps
  {
    id: 'nibbet', name: 'Nibbet', tier: 1, trueName: ['NEB', 'ITH'], runes: ['thorn'], likes: 'rosemary', hates: 'cedar',
    form: 'a warty green toad in a waistcoat two sizes too small',
    greet: `"Oh, it's <i>you</i>. Another one." It surveys your chalk lines with professional disdain.¹`,
    footnote: '¹ The circle was, Nibbet later told its friends, "wobbly enough to drive a cart through."',
    lore: [
      { src: 'Your late master’s notebook', facts: ['syl:0:NEB', 'syl:1:ITH', 'rune:thorn', 'runes:1'],
        text: 'Nibbet — an imp of no consequence. True name [NEB]·[ITH]. Draw the Thorn at the circle’s edge and nothing else; it is not worth the chalk.' },
      { src: 'Hollingsworth’s Compendium, vol. II', facts: ['likes:rosemary'],
        text: 'The imp Nibbet is a creature of kitchen-gardens. Give it the smoke of rosemary and it grows almost civil.' },
      { src: 'Marginalia of Agnes Pell', facts: ['hates:cedar'],
        text: 'Never burn cedar for Nibbet. It sulked for a week and bit the cat.' },
    ],
  },
  {
    id: 'squall', name: 'Squall', tier: 1, trueName: ['ZEPH', 'RU'], runes: ['gale'], likes: 'cedar', hates: 'frankincense',
    form: 'a sooty sparrow with eyes like two hot coals',
    greet: `"Chimneys!" it squawks. "Do you know how many smokestacks there are in Chicago? <i>I</i> do."¹`,
    footnote: '¹ 412,906. It counted. It had a great deal of free time between summonings.',
    lore: [
      { src: 'A sweep’s almanac', facts: ['syl:0:ZEPH'],
        text: 'Squall, an imp of the chimney-pots. Its true name begins [ZEPH], like a draft under the door.' },
      { src: 'Hollingsworth’s Compendium, vol. II', facts: ['rune:gale', 'runes:1', 'syl:1:RU'],
        text: 'Squall rides the drafts and will hold to no rune save the Gale. Its name ends in [RU], a sound like wind in a flue.' },
      { src: 'Marginalia of Agnes Pell', facts: ['likes:cedar', 'hates:frankincense'],
        text: 'Cedar-smoke soothes Squall wonderfully. Frankincense, by contrast, sets it shrieking like a kettle.' },
    ],
  },
  {
    id: 'grubwick', name: 'Grubwick', tier: 1, trueName: ['KOR', 'UL'], runes: ['stone'], likes: 'myrrh', hates: 'rosemary',
    form: 'a lumpish mole-thing wearing a monocle',
    greet: `"Kaliméra," it says, in a voice like gravel. "You'll be wanting something dug, I expect."¹`,
    footnote: '¹ Magicians always want something dug. Usually a grave. Usually someone else’s.',
    lore: [
      { src: 'Ledger of a Smyrna merchant', facts: ['syl:1:UL'],
        text: 'Grubwick, an imp of cellars and coal-holes. The merchant called it by a true name ending in [UL], but would not write the rest.' },
      { src: 'Hollingsworth’s Compendium, vol. II', facts: ['rune:stone', 'runes:1', 'syl:0:KOR'],
        text: 'To hold Grubwick, inscribe the Stone, and only the Stone. Its name begins with [KOR], heavy as a dropped sack.' },
      { src: 'Marginalia of Agnes Pell', facts: ['likes:myrrh', 'hates:rosemary'],
        text: 'Grubwick favors myrrh. It considers rosemary "vegetable impertinence."' },
    ],
  },
  // ---- Foliots
  {
    id: 'tessaly', name: 'Tessaly', tier: 2, trueName: ['MAR', 'ITH', 'SAR'], runes: ['tide', 'moon'], likes: 'sandalwood', hates: 'wormwood',
    form: 'a pale woman made of drifting fog, smelling of a sea a long way from here',
    greet: `"How refreshing. The last one called me by the wrong name entirely, and in Swedish."¹`,
    footnote: '¹ He is still, in a sense, in Minnesota. Several parts of Minnesota.',
    lore: [
      { src: 'Logbook of the brig <i>Persephone</i>', facts: ['syl:0:MAR'],
        text: 'Tessaly, a foliot of the harbor fogs. Sailors who know its true name say it begins [MAR], like the sea.' },
      { src: 'The Piraeus Fragments', facts: ['rune:tide', 'rune:moon', 'runes:2', 'syl:2:SAR'],
        text: 'Tessaly was bound at Piraeus beneath the Tide and the Moon. Draw both, or the fog slips through your fingers. The name closes with [SAR].' },
      { src: 'Marginalia of Agnes Pell', facts: ['likes:sandalwood', 'hates:wormwood'],
        text: 'The foliot Tessaly is vain of her scent — burn sandalwood for her. Wormwood she reckons a deliberate insult.' },
    ],
  },
  {
    id: 'querrin', name: 'Querrin', tier: 2, trueName: ['ZEPH', 'OTH', 'NEB'], runes: ['gale', 'thorn'], likes: 'wormwood', hates: 'myrrh',
    form: 'a long-legged heron in a postman’s cap',
    greet: `"Message for you," says Querrin. "It reads: <i>you are going to regret this.</i>"¹`,
    footnote: '¹ Querrin writes these messages itself. It finds it saves time.',
    lore: [
      { src: 'Post Office (Arcane) circular', facts: ['syl:1:OTH'],
        text: 'Querrin — foliot, messenger, tattletale. Its true name has [OTH] at its heart; the postmasters will say no more.' },
      { src: 'Hollingsworth’s Compendium, vol. III', facts: ['rune:gale', 'rune:thorn', 'runes:2', 'syl:0:ZEPH'],
        text: 'Querrin is held by the Gale and the Thorn together: swift, and prickly. It comes fastest to a name that starts with [ZEPH].' },
      { src: 'A rival’s stolen diary', facts: ['likes:wormwood', 'hates:myrrh', 'has:NEB'],
        text: 'Contrary creature, Querrin. It delights in bitter wormwood and loathes the sweetness of myrrh. I heard it shriek once when someone said [NEB] — that is in its name somewhere.' },
    ],
  },
  {
    id: 'phebbet', name: 'Phebbet', tier: 2, trueName: ['ASH', 'KOR', 'BEL'], runes: ['flame', 'stone'], likes: 'frankincense', hates: 'rosemary',
    form: 'a squat brass kettle with a face, and an attitude',
    greet: `Steam whistles from Phebbet's spout. "Good pronunciation. <i>Terrible</i> posture."¹`,
    footnote: '¹ Phebbet’s views on posture date back to the Assyrians, who stood very straight, mostly out of fear.',
    lore: [
      { src: 'A Damascene smith’s prayer-roll', facts: ['syl:0:ASH'],
        text: 'Phebbet, a foliot of the forge, came west from Damascus. The smiths began its true name with [ASH], for the cinders.' },
      { src: 'Hollingsworth’s Compendium, vol. III', facts: ['rune:flame', 'rune:stone', 'runes:2', 'has:KOR', 'has:BEL'],
        text: 'Phebbet is a hearth-thing; bind it with Flame and Stone. [KOR] and [BEL] are both in its name, though I forget in which order.' },
      { src: 'A rival’s stolen diary', facts: ['likes:frankincense', 'hates:rosemary'],
        text: 'Phebbet takes frankincense as its due. Rosemary it spits back at you, burning.' },
    ],
  },
  // ---- Djinn
  {
    id: 'azrimel', name: 'Azrimel', tier: 3, trueName: ['ASH', 'ITH', 'SAR', 'KHA'], runes: ['flame', 'serpent'], likes: 'myrrh', hates: 'sandalwood',
    form: 'a handsome youth wreathed in lazy blue flame',
    greet: `"Azrimel, Breaker of Lesser Bonds, Scourge of—" It notices your runes, and sighs. "Fine. What do you want?"¹`,
    footnote: '¹ The full title runs to nineteen clauses. It has been workshopping a twentieth.',
    lore: [
      { src: 'The Babylonian Index', facts: ['syl:0:ASH', 'syl:3:KHA'],
        text: 'Azrimel, a djinni of middling rank and immoderate opinions. Its true name opens with [ASH] and closes with [KHA].' },
      { src: 'Proceedings of the Lake Shore Circle', facts: ['rune:flame', 'rune:serpent', 'runes:2', 'has:SAR'],
        text: 'Azrimel’s binding: the Flame and the Serpent. It has slipped lesser bonds and boasted of it after. There is a hiss of [SAR] somewhere in its name.' },
      { src: 'Marginalia of Agnes Pell', facts: ['likes:myrrh', 'hates:sandalwood'],
        text: 'Azrimel says myrrh reminds it of the tombs of kings, and is mollified. Sandalwood it calls "cheap perfume for cheap magicians."' },
    ],
  },
  {
    id: 'kethuun', name: 'Kethuun', tier: 3, trueName: ['KHA', 'MAR', 'RU', 'BEL'], runes: ['tide', 'crown'], likes: 'galbanum', hates: 'frankincense',
    form: 'a jackal-headed figure in river-green linen',
    greet: `"You may address me as Your Radiance," says Kethuun. You do not.¹`,
    footnote: '¹ Kethuun keeps a list. You are on it now.',
    lore: [
      { src: 'A papyrus from Thebes', facts: ['syl:0:KHA', 'syl:3:BEL'],
        text: 'Kethuun, a djinni of the Nile. The scribes wrote its true name beginning with [KHA] and ending with [BEL].' },
      { src: 'Proceedings of the Lake Shore Circle', facts: ['rune:tide', 'rune:crown', 'runes:2', 'syl:1:MAR'],
        text: 'Kethuun is held by the Tide and the Crown. It served in a temple once and expects to be treated as royalty. Its second syllable is [MAR], the river’s.' },
      { src: 'An Egyptologist’s letters', facts: ['likes:galbanum', 'hates:frankincense'],
        text: 'Galbanum, bitter and green, pleases Kethuun. Frankincense it associates with priests who wronged it.' },
    ],
  },
  // ---- Afrit
  {
    id: 'ulgaroth', name: 'Ulgaroth', tier: 4, trueName: ['UL', 'ASH', 'KOR', 'OTH', 'BEL'], runes: ['flame', 'stone', 'crown'], likes: 'galbanum', hates: 'cedar',
    form: 'a pillar of black smoke shot through with furnace-light, ten feet tall and stooping',
    greet: `The floorboards blister. "SPEAK, LITTLE MAGICIAN. QUICKLY."¹`,
    footnote: '¹ Afrits do not do lower case.',
    lore: [
      { src: 'A City Hall file, marked SECRET', facts: ['syl:0:UL'],
        text: 'ULGAROTH. Afrit. True name begins [UL]. Do not summon unless you are very sure of yourself.' },
      { src: 'Proceedings of the Lake Shore Circle', facts: ['rune:flame', 'rune:stone', 'rune:crown', 'runes:3'],
        text: 'Three runes hold Ulgaroth: Flame, Stone and Crown. Two will not suffice. The magicians who tried two are not available for comment.' },
      { src: 'An Egyptologist’s letters', facts: ['likes:galbanum', 'hates:cedar'],
        text: 'Ulgaroth tolerates galbanum. Cedar-smoke enrages it. Somebody burned cedar for it in October of 1871, and the whole city learned that lesson. The cow got the blame.' },
      { src: 'A scorched page from the 1871 ruins', facts: ['syl:1:ASH', 'syl:4:BEL', 'has:OTH'],
        text: '…its name, [ASH] second, as the fire is second to the word… ending in [BEL]… and [OTH] somewhere I cannot… (the rest is ash).' },
    ],
  },
  // ---- Marid
  {
    id: 'shemashara', name: 'Shem-Ashara', tier: 5, trueName: ['SAR', 'MAR', 'UL', 'KHA', 'ITH', 'RU'], runes: ['tide', 'moon', 'serpent'], likes: 'ambergris', hates: 'galbanum',
    form: 'a vast, slow tide of shadow that fills the room without seeming to enter it',
    greet: `When it speaks, it is the sound of water at the bottom of a well. "I remember when your city was a marsh. I will remember when it is a marsh again."¹`,
    footnote: '¹ It is not a threat. It is a forecast.',
    lore: [
      { src: 'A clay tablet, much repaired', facts: ['syl:0:SAR', 'syl:1:MAR'],
        text: 'Shem-Ashara, a marid of the deep waters, older than Babylon. Its true name begins [SAR]·[MAR], as the sea begins.' },
      { src: 'A City Hall file, marked MOST SECRET', facts: ['rune:tide', 'rune:moon', 'rune:serpent', 'runes:3'],
        text: 'The marid sleeps beneath the Tide, the Moon and the Serpent. All three must be drawn, and no other. It hears its name even half-spoken, and it does not like being guessed at. DO NOT GUESS.' },
      { src: 'A whaler’s journal', facts: ['likes:ambergris', 'hates:galbanum'],
        text: 'Ambergris, the whale’s gift, is the only offering Shem-Ashara does not scorn. Galbanum it holds in particular contempt.' },
      { src: 'The Water Crib engineer’s logbook', facts: ['syl:3:KHA', 'syl:5:RU'],
        text: 'On the nights the pumps ran backward the men heard the lake say [KHA], then something they could not make out, then [RU], always at the end of something longer.' },
    ],
  },
];

// Said by whatever spirit has just broken free.
const BROKEN_QUIPS = [
  { greet: `"Thanks for the lift," says {name}, and leaves through the ceiling.¹`, footnote: '¹ It did not use the door. The ceiling has not been the same since.' },
  { greet: `{name} laughs, which is worse than anything it could have said.¹`, footnote: '¹ Spirits laugh at magicians the way cats look at birds.' },
  { greet: `"Oh, <i>wonderful</i>," says {name}, stepping out of the circle. "A loophole."¹`, footnote: '¹ There is always a loophole. Finding it is half the fun.' },
];

const ERRANDS = {
  coin:   { name: 'Gather coin',            diff: () => 1,     desc: 'Bring back money. Do not ask from where.' },
  pilfer: { name: 'Pilfer incense',         diff: () => 2,     desc: 'Raid a rival’s stores for incense.' },
  gossip: { name: 'Gossip about its kind',  diff: () => 1,     desc: 'Lore about spirits of its own class or lower.' },
  spy:    { name: 'Spy on a senior magician', diff: t => t + 1, desc: 'Stolen notes on a more powerful spirit.' },
};

const ERRAND_TEXT = {
  coin: {
    ok: [
      '{name} returns with a purse of {amt} dollars. You decide not to ask whose.',
      '{name} drops {amt} dollars on your desk. "Found it," it says. "In a pocket. Attached to a man."',
      '{name} has won {amt} dollars at faro. It is evasive about whether it cheated. It cheated.',
    ],
    fail: [
      '{name} returns empty-handed, claiming the streets were "unusually well guarded by pigeons."',
      '{name} found a purse, but "it was the wrong color." You suspect it simply could not be bothered.',
    ],
  },
  pilfer: {
    ok: [
      '{name} returns reeking of a rival’s workshop, arms full: {items}.',
      '{name} slips back before dawn with {items}, and a smug expression.',
    ],
    fail: [
      '{name} was chased off by a rival’s guardian sphere and returns sulking.',
      '{name} reports that the rival’s storeroom was "full of wards and a very angry goose."',
    ],
  },
  gossip: {
    ok: [
      'After some flattery, {name} tells you a story about one of its kind.',
      '{name} cannot resist a little gossip about an old acquaintance.',
    ],
    none: ['{name} claims to know nothing you don’t. For once it may be telling the truth.'],
    fail: ['{name} refuses to "snitch." It finds the very idea vulgar. Today.'],
  },
  spy: {
    ok: [
      '{name} slips back through the window at dawn with a page of stolen notes.',
      '{name} spent the night beneath a senior magician’s desk and returns with a copied page.',
    ],
    fail: [
      '{name} returns singed. "The Senior Magician," it says, "had wards I did not care for."',
      '{name} got lost in the senior magician’s library, which it insists was "rearranging itself."',
    ],
  },
  commission: {
    fail: [
      '{name} returns having failed City Hall’s errand. It blames "bureaucracy."',
      '{name} could not complete City Hall’s errand. The matter remains unresolved.',
    ],
  },
};

// What a resentful (uneasily bound) spirit does when it fails on purpose.
const TWISTS = [
  { effect: 'coin',    text: '{name} returns and helps itself to {amt} dollars "for expenses."' },
  { effect: 'hurt',    text: 'While you slept, {name} moved your furniture onto the ceiling. You fall climbing for your boots.' },
  { effect: 'incense', text: '{name} carried out your instructions to the letter. Unfortunately, the letter involved setting fire to your {item}.' },
  { effect: 'none',    text: '{name} followed your orders exactly. You asked it to bring back "what it found." It found a goat.' },
];

// The progression spine. 'bind' commissions complete on a successful binding of the given class or higher;
// 'errand' commissions are assigned to a servant like any other errand. A commission's `file` is a lore
// fragment City Hall sends when the commission comes up, so the player knows where to start.
const COMMISSIONS = [
  {
    title: 'A Demonstration of Competence', type: 'bind', tier: 1, rep: 3, pay: 15,
    text: 'City Hall does not hand out jobs on the strength of a dead man’s name. Bind a spirit — any spirit — and the alderman of your ward will consider your file.',
    done: 'A clerk writes your name in a ledger without looking up. In this city, that is how careers begin.',
  },
  {
    title: 'The Maxwell Street Fence', type: 'errand', diff: 1, rep: 2, pay: 25, teaches: 'vessel', gift: 'scrying',
    text: 'A scrying-glass has gone missing from a City Hall storeroom and turned up, rumor has it, in the back room of a Maxwell Street pawnbroker. Send a servant to get it back. Quietly.',
    done: 'The glass is returned. The pawnbroker has taken up a new career in being somewhere else. The clerk slides a second, cracked glass across the desk, with a card explaining the Clause of the Vessel. "Make yourself useful," it reads.',
  },
  {
    title: 'Messengers for the Mayor', type: 'bind', tier: 2, rep: 3, pay: 30, file: 'querrin-1',
    text: 'The Mayor’s office is short of messengers. Bind a foliot or better, and prove you can be trusted with something faster than an imp. A clerk has sent over a file on the Post Office’s foliot, which is cheap to bind and not much missed.',
    done: 'The Mayor’s office sends a letter of thanks, which arrives by imp, three days late.',
  },
  {
    title: 'Whispers on LaSalle Street', type: 'errand', diff: 2, rep: 3, pay: 60, teaches: 'familiar',
    text: 'Someone is selling the city’s secrets to the speculators at the Board of Trade. Send a servant to shadow the Superintendent of Public Works, who has lately been buying very expensive hats.',
    done: 'The hats were a code, carried by the Superintendent’s familiar, a sleek grey foliot that never left his shoulder. The Superintendent is now the former Superintendent, and City Hall sends you a transcript of how his familiar was bound: the Clause of the Familiar.',
  },
  {
    title: 'Fire and Air', type: 'bind', tier: 3, rep: 4, pay: 70, file: 'azrimel-1',
    text: 'A magician who cannot command a djinni is a magician who answers their own front door. Bind a djinni, and the Machine will begin to take you seriously.',
    done: 'You are invited to a banquet at the Palmer House. Nobody speaks to you, but several people look at you nervously, which is better.',
  },
  {
    title: 'The Stolen Seal', type: 'errand', diff: 3, rep: 4, pay: 120,
    text: 'The Great Seal of the City of Chicago has been stolen from a locked vault by something that walked through the walls. Find it before the <i>Tribune</i> does.',
    done: 'The Seal is recovered from beneath a rival’s floorboards. The rival is recovered from the bottom of the Chicago River.',
  },
  {
    title: 'A Show of Strength', type: 'bind', tier: 4, rep: 5, pay: 180, file: 'ulgaroth-1',
    text: 'The Mayor wishes to know whether you can bind an afrit; the World’s Fair needs someone to keep the lights on. The Mayor does not like to be kept waiting. Neither, as it happens, do afrits.',
    done: 'The Mayor shakes your hand, then discreetly checks it for scorch marks.',
  },
  {
    title: 'The Deep One', type: 'bind', tier: 5, rep: 10, pay: 500, win: true, file: 'shemashara-1',
    text: 'Old records speak of a marid sleeping beneath Lake Michigan since before there was a city here to drown. The engineers want to reverse the river to keep it asleep. The Machine would rather it were bound — ideally by someone expendable. Congratulations: you are someone expendable.',
    done: 'The lake goes still. Across Chicago, every spirit in every circle turns its head toward your workshop.',
  },
];
