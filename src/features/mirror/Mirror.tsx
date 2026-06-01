import { useEffect, useMemo, useRef, useState } from "react";
import { createRoomSync } from "../sync/yjsRoom";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import { startFrameStream, type FrameStreamHandle } from "./frameStream";

type AwarenessState = { name?: string; index?: number; frame?: string };

type Awareness = {
  clientID: number;
  setLocalStateField: (key: string, value: unknown) => void;
  getStates: () => Map<number, Record<string, unknown>>;
  on: (event: string, cb: () => void) => void;
  off: (event: string, cb: () => void) => void;
};

type Props = {
  roomId: string;
  myIndex: number;
  totalPhones: number;
  fps: number;
  width: number;
  quality: number;
  facingMode: "user" | "environment";
};

export function Mirror({ roomId, myIndex, totalPhones, fps, width, quality, facingMode }: Props) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<string | null>(null);
  const [peers, setPeers] = useState(0);
  const handleRef = useRef<FrameStreamHandle | null>(null);

  const mesh = useMemo(() => {
    if (!armed) return null;
    return createRoomSync(roomId);
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return;
    void maybeFetchTurnCredentials();
  }, [armed]);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      mesh?.provider?.destroy();
    };
  }, [mesh]);

  // Start camera + publish frames via awareness
  useEffect(() => {
    if (!armed || !mesh?.provider) return undefined;
    let cancelled = false;
    const awareness = (mesh.provider as unknown as { awareness: Awareness }).awareness;
    awareness.setLocalStateField("mirror", { index: myIndex, frame: undefined });

    const onFrame = (dataUrl: string) => {
      if (cancelled) return;
      awareness.setLocalStateField("mirror", { index: myIndex, frame: dataUrl });
    };

    void (async () => {
      try {
        const h = await startFrameStream(fps, width, quality, facingMode, onFrame);
        if (cancelled) {
          h.stop();
          return;
        }
        handleRef.current = h;
      } catch (err) {
        setError(`Camera access failed: ${(err as Error).message}`);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, [armed, mesh, myIndex, fps, width, quality, facingMode]);

  // Receive the previous-peer frame from awareness
  useEffect(() => {
    if (!mesh?.provider) return undefined;
    const awareness = (mesh.provider as unknown as { awareness: Awareness }).awareness;
    const wantIndex = (myIndex - 1 + totalPhones) % totalPhones;
    const refresh = () => {
      const states = awareness.getStates();
      let count = 0;
      let bestFrame: string | null = null;
      states.forEach((state, id) => {
        if (id === awareness.clientID) return;
        const m = state["mirror"] as AwarenessState | undefined;
        if (!m) return;
        count++;
        if (m.index === wantIndex && m.frame) bestFrame = m.frame;
      });
      setPeers(count);
      setFrame(bestFrame);
    };
    awareness.on("change", refresh);
    refresh();
    return () => {
      awareness.off("change", refresh);
    };
  }, [mesh, myIndex, totalPhones]);

  if (!armed) {
    return (
      <div className="mirror-arm">
        <h1>mesh-mirror</h1>
        <p>
          Each phone shows the live camera of the phone <em>before</em> it in the ring. Chain enough
          of them and the loop closes on itself — a low-fi, dreamy infinite mirror.
        </p>
        <p>
          <strong>Try it with 2 tabs:</strong> open this room in a second tab (or on another phone),
          set its position to <strong>2</strong> in Settings, and arm both. Each then shows the
          other's camera.
        </p>
        <p className="mirror-meta">
          This phone:{" "}
          <strong>
            {myIndex + 1} of {totalPhones}
          </strong>{" "}
          · {facingMode === "user" ? "front" : "rear"} camera · shows phone{" "}
          <strong>{((myIndex - 1 + totalPhones) % totalPhones) + 1}</strong>
        </p>
        <button type="button" className="mirror-arm-button" onClick={() => setArmed(true)}>
          Open camera & connect
        </button>
        <p className="mirror-hint">
          Set this phone's position and the ring size in Settings (⚙). Low fps + small frames are
          the dreamy look on purpose — crank them up there if you want it crisper (and warmer).
        </p>
      </div>
    );
  }

  return (
    <div className="mirror-stage">
      <div className="mirror-hud">
        {peers + 1} in ring · phone {myIndex + 1} → shows{" "}
        {((myIndex - 1 + totalPhones) % totalPhones) + 1}
      </div>
      {error && <p className="mirror-error">{error}</p>}
      <div className="mirror-display">
        {frame ? (
          <img className="mirror-frame" src={frame} alt="" />
        ) : (
          <div className="mirror-waiting">
            {peers === 0 ? (
              <p>waiting for another phone to join this room…</p>
            ) : (
              <p>
                connected — waiting for phone {((myIndex - 1 + totalPhones) % totalPhones) + 1}…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
