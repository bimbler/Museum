import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const statusBar = document.getElementById("statusBar");
const debugInfo = document.getElementById("debugInfo");

const infoPanel = document.getElementById("infoPanel");
const closePanel = document.getElementById("closePanel");
const toggleSpinBtn = document.getElementById("toggleSpin");
const resetPoseBtn = document.getElementById("resetPose");

// Position control buttons
const moveUpBtn = document.getElementById("moveUp");
const moveDownBtn = document.getElementById("moveDown");
const moveLeftBtn = document.getElementById("moveLeft");
const moveRightBtn = document.getElementById("moveRight");
const moveForwardBtn = document.getElementById("moveForward");
const moveBackBtn = document.getElementById("moveBack");

// Rotation control buttons
const rotateLeftBtn = document.getElementById("rotateLeft");
const rotateRightBtn = document.getElementById("rotateRight");
const tiltUpBtn = document.getElementById("tiltUp");
const tiltDownBtn = document.getElementById("tiltDown");

// Scale control buttons
const scaleUpBtn = document.getElementById("scaleUp");
const scaleDownBtn = document.getElementById("scaleDown");

let spinning = true;
let model = null;
let anchor = null;
let debugLogs = [];

// Debug logger that shows in UI (hidden by default in v1.0)
function logDebug(message, type = 'info') {
  console.log(message);
  // Debug panel is hidden in production v1.0
}

// Position controls
moveUpBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.y += 0.05;
  setStatus(`Position Y: ${model.position.y.toFixed(2)}`);
});

moveDownBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.y -= 0.05;
  setStatus(`Position Y: ${model.position.y.toFixed(2)}`);
});

moveLeftBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.x -= 0.05;
  setStatus(`Position X: ${model.position.x.toFixed(2)}`);
});

moveRightBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.x += 0.05;
  setStatus(`Position X: ${model.position.x.toFixed(2)}`);
});

moveForwardBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z -= 0.05;
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

moveBackBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z += 0.05;
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

// Rotation controls
rotateLeftBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.y += 0.1;
  setStatus(`Rotation Y: ${(model.rotation.y * 57.3).toFixed(0)}°`);
});

rotateRightBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.y -= 0.1;
  setStatus(`Rotation Y: ${(model.rotation.y * 57.3).toFixed(0)}°`);
});

tiltUpBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.x += 0.1;
  setStatus(`Tilt X: ${(model.rotation.x * 57.3).toFixed(0)}°`);
});

tiltDownBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.x -= 0.1;
  setStatus(`Tilt X: ${(model.rotation.x * 57.3).toFixed(0)}°`);
});

// Scale controls
scaleUpBtn.addEventListener("click", () => {
  if (!model) return;
  model.scale.x += 0.1;
  model.scale.y += 0.1;
  model.scale.z += 0.1;
  setStatus(`Scale: ${model.scale.x.toFixed(2)}`);
});

scaleDownBtn.addEventListener("click", () => {
  if (!model) return;
  model.scale.x = Math.max(0.1, model.scale.x - 0.1);
  model.scale.y = Math.max(0.1, model.scale.y - 0.1);
  model.scale.z = Math.max(0.1, model.scale.z - 0.1);
  setStatus(`Scale: ${model.scale.x.toFixed(2)}`);
});

// UI helpers
function setStatus(msg) { statusBar.textContent = msg; }
function showPanel() { infoPanel.classList.add("visible"); }
function hidePanel() { infoPanel.classList.remove("visible"); }

// Close panel button
closePanel.addEventListener("click", hidePanel);

toggleSpinBtn.addEventListener("click", () => {
  spinning = !spinning;
  toggleSpinBtn.textContent = spinning ? "Disable Spin" : "Enable Spin";
});

resetPoseBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.set(0, 0, 0);
  model.position.set(0, 0, -0.5);
  model.scale.setScalar(0.5);
  setStatus("Reset to default position");
});

// Boot AR only after user gesture
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  setStatus("Starting camera…");
  logDebug("AR initialization started", "info");

  try {
    await startAR();
    startOverlay.style.display = "none";
    logDebug("AR started successfully", "success");
  } catch (err) {
    console.error(err);
    logDebug(`Error: ${err.message}`, "error");
    setStatus("Could not start AR. Check camera permissions / HTTPS.");
    startBtn.disabled = false;
  }
});

async function startAR() {
  logDebug("Creating MindARThree instance...", "info");
  
  const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "./assets/targets.mind",
    uiScanning: "no",
    uiLoading: "no",
  });

  const { renderer, scene, camera } = mindarThree;

  // Ensure renderer fills the entire screen
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  logDebug("Renderer configured", "success");

  // Lights (simple + effective)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  scene.add(hemiLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(1, 2, 1);
  scene.add(dirLight);
  
  // Add ambient light for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  logDebug("Lights added to scene", "success");

  // Anchor 0 = first target in your .mind file
  anchor = mindarThree.addAnchor(0);
  logDebug("Anchor created", "success");

  // Load Buddha model
  setStatus("Loading model…");
  logDebug("Loading buddha.glb...", "info");
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync("./assets/buddha.glb");
    model = gltf.scene;
    
    logDebug(`GLB loaded! Children: ${model.children.length}`, "success");
    
    // Position model in visible range (away from camera near plane)
    model.scale.setScalar(0.5);
    model.position.set(0, 0, -0.5);
    
    // Optimize materials
    model.traverse((node) => {
      if (node.isMesh) {
        node.material.needsUpdate = true;
        if (node.material.isMeshStandardMaterial || node.material.isMeshPhysicalMaterial) {
          node.material.metalness = 0.3;
          node.material.roughness = 0.7;
        }
      }
    });

    anchor.group.add(model);
    logDebug("Buddha model added to anchor", "success");
    
  } catch (error) {
    logDebug(`Failed to load GLB: ${error.message}`, "error");
    setStatus("Failed to load model");
  }

  // Tracking callbacks
  anchor.onTargetFound = () => {
    setStatus("Target found");
    showPanel();
    logDebug("Target found - Buddha visible", "success");
  };

  anchor.onTargetLost = () => {
    setStatus("Scanning…");
    hidePanel();
  };

  // Start
  setStatus("Starting AR…");
  logDebug("Starting MindAR...", "info");
  await mindarThree.start();
  setStatus("Scanning…");
  logDebug("MindAR started - point at target", "success");

  // Render loop
  renderer.setAnimationLoop(() => {
    if (model && spinning) {
      model.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
  });

  // Handle resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}
