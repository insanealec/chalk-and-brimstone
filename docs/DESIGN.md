# Chalk & Brimstone: Design

A living design document. It records what the game is meant to be, what's built, and what we've agreed to build next. Update it when a decision changes.

## Vision

A game about **lab-based magic**. You work out how to summon and bind spirits by gathering clues, testing them in the summoning chamber, and learning from every failure. The workshop is the heart of the game. The city is where you go to gather the pieces: lore, materials, favors and trouble.

### Pillars

1. **The chamber is a puzzle, not a menu.** Binding a spirit means assembling the right combination: its true name, circle, runes and incense. Getting there is the fun.
2. **Failure teaches.** Every attempt reveals something, and the notebook records it automatically. The player never has to take notes by hand.
3. **Spirits are characters, not items.** Every spirit has a voice, a grudge and an opinion about you. The footnote humor is a signature.
4. **Power has a cost.** Spirits resent being bound. Loose bindings get twisted, and broken ones get you hurt.
5. **The city gives context.** Districts supply lore, materials and story, but what you find there is meant to feed the lab.

### Inspiration and boundaries

The game is inspired by Jonathan Stroud's *Bartimaeus* trilogy: the spirit hierarchy (imp, foliot, djinni, afrit, marid), true names, circles and pentacles, spirits' contempt for their masters, and footnoted narration. All spirits, characters, places and text are original. Don't use the books' characters, names or prose.

## Setting

**Chicago, 1893.** The World's Columbian Exposition is going up on the lakefront. A political machine of magicians runs City Hall, and everyone else knows better than to ask questions. The player is the apprentice of the late Mr. Ambrose Thwaite and inherits his workshop above a saloon on Clark Street.

Historical hooks in use or planned: the Great Fire of 1871 (blamed on the cow, actually an afrit), the Board of Trade, the Levee, the Union Stock Yards, the Midway Plaisance, the Water Crib in the lake, the plan to reverse the Chicago River, and the labor unrest that led to the 1894 Pullman Strike.

## Core loop

1. **Learn** about a spirit: study, buy grimoires, visit districts, send servants to gossip or spy.
2. **Experiment** in the chamber. Each attempt costs an hour and a measure of incense, and fills in the notebook.
3. **Bind** the spirit, then put it to work. Errands bring back money, incense and more lore.
4. **Advance** through City Hall commissions. Rank unlocks stronger circles, rarer materials and new districts.
5. Climb from imps to the **marid** sleeping under Lake Michigan. Binding it wins the game.

Time is the main currency: 3 hours a day. Studying, summoning and visiting a district each take an hour. Errands happen overnight.

---

## Systems: built

### True names (built in step 1)

Every spirit's true name is a sequence of syllables from a shared pool of 12: `ASH BEL ITH KHA KOR MAR NEB OTH RU SAR UL ZEPH`. A name has **one syllable more than its class**: imps 2, foliots 3, djinn 4, afrits 5, marids 6. No syllable repeats within a name. Common names like "Nibbet" are what magicians call a spirit; they aren't its true name.

To summon, choose the spirit you mean to call and fill one slot per syllable from the palette. Speaking the name gives per-syllable feedback against the spirit you meant to call:

| Feedback | Meaning | Notebook records |
|---|---|---|
| *rings true, in place* | right syllable, right position | `syl:POS:SYL` |
| *belongs in the name, but not there* | in the name, wrong position | `at!:SYL:POS` |
| *means nothing to it* | not in the name | `not:SYL` |

- **Wrong name:** nothing answers. The hour and the incense are spent, but the feedback is kept.
- **Someone else's name:** if the syllables spell *another* spirit's true name, **that spirit answers instead** and is checked against your circle, runes and incense. This is the risk of guessing, and also a way to discover spirits you've never read about.
- **Correct name:** the spirit appears, and the binding is checked (see below).

Languages were removed when true names were added. The incantation is the name.

### The notebook (built in step 1)

