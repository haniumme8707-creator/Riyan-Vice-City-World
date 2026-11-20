
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
import { MobileControls } from "./controls.js";

// ========================================
// RIYAN — VICE CITY WORLD
// ========================================

const $ = (id) => document.getElementById(id);

const loadingScreen = $("loading-screen");
const startScreen = $("start-screen");
const startButton = $("start-button");
const gameScreen = $("game-screen");
const gameWorld = $("game-world");
const mapButton = $("map-button");
const mapPanel = $("map-panel");
const closeMap = $("close-map");
const mapContent = $("map-content");
const missionInfo = $("mission-info");

let scene;
let camera;
let renderer;
let player;
let controls;
let playerMixer = null;
let animationActions = {};
let clock;
let gameStarted = false;
let cameraYaw = 0;
let cameraPitch = 0.22;
let cameraDistance = 7;
let cameraDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let mapCanvas;
let mapContext;

const WORLD_LIMIT = 100;
const PLAYER_HEIGHT = 1.8;

const locations = {
  home: { x: -57, z: -48, name: "RIYAN'S HOUSE" },
  store: { x: 27, z: -37, name: "VICE STORE" },
  fountain: { x: 0, z: 0, name: "FOUNTAIN PLAZA" },
  football: { x: 55, z: 48, name: "FOOTBALL GROUND" },
  beach: { x: 0, z: 91, name: "VICE BEACH" },
  cafe: { x: -40, z: 25, name: "SUNSET CAFE" },
  clothes: { x: 43, z: -5, name: "STYLE SHOP" }
};

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8bc8e8);
  scene.fog = new THREE.Fog(0x8bc8e8, 105, 245);

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  gameWorld.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  clock = new THREE.Clock();

  addLighting();
  buildIsland();
  buildRoadNetwork();
  buildCityBuildings();
  buildSpecialPlaces();
  buildBeachDecorations();
  createPlayer();
  setupCameraControls();
  setupInterface();

  window.addEventListener("resize", onResize);

  animate();

  if (loadingScreen) loadingScreen.hidden = true;
}

function addLighting() {
  const hemi = new THREE.HemisphereLight(0xd9f3ff, 0x6c7957, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe3b0, 2.2);
  sun.position.set(-70, 100, 55);
  scene.add(sun);
}

function makeMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02
  });
}

function addBox(x, y, z, width, height, depth, material, parent = scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  mesh.position.set(x, y + height / 2, z);
  parent.add(mesh);
  return mesh;
}

function addPlane(x, y, z, width, depth, material) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    material
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// ========================================
// ISLAND, SAND AND OCEAN
// ========================================

function buildIsland() {
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x168db1,
    roughness: 0.28,
    metalness: 0.12
  });

  addPlane(0, -0.75, 0, 500, 500, waterMaterial);

  // Main island ground
  addPlane(0, -0.02, 0, 190, 190, makeMaterial(0x6f9c59));

  const sand = makeMaterial(0xe7c58b);

  // Sandy beach strips around all four edges
  addPlane(0, 0.015, -95, 210, 13, sand);
  addPlane(0, 0.015, 95, 210, 13, sand);
  addPlane(-95, 0.015, 0, 13, 190, sand);
  addPlane(95, 0.015, 0, 13, 190, sand);

  // Shoreline foam-like pale strips
  const foam = makeMaterial(0xd6e9d7);
  addPlane(0, 0.025, -88.2, 205, 0.8, foam);
  addPlane(0, 0.025, 88.2, 205, 0.8, foam);
  addPlane(-88.2, 0.025, 0, 0.8, 175, foam);
  addPlane(88.2, 0.025, 0, 0.8, 175, foam);
}

// ========================================
// ROADS AND FOOTPATHS
// ========================================

