(function () {
  "use strict";

  const NF = (window.NF = window.NF || {});
  const T = window.THREE;

  const MAX = 360;

  function Particles(scene) {
    this.group = new T.Group();
    this.group.name = "particles";
    scene.add(this.group);
    this.positions = new Float32Array(MAX * 3);
    this.colors = new Float32Array(MAX * 3);
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.gravity = new Float32Array(MAX);
    this.drag = new Float32Array(MAX);
    this.cursor = 0;
    const geom = new T.BufferGeometry();
    geom.setAttribute("position", new T.BufferAttribute(this.positions, 3));
    geom.setAttribute("color", new T.BufferAttribute(this.colors, 3));
    const mat = new T.PointsMaterial({
      size: 0.085,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: T.AdditiveBlending
    });
    this.points = new T.Points(geom, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 8;
    this.group.add(this.points);
    this._color = new T.Color();
    for (let i = 0; i < MAX; i++) {
      this.positions[i * 3 + 1] = -999;
    }
    this.geometry = geom;
  }

  Particles.prototype.spawn = function (x, y, z, color, opts) {
    const o = opts || {};
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX;
    const ix = i * 3;
    this.positions[ix] = x + (Math.random() - 0.5) * (o.spread || 0.1);
    this.positions[ix + 1] = y + (Math.random() - 0.5) * (o.spread || 0.1);
    this.positions[ix + 2] = z + (Math.random() - 0.5) * (o.spread || 0.1);
    const speed = o.speed === undefined ? 2.2 : o.speed;
    const angle = Math.random() * Math.PI * 2;
    const up = o.up === undefined ? 0.7 : o.up;
    const radial = (o.radial === undefined ? 1 : o.radial) * Math.random();
    this.vel[ix] = Math.cos(angle) * speed * radial;
    this.vel[ix + 1] = speed * up * (0.35 + Math.random() * 0.9);
    this.vel[ix + 2] = Math.sin(angle) * speed * radial * (o.depth || 0.55);
    this._color.set(color);
    this.colors[ix] = this._color.r;
    this.colors[ix + 1] = this._color.g;
    this.colors[ix + 2] = this._color.b;
    const life = (o.life || 0.45) * (0.7 + Math.random() * 0.6);
    this.life[i] = life;
    this.maxLife[i] = life;
    this.gravity[i] = o.gravity === undefined ? -9.5 : o.gravity;
    this.drag[i] = o.drag === undefined ? 0.92 : o.drag;
  };

  Particles.prototype.burst = function (pos, color, count, opts) {
    const n = count || 8;
    for (let i = 0; i < n; i++) {
      this.spawn(pos.x, pos.y, pos.z, color, opts);
    }
  };

  Particles.prototype.spark = function (pos, color) {
    this.burst(pos, color || "#ffd86a", 9, {
      speed: 3.8,
      up: 0.55,
      life: 0.28,
      spread: 0.16,
      gravity: -10,
      radial: 1
    });
  };

  Particles.prototype.dust = function (pos, color) {
    this.burst(pos, color || "#9b9383", 8, {
      speed: 1.2,
      up: 0.35,
      life: 0.5,
      spread: 0.28,
      gravity: -1.6,
      radial: 1.2,
      drag: 0.85
    });
  };

  Particles.prototype.coin = function (pos) {
    this.burst(pos, "#ffd45c", 7, {
      speed: 2.2,
      up: 1.25,
      life: 0.45,
      spread: 0.08,
      gravity: -5.5,
      radial: 0.25
    });
  };

  Particles.prototype.impact = function (pos, color) {
    this.burst(pos, color || "#ffffff", 16, {
      speed: 5.2,
      up: 0.55,
      life: 0.34,
      spread: 0.1,
      gravity: -12,
      radial: 1.2
    });
  };

  Particles.prototype.update = function (dt) {
    const pos = this.positions;
    const col = this.colors;
    const vel = this.vel;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) {
        if (pos[i * 3 + 1] > -900) {
          pos[i * 3 + 1] = -999;
        }
        continue;
      }
      const ix = i * 3;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        pos[ix + 1] = -999;
        col[ix] = 0;
        col[ix + 1] = 0;
        col[ix + 2] = 0;
        continue;
      }
      const drag = Math.pow(this.drag[i], dt * 60);
      vel[ix] *= drag;
      vel[ix + 2] *= drag;
      vel[ix + 1] += this.gravity[i] * dt;
      pos[ix] += vel[ix] * dt;
      pos[ix + 1] += vel[ix + 1] * dt;
      pos[ix + 2] += vel[ix + 2] * dt;
      if (pos[ix + 1] < 0.02) {
        pos[ix + 1] = 0.02;
        vel[ix + 1] *= -0.28;
        vel[ix] *= 0.7;
        vel[ix + 2] *= 0.7;
      }
      const fade = Math.max(0, this.life[i] / this.maxLife[i]);
      const fade2 = fade * fade;
      col[ix] *= 0.985;
      col[ix + 1] *= 0.985;
      col[ix + 2] *= 0.985;
      if (fade < 0.55) {
        col[ix] *= 0.94;
        col[ix + 1] *= 0.94;
        col[ix + 2] *= 0.94;
      }
      if (fade2 < 0.05) {
        col[ix] *= 0.9;
        col[ix + 1] *= 0.9;
        col[ix + 2] *= 0.9;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  };

  Particles.prototype.clear = function () {
    for (let i = 0; i < MAX; i++) {
      this.life[i] = 0;
      this.positions[i * 3 + 1] = -999;
      this.colors[i * 3] = 0;
      this.colors[i * 3 + 1] = 0;
      this.colors[i * 3 + 2] = 0;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  };

  NF.Particles = Particles;
})();
