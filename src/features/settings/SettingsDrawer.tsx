import { useEffect, useState } from "react";
import {
  loadSignalingUrl,
  loadTurnTokenUrl,
  resetIceServers,
  saveSignalingUrl,
  saveTurnTokenUrl,
} from "../sync/iceConfig";
import { appConfig } from "../../shared/config";

type Facing = "user" | "environment";

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onRoomChange: (next: string) => void;
  myIndex: number;
  onMyIndexChange: (next: number) => void;
  totalPhones: number;
  onTotalPhonesChange: (next: number) => void;
  fps: number;
  onFpsChange: (next: number) => void;
  width: number;
  onWidthChange: (next: number) => void;
  quality: number;
  onQualityChange: (next: number) => void;
  facing: Facing;
  onFacingChange: (next: Facing) => void;
};

export function SettingsDrawer(props: Props) {
  const {
    open,
    onClose,
    roomId,
    onRoomChange,
    myIndex,
    onMyIndexChange,
    totalPhones,
    onTotalPhonesChange,
    fps,
    onFpsChange,
    width,
    onWidthChange,
    quality,
    onQualityChange,
    facing,
    onFacingChange,
  } = props;
  const [signaling, setSignaling] = useState(loadSignalingUrl());
  const [tokenUrl, setTokenUrl] = useState(loadTurnTokenUrl());

  useEffect(() => {
    if (open) {
      setSignaling(loadSignalingUrl());
      setTokenUrl(loadTurnTokenUrl());
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <label>
          <span>Room ID</span>
          <input value={roomId} onChange={(e) => onRoomChange(e.target.value)} />
        </label>

        <label>
          <span>This phone's position</span>
          <input
            type="number"
            min={1}
            max={totalPhones}
            value={myIndex + 1}
            onChange={(e) =>
              onMyIndexChange(Math.max(0, Math.min(totalPhones - 1, Number(e.target.value) - 1)))
            }
          />
        </label>

        <label>
          <span>Total phones in ring</span>
          <input
            type="number"
            min={2}
            max={10}
            value={totalPhones}
            onChange={(e) => onTotalPhonesChange(Math.max(2, Math.min(10, Number(e.target.value))))}
          />
        </label>

        <label>
          <span>Camera</span>
          <select value={facing} onChange={(e) => onFacingChange(e.target.value as Facing)}>
            <option value="user">Front (selfie) — for the mirror look</option>
            <option value="environment">Rear — for showing what you're aiming at</option>
          </select>
        </label>

        <label>
          <span>FPS ({fps})</span>
          <input
            type="range"
            min={1}
            max={20}
            value={fps}
            onChange={(e) => onFpsChange(Number(e.target.value))}
          />
        </label>

        <label>
          <span>Frame width ({width} px)</span>
          <input
            type="range"
            min={160}
            max={640}
            step={20}
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
          />
        </label>

        <label>
          <span>JPEG quality ({(quality * 100).toFixed(0)}%)</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
          />
        </label>

        <p className="settings-help">
          Higher fps/width/quality = crisper image, more bandwidth, hotter phone. Default 7 fps ×
          320 px is the dreamy infinite-mirror sweet spot.
        </p>

        <hr />

        <h3>Self-hosted infra (advanced)</h3>

        <label>
          <span>Signaling URL</span>
          <input
            value={signaling}
            onChange={(e) => setSignaling(e.target.value)}
            placeholder={appConfig.signalingUrl}
          />
        </label>

        <label>
          <span>TURN credentials URL</span>
          <input
            value={tokenUrl}
            onChange={(e) => setTokenUrl(e.target.value)}
            placeholder={appConfig.turnTokenUrl}
          />
        </label>

        <div className="settings-actions">
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl(signaling);
              saveTurnTokenUrl(tokenUrl);
              onClose();
              location.reload();
            }}
          >
            Save and reload
          </button>
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl("");
              saveTurnTokenUrl("");
              resetIceServers();
              onClose();
              location.reload();
            }}
          >
            Reset
          </button>
        </div>

        <hr />

        <footer className="settings-footer">
          <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
            source on github
          </a>
          <span>
            v{appConfig.version} · {appConfig.commit}
          </span>
        </footer>
      </div>
    </div>
  );
}
