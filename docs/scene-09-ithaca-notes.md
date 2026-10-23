# Frame 09: Ithaca friends and first apple picking

Oleg's scene idea: “We FINALLY visited our friends in Ithaca for the first time where Zephrine got to try apple picking for the first time.” Frame `09` is now the walkable room “First apples with friends”; the [author](../scripts/room09_author.mjs) and [manifest](../src/_data/gallery.json) define its artwork and portal. The two friends' children appear as unnamed sculpted figures pending names and additional detail from Oleg.

The supplied photographs and video were reviewed privately. Resized, EXIF-free JPEG references are stored locally under `.secrets/reference-photos/ithaca-apple-picking/`, which Git and the published site exclude. The video itself was not copied; three stills from it are stored privately in the same folder. Do not publish any original or reference file without a separate request.

Most direct references:

- Apple portrait reference: Zephrine in a teal vest and apple-print outfit, holding an apple. This is the clearest visual anchor for her first apple-picking experience.
- Farm-stand group reference: Oleg, Jane, Zephrine, Matt, and Tanya together at a farm stand. Oleg identified Matt and Tanya in his 2026-10-21 reply; he also says their two children were an important part of the overall visit. Ask for the children's names and the moment to emphasize before adding identifying labels.
- Autumn produce reference: autumn gourds and produce, useful only as a color and texture reference.

## Orchard visual references

Photo filenames, dates and location metadata are indexed only in ignored
private notes under `.secrets/source-notes/`. Do not copy them into source docs,
public assets or evidence reports.

The [farm's own site](https://www.grisamorefarms.com/) describes apple picking, a farm stand, cider, pumpkins, flower displays, and farm animals. [I Love NY](https://www.iloveny.com/listing/grisamore-farms/125560/) describes the store as a converted nineteenth-century dairy barn. These are grounded visual references for a stylized orchard world, not evidence that the family took a wagon ride, saw particular animals, or entered a particular part of the barn. Use the photographed apple-print clothing, teal vest, bitten apple, gourds, flowers, and group at the stand as the primary personal details. Ask Oleg for the friends' names and the moment he wants emphasized.

Other supplied photos show parts of the broader visit, including time indoors, a house exterior, a waterfall, a play area, meals, and farm animals. They may help with atmosphere, but the user has not said which details belong in the scene or who appears in each image. The photographed orchard and farm-stand setting is supported; avoid inventing house ownership, conversations, exact itinerary, or unpictured activities.

This differs from frame `07`, the blueberry-picking outing with G; frame `09` is the first Ithaca visit to friends and Zephrine's first time trying apple picking.

October 22 orchard detail pass: the ten egg-like procedural canopy volumes are replaced with shaped 3D foliage adapted from a CC0 Quaternius tree. The room keeps its own forked trunks and fruiting twigs; the imported foliage is crown only, so the apples and modeled branches remain the authored orchard rather than turning into a generic street tree. Apple stems now start at the actual branch ends, and the fruit is slightly smaller at walking scale. A phone view exposed Zephrine's two boxy teal vest panels crossing her lower face; shaped cloth panels now follow her torso below the neckline, leaving her expression and held apple visible. Loose foreground apples that looked like oversized balls are removed; fruit remains on the branches and in the basket. The room remains an independent, tall sky world behind frame `09`; this art revision adds no event or person.

## Geometry-first local revision, October 22

The active local revision replaces the old portrait-panel people with the
shared geometry-first sculpt and scene-specific contact poses. Reference
photographs remain private and are not used as public textures. The memory,
people and frame assignment remain unchanged. See
[the acceptance checklist](scene-revision-checklist.md) for actual visual and
functional verification; this note alone does not mark the room complete.

The final local contact pass fits cupped palms, curled fingers and thumbs around
the lower surface of the small apple. The apple-print fabric is a material on the
shirt; Jane turns toward Zephrine and places a hand at her shoulder, while Oleg
looks into the same interaction. Character replacement now precedes global leaf
batching: otherwise a leaf from the discarded figure survived at the scene root
and appeared through the new sleeve. The apple's bitten form, the sculpted hands
and the repeated orchard still need artistic refinement. This is not publication
or final likeness acceptance.

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

The October 23 local apple is a closed sculpted surface with a genuine concave bite and pale cut pigment. The separate flesh insert is removed. Both native cupped hands meet the exported apple with no tested vertices deeper than 1 mm. Orchard continuation was not being generated because a tree-name match missed the current authored groups; the source now extends their rows over the distant terrain with atmospheric fading. The apple contact check does not establish the vest, friends or landscape’s artistic acceptance.

A later rear/contact review confirms Jane's right hand penetrated the child's
shirt by about 33 mm. The source now lowers her crouch and fits an open palm
against the clothed upper back with an explicit hand axis. The vest was also
inside the shirt: it had inherited the reduced collision torso. Its new shell
uses the original ordered garment profile plus material thickness, and its
zipper is ray-fitted to that actual surface. Both corrections require the next
packed export; the preceding apple-only pass did not establish these contacts.

### Current exported evidence, October 23

The exported outer vest is now visibly teal and has a zipper sampled on its actual surface. Jane’s reassuring hand measures 0.40 mm from the vest and 5.05 mm from the inner shirt, with no tested penetration deeper than 1 mm or tested hand/vest edge crossings. The whole scene’s coarse inter-person scan has no flags. Both hands continue to support the real concave apple. Desktop and fresh portrait-emulation entry, walkaround, controls, return and cleanup pass at the current hash.
