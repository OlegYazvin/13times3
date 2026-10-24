# Jane's Year Exhibit — museum hub revision

The user replaces the plain central hallway with an art museum. This changes
the shared gallery architecture, entrance and sound; it assigns no new memory
room. The 41 frame IDs, existing twelve room assignments, blank frames 13–41,
and 39 original achievement URLs remain. Frame 02's household-support role
remains separate from the explicitly requested dishwasher sculpture.

## Design and implementation

Five 10.8 m wide galleries follow the same sequence of turns, extended to give
each framed painting clear wall space. Limestone-colored walls, dark green
dado panels, fluted pilasters, stepped cornices, luminous ceiling coffers,
stone-slab floors with brass inlay, benches and five sculpture islands establish
the museum. Circular ceiling lights and physical wayfinding mark the turns.
The entry opens directly under a physical stone arch and a sign
reading **Jane's Year Exhibit**. Controls are live immediately; Help opens the
optional instructions. Desktop keyboard/drag and portrait touch controls remain.

The first sculpture is **The Dishwasher Dilemma**: monochrome Jane with a bun,
knitted brows, carved sweat drops, a plate held over her palm, an open dishwasher
door and loaded racks. Four dimensional stone `@#$!` glyphs hang above her on
a fine supported display arm. It is a satirical stone assemblage, with the
user's permission to depart from the scene likeness. The other four plinths
hold original abstract stone and bronze forms, rather than inventing additional memories.

Stationary architectural meshes and frame trim are batched by material. The
stone figure is baked in its actual pose and compressed as one small model;
private reference images and metadata are absent. Plinths, benches and entrance
piers have collision footprints; portal worlds retain independent rendering and
room-specific collision. No room model or preview is reauthored for this hub.

Twenty-two bronze flame sconces animate gently. Only two nearby lights are
active. The crackle is original procedural audio, generated locally from soft
filtered noise and sparse transients, with distance fading and stereo position.
It unlocks on a genuine first movement/look interaction, shares Sound with
music, fades out in rooms, and silences on backgrounding. Audio sources release
on page exit. Existing scene-specific piano and background music remain.

## Sources, assets and licenses

- Sculpture author: [museum_author.mjs](../scripts/museum_author.mjs). The
  existing CC0 MakeHuman anatomy and Innerscene footwear sources are adapted as
  stone, as credited on the site. No new third-party character model is added.
- `@#$!` outlines derive from the project's Archivo Bold font, Copyright 2020
  The Archivo Project Authors, SIL Open Font License 1.1. Source glyphs and
  license are in `scripts/assets/museum/`; the public license accompanies the
  museum assets. The outlines are extruded into stone geometry.
- `src/assets/explore/museum/dishwasher.glb`: original assembled sculpture with
  the adapted CC0 anatomy, compressed with Meshopt.
- `src/assets/explore/museum/still-life.webp` and
  `src/assets/explore/museum/shore.webp`: original images generated with the
  built-in imagegen tool, inspected, resized and encoded for framed gallery
  paintings. The complete prompts are below. No reference photos were supplied.
- Museum architecture, abstract sculptures and fire audio are authored code.

## Review checklist

These checkboxes track observed exported results, not source-code intentions.

- [x] Inspect the direct entrance on desktop and a fresh portrait load.
- [x] Inspect each gallery, ceiling, wall finishes, paintings and turning junctions.
- [x] Inspect the dishwasher statue from front, both sides, rear and close up.
- [x] Check the plate/palm, feet/plinth, rack/plates, sweat and suspended glyphs.
- [x] Walk both sides of every sculpture and bench, all turns, and entrance piers.
- [x] Verify near/far crackle, global mute, room silence and audio cleanup.
- [x] Verify optional Help, desktop and sustained touch controls, resize and fallback.
- [x] Recheck entry/return and stencil isolation for all twelve portal worlds.
- [x] Run site, packed-geometry and unit checks; preserve original URLs/IDs.
- [x] Publish the reviewed build and verify normal live assets and fresh loads.

## Observed review

The [before/after and multi-angle evidence](scene-evidence/museum/index.html)
and [verification record](scene-evidence/museum/verification.json) bind the
captures to the reviewed app and sculpture hashes. Desktop and fresh 390 × 844
portrait loads show a legible physical entrance with no controls overlay.
All five galleries, their junctions and both sides of every sculpture and bench
were inspected. All 43 collision footprints and the routes around them passed;
22 mounted sconces have correctly positioned flame and sound origins.

The final sculpture is 652,404 bytes, with three mesh primitives and no embedded
images. Its inspected plate rests over Jane's palm, both shoes meet the plinth,
loaded racks sit in the open dishwasher, and the suspended glyph wires meet
their actual outlines. Sampling the posed author surfaces measures a 0.600 mm
hand/plate gap and 26.829 mm shirt/plate clearance, with no selected hand or
shirt vertices penetrating the plate by more than 1 mm. These measurements
precede Meshopt packing; packed geometry validation and multi-angle visual
inspection are separate checks.

All twelve rooms passed desktop and portrait-emulation entry, continuous
return, controls, collision and cleanup checks. The global suite passed drag,
resize, failed-model recovery and WebGL fallback checks; the museum suite
passed proximity/pan, mute persistence, room silence and audio cleanup. Site
and packed-geometry checks passed, as did all 31 unit tests. No room model,
preview or gallery manifest changed: 39 achievement URLs, 41 frame IDs, twelve
assigned rooms and blank frames 13–41 remain intact.

Artistic judgment is recorded separately from these functional checks. Physical
phone performance and listening were not measured. The larger story-scene
likeness and art backlog remains open; this museum revision does not close it.

## Built-in imagegen prompts

**Still life**

Use case: illustration-story. Asset type: one original oil painting texture for
a framed artwork inside a warm, elegant virtual art museum. Paint an intimate
still life of a cobalt ceramic pitcher, two golden pears, small white wildflowers
in a glass, and a softly folded linen cloth on a dark wooden table, with a deep
muted green background. Rich, confident visible brushwork, warm luminous edges,
balanced asymmetrical composition, quiet joy. It must read as an actual
accomplished oil painting, not a 3D render or a stock photograph. The complete
rectangular image is the painting itself, square composition, edge to edge. No
surrounding frame, no museum wall, no typography, no signatures, no watermark.
Original composition, no named artist.

**Shore**

Use case: illustration-story. Asset type: an original landscape oil painting
texture hung inside a warm elegant virtual art museum. Paint a dreamy Lake
Michigan shore at blue hour with long pale-gold reflections across calm
blue-green water, violet clouds opening to a tiny band of rose light, a grassy
dune and a few weathered stones in the foreground. A hopeful, peaceful composition
with generous depth. Confident, accomplished thick and thin visible oil brushwork,
richly colored shadows. Rectangular landscape aspect 3:2. The image is only the
actual painting, edge to edge, straight on: no frame, no wall, no lettering,
signature or watermark. Original composition, no named artist.


## Published and verified

Art release `74bfbf660431a8d3f59b1fcebbfb9caa5c9c189b` deployed in [successful Pages run 40069565396](https://github.com/OlegYazvin/13times3/actions/runs/40069565396). The normal live HTML and all eight checked assets match the reviewed files, including the museum sculpture, paintings, app, CSS and credits. Fresh desktop and portrait production loads show the direct entrance, current manifest and models without fallback or page errors. The complete museum and twelve portal-world walkthroughs were tested locally against these identical deployed assets. See the [publication record](scene-evidence/museum/publication.json).
