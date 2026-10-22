# Eleven-scene visual revision — reviewed publication and continuing art work

Oleg authorized publishing this iteration on October 22 and continuing the art work.
This release replaces the painted-face construction in
all eleven exported rooms and improves several interactions and environments.
It does not yet meet every part of the requested art standard. In particular,
the cast still looks too mannequin-like in its shoulders, clothing and expressions.
Several environments still look like model displays. Resemblance to the private
references also needs human review. Passing
browser checks does not resolve those artistic weaknesses.

The illustrated walkthrough is generated at
[`../.cache/art-review/index.html`](../.cache/art-review/index.html). It includes
the saved baseline painting, revised painting, doorway, side/rear views and a
fresh portrait viewport for each room. These are local evidence files, not site
content. The baseline is the local build captured before this revision; it is
not a claim about the latest concurrent production deployment.

## Character system and provenance

`scripts/storybook_figures.mjs` builds the current cast from original modeled
surfaces. The face has a continuous skull, cheeks, nose, chin and mouth contour;
the eyes sit under modeled lids, with fitted ears, hair and necks. Painted
materials supply color and fabric treatment. Portrait panels, face atlases,
depth-map inserts and previous imported bodies are removed before export.
The old authoring studies remain in the repository; they are not the current
exported characters. Zephrine's shared hair has a fuller curly side/back and nape silhouette based
on the private portrait and full-body references, replacing the tight cap. See
[her character notes](character-zephrine-notes.md) and the local
[hair comparison](../.cache/hair-revision/index.html).

Thumbs are mirrored anatomically between the two hands, and the irises fit inside the modeled eyelids. The current figures introduce no third-party character
model license. Existing CC0 trees, ray and barramundi, CC BY reef-fish schools,
and the music attribution remain credited. The private reference photos were used locally and were not copied
into the public assets or this evidence report.

Adult and child prototypes were inspected together from the front, profile,
three-quarter and rear before rollout. Every occurrence then received a
scene-specific pose and was exported and inspected in its room. This establishes
the replacement construction and its visible consistency, not an approval of
every likeness or expression.

## Changes and remaining weaknesses

