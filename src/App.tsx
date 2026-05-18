import { useEffect, useState } from "react";
import { Mirror } from "./features/mirror/Mirror";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";
import { InviteShareButton, MeshBeacon } from "@baditaflorin/mesh-common";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  myIndex: `${appConfig.storagePrefix}:myIndex`,
  total: `${appConfig.storagePrefix}:total`,
  fps: `${appConfig.storagePrefix}:fps`,
  width: `${appConfig.storagePrefix}:width`,
  quality: `${appConfig.storagePrefix}:quality`,
  facing: `${appConfig.storagePrefix}:facing`,
};

type Facing = "user" | "environment";

export function App() {
  const [roomId, setRoomId] = useState(() => localStorage.getItem(STORAGE.room) ?? "default");
  const [myIndex, setMyIndex] = useState(() =>
    Math.max(0, Number(localStorage.getItem(STORAGE.myIndex) ?? "0")),
  );
  const [totalPhones, setTotalPhones] = useState(() =>
    Math.max(2, Number(localStorage.getItem(STORAGE.total) ?? "3")),
  );
  const [fps, setFps] = useState(() =>
    Math.max(1, Number(localStorage.getItem(STORAGE.fps) ?? "7")),
  );
  const [width, setWidth] = useState(() =>
    Math.max(160, Number(localStorage.getItem(STORAGE.width) ?? "320")),
  );
  const [quality, setQuality] = useState(() =>
    Math.max(0.1, Math.min(0.95, Number(localStorage.getItem(STORAGE.quality) ?? "0.55"))),
  );
  const [facing, setFacing] = useState<Facing>(() => {
    const v = localStorage.getItem(STORAGE.facing);
    return v === "user" || v === "environment" ? v : "user";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.myIndex, String(myIndex));
  }, [myIndex]);
  useEffect(() => {
    localStorage.setItem(STORAGE.total, String(totalPhones));
  }, [totalPhones]);
  useEffect(() => {
    localStorage.setItem(STORAGE.fps, String(fps));
  }, [fps]);
  useEffect(() => {
    localStorage.setItem(STORAGE.width, String(width));
  }, [width]);
  useEffect(() => {
    localStorage.setItem(STORAGE.quality, String(quality));
  }, [quality]);
  useEffect(() => {
    localStorage.setItem(STORAGE.facing, facing);
  }, [facing]);

  return (
    <div className="app-root">
      <Mirror
        roomId={roomId}
        myIndex={Math.min(myIndex, totalPhones - 1)}
        totalPhones={totalPhones}
        fps={fps}
        width={width}
        quality={quality}
        facingMode={facing}
      />

      <InviteShareButton appName={appConfig.appName} roomId={roomId} />
      <MeshBeacon app={appConfig.appName} room={roomId} />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="self-ref">
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          source
        </a>
        <span aria-hidden="true">·</span>
        <a href={appConfig.paypalUrl} target="_blank" rel="noreferrer">
          tip ♥
        </a>
        <span aria-hidden="true">·</span>
        <span>
          v{appConfig.version} · {appConfig.commit}
        </span>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        myIndex={myIndex}
        onMyIndexChange={setMyIndex}
        totalPhones={totalPhones}
        onTotalPhonesChange={setTotalPhones}
        fps={fps}
        onFpsChange={setFps}
        width={width}
        onWidthChange={setWidth}
        quality={quality}
        onQualityChange={setQuality}
        facing={facing}
        onFacingChange={setFacing}
      />
    </div>
  );
}
