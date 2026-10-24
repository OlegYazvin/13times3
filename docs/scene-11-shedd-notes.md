# Frame 11: Shedd Aquarium with G

Oleg's scene idea: “We took zephrine to the Shedd aquairum with G.” G is Oleg's mother and Zephrine's grandmother. She is **not** Anna Shersher, who is Jane's mother. Frame `11` is now authored as a walkable room.

## Private character references

Four supplied reference photographs were reviewed privately. Resized, EXIF-free JPEG copies are saved in `.secrets/reference-photos/g-shedd-aquarium/`, excluded from Git and the published site:

- Private portrait reference: G outdoors with Zephrine on her shoulders. G has a shoulder-length brown bob and dark rectangular glasses in this photo.
- Private portrait reference: screenshot of a call showing a close view of G wearing glasses, with Zephrine in a small inset. The screen interface is not part of the character reference.
- Private portrait reference: G holding Zephrine outdoors. G wears dark glasses and a dark quilted jacket; Zephrine wears a pale knit cap and floral vest.
- Private portrait reference: G behind Jane in a close portrait. G has no glasses here, making her green eyes and face shape clearer; Jane is the younger woman in front with her hair in a bun. Use the existing private Jane photos for her other angles.

These photos identify likenesses, not the aquarium's location, date, exhibit visited, or actions during the visit. Do not publish the originals or private reference copies without a separate request.

## Atmosphere and setting

Oleg wants inspiration from photographs of the real Shedd Aquarium without a literal reconstruction. Aim for a majestic, coherent 3D storybook aquarium with recognizable architectural cues and a family-centered frozen moment. The fish can drift or turn slightly in a restrained loop while the people and main moment remain still. Do not make the entire tableau a static flat image.

On 2026-10-21, Oleg chose **G and Zephrine wondering at the fish together** as the central moment. Give G a clear, affectionate role beside Zephrine. Keep Jane and Oleg present only as the composition supports the family memory; do not invent a named exhibit they visited.

The October 22 figure pass replaces G's generic sculpt with a posed, clothed 3D body, curved painted likeness, continuous short bob, and subtle blouse stitching. It is shared with frame `07`; compare her front and three-quarter views beside Zephrine in the actual aquarium lighting. G's reaching gesture meets Zephrine's uplifted hand near the curved tank, which now contains two more painted sculpted fish. The child and their hand gestures still need close art review.

The curved tank's original smooth dark mound and nine stiff plant stalks blocked its inhabitants from the visitor's view. A low broken-edged reef shelf, a small set of curved seagrass ribbons, layered plate coral, and branching sea fans now leave more open water in front of the fish. Check this from the viewing path as well as the preview: a dense sea plant that looks fine from above can become a flat wall of polygons through the glass.