| Frame | Implemented and observed locally | Still below the requested art target |
| --- | --- | --- |
| 01 — Signup | Replaced both figures; Jane sits on a joined walnut chair at the desk with a pen over the notebook; Zephrine has an open stage gesture and lifted foot. Moved Jane and the complete desk arrangement inward after portrait review cut off the signup action. Reduced competing cave ornaments. Undersea cave and small stage retained. | Stage performance remains restrained. The desk and cave still need more convincing authored forms and a stronger focal lighting hierarchy. |
| 02 — Job search | Replaced the whole cast in one style, including the intentional repeated Janes. Preserved the referenced desk, blanket and satchel. Oleg now faces the desk and open notebook, with Jane beside him and a hand at his shoulder; side review exposed and corrected the previous empty-space reach. Separate advice, care, household, outreach and comfort poses. The comforting pair now lean together with an arm around the shoulder. Extended terrain beyond the home/street. | Caregiving reads partly through the blanket prop. Several household actions remain schematic. The home-to-street transition still has large empty areas and towering thin facade slabs and needs a more deliberate spatial transformation. |
| 03 — Friendship | Compatible adults and children; the girls turn toward each other and walk with alternating strides while their modeled hands meet. Charlize's stripes lie on the garment surface instead of floating as bands. Park/dance arrangement and paths retained; ground and distant planting extend beyond the first view. | The setting remains relatively generic; repeated visits and dance are not yet as emotionally readable as the brief requires. |
| 04 — Blue car | Cut a real open cabin into the previously solid car body, added a recessed footwell, and resized the vehicle. Child now fits its actual seat, with feet in the footwell, hands on the scaled steering rim, and a belt. Both parents' hands meet the resized pushing grip. Street bay materials and distant ground adjusted. | Car trim and street architecture remain simplified. Parent poses remain fairly symmetrical and restrained. |
| 05 — Office move | Family placed together around Jane. Raised, grounded gesture and lifted chin replace the isolated mannequin stance; a warm opening crosses the cooler office floor. Preserved the migration task's lamps, diffuse windows, oculus and living planters in the combined local candidate. | The hall remains too vacant, and side views expose an abrupt architecture/background edge. The current expression does not fully carry triumph, resolve and release without the caption. |
| 06 — Ending breastfeeding | Purpose-built seated mother and reclined clothed child. Corrected the actual chair scale/position after a side view exposed a real contact error. Child wears a clearly blue top and mauve trousers. Supporting arms, curled legs and chair/lap arrangement were reviewed from both sides. | The embrace remains visibly stylized; hands and clothing folds need finer sculpting. The room's repeated ribs, exposed side limits and broad surfaces still feel architectural rather than intimately dreamlike. |
| 07 — Blueberries | Child sits behind Oleg's head with bent legs and supporting hands at the lower legs. Smaller reachable fruit and relocated branch meet the child's reaching hand; G helps from the other side. Replaced the trunk-like bough with basal canes and smaller leaves sampled from the actual branch curves; reduced and attached the berry calyces. The post-publication local follow-up replaces low shrubs with measured 2.015–2.345 m multi-cane bushes, small leaves and fruit, and deeper rows. G and Zephrine meet the lower bough. Continuous ground removes the side-view rectangle; simpler distant prototypes reduce geometry. | Lower foliage and summer light still need more variety and atmosphere. Oleg’s sleeves visibly pinch and collapse at the bent elbows in `07-picking-contact.png`; that garment geometry still needs repair. Supporting hands need more nuanced finger wrapping. |
| 08 — Chicago route | Seven stops and itinerary retained. Labels reduced and moved beside the route; continuous promenade edges and quieter masonry connect the journey. Added real window framing and recess detail to the bridge stop. | Buildings still resemble compact architectural studies. Several stops need more distinctive volumes and silhouette, and less reliance on signs. |
| 09 — First apples | Corrected reversed child contour ordering; replaced cage hair and rigid vest boards with fitted forms. Cupped palms and curled fingers now follow the lower surface of the bitten apple; the apple-print fabric lies on the shirt rather than floating above it. Jane turns toward Zephrine with a hand at her shoulder, and Oleg looks into the interaction. Moved character replacement before leaf batching so a leaf from the removed figure no longer survives through the new sleeve. Terrain and trees extend the orchard. | The apple and its bite are still a simple sculpt. Hands and garment folds remain simplified; orchard tree repetition and restrained group expression remain visible. |
| 10 — Maggie Daley Park | Brought the game forward from the distant display layout. Two older friends steady Zephrine's hands as she balances on a modeled play pad with one leg raised. The skirt hem gathers around that leg after a rear view exposed a fabric intersection. Preserved the supporting children's relative heights and dress; adults form a staggered group watching the game, with yellow glasses, rose jacket and knit cap cues retained. The low pads are an authored interpretation of shared play, not a claim about an exact park fixture. | Side and rear views still show sparse ground, regular grass color bands, oval planting islands and a generic skyline. The large ship, lighthouse and slide remain mostly background scenery. Material and environmental finish remain below the requested standard. |
| 11 — Aquarium | Replaced the family; G and Zephrine turn toward the relocated real side habitat and fish. Preserved moving inhabitants and the freestanding return portal, including both side routes and access behind it. Retained the migration task's additional fish schools and manta. Removed selected guide strands. | Painted habitats and modeled figures still differ in detail. Canopy seams/ribs and some empty floor areas remain conspicuous. |

## What verification establishes

`npm run build` and `npm run check` pass locally. They check the original 39
achievement routes, 41 stable frame IDs, published assignments 01–11, blank
frames 12–41, credits, sitemap, local fonts and room assets. The current GLBs
plus room paintings fit under 8 MB each; room 02 is the largest at about 7.47 MB.
This measures room assets, not the initial shared client or a complete network
waterfall.

`scripts/run_gallery_review.mjs` checks fresh desktop and portrait-phone browser
contexts for each room: loading, actual portal crossing, one isolated loaded
world, exported collision footprints, sampled solid centers, walking/turning,
return without heading or field-of-view jumps, and cleanup after leaving. It
also checks both routes around the aquarium portal and traversing its back
while remaining in the aquarium. Separate global checks cover drag look,
portrait resize, WebGL loss, no-WebGL fallback and a failed room download.
Manifest fallback collision rectangles are synchronized from the actual
exported model footprints.

Phone evidence is Chromium touch emulation at 390 × 844. A physical phone,
Safari/WebKit behavior, sustained low-end GPU performance and exact memory use
have not been verified. Solid-center samples do not prove every boundary or
all mesh intersections. Contact and art judgments come from the saved views.
The local screenshot hook forces a completed render/readback so a stale browser
compositor buffer is not mistaken for scene geometry.

