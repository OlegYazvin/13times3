# Lessons for future gallery scenes

These are decisions and corrections from developing frame `01`. Read them with the [scene registry](scene-registry.md) before building another room. Apply the interaction lessons to every room; choose each new room's own visual theme from its memory.

## Art direction

- Make the hallway spacious, dreamlike, and architectural. Avoid a narrow digital tunnel, repeated hexagons, empty flat walls, and decorative elements that hide labels or signs.
- Make each room a coherent, detailed 3D storybook tableau. Give surfaces, ceiling, props, figures, and lighting a shared visual language. Use custom contours, layered materials, carvings, and intentional silhouettes; large default spheres, ovals, and egg shapes make the scene look unfinished.
- Every character and important prop should have volume from multiple viewpoints. Do not use 2D photo cutouts. A recognizable painted likeness does not need photorealism. Keep photos as private references; do not publish the originals or their metadata.
- Jane's and Zephrine's uploaded reference photos are stored locally under `.secrets/reference-photos/` and excluded from Git. Use them when a later scene includes those people. Oleg's reference photo has not been supplied yet.
- For Jane in frame `01`, retain her recognizable face and give her stylized body a subtly slimmer silhouette, as requested. Do not treat that as a rule for other people or future scenes.
- Let actions and objects carry the story. Frame `01` does not need “acting” and “dance” signs behind Zephrine; the stage and signup details imply them. Avoid invented studios, dates, enrollment facts, or other biographical claims.
- Frame `01` has a mermaid and undersea cave theme because Zephrine likes *The Little Mermaid*. Its curved cavern shell, sea plants, shells, and coral should feel authored rather than assembled from primitives. Do not impose this theme on unrelated memories.

## Portal and movement behavior

- A scene's painting must be visible from the hallway before its 3D model loads. As Jane approaches, show the live room with parallax from a comfortable distance; do not wait until she is almost touching the frame.
- About a meter before the threshold, the *full* room view should already fill the screen. Match the near view's composition and camera to the entry pose so crossing causes only a brief glow, not a crop, zoom, or long dissolve. Entry happens by walking through the frame, without a tap.
- The return doorway follows the same rule: show a live view down the hallway inside the doorway, fill the screen before crossing back, then use the same short handoff. Match the hallway camera and exit pose. Release the room's GPU resources after returning.
- Collide with walls, stage, desk, and figures. Walking through a character or other solid object breaks the scene. Keep the return opening obvious and traversable while the rest of the boundary is solid.
- On phones, the left thumb control moves. Holding a finger on either side of the right half continuously turns in that direction; it must not require repeated swipes. Drag vertically there to look. Preserve desktop keyboard and drag controls.

## Scale, cost, and checks

- Use the current Eleventy, Three.js, GitHub Pages, and Cloudflare setup. Keep rooms static-hosted with no backend or paid service. Load one room at a time, and aim for roughly 8 MB or less of downloaded assets per room.
- A room may be around 10 feet on each side or larger when its scene needs space. Store its dimensions, entry pose, preview camera, model, and preview in `src/_data/gallery.json`.
- Render the portrait preview from the same 3D scene and intended camera, so it predicts what Jane enters. Compare screenshots from the far hallway, live frame, full view before entry, and entered room. Do the same through the return doorway and after exit.
- Verify collision, resource cleanup, the WebGL fallback, resize, sustained phone turning, phone movement, and desktop movement. Preserve all 39 achievement URLs and 41 unique frame IDs. Use phone emulation for development, then check feel and performance on a physical iPhone when available; the target is a steady 30 fps there.
- Inspect screenshots for hidden signs, flat walls, obvious primitive shapes, clipping, mismatched views, and jarring mixed visual styles before publishing.
