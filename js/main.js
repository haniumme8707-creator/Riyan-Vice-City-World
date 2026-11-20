
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";

import { MobileControls } from "./controls.js";

/* =================================
   RIYAN — VICE CITY WORLD
   Main Game Engine
================================= */

const loadingScreen = document.getElementById("loading-screen");
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameScreen = document.getElementById("game-screen");
const gameWorld = document.getElementById("game-world");

const mapButton = document.getElementById("map-button");
const mapPanel = document.getElementById("map-panel");
const closeMap = document.getElementById("close-map");

let scene;
let camera;
let renderer;
let clock;
let player;
let controls;
let characterModel;

let gameStarted = false;

/* =================================
   INITIAL SETUP
================================= */

loadingScreen.hidden = true;

/* =================================
   START GAME
================================= */

startButton.addEventListener("click", async () => {
  if (gameStarted) return;

  gameStarted = true;

  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.log("Fullscreen/orientation unavailable:", error);
  }

  startScreen.hidden = true;
  gameScreen.hidden = false;

  initializeGame();
});

/* =================================
   CREATE 3D SCENE
================================= */

function initializeGame() {
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x87b8d8);
  scene.fog = new THREE.Fog(0x87b8d8, 35, 180);

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );

  camera.position.set(0, 5, 9);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  gameWorld.innerHTML = "";
  gameWorld.appendChild(renderer.domElement);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  createLighting();
  createGround();
  createPlayer();

  controls = new MobileControls(player);

  window.addEventListener("resize", resizeGame);

  animate();
}

/* =================================
   LIGHTING
================================= */

function createLighting() {
  const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x58606c,
    2
  );

  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffff, 2);

  sun.position.set(-10, 20, 10);
  scene.add(sun);
}

/* =================================
   WORLD GROUND
================================= */

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      color: 0x5c8060,
      roughness: 1
    })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 200),
    new THREE.MeshStandardMaterial({
      color: 0x30343a,
      roughness: 1
    })
  );

  road.rotation.x = -Math.PI / 2;
  road.position.y = 0;
  scene.add(road);

  const roadLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 200),
    new THREE.MeshBasicMaterial({
      color: 0xf4d65e
    })
  );

  roadLine.rotation.x = -Math.PI / 2;
  roadLine.position.set(0, 0.02, 0);
  scene.add(roadLine);
}

/* =================================
   PLAYER + RIYAN GLB MODEL
================================= */

function createPlayer() {
  player = new THREE.Group();

  player.position.set(0, 0, 0);
  scene.add(player);

  const loader = new GLTFLoader();

  loader.load(
    "./assets/models/riyan.glb",

    (gltf) => {
      characterModel = gltf.scene;

      // Calculate model dimensions
      const box = new THREE.Box3().setFromObject(characterModel);
      const size = box.getSize(new THREE.Vector3());

      // Set character height to approximately 1.8 units
      const desiredHeight = 1.8;

      if (size.y > 0) {
        const scale = desiredHeight / size.y;
        characterModel.scale.setScalar(scale);
      }

      // Recalculate bounds after scaling
      const scaledBox = new THREE.Box3().setFromObject(characterModel);

      // Place model feet on the ground
      characterModel.position.y -= scaledBox.min.y;

      // Improve model lighting
      characterModel.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      player.add(characterModel);

      console.log("Riyan 3D model loaded successfully!");
    },

    (progress) => {
      if (progress.total) {
        console.log(
          "Riyan model loading:",
          Math.round((progress.loaded / progress.total) * 100) + "%"
        );
      }
    },

    (error) => {
      console.error("Could not load riyan.glb:", error);
    }
  );
}

/* =================================
   THIRD PERSON CAMERA
================================= */

function updateCamera() {
  if (!player || !camera) return;

  const offset = new THREE.Vector3(0, 4.5, 8);

  const targetPosition = player.position.clone().add(offset);

  camera.position.lerp(targetPosition, 0.08);

  const lookTarget = player.position.clone();
  lookTarget.y += 1.4;

  camera.lookAt(lookTarget);
}

/* =================================
   GAME LOOP
================================= */

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (controls) {
    controls.update(delta);
  }

  updateCamera();

  renderer.render(scene, camera);
}

/* =================================
   RESIZE
================================= */

function resizeGame() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =================================
   MAP OPEN / CLOSE
================================= */

mapButton.addEventListener("click", () => {
  mapPanel.hidden = false;
});

closeMap.addEventListener("click", () => {
  mapPanel.hidden = true;
});

/* =================================
   ACTION BUTTON EVENT
================================= */

window.addEventListener("riyan-action", () => {
  console.log("Riyan action button pressed");
});
