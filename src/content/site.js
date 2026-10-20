export const site = {
  birthYear: "2002", // playful gate, not real security

  gate: {
    title: "Secret",
    titleAccent: "Birthday Gift",
    prompt: "Enter your birth year",
    placeholder: "YYYY",
    button: "Unlock",
    error: "Oops! That's not the right year.",
    retry: "Try Again",
    hint: "Psst... only the birthday girl knows the answer.",
  },

  welcome: {
    line1: "I have made something for you",
    line2: "Do you wanna see it?",
    yes: "YES",
    no: "NO",
    sadReply: "Awww... really? 🥺 Please say yes?",
    dodgeReplies: [
      "Nope, can't catch me!",
      "Too slow!",
      "Just press YES, it's easier",
      "Hehe, the NO button ran away",
    ],
    reducedMotionNo: "Still NO? Okay, I'll keep asking... 😄",
    happyReply: "Yayyy! 🎉 Let's go!",
  },

  loader: {
    minDurationMs: 2500,
    captions: ["DEVELOPING MEMORIES", "ALMOST THERE", "READY"],
    finalCount: 24, // counter 00 -> 24
  },

  meta: {
    title: "A Birthday Surprise",
    description: "A private birthday surprise.",
  },

  hero: {
    photoCount: 22, // number of photos in the hero ring (public/photos/01..)
    title: "Happy Birthday",
    subtitle: "Ankita",
    hint: "Move your finger or cursor to light up the memories",
    holdLabel: "HOLD",
    holdHint: "Hold the button (or Space / Enter) to ignite",
    // PLACEHOLDER lines: replace with your own words
    lines: [
      "Today is all yours.",
      "Twenty-four looks good on you.",
      "Scroll down, there is more.",
    ],
    countdownLabel: "Until the next birthday",
    countdownToday: "Today is the day",
    birthday: { month: 11, day: 9 }, // 9 November
    scrollCue: "SCROLL",
  },

  gallery: {
    hint: "Tap a memory to bring it closer",
    backHint: "Tap again to put it back",
    // PLACEHOLDER captions: replace with your own
    captions: Array.from(
      { length: 25 },
      (_, i) => `Caption ${String(i + 1).padStart(2, "0")} (placeholder)`
    ),
    transitionLine: "That was the highlight reel. Wait... is that your phone ringing?",
    pickUp: "Pick up",
  },

  call: {
    callerName: "07",
    incomingLabel: "Incoming video call...",
    accept: "Accept",
    decline: "Decline",
    declineAria: "Decline (it will run away)",
    // PLACEHOLDER taunts: replace with your own
    taunts: [
      "Nice try!",
      "Nope, not happening.",
      "That button is shy today.",
      "Just press the green one.",
      "Too slow!",
    ],
    avatarPlaceholder: "PROFILE PLACEHOLDER",
    encrypted: "End-to-end encrypted",
    specialMessage: "A special message, just for you",
    mute: "Mute",
    unmute: "Unmute",
    cameraOn: "Camera",
    cameraOff: "Camera off",
    end: "End",
    tapToPlay: "Tap to play",
    reelPlaceholder: "Birthday reel placeholder. Add public/call/reel.mp4",
    endedTitle: "Call ended",
    watchAgain: "Watch again",
    openAlbum: "Open the album",
  },

  album: {
    coverTitle: "Memories", // PLACEHOLDER
    coverSub: "Ankita",
    open: "Open the album",
    hintClosed: "Tap the cover to open",
    hintOpen: "Tap a page, or use the buttons, to turn it",
    prev: "Back",
    next: "Next",
    // PLACEHOLDER captions from the spec: replace with your own
    pages: [
      { caption: "Our first hello" },
      { caption: "That chai night" },
      { caption: "Pure chaos" },
      { caption: "Golden hour" },
      { caption: "Road trip" },
      { caption: "Always us" },
    ],
    thanks: "Thank you for being you.",
    wish: "Make a wish",
  },

  candles: {
    count: 24,
    heading: "Make a wish.",
    sub: "Then blow out the candles.",
    blow: "Blow the candles",
    mic: "or blow into your mic",
    micListening: "Listening... blow gently towards your microphone",
    micDenied: "Microphone not available. Please use the button.",
  },

  letter: {
    title: "A little note for you",
    // sample text from the spec (24 instead of 23): replace with your own letter
    text: "Dear Ankita, 24 suits you. May this year bring you closer to everything you are chasing. Thank you for being the kind of person people are lucky to know.",
    signoff: "- Yugant Singh",
  },

  ui: {
    tag: "A Birthday Surprise", // PLACEHOLDER
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
  },

  footer: {
    madeBy: "Made with love by Yugant Singh",
    happy: "Happy Birthday, Ankita",
    replay: "Replay",
  },
};