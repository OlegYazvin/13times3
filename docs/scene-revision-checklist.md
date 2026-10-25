# Gallery art revision — iteration acceptance record

## Current native-sculpture candidate, October 23

- [x] All eleven current exports have doorway, normal-distance, front/profile/three-quarter/rear, return and fresh portrait-phone evidence at their exact model/painting/client hashes.
- [x] All 48 appearances use dimensional age-specific anatomy, native articulated hands and joined posed clothing; private reference photographs are excluded.
- [x] All eleven raw and packed GLBs pass finite-data and triangle-index validation. These are source-integrity checks, not artistic approval.
- [x] Selected actual contact checks pass the 1 mm penetration threshold. The final broad scan found an omitted sleeve/leg crossing in 06 and head/shirt crossing in 07; both were corrected and re-exported.
- [x] Frame 06 supporting palms measure 0.315/0.409 mm, lap 0.440 mm, sleeve/legs 2.17–2.32 mm clearance, zero tested sleeve/leg edge crossings. The two remaining broad containment flags have zero edge crossings at open neck/wrist boundaries and no corresponding visible overlap.
- [x] Frame 07 shoulder support measures 0.507 mm, shin grips 0.715/0.038 mm, head/shirt clearance 31.51 mm; the broad inter-actor scan has no flags. Bushes remain 2.015–2.345 m tall.
- [x] Fresh 06 portrait view includes the feet; fresh 11 portrait view includes G, Zephrine and their shared moving fish. Both routes around/behind the aquarium portal pass.
- [x] Build/site checks and 18 tests pass. Global controls, resize and fallback checks pass. The broader control suite also passes all eleven desktop and high-resolution portrait-phone entries, touch input, stable FOV, collision, return, music and failed-load behavior.
- [x] Room downloads remain approximately 1.5–6.6 MB; the soft loading target does not limit essential anatomy.
- [ ] Final likeness, expression and environment artistic acceptance: weaker areas remain in the [current scene report](scene-revision-report.md).

Representative current renders and hash metadata are in [the evidence folder](scene-evidence/2026-10-23/README.md). Entries below preserve the history of previous iterations; their unresolved measurements are superseded only by the current evidence above.

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

## Character foundation after release `fa3eb23` — local study

- [x] Compare adult and child prototypes against the private references; reject a resized adult face as the child base.
- [x] Inspect actual CC0 MakeHuman adult and child anatomy together; preserve reference photographs outside source and exports.
- [x] Reject the overlay-eye test; seat dimensional eyeballs inside the source's modeled eyelids.
- [x] Check accelerated sculpt fitting against Three.js ray intersections on adult and toddler geometry.
- [ ] Complete the curl silhouette, adult likeness, neck joins, hands and constrained-arm study in front/profile/rear views.
- [ ] Export the complete character foundation into the blueberry interaction and inspect actual support, fruit contact and fresh phone views.
- [ ] Propagate only after that review; recheck every occurrence and every scene-specific contact.
- [ ] Finish each scene's environment, emotional composition and artistic acceptance.

The initial local shirt export and subsequent studio images are development
evidence, not a new website release. The currently verified live release is
`fa3eb23`; the latest study is not claimed as an accepted cast.

## October 23 coupled-contact review — in progress

- [x] Inspect adult/child native heads together from front, profile, three-quarter and rear; reject the detached fringe pieces and the inward-dipping curl surface.
- [x] Inspect the continuous neck through a posed, exported scene; correct the exposed lower-neck flare by seating the connected neck inside the shirt.
- [x] Measure actual exported surfaces, distinguishing penetrations from gaps. The carry study exposed up to 4 cm of leg/shirt penetration, 1.4 cm of hand/trouser penetration and 3 cm of head/thigh penetration.
- [x] Correct leg/shirt and head/thigh clearance in the measured study (no sampled penetration deeper than 1 mm). Tighter finger curls still failed, so grip acceptance remains open.
- [x] Verify the offline GLB inspection against the browser: 1,239,549 position components match exactly for the same export, including posed heads.
- [ ] Inspect the revised diagonal grips, G's cupped support and all contacts in the final blueberry export.
- [ ] Recheck the revised adult-height field and cast on desktop and fresh portrait-phone views.
- [ ] Complete and inspect every new cast occurrence in all eleven rooms; correct unreachable legacy targets rather than stretching arms.
- [ ] Verify consistent hand, arm and shoe dimensions when the same person is seated or standing.
- [ ] Complete scene-specific environment and emotional acceptance, portal painting review and final functional verification.

## Continued local review, October 23

- [x] First native-anatomy exports completed desktop and fresh emulated portrait
  entry, side/rear, return and cleanup checks in all eleven rooms. These are a
  functional baseline, not current artistic acceptance: subsequent models differ.
- [x] Diagnose buried field shadows against decoded ground triangles. Default
  14-bit packing raised the flat ground by 3.90 mm. The 16-bit candidate measures
  −0.496 mm; its authored 2 mm shadows are above the ground. Recheck the picture.
