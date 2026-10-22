# Gallery art revision — iteration acceptance record

Baseline: existing 11 memories, 39 achievement URLs and 41 frame IDs. This work
was developed in `/tmp/jane-quality-revision` to preserve concurrent migration work.
The other task has now acknowledged the stop instruction.
The prior screenshot audit is evidence of the original failures; later local
passes in the migration task do not automatically satisfy this checklist.

## Shared acceptance

- [x] Adult and child prototype reviewed together, front/profile/three-quarter/rear (`studio-*.png`).
- [x] No facial portrait panels in current exports; modeled anatomy, fitted hair and dimensional eyes (export checks and scene views).
- [x] Shared construction and proportions propagated across the whole cast, including supporting characters.
- [x] Pose-specific hands, clothing and supporting surfaces inspected; remaining art weaknesses are recorded in the report.
- [x] Every room reviewed at doorway, sides, rear and fresh portrait viewport; unresolved issues remain listed, including the partial-reveal defect.
- [x] Portal, sampled collision, emulated mobile controls, cleanup and fallback checks pass locally. Verified after integration.
- [x] All generated room models plus paintings below 8 MB; largest is room 02, about 7.47 MB.
- [x] No private reference photos or metadata copied into output or evidence.
- [ ] Human likeness, emotional and environmental art acceptance.
- [x] Integrated locally after the migration task acknowledged its stop; original checkout build/site checks pass, and all 11 model hashes plus the client hash match the reviewed exports.

| Frame | Observed baseline problem | Required local acceptance | Status |
| --- | --- | --- | --- |
| 01 | Mask faces, toy limbs and distracting cave linework | Sculpted signup and performance poses; calmer cave; legible desk | Publication iteration; art open |
| 02 | Mixed figure styles and disconnected support gestures | Coherent repeated Janes, desk advice, care and embrace; joined home/street | Publication iteration; art open |
| 03 | Incompatible girls and unclear handhold | Shared sculpt style, real hand contact, linked park/dance spaces | Publication iteration; art open |
| 04 | Rigid steering, weak grip contact, side-head slabs | Seated child fits toy; two parent grips; dimensional street | Publication iteration; art open |
| 05 | Mannequin gesture in vacant hall | Resolve and family connection; directional opening into light | Publication iteration; art open |
| 06 | Bar forearm, rotated standing child, lap/chair overlap | Purpose-built seated mother and curled clothed child | Publication iteration; art open |
| 07 | Unconvincing shoulder support, giant fruit, stiff G | Child sits securely; hands support legs; small berries on bushes at least adult height (Oleg’s correction; exported follow-up measures 2.015–2.345 m) | Publication iteration; art open |
| 08 | Labels dominate model-display route | Seven distinct stops, continuous journey, companion interaction | Publication iteration; art open |
| 09 | Reversed child torso rings, cage hair, rigid vest | Ordered body surface, fitted vest, held apple and grouped friends | Publication iteration; art open |
| 10 | Static doll lineup, hovering hands | Children visibly engaged together; integrated adults and park | Publication iteration; art open |
| 11 | Family masks, mechanical pointing, canopy clutter | Shared fish attention; clear glass, continuous canopy and rear route | Publication iteration; art open |

Do not check a box based solely on a successful export or intended geometry.
Record actual reviewed screenshots and remaining weaknesses before release.

The rows above retain the original acceptance targets. Their current status is
**publication iteration, artistic acceptance open** for every scene. See
[scene-revision-report.md](scene-revision-report.md) for the observed changes,
remaining weaknesses and per-scene evidence. `scripts/build_revision_report.mjs`
generates the illustrated local walkthrough and hashes the exact current GLBs.

## Defect classification used during review

- **Actual geometry/contact defects:** room 09's reverse-ordered child torso
  contours were a self-overlap; room 06's revised figure initially sat in front
  of the chair because a name search selected the side table. Both were corrected
  in the source. A separate contact pass revised steering, pushing, handholding,
  the comforting pair and supported shoulder seating.
- **Failed contact without a mesh intersection:** hovering fingers and hands
  alongside grips were treated as pose failures. They were not counted as proof
  that the renderer or portal was broken.
- **Intentional surrealism:** repeated Janes in room 02, compressed architectural
  stops, room-specific scale and dream transformations remain intentional.
  They still have to be composed well; intention does not establish quality.
- **Portal behavior:** independent rooms may overlap behind their frames. The
  hall's partial dissolve mixes a painting with its differently projected live
  room. Its doubled subjects are a transition weakness still visible in
  `01-reveal.png`, distinct from duplicate exported meshes or a stale screenshot.
  Behind the aquarium arch, the aquarium continues.
- **Material/environment weaknesses:** canopy joins, repetitive planting,
  schematic architecture and blank horizons are recorded as art issues, even
  when movement and stencil checks pass.

## Follow-up: Zephrine's hair

- [x] Private portrait, full-body, friendship and apple references inspected.
- [x] Tight cap replaced in the shared model with fuller sculpted curls; rejected the helmet-like first trial.
- [x] Adult/child and close child studio views inspected front/profile/three-quarter/rear.
- [x] Rebuilt and reviewed every occurrence in frames 01–07 and 09–11, including fresh phone views and the seated/carried poses; current model/client hashes accompany the captures.

## Publication authorization, October 22

Oleg authorized uploading this reviewed iteration and continuing the art work.
The release includes all eleven reviewed exports and Zephrine’s fuller hair; it
does not close the human likeness or environmental acceptance boxes. Adult-height
blueberry planting was corrected and reviewed in the later local follow-up.

## Local blueberry follow-up

- [x] Decode the actual GLB and measure every plant; all 52 exceed 2 m.
- [x] Inspect attached leaves, small berries and the shared picking bough in the room.
- [x] Inspect both sides and rear; remove the exposed rectangular field edge.
- [x] Recheck desktop and fresh portrait-phone entry, movement, sampled collision, return and cleanup.
- [x] Reject the excessive-geometry trial; use simpler distant plants and shared geometry. Current room assets: 5.93 MB.
- [ ] Physical-phone GPU performance and final character/environment art acceptance.

This follow-up is included in the user-authorized release after `f28cbb7`.

## Local portal follow-up

- [x] All eleven paintings rendered through the physical frame projection.
- [x] Isolated experiment confirms the room 02 horizon rectangle came from retained hallway depth.
- [x] Room 02 sky remains unchanged when unrelated hall walls are tinted magenta.
- [x] Complete fresh desktop/phone and walkaround verification of the final renderer across all eleven rooms; the last field contact correction is checked separately against its final export.
- [ ] Resolve frame 01's taller-painting/smaller-aperture upper edge and finish artistic acceptance.

The source-note privacy redaction is separately published in `d946d79`; the
reviewed artwork and portal follow-ups are released by this commit. Further artistic acceptance remains open.
