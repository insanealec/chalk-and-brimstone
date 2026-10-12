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

Lore is designed so that reading everything about a spirit leaves **zero to two syllables** to find by experiment. Querrin's last syllable is deduced; Phebbet needs one test to settle the order of two known syllables.

**The marid is the exception.** Its lore gives only four of its six syllables, and warns: "It hears its name even half-spoken… DO NOT GUESS." A name for the marid with at least four syllables in the right place, but not all six, summons it angry and unbound. With an obsidian pentacle that costs 3 health; without one it costs 11, which is fatal. The two missing syllables come from Ithzar's parting gift, the Great Canal survey, asking Ithzar, or a scrying glass holding an afrit. The alternative is guessing behind an obsidian pentacle.

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

There's a chain of eight commissions, alternating "bind a spirit of class X" with "send a servant on errand X". When a binding commission comes up, City Hall sends a *file*: one lore fragment on a suitable spirit of that class (Querrin for the foliot, Azrimel for the djinni, Ulgaroth's runes for the afrit, and the marid's warning). Reputation raises your rank: Apprentice → Ward Magician → Alderman → Commissioner → Boss. Rank gates market goods, districts and how many spirits you can hold. The last commission is binding the marid.

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
| The Great Canal | Once the Stolen Seal is recovered | Surveyors sounding the lake bed for the river-reversal canal. For ten days, their soundings at the Water Crib ($10) reveal one of the marid's missing syllables. |
| The Infanta's Visit | May 10 | A Spanish princess tours the Midway. For six days, a djinni-class servant can put on a spectacle on the Great Wheel ($60, reputation, Machine favor), or you can watch the procession for gossip. (Historically she came in June.) |

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

### Step 4: Ithzar, the earned companion ✅

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

**Ithzar hangs around from chapter 2.** Once you've met it, Ithzar starts visiting even though it still belongs to Cornelia. It remarks on your summonings "from the chimney", tags along in the city, and banters with your familiar if you have one. It gives no familiar abilities until it actually joins you in chapter 4. This way its voice is part of the game long before the offer.

**Chapter 2 favors** (built; content in `js/ithzar.js`):