function buildRoadNetwork() {
  const road = makeMaterial(0x343b43);
  const pavement = makeMaterial(0xb7b5a9);
  const line = new THREE.MeshBasicMaterial({ color: 0xf4e6b6 });

  // Main horizontal and vertical roads
  [-65, -32, 0, 32, 65].forEach((z) => {
    addPlane(0, 0.035, z, 180, 8, road);
    addPlane(0, 0.045, z - 5.2, 180, 1.8, pavement);
    addPlane(0, 0.045, z + 5.2, 180, 1.8, pavement);

    for (let x = -85; x < 85; x += 12) {
      addPlane(x, 0.055, z, 4, 0.13, line);
    }
  });

  [-65, -32, 0, 32, 65].forEach((x) => {
    addPlane(x, 0.04, 0, 8, 180, road);
    addPlane(x - 5.2, 0.05, 0, 1.8, 180, pavement);
    addPlane(x + 5.2, 0.05, 0, 1.8, 180, pavement);
  });

  // Beach-side road
  addPlane(0, 0.04, 78, 180, 5, road);
}

// ========================================
// BUILDINGS
// ========================================

function makeBuilding(x, z, width, depth, height, color, name) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const wall = makeMaterial(color);
  const roof = makeMaterial(0x424b54);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x79c6df,
    roughness: 0.25,
    metalness: 0.15
  });

  addBox(0, 0, 0, width, height, depth, wall, group);
  addBox(0, height, 0, width + 0.5, 0.45, depth + 0.5, roof, group);

  // Front windows
  const windowWidth = Math.max(1.2, width * 0.18);
  const frontZ = depth / 2 + 0.025;

  for (let wx = -width / 3; wx <= width / 3; wx += width / 3) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, Math.min(2.1, height * 0.3), 0.08),
      glass
    );
    windowMesh.position.set(wx, Math.min(height * 0.65, height - 1.5), frontZ);
    group.add(windowMesh);
  }

  // Entrance
  addBox(0, 0, depth / 2 + 0.06, 1.5, 2.5, 0.12, makeMaterial(0x4a3025), group);

  // Signboard
  if (name) {
    addBox(0, height * 0.78, depth / 2 + 0.12, width * 0.75, 0.8, 0.15, makeMaterial(0xf3d28b), group);
  }

  return group;
}

function buildCityBuildings() {
  const colors = [
    0xe6c7a5, 0xd4d8d1, 0xd9a6a1, 0xc4d3d9,
    0xe2d6b7, 0xb8c9b8, 0xd4b7d8
  ];

  // Buildings in city blocks, with roads kept open
  const blocks = [
    [-48, -48], [-18, -48], [18, -48], [48, -48],
    [-48, -17], [-18, -17], [48, -17],
    [-48, 17], [18, 17], [48, 17],
    [-48, 48], [-18, 48], [18, 48]
  ];

  blocks.forEach(([x, z], i) => {
    const width = 10 + (i % 3) * 2;
    const depth = 9 + (i % 2) * 3;
    const height = 9 + (i % 4) * 3;
    makeBuilding(
      x,
      z,
      width,
      depth,
      height,
      colors[i % colors.length],
      ""
    );
  });

  // Taller city buildings near the center edges
  makeBuilding(-78, -25, 12, 13, 25, 0xb8cbd0, "");
  makeBuilding(78, 22, 13, 12, 29, 0xd8b9a4, "");
  makeBuilding(77, -48, 11, 12, 20, 0xd2d6dc, "");
  makeBuilding(-78, 45, 12, 11, 22, 0xe3c6a7, "");
}

// ========================================
// SPECIAL PLACES
// ========================================

function addLabel(text, x, y, z, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = "rgba(8, 15, 25, 0.78)";
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.position.set(x, y, z);
  sprite.scale.set(10, 2.5, 1);
  scene.add(sprite);
  return sprite;
}

function buildHome() {
  const p = locations.home;
  makeBuilding(p.x, p.z, 15, 13, 7, 0xe6c49c, "HOME");

  // Garden and driveway
  addPlane(p.x, 0.04, p.z - 10, 22, 8, makeMaterial(0x6e9b59));
  addPlane(p.x, 0.05, p.z + 10, 8, 15, makeMaterial(0x858585));

  // Garden fence
  const fence = makeMaterial(0xe8e1d2);
  addBox(p.x - 10, 0, p.z, 0.35, 1.2, 19, fence);
  addBox(p.x + 10, 0, p.z, 0.35, 1.2, 19, fence);

  addLabel("RIYAN'S HOUSE", p.x, 12, p.z, "#ffe2a5");
}

