import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const statusBar = document.getElementById("statusBar");

const infoPanel = document.getElementById("infoPanel");
const closePanel = document.getElementById("closePanel");
const toggleSpinBtn = document.getElementById("toggleSpin");
const resetPoseBtn = document.getElementById("resetPose");

let spinning = true;
let model = null;

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
  model.position.set(0, -0.2, 0);
  model.scale.setScalar(0.8);
});

// Boot AR only after user gesture
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  setStatus("Starting camera…");

  try {
    await startAR();
    startOverlay.style.display = "none";
  } catch (err) {
    console.error(err);
    setStatus("Could not start AR. Check camera permissions / HTTPS.");
    startBtn.disabled = false;
  }
});

async function startAR() {
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

  // Lights (simple + effective)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  scene.add(hemiLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(1, 2, 1);
  scene.add(dirLight);
  
  // Add ambient light for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Anchor 0 = first target in your .mind file
  const anchor = mindarThree.addAnchor(0);

  // Load GLB
  setStatus("Loading model…");
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("./assets/buddha.glb");
  model = gltf.scene;

  // Scale up for better visibility
  model.scale.setScalar(0.8);
  model.position.set(0, -0.2, 0);
  
  // Ensure model materials are visible
  model.traverse((node) => {
    if (node.isMesh) {
      node.material.needsUpdate = true;
      // Make sure materials respond to light
      if (node.material.isMeshStandardMaterial || node.material.isMeshPhysicalMaterial) {
        node.material.metalness = 0.3;
        node.material.roughness = 0.7;
      }
    }
  });

  anchor.group.add(model);

  // Tracking callbacks
  anchor.onTargetFound = () => {
    setStatus("Target found");
    showPanel();
    console.log("Target found - model should be visible");
  };

  anchor.onTargetLost = () => {
    setStatus("Scanning…");
    hidePanel();
  };

  // Start
  setStatus("Starting AR…");
  await mindarThree.start();
  setStatus("Scanning…");

  // Render loop
  renderer.setAnimationLoop(() => {
    if (model && spinning) model.rotation.y += 0.01;
    renderer.render(scene, camera);
  });

  // Handle resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}
