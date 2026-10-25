# Frame 05 — real second-floor office

This revision follows Oleg’s direction to mirror the office layout left/right
and then build the complete office, stairs and catalpa view. It revises the
existing office-move memory; it adds no scene assignment or achievement URL.

Publication status is recorded below after deployment verification.

## What changed

The opening foyer retains Jane, Oleg, Zephrine and the moving trolley. Two
connected wood-and-black-steel stair flights lead to a 3.2 m upper floor and a
furnished office. The sofa and botanical prints occupy the left end. The
bookcase, small wood desk, grey desk chair, rounded green/white chair, shelves
and entry occupy the right end. The room also has grey carpet, a long mint/gold
table, pink visit mat, framed blank certificates, a clock and deep white sill.

The catalpa is rooted at street level, immediately outside a real second-floor
window opening. Its connected trunk/branches and broad heart-shaped leaves
stand beside the glass; parked cars, pavement and the opposite building are
below/beyond the office. The sky and street belong to this independent world.

Optional walking surfaces raise/lower the camera through the stairs. Collision
includes vertical bounds for this room, so upstairs furniture does not block
the ground floor below it. The portal stays at its original local z=8.9 with
the existing continuous crossing and painting projection. Other rooms keep
their flat floors.

## Observed checklist

- [x] Corrected sofa-left / bookcase-and-desk-right orientation inspected in
  normal, sofa-side and desk-side views.
- [x] Both stair flights, turn, upper landing and office reached in both
  directions using the actual exported model’s collision and room controller.
- [x] Exported stair/floor support checked by downward rays. The upper camera
  eye height is 4.85 m, returning to 1.65 m in the foyer/gallery.
- [x] Door clears the ottoman; the bookcase has a real top supporting its vase.
- [x] The glazing has a genuine opening onto a modeled street. The catalpa
  remains outside the glass, with street and roots below office level.
- [x] Close visual review rejected and corrected the first closed chair shell,
  missing bookcase top, door/ottoman overlap, excessive fine leaf stems, noisy
  wall materials, stretched floor texture and ceiling hotspot.
- [x] Fresh desktop and portrait emulation cover hallway painting, partial
  reveal, entry, office, tree view and return, with completed WebGL readbacks.
- [x] Build/site checks, all published model geometry, specific office checks
  and all 37 unit tests pass. Separate fresh desktop / portrait browser checks
  pass keyboard movement, sustained touch look, entry, collision, continuous
  return, stable FOV and cleanup. Global drag/resize, no-WebGL/context-loss
  fallback and failed-room-load behavior also pass.
- [x] Only frame `05` changes in the manifest; every other record, the exhibit
  order, all 41 IDs and all 39 original achievement URLs are preserved.
- [x] Private photos remain ignored references; no reference pixels, metadata,
  readable certificates or private papers are exported.

## Evidence

- [Normal office view](office-normal.png)
- [Sofa and botanical prints](sofa.png)
- [Desk/bookcase end](bookcase.png)
- [Stair approach](stairs-foot.png), [turning landing](turning-landing.png)
- [Catalpa beside the window](window-tree.png), [street below](street-below.png)
- [Portrait office](office-phone.png), [portrait tree view](tree-phone.png)
- [Hall painting](hall.png), [partial reveal](reveal.png), [return](return.png)
- [Recorded stair-route verification and hashes](verification.json)
- [Separate desktop/phone control and cleanup checks](05-verification.json)
- [Shared controls and fallback checks](global-verification.json)
- [Build/site/geometry/test output](checks.txt)
- [Corrected source layout](../05-office-layout-proposal/README.md)

The GLB is 4,191,616 bytes, SHA-256
`bee68b6c8e125e12f4dab36c68de89b3360c319123b9778c52bd019def19934e`.
The preview is 28,620 bytes. The evidence JSON records the reviewed client hash.

## Limits and remaining art work

The private photos establish furniture, materials and window relationships;
they do not give measured dimensions or the full connecting corridor/stair
plan. The corridor and unmeasured spacing are composed for this portal world.
The entry-door position, swing and long-table placement remain inferred from
the photos rather than independently confirmed. The stairs follow the finishes
in [Expansive’s actual North Center photo](https://expansive.com/wp-content/uploads/2024/04/Chicago_NorthCenter-3.webp),
without claiming a surveyed reconstruction of the building’s circulation.

Visual acceptance here concerns the new office/stairs/tree arrangement. The
existing family sculpture, especially natural expression and Oleg’s likeness,
remains part of the wider art backlog. These functional checks do not close
that backlog or prove that every possible mesh pair is intersection-free.
Portrait tests are fresh browser emulation, not a physical-phone performance
measurement. The botanical tree and distant architecture remain stylized.

## Publication

All local checks and visual review above are complete. Release deployment and
live file verification are pending.
