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
  model.position.set(0, -0.15, 0);
  model.scale.setScalar(0.45);
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
    uiScanning: true,
    uiLoading: true,
  });

  const { renderer, scene, camera } = mindarThree;

  // Lights (simple + effective)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(1, 2, 1);
  scene.add(dir);

  // Anchor 0 = first target in your .mind file
  const anchor = mindarThree.addAnchor(0);

  // Load GLB
  setStatus("Loading model…");
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("./assets/buddha.glb");
  model = gltf.scene;

  // Basic pose tuning (adjust to taste)
  model.scale.setScalar(0.45);
  model.position.set(0, -0.15, 0);

  // Optional: improve look if model is too dark/bright by tweaking materials
  // (leave as-is initially; tune after you see it on device)

  anchor.group.add(model);

  // Tracking callbacks
  anchor.onTargetFound = () => {
    setStatus("Target found. Exhibit locked.");
    showPanel();
  };

  anchor.onTargetLost = () => {
    setStatus("Target lost. Point at the card again.");
    hidePanel();
  };

  // Start
  setStatus("Starting AR session…");
  await mindarThree.start();
  setStatus("Scanning… point at the exhibit card image.");

  // Render loop
  renderer.setAnimationLoop(() => {
    if (model && spinning) model.rotation.y += 0.01;
    renderer.render(scene, camera);
  });

  // Handle resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
