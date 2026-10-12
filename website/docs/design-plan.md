# Design plan

**Concept — "Two devices. One working rhythm."** The page is laid out like a desk: the Mac is the wide
surface, the phone sits beside it, and a single thin lime line (the link) is the only thing that ever
connects them. That line recurs — in the hero, the setup sequence and the connection diagram — and is the
one motif the site owns.

**Homepage sequence.** Hero (promise + product) → illustrated walkthrough (four real workflows, stepped by
the visitor) → workflow tabs (four categories, one large stage) → two editorial stories (calls/notifications,
files) with different compositions → how it works (three steps, QR) → connection model diagram → honest
compatibility → what's next (roadmap, no dates) → beta access → FAQ → short closing line.

**Type and tokens.** Geist Variable (OFL, self-hosted) for everything; Geist Mono for technical metadata
(ports, versions, file paths). Palette from the Sidekick Figma handoff (`#0A0A0A` ground, `#161616` panels,
`#C6FF33` accent). Body text uses a lifted warm-neutral `#C4C5CC` instead of the app's `#9A9CA8` for
long-form reading contrast; app metadata grey `#6B6E7A` is not used for text.

**Hero.** Editorial split: left column copy at a 5/12 measure; right a Mac window (Notifications pane, a
reply being typed) with the phone standing in front of its lower-right corner showing the same message.
Near-front framing, no perspective. A 1px lime connector runs between the two with a small dot.

**Mobile.** Copy first, then the product composition as a deliberate crop: the Mac window renders wider
than the screen and is cut at the viewport edge, so the notification detail and reply stay readable,
with a larger phone in front. Below 1040px the tabs become a 2×2 button grid above the stage. The
connection diagram becomes a vertical stack.

**Assets.** No real screenshots are approved, so every product view is drawn in HTML/CSS from the design
tokens with fictional names and labelled *Illustration · fictional data*. Replacement list lives in the
launch checklist.

**Main interaction.** The workflow showcase (ARIA tabs, arrow keys, no auto-rotate; without JS all four
panels are shown in sequence). The walkthrough is a static four-frame storyboard with timestamps, so it
needs no interaction and can't hide a step.

**Why it won't feel generic.** No gradient orbs, no bento wall, no badges or numbers. The product is the
largest thing on every screen, limits are written as plainly as features, and the lime is rationed to the
CTA, the link line and selected states.
