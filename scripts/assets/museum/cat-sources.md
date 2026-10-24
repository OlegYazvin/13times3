# Cat Whisperer — source assets

Downloaded 2026-10-24 from Innerscene's original model library:

- `cc0-cat-sitting.glb`: [Domestic cat sitting](https://www.innerscene.com/tools/library/3d-parts/domestic-cat-sitting-c7caf7c2), source download `https://www.innerscene.com/api/library/domestic-cat-sitting-c7caf7c2/download`.
- `cc0-cat-walking.glb`: [Domestic cat walking](https://www.innerscene.com/tools/library/3d-parts/domestic-cat-walking-4e8ff6c2), source download `https://www.innerscene.com/api/library/domestic-cat-walking-4e8ff6c2/download`.

Both original model pages explicitly dedicate the models to **CC0 1.0 Universal**:
https://creativecommons.org/publicdomain/zero/1.0/ . See the [library terms](https://www.innerscene.com/tools/library/terms).
The source files are authoring inputs, not copied into the public site.

The author script removes texture maps and colored animal materials, reduces
the protruding eye treatment and removes eye glints, varies scale and orientation,
and sculpts weight-bearing cat surfaces around the actual posed clothing. Jane's
anatomy and footwear use the existing CC0 sources already documented in this
repository. Jane, stool and cats are exported as one named stone assemblage with
no image assets. The sculpture is original composition, rather than a claim that
these are portraits of particular family cats.

Source candidates were inspected before adoption, then in the actual seated,
shoulder and walking arrangements. The first hand/lap contact trial was rejected
for intersection; the final source emits support distances and checks that neither
hand penetrates a cat's main skin by more than 1 mm. Final packed-asset multi-angle
review and publication status: `docs/museum-gallery-notes.md`.

Rebuild: `npm run build:cat-whisperer`.
