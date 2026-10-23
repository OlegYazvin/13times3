# Frame 04: Zephrine's blue car

Oleg clarified that the car is a blue Step2 Whisper Ride II toddler push car, not a family vehicle. The scene should show Oleg and Jane pushing while Zephrine drives enthusiastically along Roscoe Village streets near Melrose and Leavitt. Keep the memory about the family's shared walk; do not invent a purchase date, store, exact block address, or conversation.

The [manufacturer's product page](https://www.step2.com/products/whisper-ride-ii) confirms its molded blue shell, white wheels, steering wheel, parent push handle, cup holders and belt as visual reference. The room uses its own sculpted interpretation and no manufacturer imagery or logo.

The [manufacturer's product page](https://www.step2.com/products/whisper-ride-ii) confirms the toy's curved blue body, parent push handle, steering wheel, horn, and wheels. Oleg supplied a direct Amazon reference to the same product. Model an original stylized 3D car informed by those forms rather than embedding a product image or logo.

[Roscoe Village Neighbors](https://www.roscoevillage.org/zoning/zoning-principles/) describes the neighborhood as pedestrian-oriented. Use the area's tree-lined residential blocks, brick facades, parkways, and Chicago street rhythm as visual research; the scene can feel like Melrose and Leavitt without claiming a particular private home. This room is distinct from frame `03`: a friendship reference happens to show Charlize and Zephrine riding in a blue car, but this memory centers Oleg and Jane pushing Zephrine together, with no Charlize or Aibike in the scene.

The published room uses an original sculpted blue car with a curved body, open seat, steering wheel, four wheels, and shared push handle. Jane and Oleg are recognizable, stylized 3D figures behind Zephrine. The neighborhood's brick facades are an invented composite; no exact home or purchase location is claimed. The painting and walkable room come from the same model and camera.

2026-10-22 detail pass: one stack of windows in each composite two-flat now projects as a three-sided glazed bay with continuous stone sill, cap, and spandrel; the porches gain mounted lanterns. The repeated gold wheel rings in the road were removed in favor of a few flush cast-iron utility covers. Zephrine's modeled curls sit closer behind her painted face so the crown does not become a large helmet, and Oleg's tiny shirt embroidery was suppressed in this room because it read as an accidental scribble at walking distance. No exact house, address, or date is asserted.

October 22 street finish: the road and sidewalk pigment assignment was backwards in the original floor mesh, making Zephrine appear to drive on beige sidewalk. The center lane is now asphalt gray and the tree-lined sidewalks are warm stone. A small procedural mortar-and-brick map, varied physical parapets and deeper attached tree crowns give the repeated composite two-flats a less flat silhouette. Nonwalkable pavement and additional buildings and trees extend into the sky beyond the authored collision boundary, replacing the abrupt empty edge when the visitor turns away from the car. These are invented neighborhood rhythms, not exact properties at Melrose and Leavitt. The car, parents, frame ID, and collision route stay as before.

October 22 parkway-tree revision: the previous smooth oval canopies looked like repeated primitive loaves, especially from inside the room. The fourteen foreground street trees now use the [Quaternius CC0 tree model](https://poly.pizza/m/qZtx0AHhcy), scaled, rotated, and recolored to fit the room. Each tree is a complete 3D trunk and branching canopy with layered foliage, not a single whole-tree billboard. Its source normal map is discarded to reduce the mobile model size; a narrow trunk collision core preserves the sidewalk obstacle without making leaves block the path. The rest of the street, people, toy car, and story remain as before. This is still a stylized composite of Roscoe Village, not a literal model of Melrose and Leavitt.

## Geometry-first local revision, October 22

The active local revision replaces the old portrait-panel people with the
shared geometry-first sculpt and scene-specific contact poses. Reference
photographs remain private and are not used as public textures. The memory,
people and frame assignment remain unchanged. See
[the acceptance checklist](scene-revision-checklist.md) for actual visual and
functional verification; this note alone does not mark the room complete.

The local car now has a real cabin cut through its molded shell and a recessed
footwell. The earlier solid extrusion intersected the occupied seat. The car
is resized to `.6 × .78 × .68` of that study; the child fits its seat and floor,
and both steering and parent grips are posed to the revised geometry. Side,
rear, close and phone views show the occupied cabin. Upright ground-leaf
scatter that looked like floating polygon flags is removed. The street and
vehicle trim remain simplified; do not treat these contact fixes as complete
environment acceptance.

Hair follow-up: the earlier instruction to fit Zephrine's curls tightly behind
the face understated her real amount of hair. Oleg's later correction and
[shared reference notes](character-zephrine-notes.md) take precedence: preserve
her full curly silhouette when checking the car pose.

Portal follow-up: the local painting now uses the shared physical-frame
projection from the hall, with a shorter cutout interval. A separate depth
pass prevents unrelated hallway walls from covering distant room scenery.
See [the shared evidence report](scene-revision-report.md) for verification and
remaining artistic weaknesses. This does not change the memory or frame ID.

Publication status: the reviewed adult-height field and shared portal follow-ups
are included in the user-authorized release after `f28cbb7`. Earlier local-pass
wording above records the development sequence. Artistic acceptance remains open.

## October 23 coupled toy-car study

The active local candidate fits the car to the manufacturer's approximately
0.864 m height × 0.483 m width × 1.156 m depth envelope, including the parent
handle. The previous scaled authoring block was oversized. The molded seat is
lower and rounded, the cabin and bonnet are separated to make real foot room,
the steering ring tilts toward its driver, and a joined curved stem carries the
smaller parent grip. Jane, Oleg and the car move forward together. The actual
manufacturer pose image is reference only; no product pixels or logo enter the
model. This is still an original storybook interpretation.

The first new export passed people-to-people checks but failed prop checks:
toes entered the blue shell by up to 42 mm, the thighs missed the seat by about
9.5 mm, and the grips penetrated the rods. Those are actual geometry failures,
not portal defects. The cabin, leg arrangement, seat height and hand poses are
being revised against decoded prop triangles. Treat the latest export as a
candidate until its full contacts and walking views are checked again. The
street, silhouettes and emotional acceptance remain open.

### Current exported evidence, October 23

The current full prop check finds no tested vertices deeper than 1 mm against the actual footwell, shell, seat, seatback, steering rim and both parent grips. Seat support is within 0.66 mm; both parent grips meet within 0.46 mm. The child leans forward from the backrest intentionally. The street buildings continue behind their facades and beyond the walk, while the car and family move together in the composition. Desktop and fresh portrait-emulation walking/return/collision checks pass at the current hash. A new child joy expression is sculpted in geometry.
