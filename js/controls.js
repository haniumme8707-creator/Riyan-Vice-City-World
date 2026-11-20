
/* =====================================
   RIYAN — VICE CITY WORLD
   Mobile Movement Controls
===================================== */

export class MobileControls {
  constructor(player) {
    this.player = player;

    this.joystick = document.getElementById("joystick");
    this.knob = document.getElementById("joystick-knob");
    this.runButton = document.getElementById("run-button");
    this.actionButton = document.getElementById("action-button");

    this.x = 0;
    this.y = 0;
    this.running = false;

    this.keys = {};
    this.joystickActive = false;
    this.pointerId = null;
    this.maxDistance = 32;

    this.setupJoystick();
    this.setupRunButton();
    this.setupActionButton();
    this.setupKeyboard();
  }

  setupJoystick() {
    this.joystick.addEventListener("pointerdown", (event) => {
      event.preventDefault();

      this.joystickActive = true;
      this.pointerId = event.pointerId;

      this.joystick.setPointerCapture(event.pointerId);
      this.updateJoystick(event);
    });

    this.joystick.addEventListener("pointermove", (event) => {
      if (!this.joystickActive) return;
      if (event.pointerId !== this.pointerId) return;

      event.preventDefault();
      this.updateJoystick(event);
    });

    const stop = (event) => {
      if (event.pointerId !== this.pointerId) return;

      this.resetJoystick();
    };

    this.joystick.addEventListener("pointerup", stop);
    this.joystick.addEventListener("pointercancel", stop);
    this.joystick.addEventListener("lostpointercapture", () => {
      this.resetJoystick();
    });
  }

  updateJoystick(event) {
    const rect = this.joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const distance = Math.hypot(dx, dy);

    if (distance > this.maxDistance) {
      dx = (dx / distance) * this.maxDistance;
      dy = (dy / distance) * this.maxDistance;
    }

    this.x = dx / this.maxDistance;
    this.y = dy / this.maxDistance;

    this.knob.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  resetJoystick() {
    this.joystickActive = false;
    this.pointerId = null;
    this.x = 0;
    this.y = 0;

    this.knob.style.transform = "translate(-50%, -50%)";
  }

  setupRunButton() {
    this.runButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.running = true;
    });

    const stop = () => {
      this.running = false;
    };

    this.runButton.addEventListener("pointerup", stop);
    this.runButton.addEventListener("pointercancel", stop);
    this.runButton.addEventListener("lostpointercapture", stop);
  }

  setupActionButton() {
    this.actionButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("riyan-action"));
    });
  }

  setupKeyboard() {
    window.addEventListener("keydown", (event) => {
      this.keys[event.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });

    window.addEventListener("blur", () => {
      this.keys = {};
      this.running = false;
      this.resetJoystick();
    });
  }

  update(delta) {
    let moveX = this.x;
    let moveZ = this.y;

    if (this.keys["w"] || this.keys["arrowup"]) moveZ -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveZ += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveX -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) moveX += 1;

    const length = Math.hypot(moveX, moveZ);

    if (length > 1) {
      moveX /= length;
      moveZ /= length;
    }

    if (length > 0.08) {
      const speed = this.running ? 8 : 4;

      this.player.position.x += moveX * speed * delta;
      this.player.position.z += moveZ * speed * delta;

      this.player.rotation.y =
        Math.atan2(moveX, moveZ) + Math.PI;
    }
  }

  destroy() {
    this.running = false;
    this.resetJoystick();
    this.keys = {};
  }
}
