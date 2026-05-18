type Facing = "user" | "environment";

type Props = {
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

export function SettingsExtras(props: Props) {
  const {
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

  return (
    <>
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

      <p className="mesh-settings-help">
        Higher fps/width/quality = crisper image, more bandwidth, hotter phone. Default 7 fps × 320
        px is the dreamy infinite-mirror sweet spot.
      </p>
    </>
  );
}
