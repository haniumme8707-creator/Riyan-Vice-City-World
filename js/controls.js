
export class MobileControls {
  constructor(player, getCameraYaw = () => 0) {
    this.player = player;
    this.getCameraYaw = getCameraYaw;

    this.moveX = 0;
    this.moveZ = 0;
    this.running = false;
    this.keys = {};
    this.speed = 5;
    this.runSpeed = 9;

    this.joystick = document.getElementById("joystick");
    this.knob = document.getElementById("joystick-knob");
    this.runButton = document.getElementById("run-button");
    this.actionButton = document.getElementById("action-button");

    this.joystickPointer = null;
    this.joystickRect = null;

    this.onKeyDown = (event) => {
      this.keys[event.key.toLowerCase()] = true;
    };

    this.onKeyUp = (event) => {
      this.keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.setupJoystick();
    this.setupRunButton();
    this.setupActionButton();
  }

  setupJoystick() {
    if (!this.joystick || !this.knob) return;

    this.joystick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.joystickPointer = event.pointerId;
      this.joystick.setPointerCapture(event.pointerId);
      this.joystickRect = this.joystick.getBoundingClientRect();
      this.updateJoystick(event);
    });

    this.joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.joystickPointer) return;
      this.updateJoystick(event);
    });

    const stopJoystick = (event) => {
      if (event.pointerId !== this.joystickPointer) return;

      this.joystickPointer = null;
      this.moveX = 0;
      this.moveZ = 0;

      this.knob.style.transform = "translate(0px, 0px)";
    };

    this.joystick.addEventListener("pointerup", stopJoystick);
    this.joystick.addEventListener("pointercancel", stopJoystick);
    this.joystick.addEventListener("lostpointercapture", stopJoystick);
  }

  updateJoystick(event) {
    const rect = this.joystickRect || this.joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    this.moveX = dx / maxDistance;
    this.moveZ = dy / maxDistance;

    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  setupRunButton() {
    if (!this.runButton) return;

    this.runButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.running = true;
      this.runButton.setPointerCapture(event.pointerId);
    });

    const stopRun = () => {
      this.running = false;
    };

    this.runButton.addEventListener("pointerup", stopRun);
    this.runButton.addEventListener("pointercancel", stopRun);
    this.runButton.addEventListener("lostpointercapture", stopRun);
  }

  setupActionButton() {
    if (!this.actionButton) return;

    this.actionButton.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("riyan-action"));
    });
  }

  update(delta) {
    let x = this.moveX;
    let z = this.moveZ;

    if (this.keys["w"] || this.keys["arrowup"]) z -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) z += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) x -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) x += 1;

    const length = Math.hypot(x, z);

    if (length < 0.08) return false;

    x /= length;
    z /= length;

    const yaw = this.getCameraYaw();

    // Camera-relative movement
    const worldX = x * Math.cos(yaw) + z * Math.sin(yaw);
    const worldZ = -x * Math.sin(yaw) + z * Math.cos(yaw);

    const speed = this.running ? this.runSpeed : this.speed;

    this.player.position.x += worldX * speed * delta;
    this.player.position.z += worldZ * speed * delta;

    // Keep Riyan inside the island
    const limit = 91;
    this.player.position.x = Math.max(-limit, Math.min(limit, this.player.position.x));
    this.player.position.z = Math.max(-limit, Math.min(limit, this.player.position.z));

    // Face the direction of movement
    this.player.rotation.y = Math.atan2(worldX, worldZ) + Math.PI;

    return true;
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
