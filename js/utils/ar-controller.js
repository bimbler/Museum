/**
 * AR Controller - Manages AR session lifecycle
 * Handles camera stream, MindAR initialization, and proper cleanup
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mindar-image-three';

export default class ARController {
  constructor() {
    this.mindarThree = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.anchor = null;
    this.anchor1 = null;
    this.model = null;
    this.isActive = false;
    this.animationLoopId = null;
    this.videoElement = null;
  }

  async start(objectData, container, callbacks = {}) {
    if (this.isActive) {
      console.warn('AR session already active');
      return;
    }

    try {
      // Initialize MindAR
      this.mindarThree = new MindARThree({
        container: container,
        imageTargetSrc: './assets/targets.mind',
        uiScanning: 'no',
        uiLoading: 'no',
        filterMinCF: 0.000001,
        filterBeta: 10000,
      });

      const { renderer, scene, camera } = this.mindarThree;
      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;

      // Ensure renderer fills screen
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Setup lights
      this.setupLights();

      // Create anchors
      this.anchor = this.mindarThree.addAnchor(objectData.targetIndex || 0);
      this.anchor1 = this.mindarThree.addAnchor(1); // Second target

      // Setup tracking callbacks
      if (callbacks.onTargetFound) {
        this.anchor.onTargetFound = callbacks.onTargetFound;
      }
      if (callbacks.onTargetLost) {
        this.anchor.onTargetLost = callbacks.onTargetLost;
      }
      if (callbacks.onTargetFound) {
        this.anchor1.onTargetFound = () => callbacks.onTargetFound('Target 1');
      }
      if (callbacks.onTargetLost) {
        this.anchor1.onTargetLost = () => callbacks.onTargetLost('Target 1');
      }

      // Load model
      if (objectData.modelPath) {
        await this.loadModel(objectData.modelPath);
      }

      // Start MindAR
      await this.mindarThree.start();
      this.isActive = true;

      // Start render loop
      this.startRenderLoop();

      // Store video element reference for cleanup
      const video = container.querySelector('video');
      if (video) {
        this.videoElement = video;
      }

      if (callbacks.onStart) {
        callbacks.onStart();
      }

    } catch (error) {
      console.error('Failed to start AR:', error);
      await this.stop();
      throw error;
    }
  }

  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 2, 1);
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
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

          this.model.children.forEach(child => {
            child.position.sub(center);
          });

          // Set rotation and position
          this.model.rotation.order = 'YXZ';
          this.model.rotation.set(0, 0, 0);
          this.model.rotation.y = -160 * (Math.PI / 180);
          this.model.rotation.x = 0;
          this.model.scale.setScalar(1.0);
          this.model.position.set(0, 0, -0.5);

          // Optimize materials
          this.model.traverse((node) => {
            if (node.isMesh) {
              node.material.needsUpdate = true;
              if (node.material.isMeshStandardMaterial || node.material.isMeshPhysicalMaterial) {
                node.material.metalness = 0.3;
                node.material.roughness = 0.7;
              }
            }
          });

          // Add to anchors
          this.anchor.group.add(this.model);
          
          const model1 = this.model.clone();
          this.anchor1.group.add(model1);

          resolve(this.model);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  startRenderLoop() {
    const render = () => {
      this.animationLoopId = requestAnimationFrame(render);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    render();
  }

  getModel() {
    return this.model;
  }

  getAnchor() {
    return this.anchor;
  }

  getAnchor1() {
    return this.anchor1;
  }

  async stop() {
    console.log('Stopping AR session...');

    // Stop animation loop
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }

    // Stop MindAR
    if (this.mindarThree) {
      try {
        await this.mindarThree.stop();
      } catch (error) {
        console.error('Error stopping MindAR:', error);
      }
    }

    // Stop camera stream
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('Stopped camera track:', track.kind);
      });
      this.videoElement.srcObject = null;
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
              node.material.forEach(mat => this.disposeMaterial(mat));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
      if (this.anchor) {
        this.anchor.group.remove(this.model);
      }
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    // Clear scene
    if (this.scene) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }

    // Clear references
    this.mindarThree = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.anchor = null;
    this.anchor1 = null;
    this.model = null;
    this.videoElement = null;
    this.isActive = false;

    console.log('AR session stopped successfully');
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
}
