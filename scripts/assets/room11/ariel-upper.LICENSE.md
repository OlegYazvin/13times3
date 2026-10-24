# Ariel upper-body study

Adapted from **Rain v3.3**, Blender Studio / Blender Foundation, distributed
under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

Required source credit: **Rain Rig (CC) Blender Foundation | studio.blender.org**.

- Source page: https://studio.blender.org/characters/rain/v3/
- Source archive: https://studio.blender.org/download-source/files/ee/a7/eea73e55dba1cea31c09848df6a794b2-4.zip
- Archive contains `Rain v3.3/rain_v3.2.blend`.
- Adaptation: `scripts/build_ariel_base.py`, run with Blender 4.5.9 and
  `--background --disable-autoexec --python-exit-code 1`. Embedded source-file
  Python scripts are not executed.

Changes: frozen asymmetric arm and hand pose, modeled lip-corner expression,
softened lower cheeks, narrower eyebrows, new skin and eye materials, vertex
pigment, cropped lower torso, and frozen evaluated meshes. Source clothing,
hair, lower body, rig controls and animation are omitted. The red scalp, swept
forelock and flowing hair are authored in the adaptation script and fused into
one closed volume.

The project's separate hair, shells and tail are authored in
`scripts/aquarium_mermaid.mjs` following the user's requested Ariel design
from Disney's 1989 *The Little Mermaid*. Ariel's character design belongs to
Disney; the Rain source attribution does not imply Disney involvement.
