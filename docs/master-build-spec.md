# Ankita Birthday Website — Consolidated Build Specification v1.1

**Baseline:** Ankita Birthday Website: Master Build Spec (v1)  
**Status:** Original v1 preserved; approved additions are identified below.

## 1. Approved configuration

- Birth-year passcode: `2002`
- Entry gate: required; no skip button.
- Welcome character: actual 3D character with body movement.
- Cake photo ring: approved; circular 3D orbit of Ankita's photos around the cake.
- Preserve original Hero's 25-photo ring and wave tail.
- Preserve the original gold `23`, 23 candles, and six-page album.
- The birth-year screen is a playful client-side gate, not secure authentication.

## 2. End-to-end flow

```text
Secret Birthday Gift — birth-year passcode
  ├─ Wrong year → error + Try Again
  └─ Correct year → 3D cartoon dance
       ↓
Birthday question card
  “I have made something for you”
  “Do you wanna see it?”
  ├─ First NO → sad reaction + playful follow-up
  ├─ Further NO → button flips/dodges
  └─ YES → happy reaction
       ↓
Original Memory Loader (F1)
  → Original 3D Hero (F2)
  → Memories Gallery Wave (F3)
  → Incoming Video Call (F4)
  → Accepted call + Birthday Reel
  → 3D Memory Album (F5)
  → 23 Candles + Cake Photo Orbit + Letter (F6 + addition)
  → Footer + Replay (F7)
```

The new welcome experience is inserted before the original Loader. All original v1 sections remain.

## 3. Approved addition A1 — Secret Birthday Gift passcode

**Design**
- Heading: `Secret Birthday Gift`, with “Birthday Gift” accented red.
- Reference-inspired split card: cartoon illustration left, passcode form right.
- Cream vertical stripes on the illustration side; muted purple passcode panel; rounded corners.
- After the welcome flow, return to the original dark-and-warm-gold visual language.

**Behavior**
- Ask Ankita to enter birth year `2002`.
- Wrong input: error message and `Try Again`; allow retry.
- Correct input: transition to 3D character dance.
- Support mobile numeric keypad and keyboard.
- Store the year in `content/site.ts`, not scattered through components.
- Do not represent this as secure authentication.

## 4. Approved addition A2 — 3D cartoon welcome and question

**Required character states**
- Idle
- Happy dance
- Sad/disappointed
- Happy/celebratory

Use a real 3D model or compatible rigged model with animation—not static images pretending to be 3D. Actual model and animation assets are not yet supplied and must be sourced or created.

**Question copy**
- `I have made something for you`
- `Do you wanna see it?`
- Buttons: `YES` and `NO`

**Interaction**
1. First NO: sad expression/pose and playful follow-up message.
2. Subsequent NO attempts: button flips, hops, or dodges away and becomes difficult to click.
3. YES remains usable at all times.
4. YES triggers a happy reaction, then starts the original Memory Loader.

**Accessibility/fallback**
- Reduced-motion mode disables aggressive dodging and uses a static NO button with playful text.
- Buttons are keyboard-focusable and labelled.
- If WebGL/3D is unavailable, a 2D fallback preserves the same flow.

## 5. Approved addition A3 — Cake photo orbit

- Add a circular 3D ring of Ankita's photos orbiting around the birthday cake.
- Preserve 23 candles, the blow-out interaction, confetti, and letter reveal.
- This cake ring is separate from the Hero's original 25-photo ring.
- Use local supplied photos; no automatic upload or third-party photo hosting.
- Tune photo count, orbit speed, radius, and arrangement during implementation.

## 6. Preserved original features

### F1 — Memory Loader
- Cream Polaroid develops from blurry to sharp.
- Gold counter `00 → 23`, minimum duration 2.5 seconds tied to asset loading.
- Captions: `DEVELOPING MEMORIES`, `ALMOST THERE`, `READY`.
- Polaroid scales/fades; curtain slides up.
- Loader now follows the new passcode and welcome screens.

### F2 — Main 3D Hero
- Dark `#0a0810` background with soft vignette; no stars or space imagery.
- 25 Polaroids scattered in 3D.
- Finger/cursor torch reveals photos/title through a circular mask; idle torch drifts in a figure-eight.
- Scroll locked until ignition.
- Hold-to-ignite: 1.8-second fill, 0.8-second drain; Space/Enter fallback.
- Ignited state: front ring, wave tail, back ring, thick gold 3D `23`, warm halo, shockwave, flash/camera kick, chime, line-by-line text reveal, parallax, countdown, scroll cue.
- No star-like particles or floating gold dust.

