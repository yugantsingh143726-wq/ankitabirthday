export const site = {
  birthYear: "2002", // playful gate hai, real security nahi
  gate: {
    title: "Secret",
    titleAccent: "Birthday Gift",
    prompt: "Enter your birth year",
    placeholder: "YYYY",
    button: "Unlock",
    error: "Oops! That's not the right year.",
    retry: "Try Again",
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
    temp: "Loader comes in the next step.",
  },
    loader: {
    minDurationMs: 2500,
    captions: ["DEVELOPING MEMORIES", "ALMOST THERE", "READY"],
    finalCount: 23,
  },
  meta: {
    title: "A Birthday Surprise",
    description: "A private birthday surprise.",
  },

     hero: {
    photoCount: 22,
    title: "Happy Birthday",
    subtitle: "Ankita",
    hint: "Move your finger or cursor to light up the memories",
    holdLabel: "HOLD",
    holdHint: "Hold the button (or Space / Enter) to ignite",
    // PLACEHOLDER lines: replace with your own words
    lines: [
      "Today is all yours.",
      "Twenty-three looks good on you.",
      "Scroll down, there is more.",
    ],
    countdownLabel: "Until the next birthday",
    countdownToday: "Today is the day",
    // PLACEHOLDER: replace with the real birthday month/day
     birthday: { month: 11, day: 9 },
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
    callerName: "Your Favourite Person",
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
};