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
const loadBuddhaBtn = document.getElementById("loadBuddha");

// Debug control buttons
const scaleUpBtn = document.getElementById("scaleUp");
const scaleDownBtn = document.getElementById("scaleDown");
const moveUpBtn = document.getElementById("moveUp");
const moveDownBtn = document.getElementById("moveDown");
const moveForwardBtn = document.getElementById("moveForward");
const moveBackBtn = document.getElementById("moveBack");

let spinning = true;
let model = null;
let testCube = null;
let anchor = null;
let debugLogs = [];

// Debug logger that shows in UI
function logDebug(message, type = 'info') {
  console.log(message);
  debugLogs.push({ message, type, time: new Date().toLocaleTimeString() });
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  debugInfo.appendChild(entry);
  debugInfo.scrollTop = debugInfo.scrollHeight;
  debugInfo.classList.add('visible');
  
  // Keep only last 20 logs
  if (debugInfo.children.length > 20) {
    debugInfo.removeChild(debugInfo.firstChild);
  }
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
    const gltf = await loader.loadAsync("./assets/buddha.glb");
    model = gltf.scene;
    
    logDebug(`GLB loaded! Children: ${model.children.length}`, "success");
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    logDebug(`Model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`, "info");
    
    // Start at same scale as cube
    model.scale.setScalar(1.0);
    model.position.set(0, 0, 0);
    
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
  const obj = model || testCube;
  if (!obj) return;
  obj.rotation.set(0, 0, 0);
  obj.position.set(0, 0, 0);
  obj.scale.setScalar(1.0);
  logDebug("Reset to scale: 1.0, pos: (0,0,0)", "info");
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
    uiScanning: "no",  // Disable MindAR's default UI for cleaner look
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
  // Position cube AWAY from camera (negative Z in AR camera space)
  testCube.position.set(0, 0, -0.5);
  anchor.group.add(testCube);
  
  // Add coordinate axes helper to see orientation
  const axesHelper = new THREE.AxesHelper(0.3);
  axesHelper.position.set(0, 0, -0.5);
  anchor.group.add(axesHelper);
  
  logDebug("RED CUBE added at Z=-0.5 (in front of camera)", "success");
  logDebug("Axes helper added at same position", "info");
  
  // Add a green sphere for comparison
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1.0 })
  );
  sphere.position.set(0, 0.3, -0.5);
  anchor.group.add(sphere);
  logDebug("Green sphere added above cube", "info");

  // Tracking callbacks
  anchor.onTargetFound = () => {
    setStatus("🎯 Target found - see LARGE RED CUBE on target?");
    showPanel();
    logDebug(`Target found! Anchor visible: ${anchor.group.visible}`, "success");
    logDebug(`Anchor has ${anchor.group.children.length} children`, "info");
    logDebug(`Cube scale: ${testCube.scale.x}, visible: ${testCube.visible}`, "info");
    logDebug(`Cube position: (${testCube.position.x}, ${testCube.position.y}, ${testCube.position.z})`, "info");
    logDebug(`Scene children: ${scene.children.length}`, "info");
    
    // Log camera info
    logDebug(`Camera pos: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`, "info");
    logDebug(`Camera near: ${camera.near}, far: ${camera.far}`, "info");
    
    // Check if objects are in view frustum
    camera.updateMatrixWorld();
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    
    testCube.updateMatrixWorld();
    const inView = frustum.containsPoint(testCube.getWorldPosition(new THREE.Vector3()));
    logDebug(`Cube in camera frustum: ${inView}`, inView ? "success" : "error");
  };

  anchor.onTargetLost = () => {
    setStatus("Scanning…");
    hidePanel();
    logDebug("Target lost", "info");
  };

  // Start
  setStatus("Starting AR…");
  logDebug("Starting MindAR...", "info");
  await mindarThree.start();
  setStatus("📷 Scanning for target…");
  logDebug("MindAR started - point at target to see RED CUBE", "success");

  // Render loop
  renderer.setAnimationLoop(() => {
    // Spin whichever object is active
    if (spinning) {
      if (model) {
        model.rotation.y += 0.01;
      } else if (testCube) {
        testCube.rotation.y += 0.02;
        testCube.rotation.x += 0.01;
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