- **"Hide me for a night."** At your doorstep, two days after you meet it. Hiding it in an empty vessel gives +2 trust, the coal scuttle +1, and sending it away −1.
- **"Sandalwood, and don't ask."** Three days later. Burning a stick of sandalwood for it gives +1 trust and lore one class above your rank; refusing gives −1. (Galbanum in the first draft, but galbanum isn't on sale until Alderman.)
- **"Don't tell City Hall."** Two days later, behind the packinghouses, Ithzar admits Cornelia is the packers' magician.
  - Keeping quiet gives +2 trust.
  - Reporting her pays $20 and pleases the Machine (+2) but costs 3 trust. The arc stalls until trust recovers.

Each favor waits a few days and then expires, which costs 1 trust. Playing every favor the friendly way reaches trust 5, the threshold for chapter 3.
- **A tip before the crackdown.** At dawn, if trust is 3 or more and police suspicion reaches 4 (the crackdown starts at 6), Ithzar warns you once. The warning resets when suspicion falls back below 4.

**Chapter 3, the counter-binding** (built). It starts once all three favors are settled and trust is 5 or more. Ithzar asks for help and teaches you the Clause ***of Release***. Cornelia's binding is a puzzle target with its own notebook sheet: a circle that holds djinn, three runes (Stone, Moon and Flame) and her incense (wormwood). The sheet deduces by elimination like a spirit's. You gather clues from:

- a servant errand, *spy on Cornelia Ashby* (difficulty 2), available only during chapter 3; each success reveals a rune or her incense
- her notes in the Lake Shore Circle's committee room (every other day; 70% a clue, 30% the doorman throws you out, costing 1 health and raising suspicion)
- your scrying glass, if it holds a foliot or stronger: one clue each dawn
- naming runes at Ithzar on your doorstep (once a day): it can't say anything, but it relaxes at a rune she didn't use
- failed rites, which show which runes caught

Then you perform the rite in the chamber: choose "Ithzar (release from Cornelia)" as the spirit and set out her circle, runes and incense. There are no syllables to fill in: **you never learn Ithzar's true name**, because it insists on speaking its own name inside your circle. A failed rite rebounds for 2 damage, which your protections can reduce, and raises police suspicion by 1, since Cornelia feels it. A successful rite frees Ithzar, and it vanishes.

**Chapter 4, the terms.** You accept all three or refuse:

1. **You never speak its true name in a summons.** It comes and goes as it pleases, so it is occasionally away for a day.
2. **It keeps one secret.** A story hook for later; no mechanic.
3. **"One day I'll ask you to let me go. When I do, you will."** Open-ended on purpose; it's called in late in the game.

The offer comes three days after the release and waits five days. Refusing, or letting it lapse, sends Ithzar away. It makes the offer once more a week later; refuse that too and it's gone for good. Once accepted, Ithzar is **away about one day in seven**: that day it gives no abilities, no remarks and no favors.

**The call** (built). After the afrit commission, once Ithzar has been your familiar for at least a week, and when the marid is genuinely next (you own the obsidian circle, or two weeks have passed since it joined), Ithzar waits on your stairs with its hat on and asks to leave before you wake the thing under the lake; it was there the last time someone tried. The request stands for three days:
- **Let it go:** a proper goodbye. As a parting gift it writes whichever of the marid's syllables you're still missing into the notebook, which also puts Shem-Ashara in your journal. It leaves with a last footnote.
- **Ask it to stay:** it says no, gently, and gives you another day.
- **Avoid it for three days:** it lets itself go, without the gift.

Either way, you face the marid without it: no extra abilities, and no heckling through the hardest summoning in the game.

**The epilogue.** The victory screen ends with a line about Ithzar, depending on how things stood: you kept your promise, it left on its own, you refused its terms twice, it was still Cornelia's, or (if you somehow win before the call) it was still at your side. Players who never met Ithzar get no epilogue line.

#### What Ithzar does

1. **The voice.** It comments on nearly everything, with footnotes:
   - summonings, especially failures, broken bindings and wrong-name accidents
   - districts you visit, and Clarion headlines
   - your servants and your other familiar

   Roughly 60–80 lines, keyed to triggers. This is what makes the game feel like the books.
2. **"Ask Ithzar"** (built). Once a day, from a spirit's notebook in the chamber, you can ask Ithzar about it. Its answers aren't added as facts. They're listed under "Ithzar says" until the chamber settles them: confirmed claims disappear, and lies are struck through and marked. It lies 40% of the time below trust 5, 10% at 5–7, and never at 8 or more.
3. **A favor a week** (built). At trust 6 or more you can pick an errand for Ithzar in the Servants tab. It runs that night as a firmly bound djinni, costs 1 trust, and can't be asked again for seven days.
4. **Banter with your other familiar.** When both familiars are with you in the city, a city action has about a 1-in-4 chance (at most once per district per day) of setting off a short exchange between them. It appears in the result and in the chronicle. Lines are keyed to your other familiar: specific lines for each spirit, falling back to lines for its class. Some lines also react to the district or to a running event. Ithzar condescends to imps, needles foliots, competes with djinn, and goes quiet around anything bigger. For example:
   - *Ithzar:* "Your imp is eating the wallpaper." *Nibbet:* "It started it."
   - *Querrin:* "Message for the djinni." *Ithzar:* "If it's from you, I've already read it."
5. **The endgame.** It knows Shem-Ashara, and its parting gift at the call is one of the marid's syllables.

**Trust** is a hidden standing like the others. The Workshop describes it in words ("Ithzar tolerates you", "likes you, against its better judgment"). Spending an evening talking with Ithzar on your doorstep raises it by 1, every three days at most, so a stalled arc can recover.

#### Build plan

- **Part A ✅:** Ithzar's data, the second familiar slot (abilities at the stronger familiar, Ithzar's voice for warnings once joined), remarks on summonings, districts and headlines, banter, morning notes, chapters 1 and 2, the crackdown tip, and Ithzar's card in the Workshop showing trust in words. Cornelia is now named in the LaSalle Street rival encounter, and meeting her there can start chapter 1 early.
- **Part B ✅:** Cornelia's binding as a notebook puzzle, the clause *of Release*, the *spy on Cornelia* errand, the doorstep conversation and wincing, chapters 3 and 4 with the second offer, Ithzar's days away, "Ask Ithzar" with lies, and the weekly favor.
- **Part C ✅:** the call, the parting gift, and the epilogue.

#### Deferred: dark paths

Not in this step, but the arc is shaped to allow them later:

- **Forced binding.** In chapter 3, keep Ithzar's name and bind it by force instead of freeing it. It works, but it hates you, its commentary turns poisonous, and it sabotages you once at the worst moment.
- **Refusing the call.** Break your promise and keep Ithzar for the marid. It stays, bitterly, as the forced-familiar version.

### Step 5: overreaching ✅

A way to bind a spirit **one class above what your circle can hold**, for a player who has done the lab work and is willing to gamble. The circle stays the reliable path; overreaching is the desperate one.

