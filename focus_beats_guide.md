# Project Guide: AuraFlow (Premium 3D Cover Flow Focus Web App)

Welcome to the **AuraFlow** project guide! This blueprint outlines how to build a premium, immersive ambient audio and Pomodoro web player from scratch. It leverages high-performance UI styling and dynamic background image bleeding.

---

## 🎨 Visual Identity & UI Aesthetic

* **Core Feature:** A central 3D Cover Flow/Carousel layout holding visual cards representing distinct ambient environments (e.g., Tokyo Lofi, Autumn Forest).
* **Background:** Apple Music-inspired Blur Ambient Glow. The background dynamically mirrors the color palette of the active card with extreme gaussian blur.
* **Floating Controls:** A bottom glassmorphic navigation deck housing playback tools and an integrated aesthetic Pomodoro countdown.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React + Vite + Tailwind CSS.
* **Audio Handling:** Native HTML5 Audio elements managed via React audio instances.
* **Data Architecture:** Fully dynamic context streams using high-quality copyright-free audio links from public CDN mirrors.

---

## 📐 Local Audio Payload Structure
```typescript
interface FocusMood {
  id: string;
  name: string;
  coverImage: string;
  mainTrackUrl: string;
  ambientLayers: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}
```

---

## 🛠️ Phase-by-Phase Vibe Coding Prompts

### 🎬 Phase 1: The 3D Cover Flow Carousel Layout
**Objective:** Build a responsive centered viewport containing depth-layered environment display cards.

> **Vibe Coding Prompt 1:**
> "Help me create a single-page React app with Vite and Tailwind CSS. Build a centered 3D Cover Flow horizontal card carousel representing different Focus Moods. The center card should look large and prominent, with surrounding cards perspective-tilted and layered beneath it with clear Z-indexing. Add dynamic background styling where the body wrapper uses a massive CSS blur effect that automatically matches the color gradient palette of the actively centered card."

---

### ⏱️ Phase 2: The Floating Media Player Pomodoro Dock
**Objective:** Create the bottom translucent timer panel and automate automated cycles.

> **Vibe Coding Prompt 2:**
> "Let's build the floating glass navigation dock at the bottom of the screen. Inside this translucent control bar, add:
> 1. A prominent minimalist Pomodoro countdown timer (default 25:00) tracking remaining time.
> 2. Play, Pause, and Reset vector media buttons using Lucide React.
> 3. Automated cycle progression logic: when the countdown hits 0:00, automatically switch states from Focus to a 5-minute Rest cycle, update the page header title string context dynamically to reflect active timing, and trigger a subtle alert ring sound."

---

### 🎵 Phase 3: The Multi-Layer Audio Mix Matrix Engine
**Objective:** Wire up dynamic ambient layering links and slide-out volume balance handles.

> **Vibe Coding Prompt 3:**
> "Let's implement the audio balance engine. Define a structural JavaScript config block holding public stream URLs for environmental tracks (Lofi background melodies, steady rain noise, distant wind loops). When a carousel card becomes active, fetch the main background loop path. Additionally, build a smooth toggle sub-panel inside the floating media control dock containing individual volume track slider toggles so users can independently layer up to 3 additional peripheral channels seamlessly."

---

## ⚡ Best Practices
1. **Tab Optimization:** Use clear `useEffect` routines tracking document status alerts to prevent timers sleeping when users unfocus target windows.
2. **Clean Garbage Collection:** Ensure dynamic audio updates correctly destroy previous audio player memory buffers on subsequent canvas card rotations.

Your architecture is locked in. Run your local server and begin vibe coding!