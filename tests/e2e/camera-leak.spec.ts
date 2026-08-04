import { expect, test } from "@playwright/test";

/**
 * Regression test for a camera-release bug in `startFrameStream`
 * (src/features/mirror/frameStream.ts).
 *
 * Sequence in the source:
 *   1. `await navigator.mediaDevices.getUserMedia(...)` — acquires the
 *      camera. The browser's "camera in use" indicator turns on here.
 *   2. `await video.play()` — can reject (autoplay policy, a video element
 *      that never became ready, iOS Safari quirks, etc.) even though the
 *      stream was already granted.
 *   3. `canvas.getContext("2d")` — can return null on some embedded/locked-
 *      down webviews.
 *
 * Before the fix, any failure in steps 2–3 threw out of `startFrameStream`
 * *without* calling `stream.getTracks().forEach(t => t.stop())`. The
 * MediaStreamTrack acquired in step 1 was never released: the browser's
 * camera indicator stays on indefinitely, and the only way to turn it off
 * was to close the tab — since Mirror.tsx also has no retry/leave affordance
 * (see the second assertion below), the user was stuck staring at a "Camera
 * access failed" message with the camera light still on.
 *
 * This test forces failure at step 2 (`HTMLVideoElement.prototype.play`
 * rejects) and asserts that every track acquired by getUserMedia was
 * stopped, and that the UI offers a way to retry without a full page reload.
 */

test("camera is released when frame-stream setup fails after getUserMedia succeeds", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __stoppedTracks: number }).__stoppedTracks = 0;

    const OrigStop = MediaStreamTrack.prototype.stop;
    MediaStreamTrack.prototype.stop = function (this: MediaStreamTrack) {
      (window as unknown as { __stoppedTracks: number }).__stoppedTracks += 1;
      return OrigStop.call(this);
    };

    // Simulate a video element that never becomes playable (autoplay
    // rejection, decoder failure, etc.) even though getUserMedia succeeded.
    HTMLVideoElement.prototype.play = () => Promise.reject(new Error("play() rejected in test"));
  });

  await page.goto("./");
  await page.getByRole("button", { name: /open camera/i }).click();

  // The app surfaces the failure...
  await expect(page.locator(".mirror-error")).toContainText(/camera access failed/i, {
    timeout: 10_000,
  });

  // ...and must have released the camera stream it had already acquired.
  await expect
    .poll(async () =>
      page.evaluate(() => (window as unknown as { __stoppedTracks: number }).__stoppedTracks),
    )
    .toBeGreaterThan(0);

  // The user must be able to retry in-app rather than being stuck on a dead
  // end that only a full page reload can escape.
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
});