**The gate is knowledge.** You can only overreach if the binding is otherwise **perfect**:
- the full true name
- every rune it needs, and no wrong ones
- the incense it likes

Knowing a spirit completely is the skill this game tests, so this is the "skill check". The gate checks the **notebook**: the attempt is only offered when everything above is confirmed there and matches the chamber's setup. Notebook facts are always true (Ithzar's unconfirmed claims don't count), so a notebook-perfect binding is actually perfect. Overreaching is never allowed for the marid, and never more than one class above your circle.

**In the chamber** (built). When the chosen spirit is exactly one class above your circle and the clause is *of Service*, an **Overreach** panel appears just above the summon button. Until the notebook shows a perfect binding, it lists what's still needed. Once it does, you can toggle the attempt, choose which familiars brace the circle, and see the odds and the stakes update live. If the setup stops being perfect while the toggle is on, summoning is blocked until you fix it or turn the toggle off. Without the toggle, a circle that's too weak still simply breaks, as before.

**Then a roll, with the odds shown before you commit.**

| Factor | Effect on the odds |
|---|---|
| Base | 40% |
| Your pentacle could contain the spirit | +15% |
| A familiar braces the circle | +5% imp, +10% foliot, +15% djinni (Ithzar), +20% afrit |
| Most it can reach | 90% |

**Familiars on standby.** Before speaking, you choose which of your familiars brace the circle; your own familiar and Ithzar can both brace. Bracing always costs them something:
- **On success,** a bracing familiar is spent for the rest of the day: no familiar abilities until tomorrow.
- **On failure,** each bracing familiar takes the backlash and is out for as many days as the spirit's class. Ithzar also loses 1 trust ("you dragged me into that").

A resting familiar gives no abilities, can't brace again, doesn't banter, and (for Ithzar) makes no remarks; the Workshop shows the date it's back. Ithzar still gets a remark on an overreach it braced, with lines of its own for a circle that held and one that didn't. Because the bracers are still bracing when a failed overreach hits you, a djinni-class familiar's injury reduction applies to that blow: the familiar takes part of the backlash.

**Success is a strained binding.** It's always uneasy, with half the usual patience (rounded up), and each night there's a 15% chance it breaks loose early and attacks, as an uneasy servant does when its bonds snap. The Servants tab marks it as strained. You have a spirit ahead of schedule, but it's a ticking bomb. Overreaching is service only: vessel and familiar bindings must be firm, so they can't be overreached.

**Failure is spectacular.** The spirit breaks free at full fury: the damage of an outmatched pentacle, whatever your pentacle actually is, plus +2 police suspicion. A loose spirit on Clark Street makes the papers.

**City Hall counts it.** An overreached binding completes a "bind a spirit of class X" commission. You took the risk.

To decide in play: whether the failure damage is too harsh at the djinni tier (7 damage before protections), and whether bracing should ever risk losing a familiar outright.

---

## Playtest findings (October 2026)

From playing the opening by hand and running a scripted player through 16 full games. The script uses only what a player can see: the notebook, the shops and the visible actions.

**Pacing.** Once the script played sensibly, every run won, on May 15–18 (days 43–46). First commission: day 1, within the first hour. Foliot commission: anywhere from day 4 to day 44 (money-bound). Djinni: days 24–37. Afrit: days 40–46. Marid: 2–6 days after the afrit.

**Problems found:**
1. ✅ **The economy can deadlock.** With no servant, no money and no incense, there is no way back: summoning needs incense, incense needs money, and money needs a servant. 2 of 16 runs got stuck this way. *Fixed:* Kinsella's Saloon on Clark Street, where telling fortunes earns a few dollars an hour (about $2.70 on average). It's always open and costs nothing.
2. ✅ **The early money wall is wide and swingy.** The foliot step needs a $30 circle, $33 of runes and sandalwood, starting from $30 and an imp earning about $7 a night. *Fixed:* City Hall's file for the foliot points you at Querrin, whose runes you start with, and the Salt-and-Iron Ring costs $25. The foliot now usually lands by day 5–6, and day 24 at worst in 8 games.
3. ✅ **Ithzar's companionship is too short.** It joins and is called away within 1–5 days, because its help makes the afrit commission come quickly. *Fixed:* the call waits at least 7 days after joining, and until you own the obsidian circle or 14 days have passed. Ithzar now stays 9–12 days.
4. ✅ **The finale has no tension.** Lore gives five of the marid's six syllables and Ithzar's gift gives the sixth, so the name is complete before you start, and no run needed the obsidian pentacle. *Fixed:* the marid answers near misses (see *The notebook*). Lore gives four syllables, not five, so its name has to be assembled from the gift, the canal survey and Ithzar's answers, or guessed behind an obsidian pentacle.
5. ✅ **Servant expiry can kill without warning.** The "bonds will snap tonight" warning only appears on the Servants tab. 1 run died on April 10 this way. *Fixed:* the chronicle warns at dawn about any servant whose service ends that night (in red if its bonds will snap), and the Servants tab shows a red "!" when bonds will snap.
6. ✅ **The calendar's content ends early.** Wins land in mid-May, so the World's Fair has barely opened and nothing is scheduled after it. *Fixed:* the Great Canal and the Infanta's visit fill May, and wins now land around May 20–23 (6 of 8 scripted games, with the other 2 stalling on the script's own mistakes).

