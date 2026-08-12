import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAudioEngine
 * ---------------------------------------------------------------------------
 * Custom hook that drives AuraFlow's layered ambient audio playback using
 * native HTML5 `Audio` instances (no external audio library).
 *
 * Given the currently active FocusMood, it:
 *  - Creates one looping `Audio` element for `activeMood.mainTrackUrl`.
 *  - Creates one looping `Audio` element per entry in `activeMood.ambientLayers`
 *    (Lofi melodies, rain noise, wind loops, etc. — up to 3 peripheral
 *    channels that can be layered independently on top of the main track).
 *  - Tears down (pause + clear src + null out) all Audio instances belonging
 *    to the previous mood whenever `activeMood.id` changes, so nothing keeps
 *    playing/leaking in the background ("clean garbage collection").
 *  - Tears down everything on unmount.
 *  - Never calls `.play()` on mount / mood-change automatically — playback
 *    only ever starts from a user gesture (togglePlay / setLayerVolume /
 *    setMainVolume), respecting browser autoplay restrictions.
 *
 * FocusMood shape this hook is coded against (owned by another engineer in
 * src/data/moods.js — intentionally NOT imported here):
 *   {
 *     id: string,
 *     name: string,
 *     coverImage: string,
 *     mainTrackUrl: string,
 *     ambientLayers: [{ id: string, name: string, url: string }] // up to 3
 *   }
 *
 * @param {object|null} activeMood - the currently selected FocusMood, or null
 *   if nothing is selected yet.
 *
 * @returns {{
 *   isPlaying: boolean,
 *     - whether the main track is currently (intended to be) playing.
 *   togglePlay: () => void,
 *     - play/pause the main track. Also resumes/pauses any ambient layer
 *       that currently has volume > 0, so layered channels stay in sync
 *       with the main transport state.
 *   layers: Array<{ id: string, name: string, volume: number }>,
 *     - current volume (0-1) per ambient layer, in the same order as
 *       activeMood.ambientLayers.
 *   setLayerVolume: (layerId: string, volume: number) => void,
 *     - set an ambient layer's volume (0-1). volume === 0 pauses/mutes that
 *       layer; volume > 0 starts/keeps it playing at that volume, but only
 *       if the engine's overall isPlaying state is true (if the main
 *       transport is paused, layers will not audibly play until
 *       togglePlay/resume happens).
 *   mainVolume: number,
 *     - current main-track volume (0-1).
 *   setMainVolume: (volume: number) => void,
 *     - set the main track's volume (0-1). Does not itself start playback;
 *       use togglePlay for that.
 * }}
 */
export default function useAudioEngine(activeMood) {
  const mainAudioRef = useRef(null);
  const layerAudiosRef = useRef(new Map()); // layerId -> HTMLAudioElement

  const [isPlaying, setIsPlaying] = useState(false);
  const [mainVolume, setMainVolumeState] = useState(0.8);
  const [layerVolumes, setLayerVolumes] = useState({}); // layerId -> volume (0-1)

  const moodId = activeMood?.id ?? null;

  /** Fully stop + release an Audio element so it can be garbage collected. */
  const destroyAudio = useCallback((audio) => {
    if (!audio) return;
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.src = "";
      audio.load();
    } catch {
      // no-op: best-effort teardown
    }
  }, []);

  // (Re)build the Audio graph whenever the active mood changes.
  useEffect(() => {
    // Tear down the previous mood's audio instances first, to avoid any
    // overlapping/leaking playback while the new mood spins up.
    destroyAudio(mainAudioRef.current);
    mainAudioRef.current = null;

    layerAudiosRef.current.forEach((audio) => destroyAudio(audio));
    layerAudiosRef.current = new Map();

    // Reset transport state — new mood always starts paused (no autoplay).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on mood change, not a derived-state anti-pattern
    setIsPlaying(false);

    if (!activeMood) {
      setLayerVolumes({});
      return undefined;
    }

    // Main background loop.
    if (activeMood.mainTrackUrl) {
      const main = new Audio(activeMood.mainTrackUrl);
      main.loop = true;
      main.preload = "auto";
      main.volume = mainVolume;
      mainAudioRef.current = main;
    }

    // Up to 3 peripheral ambient layers (Lofi melodies, rain, wind, ...).
    const layers = Array.isArray(activeMood.ambientLayers)
      ? activeMood.ambientLayers
      : [];
    const nextLayerAudios = new Map();
    const nextLayerVolumes = {};

    layers.forEach((layer) => {
      const audio = new Audio(layer.url);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      nextLayerAudios.set(layer.id, audio);
      nextLayerVolumes[layer.id] = 0;
    });

    layerAudiosRef.current = nextLayerAudios;
    setLayerVolumes(nextLayerVolumes);

    // Cleanup on unmount / before the next mood swap runs.
    return () => {
      destroyAudio(mainAudioRef.current);
      mainAudioRef.current = null;
      layerAudiosRef.current.forEach((audio) => destroyAudio(audio));
      layerAudiosRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodId, destroyAudio]);

  // Keep the main <audio> element's volume in sync with state.
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = mainVolume;
    }
  }, [mainVolume]);

  /** Play/pause the main track, and sync any active (volume > 0) layers. */
  const togglePlay = useCallback(() => {
    const main = mainAudioRef.current;
    if (!main) return;

    setIsPlaying((prevPlaying) => {
      const next = !prevPlaying;

      if (next) {
        main.volume = mainVolume;
        main.play().catch(() => {
          /* autoplay/interruption errors are safe to swallow here */
        });
        layerAudiosRef.current.forEach((audio, layerId) => {
          const vol = layerVolumes[layerId] ?? 0;
          if (vol > 0) {
            audio.volume = vol;
            audio.play().catch(() => {});
          }
        });
      } else {
        main.pause();
        layerAudiosRef.current.forEach((audio) => audio.pause());
      }

      return next;
    });
  }, [mainVolume, layerVolumes]);

  /** Set an individual ambient layer's volume; starts/stops it as needed. */
  const setLayerVolume = useCallback(
    (layerId, volume) => {
      const clamped = Math.max(0, Math.min(1, volume));
      const audio = layerAudiosRef.current.get(layerId);

      setLayerVolumes((prev) => ({ ...prev, [layerId]: clamped }));

      if (!audio) return;

      audio.volume = clamped;

      if (clamped > 0 && isPlaying) {
        // Only actually play if the overall transport is running and this
        // call is happening from a user gesture (slider drag).
        audio.play().catch(() => {});
      } else if (clamped === 0) {
        audio.pause();
      }
    },
    [isPlaying]
  );

  /** Set the main track's volume (0-1). */
  const setMainVolume = useCallback((volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMainVolumeState(clamped);
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = clamped;
    }
  }, []);

  const layers = (activeMood?.ambientLayers ?? []).map((layer) => ({
    id: layer.id,
    name: layer.name,
    volume: layerVolumes[layer.id] ?? 0,
  }));

  return {
    isPlaying,
    togglePlay,
    layers,
    setLayerVolume,
    mainVolume,
    setMainVolume,
  };
}
