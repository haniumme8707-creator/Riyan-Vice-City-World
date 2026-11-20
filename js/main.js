
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

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
let animationFrame;

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

    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.log("Landscape/fullscreen unavailable:", error);
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

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );

  renderer.setSize(window.innerWidth, window.innerHeight);

  gameWorld.innerHTML = "";
  gameWorld.appendChild(renderer.domElement);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  createLighting();
  createGround();
  createPlayer();

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

  const sun = new THREE.DirectionalLight(
    0xffffff,
    2
  );

  sun.position.set(-10, 20, 10);
  scene.add(sun);
}

/* =================================
   WORLD GROUND
================================= */

function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(
    200,
    200
  );

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c8060,
    roughness: 1
  });

  const ground = new THREE.Mesh(
    groundGeometry,
    groundMaterial
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
  road.position.x = 0;

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
   TEMPORARY PLAYER MODEL
================================= */

function createPlayer() {
  player = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({
    color: 0x9b6247,
    roughness: 0.9
  });

  const shirt = new THREE.MeshStandardMaterial({
    color: 0x242a38
  });

  const pants = new THREE.MeshStandardMaterial({
    color: 0x171c28
  });

  const hair = new THREE.MeshStandardMaterial({
    color: 0x111116
  });

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.05, 0.45),
    shirt
  );

  body.position.y = 1.35;
  player.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 20),
    skin
  );

  head.position.y = 2.15;
  player.add(head);

  // Hair
  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, 20, 12),
    hair
  );

  hairMesh.scale.set(1, 0.55, 1);
  hairMesh.position.set(0, 2.34, 0);
  player.add(hairMesh);

  // Legs
  for (let side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.9, 0.35),
      pants
    );

    leg.position.set(side * 0.23, 0.45, 0);
    player.add(leg);
  }

  // Arms
  for (let side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.9, 0.25),
      skin
    );

    arm.position.set(side * 0.58, 1.35, 0);
    player.add(arm);
  }

  player.position.set(0, 0, 0);

  scene.add(player);
}

/* =================================
   CAMERA
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
  animationFrame = requestAnimationFrame(animate);

  const delta = clock.getDelta();

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

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
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