**Friction in the interface:**
- ✅ The notebook recorded where a syllable is *not*, but never showed it: "belongs in the name, but not there" was stored, yet the sheet only said "also in it: ITH". *Fixed:* the sheet now says "also in it: SAR (not 1st, 2nd)", and a slot holding a syllable the notebook knows is wrong there is struck through in red.
- The chamber prefills known syllables, but not the runes or incense the notebook already knows. A "use what the notebook knows" button would remove busywork.
- Seven tabs crowd narrow screens.

**Code cleanup:**
- `js/game.js` is about 2,400 lines mixing state, rules, rendering and input. Split it into a few files (state and rules, chamber, city, views) in the same plain-script style.
- Game logic calls `render()` and touches the DOM directly, so it can't run outside a browser. Separating rules from rendering would allow fast automated balance runs.
- The scripted player found real bugs, so it should live in the repo as a dev tool, with a seedable random number generator so balance changes can be compared run to run.
- Saves have no version number. Every format change bumps the key and wipes saves. Add a `version` field and small migrations.
- `js/ithzar.js` adds to other files' data (district actions, `CLAUSES`, `ERRANDS`). It works, but a reader of `districts.js` can't see those actions.
- ✅ The chronicle stamps entries "D12" and says "Night falls on day 12", while everything else uses calendar dates. *Fixed:* entries are stamped with the date ("Apr 14").
- ✅ The `--muted` color in `css/style.css` is unused. *Removed.*

---

## Open questions

- **Balance.** Economy and pacing haven't been tested in real play. The wheat tips on LaSalle Street come out slightly in the player's favor on average, and removing languages took away money sinks of $335 in total (vessels and reinforcing them add new ones). The scrying glass and pocket watch may be too strong; they're the first things to tune.
- **Cost of guessing names.** Each attempt costs an hour and an incense. Is that the right price, or should testing a name be cheaper but riskier?
- **Rival magicians and the Machine.** Should rivals raid your workshop and try to steal your vessels? Wards could be a sixth vessel, or part of step 3.
- **Rune positions.** The circle has three rune slots, but position doesn't matter yet. Placing runes at specific points is a candidate for deepening the lab puzzle later.
- **Repeat visits.** What should happen after a spirit is bound once? Should rebinding get easier, and do spirits remember how you treated them?
- **More events.** Only five events exist, and all but the crackdown happen once. Candidates: the Sanitary Canal (the plan to reverse the river) tied to the marid, the Fair's closing in October, rival magicians targeting your workshop, and a second round of labor trouble.
- **Event pacing.** The strike and the election overlap in mid-April, which may be too much at once for a new player.
- **Ithzar's absences.** Built as one day in seven. Is that a fun cost of its first term, or just annoying? The fallback is to make the term pure flavor.
- **Chapter 3 gating.** The rite needs a circle that holds djinn (the Silver-Inlaid Circle, Alderman rank) and the Moon and Flame runes. Trust 5 may come before Alderman, in which case chapter 3 waits on rank. Watch whether that feels like a wall.
- **Cornelia after the release.** Does she become a recurring rival who comes after your workshop once she knows you freed her djinni?

## Content conventions

- All content is data:
  - `js/data.js`: spirits, lore, materials, errands, commissions
  - `js/districts.js`: districts, places and street encounters (the effect format is documented at the top)
  - `js/events.js`: the calendar, the newspaper and current events
  - `js/ithzar.js`: Ithzar's lines, banter and story arc (its chapters are events appended to `EVENTS`)
- **Lore fragments** need `facts` (the formats are documented above `DEMONS`). Their prose must agree with their facts, and every syllable fact must appear in the text as `[SYL]`.
- **Spirits:** a name length of class + 1, no repeated syllables, no two spirits with the same name, exactly one liked and one hated incense.
- **Tone:** dry, period-flavored, funny. Each spirit gets an appearance, a greeting and a footnote. Use American spelling.
