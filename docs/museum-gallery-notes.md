# Jane's Year Exhibit — museum hub revision

## Lighting fixtures — Jane’s reference collection

The user supplied five lighting photographs: a copper ring with branching opal
leaves; irregular warm alabaster globes on dark articulated arms; handblown glass
pendants with visible Edison filaments; teal cords wrapped around a suspended
rail; and a forged orbital chandelier with candles and cut-crystal drops.
These guide original dimensional fixtures throughout the shared museum. The
photos remain under ignored `.secrets/lighting-references/`; their pixels,
restaurant patrons, phone UI and metadata are not published or used as textures.

The [fixture author](../client/explore/museum-fixtures.mjs) and
[placement plan](../client/explore/museum-layout.mjs) create nine fixed displays:

| Location | Fixture |
| --- | --- |
| Growing Together, first paintings | Iron orbital chandelier with candle bulbs, swags and crystal drops |
| Above The Dishwasher Dilemma | Copper ring with branching, glowing opal leaves |
| First gallery turn | Asymmetric veined alabaster-globe mobile |
| Holding Each Other, approaching Cat Whisperer | Cluster of five open-bottom glass globes with Edison bulbs |
| Above the second gallery bench | Brass rail, coiled teal cords and nine hanging Edison bulbs |
| Second gallery turn | A second orbital crystal chandelier |
| Out in the World, fruit-picking paintings | Glass-globe cluster |
| Above the stone abstract study | Alabaster-globe mobile |
| Near the final paintings | Botanical copper-ring chandelier |

The earlier luminous ceiling panels become recessed plaster, with lower ambient
fill and warmer local light. All nine new fixture lights remain stationary and
on at every distance, alongside the nine steady flame-sconce lights. The flames’
crackle remains proximity based. No room world, frame assignment or gallery
collision boundary changes. Every fixture has a ceiling rose, suspension,
connected hardware and clearance above visitor heads. Glass uses modeled shells,
rolled opening lips, sockets and visible filaments. Alabaster has an original
small procedural cloudy material. Filament glow uses one depth-tested point
batch, with no full-screen bloom or transmission render pass.

Observed checklist:

- [x] Inspect all five fixture families and all three galleries from walking height.
- [x] Refine the first pass’s dim filaments, excessive ceiling hotspots and hard light bands on alabaster.
- [x] Review final front/reverse views, art readability, sculpture lighting and close undersides.
- [x] Inspect fresh portrait loads and verify fixed light levels across the walking route.
- [x] Complete movement, portal, fallback, site and model checks; verify unchanged memory assets.
- [x] Publish and verify the live build.

[Thirty final views](scene-evidence/museum-lighting/index.html) show all three
galleries from both directions, each fixture type from below, the entrance
painting and both Jane sculptures. Desktop and fresh portrait emulation confirm
fixed pendant levels and clear art/labels. The first diffuser-material trial
exposed a batching bug that removed vertex colors and rendered the globes black;
the corrected batch retains those colors. Only final captures are presented as
the current result. Source photographs are not textures or public assets.

All 34 unit tests, site/model checks, museum movement and sound, resize and
fallback checks pass. Frames 02 and 11 also pass fresh desktop/portrait entry,
continuous return, controls and cleanup; frame 02 passes the hall-color isolation
probe, and frame 11 keeps both routes around its freestanding portal. The full
manifest and all twelve room models/previews remain unchanged. The app grows by
14,052 bytes; no fixture images or additional models need downloading.

The wider memory-scene character/art backlog remains open. Physical-phone
performance and listening need hardware; emulation is recorded separately.

