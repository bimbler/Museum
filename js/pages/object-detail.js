/**
 * Object Detail Page
 * Shows 3D preview with OrbitControls and object information
 */

import { getObjectById } from '../data/collection.js';
import ThreeViewer from '../utils/three-viewer.js';

export default class ObjectDetailPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.object = null;
    this.viewer = null;
  }

  render() {
    const objectId = this.params.id;
    this.object = getObjectById(objectId);

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
          <button class="back-btn" data-action="back">
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
            </div>
          ` : `
            <div class="viewer-section no-model">
              <img src="${this.object.thumbnail}" alt="${this.object.title}" class="detail-image" />
            </div>
          `}

          <div class="detail-info">
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
                  <h3>✨ AR Experience Available</h3>
                  <p>View this object in augmented reality by pointing your camera at the exhibit marker.</p>
                  <p class="ar-disclaimer">Note: AR uses your camera and may drain battery.</p>
                </div>
                <button class="ar-launch-btn" data-action="launch-ar">
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
                  Launch AR Experience
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async mount() {
    // Back button
    const backBtn = document.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigate('/collection');
      });
    }

    // Initialize 3D viewer if model exists
    if (this.object && this.object.hasModel) {
      await this.init3DViewer();
    }

    // AR launch button
    const arBtn = document.querySelector('[data-action="launch-ar"]');
    if (arBtn) {
      arBtn.addEventListener('click', () => {
        this.router.navigate(`/object/${this.object.id}/ar`);
      });
    }
  }

  async init3DViewer() {
    const container = document.getElementById('three-viewer');
    const status = document.getElementById('viewer-status');
    const controls = document.getElementById('viewer-controls');

    if (!container) return;

    try {
      // Create viewer
      this.viewer = new ThreeViewer(container);

      // Load model
      await this.viewer.loadModel(this.object.modelPath);

      // Hide status, show controls
      if (status) status.style.display = 'none';
      if (controls) controls.style.display = 'flex';

      // Setup control buttons
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
          <span style="color: #ff6b6b;">Failed to load 3D model</span>
        `;
      }
    }
  }

  cleanup() {
    // Dispose 3D viewer
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }
    return Promise.resolve();
  }
}
