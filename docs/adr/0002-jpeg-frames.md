---
status: accepted
date: 2026-05-11
---

# 0002 — JPEG-over-awareness instead of WebRTC video tracks

## Context

Cross-phone video has two natural implementations:

1. **Raw `RTCPeerConnection.addTrack`** with the video track from `getUserMedia`. Real video, H.264/VP9, ~30 fps, ~200 kbps per stream.
2. **JPEG frames over a data channel.** Draw the video onto a canvas at low fps, `toDataURL("image/jpeg")`, ship as a string.

Option 1 sounds obviously better. But our existing y-webrtc data plumbing is Yjs-document oriented; bolting on a separate `RTCPeerConnection` mesh (with parallel SDP exchange) is a lot of code we don't have other reason to write.

## Decision

Use option 2: **JPEG dataURLs in Yjs awareness**.

- Each phone publishes `{ index, frame: dataURL }` into its awareness state at ~7 fps.
- Other phones read awareness and display the frame for the predecessor index.
- Awareness keeps only the latest state per peer — natural frame-dropping under congestion.

Defaults: 7 fps × 320 px × 55% JPEG quality ≈ 8 KB per frame ≈ 56 KB/s = 450 kbps per phone uplink.

## Consequences

- **The dreamy look is a feature.** Low fps, soft JPEG, and chain loop conceal that this isn't "real" video.
- **One transport** — the same y-webrtc that ships everything else.
- **Latency** ~250 ms end-to-end (drawImage + toDataURL + relay + render). Acceptable for the ring experience.
- **Battery is kinder** than 30 fps hardware encoding.
- **Crank in Settings** — users who want crisp can raise fps/width/quality. The cliff is around 20 fps × 640 px, where awareness updates start to drop.

## Alternatives considered

- **Raw RTCPeerConnection video tracks.** Saved for v2 if anyone wants the crisp look. Would need a separate SDP-exchange channel via Yjs (writing offers/answers into a Y.Map). Not v1.
- **WebCodecs `VideoEncoder` for AV1 frames over data channel.** Beautiful but Safari iOS support is shaky in 2026.
