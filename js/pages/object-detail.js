/**
 * Object Detail Page
 * Shows 3D preview with OrbitControls, annotation hotspots, and object information
 */

import { getObjectById } from '../data/collection.js';
import ThreeViewer from '../utils/three-viewer.js';
import { getAROptions } from '../utils/device-detection.js';

export default class ObjectDetailPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.object = null;
    this.viewer = null;
    this.arOptions = null;
  }

  async render() {
    const objectId = this.params.id;
    this.object = getObjectById(objectId);

    this.arOptions = await getAROptions();

    if (!this.object) {
      return `
        <div class="error-page">
          <h1>Object Not Found</h1>
          <p>The requested object could not be found.</p>
          <button onclick="window.location.hash = '/collection'">Back to Collection</button>
        </div>
      `;
    }

    return `
      <div class="detail-page">
        <header class="detail-header">
          <button class="back-btn" data-action="back" aria-label="Back to collection">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>${this.object.title}</h1>
          <div class="header-spacer"></div>
        </header>

        <div class="detail-content">
          ${this.object.hasModel ? `
            <div class="viewer-section">
              <div class="viewer-hint" id="viewer-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>Drag to rotate · Scroll to zoom · Click pins for details</span>
              </div>

              <div class="viewer-container" id="three-viewer"></div>
              <div class="viewer-status" id="viewer-status">
                <div class="loader"></div>
                <span>Loading 3D model...</span>
              </div>
              <div class="viewer-controls" id="viewer-controls" style="display: none;">
                <button class="viewer-btn" data-action="reset-camera" title="Reset View">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                  </svg>
                </button>
                <button class="viewer-btn" data-action="toggle-rotate" title="Auto Rotate">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </button>
              </div>

              <!-- Annotation Panel (slides in from right) -->
              <div class="annotation-panel" id="annotation-panel">
                <button class="annotation-close" id="annotation-close" aria-label="Close annotation">&times;</button>
                <h3 id="annotation-title"></h3>
                <p id="annotation-body"></p>
              </div>
            </div>
          ` : `
            <div class="viewer-section no-model">
              <img src="${this.object.thumbnail}" alt="${this.object.title}" class="detail-image" />
            </div>
          `}

          <div class="detail-info">
            <nav class="breadcrumb" aria-label="Breadcrumb">
              <a href="#/" class="breadcrumb-link">Home</a>
              <span class="breadcrumb-separator">›</span>
              <a href="#/collection" class="breadcrumb-link">Collection</a>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-current">${this.object.title}</span>
            </nav>

            <div class="info-header">
              <div class="info-meta">
                <span class="meta-item"><strong>Period:</strong> ${this.object.period}</span>
                <span class="meta-item"><strong>Origin:</strong> ${this.object.origin}</span>
                <span class="meta-item"><strong>Material:</strong> ${this.object.material}</span>
                ${this.object.dimensions ? `<span class="meta-item"><strong>Dimensions:</strong> ${this.object.dimensions}</span>` : ''}
              </div>
            </div>

            <div class="info-description">
              <h2>About this Object</h2>
              <p>${this.object.longDescription || this.object.description}</p>
            </div>

            ${this.object.hasAR ? `
              <div class="ar-section">
                <div class="ar-info">
                  <h3>AR Experiences Available</h3>
                  <p>View this object in augmented reality using one of the modes below.</p>
                  <p class="ar-disclaimer">Note: AR uses your camera and may drain battery.</p>
                </div>

                <div class="ar-instructions">
                  <h4>How to use AR:</h4>
                  <ol>
                    <li>Choose an AR mode below</li>
                    <li>Allow camera access when prompted</li>
                    <li>Point your camera at the marker or surface</li>
                    <li>Use touch gestures to interact with the 3D model</li>
                  </ol>
                </div>

                <div class="ar-buttons-grid">
                  <button class="ar-launch-btn marker-ar" data-action="launch-ar">
                    <div class="ar-btn-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                        <line x1="7" y1="2" x2="7" y2="22"/>
                        <line x1="17" y1="2" x2="17" y2="22"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <line x1="2" y1="7" x2="7" y2="7"/>
                        <line x1="2" y1="17" x2="7" y2="17"/>
                        <line x1="17" y1="17" x2="22" y2="17"/>
                        <line x1="17" y1="7" x2="22" y2="7"/>
                      </svg>
                    </div>
                    <div class="ar-btn-content">
                      <span class="ar-btn-title">Launch Marker AR</span>
                      <span class="ar-btn-subtitle">Point at exhibit marker</span>
                    </div>
                  </button>

                  ${this.arOptions.showPlaneAR && this.object.hasModel ? `
                    <button class="ar-launch-btn plane-ar" data-action="launch-plane-ar">
                      <div class="ar-btn-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="3" fill="currentColor"/>
                          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                        </svg>
                      </div>
                      <div class="ar-btn-content">
                        <span class="ar-btn-title">Place on Surface</span>
                        <span class="ar-btn-subtitle">Tap to place anywhere</span>
                        <span class="ar-btn-badge">Experimental</span>
                      </div>
                    </button>
                  ` : ''}

                  ${this.arOptions.showQuickLookAR && this.object.usdzPath ? `
                    <a rel="ar" href="${this.object.usdzPath}" class="ar-launch-btn quicklook-ar">
                      <img src="${this.object.thumbnail}" class="ar-quicklook-img">
                      <div class="ar-btn-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                          <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                      </div>
                      <div class="ar-btn-content">
                        <span class="ar-btn-title">Place on Surface</span>
                        <span class="ar-btn-subtitle">View in your space (iOS)</span>
                      </div>
                    </a>
                  ` : ''}
                </div>

                ${!this.arOptions.showPlaneAR && !this.arOptions.showQuickLookAR ? `
                  <div class="ar-platform-note">
                    <p><strong>Did you know?</strong> Surface placement AR is available on Android Chrome and iOS Safari.</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async mount() {
    const backBtn = document.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigate('/collection');
      });
    }

    if (this.object && this.object.hasModel) {
      await this.init3DViewer();
    }

    const markerArBtn = document.querySelector('[data-action="launch-ar"]');
    if (markerArBtn) {
      markerArBtn.addEventListener('click', () => {
        this.router.navigate(`/object/${this.object.id}/ar`);
      });
    }

    const planeArBtn = document.querySelector('[data-action="launch-plane-ar"]');
    if (planeArBtn) {
      planeArBtn.addEventListener('click', () => {
        this.router.navigate(`/object/${this.object.id}/ar-plane`);
      });
    }
  }

  async init3DViewer() {
    const container = document.getElementById('three-viewer');
    const status = document.getElementById('viewer-status');
    const controls = document.getElementById('viewer-controls');

    if (!container) return;

    try {
      this.viewer = new ThreeViewer(container);
      await this.viewer.loadModel(this.object.modelPath);

      if (status) status.style.display = 'none';
      if (controls) controls.style.display = 'flex';

      // Add annotation hotspots if available
      if (this.object.annotations && this.object.annotations.length > 0) {
        this.viewer.addAnnotations(this.object.annotations, (annotation) => {
          this.openAnnotationPanel(annotation);
        });
      }

      const resetBtn = document.querySelector('[data-action="reset-camera"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.viewer.resetCamera();
        });
      }

      const rotateBtn = document.querySelector('[data-action="toggle-rotate"]');
      if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
          const isRotating = this.viewer.toggleAutoRotate();
          rotateBtn.classList.toggle('active', isRotating);
        });
      }

    } catch (error) {
      console.error('Failed to load 3D model:', error);
      if (status) {
        status.innerHTML = `
          <span style="color: var(--color-lacquer);">Failed to load 3D model</span>
        `;
      }
    }
  }

  openAnnotationPanel(annotation) {
    const panel = document.getElementById('annotation-panel');
    const title = document.getElementById('annotation-title');
    const body = document.getElementById('annotation-body');
    const closeBtn = document.getElementById('annotation-close');

    if (!panel || !title || !body) return;

    title.textContent = annotation.title;
    body.textContent = annotation.body;
    panel.classList.add('open');

    if (this.viewer) {
      this.viewer.pauseControls();
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        this.closeAnnotationPanel();
      };
    }
  }

  closeAnnotationPanel() {
    const panel = document.getElementById('annotation-panel');
    if (panel) {
      panel.classList.remove('open');
    }
    if (this.viewer) {
      this.viewer.resumeControls();
    }
  }

  cleanup() {
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }
    return Promise.resolve();
  }
}