Each spirit has a requirements sheet (name, runes, incense, circle) that fills itself in from two sources:

- **Lore fragments.** Each fragment carries machine-readable `facts` alongside its prose.
- **Chamber observations.** Name feedback, runes that held or did nothing, the rune count, and the spirit's reaction to the incense.

It also **deduces by elimination**, marking deduced entries with ✶:

- A syllable that can only fit one position gets placed there. If the known syllables fill every gap, nothing else is in the name.
- Once the rune count is known, finding every rune rules out the rest. Ruling out all but the needed number confirms the remainder.
- Each spirit likes exactly one incense and hates exactly one. When only one candidate is left, it's deduced.

The palette in the chamber is colored by what the notebook knows, like Wordle's keyboard: confirmed, present, ruled out, untested. Slots are prefilled with confirmed syllables.

Lore is designed so that reading everything about a spirit leaves **zero to two syllables** to find by experiment. Querrin's last syllable is deduced; Phebbet needs one test to settle the order of two known syllables; the marid has one unknown position.

### Binding rules

Once the right spirit appears:

- **Circle** too weak for its class → it breaks free.
- **Required rune missing** → it breaks free.
- Otherwise score = −1 per wrong rune, +2 liked incense, −2 hated incense, +1 per tier the circle outclasses the spirit (max +2).
  - 2 or more: **firm** binding.
  - 0–1: **uneasy** binding.
  - Below 0: **breaks free**.
- **Pentacle:** if your pentacle is at least the spirit's class, a broken binding costs ceil(class ÷ 2) health. Otherwise it costs class × 2 + 1. An uneasy binding with a weak pentacle has a 35% chance of hurting you for the spirit's class in health.

### Servants and errands

