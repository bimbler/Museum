import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const statusBar = document.getElementById("statusBar");
const debugInfo = document.getElementById("debugInfo");
const settingsBtn = document.getElementById("settingsBtn");

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

let spinning = false; // No auto-rotation by default
let model = null;
let anchor = null;
let anchor1 = null; // Second anchor for target1
let debugLogs = [];
let bobOffset = 0; // For bobbing animation

// Debug logger that shows in UI (hidden by default in v1.0)
function logDebug(message, type = 'info') {
  console.log(message);
  // Debug panel is hidden in production v1.0
}

// Create 3D text label using canvas texture
function createTextLabel(text) {
  // Create canvas for text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 256;
  
  // Draw background
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.fillStyle = '#ffffff';
  context.font = 'bold 36px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Handle multiline text
  const lines = text.split('\n');
  const lineHeight = 45;
  const startY = (canvas.height / 2) - ((lines.length - 1) * lineHeight / 2);
  
  lines.forEach((line, index) => {
    context.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create material and mesh
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const geometry = new THREE.PlaneGeometry(0.5, 0.25);
  const mesh = new THREE.Mesh(geometry, material);
  
  return mesh;
}

// Position controls
moveUpBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z -= 0.05; // Base Z position
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.z -= 0.05;
  }
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

moveDownBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z += 0.05;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.z += 0.05;
  }
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

moveLeftBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.x -= 0.05;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.x -= 0.05;
  }
  setStatus(`Position X: ${model.position.x.toFixed(2)}`);
});

moveRightBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.x += 0.05;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.x += 0.05;
  }
  setStatus(`Position X: ${model.position.x.toFixed(2)}`);
});

moveForwardBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z -= 0.05;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.z -= 0.05;
  }
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

moveBackBtn.addEventListener("click", () => {
  if (!model) return;
  model.position.z += 0.05;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].position.z += 0.05;
  }
  setStatus(`Position Z: ${model.position.z.toFixed(2)}`);
});

// Rotation controls
rotateLeftBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.y += 0.1;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].rotation.y += 0.1;
  }
  setStatus(`Rotation Y: ${(model.rotation.y * 57.3).toFixed(0)}°`);
});

rotateRightBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.y -= 0.1;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].rotation.y -= 0.1;
  }
  setStatus(`Rotation Y: ${(model.rotation.y * 57.3).toFixed(0)}°`);
});

tiltUpBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.x += 0.1;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].rotation.x += 0.1;
  }
  setStatus(`Tilt X: ${(model.rotation.x * 57.3).toFixed(0)}°`);
});

tiltDownBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.x -= 0.1;
  if (anchor1 && anchor1.group.children.length > 0) {
    anchor1.group.children[0].rotation.x -= 0.1;
  }
  setStatus(`Tilt X: ${(model.rotation.x * 57.3).toFixed(0)}°`);
});

// Scale controls - use setScalar to ensure uniform scaling
scaleUpBtn.addEventListener("click", () => {
  if (!model) return;
  const currentScale = model.scale.x;
  const newScale = currentScale + 0.1;
  model.scale.setScalar(newScale);
  if (anchor1 && anchor1.group.children.length > 0) {
    const model1 = anchor1.group.children[0];
    model1.scale.setScalar(newScale);
  }
  setStatus(`Scale: ${newScale.toFixed(2)}`);
});

scaleDownBtn.addEventListener("click", () => {
  if (!model) return;
  const currentScale = model.scale.x;
  const newScale = Math.max(0.1, currentScale - 0.1);
  model.scale.setScalar(newScale);
  if (anchor1 && anchor1.group.children.length > 0) {
    const model1 = anchor1.group.children[0];
    model1.scale.setScalar(newScale);
  }
  setStatus(`Scale: ${newScale.toFixed(2)}`);
});

// UI helpers
function setStatus(msg) { statusBar.textContent = msg; }
function showPanel() { infoPanel.classList.add("visible"); }
function hidePanel() { infoPanel.classList.remove("visible"); }

// Settings button - toggle panel
settingsBtn.addEventListener("click", () => {
  if (infoPanel.classList.contains("visible")) {
    hidePanel();
  } else {
    showPanel();
  }
});

// Close panel button
closePanel.addEventListener("click", hidePanel);

toggleSpinBtn.addEventListener("click", () => {
  spinning = !spinning;
  toggleSpinBtn.textContent = spinning ? "Stop Spin" : "Start Spin";
});