- [x] Validate a real articulated writing pinch, pencil clearance, paper tip and
  resting-hand plane in geometry tests. Frame 01's exported side views show the
  writing arrangement; final front, phone and cave lighting review remains open.
- [x] Inspect the cave without roof rods and wall rails. The subjects read more
  clearly, but harsh wall shadows and dark lighting require further tuning.
- [x] Expose frame 06's false weight, arm/head and hand/clothing intersections
  from profile views and exported surfaces; reject those prototypes.
- [ ] Review the latest coupled embrace and exact supporting contacts. The
  preceding mesh scan still found a forearm/child-trouser intersection. A
  fitted hand alone did not establish that its sleeve cleared the child.
- [ ] Review the resized/depressed chair cushion and closer back in the actual
  scene. Remove floating upholstery lines; resolve shadow artifacts separately.
- [ ] Review frame 02's waist-height kitchen, pan grip and thin draped blanket.
- [ ] Complete every scene's composition, likeness, environment and emotional
  acceptance, then rerun the final current-hash browser and phone checks.

Only `fa3eb23` is the verified website release. These are local art studies.

### Latest observed contacts and studies

Frame 06's exact surface study now separates the large false open-neck/wrist
parity flags from actual crossings. The earlier 14 neck crossings and 105
shirt crossings were confirmed; later elbow/shoulder/cloth changes removed
those coarse-scale crossings. The complete vertex check still finds up to
1.88 mm of sleeve contact penetration and 1.43 mm at the lap, with a 5.91 mm
right-palm gap. Left-palm clearance is 0.315 mm and the child's face remains
outside Jane's closed shirt surface. Do not describe all contact as finished.

Frame 02's latest completed functional pass includes the revised writing pose,
waist-height kitchen, draped cloth and side embrace. The roof and lighting have
changed again afterward, so the final current-hash art review is still required.
The lower-profile ceiling study replaces the rejected dominant dark slab.

Frame 03's first native export has confirmed overlapping held hands (about
12 mm). A separately fitted opposed-palm study, closer mothers, grounded path
origins, irregular planting and real dance-studio volume are now being exported.
No new scene is reserved or published by these studies.

### Footing and car evidence

- The completed footing export puts Jane's signup soles 0.50 mm above her
  worn sand patch and her planted stage child's foot within 0.02 mm of the
  deck. The other stage foot is intentionally raised 50 mm.
- The old sanctuary soles were 74 mm below the rug surface. The coupled chair
  and embrace now rise to that actual surface; Jane's soles measure 0.47 mm
  above it. The child's feet remain carried above the rug intentionally.
- Office, route, orchard and aquarium standing soles meet their revised flat
  gathering surfaces; the playground's planted soles have about 0.50 mm of
  pad clearance. Zephrine's balancing foot remains raised intentionally.
- The new friendship grip measures about 0.31 mm of skin clearance, no vertices
  deeper than 1 mm in either direction and no tested hand-edge crossings.
  This is geometry evidence; its gesture still needs visual acceptance.
- The first correctly sized car study revealed toe/shell, seat and grip
  failures. Full prop checks use floating-point decoded attributes; applying
  transforms directly to normalized integer GLB buffers invalidates distances.
  Reject that inspection artifact rather than reporting multi-meter gaps as
  product defects. Corrected prop checks remain in progress.

Recent completed desktop/emulated-phone passes cover the changed `01`, `03`,
`04` and `06` candidates at their recorded hashes. Later source and footing
changes require fresh checks. Final artistic acceptance remains open for all 11.

### October 23 contact and composition evidence — supersedes older open measurements above

- Frame 05: correcting the inherited child yaw closes the 33 mm held-hand gap.
  The current export measures 0.064/0.042 mm minimum vertex distances, no vertices
  deeper than 1 mm and zero tested hand-edge crossings (4,705 tested edges).
- Frame 06: the latest selected full-vertex pairs measure 0.315/0.409 mm support
  palm gaps, 0.440 mm lap gap, 2.019 mm face/shirt clearance, and no vertices
  deeper than 1 mm. Both clothing directions pass the same test. The phone
  doorway image still crops the feet; moving the complete arrangement back
  0.70 m is a new unverified composition change, not a contact completion claim.
- Frame 09: both cupped hands meet the actual closed, concave bitten apple in
  the packed export. No tested hand vertices penetrate deeper than 1 mm. The
  old separate pale insert has been removed. Full visual acceptance remains open.
- Frame 07: the refined shirt opens a 15.98 mm thigh/shoulder support gap.
  Both shin grips remain within 1 mm and the head clears the thighs by 2.89 mm.
  A paired shoulder-root lift is now authored; its new export needs measurement.
- Frame 10: raw opposed grips pass full skin checks, but the room export rejects
  one unreachable arm. The right child and supporting pad are restaged together;
  the pending export must establish reach and contact together.
