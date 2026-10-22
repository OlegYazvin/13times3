# Oleg figure understructure

The eight published Oleg appearances use a modified copy of Innerscene's
[Relaxed walk — Sam 3D Person](https://www.innerscene.com/tools/library/3d-parts/relaxed-walk-sam-3d-person-animated-732f1206).
The source is a MakeHuman-derived clothed, skinned figure released under CC0.
Its body proportions, fitted shirt, trousers, shoes, hands, and bones provide
an anatomical base. No original face, hairstyle, walk animation, or phone is
shown. Oleg's illustrated face, hair, glasses, and beard are authored from
the private reference photos already listed in the scene guide.

Run `node scripts/prepare_rigged_oleg.mjs` to download and prepare the
source if the committed `scripts/assets/figures/rigged-casual-sam.glb` needs
regenerating. The script removes the animation and unrelated facial and prop
meshes, drops normal maps, resizes remaining textures, and keeps the rig and
clothing. `scripts/rigged_oleg.mjs` trims the generic head, adds the curved
painted likeness, sets clothing colors, and poses the arms for each memory.
The original 21 MB source download is kept only in ignored `.cache/`; the
prepared source is about 3 MB and each published room is mesh-compressed.

The model's CC0 license permits reuse without attribution, but the public
credits page links to its creator. The private reference photos and their
metadata are never embedded in the published room assets.

The later head pass replaces a hard side-hair shell with a fully sculpted
cheek, jaw and cranium under the painted portrait. The rear and crown receive
subtle hair pigment while the lower face keeps skin color. A small wordless
sun-and-cloud shirt detail echoes one private Oleg reference without copying
its text or branding. The body garments share the gallery's woven-pigment
texture.

The fit of the face and hair still needs a close human art review from the
doorway and at three-quarter angles. Matching a recognizable face to a shared
storybook body does not automatically make every garment or pose finished.

Oleg's active face illustration is `scripts/assets/room02/oleg-face-v5-reference.webp`.
It was generated with the built-in imagegen tool by editing the prior gouache
texture against his private reference portrait. The prompt kept a transparent,
head-only painted composition while asking for the reference's rectangular
glasses, grey-green eyes, side-parted medium hair, short beard, and facial
proportions. The photograph itself is not embedded or published. The face UVs
crop some illustrated hair margin, so the identity features fill more of the
curved sculpt without enlarging the entire head; the underpainting exposes
more cheek and gives the hair subtle warmer variation. Every existing Oleg
appearance shares this portrait. This remains stylized and needs human
likeness review from three-quarter angles.

The small `scripts/assets/room02/oleg-face-depth.json` table is generated
offline from this public painted illustration with [Google's MediaPipe Face
Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker).
It guides only the sculpt's restrained cheek, brow, nose, mouth, and chin
relief; it contains no pixels or landmarks from a private photograph. The
runtime site needs no MediaPipe dependency. To regenerate it, download the
[official task model](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)
to ignored `.cache/face_landmarker.task`, install `mediapipe`, `pillow`, and
`numpy` in a temporary Python environment, and run
`python scripts/generate_oleg_face_depth.py`. The first full-depth trial made
his nose too prominent in frame `02`; the committed sculpt uses a softer
blend, checked again in the actual room.

## Jane's standing figure

Standing Jane appearances in frames `02`, `05`, `07`, `08`, `10`, and `11`
use a modified copy of Innerscene's
[Relaxed walk — Maya 3D Person](https://www.innerscene.com/tools/library/3d-parts/relaxed-walk-maya-3d-person-animated-2c6669a2),
also MakeHuman-derived and CC0. `node scripts/prepare_rigged_jane.mjs`
reproduces the compact source from the original download. The source face,
hair, animation, and phone are discarded; `scripts/rigged_jane.mjs` paints
full sleeves on the skinned arms, gives the body each room's cloth palette,
poses its arms, and adds Jane's original illustrated face and high bun on a
sculpted head. A single adapted source is reused for the five simultaneous
versions of her in frame `02`. The original 20 MB file stays in ignored
`.cache/` and the private likeness photo stays in `.secrets/`.

The intimate seated nursing figure in frame `06` remains an authored sculpture
for that moment. The source model's original sleeveless top was unsuitable
for Jane's other scenes without the modeled and painted sleeve adaptation.

## G's figure

G in frames `07` and `11` uses a second adaptation of the same CC0 Maya rig.
`makeRiggedG` preserves her independently posed hands, gives her a slightly
different adult silhouette, maps her private-reference-based gouache portrait
onto a curved head, and adds a continuous short bob, sewn blouse neckline,
placket, and buttons. The face texture is public painted art; the reference
photos remain in ignored `.secrets/`. G is Oleg's mother, not Anna Shersher.
The aquarium and blueberry field both need a close in-room likeness review;
this shared figure improves anatomy but does not finish the child figures or
every gesture around her.
