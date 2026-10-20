# Gallery scene registry

Check this list before proposing or building a room. Match by the memory itself, not only by the wording of its title. If a new idea overlaps an entry, point out the existing frame and ask whether it should be a revision or a genuinely different moment.

The gallery has 41 stable frame IDs. The 39 original achievement pages are a separate part of the site and are not entries in this registry.

| Frame | Status | Memory or event | People | Distinctive setting and motifs | Source |
| --- | --- | --- | --- | --- | --- |
| `01` | Published | “You signed Zephrine up for dance and acting classes!” | Jane, Zephrine | Frozen signup moment: Jane at a desk, Zephrine on a small stage; storybook undersea cave with mermaid, kelp, coral, shells, script, and footprints; painting labeled “Zephrine's first stage” opens into a continuous walk-through doorway | [author](../scripts/room01_author.mjs), [manifest](../src/_data/gallery.json), [live room](https://13times3.com/explore/) |
| `02` | Planned | “Jane helped me (Oleg) get a job” | Jane, Oleg | Jane's help with Oleg's job; the specific setting and actions are still to be defined | Oleg's idea, 2026-10-19 |
| `03` | Planned | “Jane made sure Zephrine has a best friend (Charlize)” | Jane, Zephrine, Charlize | The friendship Jane helped create; the specific moment is still to be defined | Oleg's idea, 2026-10-19 |
| `04` | Planned | “Jane Got zephrine the ‘blue car’” | Jane, Zephrine | The “blue car”; what it is and the scene's moment are still to be defined | Oleg's idea, 2026-10-19 |
| `05` | Planned | “Jane moved offices” | Jane; office management | An intentionally abstract treatment of a painful move, including Jane standing up for herself against poor management | Oleg's idea, 2026-10-19 |
| `06` | Planned | “Jane ended breast feeding” | Jane | The end of breastfeeding; the scene's treatment and other participants are still to be defined | Oleg's idea, 2026-10-19 |
| `07` | Planned | “The time we went blueberry picking” | Oleg, Jane; other participants unconfirmed | Blueberry-picking outing; location and exact moment are still to be defined | Oleg's idea, 2026-10-19 |
| `08` | Planned | “Chicago Open house” | Jane, Oleg; other participants unconfirmed | Treat Jane's choices `#4`–`#10` as visited for scene planning; exclude her three northern picks `#1`–`#3`. The [source notes](scene-08-open-house-notes.md) list the venues and explain why the Zen temple remains included. | Oleg's idea, 2026-10-19; [Jane's choice list](scene-08-open-house-notes.md) from the 2026-10-17 Codex conversation |
| `09` | Planned | “We FINALLY visited our friends in Ithaca for the first time where Zephrine got to try apple picking for the first time.” | Oleg, Jane, Zephrine, friends (names unconfirmed) | First visit to friends in Ithaca and Zephrine's first apple-picking experience; the supplied photos show the group at a farm stand and Zephrine holding an apple. Separate from the blueberry-picking memory in frame `07`. | Oleg's idea and private [photo notes](scene-09-ithaca-notes.md), 2026-10-20 |
| `10` | Planned | “We visited maggie daley park for the first time with Zephrine!” | Oleg, Jane, Zephrine, friends (names unconfirmed) | First family visit to Maggie Daley Park with friends, centered on its distinctive Play Garden. The supplied photos document companions but do not establish which play structures the group used. Separate from the Chicago Open House itinerary in frame `08`. | Oleg's idea and private [photo and park notes](scene-10-maggie-daley-notes.md), 2026-10-20 |

Frames `02`–`10` are reserved ideas only: they have no model, preview, or enterable room. Frames `11`–`41` remain unassigned blank portals. Frame `01` is the only published walkable room as of 2026-10-20.

## Overlap cues for frame 01

“Zephrine’s first stage,” “dance classes,” “acting classes,” “enrollment,” “signup,” and “Jane signing Zephrine up” all point to frame `01`, even if a proposed title differs. A separate Zephrine performance, rehearsal, or later class could be its own memory if the user intends a different event.

For planned frames, also flag these likely overlaps: helping Oleg get a job (`02`); Charlize becoming Zephrine's best friend (`03`); Zephrine's “blue car” (`04`); Jane's office move or standing up to management during it (`05`); ending breastfeeding (`06`); the blueberry-picking trip (`07`); Open House Chicago or Jane's Chicago architectural itinerary (`08`); the first Ithaca friend visit or Zephrine's first apple-picking experience (`09`); and Zephrine's first Maggie Daley Park visit with friends (`10`). Frame `07` and frame `09` both involve picking fruit, but they are distinct memories with different fruit, places, and story emphasis. Frame `08` and frame `10` both involve Chicago outings, but the Play Garden visit is a distinct family memory. Ask whether a new overlap is a revision or a distinct later moment before assigning another frame.

## When adding a scene

1. Check this registry and `src/_data/gallery.json` before choosing an ID. Call out any likely duplicate to the user.
2. Reserve an unassigned frame by adding a row with status `Planned`, the user's exact memory wording, people, and a brief distinction from similar scenes. Keep its gallery manifest room blank until it is authored. Do not invent dates, studios, or enrollment details.
3. In the same change that publishes the room, set status to `Published` and link its author source, manifest record, and live route. If a scene is retired or replaced, record that explicitly instead of silently removing its history.
4. Keep the registry current when the user changes a scene's subject or title.