### F3 — Memories Gallery Wave
- Reuse the same 25 photo meshes/textures.
- Scroll morphs the ring into a 3D wave ribbon.
- Tap photo to bring it forward, dim others, and show caption; tap to return.
- Transition line: `That was the highlight reel. Wait... is that your phone ringing?` Cue: `Pick up`.

### F4 — WhatsApp-style incoming video call
- Caller: `07 `; never “Mahi” or “MSD” before the reel.
- Incoming screen, round profile photo, ringtone, two 3D circular controls.
- Decline always dodges and never works; taunts change. Accept always works.
- Accept shrinks profile photo into a corner window and plays the reel full-screen with sound.
- Include timer, `End-to-end encrypted`, `A special message, just for you`, and bottom controls.
- Camera only after explicit browser permission. If denied/unavailable after 6 seconds, use profile photo fallback.
- Stop camera tracks when call/section ends.
- Call-ended card: `Watch again` and `Open the album`; album action unlocks and scrolls to it.

### F5 — 3D Memory Album
- 3D gold cover opens; six pages flip with photos and handwritten-style captions.
- Placeholder captions: `Our first hello`, `That chai night`, `Pure chaos`, `Golden hour`, `Road trip`, `Always us`.
- Final page: `Thank you for being you.` with `Make a wish`.

### F6 — Candles and letter
- Heading `Make a wish.`; subtext `Then blow out the candles.`
- 23 candles; `Blow the candles` button and optional `or blow into your mic`.
- Button blow-out always works; microphone requires permission.
- Confetti is plain small rectangles only—no stars or hearts.
- Letter title: `A little note for you`.
- Preserve sample until replaced:
  > Dear Ankita, 23 suits you. May this year bring you closer to everything you are chasing. Thank you for being the kind of person people are lucky to know.
- Sign-off: `- [Owner name]` until supplied.
- Add the approved cake photo orbit without removing existing interactions.

### F7 — Footer
- `Made with love by [Owner name]`
- `Happy Birthday, Ankita`
- `Replay` resets the entire flow, including passcode/welcome, Hero, call, album, and candles.

### F8 — Global UI and sound
- Preserve top-left tag, sound toggle, sound effects, and scroll gates.
- All visible copy stays configurable in `content/site.ts`.

### F9 — Quality layer
- Mobile-first; target 55–60 FPS on a mid-range Android.
- Renderer pixel ratio capped at 1.5.
- Hero/gallery photo textures 512–768px; album/zoom 1024px; WebP, mipmaps, texture reuse.
- Aim for total assets under 25 MB.
- Pause off-screen canvases; dispose GPU resources on unmount; avoid per-frame allocations.
- If frame time remains high for 2 seconds, drop pixel ratio to 1 and disable postprocessing.
- Use `100dvh`, safe-area insets, and `playsInline` for iOS video.
- Test Android Chrome and iPhone Safari.
- Support reduced motion, keyboard controls, accessible labels/alt text, and AA contrast.
- WebGL/weak-device fallback preserves the same flow in 2D.

## 7. Non-negotiable design, privacy, and behavior

**Visual**
- No stars, galaxy, space, universe, constellation, night-sky concept, star-shaped particles, twinkling dots, moon, planets, nebula, or “cosmic” copy.
- Original experience backgrounds: plain dark `#0a0810` with soft vignette.
- Confetti: plain small rectangles only.
- New opening may use reference-inspired pastel split card; then return to original dark-and-gold design.

**Behavior**
- Incoming-call Decline never works; Accept always works.
- Welcome NO may dodge after the first sad reaction, but YES must always remain available.
- Provide keyboard/touch-accessible paths.
- Passcode is a playful client-side gate, not secure authentication.

**Privacy**
- `noindex, nofollow` meta and `X-Robots-Tag: noindex`; no sitemap.
- No analytics, tracking scripts, or third-party requests; self-host fonts with `next/font`.
- Camera/mic only after explicit permission; streams stay on-device, are never recorded/uploaded, and are stopped when done.
- Keep link private/unlisted; do not put real name or birthday in URL; use a random slug if needed.
- No external photo uploads.

## 8. Assets and content needed

- 25 gallery photos `01.webp`–`25.webp`, portrait crop around 4:5, at least 1024px on long side.
- Incoming-call profile photo.
- Birthday reel and poster/fallback.
- Six album photos and captions.
- Final personal letter and owner sign-off.
- 3D cartoon model and animation clips: idle, happy dance, sad/disappointed, happy celebration.
- Optional self-hosted sound effects/chime and ringtone.
- Cake photo ring images (may reuse the 25 photos).
- Keep copy/configuration including birth year `2002` in `content/site.ts`.

