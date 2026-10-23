# Frame 02: Jane helped Oleg get a job

Oleg describes Jane as a constant source of support during a long job search. The room should make several versions of Jane visible at once: advising him at his desk, caring for Zephrine, doing household work, approaching strangers outdoors to find contacts, and holding him when the grind became too much. Fuse an interior desk space with an outdoor world in a dreamlike way. Do not display the company name or imply a specific employer, hiring date, conversation, or offer letter.

The attached desk photo is stored privately as `.secrets/reference-photos/oleg-desk.jpg`, resized and stripped of EXIF. Its distinctive details are a dark curved wooden desk; orange drawer cabinets; a large black monitor and two laptops; a gray upholstered swivel chair; wall-hung string instruments; a webcam; a drinking glass; and a pale wall. Zephrine appears in the photo but Oleg asked that her pose there be ignored. Use the furniture and atmosphere as reference, while sculpting Oleg and Zephrine in the 3D scene from their other private reference photos. Never publish the original or reference photo.

Frame `02` is now a walkable room authored in [`scripts/room02_author.mjs`](../scripts/room02_author.mjs). It is about Jane's sustained support of Oleg, distinct from frame `05` about Jane's own office move and standing up to management. The multiple Janes are clearly symbolic rather than separate literal people. Its blank pages and unbranded screens avoid inventing an employer or private work content.

## Likeness and finish revision

The first procedural figures read as generic block characters. The revised room uses the private Jane and Oleg photos only as references. Two generated gouache studies are kept privately in `.secrets/generated/room02/`; the compact derivative face textures in `scripts/assets/room02/` are embedded into the GLB on curved, modeled heads. Hair, ears, clothing, and bodies remain three-dimensional. These illustrations are not the source photos and contain no source photo metadata. Jane's high dark bun and face shape, and Oleg's side-parted hair, rectangular glasses, and short beard now have specific reference-guided features. The distant street has architectural window details and roofs; numerous loose rectangular paper stand-ins were replaced by a few modeled folded sheets.

The generated Jane study was prompted to preserve her recognizable brows, eyes, nose, lips, bun, and pearl earrings in a warm, hand-painted storybook gouache style, with a transparent background and no photo realism. The Oleg study used the same direction while preserving his side-parted dark hair, rectangular glasses, eyes, nose, and short beard. Their visible textures are cropped and compressed derivatives of those studies. When revising them, keep both faces in the same illustrated language as the sculpted set and verify that they still read as volumetric figures from oblique viewpoints.

October 21 art pass: the oversized sheet that hid Oleg's shirt and hands has been removed. An open, unbranded notebook with a sewn spine and short illegible lines now sits on the curved desk. The monitor and two laptops have small, abstract, unreadable work panes rather than empty rectangles. Jane's advising reach is shorter, while the household, outreach, and child-care versions gain an apron, satchel, and physically folded blanket respectively. Oleg's shared sculpted head has additional connected temple, ear, and nape hair volumes, used in all eight rooms where he appears. A new reference-guided head-only gouache image was made from his private portrait and the established illustrated style. Its small, muted WebP derivative at `scripts/assets/room02/oleg-face-v4-muted.webp` replaces the earlier texture in the room models; the generated source remains private. The doorway and close browser views were checked. The figures still need further clothing, gesture, and three-quarter portrait review before this can be considered a finished likeness.

October 22 likeness revision: `scripts/assets/room02/oleg-face-v5-reference.webp` is a compact 512-pixel derivative made with the built-in imagegen tool from the private Oleg portrait and the prior painted face as a style reference. Prompt: preserve Oleg's adult facial proportions, swept medium dark hair, rectangular glasses, gray-green eyes, broad nose bridge, natural closed mouth, and short uneven beard in a polished warm gouache head portrait with a transparent background, no clothes or text. The public texture is an illustration, not the reference photograph. The new face is fitted on the shared curved head; the duplicate sculpted glasses front and an oversized top hair cap were removed after checking frame `02` at close distance. The head still needs user art direction and three-quarter finish review.

October 22 continuous-head revision: a second generated portrait edit was tried against both private Oleg photos and the established `v5` artwork. It made almost no visible improvement on the actual 3D figure, so it was rejected. Instead, `scripts/generate_oleg_head_atlas.mjs` composes the existing illustrated face into a compact wraparound atlas with painted side and rear hair. `scripts/rigged_oleg.mjs` now applies that atlas to one curved, depth-shaped head. The nose, cheek, and brow relief is carried directly by the same sculpted surface, removing the separate facial panel that read as a mask beside a plain hair helmet. The head and clothed rig are shared by all eight rooms where Oleg appears. No private source photograph is copied into the public model. Close desktop and doorway-scale phone views were checked; resemblance, hair silhouette, and poses remain open to Oleg's art direction.

