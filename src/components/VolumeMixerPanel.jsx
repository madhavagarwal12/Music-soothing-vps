import { useState } from "react";
import { SlidersHorizontal, Music2, Waves } from "lucide-react";

/**
 * VolumeMixerPanel
 * ---------------------------------------------------------------------------
 * Compact, self-contained toggle sub-panel meant to be dropped inline inside
 * another engineer's floating "PomodoroDock" glass control bar, e.g.:
 *
 *   <PomodoroDock ...>
 *     <VolumeMixerPanel
 *       layers={layers}
 *       setLayerVolume={setLayerVolume}
 *       mainVolume={mainVolume}
 *       setMainVolume={setMainVolume}
 *     />
 *   </PomodoroDock>
 *
 * Renders a small icon button that expands/collapses a dark glassmorphic
 * mixer sub-panel with one slider for the main track volume plus one slider
 * per ambient layer (up to 3), each independently adjustable 0-100%.
 *
 * Props (mirrors the return shape of useAudioEngine):
 *  - layers: Array<{ id: string, name: string, volume: number }>
 *  - setLayerVolume: (layerId: string, volume: number) => void  // volume 0-1
 *  - mainVolume: number  // 0-1
 *  - setMainVolume: (volume: number) => void  // volume 0-1
 */
export default function VolumeMixerPanel({
  layers = [],
  setLayerVolume,
  mainVolume = 0,
  setMainVolume,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle volume mixer"
        className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-200 ${
          open ? "bg-white/20 text-white" : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
        }`}
      >
        <SlidersHorizontal size={18} />
      </button>

      <div
        className={`absolute bottom-full right-0 mb-3 w-64 origin-bottom-right overflow-hidden rounded-2xl bg-black/70 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl transition-all duration-[250ms] ease-out ${
          open
            ? "max-h-96 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 translate-y-1 opacity-0"
        }`}
        style={{ transitionProperty: "max-height, opacity, transform" }}
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Volume Mixer
          </p>

          <MixerSlider
            icon={<Music2 size={14} />}
            label="Main Track"
            value={mainVolume}
            onChange={(v) => setMainVolume?.(v)}
          />

          {layers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
              {layers.map((layer) => (
                <MixerSlider
                  key={layer.id}
                  icon={<Waves size={14} />}
                  label={layer.name}
                  value={layer.volume}
                  onChange={(v) => setLayerVolume?.(layer.id, v)}
                />
              ))}
            </div>
          )}

          {layers.length === 0 && (
            <p className="text-xs text-white/40">No ambient layers for this mood.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MixerSlider
 * Single labeled 0-100% volume slider row, styled to match the dark
 * glassmorphic dock theme.
 *
 * Props:
 *  - icon: ReactNode
 *  - label: string
 *  - value: number  // 0-1
 *  - onChange: (volume: number) => void  // 0-1
 */
function MixerSlider({ icon, label, value = 0, onChange }) {
  const percent = Math.round(value * 100);

  return (
    <label className="flex flex-col gap-1.5 text-white/80">
      <span className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-white/50">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="tabular-nums text-white/40">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(e) => onChange?.(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/40
          [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
      />
    </label>
  );
}
