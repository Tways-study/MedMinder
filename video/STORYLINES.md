# MedMinder landing demo: storylines

**The one thing:** MedMinder tells you a lot is about to expire before it does.
**Spine:** one real lot (Amoxicillin 500 mg, 31 days) travels from hook to payoff.
**Facts (verbatim from the landing page):** "Know what's on the shelf before it expires." / "Stock, expiry and reorder tracking for the dispensary. Every account keeps its own private shelf." / Expiry tiers. Warnings that start early and escalate. / Book vs. counted. See drift against your last physical count. / Weekly digest. A summary in your inbox, on your schedule.
**Assumptions:** 25-35 s, 1920x1080 at 30 fps, no voiceover, light music plus stamp/click sound effects (free, local). Landing UI is captured from the real `/signin` page; any signed-in Inventory screen is a labelled placeholder unless you supply a recording.

## A. The Re-Stamp (recommended: it is the page's own gesture, and everything on screen is real)
- **World:** the landing's gentian-violet canvas, then the white shelf card. **Device:** the result first. **Form:** one continuous take.
- **First two seconds:** the Amoxicillin 500 mg row fills the frame, "31d" with its In date stamp, then the count ticks down.
- **Beats:** hook (31d ticks down) -> tension (the lot crosses a tier and is re-stamped) -> reveal (pull back: the whole shelf, "MedMinder") -> proof (Expiry tiers; Book vs. counted; Weekly digest, one verb each) -> payoff (a second lot re-stamps, the shelf reads at a glance) -> claim ("Know what's on the shelf before it expires") -> end card (logo clicked, wordmark wipes in, Sign in button).
- **Look:** landing violet ground, EB Garamond names, Geist Mono day counts, the rare rotated stamp as the one material.
- **Sound:** sparse piano pulse; a dry stamp thunk on each re-stamp.

## B. Tuesday Stock Count
- **World:** a pharmacy counter, then the product. **Device:** a moment in someone's day. **Form:** object-to-object chain.
- **First two seconds:** a handwritten shelf label "Amoxicillin, exp." being checked against a clipboard, a pen hesitates.
- **Beats:** hook (the count that never matches) -> tension (a lot slips past its date unnoticed) -> reveal (the label becomes the first row of the sample shelf) -> proof (tiers, book vs. counted drift, digest) -> payoff (the shelf re-stamps itself) -> claim -> end card.
- **Look:** warm counter ground, paper labels, then the violet shelf. **Sound:** room tone, pen, then music in.
- **Cost:** the counter and clipboard are drawn, since there is no real footage. The product half stays real.

## C. One Pill (the bold one)
- **World:** a violet field, a white void, an email client. **Device:** the object is the explanation. **Form:** match cuts on one capsule shape.
- **First two seconds:** a capsule outline holds still on violet, then turns into the Amoxicillin row's stamp.
- **Beats:** hook (capsule -> stamp) -> tension (capsule -> "Book vs. counted": two numbers that disagree) -> reveal (capsule -> logo tile, the name lands) -> proof (capsule -> weekly digest email, from the real template) -> payoff (capsule field fills with stamps) -> claim -> end card.
- **Look:** big Garamond type, tile-grid cuts on the beat. **Sound:** cut-on-beat percussion.
- **Cost:** needs the real digest email rendered from `convex/lib/digestEmail.ts`, plus a drift example I would have to label as illustrative.