Later October 22 identity pass: Oleg said the shared figure still looked unlike him. A new `v7` gouache illustration was generated using **both** private Oleg photos as identity references and the older portrait only as a style guide. It is a small transparent WebP derivative in the public model, with no source photo or metadata. The shared wraparound head atlas and MediaPipe relief were rebuilt from this painting, and the sculpted jaw was broadened so its beard does not end in a point. Frame `02` was inspected again at desk distance. This is a closer interpretation, not final likeness approval; compare it with Oleg in all eight rooms and keep refining the poses, garments, and head from three-quarter views.

Next October 22 identity and ground pass: the built-in imagegen tool produced a new private study at `.secrets/generated/room02/oleg-v8-identity-study.png` using both private photos as identity references and `v7` only as the gouache style guide. The prompt asked for Oleg's broad lower face, grey-green eyes, rectangular black glasses, swept medium dark hair, short uneven beard, and natural expression, explicitly avoiding a pointed chin, narrow nose, oversized eyes, and helmet hair. Its public 512-pixel transparent derivative is `scripts/assets/room02/oleg-face-v8-reference.webp`; the wraparound head atlas and facial relief are regenerated from it. The shared 3D lower jaw is wider, and all eight published Oleg rooms are rebuilt from that one sculpt. The image remains an interpretation requiring Oleg's own likeness review. Frame `02`'s seventy scattered polygon pavement pieces and bright repeated wood bars were removed; continuous pigmented ground now carries its subtle scuffs and quiet plank joints. The home-to-street composition and all story acts remain as authored.

Further October 22 scene pass: six repeated procedural street-tree crowns were replaced with the adapted CC0 three-dimensional shade tree used in the other outdoor memories. Only the narrow trunks collide. The desk's five blocky orange supports became two fitted, rounded drawer cabinets with inset faces, formed pulls, and feet, closer to Oleg's private desk reference. The advising Jane stands close behind Oleg with a restrained hand near his shoulder; the previous long pointing arm looked detached. Oleg's distracting shirt doodle is suppressed in this room. An additional imagegen likeness candidate based on both private Oleg photos looked almost identical to `v8` and was rejected rather than replacing eight shared figures without visible improvement. The `v8` likeness is still awaiting Oleg's own art review. No company name or invented job details are shown.

## Geometry-first local revision, October 22

The active local revision replaces the old portrait-panel people with the
shared geometry-first sculpt and scene-specific contact poses. Reference
photographs remain private and are not used as public textures. The memory,
people and frame assignment remain unchanged. See
[the acceptance checklist](scene-revision-checklist.md) for actual visual and
functional verification; this note alone does not mark the room complete.

Latest October 22 portrait pass: the built-in imagegen tool made a new gouache study from both private Oleg photos, using this prompt: “Single straight-on head portrait for a sculpted 3D storybook figure. Preserve Oleg's actual medium dark brown hair with natural side sweep, softly rectangular black glasses, grey-green eyes, real nose proportions, understated closed-mouth smile, modest short beard and mustache, adult jaw, and visible ears. Fine gouache with subdued dimensional shading; face fills the square from crown to chin. Avoid generic substitution, exaggerated hair or beard, enlarged eyes, caricature, photorealism, text, and accessories.” A second imagegen pass removed only the study's solid background while preserving the face, glasses, hair, expression, and brushwork. A 512-pixel WebP derivative is `scripts/assets/room02/oleg-face-v9-reference.webp`, embedded into a regenerated wraparound atlas; the private source photos remain excluded. The shared head sculpture is moderately broader and taller, with its jaw still seated at the rig's neck. Frame `02` was inspected from the normal path and close up, and frame `07` was inspected with Zephrine on his shoulders. The likeness is closer in those views but remains a stylized interpretation for Oleg's review.

A close side review exposed that the earlier replacement still faced away from
the desk. Oleg now turns toward the real work surface with his hands above an
open notebook, moved together onto that area of the desk. Jane stands beside him
and rests a hand at his shoulder while looking into the interaction. The other
intentional Janes and their roles remain; their schematic staging is still an
open art target.

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

## October 23 local support study

The active candidate uses native dimensional faces and hands; the portrait
illustration experiments above are historical and must not be resumed. The
kitchen counter, pan and handle are lowered together to waist height, with Jane
restaged at the handle and a supporting hand fitted to the counter plane. The
caregiving cloth is a thin sagging mesh instead of an extruded tray, and the
child reaches toward its edge. The first cloth still read as a board, so its
catenary, folds and hem have been revised again pending inspection.

A single lifted ceiling studies the home-to-street transformation. Its first
underside looked like a dark slab and was rejected; the next material study is
still under review. The comforting pair remains visibly unsuccessful: Oleg's
arm goes above Jane's head, and their bodies do not yet communicate support.
The real desk, multiple Janes, all five support roles and frame assignment stay
as before. None of these local studies is a new published release.

## Continued native sculpture review, October 23

The caregiving cloth and child fingertip now share one transformed surface target. The pan is hollow, the counter meets the floor, and street contacts use differentiated adult anatomy and conversational gestures. A review still showed floating equipment on the real desk; the next source study lowers those objects to its actual beveled top and completes the home wall around true window openings. Re-export and inspect these changes before treating them as resolved.
