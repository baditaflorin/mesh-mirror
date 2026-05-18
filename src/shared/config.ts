export const appConfig = {
  appName: "mesh-mirror",
  storagePrefix: "mesh-mirror",
  description:
    "Phones in a ring show each other's live camera feed — an infinite low-fi mirror across the room.",
  accentHex: "#5ed3ff",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  repositoryUrl: "https://github.com/baditaflorin/mesh-mirror",
  pagesUrl: "https://baditaflorin.github.io/mesh-mirror/",
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
} as const;
