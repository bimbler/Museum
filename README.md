# Museum
An AR Experience.

## Running the app
**Use a local web server** — do not open `index.html` directly (file://). Browsers block loading assets (models, MindAR targets) from file://. From the repo root run:

```bash
npx serve
```
Then open the URL shown (e.g. http://localhost:3000). Start AR, point at the exhibit card, then use "Load Buddha Model" in the panel.

## Comparison with official MindAR Three.js example
This project is aligned with the [MindAR ThreeJS Image Tracking](https://hiukim.github.io/mind-ar-js-doc/more-examples/threejs-image/) pattern:

| Aspect | Official example | This repo |
|--------|------------------|-----------|
| **Container** | `#container` with `100vw` × `100vh` | Same: dedicated `#container`, fixed full viewport |
| **MindAR init** | `MindARThree({ container, imageTargetSrc })` | Same; `imageTargetSrc` from `getAssetUrl()` for correct path |
| **Anchor** | `mindarThree.addAnchor(0)` | Same |
| **Content** | Plane at (0,0,0), size 1×0.55 (target aspect) | Cube/sphere at (0,0,0.5) in front of target; optional GLB loaded on button |
| **Start** | `mindarThree.start()` then `renderer.setAnimationLoop(render)` | Same |
| **Lights** | Not shown in minimal example | Hemisphere + directional + ambient for GLB |

Differences that were fixed to match or improve on the official setup:
- Use a dedicated **#container** so MindAR’s canvas/video get correct dimensions (body alone often has no explicit height).
- Resolve asset URLs with **import.meta.url** so `targets.mind` and `buddha.glb` load correctly regardless of server path.
- Place 3D objects at **Z = 0.5** in anchor space so they appear in front of the target (official plane sits on the target at Z = 0).
