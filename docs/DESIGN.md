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

### City (built in step 3)

**Calendar.** Day 1 is Monday, April 3, 1893. Dates replace day numbers everywhere. The World's Fair opens on May 1 (day 29).

**Districts and places.** The map has seven districts. Clark Street, where your workshop is, is always open. The others unlock by rank: Maxwell Street and the Levee from the start, LaSalle Street and the Union Stock Yards at Ward Magician, the Midway Plaisance at Alderman *and* once the Fair opens, and the Water Crib at Commissioner. Each district has **fixed places**, and each place has **standing actions** that take an hour each, for example faro at the Gilded Anchor or wheat tips at the Board of Trade. Actions can be one-time (`once`) or have a `cooldown` in days. A place can close because of a story flag; the Imp Pit is padlocked if the reformer wins.

**Streets.** Most districts can also be wandered for an hour, which draws a one-off street encounter with choices (the pickpocket imp, the alley toughs, the bottled foliot). Street encounters can be one-time or removed by flags.

**The newspaper.** *The Chicago Clarion* is at the top of the City tab. It prints the headlines of running events, newest first, or a filler headline on quiet days. New headlines also go into the chronicle at dawn. An orange dot on the map marks districts where an event has something for you to do. The City tab gets a badge when something is waiting at your door.

**Current events** (`js/events.js`). An event starts at dawn when its condition becomes true and moves through stages. Each stage adds actions to one place, lasts a set number of days and then expires into another stage or ends. Actions can also move the event on. Events built so far:

| Event | Starts | What happens |
|---|---|---|
| Trouble in the Yards | April 10 | Wage cut → strike → three endings. Break it for the packers (money, Machine approval, the workers turn on you), carry messages for the strikers (they win if the workers trust you enough), or broker a settlement (needs standing with both sides). If the workers win, or you broker the deal, Dora Kaspar's people put incense aside for you at the Rendering Works from then on. |
| The First Ward Race | April 16 | "Honest Mike" Rourke against the reformer Ellen Vance. Stuff the ballot boxes with imps, tip off the reformers, or just drink to Mike. If Rourke wins, the alley toughs leave you alone and suspicion fades faster. If Vance wins, the Imp Pit is padlocked and suspicion fades slower. |
| The World's Fair | May 1 | The Midway opens. For opening week, the Electricity Building has extra work for servants and gossip from visiting magicians. |
| A Knock at the Door | 4 days after you free the bottled foliot | Phebbet comes back to pay its debt by telling you its whole true name. |
| The Crackdown | Whenever suspicion reaches 6 (repeatable) | Inspectors are coming. Pay their "fine", have the ward boss make it go away (costs Machine favor), or let them raid you. |

**Hidden standings.** Three numbers the player never sees directly: **the Machine**, **the workers** and **police suspicion**. Actions shift them, and some choices need a minimum standing. City Hall describes them in words ("To the Machine, you are a useful friend"), and outcomes report the direction ("the police take an interest"). Suspicion fades by itself over time.

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

### Step 3: district places and current events ✅
Built as described under **City** above. The magic-immune workers took the form of Dora Kaspar's packinghouse hands, "some of whom can see straight through a glamour." Their immunity is flavor for now and could become a mechanic later.

### Step 4: Ithzar, the earned companion (planned)

You never summon Ithzar. You earn it over most of the game, through a story arc threaded across the city and its events. The arc ends with a lab puzzle in your own chamber, and the relationship it builds is called in near the end of the game.

#### The character

**Ithzar**, a djinni about 2,600 years old. It has served Babylonian kings, Persian governors and one very disappointing Venetian. It's vain, sarcastic and footnotes everything, but it's curious about you because you're new enough to still be surprised. What sets it apart:

- It's **obsessed with modern things**: electric light, telephones, the Ferris Wheel.
- It's **furious about how history books describe it**.
- It **secretly writes the Clarion's sillier filler headlines**.

At the start it is bound to **Cornelia Ashby**, the rival magician in the silk hat who insults you outside the Rookery. She treats it like a coat rack. It wants out.

#### A second familiar slot

