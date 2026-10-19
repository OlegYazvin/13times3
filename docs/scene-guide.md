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

- Keep the painting visible in the hallway and preload only its room model nearby. Walking close to the frame switches straight to the full 3D room. Do not periodically redraw a live image inside the frame, fade a second view over it, or require a tap; those approaches looked cropped and janky up close.
- Capture a still hallway view for the room's return doorway when Jane enters. Walking close to that doorway switches directly back to the hall and releases the room's GPU resources. Keep the return pose facing into the hall.
- Collide with walls, stage, desk, and figures. Walking through a character or other solid object breaks the scene. Keep the return opening obvious and traversable while the rest of the boundary is solid.
- On phones, the left thumb joystick moves. A drag begun anywhere else on the scene looks around; holding the displaced finger left or right continuously turns in that direction, without repeated swipes. Drag vertically to look up or down. Preserve desktop keyboard and drag controls.

## Scale, cost, and checks

- Use the current Eleventy, Three.js, GitHub Pages, and Cloudflare setup. Keep rooms static-hosted with no backend or paid service. Load one room at a time, and aim for roughly 8 MB or less of downloaded assets per room.
- A room may be around 10 feet on each side or larger when its scene needs space. Store its dimensions, entry pose, preview camera, model, and preview in `src/_data/gallery.json`.
- Render the portrait preview from the same 3D scene and intended camera, so it predicts what Jane enters. Compare screenshots from the far hallway, close painting, entered room, return doorway, and after exit.
- Verify collision, resource cleanup, the WebGL fallback, resize, sustained phone turning, phone movement, and desktop movement. Preserve all 39 achievement URLs and 41 unique frame IDs. Use phone emulation for development, then check feel and performance on a physical iPhone when available; the target is a steady 30 fps there.
- Inspect screenshots for hidden signs, flat walls, obvious primitive shapes, clipping, mismatched views, and jarring mixed visual styles before publishing.