Bound spirits are **timed**: they serve for 3–6 nights depending on class, plus 2 if firmly bound. You can hold as many spirits as your rank tier. Errands run overnight and repeat each night until changed: gather coin, pilfer incense, gossip (lore of the spirit's class or lower), spy (lore one class higher), or a City Hall errand. Success chance depends on class versus difficulty, with a bonus for firm bindings. Uneasy servants sometimes twist a failed errand against you. When patience runs out, a firm servant leaves quietly; an uneasy one lashes out.

### City Hall and ranks

There's a chain of eight commissions, alternating "bind a spirit of class X" with "send a servant on errand X". Reputation raises your rank: Apprentice → Ward Magician → Alderman → Commissioner → Boss. Rank gates market goods, districts and how many spirits you can hold. The last commission is binding the marid.

### City (built; to be reworked in step 3)

A map with six districts, unlocked by rank: Maxwell Street, the Levee, LaSalle Street, the Union Stock Yards, the Midway Plaisance and the Water Crib. A visit costs an hour and draws a random encounter with choices. Choices can need money, a rank, a bound servant of some class, or knowledge of a spirit. Content lives in `js/districts.js`.

---

## Roadmap

### Step 1: incantation and automatic deduction ✅
Built as described above.

### Step 2: binding clauses, vessels and the familiar ✅
Every incantation now ends with a **binding clause** that decides what kind of binding you're making. Clauses are learned through progression:

| Clause | Result | Learned |
|---|---|---|
| *of Service* | Timed servant for errands | From the start |
| *of the Vessel* | The spirit is sealed into a tool for good | Commission 2 (The Maxwell Street Fence), which also gives a scrying glass |
| *of the Familiar* | A companion for good that stays at your side | Commission 4 (Whispers on LaSalle Street) |

**Permanent bindings must be firm.** A vessel or familiar binding that would only be uneasy breaks instead, and the spirit tears free. So the loop is: experiment with cheap service bindings until the notebook is complete, then make the permanent binding. Vessel and familiar spirits don't count against the servant limit, never run errands and never run out of patience. A spirit can only be bound in one place at a time, and binding a new spirit into a filled vessel or familiar slot releases the old one.

**Vessels.** Each vessel is bought once and has a housing that caps the class it can hold. It starts at imp and is reinforced in the Workshop for $40 / $90 / $180 / $300 to reach foliot through marid; each step requires the rank just below that class. The effect scales with the class *t* of the spirit inside:

| Vessel | Price | Effect with a spirit of class *t* |
|---|---|---|
| Scrying glass | $25 | Each dawn, records *t* unknown facts about the spirit selected in the chamber (or another known spirit), if it is at most class *t* + 1 |
| Hooded lantern | $20 | Reveals hidden choices in districts that need lantern strength ≤ *t* |
| Sword-cane | $30 | Turns aside ceil(*t*/2) damage from every injury |
| Pocket watch | $60 | ceil(*t*/2) extra hours every day |
| Signet ring | $40 | City Hall pays 25% × *t* more; reveals choices that need signet strength ≤ *t* |

Lantern and signet choices are invisible until the vessel is strong enough. When they appear they're tagged, so you can tell what the vessel bought you.

**Familiar.** One at a time, bound with *of the Familiar*. It never runs errands, but it is **with you in the city**, so it satisfies "needs a servant of class X" choices there. It has every ability up to its own class:

| Class | Ability |
|---|---|
| Imp | Warns which choices in the city could hurt you |
| Foliot | Points out mistakes in the chamber that the notebook already knows about (wrong syllable, useless rune, missing rune, hated incense, circle too weak) |
| Djinni | One less damage from every injury |
| Afrit | Gives the odds of getting hurt in the city |
| Marid | One extra hour every day |

The familiar is the stepping stone to step 4: the earned companion is a familiar you can't simply summon.

### Step 3: district places and current events
Replace the random encounter draw with something more tangible:

- **Fixed places** in each district, like the Gilded Anchor, the Board of Trade floor and the Street in Cairo, each with standing actions.
- **Current events** that change what's available. A daily newspaper headline announces them. Events have durations and play out over several steps.
  - **Historical:** the Fair opening, the strike building at the Stock Yards.
  - **Political:** fights inside the Machine, such as a First Ward election.
  - **Consequences of your actions:** a freed spirit coming back later.
- Hidden stats per district or faction (for example *Suspicion* or *Debt to the Machine*) gate and color events.
- Possible faction: workers with an immunity to magic, echoing the labor movement. Fear them, use them or join them.

### Step 4: the earned companion
One specific sarcastic djinni with its own story arc spread across places and events. You meet it, it doesn't trust you, and the two of you trade favors, betrayals and deals. Eventually it **offers** to become your familiar on its own terms. It is never given to the player for free.

---

## Open questions

- **Balance.** Economy and pacing haven't been tested in real play. The wheat tips on LaSalle Street come out slightly in the player's favor on average, and removing languages took away money sinks of $335 in total (vessels and reinforcing them add new ones). The scrying glass and pocket watch may be too strong; they're the first things to tune.
- **Cost of guessing names.** Each attempt costs an hour and an incense. Is that the right price, or should testing a name be cheaper but riskier?
- **Rival magicians and the Machine.** Should rivals raid your workshop and try to steal your vessels? Wards could be a sixth vessel, or part of step 3.
- **Rune positions.** The circle has three rune slots, but position doesn't matter yet. Placing runes at specific points is a candidate for deepening the lab puzzle later.
- **Repeat visits.** What should happen after a spirit is bound once? Should rebinding get easier, and do spirits remember how you treated them?

## Content conventions

- All content is data:
  - `js/data.js`: spirits, lore, materials, errands, commissions
  - `js/districts.js`: districts and encounters
- **Lore fragments** need `facts` (the formats are documented above `DEMONS`). Their prose must agree with their facts, and every syllable fact must appear in the text as `[SYL]`.
- **Spirits:** a name length of class + 1, no repeated syllables, no two spirits with the same name, exactly one liked and one hated incense.
- **Tone:** dry, period-flavored, funny. Each spirit gets an appearance, a greeting and a footnote. Use American spelling.
