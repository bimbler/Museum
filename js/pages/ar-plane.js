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

          <div class="webxr-instructions" id="webxr-instructions" style="display: none;">
            <div class="instruction-content">
              <div class="instruction-icon">📱</div>
              <h3>Scan Your Space</h3>
              <p>Move your phone slowly to detect surfaces</p>
              <div class="instruction-steps">
                <div class="step">1. Point camera at floor or table</div>
                <div class="step">2. Wait for circle to appear</div>
                <div class="step">3. Tap to place ${this.object.title}</div>
              </div>
            </div>
          </div>

          <div class="webxr-status" id="webxr-status" style="display: none;">
            <span class="status-icon">🔍</span>
            <span class="status-text">Initializing AR...</span>
          </div>

          <div class="webxr-controls" id="webxr-controls" style="display: none;" data-open="true">
            <button class="webxr-controls-toggle" id="webxr-controls-toggle" type="button">
              <span id="controls-toggle-label">Hide controls</span>
            </button>
            <div class="webxr-controls-inner">
            <button class="webxr-control-btn" data-action="place" title="Tap to Place">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <span class="btn-label">Tap to Place</span>
            </button>

            <button class="webxr-control-btn" data-action="undo" title="Remove Last" style="display: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              <span class="btn-label">Undo</span>
            </button>

            <div class="webxr-scale" aria-label="Scale control">
              <div class="scale-header">
                <span class="scale-label">Size</span>
                <span class="scale-value" id="scale-value">1.5×</span>
              </div>
              <input
                id="scale-slider"
                class="scale-slider"
                type="range"
                min="1"
                max="15"
                step="0.1"
                value="1.5"
                aria-label="Scale object size"
              />
            </div>

            <div class="webxr-height" aria-label="Height control">
              <div class="scale-header">
                <span class="scale-label">Height</span>
                <span class="scale-value" id="height-value">0.3m</span>
              </div>
              <input
                id="height-slider"
                class="scale-slider"
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value="0.3"
                aria-label="Raise object height"
              />
            </div>

            <div class="placement-counter" id="placement-counter">
              <span class="counter-label">Placed:</span>
              <span class="counter-value">0</span>
            </div>
            </div>
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
        
        // IMPORTANT (User Activation):
        // Do not `await` here before requestSession(). Start the flow synchronously
        // and attach handlers to the returned promise instead.
        this.startWebXR()
          .then(() => {
            // Hide start overlay on success
            const overlay = document.getElementById('webxr-start-overlay');
            if (overlay && this.webxrController?.isSessionActive()) {
              overlay.style.display = 'none';
            }
          })
          .catch((error) => {
            this.log(`Failed to start: ${error.message}`, 'error');
            // Re-enable button on error so user can try again
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

    // Place button (tap anywhere alternative)
    const placeBtn = document.querySelector('[data-action="place"]');
    if (placeBtn) {
      placeBtn.addEventListener('click', () => this.placeModel());
    }

    // Undo button
    const undoBtn = document.querySelector('[data-action="undo"]');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoLastPlacement());
    }

    // Listen for select events (screen taps in XR)
    document.addEventListener('selectstart', () => {
      this.placeModel();
    });

    // Scale slider
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    if (scaleSlider && scaleValue) {
      const updateScaleUI = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return;
        this.scaleMultiplier = num;
        scaleValue.textContent = `${num.toFixed(1)}×`;
        if (this.webxrController) {
          this.webxrController.setScaleMultiplier(num);
        }
      };

      // Initialize
      updateScaleUI(scaleSlider.value);

      scaleSlider.addEventListener('input', (e) => {
        updateScaleUI(e.target.value);
      });
    }

    // Height slider
    const heightSlider = document.getElementById('height-slider');
    const heightValue = document.getElementById('height-value');
    if (heightSlider && heightValue) {
      const updateHeightUI = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return;
        this.heightOffsetM = num;
        heightValue.textContent = `${num.toFixed(2)}m`;
        if (this.webxrController) {
          this.webxrController.setHeightOffset(num);
        }
      };

      updateHeightUI(heightSlider.value);

      heightSlider.addEventListener('input', (e) => {
        updateHeightUI(e.target.value);
      });
    }

    // Controls collapse toggle
    const controls = document.getElementById('webxr-controls');
    const controlsToggle = document.getElementById('webxr-controls-toggle');
    const controlsToggleLabel = document.getElementById('controls-toggle-label');
    if (controls && controlsToggle && controlsToggleLabel) {
      const updateToggleLabel = () => {
        const isOpen = controls.getAttribute('data-open') !== 'false';
        controlsToggleLabel.textContent = isOpen ? 'Hide controls' : 'Show controls';
      };

      updateToggleLabel();

      controlsToggle.addEventListener('click', () => {
        const isOpen = controls.getAttribute('data-open') !== 'false';
        controls.setAttribute('data-open', isOpen ? 'false' : 'true');
        updateToggleLabel();
      });
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
    const status = document.getElementById('webxr-status');
    const instructions = document.getElementById('webxr-instructions');
    const controls = document.getElementById('webxr-controls');

    if (!container) {
      this.log('✗ WebXR container not found');
      this.showError('Setup Error', 'AR container not found. Please try refreshing the page.');
      return;
    }

    try {
      this.log('Creating WebXR controller...');
      this.webxrController = new WebXRController(this.log.bind(this));

      // Show status now that session is starting
      if (status) status.style.display = 'block';
      this.updateStatus('Starting AR session...', '🚀');

      this.log('Starting WebXR session...');
      await this.webxrController.startSession(
        container,
        this.object.modelPath,
        {
          // Use real-world sizing (meters) when available
          arTargetHeightM: typeof this.object.arTargetHeightM === 'number' ? this.object.arTargetHeightM : undefined,
          // Apply current UI scale multiplier
          scaleMultiplier: this.scaleMultiplier,
          heightOffsetM: this.heightOffsetM,
          onStart: () => {
            this.log('✓ AR session started successfully!');
            this.updateStatus('Point camera at a surface', '📱');
            
            // Show instructions
            if (instructions) {
              instructions.style.display = 'block';
              setTimeout(() => {
                instructions.style.opacity = '0';
                setTimeout(() => instructions.style.display = 'none', 300);
              }, 3000);
            }
            
            if (controls) {
              controls.style.display = 'flex';
            }
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
    const placedCount = this.webxrController.getPlacedModelsCount();

    // Update status
    if (isReticleVisible) {
      this.updateStatus('Tap to place object', '✨');
    } else {
      this.updateStatus('Scan for surfaces...', '🔍');
    }

    // Update counter
    const counterValue = document.querySelector('.counter-value');
    if (counterValue) {
      counterValue.textContent = placedCount;
    }

    // Show/hide undo button
    const undoBtn = document.querySelector('[data-action="undo"]');
    if (undoBtn) {
      undoBtn.style.display = placedCount > 0 ? 'flex' : 'none';
    }

    // Enable/disable place button based on reticle
    const placeBtn = document.querySelector('[data-action="place"]');
    if (placeBtn) {
      const canPlace = isReticleVisible && placedCount === 0;
      placeBtn.disabled = !canPlace;
      placeBtn.style.opacity = canPlace ? '1' : '0.5';
    }
  }

  placeModel() {
    if (!this.webxrController) return;

    // Only allow a single placed object at a time.
    if (this.hasPlacedObject) return;

    this.webxrController.placeModel()
      .then((model) => {
        if (!model) return;
        this.hasPlacedObject = true;
        this.updateStatus('Object placed!', '✅');
        this.updatePlacementUI();

        // Flash feedback
        const container = document.getElementById('webxr-container');
        if (container) {
          container.style.transition = 'opacity 0.1s';
          container.style.opacity = '0.7';
          setTimeout(() => {
            container.style.opacity = '1';
          }, 100);
        }
      })
      .catch((e) => {
        this.log(`Placement failed: ${e.message}`, 'error');
      });
  }

  undoLastPlacement() {
    if (!this.webxrController) return;

    this.webxrController.removeLastModel();
    this.hasPlacedObject = false;
    this.updateStatus('Last placement removed', '↩️');
    this.updatePlacementUI();
  }

  updateStatus(text, icon = '📱') {
    const statusEl = document.getElementById('webxr-status');
    if (statusEl) {
      const iconEl = statusEl.querySelector('.status-icon');
      const textEl = statusEl.querySelector('.status-text');
      
      if (iconEl) iconEl.textContent = icon;
      if (textEl) textEl.textContent = text;
    }
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
    
    this.updateStatus(title, '⚠️');
    
    // Hide instructions
    const instructions = document.getElementById('webxr-instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
    
    // Show status with error styling
    const status = document.getElementById('webxr-status');
    if (status) {
      status.style.display = 'block';
      status.style.background = 'rgba(255, 59, 48, 0.9)';
    }
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
      await this.webxrController.stopSession();
      this.webxrController = null;
    }

    // Remove event listeners
    document.removeEventListener('selectstart', this.placeModel);

    return Promise.resolve();
  }
}
