# Virtual Museum

A 3D Virtual Museum web app built with React, Vite, Three.js (@react-three/fiber + @react-three/drei), and Framer Motion.

## Tech Stack
- React 19 + Vite 7
- Three.js / @react-three/fiber / @react-three/drei
- Framer Motion, Lucide React

## Features
- **Three view modes** (switch in the top nav, or press 1/2/3):
  - **Viewer** — single exhibit centered, drag to rotate, scroll to zoom
  - **Gallery** — walkable museum room with paintings on the walls and statues on pedestals along the centerline; camera animates between exhibits
  - **Grid** — every exhibit arranged in a grid; click any exhibit to focus
- **Custom 3D models** — load any direct `.glb` URL at runtime via the "Add" dialog (Sketchfab models must be downloaded first and re-hosted on a CORS-enabled CDN)
- **Ambient audio** — procedural museum drone (WebAudio, no asset) with mute toggle
- **Thumbnail strip** to jump between exhibits, prev/next controls, fullscreen
- **Mobile-friendly** layout with responsive UI
- **Improved rendering**: ACES tone mapping, proper lighting rig (key/fill/spot), reflective marble floor in walkable mode, per-exhibit spotlights, shadow casting on the active exhibit only for performance

## Project Layout
```
src/
  App.jsx                   # Orchestrator + global UI state (mode, currentIndex)
  data/models.js            # Built-in exhibit metadata (Sketchfab models in HeroModels/)
  hooks/useAmbientAudio.js  # Procedural ambient drone via WebAudio API
  components/
    ModelLoader.jsx         # Lazy registry + RemoteGLB + material/shadow polish + error boundary
    MuseumRoom.jsx          # Walls/floor/ceiling, Pedestal, ExhibitSpotlight
    ExhibitDisplay.jsx      # One exhibit (statue-on-pedestal vs painting-on-wall) with spotlight
    ui/                     # Navbar, InfoPanel, Controls, ThumbnailStrip, AudioBtn, FullscreenBtn, AddModelDialog
  scenes/
    ViewerScene.jsx         # Single exhibit centered
    WalkableScene.jsx       # Hallway gallery with all exhibits + camera lerp
    GridScene.jsx           # Grid of exhibits, click to focus
HeroModels/                  # Auto-generated GLTFJSX components for each Sketchfab model
public/models/               # The .glb files
```

## Replit Setup
- Workflow: `Start application` runs `npm run dev` on port 5000 (webview).
- Vite is configured with host `0.0.0.0`, port `5000`, and `allowedHosts: true` so the Replit preview proxy can reach it.
- Deployment: `static` target — builds with `npm run build`, serves `dist/`.

## Notes
- Each scene + each model is lazy-loaded so initial bundle stays small.
- WebGL is required; the in-Replit screenshot preview is headless and can't render WebGL, but real browsers will display the museum normally.

## User Preferences
(none yet)