Ithzar takes a **second familiar slot**, alongside whatever familiar you've bound yourself. It never replaces your own familiar, and can't be released or replaced in the Workshop the way an ordinary familiar can.

- **Familiar abilities don't stack.** You get each ability at the class of your stronger familiar, and the injury reduction counts once.
- **Either familiar counts as "a spirit at your side"** for city choices.
- Ithzar adds its own extras on top (see *What Ithzar does*).

#### The arc

| Chapter | Starts | What happens |
|---|---|---|
| **1. The watcher** | Ward Magician rank, and either meeting Cornelia in the LaSalle Street streets or April 20, whichever comes first | Signs of an intruder at your doorstep: your chalk rearranged into a rude word, your notes read and corrected. If your scrying glass holds a spirit, it reports "something watching from the chimney." Waiting up for the intruder brings Ithzar out. It insults your chalk work and leaves. |
| **2. Favors** | A few days later, then every few days | Ithzar asks for small, risky favors, delivered at your doorstep or at places tied to running events. Each favor raises a hidden **trust** standing (0–10), and refusing lowers it. It pays in kind: lore, warnings, hints. |
| **3. The leash** | Trust at 5 or more | It asks you to break Cornelia's binding, which it is forbidden to describe. You piece the binding together and perform a **counter-binding** in your chamber. |
| **4. The offer** | 2–4 days after it's freed | It returns to your doorstep with terms. If you accept, it becomes your second familiar. |
| **The call** | After you complete the afrit commission (the seventh) | Ithzar asks you to keep your promise and let it go before you wake the marid. |

**Chapter 2 favors** (first pass):

- **"Hide me for a night."** Needs an empty vessel. Ithzar sleeps in your lantern or glass to escape Cornelia. The trust gain is large.
- **"Galbanum, and don't ask."** Give up one galbanum. It pays you back with lore.
- **"Don't tell City Hall."** During the strike, Ithzar admits Cornelia is the packers' magician.
  - Keeping quiet raises trust.
  - Reporting her pleases the Machine but costs a lot of trust. The arc stalls until trust recovers.
- **A tip before the crackdown.** If your suspicion is climbing, Ithzar warns you a day before the inspectors come. This is passive and only fires when trust is high enough.

**Chapter 3, the counter-binding.** Cornelia's binding is a puzzle target with its own notebook sheet: the circle class she used, her three runes and her incense. You gather clues from:

- a new servant errand, *spy on Cornelia Ashby*
- her notes in the Lake Shore Circle library
- your scrying glass, if it holds a spirit strong enough to look into her workshop
- Ithzar itself, which can't say anything but can wince at the wrong guesses

Then you perform the rite in the chamber. The spirit is "Ithzar (bound to Cornelia Ashby)", with a new clause, ***of Release***, learned in this chapter, plus her runes, her incense and a circle strong enough for a djinni. **You never learn Ithzar's true name:** it insists on speaking its own name inside your circle. If the rite fails, it rebounds on you (injury) and Cornelia notices (trust and suspicion effects). If it succeeds, Ithzar is free, and vanishes.

**Chapter 4, the terms.** You accept all three or refuse:

1. **You never speak its true name in a summons.** It comes and goes as it pleases, so it is occasionally away for a day.
2. **It keeps one secret.** A story hook for later; no mechanic.
3. **"One day I'll ask you to let me go. When I do, you will."** Open-ended on purpose; it's called in late in the game.

Refusing sends it away. It makes the offer once more about a week later.

**The call.** After the afrit commission, with the marid in view, Ithzar asks to leave before you wake the thing under the lake; it was there the last time someone tried. You let it go. As a parting gift it gives you one of the marid's missing syllables and a last footnote. You face the marid without it: no extra abilities, no heckling through the hardest summoning in the game. The ending's epilogue acknowledges it.

#### What Ithzar does

1. **The voice.** It comments on nearly everything, with footnotes:
   - summonings, especially failures, broken bindings and wrong-name accidents
   - districts you visit, and Clarion headlines
   - your servants and your other familiar

   Roughly 60–80 lines, keyed to triggers. This is what makes the game feel like the books.
