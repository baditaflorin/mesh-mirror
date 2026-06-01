import { expect, test, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer assertion for the ADVERTISED core action:
 *
 *   "Phones in a ring show each other's live camera feed — phone N's screen
 *    shows phone (N+1)'s view."
 *
 * Concretely: each phone opens its camera, draws frames to a canvas, JPEG-
 * encodes them, and publishes the latest frame into its Yjs *awareness*
 * state keyed by its ring index. Each phone reads the awareness state of the
 * *previous* ring index and renders that peer's frame as `<img.mirror-frame>`.
 *
 * Ring of two phones (totalPhones=2): peer A is index 0, peer B is index 1.
 * Peer B's want-index is (1 - 1 + 2) % 2 = 0 = peer A. So peer B's screen must
 * show peer A's camera — the advertised "you see your neighbour's camera".
 *
 * The fake camera is supplied by chromium launch flags in playwright.config
 * (`--use-fake-device-for-media-stream`), so getUserMedia resolves headless.
 */

const SIGNALING = "ws://localhost:1/never-connects";

/** Register a per-peer localStorage init (room + distinct ring index). */
function peerInit(context: BrowserContext, roomId: string, index: number) {
  return context.addInitScript(
    ({ prefix, room, sig, idx }) => {
      try {
        localStorage.setItem(`${prefix}:room`, room);
        localStorage.setItem(`${prefix}:signalingUrl`, sig);
        localStorage.removeItem(`${prefix}:iceServers`);
        localStorage.setItem(`${prefix}:myIndex`, String(idx));
        localStorage.setItem(`${prefix}:total`, "2");
        localStorage.setItem(`${prefix}:fps`, "10");
      } catch {
        // ignore
      }
    },
    { prefix: storagePrefix, room: roomId, sig: SIGNALING, idx: index },
  );
}

test("peer A's live camera frame propagates to peer B's screen across the mesh", async ({
  browser,
  baseURL,
}) => {
  const url = baseURL ?? "";
  const roomId = `e2e-${Math.random().toString(36).slice(2, 8)}`;

  // One context so y-webrtc's BroadcastChannel fallback syncs the two pages
  // (doc + awareness) with no signaling server / no network.
  const context = await browser.newContext({
    baseURL: url || undefined,
    permissions: ["camera"],
  });

  try {
    await peerInit(context, roomId, 0);
    const a = await context.newPage();
    await a.goto(url);

    await peerInit(context, roomId, 1);
    const b = await context.newPage();
    await b.goto(url);

    // Arm both peers — opens the (fake) camera and starts the frame stream +
    // awareness publish/subscribe wiring.
    await a.getByRole("button", { name: /open camera/i }).click();
    await b.getByRole("button", { name: /open camera/i }).click();

    await expect(a.locator(".mirror-hud")).toBeVisible();
    await expect(b.locator(".mirror-hud")).toBeVisible();

    // Cross-peer presence must surface in the HUD: once both peers' awareness
    // states have synced, each phone counts the other and reports "2 in ring".
    // This fails if presence never crosses the mesh (e.g. wrong room key).
    await expect(a.locator(".mirror-hud")).toContainText("2 in ring", { timeout: 15_000 });
    await expect(b.locator(".mirror-hud")).toContainText("2 in ring", { timeout: 15_000 });

    // Peer B (index 1) renders peer A's (index 0) frame from awareness.
    const bFrame = b.locator("img.mirror-frame");
    await expect(bFrame).toBeVisible({ timeout: 15_000 });
    const src = await bFrame.getAttribute("src");
    expect(src, "B should render a JPEG dataURL sourced from A's camera").toMatch(
      /^data:image\/jpeg/,
    );
    await expect(b.locator(".mirror-waiting")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

/**
 * Strict cross-peer discriminator.
 *
 * Peer B's camera is DENIED (getUserMedia rejects), so B can never produce a
 * frame of its own. The ONLY way `img.mirror-frame` can appear on B is if peer
 * A's frame crossed the mesh via the shared awareness channel.
 *
 * This is the assertion that fails on the realistic regression where frames
 * are written to React `useState` instead of awareness (or to an index B never
 * reads): with no own-camera fallback, B would be stuck on `.mirror-waiting`.
 */
test("peer B with no camera still receives peer A's frame purely over the mesh", async ({
  browser,
  baseURL,
}) => {
  const url = baseURL ?? "";
  const roomId = `e2e-${Math.random().toString(36).slice(2, 8)}`;

  const context = await browser.newContext({
    baseURL: url || undefined,
    permissions: ["camera"],
  });

  try {
    await peerInit(context, roomId, 0);
    const a = await context.newPage();
    await a.goto(url);

    // Peer B: break its OWN camera so B can never self-render a frame.
    await peerInit(context, roomId, 1);
    const b = await context.newPage();
    await b.addInitScript(() => {
      const md = navigator.mediaDevices;
      if (md) {
        md.getUserMedia = () => Promise.reject(new Error("camera denied for test"));
      }
    });
    await b.goto(url);

    await a.getByRole("button", { name: /open camera/i }).click();
    await b.getByRole("button", { name: /open camera/i }).click();

    await expect(a.locator(".mirror-hud")).toBeVisible();
    await expect(b.locator(".mirror-hud")).toBeVisible();

    // B has no camera of its own; the frame it shows can only be A's, arriving
    // over the awareness channel.
    const bFrame = b.locator("img.mirror-frame");
    await expect(bFrame).toBeVisible({ timeout: 15_000 });
    const src = await bFrame.getAttribute("src");
    expect(src, "B (no camera) must be showing A's frame from the mesh").toMatch(
      /^data:image\/jpeg/,
    );
  } finally {
    await context.close();
  }
});
