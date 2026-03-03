# Museum AR Experience

A professional, multi-page browser-based museum AR experience using MindAR (image tracking) and Three.js.

## 🎯 Features

### Multi-Page Architecture
- **Home Page**: Gamified entry screen with animated background
- **Museum Map**: Interactive SVG floor plan with tappable gallery zones
- **Art Collection**: Scrollable gallery of museum objects
- **Object Detail**: 3D preview with OrbitControls before AR
- **AR Viewer**: Full immersive AR experience (optional, battery-conscious)

### Key Highlights
- ✨ **Optional AR Entry**: Camera only activates when user explicitly launches AR
- 🔋 **Battery Conscious**: No WebGL on landing pages, proper cleanup on navigation
- 📱 **Mobile First**: Touch-optimized gestures and responsive design
- 🎮 **Interactive 3D**: Orbit controls for model preview before AR
- 🧹 **Proper Cleanup**: Memory leak prevention with Three.js disposal
- 🎨 **Modern UI**: Glassmorphism design with smooth animations

## 📁 Project Structure

```
Museum/
├── index.html                    # Single-page shell
├── js/
│   ├── main.js                  # App entry point
│   ├── router.js                # Hash-based router
│   ├── pages/
│   │   ├── home.js              # Gamified home page
│   │   ├── map.js               # Museum map
│   │   ├── collection.js        # Art collection list
│   │   ├── object-detail.js     # 3D preview + info
│   │   └── ar-viewer.js         # AR experience
│   ├── data/
│   │   ├── collection.js        # Object data (4 objects)
│   │   └── thumbnails.js        # Placeholder thumbnails
│   └── utils/
│       ├── three-viewer.js      # OrbitControls 3D viewer
│       └── ar-controller.js     # AR session manager
├── styles/
│   ├── global.css               # Design system
│   ├── home.css                 # Home page styles
│   ├── collection.css           # Collection styles
│   ├── map.css                  # Map styles
│   ├── detail.css               # Detail page styles
│   └── ar.css                   # AR viewer styles
└── assets/
    ├── buddha.glb               # 3D Buddha model
    └── targets.mind             # MindAR tracking targets
```

## 🚀 Running the App

**IMPORTANT**: Use a local web server (not `file://`)

```bash
# From the repo root:
npx serve

# Then open the URL shown (e.g., http://localhost:3000)
```

**Requirements:**
- HTTPS or localhost (for camera permissions)
- Modern browser with WebGL support
- Physical or digital exhibit markers for AR

## 🎮 User Flow

1. **Home Page** → Two main action buttons
   - "Explore Art Collection" → View all objects
   - "View Museum Map" → Interactive floor plan

2. **Collection Page** → Browse 4 objects
   - Buddha Statue (full AR + 3D)
   - Ancient Vase (placeholder)
   - Marble Bust (placeholder)
   - Golden Relic (placeholder)

3. **Object Detail** → 3D preview with OrbitControls
   - Rotate, zoom, auto-spin
   - Read object information
   - "Launch AR Experience" button (if available)

4. **AR Viewer** → Full AR mode
   - Camera activates ONLY here
   - Touch gestures: rotate, scale, move
   - Control panel with precise adjustments
   - Exit button stops camera and returns

## 🛠️ Technical Architecture

### Client-Side Routing
Hash-based routing (`#/route`) for static deployment:
- `#/` - Home
- `#/map` - Museum Map
- `#/collection` - Art Collection
- `#/object/:id` - Object Detail
- `#/object/:id/ar` - AR Viewer

### Memory Management
- **Three.js Cleanup**: Dispose geometries, materials, textures on page change
- **Camera Stream Cleanup**: Stop all MediaStream tracks when exiting AR
- **Event Listeners**: Proper removal on route changes
- **Page Visibility API**: Pause rendering when tab hidden

### Touch Gestures (AR Mode)
- **One finger drag**: Rotate model on world axes
- **Two finger pinch**: Scale up/down
- **Two finger drag**: Move position (pan)

### 3D Viewer Features
- OrbitControls with damping
- Auto-rotation toggle
- Reset camera button
- Proper lighting (ambient + directional + hemisphere)
- Material optimization

## 🎨 Design System

### Colors
- Primary: `#2a5298` (Museum blue)
- Accent: `#f59e42` (Warm gold)
- Background: `#0a0e1a` (Deep navy)
- Surface: `rgba(255,255,255,0.05)` (Glassmorphism)

### Typography
- System fonts for performance
- Mobile-first sizing
- Clear hierarchy

### Animations
- CSS-only on landing pages (no WebGL)
- Subtle gradient shifts
- Smooth page transitions
- Micro-interactions on buttons

## 📱 Mobile Optimization

- Minimum 48x48px touch targets
- Prevent zoom on double-tap
- Smooth scrolling with momentum
- Prevent pull-to-refresh on AR page
- Hardware acceleration for animations
- Responsive breakpoints: 640px, 768px, 1024px

## 🔒 Battery & Privacy

- **No Auto-Start**: Camera never activates automatically
- **Clear Disclaimers**: Users informed about battery usage
- **Easy Exit**: Always-visible exit button in AR mode
- **Complete Cleanup**: Camera fully released on exit
- **Lightweight Home**: No WebGL on landing pages

## 🧪 Testing Checklist

- [x] Navigate between all pages
- [x] Back button works correctly
- [x] Camera only starts on AR page
- [x] Camera stops when exiting AR
- [x] 3D viewer cleanup on page exit
- [x] Touch gestures work on mobile
- [x] Responsive design on all breakpoints

## 📝 Object Collection

### Buddha Statue (Full AR + 3D)
- 12th Century Khmer sculpture
- Full 3D model with OrbitControls preview
- AR tracking available
- Touch gesture controls

### Placeholder Objects
Three additional objects with descriptions:
- **Ancient Vase** (Ming Dynasty)
- **Marble Bust** (Roman Empire)
- **Golden Relic** (Byzantine Empire)

## 🔮 Future Enhancements

- PWA support (offline mode)
- Multi-language support
- Social sharing (screenshot AR)
- Admin CMS for adding objects
- Advanced AR (occlusion, lighting estimation)
- Audio descriptions for accessibility
- Analytics integration

## 🎓 Learning Resources

- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebXR Best Practices](https://www.w3.org/TR/webxr/)

## 📄 License

This project demonstrates professional WebAR implementation patterns.

---

**Built with**: MindAR 1.2.5 | Three.js 0.160.0 | Vanilla JavaScript ES6+