The room uses [Shedd's history of the building](https://www.sheddaquarium.org/about-shedd/vision/history) and [Wonder of Water in its historic rotunda](https://www.sheddaquarium.org/exhibits/wonder-of-water) for visual vocabulary: pale marble, a water-themed glass dome, and contrasting tall freshwater and saltwater habitats. This is a symbolic aquarium, not a claim that the family saw a particular exhibit. The visit date was not supplied.

The October 22 architecture pass uses Shedd's description of an ornate crown and historic marble details as loose inspiration. The rotunda's visible supports are now continuous fluted stone meshes with carved shell-like capitals, rather than plain polygon shafts. A broad carved arch and fine gold inner wave frame the rear habitat overhead; the painted deep water extends high enough to meet the vault instead of ending in a visible straight band when approached from behind the freestanding portal. The aquamarine terrazzo receives small mineral specks and a restrained water wash; an early stronger caustic pass was rejected because it made the floor blotchy. The fish in the walk-under water lens use lighter pearl, rose and gold pigments. These changes add finish to the same symbolic room and do not assert which exhibit the family visited.

## Portal topology and movement requirement

The **actual gallery aperture** is now the central freestanding arch at local `z = 10.4`, while the aquarium continues to `z = 13.4`. Walking around either post and behind that aperture stays inside the aquarium. Crossing the active face from the main gallery floor exits. From the aquarium side behind the arch, the opening looks back into the aquarium rather than falsely showing a second hall exit. The hallway and aquarium remain isolated stencil worlds; the camera pose and field of view stay continuous across the active face.

Three-dimensional fish drift inside side and end habitats, behind glass, with sculpted reeds, coral, shell details, and stone mullions. Painted reef and river textures add distance at the back of those volumes; they are not fish cutouts. The illustrations were generated for this project from a storybook habitat prompt, with no real family photographs or source photo metadata included.

The 2026-10-21 finish pass adds species-specific sculpted turtles and seahorses, modeled coral plates in front of the distant paintings, and a continuous painted ceiling above the space behind the freestanding portal. The ceiling texture was generated with the built-in imagegen tool and saved as `scripts/assets/room11/canopy-watercolor.webp`. Prompt: “Square, richly layered hand-painted gouache and watercolor aquamarine surface: overlapping translucent tide currents, subtle pearlescent caustic light, fine paper grain, deep teal at edges grading to luminous sea-glass blue toward the center; architectural, detailed, low contrast behind 3D gold dome ribs and carved marble columns; no fish, people, coral, text, border, photograph, perspective room, or hard circular motif.” It is mapped onto actual curved vault geometry, not used as a flat room backdrop.

The next rear-habitat pass places a five-fish focal school at eye height between the freestanding portal and the distant painting. A turtle moves to the left of that view, leaving the center clear. Saltwater and river paintings are slightly quieter so the sculpted animals read in front of them. The shared fish now have smoother continuous body profiles, joined forked tail membranes, shaped dorsal and belly fins, and fine fin rays instead of angular petal stand-ins. The aquarium still needs further close art review, especially its people and the architectural transition around the return portal.

The 2026-10-22 fish study adds five copies of the [CC0 Khronos BarramundiFish sample](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BarramundiFish): two at the rear glass and three inside the overhead water lens. The original GLB is 12.49 MB, mainly because of 2048-pixel textures. Its atlas was repainted in pearl-blue gouache with the built-in imagegen tool, then reduced to a 512-pixel WebP atlas and a 229 KB source GLB at `scripts/assets/room11/barramundi-painted.glb`. The prompt requested the same approximate UV islands, pearlescent blue scales, warm gold fins, neutral atlas background, no labels, and no change to the original fish geometry. The optimized model is built into the room GLB and is not separately served. The species name is a source credit, not a claim that the family saw that species at Shedd. The private family reference photographs are not used in this fish asset.

The next aquarium finish pass places one more of those painted 3D fish at eye height in each flanking habitat, bringing the sculpted copies to nine. The long rear tank sill is now a shaped stone plinth with an uneven upper contour, carved watercourse and shallow shell fans, while the deep painted water reaches the vaulted ceiling so no blank strip appears when the visitor looks back from behind the freestanding portal. The added fish and stone stay behind collision boundaries. The room remains an imagined, family-centered Shedd memory, not an inventory of observed species or exhibits.

This memory is distinct from the Open House Chicago outing in frame `08` and the Maggie Daley Park visit in frame `10`.

The October 22 return-portal pass adds a broad carved stone arch joined to the two freestanding posts, plus shaped collars at their tops. The passage below remains the same size, and both routes around and behind the portal remain in the aquarium. A desktop route probe also confirmed that the rear tank sill still blocks entry into the glass habitat. The sculpted child has smaller, proportionate footwear and subtle fabric fold shading; her reference-based face and hair silhouette stay at their prior size after smaller-head and scalloped-cap trials read less faithfully.

The October 22 rotunda finish removes the repeated circular floor seams and most of the wire-like concentric tracery from the water vault. Two slightly irregular hand-laid tidal borders and one joined marble dome rim retain its architecture without making the space read as a digital target. Small beveled shell reliefs now sit on the central tide-pool lantern's sculpted stone plinth. Desktop walk-through confirmed both routes around the freestanding portal remain open, its rear is a real part of the aquarium, and the rear viewing sill still blocks walking into the tank. The figures, especially their faces and hands at doorway scale, still need further art review.

October 22 habitat-painting revision: the built-in imagegen editing tool transformed the four original reef and river backdrop compositions into versioned, hand-painted gouache and watercolor variants. The common prompt kept the original wide underwater layout and habitat distinction, moved the recognizable detail toward the edges and seabed, left calmer open water in the middle for the actual 3D fish, and asked for visible brushwork and light shafts without photographed animals, people, writing, or hard panel borders. Each of the four original images was edited separately; the results are `scripts/assets/room11/{reef-backdrop,reef-variant,river-backdrop,river-variant}-painted-v2.webp`. The older assets remain available for comparison. These are distant painting layers only: modeled fish, coral, kelp, glass, mullions, and collision boundaries remain in front of them. Desktop and portrait-phone views were compared from the side glass, rear sill, rotunda, and portal back. The family figures and fish still need close art review.

October 22 rear-habitat revision: the flat, dark rear tank floor is now one undulating 3D sand mesh with subtle tidal pigment and the room's existing light wash. Its removed polygonal stones and stacked plate coral were tested in screenshots from the rear sill; both looked like separate geometric props against the painted reef. The tallest center branches moved out of the fish sightline. A fluted stone pier now deliberately separates the differently colored rear habitats, hiding their hard painting seam on both desktop and phone. Three compact CC0 Smithsonian coral scans (brain, birdsnest, and lace coral, available through another open-source project's optimized assets) were also imported as a trial. Their decimated silhouettes and rectangular specimen bases looked worse at this scale, even with a simplified pigment material, so neither those files nor their geometry ship in the room. Keep the actual fish and habitats in 3D and judge future coral at eye level and from the portal, not solely in a model viewer.

