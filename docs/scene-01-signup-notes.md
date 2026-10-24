# Frame 01 — dance and acting signup

Revise the existing Jane-and-Zephrine memory; this is not a new assignment.
Keep the undersea cave, enrollment desk, little stage and the original title.

The October 22 local candidate exports Jane and Zephrine through
`scripts/storybook_figures.mjs`. Jane is seated with her hands over the desk
and a modeled pen at the notebook. Zephrine has open arms and an asymmetric
stage stance. Both use the same continuous face, fitted hair, clothes and hand
construction as the later rooms. Selected small cave decorations are suppressed
before export so they compete less with the action.

Reviewed local evidence is in `.cache/art-review/01-*.png` and the illustrated
revision report. The painting, sides and rear establish the new construction;
they do not establish final likeness or emotional acceptance. The stage pose
is still restrained, and the cave and desk need a stronger authored silhouette
and focal lighting before this can be called finished. Preserve the desk and
stage collision footprints and continuous portal entry/return.

A fresh portrait view exposed Jane's signup action beyond the left edge. Jane,
the desk, paper, script and attached props move inward together by 1.10 m; the
wall-mounted storybook and the stage remain in place. This keeps the contact
arrangement intact while allowing both actions to be seen from the doorway.
The seated arrangement also has a joined walnut chair with a shaped seat, back
and grounded legs. Jane's thighs are posed along that seat rather than bending
down through it.
A closer side view then exposed the pen and fingers below the desktop. The hand
targets and pen tip now sit over the actual paper surface, and Jane looks down
toward that action.

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

### Current exported evidence, October 23

The current native export completes full desktop and fresh portrait-emulation doorway, front, profile, three-quarter, rear and return inspection. The articulated writing grip, sharpened pencil and actual paper contact replace the old independent hovering pen. Jane’s soles meet the sand patch within 0.50 mm, and the planted stage foot is within 0.02 mm of the deck. The other foot is deliberately raised. The cave roof/wall rails and small competing ornaments are reduced; its stage, cave and signup memory remain.

The later complete desk-support study corrects more than the pencil target:
Jane's seated torso now retains her standing torso length instead of stretching
it above the low chair. The paper, rules, booklet, wax, shell and beads are
seated on the actual 0.928 m beveled desk top. Her free hand rests on that desk,
and the pinched pencil follows the lowered paper. These source changes require
the next packed prop and browser checks; the earlier paper-plane test did not
establish support for every desktop object. Zephrine's stage smile uses the
same sculpted joy expression already inspected in the car and playground.

### Scene piano, October 23

The user requested a slow, mellow instrumental of “Part of Your World” inside
this existing scene. The selected source is [Benny Martin’s solo-piano cover](https://soundcloud.com/bennymartinpianist/disney-the-little-mermaid-part-of-your-world-piano-instrumental-cover),
SoundCloud track `231167340`, duration 208.529 seconds. It is on the pianist’s
own account, linked to [his professional site](https://bennymartin.com.au/).
The artist describes his work as background instrumental piano. The recording
and composition are not claimed to be Creative Commons or public domain: use
the provider’s public embedded player, with the artist link and standard
playback controls. No audio file is copied, re-encoded or bundled in the site's
static assets; SoundCloud streams additional data on entry. The Disney Peaceful Piano uploads tested during sourcing returned
embedded-player error 150 and were not adopted.

`client/explore/scene-music.mjs` loads the provider only on entered-room `01`
with Sound enabled. The hallway track fades to silence; the piano starts at
35% player volume and loops while the visitor remains in this scene. Exit,
Sound off, page hiding and gallery fallback remove the iframe, including a
player still loading. Other rooms do not load this recording. A browser that
blocks automatic playback retains an accessible Play button; network/provider
failure keeps exploration usable and exposes the source link. Playback depends
on SoundCloud availability and may inherit the provider’s playback policies.

Verification checklist for this change:
- [x] Real SoundCloud playback advances after entry in desktop and fresh 390×844
  portrait emulation. See [desktop](scene-evidence/01-music/desktop.webp),
  [phone](scene-evidence/01-music/phone.webp) and [the browser record](scene-evidence/01-music/verification.json).
- [x] Exit restores hallway music; entered room 02 has no piano. Unit checks
  exercise the same exclusive selection for rooms 02–12.
- [x] Sound off persists across real entry/return. Unit checks cover rapid exit
  while the API is pending and stale READY/FINISH events after removal.
- [x] Reviewed player bounds clear the joystick and Sound/help controls in the
  portrait capture. This is phone emulation, not physical iOS verification.
- [x] Blocking the provider in a real browser leaves movement and return usable;
  the source-link message appears and hallway music resumes.
- [x] `npm run build` and `npm run check` pass, including 25 unit tests and the
  existing 39 achievement URL / 41 frame checks. Autoplay-blocked state, page
  hiding, fallback and independent hallway-audio failure have unit coverage.
- [x] Published application commit `5481f4b` through successful [Pages run
  40052095423](https://github.com/OlegYazvin/13times3/actions/runs/40052095423).
  The normal live gallery HTML, its versioned script and stylesheet, credits
  and room 01 model match the reviewed files. Fresh live desktop keyboard entry
  and portrait-emulation joystick entry both start actual playback; Sound off
  and return work. Seeking near the track's end verifies the desktop loop.
  See [the production record](scene-evidence/01-music/publication.json).

This is an audio revision. It does not establish further artistic acceptance
of the scene geometry or resolve the visual weaknesses recorded above.

Production follow-up: the first live check exposed the 20-second widget-ready
deadline removing the player while SoundCloud's waveform/session requests were
still loading. A longer diagnostic allowed the same source to initialize and
fetch audio. Allow 60 seconds for that third-party startup, while retaining
immediate cleanup on exit/mute and immediate handling of explicit errors. The
initial desktop/phone captures and their recorded build hashes precede this
timeout adjustment; final production verification is tracked separately. The
final live checks use the deployed 60-second deadline without runtime overrides.
An aborted SoundCloud session request when muting is expected iframe cleanup,
not a playback failure. These transport checks do not claim a listening-based
artistic acceptance or physical-device iOS autoplay verification.
