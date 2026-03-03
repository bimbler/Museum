/**
 * Three.js Orbit Viewer Utility
 * Reusable 3D model viewer with proper cleanup
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class ThreeViewer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.animationId = null;
    this.isAutoRotating = false;
    this.lights = [];
    
    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e1a);

    // Camera
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1, 3);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.target.set(0, 0, 0);

    // Lighting
    this.setupLights();

    // Handle resize
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);

    // Handle visibility change (pause when hidden)
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Start render loop
    this.animate();
  }

  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    this.lights.push(ambient);

    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemi.position.set(0, 20, 0);
    this.scene.add(hemi);
    this.lights.push(hemi);

    // Directional light (main)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);
    this.lights.push(dirLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);
    this.lights.push(fillLight);
  }

  async loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      loader.load(
        modelPath,
        (gltf) => {
          this.model = gltf.scene;

          // Center the model
          const box = new THREE.Box3().setFromObject(this.model);
          const center = new THREE.Vector3();
          box.getCenter(center);
          this.model.position.sub(center);

          // Scale to fit
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;
          this.model.scale.setScalar(scale);

          // Enable shadows
          this.model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Optimize materials
              if (node.material) {
                node.material.needsUpdate = true;
                if (node.material.isMeshStandardMaterial) {
                  node.material.metalness = 0.3;
                  node.material.roughness = 0.7;
                }
              }
            }
          });

          this.scene.add(this.model);
          
          // Reset camera to view model
          this.resetCamera();
          
          resolve(this.model);
        },
        (progress) => {
          // Loading progress (optional callback)
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading: ${percent.toFixed(0)}%`);
        },
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Auto-rotate if enabled
    if (this.isAutoRotating && this.model) {
      this.model.rotation.y += 0.005;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Pause rendering when tab is hidden
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    } else {
      // Resume rendering when tab is visible
      if (!this.animationId) {
        this.animate();
      }
    }
  }

  resetCamera() {
    if (this.model) {
      const box = new THREE.Box3().setFromObject(this.model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      
      this.camera.position.set(0, maxDim * 0.5, maxDim * 2);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else {
      this.camera.position.set(0, 1, 3);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  setAutoRotate(enabled) {
    this.isAutoRotating = enabled;
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    return this.isAutoRotating;
  }

  getAutoRotate() {
    return this.isAutoRotating;
  }

  dispose() {
    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose model
    if (this.model) {
      this.model.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) {
            node.geometry.dispose();
          }
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(material => this.disposeMaterial(material));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
      this.scene.remove(this.model);
    }

    // Dispose lights
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    this.lights = [];

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    // Clear scene
    if (this.scene) {
      this.scene.clear();
    }

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
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
}
