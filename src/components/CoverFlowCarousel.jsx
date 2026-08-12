import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * AmbientBackground
 * Fixed, full-viewport ambient glow layer. Renders the active mood's cover
 * image heavily blurred and scaled up behind everything else, with a dark
 * gradient overlay for contrast (Apple Music "Now Playing" style glow).
 *
 * Props:
 *  - activeMood: FocusMood | undefined  -> { id, name, coverImage, ... }
 */
export function AmbientBackground({ activeMood }) {
  if (!activeMood) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Blurred, oversized cover image driving the ambient color glow */}
      <div
        key={activeMood.id}
        className="absolute inset-0 scale-125 transition-opacity duration-700 ease-out animate-in fade-in"
        style={{
          backgroundImage: `url(${activeMood.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(90px) saturate(1.5) brightness(0.85)",
          transform: "scale(1.25)",
        }}
      />
      {/* Contrast overlay so foreground UI stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

/**
 * CoverFlowCarousel
 * Centered 3D cover-flow carousel of Focus Mood cards.
 *
 * Props:
 *  - moods: Array<{ id, name, coverImage, mainTrackUrl, ambientLayers }>
 *  - activeIndex: number   -> index of the centered/active mood
 *  - onSelect: (index: number) => void  -> called on click / keyboard / swipe navigation
 */
export default function CoverFlowCarousel({ moods = [], activeIndex = 0, onSelect }) {
  const dragState = useRef({ startX: 0, dragging: false, moved: false });

  const clamp = useCallback(
    (i) => Math.max(0, Math.min(moods.length - 1, i)),
    [moods.length]
  );

  const goTo = useCallback(
    (i) => {
      if (!onSelect) return;
      const next = clamp(i);
      if (next !== activeIndex) onSelect(next);
    },
    [activeIndex, clamp, onSelect]
  );

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(activeIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, goTo]);

  // Simple pointer-drag / swipe support
  const handlePointerDown = (e) => {
    dragState.current = { startX: e.clientX, dragging: true, moved: false };
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.dragging) return;
    if (Math.abs(e.clientX - dragState.current.startX) > 5) {
      dragState.current.moved = true;
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    dragState.current.dragging = false;
    const SWIPE_THRESHOLD = 40;
    if (dx > SWIPE_THRESHOLD) {
      goTo(activeIndex - 1);
    } else if (dx < -SWIPE_THRESHOLD) {
      goTo(activeIndex + 1);
    }
  };

  if (!moods.length) return null;

  return (
    <div className="relative w-full">
      <div
        className="relative flex h-[420px] w-full items-center justify-center select-none"
        style={{ perspective: "1200px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          dragState.current.dragging = false;
        }}
      >
        <div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {moods.map((mood, i) => {
            const offset = i - activeIndex;
            const abs = Math.abs(offset);

            // Only render cards reasonably close to center for perf/clarity
            if (abs > 4) return null;

            const isActive = offset === 0;
            const dir = Math.sign(offset);

            const translateX = offset * 190;
            const translateZ = isActive ? 0 : -160 - abs * 40;
            const rotateY = isActive ? 0 : dir * -35;
            const scale = isActive ? 1 : Math.max(0.62, 1 - abs * 0.14);
            const opacity = abs > 3 ? 0 : 1 - abs * 0.22;
            const zIndex = 100 - abs;

            return (
              <button
                key={mood.id}
                type="button"
                aria-label={`Select focus mood: ${mood.name}`}
                aria-current={isActive}
                onClick={() => {
                  if (dragState.current.moved) return; // ignore click after drag
                  goTo(i);
                }}
                className="absolute left-1/2 top-1/2 w-56 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-2xl transition-transform duration-[400ms] ease-out"
                style={{
                  zIndex,
                  opacity,
                  transform: `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transitionProperty: "transform, opacity",
                  transitionDuration: "450ms",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm ${
                    isActive ? "shadow-2xl shadow-black/60" : "shadow-lg shadow-black/40"
                  }`}
                >
                  <img
                    src={mood.coverImage}
                    alt={mood.name}
                    draggable={false}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                    <p
                      className={`truncate text-center font-semibold text-white drop-shadow ${
                        isActive ? "text-base" : "text-sm text-white/80"
                      }`}
                    >
                      {mood.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prev / Next controls */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Previous mood"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex <= 0}
          className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex gap-1.5">
          {moods.map((mood, i) => (
            <button
              key={mood.id}
              type="button"
              aria-label={`Go to ${mood.name}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next mood"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex >= moods.length - 1}
          className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
