// The last summoning: you row out to the Water Crib after dark and call the marid up out of Lake Michigan.
// Text only. The rules are the ordinary binding rules; js/engine/finale.js turns a summoning into these beats.
// {name}, {circle}, {rune}, {incense}, {form}, {need}, {have} and {date} are filled in.

const FINALE = {
  title: 'The Water Crib',
  rowing: 'You hire the supply boat after dark. The oarsman takes your money without looking at your chalk box, and does not speak once in two miles. The Crib’s lamp is the only light on the lake, and around it the water is flat as poured iron.',

  rowingAgain: [
    'The same oarsman rows you out again. He has started charging extra, and you have stopped arguing.',
    'Another night, another two miles of black water. The engineer has left the pump room unlocked for you.',
    'You row out again. The Crib’s lamp is lit, the water is flat, and the oarsman has brought a flask he does not offer you.',
  ],

  // who is in the boat with you
  familiar: {
    1: '{name} rides in the bow, pretending it is not afraid of the water.',
    2: '{name} rides in the bow and watches the lake the whole way out, which it has never done for anything else.',
    3: '{name} rides in the bow with its fire banked low, the way a cat flattens its ears.',
    4: 'The boat rides low with {name} in the bow. The oarsman does not look round.',
  },
  ithzar: {
    with: 'Ithzar sits in the stern with its hat pulled down. It has not said a word since the shore. When you ask, it says, "I was here the last time," and nothing else.',
    away: 'The stern seat is empty. Ithzar said it had business elsewhere tonight, and would not say what. You think the business is being elsewhere.',
    kept: 'The stern seat is empty. Ithzar asked to be gone before this night, and you let it go. You keep looking at the seat anyway.',
    left: 'The stern seat is empty. Ithzar asked to be let go before this night, and when you would not answer, it went anyway.',
    bound: 'A launch lies a quarter mile off with its lamps doused: City Hall’s observers. Cornelia Ashby is aboard. So, in a stovepipe hat, is her djinni, and it is the only one of them watching the water instead of you.',
  },
  // after Ithzar is free: how things stand with Cornelia Ashby (Part D of js/ithzar.js)
  cornelia: {
    truce: 'A launch lies a quarter mile off: City Hall’s observers. Cornelia Ashby is aboard. As you pass she raises one gloved hand, and keeps it raised until you are out of sight.',
    enemy: 'A launch lies a quarter mile off with its lamps doused: City Hall’s observers. Cornelia Ashby is aboard. She has come out two miles on a cold night to watch you drown.',
  },

  // the circle and runes, chalked on the pump room floor
  circle: {
    strong: 'In the pump room you chalk the {circle} on the wet iron floor, all three rings. It takes an hour. The engineer brings you coffee and goes away again without asking what it is for.',
    weak: 'In the pump room you chalk the {circle} on the wet iron floor. By lantern light, two miles from shore, with that under the water, it looks like a child’s drawing.',
  },
  rune: {
    right: 'The {rune} rune takes to the iron and holds.',
    wrong: 'The {rune} rune will not dry. The lake has no use for it.',
    missing: 'There should be {need} runes. You have drawn {have}.',
  },

  // the name: a true syllable gets the line for its place in the name
  syllables: [
    'The Crib’s lamp gutters, though there is no wind.',
    'Below you the pumps stop. The engineer comes to the door, looks at your face, and goes back inside.',
    'In the intake shaft the water begins to rise, without a sound.',
    'The supply boat knocks against the ladder, once, twice, as if something large has passed under it.',
    'Your breath shows in the air. It is May.',
    'The lake says the last syllable with you.',
  ],
  near: 'It is in the name, but not there. The water shivers, and waits.',
  none: 'It means nothing to the lake. The water keeps still.',

  // how it ends
  silence: 'Nothing rises. The lamp steadies, the pumps start up again, and at first light the oarsman rows you back. The {incense} is spent.',
  nearMiss: 'That is not quite its name. It is close enough to wake it, and it does not care to be called wrongly. The shaft overflows, and the water comes for you across the floor.',
  accident: 'Something answers, but not from the lake. {name} climbs out of the intake shaft, soaked and furious at the distance, and wants to know what you are doing out here.',
  rises: 'The intake shaft fills to the brim, and the water does not spill. It stands up. It is {form}.',
  incense: {
    likes: 'You burn the ambergris. The vast shape breathes it in, and for a mile around the Crib the lake goes flat as glass.',
    hates: 'The galbanum smoke reaches it, and the whole lake flinches.',
    neutral: 'It takes no notice of the {incense}.',
  },
  breaks: 'It leans on the circle with the weight of the whole lake behind it, and the chalk goes.',
  holds: {
    firm: 'It leans on the circle with the weight of the whole lake behind it. The chalk holds. It leans harder, and the chalk holds.',
    uneasy: 'It leans on the circle with the weight of the whole lake behind it. The outer ring smokes and blurs, and holds, just.',
  },
  ithzarMeets: '"And you," it says to Ithzar. "I remember you." Ithzar takes off its hat. "Yes," it says. "I was hoping you did not."',
  offer: '"So," says Shem-Ashara. "You have bound me. Your masters will want me in a bottle on the Mayor’s desk, keeping their river honest and their rivals drowned. Or you can say the other words, and I will go back down and sleep, and your city can keep its marsh a while longer. I will remember which you chose. So will they."',
  rowBack: 'Row back',

  // the choice, and the two endings
  bind: 'Bind it for City Hall',
  free: 'Let it go back to sleep',
  bound: 'You speak the last clause. The deep one folds itself down, smaller and smaller, until the whole lake fits inside the obsidian rings, and the rings fit in your hand.',
  freed: 'You speak the words of release over the water. Shem-Ashara goes down without a ripple. After a while, the pumps start again.',
  endings: {
    won: {
      title: 'The Deep One Is Bound',
      text: [
        'On {date}, two miles out on Lake Michigan, you called Shem-Ashara up out of the dark and bound it in obsidian for the Machine.',
        'You are, by any measure, the most powerful magician in Chicago. Which is, of course, precisely when the trouble starts.',
      ],
    },
    freed: {
      title: 'The Deep One Sleeps',
      text: [
        'On {date}, you bound Shem-Ashara at the Water Crib, and then you let it go.',
        'City Hall does not believe that the marid could not be held, and it does not forgive you. Your commissions dry up. Honest Mike Rourke stops saying good morning. But the lake is quiet, and when they reverse the river in 1900, nothing comes up it.',
      ],
    },
  },
};
