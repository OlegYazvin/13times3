# Gallery scene registry

Check this list before proposing or building a room. Match by the memory itself, not only by the wording of its title. If a new idea overlaps an entry, point out the existing frame and ask whether it should be a revision or a genuinely different moment.

The gallery has 41 stable frame IDs. The 39 original achievement pages are a separate part of the site and are not entries in this registry.

| Frame | Status | Memory or event | People | Distinctive setting and motifs | Source |
| --- | --- | --- | --- | --- | --- |
| `01` | Published | “You signed Zephrine up for dance and acting classes!” | Jane, Zephrine | Frozen signup moment: Jane at a desk, Zephrine on a small stage; storybook undersea cave with mermaid, kelp, coral, shells, script, and footprints | [author](../scripts/room01_author.mjs), [manifest](../src/_data/gallery.json), [live room](https://13times3.com/explore/) |

Frames `02`–`41` are unassigned blank portals. No other walkable rooms are published as of 2026-10-19.

## Overlap cues for frame 01

“Zephrine’s first stage,” “dance classes,” “acting classes,” “enrollment,” “signup,” and “Jane signing Zephrine up” all point to frame `01`, even if a proposed title differs. A separate Zephrine performance, rehearsal, or later class could be its own memory if the user intends a different event.

## When adding a scene

1. Check this registry and `src/_data/gallery.json` before choosing an ID. Call out any likely duplicate to the user.
2. Reserve an unassigned frame by adding a row with status `Planned`, the user's exact memory wording, people, and a brief distinction from similar scenes. Do not invent dates, studios, or enrollment details.
3. In the same change that publishes the room, set status to `Published` and link its author source, manifest record, and live route. If a scene is retired or replaced, record that explicitly instead of silently removing its history.
4. Keep the registry current when the user changes a scene's subject or title.
