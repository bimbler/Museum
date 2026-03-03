/**
 * AR Viewer Page
 * Full AR experience with camera tracking
 */

import { getObjectById } from '../data/collection.js';
import ARController from '../utils/ar-controller.js';
import * as THREE from 'three';

export default class ARViewerPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.object = null;
    this.arController = null;
    this.spinning = false;
    
    // Touch control variables
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isTouching = false;
    this.initialPinchDistance = 0;
    this.initialScale = 1.0;
    this.twoFingerStartX = 0;
    this.twoFingerStartY = 0;
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

    if (!this.object.hasAR) {
      return `
        <div class="error-page">
          <h1>AR Not Available</h1>
          <p>This object does not have an AR experience.</p>
          <button onclick="window.location.hash = '/object/${objectId}'">Back to Object</button>
        </div>
      `;
    }

    return `
      <div class="ar-page">
        <div id="ar-container" class="ar-container"></div>
        
        <div class="ar-overlay">
          <button class="exit-ar-btn" data-action="exit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Exit AR
          </button>

          <div class="ar-status" id="ar-status">Initializing AR...</div>

          <button class="ar-settings-btn" data-action="toggle-panel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"></path>
            </svg>
          </button>

          <div class="ar-version">v2.0</div>
        </div>

        <aside id="ar-panel" class="ar-panel">
          <div class="panel-header">
            <h2>${this.object.title}</h2>
            <button class="panel-close" data-action="close-panel">&times;</button>
          </div>
          <div class="panel-body">
            <p class="panel-info">Use touch gestures to interact:</p>
            <ul class="gesture-list">
              <li>🔄 <strong>One finger:</strong> Rotate model</li>
              <li>🤏 <strong>Pinch:</strong> Scale up/down</li>
              <li>👆 <strong>Two fingers:</strong> Move position</li>
            </ul>
            
            <div class="panel-actions">
              <button class="panel-btn" data-action="toggle-spin">
                <span class="spin-icon">↻</span> Toggle Spin
              </button>
              <button class="panel-btn" data-action="reset-pose">
                <span>⟲</span> Reset Pose
              </button>
            </div>

            <div class="panel-controls">
              <h3>Position</h3>
              <div class="control-grid">
                <button class="ctrl-btn" data-action="move-up">↑</button>
                <button class="ctrl-btn" data-action="move-down">↓</button>
                <button class="ctrl-btn" data-action="move-left">←</button>
                <button class="ctrl-btn" data-action="move-right">→</button>
                <button class="ctrl-btn" data-action="move-forward">+</button>
                <button class="ctrl-btn" data-action="move-back">−</button>
              </div>

              <h3>Rotation</h3>
              <div class="control-grid">
                <button class="ctrl-btn" data-action="rotate-left">↶</button>
                <button class="ctrl-btn" data-action="rotate-right">↷</button>
                <button class="ctrl-btn" data-action="tilt-up">⟲</button>
                <button class="ctrl-btn" data-action="tilt-down">⟳</button>
              </div>

              <h3>Scale</h3>
              <div class="control-grid-2">
                <button class="ctrl-btn" data-action="scale-up">+</button>
                <button class="ctrl-btn" data-action="scale-down">−</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  async mount() {
    // Setup UI handlers first
    this.setupUIHandlers();

    // Start AR session
    await this.startAR();
  }

  setupUIHandlers() {
    // Exit button
    const exitBtn = document.querySelector('[data-action="exit"]');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitAR());
    }

    // Settings button
    const settingsBtn = document.querySelector('[data-action="toggle-panel"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.togglePanel());
    }

    // Close panel button
    const closeBtn = document.querySelector('[data-action="close-panel"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePanel());
    }

    // Control buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action && action.startsWith('move-') || action.startsWith('rotate-') || 
          action.startsWith('scale-') || action.startsWith('tilt-')) {
        btn.addEventListener('click', () => this.handleControlAction(action));
      }
    });

    // Toggle spin
    const spinBtn = document.querySelector('[data-action="toggle-spin"]');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        this.spinning = !this.spinning;
        spinBtn.classList.toggle('active', this.spinning);
      });
    }

    // Reset pose
    const resetBtn = document.querySelector('[data-action="reset-pose"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetPose());
    }
  }

  async startAR() {
    const container = document.getElementById('ar-container');
    const status = document.getElementById('ar-status');

    if (!container) {
      console.error('AR container not found');
      return;
    }

    try {
      this.arController = new ARController();

      await this.arController.start(this.object, container, {
        onTargetFound: () => {
          if (status) status.textContent = 'Target found';
        },
        onTargetLost: () => {
          if (status) status.textContent = 'Scanning...';
        },
        onStart: () => {
          if (status) status.textContent = 'Scanning...';
          this.setupTouchControls();
          this.startSpinLoop();
        }
      });

    } catch (error) {
      console.error('Failed to start AR:', error);
      if (status) {
        status.textContent = 'Failed to start AR. Check camera permissions.';
      }
    }
  }

  setupTouchControls() {
    const container = document.getElementById('ar-container');
    if (!container) return;

    const getTouchDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touch1, touch2) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    };

    container.addEventListener('touchstart', (e) => {
      const model = this.arController?.getModel();
      if (!model) return;

      if (e.touches.length === 1) {
        this.isTouching = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        this.isTouching = false;
        this.initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        this.initialScale = model.scale.x;
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        this.twoFingerStartX = center.x;
        this.twoFingerStartY = center.y;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      const model = this.arController?.getModel();
      const anchor1 = this.arController?.getAnchor1();
      if (!model) return;

      if (e.touches.length === 1 && this.isTouching) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        const rotationSpeed = 0.01;

        const worldYAxis = new THREE.Vector3(0, 1, 0);
        model.rotateOnWorldAxis(worldYAxis, deltaX * rotationSpeed);
        const worldXAxis = new THREE.Vector3(1, 0, 0);
        model.rotateOnWorldAxis(worldXAxis, -deltaY * rotationSpeed);

        if (anchor1 && anchor1.group.children.length > 0) {
          const model1 = anchor1.group.children[0];
          model1.rotateOnWorldAxis(worldYAxis, deltaX * rotationSpeed);
          model1.rotateOnWorldAxis(worldXAxis, -deltaY * rotationSpeed);
        }

        this.touchStartX = touchX;
        this.touchStartY = touchY;

      } else if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scaleFactor = currentDistance / this.initialPinchDistance;
        const newScale = Math.max(0.1, Math.min(5.0, this.initialScale * scaleFactor));
        
        model.scale.setScalar(newScale);
        if (anchor1 && anchor1.group.children.length > 0) {
          anchor1.group.children[0].scale.setScalar(newScale);
        }

        const center = getTouchCenter(e.touches[0], e.touches[1]);
        const deltaX = (center.x - this.twoFingerStartX) * 0.001;
        const deltaY = (center.y - this.twoFingerStartY) * 0.001;

        const worldXAxis = new THREE.Vector3(1, 0, 0);
        model.translateOnAxis(worldXAxis, deltaX);
        const worldYAxis = new THREE.Vector3(0, 1, 0);
        model.translateOnAxis(worldYAxis, -deltaY);

        if (anchor1 && anchor1.group.children.length > 0) {
          const model1 = anchor1.group.children[0];
          model1.translateOnAxis(worldXAxis, deltaX);
          model1.translateOnAxis(worldYAxis, -deltaY);
        }

        this.twoFingerStartX = center.x;
        this.twoFingerStartY = center.y;
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isTouching = false;
      } else if (e.touches.length === 1) {
        this.isTouching = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
  }

  startSpinLoop() {
    const spin = () => {
      if (this.spinning && this.arController) {
        const model = this.arController.getModel();
        const anchor1 = this.arController.getAnchor1();
        
        if (model) {
          model.rotation.y += 0.01;
        }
        if (anchor1 && anchor1.group.children.length > 0) {
          anchor1.group.children[0].rotation.y += 0.01;
        }
      }
      if (this.arController && this.arController.isSessionActive()) {
        requestAnimationFrame(spin);
      }
    };
    spin();
  }

  handleControlAction(action) {
    const model = this.arController?.getModel();
    const anchor1 = this.arController?.getAnchor1();
    if (!model) return;

    const step = 0.05;
    const rotStep = 0.1;

    const actions = {
      'move-up': () => {
        const axis = new THREE.Vector3(0, 1, 0);
        model.translateOnAxis(axis, step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, step);
      },
      'move-down': () => {
        const axis = new THREE.Vector3(0, 1, 0);
        model.translateOnAxis(axis, -step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, -step);
      },
      'move-left': () => {
        const axis = new THREE.Vector3(1, 0, 0);
        model.translateOnAxis(axis, -step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, -step);
      },
      'move-right': () => {
        const axis = new THREE.Vector3(1, 0, 0);
        model.translateOnAxis(axis, step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, step);
      },
      'move-forward': () => {
        const axis = new THREE.Vector3(0, 0, 1);
        model.translateOnAxis(axis, -step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, -step);
      },
      'move-back': () => {
        const axis = new THREE.Vector3(0, 0, 1);
        model.translateOnAxis(axis, step);
        if (anchor1?.group.children[0]) anchor1.group.children[0].translateOnAxis(axis, step);
      },
      'rotate-left': () => {
        const axis = new THREE.Vector3(0, 1, 0);
        model.rotateOnWorldAxis(axis, rotStep);
        if (anchor1?.group.children[0]) anchor1.group.children[0].rotateOnWorldAxis(axis, rotStep);
      },
      'rotate-right': () => {
        const axis = new THREE.Vector3(0, 1, 0);
        model.rotateOnWorldAxis(axis, -rotStep);
        if (anchor1?.group.children[0]) anchor1.group.children[0].rotateOnWorldAxis(axis, -rotStep);
      },
      'tilt-up': () => {
        const axis = new THREE.Vector3(1, 0, 0);
        model.rotateOnWorldAxis(axis, rotStep);
        if (anchor1?.group.children[0]) anchor1.group.children[0].rotateOnWorldAxis(axis, rotStep);
      },
      'tilt-down': () => {
        const axis = new THREE.Vector3(1, 0, 0);
        model.rotateOnWorldAxis(axis, -rotStep);
        if (anchor1?.group.children[0]) anchor1.group.children[0].rotateOnWorldAxis(axis, -rotStep);
      },
      'scale-up': () => {
        const newScale = model.scale.x + 0.1;
        model.scale.setScalar(newScale);
        if (anchor1?.group.children[0]) anchor1.group.children[0].scale.setScalar(newScale);
      },
      'scale-down': () => {
        const newScale = Math.max(0.1, model.scale.x - 0.1);
        model.scale.setScalar(newScale);
        if (anchor1?.group.children[0]) anchor1.group.children[0].scale.setScalar(newScale);
      }
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  resetPose() {
    const model = this.arController?.getModel();
    const anchor1 = this.arController?.getAnchor1();
    if (!model) return;

    model.rotation.order = 'YXZ';
    model.rotation.set(0, 0, 0);
    model.rotation.y = -160 * (Math.PI / 180);
    model.rotation.x = 0;
    model.position.set(0, 0, -0.5);
    model.scale.setScalar(1.0);

    if (anchor1 && anchor1.group.children.length > 0) {
      const model1 = anchor1.group.children[0];
      model1.rotation.order = 'YXZ';
      model1.rotation.set(0, 0, 0);
      model1.rotation.y = -160 * (Math.PI / 180);
      model1.rotation.x = 0;
      model1.position.set(0, 0, -0.5);
      model1.scale.setScalar(1.0);
    }
  }

  togglePanel() {
    const panel = document.getElementById('ar-panel');
    if (panel) {
      panel.classList.toggle('visible');
    }
  }

  closePanel() {
    const panel = document.getElementById('ar-panel');
    if (panel) {
      panel.classList.remove('visible');
    }
  }

  async exitAR() {
    if (this.arController) {
      await this.arController.stop();
      this.arController = null;
    }
    this.router.navigate(`/object/${this.object.id}`);
  }

  async cleanup() {
    console.log('Cleaning up AR page...');
    
    if (this.arController) {
      await this.arController.stop();
      this.arController = null;
    }

    this.spinning = false;
    
    return Promise.resolve();
  }
}
