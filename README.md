# Halftone Studio

Professional DTF, DTG, and Screen Printing Halftone Prepress Suite.

Runs both as a high-performance web application (deployable on Vercel, Netlify, or any static host) and as a native Windows desktop suite via Electron.

---

## Features

- **10 Halftone Dot Geometries**: Round, Ellipse, Diamond, Square, Line Screen, Wave, Crosshatch, Ripple, Radial, and Stipple / Stochastic.
- **Frequency Control**: 10 to 85 LPI with one-click presets (25, 35, 45, 55, 65 LPI).
- **Screen Angles**: 0° to 90° with standard angle shortcuts.
- **Dot Scale & Edge Fade**: Smooth dot diameter tapering at alpha edges.
- **Photoshop-Style Tonal Levels**: Black Point, White Point, Midtone Gamma, Min Dot, and Max Solid ink limiters.
- **Garment Knockout Engine**: Knock out pure black, white, or custom colors to let garment fabric show through and save ink.
- **White Underbase Engine with Choke**: 0 to 5px morphological erosion choke to eliminate white ink halo bleed.
- **Micro-Dot Cleanup Filter**: 8-neighborhood kernel filter removing isolated 1–2px specks that cause printhead clogs.
- **Garment Simulator & Box Control**: Real-time shirt mockups with fabric colors, knit weave texture, and toggleable artboard boundary.
- **CMYK 4-Color Process Separation**: Automatic color separation into standard screen angles (C 15°, M 75°, Y 0°, K 45°).
- **Prepress Export Suite (300 DPI Native)**:
  - 300 DPI Halftone Separation PNG (with embedded `pHYs` chunk for RIP software)
  - 300 DPI White Underbase PNG
  - Garment Mockup PNG
  - CMYK Plates (Individual C, M, Y, K)
  - Prepress ZIP Package with specifications manifest
  - 15–75 LPI Calibration Test Sheet (300 DPI)
- **Infinite 2D Canvas Viewport**: Exact 1:1 pixel rendering, zero distortion, focal-point mouse-wheel zoom, pan, split-screen comparison slider, and 4x Loupe Dot Inspector.

---

## Web Deployment (Vercel)

This repository is preconfigured for instant deployment on Vercel:

1. Import this repository in [Vercel](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

The app will run 100% client-side in any modern browser with full Web Canvas and file export capabilities.

---

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Run in Web Browser
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run in Desktop Mode (Electron)
```bash
npm run electron:dev
```

### Build Desktop Windows `.exe` Installer
```bash
npm run electron:build
```
The packaged standalone `.exe` installer will be generated in the `release/` directory.

---

## License

MIT
