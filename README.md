# mesh-mirror

[![Live](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--mirror-5ED3FF?style=flat-square)](https://baditaflorin.github.io/mesh-mirror/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-mirror?style=flat-square&color=4a6470)](https://github.com/baditaflorin/mesh-mirror/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-1a160a?style=flat-square)](docs/adr/0001-deployment-mode.md)

> Peer-to-peer mesh: each phone shows the live camera of the phone _before_ it in the ring. Chain enough of them and the loop closes — a low-fi, dreamy infinite mirror.

**Live:** https://baditaflorin.github.io/mesh-mirror/

## Try it in 30 seconds (2 tabs)

1. Open the [live app](https://baditaflorin.github.io/mesh-mirror/) and grant camera access.
2. Open the **same URL in a second tab** (or on another phone in the same room).
3. In the second tab, open Settings (⚙) and set **This phone's position** to `2`.
4. Arm both with **Open camera & connect**. Each tab now shows the _other's_ camera over the mesh — no server, no account.

That two-peer case is the whole idea in miniature. Scale it up:

Form a ring of 3–6 phones, all facing inward. Each phone's screen displays the live camera of the phone _before_ it in the ring. Phone 1 shows phone N. Phone 2 shows phone 1. And so on. Hold up your phone — you see what your neighbour is filming — which is filming the next phone — and so on, around the ring.

The combination of low fps, soft compression, and a chain that loops back on itself gives a haunting, dream-of-a-mirror feel.

## How it works

We use the **Yjs awareness** channel as a low-fps frame ferry:

1. Each phone calls `getUserMedia` on its camera, draws frames into an offscreen canvas at the chosen fps (default 7), and `toDataURL("image/jpeg", 0.55)`s them.
2. Each phone publishes its latest JPEG dataURL plus its `myIndex` into its **awareness** state.
3. Each phone reads the awareness state of the phone with `(myIndex - 1 + totalPhones) % totalPhones` and displays its frame.

Because awareness keeps only the latest value per peer, slow phones never accumulate a backlog — they just drop intermediate frames. ~10 KB JPEGs × 7 fps × N peers fits well within the y-webrtc data channel.

## Why not real-time WebRTC video tracks

We could add a parallel raw `RTCPeerConnection` mesh that ships H.264/VP9 tracks. We chose JPEG-over-awareness instead because:

- **The dreamy look is the point.** 7 fps + 320 px + 55% JPEG = the aesthetic. A crisp video stream is less interesting.
- **One transport** is simpler than two.
- **Latency** at 7 fps + 100 ms y-webrtc relay is around 250 ms, which the ring conceals.
- **Battery and bandwidth** are kinder than a 30 fps video encoder.

You can crank fps + width + quality in Settings if you want it sharper.

## Privacy threat model

See [docs/privacy.md](docs/privacy.md). Wire payload: a JPEG of your camera every ~150 ms. Anyone in the same room sees your camera. That is the point of the app — don't open it pointed at anything you don't want shared.

## Architecture

- **Mode A** — pure GitHub Pages.
- **WebRTC** — Yjs awareness over y-webrtc, with self-hosted signaling and TURN.

## Run it locally

```bash
git clone https://github.com/baditaflorin/mesh-mirror.git
cd mesh-mirror
npm install
npm run dev
```

## Self-hosted infrastructure

| Repo                                                                   | Endpoint                               | Role                      |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------- |
| [signaling-server](https://github.com/baditaflorin/signaling-server)   | `wss://turn.0docker.com/ws`            | y-webrtc protocol fan-out |
| [turn-token-server](https://github.com/baditaflorin/turn-token-server) | `https://turn.0docker.com/credentials` | HMAC TURN creds           |
| [coturn-hetzner](https://github.com/baditaflorin/coturn-hetzner)       | `turn:turn.0docker.com:3479`           | TURN relay                |

## ADRs

- [0001 — Deployment mode](docs/adr/0001-deployment-mode.md)
- [0002 — JPEG-over-awareness instead of video tracks](docs/adr/0002-jpeg-frames.md)
- [0003 — Ring topology](docs/adr/0003-ring-topology.md)
- [0010 — GitHub Pages publishing](docs/adr/0010-pages-publishing.md)

## License

[MIT](LICENSE) © 2026 Florin Badita