Published as `ab447b01071058dc77a23d960a4e5e2bbdff18e0` in [Pages run 40125333712](https://github.com/OlegYazvin/13times3/actions/runs/40125333712).
The normal live route, app and Credits match the reviewed build. Fresh desktop
and portrait production loads show the revised atmosphere without fallback or
page errors. The thirty-view local review used the identical app and unchanged
model bytes.

## Cat Whisperer — second gallery sculpture

The requested **Cat Whisperer** replaces the abstract stone study in the
second gallery, Holding Each Other. Jane sits on a carved stool with four cats:
a smaller one on her shoulder, another on her lap, a seated cat by her left foot
and a walking cat circling the stool. Her head turns toward the shoulder cat;
one hand cups beside it while the other touches the lap cat's back. Warm ivory
and pale grey stone unify Jane, the cats and furniture with the museum collection.
The exact title is on the existing plinth. No memory room or frame is assigned.

[Author](../scripts/cat_whisperer_author.mjs),
[build script](../scripts/build_cat_whisperer.mjs), and
[source and license notes](../scripts/assets/museum/cat-sources.md).
Innerscene's CC0 sitting and walking cats were inspected, adapted and composed
in the actual poses. All texture maps and eye glints are removed. Weight-bearing
surfaces fit the posed clothing. Jane uses the existing dimensional sculpture
system; no private photograph or metadata is embedded.

Observed checklist:

- [x] Inspect candidate cats and the first exported arrangement from front, sides and rear.
- [x] Correct the raised-hand gap, hand/head intersection and stool contact exposed by that review.
- [x] Source contact checks: both hands clear cat skin by the 1 mm penetration test;
  shoulder, lap, hands and stool each have a sampled support gap below 2 mm.
- [x] Inspect the final packed asset from normal distance, close, profiles and rear on desktop and fresh portrait emulation.
- [x] Verify walking routes, build/site/model checks, and unchanged memory assets and assignments.
- [x] Publish and verify live bytes and fresh browser loads.

The [multi-angle review](scene-evidence/cat-whisperer/index.html) and
[verification record](scene-evidence/cat-whisperer/verification.json) bind the
final captures to model and app hashes. Desktop and fresh portrait loads show
the shoulder perch, lap seating, dimensional cats and title. Both sculpture
walking routes, museum controls, steady lights, sound, room entry and return
pass. Site/model checks and all 34 unit tests pass. The packed model is 963,748
bytes with no textures or images. All twelve memory assets and the full
manifest remain unchanged.

The two visible walking lanes and existing plinth collision are retained. The
sculpture bounds stay inside that plinth. Source contact tests and functional
checks do not establish portrait likeness or physical-phone performance. The
wider memory-scene art backlog remains open.

Published as `ecf46f85a14a73cd37ef3b88a017de367a672079` in [Pages run 40116976297](https://github.com/OlegYazvin/13times3/actions/runs/40116976297).
The normal live route, app, sculpture and Credits match the reviewed bytes.
Fresh desktop and portrait production loads receive the sculpture and accessible
description without page errors or fallback. The full multi-angle sculpture
review used these identical model and app bytes locally.

## A Fighter in Me — static entrance painting

The user requested one static painting representing Jane's resilience through
her depression, titled exactly **A Fighter in Me**, in the same style as the
original 13times3 achievement gallery. This replaces the square still life on
the left entrance wall. It is a static artwork, with no portal assignment or
new stable frame ID. The lakeshore work remains opposite it.

The new painting shows Jane with her hand over her chest, a raised gaze and a
steady posture amid darker currents and warm painted light. Its cream paper,
dark contours, broad pigment and sweeping teal, cobalt, orange and gold follow
the original gallery's two style references, `2a0b85df0e7c8377.png` and
`e0c9d7fcf7266eed.png`. Jane's private reference guided her face and high bun;
the photograph and its metadata remain excluded from Git and the website.
The artwork is symbolic; it makes no claim that depression has ended or that
resilience depends on constant optimism.

- Asset: [a-fighter-in-me.webp](../src/assets/explore/museum/a-fighter-in-me.webp),
  generated with the built-in imagegen tool, then encoded as metadata-free WebP.
  The original still life remains in the source archive, unhung.
- [Complete generation prompt](a-fighter-in-me-prompt.txt).
- The exact title is a museum plaque outside the painted pixels. The painting
  also has an accessible description and an image in the WebGL fallback.
- No room model, preview, manifest, sculpture, collision route or original
  achievement page is revised.

Observed review:

- [x] Inspect the painting and exact title from normal distance, both sides and close up.
- [x] Inspect fresh portrait loads and the image/text fallback.
- [x] Complete build/site checks and verify unchanged room and frame records.
- [x] Publish and verify production assets and fresh loads.

[Multi-angle review](scene-evidence/a-fighter-in-me/index.html) and
[verification](scene-evidence/a-fighter-in-me/verification.json) bind the captures
to the final image, app, stylesheet and manifest hashes. The portrait fallback
initially overflowed horizontally; a bounded grid and responsive frame list now
fit the viewport. Optional Help also opens, fits and closes correctly. All 34
tests pass. The painting is 1254 × 1254, 628,488 bytes, without EXIF or XMP.

Published as `bc1dd8d10ad68fcc54e3d7e86648ea4aef7f1090` in [Pages run 40115350782](https://github.com/OlegYazvin/13times3/actions/runs/40115350782).
Production HTML, app, stylesheet, painting and Credits match the reviewed
bytes. Fresh desktop and portrait production loads display the new painting.

## Three galleries and continuous light — preceding follow-up

The October 24 follow-up curates the twelve existing memories into three
galleries, with one labeled blank canvas reserved for La Jolla:

| Gallery | Frames in walking order |
| --- | --- |
| Growing Together | `01`, `03`, `04`, `06` |
| Holding Each Other | `02`, `05`, `12`, `10` |
| Out in the World | `07`, `09`, `08`, `11`, `13` (La Jolla, planned) |

The full manifest still stores all 41 canonical IDs and their original room
assignments. `exhibit.sections` controls the hung selection and order; the old
section/side/bay fields remain storage slots for compatibility. IDs `14`–`41`
are outside the current exhibition. La Jolla has no authored scene or preview.
The shorter route has three sculpture islands and benches, retaining the
Dishwasher Dilemma and two original abstract studies.

Every sconce has a stationary, always-on point light. The initial release's
two nearest lights caused the visible switching reported by Oleg; that policy
is removed. Only the gentle crackling depends on visitor distance. The scene
piano remains the same provider stream, clipped off-screen and excluded from
focus instead of placing its player over the artwork. Sound remains its
control and Credits retains the artist/source link. A genuine later movement
or touch retries playback if a browser initially blocks it.

Published and verified as `18a2fa4da35c6155187c55dc51acfe2ab484a289` in [Pages run 40101438868](https://github.com/OlegYazvin/13times3/actions/runs/40101438868). The live HTML and checked assets match the reviewed build. Fresh desktop and portrait production loads pass. See the [follow-up evidence](scene-evidence/museum-followup/index.html), [verification record](scene-evidence/museum-followup/verification.json), and [publication record](scene-evidence/museum-followup/publication.json).

Observed desktop and fresh portrait-emulation review confirms thirteen hung
memory frames, three galleries, fifteen solid display footprints and nine
stationary lights. The warm pools are visible from the entrance, before any
approach. The La Jolla canvas clears the wall trim. Real provider PLAY and
progress events confirm piano streaming on desktop and portrait touch, with
no visible player or keyboard focus target. Mute, return, other-room silence
and provider failure recovery pass.

All twelve memories pass entry, return, collision, controls and cleanup at their
new placements. An old cleanup probe initially landed near frame 07 in the
shortened layout; it now probes beyond every exhibited frame and passes the
same disposal assertions. Application cleanup logic is unchanged. Global
resize/fallback checks, site and packed-geometry checks, and all 31 unit tests
pass. Every room's metadata and all room model/preview assets remain unchanged.
All 39 original achievement URLs and 41 canonical frame IDs remain. La Jolla
has null model and preview URLs; no scene is authored. Physical-phone performance
and listening were not measured. The wider character/art backlog remains open.

## Initial five-gallery release

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