function buildStore() {
  const p = locations.store;
  makeBuilding(p.x, p.z, 14, 12, 8, 0x83b7b0, "STORE");

  addBox(p.x, 7.1, p.z + 6.2, 9, 1.2, 0.2, makeMaterial(0x163d4b));
  addLabel("VICE STORE", p.x, 12, p.z, "#ffffff");
}

function buildFountain() {
  const p = locations.fountain;

  const stone = makeMaterial(0xd5d2c8);
  const water = new THREE.MeshStandardMaterial({
    color: 0x51c5dc,
    roughness: 0.2,
    metalness: 0.1
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7, 0.7, 32),
    stone
  );
  base.position.set(p.x, 0.35, p.z);
  scene.add(base);

  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.2, 0.18, 32),
    water
  );
  pool.position.set(p.x, 0.78, p.z);
  scene.add(pool);

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, 3.2, 16),
    stone
  );
  pillar.position.set(p.x, 2.2, p.z);
  scene.add(pillar);

  const topBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 1.1, 0.45, 24),
    stone
  );
  topBowl.position.set(p.x, 3.8, p.z);
  scene.add(topBowl);

  const waterJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 2.1, 10),
    water
  );
  waterJet.position.set(p.x, 4.9, p.z);
  scene.add(waterJet);

  addLabel("FOUNTAIN PLAZA", p.x, 9, p.z, "#ffffff");
}

function buildFootballGround() {
  const p = locations.football;

  addPlane(p.x, 0.045, p.z, 35, 24, makeMaterial(0x39834b));

  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Pitch boundary
  addPlane(p.x, 0.07, p.z - 11.5, 31, 0.18, white);
  addPlane(p.x, 0.07, p.z + 11.5, 31, 0.18, white);
  addPlane(p.x - 15.5, 0.07, p.z, 0.18, 23, white);
  addPlane(p.x + 15.5, 0.07, p.z, 0.18, 23, white);
  addPlane(p.x, 0.07, p.z, 0.18, 23, white);

  // Center circle
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(3.5, 3.7, 48),
    white
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(p.x, 0.075, p.z);
  scene.add(circle);

  // Goal frames
  const goalMaterial = makeMaterial(0xffffff);
  [-1, 1].forEach((side) => {
    const gx = p.x + side * 16.5;
    addBox(gx, 0, p.z - 3, 0.25, 2.5, 0.25, goalMaterial);
    addBox(gx, 0, p.z + 3, 0.25, 2.5, 0.25, goalMaterial);
    addBox(gx, 2.4, p.z, 0.25, 0.25, 6, goalMaterial);
  });

  addLabel("FOOTBALL GROUND", p.x, 7, p.z, "#ffffff");
}

function buildShops() {
  const cafe = locations.cafe;
  makeBuilding(cafe.x, cafe.z, 12, 10, 7, 0xe5a56c, "CAFE");
  addLabel("SUNSET CAFE", cafe.x, 11, cafe.z, "#fff2ce");

  const clothes = locations.clothes;
  makeBuilding(clothes.x, clothes.z, 12, 10, 7, 0xb89acb, "SHOP");
  addLabel("STYLE SHOP", clothes.x, 11, clothes.z, "#ffffff");
}

function buildSpecialPlaces() {
  buildHome();
  buildStore();
  buildFountain();
  buildFootballGround();
  buildShops();
}

// ========================================
// BEACH DETAILS, PALM TREES AND STREETLIGHTS
// ========================================

function makePalm(x, z, scale = 1) {
  const trunkMaterial = makeMaterial(0x8b6240);
  const leafMaterial = makeMaterial(0x28734b);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.45 * scale, 5 * scale, 7),
    trunkMaterial
  );
  trunk.position.set(x, 2.5 * scale, z);
  scene.add(trunk);

  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.65 * scale, 4 * scale, 5),
      leafMaterial
    );
    const angle = (Math.PI * 2 * i) / 6;
    leaf.position.set(
      x + Math.cos(angle) * 1.2 * scale,
      5 * scale,
      z + Math.sin(angle) * 1.2 * scale
    );
    leaf.rotation.z = Math.cos(angle) * 0.75;
    leaf.rotation.x = Math.sin(angle) * 0.75;
    scene.add(leaf);
  }
}

