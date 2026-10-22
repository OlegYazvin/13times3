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