2. **"Ask Ithzar."** Once a day you can ask it about any spirit you know, and it adds a notebook fact. At low trust it sometimes lies: facts from Ithzar are marked "Ithzar says…" in the notebook until the chamber confirms them.
3. **A favor a week.** At high trust it will run one errand a week, despite familiars never running errands. It's framed as a personal favor and costs a little trust.
4. **Banter with your other familiar.** When both familiars are with you in the city, a city action has about a 1-in-4 chance (at most once per district per day) of setting off a short exchange between them. It appears in the result and in the chronicle. Lines are keyed to your other familiar: specific lines for each spirit, falling back to lines for its class. Some lines also react to the district or to a running event. Ithzar condescends to imps, needles foliots, competes with djinn, and goes quiet around anything bigger. For example:
   - *Ithzar:* "Your imp is eating the wallpaper." *Nibbet:* "It started it."
   - *Querrin:* "Message for the djinni." *Ithzar:* "If it's from you, I've already read it."
5. **The endgame.** It knows Shem-Ashara, and its parting gift at the call is one of the marid's syllables.

**Trust** is a hidden standing like the others. The Workshop describes it in words ("It tolerates you", "It's starting to like you, against its better judgment").

#### Build plan

- **Part A:** Ithzar's data, the second familiar slot, the commentary system and banter, chapters 1 and 2.
- **Part B:** Cornelia's binding as a notebook puzzle, the clause *of Release*, the *spy on Cornelia* errand, chapters 3 and 4, "Ask Ithzar" and the weekly favor.
- **Part C:** the call and the ending's epilogue.

#### Deferred: dark paths

Not in this step, but the arc is shaped to allow them later:

- **Forced binding.** In chapter 3, keep Ithzar's name and bind it by force instead of freeing it. It works, but it hates you, its commentary turns poisonous, and it sabotages you once at the worst moment.
- **Refusing the call.** Break your promise and keep Ithzar for the marid. It stays, bitterly, as the forced-familiar version.

---

## Open questions

- **Balance.** Economy and pacing haven't been tested in real play. The wheat tips on LaSalle Street come out slightly in the player's favor on average, and removing languages took away money sinks of $335 in total (vessels and reinforcing them add new ones). The scrying glass and pocket watch may be too strong; they're the first things to tune.
- **Cost of guessing names.** Each attempt costs an hour and an incense. Is that the right price, or should testing a name be cheaper but riskier?
- **Rival magicians and the Machine.** Should rivals raid your workshop and try to steal your vessels? Wards could be a sixth vessel, or part of step 3.
- **Rune positions.** The circle has three rune slots, but position doesn't matter yet. Placing runes at specific points is a candidate for deepening the lab puzzle later.
- **Repeat visits.** What should happen after a spirit is bound once? Should rebinding get easier, and do spirits remember how you treated them?
- **More events.** Only five events exist, and all but the crackdown happen once. Candidates: the Sanitary Canal (the plan to reverse the river) tied to the marid, the Fair's closing in October, rival magicians targeting your workshop, and a second round of labor trouble.
- **Event pacing.** The strike and the election overlap in mid-April, which may be too much at once for a new player.
- **Ithzar's absences.** Is "occasionally away for a day" a fun cost of its first term, or just annoying? The fallback is to make the term pure flavor.
- **Cornelia after the release.** Does she become a recurring rival who comes after your workshop once she knows you freed her djinni?

## Content conventions

- All content is data:
  - `js/data.js`: spirits, lore, materials, errands, commissions
  - `js/districts.js`: districts, places and street encounters (the effect format is documented at the top)
  - `js/events.js`: the calendar, the newspaper and current events
- **Lore fragments** need `facts` (the formats are documented above `DEMONS`). Their prose must agree with their facts, and every syllable fact must appear in the text as `[SYL]`.
- **Spirits:** a name length of class + 1, no repeated syllables, no two spirits with the same name, exactly one liked and one hated incense.
- **Tone:** dry, period-flavored, funny. Each spirit gets an appearance, a greeting and a footnote. Use American spelling.