Do not invent personal photos, captions, reel, letter, or owner name; use marked placeholders until supplied.

## 9. Suggested architecture

Preserve Next.js + TypeScript, React Three Fiber + Three.js, GSAP, Lenis, and `content/site.ts`.

Suggested new components:
- `BirthYearGate`
- `WelcomeCharacterScene`
- `BirthdayQuestionCard`
- `CakePhotoOrbit`

Suggested state flow:
`gate → welcomeDance → question → sadReaction / dodgeNo → happyReaction → loader → heroDark → heroIgnited → gallery → incomingCall → reel → callEnded → album → candlesLetter → footer`

Replay returns to `gate`.

## 10. Build plan

One step at a time; test and fix each step before continuing.

1. Review project/content structure; preserve `content/site.ts`.
2. Implement birth-year gate (`2002`), wrong-year retry, keyboard and mobile input.
3. Implement 3D welcome character, question, NO sad/dodge sequence, YES happy reaction, 2D/reduced-motion fallbacks.
4. Implement original Loader; verify 2.5-second minimum and counter.
5. Implement Hero dark state and torch reveal.
6. Implement hold-to-ignite and verify full 3D Hero.
7. Implement Gallery morph, zoom, captions, and transition.
8. Implement incoming call, runaway Decline, Accept, reel, permission-gated camera, and call-ended card.
9. Implement 3D album and six pages.
10. Implement candles, blow-out controls, cake photo orbit, confetti, and letter.
11. Implement footer, sound controls, replay, and scroll gates.
12. Polish performance, accessibility, mobile safe areas, reduced motion, and WebGL fallback.
13. Replace placeholders with supplied assets, run QA, deploy to Vercel, and verify `noindex`.

## 11. Definition of done

**Opening**
- [ ] `Secret Birthday Gift` split-card entry screen appears.
- [ ] `2002` succeeds; wrong year shows error and Try Again.
- [ ] Correct year triggers real 3D happy dance.
- [ ] Question copy and YES/NO buttons match approved flow.
- [ ] First NO triggers sad reaction and playful follow-up.
- [ ] Further NO attempts dodge/flip; YES remains usable.
- [ ] YES triggers happy reaction and opens original Loader.
- [ ] Reduced-motion and no-WebGL fallbacks preserve flow.

**Original site**
- [ ] Loader runs at least 2.5s; counter 00 to 23; curtain lifts.
- [ ] Hero locked until ignition; touch, mouse, keyboard work.
- [ ] Hero has front ring, tail, back ring, gold 23, halo, shockwave, flash, chime, text reveal, countdown, scroll cue.
- [ ] Gallery morphs from same photos; zoom, caption, dim, return work.
- [ ] Incoming call uses `Your Favourite Person`; Decline always dodges; Accept works.
- [ ] Reel, timer, labels, controls, camera fallback, and call-end actions work.
- [ ] Album opens in 3D; all six pages flip.
- [ ] 23 candles blow out by button; optional mic path works with permission.
- [ ] Cake photo orbit is present.
- [ ] Letter types out; footer and Replay work.
- [ ] Sound toggle and top-left tag work.

**Rules and quality**
- [ ] No prohibited star/space visuals or copy.
- [ ] No “Mahi” or “MSD” before the reel.
- [ ] No analytics, trackers, unauthorized camera/mic, recording, or upload.
- [ ] `noindex` verified; no external requests.
- [ ] Mobile performance, reduced motion, keyboard accessibility, and WebGL fallback tested.
- [ ] All visible copy comes from `content/site.ts`.
- [ ] Android Chrome and iPhone Safari tested; deployed link verified.

## 12. Preserved out-of-scope items

The original v1 says not to build these unless separately approved later: villa/room walkthrough, cricket mini-game, stadium reveal, jersey flip, scratch card, torch-mode house, “Wrapped” stats, “Open when” letters, fake WhatsApp chat, voice wish, hidden Easter egg, birthday selfie button. The additions in this document do not authorize these items.

## 13. Change log

- **Preserved:** Original F1–F9, design rules, privacy, performance/accessibility, and step-by-step build discipline.
- **Approved:** Required birth-year passcode `2002`.
- **Approved:** Reference-inspired Secret Birthday Gift split-card entry.
- **Approved:** 3D cartoon welcome dance and YES/NO interaction, sad reaction, dodging NO.
- **Approved:** 3D circular photo orbit around the cake.
- **Still needed:** Cartoon model/animation assets, real photos, profile photo, reel, captions, final letter, owner sign-off, and sound assets.