- Frame 02: actual close views show a much clearer clothed side embrace,
  a shared cloth touch and differentiated street contacts. Stiff contact gestures,
  floating desk equipment and the sparse open home wall remain observed failures.
  Source fixes are in progress; do not mark these resolved before re-export.
- Frame 11: the source water lens had a fixed 5.95 m upper rim and 6.70 m
  supports that exceed the curved dome at its outer edge. Fitting these surfaces
  under the real ceiling is separate from the now-shared canopy UV coordinates.
  Both fixes require new side/behind-portal images and moving-fish route checks.

All of these are local changes after the verified `fa3eb23` release. No new
publication or final artistic acceptance is implied by the functional checks.

### Source geometry integrity — new confirmed defects

The jellyfish bell used an incorrect lower-ring index. The shared generic hair
cap also used an off-by-one lower-ring index; each affected raw mesh contains one
out-of-range index and six nonfinite normal components. The rendered hair could
still appear mostly intact after packing, so preceding browser passes did not
establish source integrity. Both constructions are corrected. The packer now
checks finite surface data and index bounds before welding. All eleven rooms
must be re-exported and their affected appearances rechecked after this shared
correction. No new release is recorded by this source fix.

## Reviewed park and route follow-up after d966cbf

- [x] Frame 03 replaces floating-looking flower cards with rooted arched leaves and small connected flower heads, continuous lawn, supported benches/table and bridge arrivals. The first upright-cup leaf trial was rejected. Fresh full figures, profiles, rear and portrait-phone views are saved at the final model hash.
- [x] Frame 08 rotates complete buildings toward the route, lowers display bases, models the quarry bowl/pond, removes hidden leaf slivers before batching and moves complete lanterns/plaques clear of the enlarged facades. All seven stop views and fresh portrait-phone entry/return pass.
- [x] The girls’ handhold remains 0.305/0.315 mm with no tested penetration. Bridge step/deck gaps are below 0.01 mm; the play-table pedestal is about 1 mm above the play mat and joins the table by 40 mm.
- [x] Six lanterns have at least 0.788 m projected clearance from principal wall meshes, seven plaques at least 0.348 m; lantern feet meet the packed floor within 0.9 mm. These are selected bounds/ray checks, not proof for every ornament triangle.
- [x] All eleven raw and packed geometry files pass again; build/site checks and 18 tests pass. Only 03 and 08 changed after the full control suite; their current exported models have fresh functional walkthroughs.
- [x] Manifest fallback footprints are synchronized from the current exports. Original routes, frame IDs, assignments and blank slots remain unchanged.
- [ ] Final human likeness and artistic acceptance remain open as described in the current scene report.

## Frame 12 venue detail follow-up

The current environment candidate replaces the sparse counters with complete
guest bars, working rear counters, shelves, taps, glassware and stools. Borelli’s
gains café seating and lamps, a piano and mounted stage cans. Beat Kitchen’s
blocked rear windows become real openings onto a modeled Chicago neighborhood,
with the street one storey below the floor. This revises the existing jam memory;
Jane still listens and Zephrine still connects with her child friend.

- [x] Research inspected upstairs, exterior and Borelli’s interior photographs;
  original private images stay out of the download.
- [x] Reject smooth placeholder street-tree canopies in favor of the adapted,
  already credited CC0 branching tree; add brickwork and distinct street entrances.
- [x] Current exported selected-contact study covers 27 relationships with no
  sampled penetration over 1 mm; all 27 site/unit checks pass.
- [x] Finish the current model’s desktop, portrait, window/perimeter, collision,
  sustained-render and publication verification. See the
  [scene notes](scene-12-folk-jam-notes.md) for the live checklist and evidence.
- [ ] The larger cast-likeness and all-scene artistic acceptance remain open.

Frame 12’s venue revision is published and byte-verified: [before/after images
and completed checks](scene-evidence/12-venues/index.html),
[release record](scene-evidence/12-venues/publication.json). The broader character
acceptance above remains open.


## October 24 — real second-floor office follow-up

- [x] Correct the proposed office plan left/right at Oleg's direction and
  implement after his explicit build request. Sofa left, bookcase/desk/chair
  and entry right. This revises frame `05` only.
- [x] Build two joined wood/black-steel stair flights with a turn, supported
  landings, upper-floor movement and height-specific collision. Check the
  exported climb/descent route and real mesh support, not only source metadata.
- [x] Furnish the photo-informed office and model the catalpa outside real
  second-floor glazing, with the street and parked cars below the sill.
- [x] Inspect normal, side, rear, doorway, tree, downward street, desktop and
  portrait-emulation views; correct the rejected chair shell, missing bookcase
  support and door/ottoman overlap before the final current-hash review.
- [x] Site/model checks and 37 tests pass. Separate desktop/phone controls,
  entry, return, FOV and cleanup checks pass.
- [ ] A measured office/corridor survey is unavailable; the unverified spacing
  and connecting corridor remain composed. Broader family likeness/expression
  acceptance is still open.

See [office evidence and publication status](scene-evidence/05-real-office/README.md).
