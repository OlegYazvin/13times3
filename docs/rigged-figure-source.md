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