resetPoseBtn.addEventListener("click", () => {
  if (!model) return;
  model.rotation.set(Math.PI / 2, -160 * (Math.PI / 180), 0); // Reset with -160 degree Y rotation
  model.position.set(0, 0, -0.5);
  model.scale.setScalar(1.0);
  
  // Reset cloned model on anchor1 too
  if (anchor1 && anchor1.group.children.length > 0) {
    const model1 = anchor1.group.children[0];
    model1.rotation.set(Math.PI / 2, -160 * (Math.PI / 180), 0);
    model1.position.set(0, 0, -0.5);
    model1.scale.setScalar(1.0);
  }
  
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
    container: document.querySelector("#container"),
    imageTargetSrc: "./assets/targets.mind",
    uiScanning: "no",
    uiLoading: "no",
    filterMinCF: 0.00001, // Much smoother tracking (lower = more smoothing)
    filterBeta: 5000,     // Much more stable (higher = less jitter)
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
  logDebug("Anchor 0 created", "success");
  
  // Anchor 1 = second target (both compiled into targets.mind)
  anchor1 = mindarThree.addAnchor(1);
  logDebug("Anchor 1 created - both targets ready", "success");

  // Load Buddha model
  setStatus("Loading model…");
  logDebug("Loading buddha.glb...", "info");
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync("./assets/buddha.glb");
    model = gltf.scene;
    
    logDebug(`GLB loaded! Children: ${model.children.length}`, "success");
    
    // Position model in visible range (away from camera near plane)
    // Set perpendicular to image (90 degrees on X-axis) with -160 degree Y rotation
    // Scale set to 1.0
    model.scale.setScalar(1.0);
    model.position.set(0, 0, -0.5);
    model.rotation.x = Math.PI / 2; // 90 degrees - perpendicular to image
    model.rotation.y = -160 * (Math.PI / 180); // -160 degrees on Y-axis
    
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

    // Add model to both anchors
    anchor.group.add(model);
    
    // Add text label in front of Buddha
    const textLabel = createTextLabel("Ancient Buddha\nStatue of Peace");
    textLabel.position.set(0, 0.8, -0.3); // Position above and in front
    anchor.group.add(textLabel);
    
    // Clone model for second anchor
    const model1 = model.clone();
    anchor1.group.add(model1);
    
    // Clone text label for second anchor
    const textLabel1 = createTextLabel("Ancient Buddha\nStatue of Peace");
    textLabel1.position.set(0, 0.8, -0.3);
    anchor1.group.add(textLabel1);
    
    logDebug("Buddha model and text labels added to both anchors", "success");
    
  } catch (error) {
    logDebug(`Failed to load GLB: ${error.message}`, "error");
    setStatus("Failed to load model");
  }

  // Tracking callbacks for anchor 0
  anchor.onTargetFound = () => {
    setStatus("Target found");
    logDebug("Target 0 found - Buddha visible", "success");
  };

  anchor.onTargetLost = () => {
    setStatus("Scanning…");
    logDebug("Target 0 lost", "success");
  };
  
  // Tracking callbacks for anchor 1
  anchor1.onTargetFound = () => {
    setStatus("Target 1 found");
    logDebug("Target 1 found - Buddha visible", "success");
  };

  anchor1.onTargetLost = () => {
    setStatus("Scanning…");
    logDebug("Target 1 lost", "success");
  };

  // Start
  setStatus("Starting AR…");
  logDebug("Starting MindAR...", "info");
  await mindarThree.start();
  setStatus("Scanning…");
  logDebug("MindAR started - point at target", "success");

  // Render loop
  renderer.setAnimationLoop(() => {
    // Smooth bobbing animation using sine wave (ease in/out at peaks)
    bobOffset += 0.02; // Speed of bobbing
    const bobAmount = Math.sin(bobOffset) * 0.03; // Amplitude of 0.03 units
    
    if (model && spinning) {
      model.rotation.y += 0.01;
    }
    
    // Apply bobbing to model (smooth ease at peaks due to sine wave)
    if (model) {
      model.position.y = bobAmount;
    }
    
    // Apply bobbing to cloned model on anchor1 if it exists
    if (anchor1 && anchor1.group.children.length > 0) {
      const model1 = anchor1.group.children[0];
      model1.position.y = bobAmount;
      if (spinning) {
        model1.rotation.y += 0.01;
      }
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
