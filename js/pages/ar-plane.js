/**
 * AR Plane Page - WebXR Plane Detection AR
 * Allows users to place 3D models on detected surfaces
 * Android Chrome with ARCore only
 */

import { getObjectById } from '../data/collection.js';
import WebXRController from '../utils/webxr-controller.js';

export default class ARPlanePage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.object = null;
    this.webxrController = null;
    this.renderLoop = null;
    this.diagnosticLogs = [];
    this.scaleMultiplier = 1.5;
    this.heightOffsetM = 0.3;
    this.hasPlacedObject = false;
    this.arPhase = 'scanning'; // 'scanning' | 'reticle-visible' | 'placed'
    this.placedTimestamp = null;
  }
  
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.diagnosticLogs.push(logEntry);
    console.log(message);
    
    // Update diagnostic panel
    const panel = document.getElementById('diagnostic-panel');
    if (panel) {
      const logsDiv = panel.querySelector('.diagnostic-logs');
      if (logsDiv) {
        logsDiv.innerHTML = this.diagnosticLogs.map(log => 
          `<div class="log-line">${log}</div>`
        ).join('');
        logsDiv.scrollTop = logsDiv.scrollHeight;
      }
    }
  }

  render() {
    const objectId = this.params.id;
    this.object = getObjectById(objectId);

    if (!this.object) {
      return `
        <div class="error-page">
          <h1>Object Not Found</h1>
          <button onclick="window.location.hash = '/collection'">Back to Collection</button>
        </div>
      `;
    }

    if (!this.object.hasModel) {
      return `
        <div class="error-page">
          <h1>3D Model Not Available</h1>
          <p>This object does not have a 3D model for AR placement.</p>
          <button onclick="window.location.hash = '/object/${objectId}'">Back to Object</button>
        </div>
      `;
    }

    return `
      <div class="ar-plane-page">
        <div id="webxr-container" class="webxr-container"></div>
        
        <!-- Start AR Overlay - Must be clicked to start session -->
        <div class="webxr-start-overlay" id="webxr-start-overlay">
          <div class="start-content">
            <h2>Ready to Place in AR?</h2>
            <p>This will activate your camera to place ${this.object.title} on real surfaces</p>
            <button class="webxr-start-btn" data-action="start-session">
              Start AR Session
            </button>
            <button class="webxr-start-btn secondary" data-action="show-diagnostics" style="margin-top: 20px;">
              Show Diagnostics
            </button>
          </div>
        </div>
        
        <!-- Diagnostic Panel -->
        <div class="diagnostic-panel" id="diagnostic-panel" style="display: none;">
          <div class="diagnostic-header">
            <h3>WebXR Diagnostics</h3>
            <button class="diagnostic-close" data-action="close-diagnostics">&times;</button>
          </div>
          <div class="diagnostic-info" id="diagnostic-info">
            <div class="info-item"><strong>User Agent:</strong> <span id="diag-ua">Loading...</span></div>
            <div class="info-item"><strong>WebXR Available:</strong> <span id="diag-xr">Loading...</span></div>
            <div class="info-item"><strong>AR Supported:</strong> <span id="diag-ar">Loading...</span></div>
            <div class="info-item"><strong>Chrome Version:</strong> <span id="diag-chrome">Loading...</span></div>
          </div>
          <div class="diagnostic-logs" id="diagnostic-logs"></div>
          <div class="diagnostic-actions">
            <button class="webxr-start-btn" data-action="copy-logs">Copy Logs</button>
            <button class="webxr-start-btn secondary" data-action="run-test">Run AR Test</button>
          </div>
        </div>
        
        <div class="webxr-overlay">
          <span class="ar-wordmark">Crow Museum of Asian Art</span>

          <button class="exit-webxr-btn" data-action="exit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Exit AR
          </button>

          <div class="ar-coach-bubble" id="ar-coach-bubble" style="display: none;">
            <span class="coach-text" id="coach-text">Move your phone slowly to scan surfaces</span>
          </div>
        </div>
      </div>
    `;
  }

  async mount() {
    // Setup UI handlers
    this.setupUIHandlers();

    // Don't auto-start - wait for user to click start button
    // WebXR requires user gesture to request session
    
    // Initialize diagnostics
    this.initDiagnostics();
  }

  async initDiagnostics() {
    this.log('Page loaded - initializing diagnostics');
    this.log(`User Agent: ${navigator.userAgent}`);
    this.log(`WebXR available: ${!!navigator.xr}`);
    
    if (navigator.xr) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        this.log(`Immersive AR supported: ${supported}`);
      } catch (error) {
        this.log(`Error checking AR support: ${error.message}`);
      }
    }
    
    // Extract Chrome version
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (match) {
      this.log(`Chrome version: ${match[1]}`);
    }
  }

  setupUIHandlers() {
    // Show diagnostics button
    const diagBtn = document.querySelector('[data-action="show-diagnostics"]');
    if (diagBtn) {
      diagBtn.addEventListener('click', () => this.showDiagnostics());
    }

    // Close diagnostics button
    const closeDiagBtn = document.querySelector('[data-action="close-diagnostics"]');
    if (closeDiagBtn) {
      closeDiagBtn.addEventListener('click', () => this.hideDiagnostics());
    }

    // Copy logs button
    const copyBtn = document.querySelector('[data-action="copy-logs"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyLogs());
    }

    // Run test button
    const testBtn = document.querySelector('[data-action="run-test"]');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.runARTest());
    }

    // Start AR button - MUST be clicked to start session (user gesture required)
    const startBtn = document.querySelector('[data-action="start-session"]');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        
        this.log('User clicked Start AR Session button');
        
        this.startWebXR()
          .then(() => {
            const overlay = document.getElementById('webxr-start-overlay');
            if (overlay && this.webxrController?.isSessionActive()) {
              overlay.style.display = 'none';
            }
          })
          .catch((error) => {
            this.log(`Failed to start: ${error.message}`, 'error');
            startBtn.disabled = false;
            startBtn.textContent = 'Try Again';
          });
      });
    }

    // Exit button
    const exitBtn = document.querySelector('[data-action="exit"]');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitWebXR());
    }
  }

  showDiagnostics() {
    const panel = document.getElementById('diagnostic-panel');
    const overlay = document.getElementById('webxr-start-overlay');
    
    if (panel) {
      panel.style.display = 'flex';
    }
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    // Update diagnostic info
    this.updateDiagnosticInfo();
  }

  hideDiagnostics() {
    const panel = document.getElementById('diagnostic-panel');
    const overlay = document.getElementById('webxr-start-overlay');
    
    if (panel) {
      panel.style.display = 'none';
    }
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }

  async updateDiagnosticInfo() {
    document.getElementById('diag-ua').textContent = navigator.userAgent;
    document.getElementById('diag-xr').textContent = navigator.xr ? 'Yes ✓' : 'No ✗';
    
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    document.getElementById('diag-chrome').textContent = match ? match[1] : 'Unknown';
    
    if (navigator.xr) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        document.getElementById('diag-ar').textContent = supported ? 'Yes ✓' : 'No ✗';
        
        if (!supported) {
          this.log('⚠️ AR not supported - possible reasons:');
          this.log('  - Chrome version too old (need 79+)');
          this.log('  - ARCore not installed');
          this.log('  - Device not ARCore compatible');
          this.log('  - WebXR flag disabled in chrome://flags');
        }
      } catch (error) {
        document.getElementById('diag-ar').textContent = `Error: ${error.message}`;
        this.log(`Error checking AR: ${error.message}`);
      }
    } else {
      document.getElementById('diag-ar').textContent = 'N/A (no WebXR)';
    }
  }

  copyLogs() {
    const logsText = this.diagnosticLogs.join('\n');
    
    // Try modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(logsText).then(() => {
        this.log('✓ Logs copied to clipboard!');
        alert('Logs copied to clipboard!');
      }).catch(err => {
        this.fallbackCopy(logsText);
      });
    } else {
      this.fallbackCopy(logsText);
    }
  }

  fallbackCopy(text) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.log('✓ Logs copied (fallback method)');
      alert('Logs copied to clipboard!');
    } catch (err) {
      this.log('✗ Failed to copy logs');
      alert('Could not copy logs. Please screenshot instead.');
    }
    
    document.body.removeChild(textarea);
  }

  async runARTest() {
    this.log('=== Running AR Compatibility Test ===');
    this.log(`Browser: ${navigator.userAgent}`);
    this.log(`Platform: ${navigator.platform}`);
    this.log(`Language: ${navigator.language}`);
    
    // Test 1: WebXR API
    this.log('Test 1: Checking WebXR API...');
    if (!navigator.xr) {
      this.log('✗ FAIL: navigator.xr is undefined');
      this.log('  → WebXR not available in this browser');
      return;
    }
    this.log('✓ PASS: navigator.xr exists');
    
    // Test 2: Session support
    this.log('Test 2: Checking immersive-ar support...');
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        this.log('✗ FAIL: immersive-ar not supported');
        this.log('  → Check ARCore installation');
        this.log('  → Check chrome://flags/#webxr');
        return;
      }
      this.log('✓ PASS: immersive-ar is supported');
    } catch (error) {
      this.log(`✗ FAIL: Error checking support - ${error.message}`);
      return;
    }
    
    // Test 3: Try requesting session
    this.log('Test 3: Attempting to request AR session...');
    this.log('(This will trigger camera permission)');
    
    try {
      await this.startWebXR();
      this.log('✓ SUCCESS: AR session started!');
    } catch (error) {
      this.log(`✗ FAIL: ${error.message}`);
    }
  }

  async startWebXR() {
    const container = document.getElementById('webxr-container');
    const coachBubble = document.getElementById('ar-coach-bubble');

    if (!container) {
      this.log('✗ WebXR container not found');
      this.showError('Setup Error', 'AR container not found. Please try refreshing the page.');
      return;
    }

    try {
      this.log('Creating WebXR controller...');
      this.webxrController = new WebXRController(this.log.bind(this));

      this.log('Starting WebXR session...');
      await this.webxrController.startSession(
        container,
        this.object.modelPath,
        {
          arTargetHeightM: typeof this.object.arTargetHeightM === 'number' ? this.object.arTargetHeightM : undefined,
          scaleMultiplier: this.scaleMultiplier,
          heightOffsetM: this.heightOffsetM,
          onStart: () => {
            this.log('✓ AR session started successfully!');
            this.arPhase = 'scanning';
            if (coachBubble) coachBubble.style.display = 'flex';
            this.setCoachText('Move your phone slowly to scan surfaces');
            this.setupTapToPlace(container);
            this.startRenderLoop();
          },
          onEnd: () => {
            this.log('AR session ended');
            this.stopRenderLoop();
          }
        }
      );

    } catch (error) {
      this.log(`✗ Failed to start WebXR: ${error.message}`);
      this.log(`Error name: ${error.name}`);
      
      // Determine user-friendly error message
      let errorMessage = 'Failed to start AR';
      let errorDetails = error.message;
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
        errorDetails = 'Please allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'AR not supported';
        errorDetails = 'Your device or browser doesn\'t support WebXR AR. Try using Chrome on Android.';
      } else if (error.message.includes('not supported')) {
        errorMessage = 'AR not supported';
        errorDetails = 'Your device or browser doesn\'t support WebXR AR. This feature requires Android Chrome with ARCore.';
      } else if (error.message.includes('secure context')) {
        errorMessage = 'Secure connection required';
        errorDetails = 'WebXR requires HTTPS. Please ensure you\'re accessing the site securely.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Camera permission denied';
        errorDetails = 'Please allow camera access and try again.';
      }

      // Show error prominently
      this.showError(errorMessage, errorDetails);
      
      // Re-throw to let button handler know it failed
      throw error;
    }
  }

  startRenderLoop() {
    const renderer = this.webxrController.getRenderer();
    const scene = this.webxrController.getScene();
    const camera = this.webxrController.getCamera();

    if (!renderer || !scene || !camera) return;

    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && this.webxrController) {
        // Update reticle position based on hit-test
        this.webxrController.updateReticle(frame);
        // Update anchored objects (reduces drifting/slipping)
        this.webxrController.updateAnchors(frame);

        // Update UI based on reticle visibility
        this.updatePlacementUI();
      }

      // WebXR best practice: clear depth each frame so virtual content
      // doesn't accumulate depth and occlude the camera feed.
      renderer.clearDepth();
      renderer.render(scene, camera);
    });
  }

  stopRenderLoop() {
    const renderer = this.webxrController?.getRenderer();
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
  }

  updatePlacementUI() {
    if (!this.webxrController) return;

    const isReticleVisible = this.webxrController.isReticleVisible();

    if (this.hasPlacedObject) {
      if (this.arPhase !== 'placed') {
        this.arPhase = 'placed';
        this.placedTimestamp = Date.now();
        this.setCoachText('Object placed!');
        setTimeout(() => {
          if (this.arPhase === 'placed') {
            this.setCoachText('Drag to move \u00b7 Two fingers to rotate \u00b7 Pinch to resize');
          }
        }, 3000);
      }
      return;
    }

    if (isReticleVisible && this.arPhase !== 'reticle-visible') {
      this.arPhase = 'reticle-visible';
      this.setCoachText('Tap anywhere to place');
    } else if (!isReticleVisible && this.arPhase !== 'scanning') {
      this.arPhase = 'scanning';
      this.setCoachText('Move your phone slowly to scan surfaces');
    }
  }

  setCoachText(text) {
    const el = document.getElementById('coach-text');
    if (el) el.textContent = text;
  }

  setupTapToPlace(container) {
    const canvas = container.querySelector('canvas');
    const target = canvas || container;

    this._onTapToPlace = (e) => {
      if (this.hasPlacedObject) return;
      if (!this.webxrController?.isReticleVisible()) return;

      // Ignore multi-touch
      if (e.type === 'touchend' && e.changedTouches.length > 1) return;

      e.preventDefault();
      this.placeModel();
    };

    target.addEventListener('touchend', this._onTapToPlace, { passive: false });
    target.addEventListener('click', this._onTapToPlace);
  }

  placeModel() {
    if (!this.webxrController) return;
    if (this.hasPlacedObject) return;

    this.webxrController.placeModel()
      .then((model) => {
        if (!model) return;
        this.hasPlacedObject = true;
        this.updatePlacementUI();

        // Enable touch gestures on the placed model
        const container = document.getElementById('webxr-container');
        const canvas = container?.querySelector('canvas');
        if (canvas && this.webxrController) {
          this.webxrController.setupTouchGestures(canvas);
        }

        // Flash feedback
        if (container) {
          container.style.transition = 'opacity 0.1s';
          container.style.opacity = '0.7';
          setTimeout(() => { container.style.opacity = '1'; }, 100);
        }
      })
      .catch((e) => {
        this.log(`Placement failed: ${e.message}`, 'error');
      });
  }

  showError(title, details) {
    const startOverlay = document.getElementById('webxr-start-overlay');
    if (startOverlay) {
      startOverlay.innerHTML = `
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h2>${title}</h2>
          <p>${details}</p>
          <button class="webxr-start-btn" onclick="window.history.back()">
            Go Back
          </button>
          <button class="webxr-start-btn secondary" onclick="location.reload()">
            Try Again
          </button>
        </div>
      `;
      startOverlay.style.display = 'flex';
    }

    const coachBubble = document.getElementById('ar-coach-bubble');
    if (coachBubble) coachBubble.style.display = 'none';
  }

  async exitWebXR() {
    this.stopRenderLoop();

    if (this.webxrController) {
      await this.webxrController.stopSession();
      this.webxrController = null;
    }

    this.router.navigate(`/object/${this.object.id}`);
  }

  async cleanup() {
    console.log('Cleaning up WebXR AR page...');
    
    this.stopRenderLoop();

    if (this.webxrController) {
      this.webxrController.removeTouchGestures();
      await this.webxrController.stopSession();
      this.webxrController = null;
    }

    // Remove tap-to-place listener
    if (this._onTapToPlace) {
      const container = document.getElementById('webxr-container');
      const canvas = container?.querySelector('canvas');
      const target = canvas || container;
      if (target) {
        target.removeEventListener('touchend', this._onTapToPlace);
        target.removeEventListener('click', this._onTapToPlace);
      }
    }

    return Promise.resolve();
  }
}
