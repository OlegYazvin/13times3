# Zephrine — shared character reference notes

## Hair correction from Oleg, October 22

Zephrine has a lot of hair. Her model must preserve that recognizable fullness.
The former close-fitting scalp/curl cap understated it.

The private Zephrine portrait and full-body references were inspected for
this correction, alongside the friendship and first-apple photographs.
They show warm brown hair, a swept wavy fringe, substantial curls around the
ears and cheeks, and a full back/nape silhouette with loose curled ends. The
friendship references also include gathered/tied-up hair: preserve the amount
of hair when choosing a memory-specific style, rather than treating every
photograph as the same hairstyle.

The local shared sculpt in `scripts/storybook_figures.mjs` now has a dense,
continuous hair volume with modeled curl relief, rounded temple curls and a
few short attached ringlets. The face remains clear. The first large cap with
thick separate locks was rejected in the studio because it looked like a helmet.
Do not recreate the earlier cage of long thin strands or flat side panels.

The current variant is loose hair. Check frontal, profile, three-quarter and
rear views, then every scene occurrence, especially the reclined embrace,
shoulder seating, steering and downward apple gaze. An isolated studio render
does not establish that the hair fits those poses. Full face/likeness acceptance
remains open independently of this hair correction.

Reference photographs and their metadata remain private. Neither originals nor
reference-image pixels are used as a public texture or included in the review.

## Exported review result

All ten existing Zephrine appearances (01–07 and 09–11) were rebuilt and
reviewed in doorway, close, side, rear and fresh portrait-phone views. The car,
reclined embrace, shoulder carry, downward apple gaze, handhold and aquarium
lookup retain the fuller hair. No new visible hair/prop penetration was
identified in those inspected views. Build/site checks and each room's desktop
and phone functional run pass. Interrupted browser captures were repeated with
Playwright's matching headless Chromium shell before being counted as passes.
The hair correction is included in published iteration `f28cbb7`; the wider character and environment art targets
remain open.
