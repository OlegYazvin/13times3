# Frame 11: Shedd Aquarium with G

Oleg's scene idea: “We took zephrine to the Shedd aquairum with G.” G is Oleg's mother and Zephrine's grandmother. She is **not** Anna Shersher, who is Jane's mother. Frame `11` is now authored as a walkable room.

## Private character references

The uploaded `/data/Downloads/Photos-1-001(4).zip` contained four photos. Resized, EXIF-free JPEG copies are saved in `.secrets/reference-photos/g-shedd-aquarium/`, excluded from Git and the published site:

- `IMG20260605162445.jpg`: G outdoors with Zephrine on her shoulders. G has a shoulder-length brown bob and dark rectangular glasses in this photo.
- `IMG_5685.jpg`: screenshot of a call showing a close view of G wearing glasses, with Zephrine in a small inset. The screen interface is not part of the character reference.
- `IMG20251026161356.jpg`: G holding Zephrine outdoors. G wears dark glasses and a dark quilted jacket; Zephrine wears a pale knit cap and floral vest.
- `IMG_9884.jpg`: G behind Jane in a close portrait. G has no glasses here, making her green eyes and face shape clearer; Jane is the younger woman in front with her hair in a bun. Use the existing private Jane photos for her other angles.

These photos identify likenesses, not the aquarium's location, date, exhibit visited, or actions during the visit. Do not publish the originals or private reference copies without a separate request.

## Atmosphere and setting

Oleg wants inspiration from photographs of the real Shedd Aquarium without a literal reconstruction. Aim for a majestic, coherent 3D storybook aquarium with recognizable architectural cues and a family-centered frozen moment. The fish can drift or turn slightly in a restrained loop while the people and main moment remain still. Do not make the entire tableau a static flat image.

On 2026-10-21, Oleg chose **G and Zephrine wondering at the fish together** as the central moment. Give G a clear, affectionate role beside Zephrine. Keep Jane and Oleg present only as the composition supports the family memory; do not invent a named exhibit they visited.

The room uses [Shedd's history of the building](https://www.sheddaquarium.org/about-shedd/vision/history) and [Wonder of Water in its historic rotunda](https://www.sheddaquarium.org/exhibits/wonder-of-water) for visual vocabulary: pale marble, a water-themed glass dome, and contrasting tall freshwater and saltwater habitats. This is a symbolic aquarium, not a claim that the family saw a particular exhibit. The visit date was not supplied.

## Portal topology and movement requirement

The **actual gallery aperture** is now the central freestanding arch at local `z = 10.4`, while the aquarium continues to `z = 13.4`. Walking around either post and behind that aperture stays inside the aquarium. Crossing the active face from the main gallery floor exits. From the aquarium side behind the arch, the opening looks back into the aquarium rather than falsely showing a second hall exit. The hallway and aquarium remain isolated stencil worlds; the camera pose and field of view stay continuous across the active face.

Three-dimensional fish drift inside side and end habitats, behind glass, with sculpted reeds, coral, shell details, and stone mullions. Painted reef and river textures add distance at the back of those volumes; they are not fish cutouts. The illustrations were generated for this project from a storybook habitat prompt, with no real family photographs or source photo metadata included.

The 2026-10-21 finish pass adds species-specific sculpted turtles and seahorses, modeled coral plates in front of the distant paintings, and a continuous painted ceiling above the space behind the freestanding portal. The ceiling texture was generated with the built-in imagegen tool and saved as `scripts/assets/room11/canopy-watercolor.webp`. Prompt: “Square, richly layered hand-painted gouache and watercolor aquamarine surface: overlapping translucent tide currents, subtle pearlescent caustic light, fine paper grain, deep teal at edges grading to luminous sea-glass blue toward the center; architectural, detailed, low contrast behind 3D gold dome ribs and carved marble columns; no fish, people, coral, text, border, photograph, perspective room, or hard circular motif.” It is mapped onto actual curved vault geometry, not used as a flat room backdrop.

The next rear-habitat pass places a five-fish focal school at eye height between the freestanding portal and the distant painting. A turtle moves to the left of that view, leaving the center clear. Saltwater and river paintings are slightly quieter so the sculpted animals read in front of them. The shared fish now have smoother continuous body profiles, joined forked tail membranes, shaped dorsal and belly fins, and fine fin rays instead of angular petal stand-ins. The aquarium still needs further close art review, especially its people and the architectural transition around the return portal.

The 2026-10-22 fish study adds five copies of the [CC0 Khronos BarramundiFish sample](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BarramundiFish): two at the rear glass and three inside the overhead water lens. The original GLB is 12.49 MB, mainly because of 2048-pixel textures. Its atlas was repainted in pearl-blue gouache with the built-in imagegen tool, then reduced to a 512-pixel WebP atlas and a 229 KB source GLB at `scripts/assets/room11/barramundi-painted.glb`. The prompt requested the same approximate UV islands, pearlescent blue scales, warm gold fins, neutral atlas background, no labels, and no change to the original fish geometry. The optimized model is built into the room GLB and is not separately served. The species name is a source credit, not a claim that the family saw that species at Shedd. The private family reference photographs are not used in this fish asset.

This memory is distinct from the Open House Chicago outing in frame `08` and the Maggie Daley Park visit in frame `10`.
