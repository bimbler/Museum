import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

// Resolve asset URLs from this script's location so loading works with any server path or file://
const getAssetUrl = (path) => new URL(path, import.meta.url).href;

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

// Debug controls
scaleUpBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.scale.x += 0.2;
  obj.scale.y += 0.2;
  obj.scale.z += 0.2;
  logDebug(`Scale: ${obj.scale.x.toFixed(2)}`, "info");
});

scaleDownBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.scale.x = Math.max(0.1, obj.scale.x - 0.2);
  obj.scale.y = Math.max(0.1, obj.scale.y - 0.2);
  obj.scale.z = Math.max(0.1, obj.scale.z - 0.2);
  logDebug(`Scale: ${obj.scale.x.toFixed(2)}`, "info");
});

moveUpBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.position.y += 0.1;
  logDebug(`Position Y: ${obj.position.y.toFixed(2)}`, "info");
});

moveDownBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.position.y -= 0.1;
  logDebug(`Position Y: ${obj.position.y.toFixed(2)}`, "info");
});

moveForwardBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.position.z += 0.1;
  logDebug(`Position Z: ${obj.position.z.toFixed(2)}`, "info");
});

moveBackBtn.addEventListener("click", () => {
  const obj = model || testCube;
  if (!obj) return;
  obj.position.z -= 0.1;
  logDebug(`Position Z: ${obj.position.z.toFixed(2)}`, "info");
});

// Load Buddha button
loadBuddhaBtn.addEventListener("click", async () => {
  if (model) {
    logDebug("Buddha already loaded", "info");
    return;
  }
  
  loadBuddhaBtn.disabled = true;
  loadBuddhaBtn.textContent = "Loading...";
  logDebug("Starting Buddha model load...", "info");
  
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(getAssetUrl("./assets/buddha.glb"));
    model = gltf.scene;
    
    logDebug(`GLB loaded! Children: ${model.children.length}`, "success");
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    logDebug(`Model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`, "info");
    
    // Start at same scale as cube, in front of target (Z=0.5)
    model.scale.setScalar(1.0);
    model.position.set(0, 0, 0.5);
    
    // Count meshes and optimize materials
    let meshCount = 0;
    model.traverse((node) => {
      if (node.isMesh) {
        meshCount++;
        node.material.needsUpdate = true;
        if (node.material.isMeshStandardMaterial || node.material.isMeshPhysicalMaterial) {
          node.material.metalness = 0.3;
          node.material.roughness = 0.7;
        }
      }
    });
    
    logDebug(`Found ${meshCount} meshes in model`, "success");
    
    // Remove test cube and add Buddha
    if (testCube && anchor) {
      anchor.group.remove(testCube);
      logDebug("Test cube removed", "info");
    }
    
    if (anchor) {
      anchor.group.add(model);
      logDebug("Buddha model added to anchor - should be visible now!", "success");
    }
    
    loadBuddhaBtn.textContent = "✓ Buddha Loaded";
    
  } catch (error) {
    logDebug(`Failed to load GLB: ${error.message}`, "error");
    loadBuddhaBtn.disabled = false;
    loadBuddhaBtn.textContent = "Retry Load Buddha";
  }
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
  // Aligned with official MindAR Three.js example: use #container (100vw×100vh), addAnchor(0), add to anchor.group, then start() + setAnimationLoop
  const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: getAssetUrl("./assets/targets.mind"),
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

  // Add a test cube - POSITIONED IN FRONT OF CAMERA
  testCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ 
      color: 0xff0000, 
      emissive: 0xff0000, 
      emissiveIntensity: 1.0,
      wireframe: false
    })
  );
  // Position cube in front of target (positive Z = toward user in anchor space)
  testCube.position.set(0, 0, 0.5);
  anchor.group.add(testCube);
  
  // Add coordinate axes helper to see orientation
  const axesHelper = new THREE.AxesHelper(0.3);
  axesHelper.position.set(0, 0, 0.5);
  anchor.group.add(axesHelper);
  
  logDebug("RED CUBE added at Z=0.5 (in front of target)", "success");
  logDebug("Axes helper added at same position", "info");
  
  // Add a green sphere for comparison
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1.0 })
  );
  sphere.position.set(0, 0.3, 0.5);
  anchor.group.add(sphere);
  logDebug("Green sphere added above cube", "info");

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