function buildBeachDecorations() {
  for (let i = -80; i <= 80; i += 20) {
    makePalm(i, -91, 0.9);
    makePalm(i, 91, 0.9);
    makePalm(-91, i, 0.9);
    makePalm(91, i, 0.9);
  }

  const poleMaterial = makeMaterial(0x343b43);
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffe4a3 });

  for (let z = -70; z <= 70; z += 28) {
    [-72, 72].forEach((x) => {
      addBox(x, 0, z, 0.25, 5, 0.25, poleMaterial);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        lampMaterial
      );
      lamp.position.set(x, 5.2, z);
      scene.add(lamp);
    });
  }
}

// ========================================
// RIYAN CHARACTER
// ========================================

function createPlayer() {
  player = new THREE.Group();
  player.position.set(
    locations.home.x,
    0,
    locations.home.z + 18
  );
  scene.add(player);

  const loader = new GLTFLoader();

  loader.load(
    "./assets/models/riyan.glb",
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const scale = PLAYER_HEIGHT / Math.max(size.y, 0.01);
      model.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      model.position.y -= scaledBox.min.y;

      player.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        playerMixer = new THREE.AnimationMixer(model);

        gltf.animations.forEach((clip) => {
          const action = playerMixer.clipAction(clip);
          const name = clip.name.toLowerCase();

          if (name.includes("idle")) animationActions.idle = action;
          else if (name.includes("run")) animationActions.run = action;
          else if (name.includes("walk")) animationActions.walk = action;
        });

        const firstAction = animationActions.idle ||
          animationActions.walk ||
          playerMixer.clipAction(gltf.animations[0]);

        firstAction.play();
      }
    },
    undefined,
    (error) => {
      console.error("Riyan GLB could not load:", error);
      showMessage("Riyan ka 3D model load nahi hua. Model ka file path check karein.");
    }
  );

  controls = new MobileControls(player, () => cameraYaw);
}

// ========================================
// THIRD-PERSON ORBIT CAMERA
// ========================================

function setupCameraControls() {
  const canvas = renderer.domElement;

  canvas.addEventListener("pointerdown", (event) => {
    cameraDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!cameraDragging) return;

    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    cameraYaw -= dx * 0.006;
    cameraPitch += dy * 0.004;

    cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.15, 0.85);
  });

  const stopDrag = () => {
    cameraDragging = false;
  };

  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("lostpointercapture", stopDrag);
}

function updateCamera(delta) {
  if (!player) return;

  const horizontalDistance = Math.cos(cameraPitch) * cameraDistance;

  const offset = new THREE.Vector3(
    Math.sin(cameraYaw) * horizontalDistance,
    Math.sin(cameraPitch) * cameraDistance + 1.5,
    Math.cos(cameraYaw) * horizontalDistance
  );

  const desiredPosition = player.position.clone().add(offset);
  const smooth = 1 - Math.pow(0.001, delta);

  camera.position.lerp(desiredPosition, smooth);

  const lookTarget = player.position.clone();
  lookTarget.y += 1.35;
  camera.lookAt(lookTarget);
}

// ========================================
// MAP PANEL
// ========================================

function setupMap() {
  if (!mapContent) return;

  mapContent.innerHTML = `
    <div style="padding:8px;color:white;font-family:Arial;">
      <div style="font-weight:bold;text-align:center;margin-bottom:8px;">VICE CITY MAP</div>
      <canvas id="vice-map-canvas" width="600" height="600"
        style="width:100%;max-width:420px;display:block;margin:auto;border-radius:12px;background:#176f8c;"></canvas>
      <div style="font-size:12px;text-align:center;margin-top:8px;line-height:1.8;">
        🔵 Riyan &nbsp; 🏠 Home &nbsp; 🛒 Store &nbsp; ⛲ Fountain<br>
        ⚽ Football Ground &nbsp; 🏖 Beach &nbsp; ☕ Cafe
      </div>
    </div>
  `;

  mapCanvas = document.getElementById("vice-map-canvas");
  mapContext = mapCanvas.getContext("2d");

  drawMap();
}