Next October 22 ceiling continuity pass: a side walk inside the rotunda exposed a dark sky wedge between the round dome and the long rear vault. A curved, painted shoulder now joins those two ceiling meshes behind the freestanding portal. The rear vault uses matching texture coordinates at that joint. The isolated turquoise floor guide curves around the return opening were removed because they read as loose rods; the routes around both portal posts remain physically open. The same Oleg likeness revision used in the other seven Oleg rooms is rebuilt into this room. These changes add no claim about which Shedd exhibits the family visited.

## Geometry-first local revision, October 22

The active local revision replaces the old portrait-panel people with the
shared geometry-first sculpt and scene-specific contact poses. Reference
photographs remain private and are not used as public textures. The memory,
people and frame assignment remain unchanged. See
[the acceptance checklist](scene-revision-checklist.md) for actual visual and
functional verification; this note alone does not mark the room complete.

In the local revision the curved habitat is centered at `x=3, z=7`, beside G
and Zephrine’s actual shared attention. Its close fish move with that habitat;
the additional wall schools and manta from the migration task remain. The
freestanding portal is unchanged, with both side routes, rear access and
back-to-front traversal checked while staying in the aquarium. Canopy joins,
material consistency and empty floor composition remain open art issues.

The overhead water lens now holds one small, recolored [CC0 manta model by Quaternius](https://quaternius.com/packs/animatedfish.html). Its formed wings and tail read as an animal from below, without a sphere or egg stand-in. An earlier procedural ray with a smooth oval body was rejected after the room view. The model remains static in this frozen family moment; the existing small 3D fish continue their restrained drift. The source GLB is bundled into the room and adds about 100 KB of authored source, keeping the downloaded room below 8 MB.

October 22 rear-fish finish: four small groups of genuinely sculpted clown, tang, and reef fish now occupy separate positions and depths behind the rear glass. They adapt [Babylon.js Assets’ `fish.glb`](https://github.com/BabylonJS/Assets/blob/master/meshes/fish.glb), whose repository states [CC BY 4.0](https://github.com/BabylonJS/Assets/blob/master/LICENSE) unless a folder overrides it; no separate override was found for this file. The source’s 41-second animation and unused skinning were stripped, textures resized to 512 pixels and converted to WebP, and the remaining meshes posed as still groups with only the gallery’s tiny breathing drift. The raw 47.6 MB source became a 1.2 MB authoring asset; the complete room download remains under 8 MB. A first trial stacked all species together into a visually confusing cluster and was rejected after a walkable rear-glass screenshot. The separate groups were checked at the rear sill and from the portal loop. These species are imaginative aquarium inhabitants, not a factual record of what the family saw.

October 22 side-habitat follow-up: six more groups of those formed 3D fish now occupy both long aquariums at separate heights and depths, sharing the already bundled species geometry and materials. The oversized procedural foreground fish were removed from those panes; their simple bodies had become the most prominent shapes at walking distance. The smaller procedural fish remain farther back to give the water a sense of scale. Each group stays behind glass and drifts subtly. The freestanding portal, both walk-behind routes, and the rear tank collision are unchanged.

The overhead manta's pigment is lifted from nearly black to a muted blue-green with a pale underside, letting its sculpted wing and tail read through the water lens from the room floor. It remains an imaginative inhabitant, not a claim about the family's exact exhibit.

Zephrine hair follow-up: retain the abundant curls shown in her private
references. The local shared model now has fuller sides, temple curls and nape
volume. See [her character notes](character-zephrine-notes.md) and the shared
checklist for the exported pose review; this does not mark the scene's wider
artwork complete.

Portal follow-up: the local painting now uses the shared physical-frame
projection from the hall, with a shorter cutout interval. A separate depth
pass prevents unrelated hallway walls from covering distant room scenery.
See [the shared evidence report](scene-revision-report.md) for verification and
remaining artistic weaknesses. This does not change the memory or frame ID.

Publication status: the reviewed adult-height field and shared portal follow-ups
are included in the user-authorized release after `f28cbb7`. Earlier local-pass
wording above records the development sequence. Artistic acceptance remains open.

## Continued native sculpture review, October 23

The October 23 local study directs G and Zephrine’s heads and pointing indices toward the same nearby sculpted fish at its authored drift center. The dome, shoulder and rear vault use continuous world-space canopy UVs, removing a known texture-coordinate discontinuity; that source correction still requires the actual side-route images. Loose floor shell loops are removed. Fish movement, the four people and the freestanding portal with both walk-around paths remain required.

The overhead water lens had a real mesh/ceiling conflict: its constant 5.95 m
upper rim and 6.70 m support endpoints exceed the dome toward its outer edge.
The next source fits the complete upper rim, glass edge and supports beneath
the dome's actual curved height. This is a geometry revision, distinct from
shared canopy texture coordinates. Keep the moving fish and both portal paths
in the next exported verification.

### Current exported evidence, October 23

The fitted overhead tank rim and supports, continuous canopy UVs and shared fish attention complete a current-hash desktop and fresh portrait-emulation walkthrough, including views behind the freestanding portal. Both routes around the posts remain clear, fish drift remains active, and return, control and cleanup checks pass. The rich habitat painting remains an artistic contrast with the modeled foreground and should be judged separately from those functional results.

The later side/portrait review still found canopy clutter and a weak phone
composition. Habitat arches reached above the old round roof, while secondary
ribs exposed loose ends. A new local study uses one continuous water vault,
three complete shell arches and grounded column assemblies, with fewer overhead
tank supports. The close tank and its detailed fish move together; G and Zephrine
move back and toward the doorway center so the portrait view can include both
people and their shared fish. The same four people, moving inhabitants and
freestanding return portal remain. Re-export and inspect this study before
calling the canopy or phone staging resolved.

## Slightly hidden mermaid, October 23

At Oleg's request, a small dimensional mermaid is tucked into the right-hand
saltwater habitat beside its existing coral fan. She is a fantasy discovery,
not a claim about an actual Shedd exhibit. G and Zephrine retain their shared
fish attention and doorway composition. The same frame, memory, family,
moving fish, portal and walking routes remain.

The clothed upper body uses the existing CC0 anatomical base and connected
storybook garments, with an original curled, finely scaled tail, forked fin
and broad flowing copper hair. There is no portrait panel or new photographic
texture. The entire sculpture stays behind the existing tank collision; its
figure-only collision tags are removed rather than adding blockers in the
visitor aisle. Source: [aquarium_mermaid.mjs](../scripts/aquarium_mermaid.mjs).

The first exported close view exposed inherited glasses and a real tail/reed
intersection. The final study explicitly removes the glasses, relaxes both arms
and moves the whole mermaid forward of the reeds. The existing coral partly
screens her from the aisle; approaching the glass reveals her face and curled
tail. Oblique inspection distinguishes the background plants' projected overlap
from an actual mesh intersection.

Final-export review passes doorway, aisle, close, oblique and portrait-phone
inspection, plus desktop/phone entry, movement, return, fish drift, both portal
loops and cleanup checks. All 65 exported collision footprints exactly match
the existing manifest fallback. No trouser or shoe inserts survive inside the
tail. Site checks retain 39 achievement pages and 41 frame IDs; all 19 unit
tests and geometry checks pass. The model is 6,466,364 bytes, with its unchanged
80,628-byte hallway painting. Physical-phone frame rate is not claimed.

See [doorway](scene-evidence/11-mermaid/doorway.webp),
[aisle](scene-evidence/11-mermaid/aisle.webp),
[close](scene-evidence/11-mermaid/close.webp),
[oblique](scene-evidence/11-mermaid/oblique.webp),
[phone](scene-evidence/11-mermaid/phone.webp) and the
[current-hash verification](scene-evidence/11-mermaid/verification.json).
Oleg subsequently rejected this mermaid's appearance as creepy. The functional
passes above did not establish artistic acceptance; these images record the
rejected `40b3c01` version.

## Original animated Ariel revision

Oleg specified Ariel from Disney's original 1989 *The Little Mermaid*. The
replacement removes the generic sweater figure and its blank expression,
using a sculpted face with blue eyes, swept red hair, a fitted purple shell
top and a continuous green tail with flowing pale fins. The fantasy discovery
stays in the same right-hand tank; no family member, memory, portal or frame
assignment changes.

The upper anatomy and hands adapt Blender Studio's CC-BY Rain v3.3 rig. The
body, face, eye whites, blue irises, pupils, lids, mouth and hands are actual
geometry. The upper body's pose is frozen from the current weighted body,
with newly assigned materials and vertex pigment. Project-authored hair is
fused into one closed volume; shells are fitted to the chest surface and the
tail cross-section is aligned with the waist. Source attribution, archive
and adaptation details are in
[the asset license](../scripts/assets/room11/ariel-upper.LICENSE.md), and the
public credits page carries the required Blender Foundation credit.

Rebuild the upper source with Blender 4.5.9, `--background --disable-autoexec
--python-exit-code 1`, the downloaded `rain_v3.2.blend`, and
`--python scripts/build_ariel_base.py`; then run `npm run build:room11`.
Embedded scripts in the source blend are not run.

Local review checklist:

- [x] Inspect the source sculpture from front, three-quarter, profile and rear.
- [x] Remove the backup-body export that failed to carry the arm pose; retain
  both complete hands above the torso's crop plane.
- [x] Preserve eye material indices when replacing source materials; the first
  trial incorrectly exported only white eyes.
- [x] Refit the shell band to the torso and remove a floating waist collar.
- [x] Inspect the packed model in aquarium light, including aisle, close,
  oblique and fresh portrait-phone views.
- [x] Verify the unchanged collision, moving fish and both portal loops.

The final room model is 7,103,920 bytes plus its unchanged 80,628-byte painting.
All 65 collision footprints exactly match the existing fallback. The full
desktop and fresh portrait-emulation run checks entry, keyboard movement,
sustained touch turning, both portal-post loops, moving fish, camera continuity,
return and cleanup. Site checks pass with 39 achievement pages, 41 stable IDs
and all 19 unit tests. These functional results remain separate from the
visual judgment recorded in the images; physical-device frame rate is not claimed.

Current evidence: [close](scene-evidence/11-ariel/close.webp),
[aisle](scene-evidence/11-ariel/aisle.webp),
[oblique](scene-evidence/11-ariel/oblique.webp),
[phone](scene-evidence/11-ariel/phone.webp),
[doorway](scene-evidence/11-ariel/doorway.webp), and
[verification](scene-evidence/11-ariel/verification.json).
The phone view includes the full tail, with a foreground reed partly screening
the figure; the close and oblique desktop views reveal her face. The previous
mermaid evidence stays in `11-mermaid` as a rejected comparison. This revision
does not mark the aquarium's wider artistic backlog complete.

## Enclosed tanks and a hidden coral discovery

The next user revision keeps this same frame and family memory. Baseline
doorway, side, rear and portrait views show nearly invisible glazing, rear
panes with a central gap, and an overhead lens whose inhabitants read as
swimming through the hall. A turtle at `(2.37, 2.78, 3.83)` is actually outside
the round exhibit centered at `(1.6, 6)`. Ariel is too exposed against sparse
branches. These are observed defects, rather than accepted dream distortions.

Current checklist, reviewed against the packed export:

- [x] Put every animal inside an explicit aquarium volume, including its drift.
- [x] Replace open/incomplete glazing with framed, sealed viewing fronts;
  add recessed beds, water surfaces, closed ends and tank roofs.
- [x] Rehouse the overhead animals and misplaced turtle inside wall exhibits.
- [x] Place Ariel deeper in the side reef, screened by dimensional coral,
  with a discoverable face and no contact with the coral or glass.
- [x] Inspect doorway, side tanks, round exhibits, rear habitat, ceiling,
  mermaid close/oblique views and a fresh portrait-phone load.
- [x] Check current geometry, aquarium containment, collision fallback,
  moving fish, both portal loops, controls, return and cleanup.
- [ ] Publish only the reviewed result and verify the live assets.

The side and end exhibits now have continuous, physically thick glass fronts,
beveled stone surrounds, recessed sediment beds, opaque end returns, waterlines
and closed hoods. The rear front's old central opening is gone. The side habitat
paintings and walls sit farther behind their glass, with exhibit lighting inside
the water. The two round exhibits have capped water surfaces and shaped rims.
The overhead lens is removed; its fish and manta, along with the misplaced
turtle, have been rehoused inside the wall exhibits. The manta's posed skin is
baked before fitting its actual rendered shape to the water.

Ariel sits deeper in the right-hand reef. Fused branching colonies, a ridged
brain coral and thick ruffled plates screen her lower body and parts of her
silhouette. From an oblique aisle view a colony partly covers her face; moving
along the glass reveals it. The coral is separate geometry in front of and
behind her, with measured clearance rather than an intersection hidden by the
camera. An early bare-branch study was replaced, and inward-facing brain-coral
triangles were corrected after they looked like a hollow ring in close review.
Two unit tests now check the brain and plate surfaces' outward orientation.

The reviewed model is **7,789,020 bytes**, SHA-256
`8acfbe4b848a2736d2297e26d8868932d11db6b8e287d37ebd2b28697aa1413f`,
plus a 79,448-byte hallway painting. The packed geometry check samples
13,284,105 vertex positions across the actual swimming motion: all 95 animal
and school groups remain inside six defined water volumes. The seven coral
parts clear Ariel's bounding box by at least 0.11 m. All 69 browser collision
footprints match the revised manifest fallback within 0.002 m.

The current-hash desktop and fresh portrait-emulation review passes entry,
keyboard movement, sustained touch turning, moving fish, both routes around
the freestanding return portal, continuous return and cleanup. Site and geometry
checks pass with 39 achievement URLs, 41 stable frames, twelve assigned rooms
and 27 unit tests. These checks establish function and containment separately
from the visual judgment in the screenshots. Physical-phone frame rate is not
claimed. The detailed painted backdrops still differ in finish from the simpler
modeled fish and people; this targeted revision does not close the wider art
backlog.

Evidence: [coral discovery](scene-evidence/11-tanks/coral-discovery.webp),
[close](scene-evidence/11-tanks/coral-close.webp),
[oblique](scene-evidence/11-tanks/coral-oblique.webp),
[front tank](scene-evidence/11-tanks/front-tank.webp),
[rear tank](scene-evidence/11-tanks/rear-tank.webp),
[clear ceiling](scene-evidence/11-tanks/clear-ceiling.webp),
[round tank](scene-evidence/11-tanks/round-tank.webp),
[behind the portal](scene-evidence/11-tanks/portal-back.webp),
[phone](scene-evidence/11-tanks/phone.webp),
[phone coral discovery](scene-evidence/11-tanks/coral-phone.webp), and
[verification](scene-evidence/11-tanks/verification.json).