The published iteration's partial-reveal captures exposed doubled subjects
where the painting and live room had different projections. The local follow-up
renders all paintings through the actual physical frame from the hall and
shortens the cutout interval to 3.2–2.6 m. The tested signup view no longer shows
two differently sized people and stages. The upper cave edge still exposes the
mismatch between frame 01's taller painting and smaller live aperture; this
transition remains below the art target.

The new room 02 approach also exposed a pink rectangle across the distant sky.
A separate isolated render experiment confirmed that a later gallery wall was
occluding the room because both worlds shared the first pass's depth buffer.
Clearing depth after the foreground-tested portal stencil removes that wall.
This preserves the stencil, actual camera and continuous doorway crossing. A
browser regression tints the unrelated hall and checks that the live sky pixels
inside the aperture do not change. This is distinct from intentional world
coordinate overlap, actual mesh clipping or a stale capture.

Rear contact review also exposed depth gaps in room 05's handhold and room 07's
supporting hands that were hidden in front views. Their world positions were
corrected before the final local exports. G now helps at the actual blueberry
branch. Cloud forms in the shared sky atlas now wrap across both horizontal
edges, addressing the vertical texture cut visible in the earlier side view.

## Integration and publication scope

Work was isolated in `/tmp/jane-quality-revision` while the migration task was
editing, building and deploying the same files. After earlier delivery failures,
the authorized stop instruction was delivered successfully. “Plan 13times3.com
migration” acknowledged that it stopped edits, builds, commits, pushes and
deployments. Its already-pushed `29f138f` predates this handoff.

The local candidate preserves that task's later office furnishings, aquarium
inhabitants, environment changes and browser capture fixes. The candidate is integrated into the original checkout on top of `29f138f`.
The release build is checked against the reviewed model and client hashes; the
checklist records the result. Publication uses the existing main-branch GitHub
Pages workflow. The website release is an iteration with open art targets.

Do not describe this release as a completed art revision. The unchecked art
targets above remain active work. The later local field follow-up corrects the blueberry bushes to at least
adult height, while its character and atmospheric work remains open. The user explicitly
authorized publishing this iteration before those further improvements.

## Confirmed publication of this iteration

Commit `f28cbb7` was published at <https://13times3.com/explore/> on October 22.
The [GitHub Pages workflow](https://github.com/OlegYazvin/13times3/actions/runs/39855115360)
succeeded. The live gallery HTML, JavaScript, eleven GLBs and eleven paintings
match the saved release hashes exactly. Fresh live desktop and emulated phone
loads rendered the first room asset with no page errors or fallback activation.
Those smoke checks supplement the full local per-room functional checks; they
do not imply artistic acceptance or a physical-phone performance measurement.
The reviewed blueberry and portal follow-ups are released in this subsequent commit.

## Reviewed follow-up publication after the first iteration

The adult-height blueberry field and the shared painting/depth changes are
reviewed work after `f28cbb7`, included in this user-authorized publication. Their
source, model, painting and browser evidence are tracked separately from the earlier release. The physical phone, sustained
GPU performance, likeness and full environment/character artistic targets remain
open. The scene table records those weaknesses rather than declaring completion.

## Source-note privacy correction

The reference photographs themselves remain excluded from Git and site output.
A later source audit found pre-existing photo-derived dates, location notes and
timestamped filenames in repository documentation. Those details have been moved
to ignored private notes and redacted from the current tracked documents. Earlier
public Git commits still retain their historical text; this change does not
rewrite shared repository history. Public farm pages remain visual references,
without publishing the photographs' metadata or asserting a visit date.

The source-note redaction was published separately in `d946d79`; its
[Pages workflow](https://github.com/OlegYazvin/13times3/actions/runs/39867455776)
succeeded. That commit changes five documentation files only and leaves the
published gallery assets at the reviewed `f28cbb7` iteration. The later art and
renderer changes described above are included in the subsequent reviewed publication.

## Verification of the reviewed follow-up

All eleven final model/painting/client hash sets have current desktop and fresh
portrait-phone functional and walkaround evidence. The final field contact
correction was exported and rechecked separately. Global controls, resize,
fallback and failed-load behavior pass; aquarium fish motion and both routes
around the freestanding portal pass. Build/site checks preserve all 39 original
achievement routes, 41 frame IDs and blank frames 12–41. This is functional
verification and saved visual evidence, with the artistic weaknesses in the
scene table still open.

Representative local comparisons:
[adult-height field](../.cache/blueberry-height/index.html) and
[portal reveal/depth](../.cache/portal-projection/index.html). The illustrated
walkthrough includes each room's normal, side, rear, contact and phone views.
