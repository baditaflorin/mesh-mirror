# Privacy threat model — mesh-mirror

## What other peers in the same room can see

- Your camera, as a JPEG every ~150 ms (default 7 fps).
- Your `myIndex` (the position you set in Settings).

Don't open this app pointed at anything you wouldn't want the rest of the ring to see. There's no UI to hide your frame partway through — the only way to stop publishing is to close the tab.

## What other peers CANNOT see

- Audio (we never request microphone permission).
- Anything else from your device.

## What the signaling server sees

The room name and encrypted SDP offers/answers. No frame data.

## What the TURN server sees

Encrypted DTLS bytes if peers can't connect directly. It cannot decrypt your video frames.

## What stays local

- Your camera permission.
- The choice of front vs rear camera.
- All other settings.

## Permission asked

`navigator.mediaDevices.getUserMedia({ video: true })`. The browser shows the "camera in use" indicator.
