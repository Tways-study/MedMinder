# SPEC: MedMinder landing demo (storyline B, "Tuesday Stock Count")

GOAL:   A pharmacist sees that counting a shelf is not the same as checking its dates, and that MedMinder stamps every lot by how close it is to expiring.
OUTPUT: HyperFrames, 1920 x 1080, 30 fps.
TIME:   32 s x 30 = 960 frames. Music is not bundled (see SOUND).
  - counter  0.0-7.5 s   (0-225 f)
  - shelf    7.5-25.0 s  (225-750 f)
  - endcard  25.0-32.0 s (750-960 f)
  (Shot times below are the first draft; the film was tightened by 1 s after the first snapshot review. Payoff re-stamp lands at 22.15 s, 69%.)

LOOK:
- Two worlds, one carrier (the "EXP 11/26" label becoming the white shelf card).
- Counter world: ground #BFCBC3 (sage laminate), front edge band #A9B7AE from y=900, contact shadow rgba(24,24,27,.18) blur 24 offset 12. Sheet #FFFFFF on a hardboard #8A6B4A clipboard, steel clip #8E959B. Ink #18181B.
- Shelf world: the real landing canvas, ground #221835, pill field white at 5%, card #FFFFFF, shadow 0 24px 60px rgba(9,4,16,.5). Tier colours are the product's (DESIGN.md hex values), used only for stamps.
- Accent: landing ink #D3C2F0 on ONE phrase per shot ("before it expires."). Violet #6D4AA8 only on the logo tile.
- Type: display EB Garamond 500 (record names, claim, wordmark), UI Inter (titles 800 at 88 px, -2% tracking; captions 600/400 at 44 px; meta 26 px), data JetBrains Mono (stand-in for Geist Mono, which is not bundled). All text >= 26 px.
- Medium: product UI rebuilt from the repo's own tokens and copy, shown ~2x its real size. Rotated double-bordered stamps are the one material.

OBJECTS: clipboard with ruled count sheet and a pen that draws tally marks (stroke-drawn, no handwriting font); a medicine carton with a printed shelf label "EXP 11/26"; the sample shelf card (five real rows from components/landing-shelf.tsx); the On hand / Actual count pair (labels from the drawer); the weekly digest (heading text from convex/lib/digestEmail.ts); the pill logo tile (components/logo-mark.tsx).

MOTION:
- enter: expo.out / power4.out; camera: power2.inOut 0.5 s; zoom-through/exit: power3.in; stamp: back.out(2.2) 0.28 s (the repo's EASE.stamp).
- Titles: whole-line blur 8 -> 0 in 0.18 s; claim lines swap by blur. No titles move once landed.
- Stagger: shelf rows 0.08 s, stamps 0.14 s (the landing page's own rhythm).

SHOTS:
1. 0.0-4.2 s: pen tallies the four lots on the count sheet; frame 0 already has a group drawn. Reads: a careful count. Sound: pen ticks. Hands off: carton slides in.
2. 4.2-6.0 s: carton arrives, title "Counted. Not checked." (hold 1.4 s). Sound: slide.
3. 6.0-8.5 s: camera pushes 2.4x onto the "EXP 11/26" label; the label grows past the frame (object becomes the world).
4. 8.5-9.2 s: white fills, shrinks to the shelf card on landing violet. 9.2-11.0 s: five rows rise, stamps thunk in order (In date, Low stock, Soon, Watch, Soon per the repo tiers).
5. 11.3-13.9 s: caption "Expiry tiers. Warnings that start early and escalate."
6. 13.9-18.0 s: push to the Amoxicillin row, On hand 42 vs Actual count 41 (sample numbers, marked), caption "Book vs. counted. See drift against your last physical count."
7. 18.0-21.5 s: weekly summary card, caption "Weekly digest. A summary in your inbox, on your schedule."
8. 21.5-26.0 s: pull back, push to Amoxicillin, 31d -> 30d, stamp Soon -> Critical (payoff at 23.2 s = 70%), pull back.
9. 26.0-28.8 s: claim in two swapped lines; 28.8-33.0 s: logo tile draws, wordmark wipes in, Sign in button, hold >= 2 s.

SOUND: Music source unavailable offline; delivered silent unless a track is added. Effects (if any): pen tick on each tally, stamp thunk on each stamp, one whoosh at the label zoom.

BANNED: dark void with small floating things (shelf card is 70% of frame height); glow/bloom/particles; gradients or glass cards; cream-paper serif look; everything centred (only the end card is); every element fading and sliding up; titles that drift; corner labels, brackets, docked logo; three-card rows; dimmed-screenshot titles; invented product screens (the Actual count pair is rebuilt from real labels and marked as sample numbers).

QA: t=0 (count sheet with tally and pen, not blank); t=5.0 (title legible over carton); t=7.9 (label filling frame); t=9.0 (card shrinking); t=11.0 (all five stamps landed); t=15.5 (Stat pair readable); t=19.5 (digest readable); t=23.4 (Critical stamp); t=27.0 (claim line 2); t=31.5 (end card with button).
