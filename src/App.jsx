import { useState } from 'react';
import CoverFlowCarousel, { AmbientBackground } from './components/CoverFlowCarousel';
import PomodoroDock from './components/PomodoroDock';
import VolumeMixerPanel from './components/VolumeMixerPanel';
import useAudioEngine from './hooks/useAudioEngine';
import { focusMoods } from './data/moods';

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMood = focusMoods[activeIndex];

  const { isPlaying, togglePlay, layers, setLayerVolume, mainVolume, setMainVolume } =
    useAudioEngine(activeMood);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4">
      <AmbientBackground activeMood={activeMood} />

      <header className="relative z-10 mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          AuraFlow
        </h1>
        <p className="mt-1 text-sm text-white/60">{activeMood.name}</p>
      </header>

      <main className="relative z-10 w-full max-w-4xl">
        <CoverFlowCarousel
          moods={focusMoods}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      </main>

      <PomodoroDock isPlaying={isPlaying} onTogglePlay={togglePlay}>
        <VolumeMixerPanel
          layers={layers}
          setLayerVolume={setLayerVolume}
          mainVolume={mainVolume}
          setMainVolume={setMainVolume}
        />
      </PomodoroDock>
    </div>
  );
}
