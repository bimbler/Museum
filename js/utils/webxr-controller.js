/**
 * WebXR Controller - Manages WebXR AR session with plane detection
 * For Android Chrome with ARCore support only
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class WebXRController {
  constructor(logCallback = null) {
    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.referenceSpace = null;
    this.viewerSpace = null; // Store viewer space for hit-test
    this.arTargetHeightM = null;
    this.scaleMultiplier = 1;
    this.templateBaseScaleScalar = null;
    this.heightOffsetM = 0;
    this.facingOffsetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, -160 * (Math.PI / 180), 0, 'YXZ')
    );
    this.lastHitTestResult = null;
    this.anchors = [];
    this.placedModels = [];
    this.modelTemplate = null;
    this.isActive = false;
    this.log = logCallback || console.log.bind(console);
  }

  async startSession(container, modelPath, callbacks = {}) {
    this.log('[WebXR] Starting session...');
    
    if (this.isActive) {
      this.log('[WebXR] Session already active');
      return;
    }

    // Check WebXR support
    this.log(`[WebXR] Navigator.xr available: ${!!navigator.xr}`);
    if (!navigator.xr) {
      throw new Error('WebXR not supported on this browser');
    }

    // IMPORTANT (User Activation):
    // Do not `await` anything unrelated before calling `requestSession()`.
    // User activation is only valid for the immediate call stack after a tap/click,
    // and can be lost across awaits/microtasks. We rely on requestSession error
    // handling to report lack of support.

    // Store per-session AR sizing hint (in meters). If not provided, defaults apply.
    this.arTargetHeightM =
      callbacks && typeof callbacks.arTargetHeightM === 'number'
        ? callbacks.arTargetHeightM
        : null;
    this.scaleMultiplier =
      callbacks && typeof callbacks.scaleMultiplier === 'number'
        ? this.clampScaleMultiplier(callbacks.scaleMultiplier)
        : 1.5;
    this.heightOffsetM =
      callbacks && typeof callbacks.heightOffsetM === 'number'
        ? callbacks.heightOffsetM
        : 0.0;

    try {
      // The real session request MUST be the first awaited action after user gesture.
      // Do not probe or load models before this call.
      this.log('[WebXR] Requesting XR session...');
      try {
        // Try with 'local' as required feature (needed for hit-test)
        this.session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local'],
          optionalFeatures: ['hit-test', 'anchors', 'dom-overlay', 'local-floor'],
          domOverlay: { root: document.body }
        });
        this.log('[WebXR] Session granted with local reference space');
      } catch (error) {
        this.log(`[WebXR] Local space not available: ${error.name}`);
        
        // Fallback: Try without requiring local (hit-test won't work)
        this.session = await navigator.xr.requestSession('immersive-ar', {
          optionalFeatures: ['hit-test', 'anchors', 'dom-overlay', 'local', 'local-floor', 'viewer'],
          domOverlay: { root: document.body }
        });
        this.log('[WebXR] Session granted without local requirement (hit-test disabled)');
      }

      this.log(`[WebXR] Session created: ${!!this.session}`);

      this.log('[WebXR] Initializing Three.js scene...');
      
      // Initialize Three.js scene (sync work only here)
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      // Critical for WebXR AR: keep the canvas transparent so camera shows through.
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.autoClear = false;
      this.renderer.xr.enabled = true;
      container.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.background = 'transparent';
      
      await this.renderer.xr.setSession(this.session);
      this.log('[WebXR] Renderer XR session set');

      // Setup lighting
      this.setupLights();

      // Create reticle
      this.createReticle();

      // Get reference space with fallbacks
      this.log('[WebXR] Requesting reference space...');
      try {
        // Best practice for AR placement: prefer local-floor for stable alignment to real-world floor.
        this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
        this.log('[WebXR] ✓ Got "local-floor" reference space');
      } catch (error) {
        this.log(`[WebXR] "local-floor" not supported, trying "local"...`);
        try {
          this.referenceSpace = await this.session.requestReferenceSpace('local');
          this.log('[WebXR] ✓ Got "local" reference space');
        } catch (error2) {
          this.log(`[WebXR] "local" not supported, trying "viewer"...`);
          this.referenceSpace = await this.session.requestReferenceSpace('viewer');
          this.log('[WebXR] ✓ Got "viewer" reference space');
        }
      }

      // Request viewer space for hit-test (separate from reference space)
      this.log('[WebXR] Requesting viewer space for hit-test...');
      try {
        this.viewerSpace = await this.session.requestReferenceSpace('viewer');
        this.log('[WebXR] ✓ Got viewer space for hit-test');
      } catch (error) {
        this.log(`[WebXR] ⚠ Viewer space not available: ${error.message}`);
        this.log('[WebXR] Hit-test will be disabled, but AR will still work');
        this.viewerSpace = null;
      }

      // Load model template after session is created (async / network work)
      if (modelPath) {
        this.log('[WebXR] Loading 3D model...');
        await this.loadModelTemplate(modelPath);
        this.log('[WebXR] Model loaded successfully');
      }

      // Setup hit-test source on first frame
      this.session.requestAnimationFrame((time, frame) => {
        this.setupHitTestSource(frame);
      });

      this.isActive = true;
      this.log('[WebXR] ✓ Session started successfully!');

      if (callbacks.onStart) {
        callbacks.onStart();
      }

      // Handle session end
      this.session.addEventListener('end', () => {
        this.log('[WebXR] Session ended');
        this.isActive = false;
        if (callbacks.onEnd) {
          callbacks.onEnd();
        }
      });

    } catch (error) {
      this.log(`[WebXR] ✗ Session request failed: ${error.name} - ${error.message}`);
      
      // Provide actionable guidance instead of raw error
      if (error.name === 'NotSupportedError') {
        const userFriendlyError = new Error(
          'AR initialization failed. Please try:\n' +
          '1. Update "Google Play Services for AR" (ARCore) from Play Store\n' +
          '2. Restart Chrome\n' +
          '3. Ensure camera permissions are granted\n' +
          '4. Check that your device supports ARCore\n\n' +
          `Technical details: ${error.message}`
        );
        userFriendlyError.name = error.name;
        await this.stopSession();
        throw userFriendlyError;
      }
      
      if (error.name === 'NotAllowedError') {
        const userFriendlyError = new Error(
          'Camera access denied. Please:\n' +
          '1. Allow camera permissions when prompted\n' +
          '2. Check browser settings (Site Settings > Camera)\n' +
          '3. Try reloading the page'
        );
        userFriendlyError.name = error.name;
        await this.stopSession();
        throw userFriendlyError;
      }
      
      if (error.name === 'SecurityError') {
        const userFriendlyError = new Error(
          'Security error - AR requires HTTPS:\n' +
          '1. Ensure you\'re accessing via https://\n' +
          '2. Localhost is also supported for testing\n\n' +
          `Technical details: ${error.message}`
        );
        userFriendlyError.name = error.name;
        await this.stopSession();
        throw userFriendlyError;
      }
      
      await this.stopSession();
      throw error;
    }
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    this.scene.add(hemiLight);
  }

  createReticle() {
    const geometry = new THREE.RingGeometry(0.12, 0.15, 32);
    // RingGeometry is in the XY plane by default; rotate to lie flat on XZ (floor/table surfaces).
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      opacity: 0.7,
      transparent: true
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  async loadModelTemplate(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      loader.load(
        modelPath,
        (gltf) => {
          this.modelTemplate = gltf.scene;

          // Center the model
          const box = new THREE.Box3().setFromObject(this.modelTemplate);
          const center = new THREE.Vector3();
          box.getCenter(center);

          this.modelTemplate.children.forEach(child => {
            child.position.sub(center);
          });

          // Set appropriate scale for AR
          const size = new THREE.Vector3();
          box.getSize(size);
          // Default to ~30cm if no real-world target height was provided.
          const targetHeightM = this.arTargetHeightM || 0.3;
          // Best practice: scale by height (Y). Using max dimension can underscale
          // models with wide bases/pedestals.
          const effectiveHeight = size.y > 0 ? size.y : Math.max(size.x, size.y, size.z);
          this.templateBaseScaleScalar = targetHeightM / effectiveHeight;
          this.modelTemplate.scale.setScalar(this.templateBaseScaleScalar * this.scaleMultiplier);

          // Optimize materials
          this.modelTemplate.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material.needsUpdate = true;
              }
            }
          });

          resolve(this.modelTemplate);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  clampScaleMultiplier(value) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(15, Math.max(1, value));
  }

  setScaleMultiplier(multiplier) {
    this.scaleMultiplier = this.clampScaleMultiplier(multiplier);

    // Update template preview scale
    if (this.modelTemplate && typeof this.templateBaseScaleScalar === 'number') {
      this.modelTemplate.scale.setScalar(this.templateBaseScaleScalar * this.scaleMultiplier);
    }

    // Update any already placed models
    this.placedModels.forEach((model) => {
      const base = model?.userData?.baseScaleScalar;
      if (typeof base === 'number' && model?.scale) {
        model.scale.setScalar(base * this.scaleMultiplier);
      }
    });
  }

  setHeightOffset(offsetM) {
    if (!Number.isFinite(offsetM)) return;
    this.heightOffsetM = offsetM;
  }

  async setupHitTestSource(frame) {
    if (this.hitTestSourceRequested) return;
    
    this.hitTestSourceRequested = true;

    // Check if viewer space is available
    if (!this.viewerSpace) {
      this.log('[WebXR] ⚠ Viewer space not available, hit-test disabled');
      return;
    }

    try {
      const session = frame.session;

      // Check if hit-test feature was actually granted (it was optional)
      if (!session.enabledFeatures || !session.enabledFeatures.includes('hit-test')) {
        this.log('[WebXR] ⚠ Hit-test feature not granted by device');
        this.log('[WebXR] Available features: ' + (session.enabledFeatures ? Array.from(session.enabledFeatures).join(', ') : 'none'));
        return;
      }

      this.hitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
      this.log('[WebXR] ✓ Hit-test source created successfully');
    } catch (error) {
      this.log(`[WebXR] ⚠ Failed to create hit-test source: ${error.message}`);
      this.log('[WebXR] AR will work without surface detection');
      this.hitTestSource = null;
    }
  }

  updateReticle(frame) {
    if (!this.hitTestSource || !this.reticle) return;

    const hitTestResults = frame.getHitTestResults(this.hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      this.lastHitTestResult = hit;
      const pose = hit.getPose(this.referenceSpace);

      if (pose) {
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      this.reticle.visible = false;
      this.lastHitTestResult = null;
    }
  }

  async placeModel() {
    if (!this.reticle.visible || !this.modelTemplate) {
      return null;
    }

    // Clone the model
    const model = this.modelTemplate.clone();
    // Remember base scale so slider can adjust after placement
    model.userData.baseScaleScalar = this.templateBaseScaleScalar || 1;
    model.scale.setScalar(model.userData.baseScaleScalar * this.scaleMultiplier);

    // Get reticle position and orientation
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    this.reticle.matrix.decompose(position, quaternion, scale);

    // Prefer anchors when available to reduce "swimming"/slipping as tracking refines.
    const session = this.session;
    const anchorsEnabled = session?.enabledFeatures && session.enabledFeatures.includes('anchors');
    const canCreateAnchor = !!this.lastHitTestResult?.createAnchor;

    if (anchorsEnabled && canCreateAnchor) {
      try {
        const anchor = await this.lastHitTestResult.createAnchor();
        this.anchors.push({ anchor, object: model });
        // Initial pose set now; subsequent updates will come from anchor space each frame.
        model.position.copy(position);
        model.position.y += this.heightOffsetM;
        // Face the user similarly to marker AR: apply fixed Y rotation offset.
        model.quaternion.multiplyQuaternions(quaternion, this.facingOffsetQuat);
        this.scene.add(model);
        this.placedModels.push(model);
        this.log('[WebXR] ✓ Created anchor for placed object');
        return model;
      } catch (e) {
        this.log(`[WebXR] ⚠ Failed to create anchor, placing without anchor: ${e.message}`);
      }
    }

    model.position.copy(position);
    model.position.y += this.heightOffsetM;
    model.quaternion.multiplyQuaternions(quaternion, this.facingOffsetQuat);

    this.scene.add(model);
    this.placedModels.push(model);

    return model;
  }

  updateAnchors(frame) {
    if (!this.referenceSpace || !this.anchors.length) return;

    // Update anchored objects to their anchorSpace pose each frame
    for (const entry of this.anchors) {
      const { anchor, object } = entry;
      if (!anchor?.anchorSpace || !object) continue;
      const pose = frame.getPose(anchor.anchorSpace, this.referenceSpace);
      if (!pose) continue;
      // Update position/quaternion from anchor pose, but preserve scale (set by slider)
      // and apply facing + height offsets.
      const m = new THREE.Matrix4().fromArray(pose.transform.matrix);
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      m.decompose(pos, quat, scl);
      pos.y += this.heightOffsetM;
      object.position.copy(pos);
      const finalQuat = new THREE.Quaternion();
      finalQuat.multiplyQuaternions(quat, this.facingOffsetQuat);
      object.quaternion.copy(finalQuat);
    }
  }

  removeLastModel() {
    if (this.placedModels.length > 0) {
      const model = this.placedModels.pop();
      this.scene.remove(model);
      
      // Dispose geometry and materials
      model.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(mat => this.disposeMaterial(mat));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
    }
  }

  clearAllModels() {
    while (this.placedModels.length > 0) {
      this.removeLastModel();
    }
  }

  getPlacedModelsCount() {
    return this.placedModels.length;
  }

  isReticleVisible() {
    return this.reticle ? this.reticle.visible : false;
  }

  setupTouchGestures(canvas) {
    this._gestureCanvas = canvas;
    this._gesture = { type: null, prevTouches: null, initialPinchDist: null, initialScale: null };

    this._onTouchStart = (e) => {
      if (this.placedModels.length === 0) return;
      const touches = e.touches;

      if (touches.length === 1) {
        this._gesture = { type: 'drag', prevTouches: [{ x: touches[0].clientX, y: touches[0].clientY }], initialPinchDist: null, initialScale: null };
      } else if (touches.length === 2) {
        const dx = touches[1].clientX - touches[0].clientX;
        const dy = touches[1].clientY - touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const model = this.placedModels[this.placedModels.length - 1];
        const currentScale = model ? model.scale.x : 1;

        this._gesture = {
          type: 'two-finger',
          prevTouches: [
            { x: touches[0].clientX, y: touches[0].clientY },
            { x: touches[1].clientX, y: touches[1].clientY }
          ],
          initialPinchDist: dist,
          initialScale: currentScale
        };
      }
    };

    this._onTouchMove = (e) => {
      if (this.placedModels.length === 0 || !this._gesture.type) return;
      e.preventDefault();

      const touches = e.touches;
      const model = this.placedModels[this.placedModels.length - 1];
      if (!model) return;

      if (touches.length === 1 && this._gesture.type === 'drag') {
        // Single-finger drag: reposition via hit-test raycasting
        this._dragModelWithHitTest(touches[0], model);
        this._gesture.prevTouches = [{ x: touches[0].clientX, y: touches[0].clientY }];

      } else if (touches.length === 2 && this._gesture.type === 'two-finger') {
        const prev = this._gesture.prevTouches;
        if (!prev || prev.length < 2) return;

        // Rotation: horizontal midpoint delta
        const prevMidX = (prev[0].x + prev[1].x) / 2;
        const currMidX = (touches[0].clientX + touches[1].clientX) / 2;
        const deltaX = currMidX - prevMidX;
        const rotSensitivity = 0.007;
        model.rotation.y += deltaX * rotSensitivity;

        // Pinch-to-scale
        const dx = touches[1].clientX - touches[0].clientX;
        const dy = touches[1].clientY - touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this._gesture.initialPinchDist > 0 && this._gesture.initialScale > 0) {
          const ratio = dist / this._gesture.initialPinchDist;
          const base = model.userData?.baseScaleScalar || this.templateBaseScaleScalar || 1;
          const newScaleScalar = this._gesture.initialScale * ratio;
          const minScale = base * 0.5;
          const maxScale = base * 15;
          const clamped = Math.max(minScale, Math.min(maxScale, newScaleScalar));
          model.scale.setScalar(clamped);
        }

        this._gesture.prevTouches = [
          { x: touches[0].clientX, y: touches[0].clientY },
          { x: touches[1].clientX, y: touches[1].clientY }
        ];
      }
    };

    this._onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        this._gesture = { type: null, prevTouches: null, initialPinchDist: null, initialScale: null };
      } else if (e.touches.length === 1) {
        // Went from 2 fingers to 1: switch to drag
        this._gesture = { type: 'drag', prevTouches: [{ x: e.touches[0].clientX, y: e.touches[0].clientY }], initialPinchDist: null, initialScale: null };
      }
    };

    canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  _dragModelWithHitTest(touch, model) {
    if (!this.hitTestSource || !this.referenceSpace) return;

    // Use the latest hit-test result from the center of the screen (reticle position).
    // WebXR hit-test is screen-center only (viewer space), so for a drag we reposition
    // the model to the current reticle location when the reticle is visible.
    if (this.reticle && this.reticle.visible) {
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      this.reticle.matrix.decompose(pos, quat, scl);
      pos.y += this.heightOffsetM;
      model.position.copy(pos);
    }
  }

  removeTouchGestures() {
    if (this._gestureCanvas) {
      if (this._onTouchStart) this._gestureCanvas.removeEventListener('touchstart', this._onTouchStart);
      if (this._onTouchMove) this._gestureCanvas.removeEventListener('touchmove', this._onTouchMove);
      if (this._onTouchEnd) this._gestureCanvas.removeEventListener('touchend', this._onTouchEnd);
      this._gestureCanvas = null;
    }
    this._gesture = null;
  }

  async stopSession() {
    console.log('Stopping WebXR session...');

    this.removeTouchGestures();

    // Clear all placed models
    this.clearAllModels();

    // Remove reticle
    if (this.reticle) {
      this.scene.remove(this.reticle);
      this.reticle.geometry.dispose();
      this.reticle.material.dispose();
      this.reticle = null;
    }

    // Dispose model template
    if (this.modelTemplate) {
      this.modelTemplate.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(mat => this.disposeMaterial(mat));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
      this.modelTemplate = null;
    }

    // End XR session
    if (this.session) {
      try {
        await this.session.end();
      } catch (error) {
        console.error('Error ending XR session:', error);
      }
      this.session = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
      this.scene = null;
    }

    this.camera = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.referenceSpace = null;
    this.viewerSpace = null;
    this.placedModels = [];
    this.isActive = false;

    console.log('WebXR session stopped successfully');
  }

  disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.envMap) material.envMap.dispose();
    material.dispose();
  }

  isSessionActive() {
    return this.isActive;
  }

  getRenderer() {
    return this.renderer;
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }
}
