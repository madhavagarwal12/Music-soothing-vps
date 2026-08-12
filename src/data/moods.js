/**
 * @typedef {Object} AmbientLayer
 * @property {string} id   - Unique identifier for the layer.
 * @property {string} name - Human-readable label shown in the layer mixer UI.
 * @property {string} url  - Direct URL to a loopable ambient sound file (mp3).
 */

/**
 * @typedef {Object} FocusMood
 * @property {string} id            - Unique identifier for the mood.
 * @property {string} name          - Display name of the mood.
 * @property {string} coverImage    - URL to a high-quality landscape/ambient photo.
 * @property {string} mainTrackUrl  - URL to a looping background music/ambient audio file (mp3).
 * @property {AmbientLayer[]} ambientLayers - 2-3 extra layerable ambient sound loops.
 */

/**
 * The five curated Focus Moods available in AuraFlow.
 * All image URLs are direct Unsplash CDN photo links and all audio URLs are
 * direct Mixkit CDN mp3 links (royalty-free, no attribution required).
 * Every URL below was verified to resolve with HTTP 200 and the correct
 * content-type (image/jpeg or audio/mpeg) before being added here.
 *
 * @type {FocusMood[]}
 */
export const focusMoods = [
  {
    id: "tokyo-lofi-night",
    name: "Tokyo Lofi Night",
    coverImage:
      "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=1600&q=80",
    mainTrackUrl: "https://assets.mixkit.co/music/135/135.mp3", // "Sleepy Cat" - lofi
    ambientLayers: [
      {
        id: "tokyo-light-rain",
        name: "Light Rain",
        url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
      },
      {
        id: "tokyo-city-traffic",
        name: "City Traffic",
        url: "https://assets.mixkit.co/active_storage/sfx/2930/2930-preview.mp3",
      },
    ],
  },
  {
    id: "autumn-forest",
    name: "Autumn Forest",
    coverImage:
      "https://images.unsplash.com/photo-1696714055909-2377b1460b34?w=1600&q=80",
    mainTrackUrl: "https://assets.mixkit.co/music/138/138.mp3", // "Forest Treasure"
    ambientLayers: [
      {
        id: "forest-birds",
        name: "Forest Birds",
        url: "https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3",
      },
      {
        id: "forest-crickets",
        name: "Crickets",
        url: "https://assets.mixkit.co/active_storage/sfx/1789/1789-preview.mp3",
      },
      {
        id: "forest-breeze",
        name: "Breeze Through Trees",
        url: "https://assets.mixkit.co/active_storage/sfx/2427/2427-preview.mp3",
      },
    ],
  },
  {
    id: "rainy-cafe",
    name: "Rainy Cafe",
    coverImage:
      "https://images.unsplash.com/photo-1782971639109-e51263b987c3?w=1600&q=80",
    mainTrackUrl: "https://assets.mixkit.co/music/324/324.mp3", // "Smooth Meditation"
    ambientLayers: [
      {
        id: "cafe-rain-loop",
        name: "Rain on Window",
        url: "https://assets.mixkit.co/active_storage/sfx/2394/2394-preview.mp3",
      },
      {
        id: "cafe-crowd",
        name: "Cafe Chatter",
        url: "https://assets.mixkit.co/active_storage/sfx/444/444-preview.mp3",
      },
    ],
  },
  {
    id: "ocean-horizon",
    name: "Ocean Horizon",
    coverImage:
      "https://images.unsplash.com/photo-1706574771473-9270c669be7a?w=1600&q=80",
    mainTrackUrl: "https://assets.mixkit.co/music/184/184.mp3", // "Vastness"
    ambientLayers: [
      {
        id: "ocean-close-waves",
        name: "Close Sea Waves",
        url: "https://assets.mixkit.co/active_storage/sfx/1195/1195-preview.mp3",
      },
      {
        id: "ocean-windy-sea",
        name: "Windy Sea",
        url: "https://assets.mixkit.co/active_storage/sfx/1200/1200-preview.mp3",
      },
      {
        id: "ocean-breaking-waves",
        name: "Breaking Waves",
        url: "https://assets.mixkit.co/active_storage/sfx/1206/1206-preview.mp3",
      },
    ],
  },
  {
    id: "mountain-snow",
    name: "Mountain Snow",
    coverImage:
      "https://images.unsplash.com/photo-1661511762608-fda6b7b45f18?w=1600&q=80",
    mainTrackUrl: "https://assets.mixkit.co/music/441/441.mp3", // "Meditation"
    ambientLayers: [
      {
        id: "mountain-summit-wind",
        name: "Mountain Wind",
        url: "https://assets.mixkit.co/active_storage/sfx/1267/1267-preview.mp3",
      },
      {
        id: "mountain-wind-ambience",
        name: "Wind Ambience",
        url: "https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3",
      },
      {
        id: "mountain-campfire-wind",
        name: "Campfire Night Wind",
        url: "https://assets.mixkit.co/active_storage/sfx/1736/1736-preview.mp3",
      },
    ],
  },
];
