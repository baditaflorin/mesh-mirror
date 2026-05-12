---
status: accepted
date: 2026-05-11
---

# 0003 — Ring topology

## Context

The infinite-mirror effect works because every phone shows a _single_ other phone's view, and that other phone is showing a _third_ phone's view, and around the ring back to you. If a phone showed all of its peers, you'd just have a video wall (which is `mesh-shared-window`'s job — different app).

## Decision

- Each phone is assigned an integer `myIndex` in `[0, totalPhones)`. User sets both in Settings.
- Phone `i` displays the frame of phone `(i - 1 + totalPhones) % totalPhones`.
- Every phone publishes its frame; not every phone watches every other.

This is identical to the `mesh-wave-canvas` shared-canvas-with-index pattern — minimal coordination, all phones agree by convention.

## Consequences

- **Self-correcting.** If a phone duplicates an index, two phones show the same predecessor. That's fine; visually weird but not broken.
- **Missing index = blank display.** If `totalPhones = 5` and phone 3 is missing, phone 4's display shows "waiting for phone 3…" until it joins.
- **Ring direction is fixed** (i shows i-1). Future variation: "mirror back" — show i+1 instead. Trivial to flip in Settings.

## Alternatives considered

- **Show everyone's frames in a grid** — that's `mesh-shared-window`.
- **Pairwise — show the phone you're closest to** — needs Bluetooth ranging, way out of scope.
- **Auto-assign indices** based on join order. Rejected — joining order is unstable across reconnects; manual assignment is sturdier.