function drawMap() {
  if (!mapContext || !player) return;

  const ctx = mapContext;
  const size = 600;
  const center = size / 2;
  const scale = 2.7;

  ctx.clearRect(0, 0, size, size);

  // Ocean and island
  ctx.fillStyle = "#167b9b";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#e8c58c";
  ctx.fillRect(25, 25, 550, 550);

  ctx.fillStyle = "#789b5b";
  ctx.fillRect(55, 55, 490, 490);

  function mapPoint(x, z) {
    return {
      x: center + x * scale,
      y: center + z * scale
    };
  }

  // Roads
  ctx.strokeStyle = "#3c4249";
  ctx.lineWidth = 22;

  [-65, -32, 0, 32, 65].forEach((v) => {
    let a = mapPoint(-90, v);
    let b = mapPoint(90, v);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    a = mapPoint(v, -90);
    b = mapPoint(v, 90);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  function marker(x, z, color, label) {
    const p = mapPoint(x, z);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.fillText(label, p.x + 12, p.y - 8);
  }

  marker(locations.home.x, locations.home.z, "#f4c45c", "HOME");
  marker(locations.store.x, locations.store.z, "#f4f4f4", "STORE");
  marker(locations.fountain.x, locations.fountain.z, "#55d9ff", "FOUNTAIN");
  marker(locations.football.x, locations.football.z, "#8df06b", "FOOTBALL");
  marker(locations.cafe.x, locations.cafe.z, "#ffad72", "CAFE");
  marker(locations.clothes.x, locations.clothes.z, "#e5a7ff", "SHOP");

  const playerPoint = mapPoint(player.position.x, player.position.z);
  ctx.fillStyle = "#168bff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(playerPoint.x, playerPoint.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px Arial";
  ctx.fillText("RIYAN", playerPoint.x + 16, playerPoint.y + 5);
}

// ========================================
// INTERFACE AND GAME START
// ========================================

function showMessage(message) {
  if (!missionInfo) return;
  missionInfo.textContent = message;
}

function setupInterface() {
  setupMap();

  if (startButton) {
    startButton.addEventListener("click", async () => {
      if (gameStarted) return;
      gameStarted = true;

      if (startScreen) startScreen.hidden = true;
      if (gameScreen) gameScreen.hidden = false;

      try {
        const root = document.documentElement;
        if (root.requestFullscreen) await root.requestFullscreen();
      } catch (error) {
        console.log("Fullscreen was not allowed by the browser.");
      }

      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch (error) {
        console.log("Landscape lock is not supported here.");
      }

      showMessage("Welcome to Vice City, Riyan!");
      onResize();
    });
  }

  if (mapButton) {
    mapButton.addEventListener("click", () => {
      if (!mapPanel) return;
      mapPanel.hidden = !mapPanel.hidden;
      if (!mapPanel.hidden) drawMap();
    });
  }

  if (closeMap) {
    closeMap.addEventListener("click", () => {
      if (mapPanel) mapPanel.hidden = true;
    });
  }

  window.addEventListener("riyan-action", () => {
    showMessage("You are exploring Vice City...");
  });
}

function onResize() {
  if (!camera || !renderer) return;

  const width = gameWorld.clientWidth || window.innerWidth;
  const height = gameWorld.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// ========================================
// MAIN LOOP
// ========================================

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (controls && player) {
    const moving = controls.update(delta);

    if (playerMixer) {
      playerMixer.update(delta);

      const nextAction = controls.running
        ? animationActions.run || animationActions.walk
        : moving
          ? animationActions.walk || animationActions.run
          : animationActions.idle;

      if (nextAction && !nextAction.isRunning()) {
        Object.values(animationActions).forEach((action) => {
          if (action && action !== nextAction) action.fadeOut(0.15);
        });
        nextAction.reset().fadeIn(0.15).play();
      }
    }
  }

  updateCamera(delta);

  if (mapPanel && !mapPanel.hidden) {
    drawMap();
  }

  renderer.render(scene, camera);
}
