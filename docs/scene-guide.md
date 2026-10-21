# Lessons for future gallery scenes

These are decisions and corrections from developing frame `01`. Read them with the [scene registry](scene-registry.md) before building another room. Apply the interaction lessons to every room; choose each new room's own visual theme from its memory.

## Art direction

- Make the hallway spacious, dreamlike, and architectural. Avoid a narrow digital tunnel, repeated hexagons, empty flat walls, and decorative elements that hide labels or signs.
- Blank frames keep their two-digit number plaques. Every completed room needs a short `room.caption` in the gallery manifest; display it as a plaque across the painting's upper edge in place of that number. Keep it readable from the center of the wider hallway and clear of nearby trim and pilasters. A plaque mounted above the tall frame falls outside the desktop camera's normal field of view.
- Make each room a coherent, detailed 3D storybook tableau. Give surfaces, ceiling, props, figures, and lighting a shared visual language. Use custom contours, layered materials, carvings, and intentional silhouettes; large default spheres, ovals, and egg shapes make the scene look unfinished.
- Every character and important prop should have volume from multiple viewpoints. Do not use 2D photo cutouts. A recognizable painted likeness does not need photorealism. Keep photos as private references; do not publish the originals or their metadata.
- Jane's, Zephrine's, and Oleg's uploaded reference photos are stored locally under `.secrets/reference-photos/` and excluded from Git. Use them when a later scene includes those people. Oleg's files are `oleg-portrait.jpg` and `oleg-with-jane-and-zephrine.jpg`; they show his medium-length dark brown hair, dark rectangular glasses, and short beard. The private copies have been resized and stripped of EXIF metadata. Do not publish the original photos or these reference copies.
- Anna Shersher is Jane's mother. `anna-and-igor.jpg` shows Anna beside Igor and can guide both of their likenesses; `anna-video-call.jpg` is a second reference for Anna, including her glasses. These files are also private, resized copies with EXIF metadata removed. Do not publish them.
- For Jane in frame `01`, retain her recognizable face and give her stylized body a subtly slimmer silhouette, as requested. Do not treat that as a rule for other people or future scenes.
- Let actions and objects carry the story. Frame `01` does not need “acting” and “dance” signs behind Zephrine; the stage and signup details imply them. Avoid invented studios, dates, enrollment facts, or other biographical claims.
- Frame `01` has a mermaid and undersea cave theme because Zephrine likes *The Little Mermaid*. Its curved cavern shell, sea plants, shells, and coral should feel authored rather than assembled from primitives. Do not impose this theme on unrelated memories.

## Portal and movement behavior

- Keep the painting opaque at a distance and preload only its room model nearby. Reveal the real room through irregular openings in the painting as Jane approaches. Render the room behind an actual aperture in the gallery wall, with parallax from the same world camera. Do not use a periodically refreshed texture, screen fade, or camera teleport.
- Crossing the aperture in either direction preserves world position, view direction, and field of view. The return doorway shows the actual hallway, not a still capture. Keep the nearby room loaded on exit and release it after Jane walks away.
- Collide with walls, stage, desk, and figures. Walking through a character or other solid object breaks the scene. Keep the return opening obvious and traversable while the rest of the boundary is solid.
- On phones, the left thumb joystick moves. A drag begun anywhere else on the scene looks around; holding the displaced finger left or right continuously turns in that direction, without repeated swipes. Drag vertically to look up or down. Preserve desktop keyboard and drag controls.

## Scale, cost, and checks

- Use the current Eleventy, Three.js, GitHub Pages, and Cloudflare setup. Keep rooms static-hosted with no backend or paid service. Load one room at a time, and aim for roughly 8 MB or less of downloaded assets per room.
- A room may be around 10 feet on each side or larger when its scene needs space. Store its dimensions, entry pose, preview camera, model, and preview in `src/_data/gallery.json`.
- Render the portrait preview from the same 3D scene and a hallway viewing pose, so it predicts the room revealed through the frame. Compare screenshots from the far hallway, partial reveal, open frame, entered room, return doorway, and after exit.
- Verify collision, resource cleanup, the WebGL fallback, resize, sustained phone turning, phone movement, and desktop movement. Preserve all 39 achievement URLs and 41 unique frame IDs. Use phone emulation for development, then check feel and performance on a physical iPhone when available; the target is a steady 30 fps there.
- Inspect screenshots for hidden signs, flat walls, obvious primitive shapes, clipping, mismatched views, and jarring mixed visual styles before publishing.
- For outdoor rooms, wrap the visible sky around the back, sides, and top of the walkable area. A single backdrop plane becomes an obvious rectangle once Jane crosses the painting. Check the enclosure from the hall and from inside on both wide and portrait screens.
