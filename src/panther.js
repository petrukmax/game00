(function () {
  "use strict";

  const NF = (window.NF = window.NF || {});
  const T = window.THREE;
  const A = NF.Assets;

  const BODY_Y = 0.63;
  const FRONT_HIP_X = 0.39;
  const HIND_HIP_X = -0.35;
  const LEG_Z = 0.185;
  const WALK_SPEED = 3.15;
  const RUN_SPEED = 5.25;
  const DEPTH_SPEED = 2.65;
  const GRAVITY = 18;
  const JUMP_V = 6.15;

  const STATE_DURATION = {
    idle: 0,
    walk: 0,
    run: 0,
    jump: 0,
    swipe: 0.36,
    bite: 0.52,
    pounce: 0,
    grab: 0.45,
    grabHold: 0,
    throw: 0.55,
    hit: 0.28,
    hitHeavy: 0.45,
    down: 0.75,
    getup: 0.5,
    dead: 1.6,
    victory: 0
  };

  function Panther(game) {
    this.game = game;
    this.name = "Nightfang";
    this.maxHealth = 100;
    this.health = 100;
    this.lives = 3;
    this.x = 3;
    this.z = 0;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
    this.vz = 0;
    this.radius = 0.45;
    this.height = 0.95;
    this.facing = 1;
    this.rootYaw = 0;
    this.state = "idle";
    this.stateTime = 0;
    this.stateDuration = 0;
    this.animTime = 0;
    this.gait = 0;
    this.gaitBlend = 0;
    this.invuln = 0;
    this.flash = 0;
    this.blinkTimer = 3;
    this.earTimer = 4;
    this.specialCooldown = 0;
    this.specialMax = 4;
    this.buff = 0;
    this.comboInputCount = 0;
    this.comboTimer = 0;
    this.attackFired = false;
    this.swipeSide = 0;
    this.grabbed = null;
    this.grabHoldTime = 0;
    this.dead = false;
    this.deathHandled = false;
    this.pouncePhase = "";
    this.pounceHitSet = null;
    this.pounceImpactDone = false;
    this.pounceLandTime = 0;
    this.clawsOut = false;
    this.stateLabel = "idle";
    this.root = new T.Group();
    this.root.name = "Nightfang";
    this.model = {};
    this.materials = {};
    this.frontLegs = [];
    this.hindLegs = [];
    this.tail = [];
    this.eyes = [];
    this.claws = [];
    this.buildModel();
    this.reset(this.x, this.z);
  }

  Panther.prototype.buildModel = function () {
    const mat = {
      fur: A.standard(0x0a0c10, 0.56, 0.08),
      furHi: A.standard(0x202b37, 0.44, 0.13),
      belly: A.standard(0x151a20, 0.62, 0.05),
      paw: A.standard(0x0c0e12, 0.5, 0.08),
      nose: A.standard(0x070708, 0.35, 0.2),
      innerEar: A.standard(0x24171b, 0.7, 0.02),
      eye: new T.MeshStandardMaterial({
        color: 0xd7ff4c,
        emissive: 0xc8ff3f,
        emissiveIntensity: 3.2,
        roughness: 0.2,
        metalness: 0.05
      }),
      eyeSlit: new T.MeshBasicMaterial({ color: 0x050604 }),
      claw: A.standard(0xd8d7c4, 0.32, 0.18)
    };
    this.materials = mat;

    const body = new T.Group();
    body.position.set(0, BODY_Y, 0);
    this.root.add(body);
    this.model.body = body;

    const torsoGeo = new T.IcosahedronGeometry(1, 1);
    const torso = new T.Mesh(torsoGeo, mat.fur);
    torso.scale.set(0.49, 0.29, 0.255);
    torso.position.set(0.01, 0.01, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    body.add(torso);
    this.model.torso = torso;

    const chest = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat.fur);
    chest.scale.set(0.27, 0.31, 0.255);
    chest.position.set(0.32, 0.01, 0);
    chest.castShadow = true;
    body.add(chest);
    this.model.chest = chest;

    const hips = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat.fur);
    hips.scale.set(0.26, 0.27, 0.245);
    hips.position.set(-0.32, 0.015, 0);
    hips.castShadow = true;
    body.add(hips);
    this.model.hips = hips;

    const belly = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat.belly);
    belly.scale.set(0.44, 0.13, 0.205);
    belly.position.set(0.02, -0.17, 0);
    body.add(belly);

    const backPlate = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat.furHi);
    backPlate.scale.set(0.36, 0.075, 0.17);
    backPlate.position.set(-0.02, 0.235, 0);
    body.add(backPlate);
    this.model.backPlate = backPlate;

    const neck = new T.Group();
    neck.position.set(0.48, 0.055, 0);
    neck.rotation.z = -0.08;
    body.add(neck);
    this.model.neck = neck;

    const neckMesh = new T.Mesh(new T.CylinderGeometry(0.13, 0.17, 0.29, 7), mat.fur);
    neckMesh.rotation.z = Math.PI / 2;
    neckMesh.position.x = 0.10;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    const head = new T.Group();
    head.position.set(0.27, 0.075, 0);
    neck.add(head);
    this.model.head = head;

    const skull = new T.Mesh(new T.IcosahedronGeometry(0.17, 1), mat.fur);
    skull.scale.set(1.14, 0.92, 0.95);
    skull.position.set(0.055, 0.01, 0);
    skull.castShadow = true;
    head.add(skull);
    this.model.skull = skull;

    const cheekL = new T.Mesh(new T.IcosahedronGeometry(0.075, 1), mat.furHi);
    cheekL.scale.set(1.1, 0.7, 0.8);
    cheekL.position.set(0.055, -0.032, 0.105);
    head.add(cheekL);
    const cheekR = cheekL.clone();
    cheekR.position.z = -0.105;
    head.add(cheekR);

    const muzzle = new T.Mesh(new T.CylinderGeometry(0.075, 0.095, 0.16, 6), mat.furHi);
    muzzle.rotation.z = -Math.PI / 2;
    muzzle.position.set(0.19, -0.035, 0);
    muzzle.castShadow = true;
    head.add(muzzle);
    this.model.muzzle = muzzle;

    const nose = new T.Mesh(new T.IcosahedronGeometry(0.035, 1), mat.nose);
    nose.scale.set(1.1, 0.7, 1.1);
    nose.position.set(0.29, -0.025, 0);
    head.add(nose);

    const jaw = new T.Group();
    jaw.position.set(0.12, -0.065, 0);
    head.add(jaw);
    this.model.jaw = jaw;
    const jawMesh = new T.Mesh(new T.BoxGeometry(0.18, 0.035, 0.115), mat.belly);
    jawMesh.position.set(0.09, -0.015, 0);
    jawMesh.castShadow = true;
    jaw.add(jawMesh);
    const chin = new T.Mesh(new T.IcosahedronGeometry(0.04, 1), mat.furHi);
    chin.position.set(0.17, -0.02, 0);
    jaw.add(chin);

    const mouth = new T.Mesh(new T.BoxGeometry(0.13, 0.012, 0.075), mat.innerEar);
    mouth.position.set(0.18, -0.068, 0);
    head.add(mouth);

    this.model.ears = [];
    for (let side = -1; side <= 1; side += 2) {
      const ear = new T.Group();
      ear.position.set(-0.005, 0.145, side * 0.105);
      ear.rotation.z = side * 0.13;
      ear.rotation.x = side * 0.2;
      const outer = new T.Mesh(new T.ConeGeometry(0.066, 0.14, 4), mat.fur);
      outer.position.y = 0.065;
      outer.castShadow = true;
      ear.add(outer);
      const inner = new T.Mesh(new T.ConeGeometry(0.038, 0.09, 4), mat.innerEar);
      inner.position.set(0.012, 0.064, side * -0.008);
      inner.scale.z = 0.45;
      ear.add(inner);
      head.add(ear);
      this.model.ears.push(ear);
    }

    for (let side = -1; side <= 1; side += 2) {
      const eye = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), mat.eye);
      eye.position.set(0.125, 0.035, side * 0.144);
      eye.scale.set(0.75, 1, 0.35);
      head.add(eye);
      const slit = new T.Mesh(new T.BoxGeometry(0.007, 0.034, 0.006), mat.eyeSlit);
      slit.position.set(0.127, 0.035, side * 0.158);
      slit.scale.set(1, 1, 0.5);
      head.add(slit);
      this.eyes.push(eye);
    }

    this.buildFrontLeg(1);
    this.buildFrontLeg(-1);
    this.buildHindLeg(1);
    this.buildHindLeg(-1);
    this.buildTail();

    const shadow = A.plane(1.35, 0.82, new T.MeshBasicMaterial({
      map: A.blobTexture(),
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      depthTest: true
    }), 0, 0.012, 0);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    this.root.add(shadow);
    this.shadow = shadow;

    this.root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  };

  Panther.prototype.buildFrontLeg = function (zSign) {
    const body = this.model.body;
    const hip = new T.Group();
    hip.position.set(FRONT_HIP_X, -0.01, zSign * LEG_Z);
    hip.rotation.z = zSign > 0 ? -0.16 : -0.12;
    body.add(hip);

    const upper = A.limb(0.285, 0.082, 0.068, this.materials.fur, 6);
    hip.add(upper);

    const knee = new T.Group();
    knee.position.y = -0.285;
    knee.rotation.z = 0.38;
    hip.add(knee);
    const lower = A.limb(0.245, 0.062, 0.046, this.materials.fur, 6);
    knee.add(lower);

    const ankle = new T.Group();
    ankle.position.y = -0.245;
    ankle.rotation.z = -0.22;
    knee.add(ankle);

    const paw = A.box(0.155, 0.055, 0.135, this.materials.paw, 0.045, -0.02, 0);
    ankle.add(paw);

    const clawGroup = new T.Group();
    clawGroup.position.set(0.115, -0.018, 0);
    ankle.add(clawGroup);
    for (let i = -1; i <= 1; i++) {
      const claw = A.cone(0.015, 0.065, 4, this.materials.claw, 0, 0, i * 0.036);
      claw.rotation.z = -Math.PI / 2;
      claw.castShadow = false;
      claw.visible = false;
      clawGroup.add(claw);
      this.claws.push(claw);
    }

    const leg = {
      hip: hip,
      knee: knee,
      ankle: ankle,
      paw: paw,
      clawGroup: clawGroup,
      zSign: zSign,
      baseHip: hip.rotation.z,
      baseKnee: knee.rotation.z,
      baseAnkle: ankle.rotation.z
    };
    this.frontLegs.push(leg);
    return leg;
  };

  Panther.prototype.buildHindLeg = function (zSign) {
    const body = this.model.body;
    const hip = new T.Group();
    hip.position.set(HIND_HIP_X, -0.005, zSign * LEG_Z);
    hip.rotation.z = zSign > 0 ? 0.44 : 0.38;
    body.add(hip);

    const thigh = A.limb(0.30, 0.105, 0.07, this.materials.fur, 6);
    hip.add(thigh);

    const knee = new T.Group();
    knee.position.y = -0.30;
    knee.rotation.z = -0.72;
    hip.add(knee);
    const shin = A.limb(0.245, 0.06, 0.043, this.materials.fur, 6);
    knee.add(shin);

    const hock = new T.Group();
    hock.position.y = -0.245;
    hock.rotation.z = 0.42;
    knee.add(hock);
    const foot = A.limb(0.09, 0.044, 0.052, this.materials.paw, 5);
    hock.add(foot);

    const paw = A.box(0.155, 0.052, 0.135, this.materials.paw, 0.05, -0.095, 0);
    hock.add(paw);

    const clawGroup = new T.Group();
    clawGroup.position.set(0.12, -0.092, 0);
    hock.add(clawGroup);
    for (let i = -1; i <= 1; i++) {
      const claw = A.cone(0.014, 0.06, 4, this.materials.claw, 0, 0, i * 0.036);
      claw.rotation.z = -Math.PI / 2;
      claw.castShadow = false;
      claw.visible = false;
      clawGroup.add(claw);
      this.claws.push(claw);
    }

    const leg = {
      hip: hip,
      knee: knee,
      hock: hock,
      paw: paw,
      clawGroup: clawGroup,
      zSign: zSign,
      baseHip: hip.rotation.z,
      baseKnee: knee.rotation.z,
      baseHock: hock.rotation.z
    };
    this.hindLegs.push(leg);
    return leg;
  };

  Panther.prototype.buildTail = function () {
    const lengths = [0.19, 0.18, 0.17, 0.16, 0.15, 0.14];
    const radii = [0.085, 0.075, 0.064, 0.053, 0.042, 0.03, 0.018];
    const base = new T.Group();
    base.position.set(-0.52, 0.09, 0);
    this.model.body.add(base);
    this.model.tailBase = base;
    let parent = base;
    for (let i = 0; i < lengths.length; i++) {
      const g = new T.Group();
      g.position.x = i === 0 ? 0 : -lengths[i - 1];
      g.rotation.z = i === 0 ? 0.25 : i === 1 ? 0.16 : i === 2 ? 0.08 : i === 3 ? -0.02 : i === 4 ? -0.12 : -0.17;
      const geo = new T.CylinderGeometry(radii[i + 1], radii[i], lengths[i], 5);
      geo.rotateZ(Math.PI / 2);
      geo.translate(-lengths[i] / 2, 0, 0);
      const mesh = new T.Mesh(geo, this.materials.fur);
      mesh.castShadow = true;
      g.add(mesh);
      parent.add(g);
      this.tail.push(g);
      parent = g;
    }
    const tip = new T.Mesh(new T.IcosahedronGeometry(0.032, 1), this.materials.furHi);
    tip.position.x = -lengths[lengths.length - 1];
    parent.add(tip);
  };

  Panther.prototype.reset = function (x, z) {
    this.health = this.maxHealth;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
    this.vz = 0;
    this.facing = 1;
    this.rootYaw = 0;
    this.state = "idle";
    this.stateTime = 0;
    this.stateDuration = 0;
    this.invuln = 0;
    this.flash = 0;
    this.blinkTimer = 3;
    this.earTimer = 4;
    this.specialCooldown = 0;
    this.buff = 0;
    this.comboInputCount = 0;
    this.comboTimer = 0;
    this.grabbed = null;
    this.grabHoldTime = 0;
    this.dead = false;
    this.deathHandled = false;
    this.pouncePhase = "";
    this.pounceHitSet = null;
    this.pounceImpactDone = false;
    this.pounceLandTime = 0;
    this.clawsOut = false;
    this.root.visible = true;
    this.root.position.set(x, 0, z);
    this.root.rotation.set(0, 0, 0);
    this.rootYaw = 0;
    this.updatePose(0);
  };

  Panther.prototype.getForward = function () {
    return this.facing;
  };

  Panther.prototype.isGrounded = function () {
    return this.y <= 0.001 && this.state !== "pounce";
  };

  Panther.prototype.canAct = function () {
    if (!this.isGrounded()) return false;
    return this.state === "idle" || this.state === "walk" || this.state === "run";
  };

  Panther.prototype.setPosition = function (x, z) {
    this.x = x;
    this.z = z;
    this.root.position.x = x;
    this.root.position.z = z;
  };

  Panther.prototype.move = function (dx, dz) {
    if (this.game.level) {
      this.game.level.moveEntity(this, dx, dz);
    } else {
      this.x += dx;
      this.z += dz;
    }
    this.root.position.x = this.x;
    this.root.position.z = this.z;
  };

  Panther.prototype.startJump = function () {
    if (!this.isGrounded() || !this.canAct()) return;
    this.state = "jump";
    this.stateTime = 0;
    this.vy = JUMP_V;
    this.y = 0.01;
    this.vx *= 0.4;
    this.game.audio.play("jump");
    this.game.particles.dust(new T.Vector3(this.x, 0.05, this.z), "#8d8775");
  };

  Panther.prototype.startLight = function () {
    if (!this.canAct()) return;
    if (this.comboInputCount >= 2) {
      this.startBite(true);
      this.comboInputCount = 0;
      this.comboTimer = 0;
    } else {
      this.startSwipe(this.comboInputCount);
      this.comboInputCount++;
      this.comboTimer = 1.05;
    }
  };

  Panther.prototype.startSwipe = function (index) {
    this.state = "swipe";
    this.stateLabel = "forepaw swipe";
    this.stateTime = 0;
    this.stateDuration = STATE_DURATION.swipe;
    this.attackFired = false;
    this.swipeSide = index % 2;
    this.vx *= 0.2;
    this.vz *= 0.2;
    this.grabbed = null;
  };

  Panther.prototype.startBite = function (finisher) {
    this.state = "bite";
    this.stateLabel = "bite";
    this.stateTime = 0;
    this.stateDuration = STATE_DURATION.bite;
    this.attackFired = false;
    this.vx = this.facing * (finisher ? 2.8 : 2.2);
    this.vz = 0;
    this.grabbed = null;
    this.finisher = !!finisher;
  };

  Panther.prototype.startPounce = function () {
    if (!this.canAct()) return;
    if (this.specialCooldown > 0.01) {
      this.game.ui.toast("POUNCE RECHARGING · " + this.specialCooldown.toFixed(1) + "s", 1100);
      return;
    }
    this.state = "pounce";
    this.stateLabel = "pounce";
    this.stateTime = 0;
    this.pouncePhase = "crouch";
    this.pounceHitSet = new Set();
    this.pounceImpactDone = false;
    this.pounceLandTime = 0;
    this.specialCooldown = this.specialMax;
    this.vx = 0;
    this.vz = 0;
    this.vy = 0;
    this.finisher = false;
    this.game.audio.play("pounce");
    this.game.ui.toast("POUNCE!", 600);
  };

  Panther.prototype.tryGrab = function () {
    if (!this.canAct() || this.grabbed) return;
    let best = null;
    let bestD = 1.25;
    for (const enemy of this.game.enemies) {
      if (!enemy || enemy.dead || enemy.state === "grabbed" || enemy.isBoss) continue;
      if (!enemy.canBeGrabbed()) continue;
      const dx = enemy.x - this.x;
      const dz = enemy.z - this.z;
      const d = Math.hypot(dx, dz);
      if (d < bestD && Math.abs(dx) < 1.4) {
        bestD = d;
        best = enemy;
      }
    }
    if (!best) {
      this.game.ui.toast("STAGGER AN ENEMY FIRST", 1000);
      return;
    }
    this.grabbed = best;
    this.facing = best.x >= this.x ? 1 : -1;
    best.beginGrabbed(this);
    this.state = "grab";
    this.stateLabel = "grab";
    this.stateTime = 0;
    this.stateDuration = STATE_DURATION.grab;
    this.vx = 0;
    this.vz = 0;
    this.game.audio.play("bite", { pan: 0 });
  };

  Panther.prototype.throwGrabbed = function () {
    if (!this.grabbed || this.state !== "grabHold") return;
    const enemy = this.grabbed;
    enemy.throwFrom(this);
    this.grabbed = null;
    this.state = "throw";
    this.stateLabel = "throw";
    this.stateTime = 0;
    this.stateDuration = STATE_DURATION.throw;
    this.game.audio.play("swipe");
    this.game.particles.burst(
      new T.Vector3(this.x + this.facing * 0.8, 0.7, this.z),
      "#ffcf63", 14, { speed: 4.5, up: 0.9, life: 0.34, spread: 0.18, gravity: -8 }
    );
    this.game.shake(0.16, 0.18);
  };

  Panther.prototype.takeDamage = function (amount, sourceX, opts) {
    const o = opts || {};
    if (this.dead || this.invuln > 0 || this.state === "pounce" && this.pouncePhase === "air") return false;
    this.health = Math.max(0, this.health - amount);
    this.flash = 0.16;
    this.invuln = o.invuln || 0.85;
    this.game.resetCombo();
    this.game.audio.play(o.heavy ? "heavyHit" : "hit");
    this.game.particles.impact(new T.Vector3(this.x, this.y + 0.65, this.z), "#ff6b5c");
    this.game.shake(o.heavy ? 0.34 : 0.22, 0.2);
    if (this.grabbed) {
      this.grabbed.releaseGrabbed();
      this.grabbed = null;
    }
    if (this.health <= 0) {
      this.die();
      return true;
    }
    const dir = sourceX === undefined ? -this.facing : (this.x < sourceX ? -1 : 1);
    this.state = o.heavy ? "hitHeavy" : "hit";
    this.stateLabel = "hit";
    this.stateTime = 0;
    this.stateDuration = o.heavy ? STATE_DURATION.hitHeavy : STATE_DURATION.hit;
    this.vx = dir * (o.knockback || 2.8);
    this.vz = (Math.random() - 0.5) * 0.7;
    if (o.knockdown) {
      this.state = "down";
      this.stateDuration = STATE_DURATION.down;
      this.vy = 2.6;
    }
    return true;
  };

  Panther.prototype.die = function () {
    if (this.dead) return;
    this.dead = true;
    this.deathHandled = false;
    this.state = "dead";
    this.stateLabel = "defeated";
    this.stateTime = 0;
    this.stateDuration = STATE_DURATION.dead;
    this.vx = -this.facing * 1.8;
    this.vy = 1.2;
    this.invuln = 99;
    this.game.audio.play("death");
    this.game.shake(0.4, 0.5);
    this.game.onHeroDeathStart();
  };

  Panther.prototype.respawnAt = function (x, z) {
    this.dead = false;
    this.deathHandled = false;
    this.health = this.maxHealth;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
    this.vz = 0;
    this.state = "idle";
    this.stateTime = 0;
    this.stateDuration = 0;
    this.invuln = 2.2;
    this.flash = 0;
    this.invuln = 2.2;
    this.grabbed = null;
    this.grabHoldTime = 0;
    this.pouncePhase = "";
    this.pounceHitSet = null;
    this.root.position.set(x, 0, z);
    this.root.visible = true;
    this.game.resetCombo();
    this.updatePose(0);
  };

  Panther.prototype.releaseGrabbed = function () {
    if (this.grabbed) {
      this.grabbed.releaseGrabbed();
      this.grabbed = null;
    }
  };

  Panther.prototype.damageMultiplier = function () {
    return this.buff > 0 ? 1.5 : 1;
  };

  Panther.prototype.update = function (dt, input) {
    if (!this.game) return;
    this.animTime += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.buff > 0) this.buff -= dt;
    if (this.specialCooldown > 0) this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboInputCount = 0;
    }

    this.root.rotation.y = A.lerpAngle(this.root.rotation.y, this.facing > 0 ? 0 : Math.PI, 1 - Math.exp(-16 * dt));
    this.root.position.y = this.y;
    this.shadow.position.y = -this.y + 0.012;
    const shadowScale = 1 - Math.min(0.55, this.y * 0.12);
    this.shadow.scale.set(shadowScale, shadowScale, 1);

    if (this.state === "dead") {
      this.stateTime += dt;
      this.y += this.vy * dt;
      this.vy -= GRAVITY * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; }
      this.x += this.vx * dt;
      this.vx *= Math.pow(0.02, dt);
      this.root.position.x = this.x;
      this.root.position.y = this.y;
      this.updatePose(dt);
      if (this.stateTime >= 1.6 && !this.deathHandled) {
        this.deathHandled = true;
        this.game.onHeroDeathComplete();
      }
      return;
    }

    if (this.state === "hit" || this.state === "hitHeavy" || this.state === "down" || this.state === "getup") {
      this.updateHitState(dt);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }

    if (this.state === "swipe") {
      this.updateSwipe(dt);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }
    if (this.state === "bite") {
      this.updateBite(dt);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }
    if (this.state === "pounce") {
      this.updatePounce(dt);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }
    if (this.state === "grab") {
      this.updateGrab(dt);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }
    if (this.state === "grabHold") {
      this.grabHoldTime += dt;
      if (this.grabbed) {
        this.grabbed.x = this.x + this.facing * 0.58;
        this.grabbed.z = this.z;
        this.grabbed.root.position.set(this.grabbed.x, 0.18, this.grabbed.z);
        this.grabbed.root.rotation.y = this.facing > 0 ? Math.PI : 0;
      }
      if (input.wasPressed("swipe") || input.wasPressed("grab") || input.wasPressed("bite")) {
        this.throwGrabbed();
      } else if (this.grabHoldTime > 1.4) {
        this.throwGrabbed();
      }
      this.updatePose(dt);
      this.syncRoot();
      return;
    }
    if (this.state === "throw") {
      this.stateTime += dt;
      this.vx *= Math.pow(0.05, dt);
      this.updatePose(dt);
      if (this.stateTime >= this.stateDuration) {
        this.state = "idle";
        this.stateTime = 0;
      }
      this.syncRoot();
      return;
    }
    if (this.state === "jump") {
      this.updateJump(dt, input);
      this.updatePose(dt);
      this.syncRoot();
      return;
    }

    this.updateLocomotion(dt, input);
    this.updatePose(dt);
    this.syncRoot();
  };

  Panther.prototype.syncRoot = function () {
    this.root.position.x = this.x;
    this.root.position.y = this.y;
    this.root.position.z = this.z;
  };

  Panther.prototype.updateLocomotion = function (dt, input) {
    let mx = input.getMoveX();
    let mz = input.getMoveZ();
    const wantsMove = Math.abs(mx) > 0.08 || Math.abs(mz) > 0.08;
    const running = input.isRunning() && wantsMove;
    let len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    if (Math.abs(mx) > 0.08) this.facing = mx > 0 ? 1 : -1;
    const sx = running ? RUN_SPEED : WALK_SPEED;
    const sz = running ? 3.5 : DEPTH_SPEED;
    this.vx = A.damp(this.vx, mx * sx, 13, dt);
    this.vz = A.damp(this.vz, mz * sz, 13, dt);
    if (Math.abs(this.vx) < 0.03) this.vx = 0;
    if (Math.abs(this.vz) < 0.03) this.vz = 0;
    this.move(this.vx * dt, this.vz * dt);
    if (wantsMove) {
      this.state = running ? "run" : "walk";
      this.gait += dt * (running ? 12.2 : 7.4);
      this.gaitBlend = A.damp(this.gaitBlend, 1, 12, dt);
    } else {
      this.state = "idle";
      this.gaitBlend = A.damp(this.gaitBlend, 0, 9, dt);
    }

    if (input.wasPressed("jump")) {
      this.startJump();
      return;
    }
    if (input.wasPressed("swipe")) {
      this.startLight();
      return;
    }
    if (input.wasPressed("bite")) {
      this.startBite(false);
      return;
    }
    if (input.wasPressed("pounce")) {
      this.startPounce();
      return;
    }
    if (input.wasPressed("grab")) {
      if (this.state === "idle" || this.state === "walk" || this.state === "run") this.tryGrab();
    }
  };

  Panther.prototype.updateJump = function (dt, input) {
    this.stateTime += dt;
    this.y += this.vy * dt;
    this.vy -= GRAVITY * dt;
    const mx = input.getMoveX();
    const mz = input.getMoveZ();
    this.vx = A.damp(this.vx, mx * WALK_SPEED * 0.75, 7, dt);
    this.vz = A.damp(this.vz, mz * DEPTH_SPEED * 0.75, 7, dt);
    this.move(this.vx * dt, this.vz * dt);
    if (this.y <= 0) {
      this.y = 0;
      this.vy = 0;
      this.state = "idle";
      this.stateTime = 0;
      this.game.audio.play("land");
      this.game.particles.dust(new T.Vector3(this.x, 0.04, this.z), "#8d8775");
      this.game.shake(0.06, 0.1);
    }
  };

  Panther.prototype.updateHitState = function (dt) {
    this.stateTime += dt;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.y += this.vy * dt;
    this.vy -= GRAVITY * dt;
    if (this.y <= 0) {
      this.y = 0;
      if (this.vy < -2.4) this.game.particles.dust(new T.Vector3(this.x, 0.04, this.z), "#8d8775");
      this.vy = 0;
    }
    this.vx *= Math.pow(0.12, dt);
    this.vz *= Math.pow(0.12, dt);
    if (this.game.level) this.game.level.clampEntity(this);
    if (this.stateTime >= this.stateDuration) {
      if (this.state === "down") {
        this.state = "getup";
        this.stateTime = 0;
        this.stateDuration = STATE_DURATION.getup;
      } else {
        this.state = "idle";
        this.stateTime = 0;
        this.stateDuration = 0;
      }
    }
  };

  Panther.prototype.updateSwipe = function (dt) {
    this.stateTime += dt;
    const p = this.stateTime / this.stateDuration;
    if (!this.attackFired && p >= 0.24) {
      this.attackFired = true;
      this.game.audio.play("swipe");
      this.game.combat.heroMelee("swipe", this, {
        damage: 6 * this.damageMultiplier(),
        knockback: 1.3,
        hitstop: 0.045,
        range: 0.72,
        radius: 0.62,
        y: 0.62
      });
      this.game.particles.burst(
        new T.Vector3(this.x + this.facing * 0.75, 0.6, this.z),
        "#d8ffb0", 4, { speed: 1.8, up: 0.2, life: 0.2, spread: 0.1, gravity: -2, radial: 1 }
      );
    }
    if (p > 0.2 && p < 0.58) {
      this.move(this.facing * 0.65 * dt, 0);
    }
    if (p >= 1) {
      this.state = "idle";
      this.stateTime = 0;
      this.stateDuration = 0;
    }
  };

  Panther.prototype.updateBite = function (dt) {
    this.stateTime += dt;
    const p = this.stateTime / this.stateDuration;
    if (!this.attackFired && p >= 0.3) {
      this.attackFired = true;
      this.game.audio.play("bite");
      this.game.combat.heroMelee("bite", this, {
        damage: 11 * this.damageMultiplier(),
        knockback: 3.0,
        hitstop: 0.07,
        range: 1.15,
        radius: 0.72,
        y: 0.75,
        stagger: true
      });
    }
    if (p > 0.12 && p < 0.42) {
      this.move(this.facing * 2.1 * dt, 0);
    }
    if (p >= 1) {
      this.state = "idle";
      this.stateTime = 0;
      this.stateDuration = 0;
    }
  };

  Panther.prototype.updatePounce = function (dt) {
    this.stateTime += dt;
    if (this.pouncePhase === "crouch") {
      this.vx = 0;
      this.vz = 0;
      if (this.stateTime >= 0.2) {
        this.pouncePhase = "air";
        this.stateTime = 0;
        this.vy = 5.35;
        this.vx = this.facing * 8.7;
        this.vz = 0;
        this.game.audio.play("swipe");
      }
      return;
    }
    if (this.pouncePhase === "air") {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy -= 16 * dt;
      if (this.game.level) {
        this.game.level.clampEntity(this);
        if (this.game.level.hitsObstacle(this)) {
          this.vx = 0;
          this.y = Math.min(this.y, 0.2);
        }
      }
      this.checkPounceHits();
      if (this.y <= 0) {
        this.landPounce();
      }
      return;
    }
    if (this.pouncePhase === "recover") {
      this.pounceLandTime += dt;
      this.vx *= Math.pow(0.02, dt);
      this.vz *= Math.pow(0.02, dt);
      if (this.pounceLandTime >= 0.43) {
        this.state = "idle";
        this.stateTime = 0;
        this.stateDuration = 0;
        this.pouncePhase = "";
      }
    }
  };

  Panther.prototype.checkPounceHits = function () {
    const reach = 1.05;
    for (const enemy of this.game.enemies) {
      if (!enemy || enemy.dead || this.pounceHitSet.has(enemy.id)) continue;
      const dx = enemy.x - this.x;
      const dz = enemy.z - this.z;
      if (Math.abs(dx) < reach && Math.abs(dz) < 0.95 && this.y < 1.45) {
        this.pounceHitSet.add(enemy.id);
        const result = enemy.takeDamage(18 * this.damageMultiplier(), this.x, {
          knockback: 6.0,
          hitstop: 0.09,
          heavy: true,
          knockdown: true,
          source: "pounce"
        });
        if (result) {
          this.game.audio.play("heavyHit");
          this.game.particles.impact(new T.Vector3(enemy.x, 0.8, enemy.z), "#d6ff8a");
          this.game.shake(0.3, 0.22);
          this.game.registerHit(enemy, 2);
        }
      }
    }
  };

  Panther.prototype.landPounce = function () {
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
    this.pouncePhase = "recover";
    this.pounceLandTime = 0;
    this.game.audio.play("land");
    this.game.particles.dust(new T.Vector3(this.x, 0.04, this.z), "#a69b83");
    this.game.particles.impact(new T.Vector3(this.x, 0.25, this.z), "#d8ff9b");
    this.game.shake(0.3, 0.24);
    if (!this.pounceImpactDone) {
      this.pounceImpactDone = true;
      for (const enemy of this.game.enemies) {
        if (!enemy || enemy.dead || this.pounceHitSet.has(enemy.id)) continue;
        const dx = enemy.x - this.x;
        const dz = enemy.z - this.z;
        if (Math.abs(dx) < 1.25 && Math.abs(dz) < 1.0) {
          this.pounceHitSet.add(enemy.id);
          const hit = enemy.takeDamage(8 * this.damageMultiplier(), this.x, {
            knockback: 4.2,
            hitstop: 0.06,
            heavy: true,
            knockdown: true,
            source: "pounceImpact"
          });
          if (hit) this.game.registerHit(enemy, 1);
        }
      }
    }
  };

  Panther.prototype.updateGrab = function (dt) {
    this.stateTime += dt;
    if (this.grabbed) {
      this.grabbed.x = this.x + this.facing * 0.58;
      this.grabbed.z = this.z;
      this.grabbed.root.position.set(this.grabbed.x, 0.18, this.grabbed.z);
      this.grabbed.root.rotation.y = this.facing > 0 ? Math.PI : 0;
      this.grabbed.state = "grabbed";
    }
    if (this.stateTime >= this.stateDuration) {
      this.state = "grabHold";
      this.stateTime = 0;
      this.grabHoldTime = 0;
      this.game.ui.toast("J / E · THROW", 1300);
    }
  };

  Panther.prototype.updatePose = function (dt) {
    const m = this.model;
    if (!m.body) return;
    const state = this.state;
    const t = this.animTime;
    const moving = state === "walk" || state === "run";
    const run = state === "run";
    const gaitAmp = run ? 0.94 : 0.55;
    const phase = this.gait * Math.PI * 2;
    let bodyBob = 0;
    let bodyPitch = 0;
    let bodyRoll = 0;
    let bodyYaw = 0;
    let bodyY = BODY_Y;

    this.clawsOut = state === "swipe" || state === "bite" || state === "pounce" || state === "grab" || state === "grabHold";
    for (const c of this.claws) c.visible = this.clawsOut;

    // Blink and ear flicks are deliberately slow so the idle reads as alive.
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 3.5 + Math.random() * 3.5;
      this.blinkPulse = 0.12;
    }
    if (this.blinkPulse > 0) this.blinkPulse -= dt;
    const blink = this.blinkPulse > 0 ? 0.12 : 1;
    for (const eye of this.eyes) eye.scale.y = blink;

    // Base pose.
    this.frontLegs.forEach((leg, i) => {
      const off = i === 0 ? 0.08 : 0.58;
      const swing = moving ? Math.sin(phase + off * Math.PI * 2) * gaitAmp : 0;
      const lift = moving ? Math.max(0, Math.cos(phase + off * Math.PI * 2)) * 0.32 : 0;
      leg.hip.rotation.z = leg.baseHip - swing * 0.62 - lift * 0.14;
      leg.knee.rotation.z = leg.baseKnee + Math.max(0, swing) * 0.55 + lift * 0.55;
      leg.ankle.rotation.z = leg.baseAnkle - Math.max(0, swing) * 0.22;
      leg.hip.rotation.y = moving ? Math.sin(phase + off * Math.PI * 2) * 0.03 : 0;
    });
    this.hindLegs.forEach((leg, i) => {
      const off = i === 0 ? 0.36 : 0.86;
      const swing = moving ? Math.sin(phase + off * Math.PI * 2) * gaitAmp : 0;
      const lift = moving ? Math.max(0, Math.cos(phase + off * Math.PI * 2)) * 0.24 : 0;
      leg.hip.rotation.z = leg.baseHip - swing * 0.68 - lift * 0.18;
      leg.knee.rotation.z = leg.baseKnee + Math.max(0, swing) * 0.6 + lift * 0.58;
      leg.hock.rotation.z = leg.baseHock - Math.max(0, swing) * 0.26;
      leg.hip.rotation.y = moving ? Math.sin(phase + off * Math.PI * 2) * 0.03 : 0;
    });
    m.jaw.rotation.z = -0.045;
    m.neck.rotation.z = -0.08;
    m.head.rotation.y = Math.sin(t * 0.43) * 0.025;
    m.head.rotation.z = 0;
    m.neck.position.x = 0.48;
    m.head.position.x = 0.27;

    if (moving) {
      bodyBob = Math.sin(phase * 2) * (run ? 0.025 : 0.012);
      bodyPitch = run ? -0.06 : -0.025;
      bodyYaw = Math.sin(phase) * (run ? 0.055 : 0.028);
      bodyRoll = Math.sin(phase + 0.8) * (run ? 0.025 : 0.012);
    } else {
      bodyBob = Math.sin(t * (Math.PI * 2 / 2.8)) * 0.008;
      m.body.scale.set(1, 1 + Math.sin(t * 2.2) * 0.006, 1.01);
    }

    // State-specific overlay.
    if (state === "jump") {
      const up = Math.max(-1, Math.min(1, this.vy / JUMP_V));
      bodyPitch = -0.1 - up * 0.08;
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = -0.95;
        leg.knee.rotation.z = 0.95;
      });
      this.hindLegs.forEach((leg) => {
        leg.hip.rotation.z = 1.05;
        leg.knee.rotation.z = -1.2;
      });
      bodyY += 0.02;
    } else if (state === "swipe") {
      const p = Math.min(1, this.stateTime / this.stateDuration);
      const arc = Math.sin(p * Math.PI);
      const chosen = this.frontLegs[this.swipeSide];
      if (chosen) {
        const dir = chosen.zSign > 0 ? 1 : -1;
        chosen.hip.rotation.z = chosen.baseHip - 1.35 * arc;
        chosen.hip.rotation.y = dir * 0.6 * arc;
        chosen.knee.rotation.z = chosen.baseKnee + 0.95 * arc;
        chosen.ankle.rotation.z = chosen.baseAnkle - 0.55 * arc;
      }
      const support = this.frontLegs[1 - this.swipeSide];
      if (support) {
        support.hip.rotation.z = support.baseHip + 0.34 * arc;
        support.knee.rotation.z = support.baseKnee - 0.18 * arc;
      }
      bodyYaw = -this.facing * 0.08 + (this.swipeSide ? -0.14 : 0.14) * arc;
      bodyRoll = (this.swipeSide ? -1 : 1) * 0.075 * arc;
      bodyPitch = -0.03 - 0.06 * arc;
      bodyY += 0.02 * arc;
      m.head.rotation.y = -this.facing * 0.18 * arc;
      m.jaw.rotation.z = -0.12 * arc;
    } else if (state === "bite") {
      const p = Math.min(1, this.stateTime / this.stateDuration);
      const open = A.smoothstep(0.12, 0.36, p) * (1 - A.smoothstep(0.7, 1, p));
      const extend = A.smoothstep(0.1, 0.36, p) * (1 - A.smoothstep(0.66, 1, p));
      bodyPitch = -0.08 - 0.1 * open;
      bodyYaw = -this.facing * 0.06 * open;
      bodyY += 0.03 * open;
      m.neck.position.x = 0.48 + 0.09 * extend;
      m.head.position.x = 0.27 + 0.06 * extend;
      m.neck.rotation.z = -0.14 - 0.1 * open;
      m.head.rotation.z = 0.1 * open;
      m.jaw.rotation.z = -0.55 * open - 0.04;
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip + 0.17 * open;
        leg.knee.rotation.z = leg.baseKnee - 0.1 * open;
      });
      this.hindLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip - 0.16 * open;
      });
      m.head.rotation.y = -this.facing * 0.12 * open;
    } else if (state === "pounce") {
      if (this.pouncePhase === "crouch") {
        const p = Math.min(1, this.stateTime / 0.2);
        bodyY -= 0.1 * p;
        bodyPitch = 0.05 * p;
        this.frontLegs.forEach((leg) => {
          leg.hip.rotation.z = leg.baseHip - 0.42 * p;
          leg.knee.rotation.z = leg.baseKnee + 0.55 * p;
        });
        this.hindLegs.forEach((leg) => {
          leg.hip.rotation.z = leg.baseHip + 0.55 * p;
          leg.knee.rotation.z = leg.baseKnee - 0.85 * p;
        });
        m.jaw.rotation.z = -0.16 * p;
      } else if (this.pouncePhase === "air") {
        bodyPitch = -0.16;
        bodyY += 0.03;
        this.frontLegs.forEach((leg) => {
          leg.hip.rotation.z = -1.15;
          leg.knee.rotation.z = 0.7;
          leg.ankle.rotation.z = -0.5;
        });
        this.hindLegs.forEach((leg) => {
          leg.hip.rotation.z = 1.1;
          leg.knee.rotation.z = -1.3;
        });
        m.jaw.rotation.z = -0.55;
        m.neck.rotation.z = -0.16;
        m.head.rotation.z = 0.08;
      } else {
        const p = Math.min(1, this.pounceLandTime / 0.43);
        const crouch = Math.sin(Math.min(1, p * 1.6) * Math.PI * 0.75);
        bodyY -= 0.1 * (1 - p) * crouch;
        bodyPitch = 0.06 * crouch;
        this.frontLegs.forEach((leg) => {
          leg.hip.rotation.z = leg.baseHip - 0.3 * crouch;
          leg.knee.rotation.z = leg.baseKnee + 0.4 * crouch;
        });
        this.hindLegs.forEach((leg) => {
          leg.hip.rotation.z = leg.baseHip + 0.4 * crouch;
          leg.knee.rotation.z = leg.baseKnee - 0.55 * crouch;
        });
      }
    } else if (state === "grab" || state === "grabHold") {
      const shiver = state === "grabHold" ? Math.sin(t * 28) * 0.018 : 0;
      bodyPitch = -0.06;
      bodyY += 0.03;
      m.jaw.rotation.z = -0.42;
      m.neck.rotation.z = -0.12;
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = -1.0;
        leg.knee.rotation.z = 0.8;
      });
      this.hindLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip + 0.2;
        leg.knee.rotation.z = leg.baseKnee - 0.2;
      });
      bodyYaw = shiver;
      m.head.rotation.y = shiver * 2;
    } else if (state === "throw") {
      const p = Math.min(1, this.stateTime / this.stateDuration);
      const swing = Math.sin(p * Math.PI);
      bodyYaw = -this.facing * 0.55 * swing;
      bodyRoll = 0.1 * swing;
      m.head.rotation.y = -this.facing * 0.4 * swing;
      m.jaw.rotation.z = -0.15 * (1 - p) - 0.04;
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip - 0.9 * (1 - p);
        leg.knee.rotation.z = leg.baseKnee + 0.7 * (1 - p);
      });
      bodyY += 0.02 * swing;
    } else if (state === "hit" || state === "hitHeavy") {
      const p = Math.min(1, this.stateTime / this.stateDuration);
      const recoil = Math.sin(p * Math.PI);
      bodyPitch = 0.05 * recoil;
      bodyRoll = -0.08 * recoil * this.facing;
      bodyYaw = 0.12 * recoil * this.facing;
      m.head.rotation.y = 0.16 * recoil;
      m.head.rotation.z = -0.08 * recoil;
      m.jaw.rotation.z = -0.16 * recoil;
      m.ears.forEach((ear) => { ear.rotation.x += (ear === m.ears[0] ? 0.2 : -0.2) * recoil; });
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip + 0.2 * recoil;
      });
    } else if (state === "down" || state === "getup") {
      const p = state === "down"
        ? Math.min(1, this.stateTime / 0.35)
        : 1 - Math.min(1, this.stateTime / this.stateDuration);
      const roll = A.smoothstep(0, 1, p);
      m.body.rotation.x = -1.22 * roll;
      bodyY = BODY_Y - 0.25 * roll;
      bodyPitch = 0.04 * roll;
      this.frontLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip - 0.2 * roll;
      });
      this.hindLegs.forEach((leg) => {
        leg.hip.rotation.z = leg.baseHip + 0.3 * roll;
      });
    } else if (state === "dead") {
      const p = Math.min(1, this.stateTime / 1.2);
      m.body.rotation.x = -1.45 * A.smoothstep(0, 1, p);
      bodyY = BODY_Y - 0.3 * p;
      bodyPitch = 0.02;
      m.jaw.rotation.z = -0.1;
      this.frontLegs.forEach((leg) => { leg.hip.rotation.z = leg.baseHip - 0.5 * p; });
      this.hindLegs.forEach((leg) => { leg.hip.rotation.z = leg.baseHip + 0.5 * p; });
      m.ears.forEach((ear) => { ear.rotation.x = 0.35 * p; });
    }

    // Apply body base.
    m.body.position.y = bodyY + bodyBob;
    m.body.rotation.z = bodyPitch;
    m.body.rotation.y = bodyYaw;
    m.body.rotation.x = state === "down" || state === "getup" || state === "dead" ? m.body.rotation.x : bodyRoll;

    // Tail secondary motion (always alive, even in idle).
    const tailAmp = state === "run" ? 0.17 : state === "walk" ? 0.1 : 0.055;
    const tailSpeed = state === "run" ? 8.5 : state === "walk" ? 5.2 : 1.65;
    for (let i = 0; i < this.tail.length; i++) {
      const seg = this.tail[i];
      const baseY = Math.sin(t * tailSpeed + i * 0.58) * tailAmp * (0.35 + i * 0.11);
      seg.rotation.y = baseY + (state === "pounce" && this.pouncePhase === "air" ? 0.04 : 0);
      const baseZ = i === 0 ? 0.25 : i === 1 ? 0.16 : i === 2 ? 0.08 : i === 3 ? -0.02 : i === 4 ? -0.12 : -0.17;
      seg.rotation.z = baseZ + Math.sin(t * 1.1 + i * 0.35) * 0.018;
      if (state === "hit" || state === "hitHeavy" || state === "down") {
        seg.rotation.z += 0.12 * (i / this.tail.length);
      }
      if (state === "pounce" && this.pouncePhase === "air") {
        seg.rotation.z = baseZ * 0.18 + Math.sin(t * 4 + i * 0.4) * 0.03;
      }
    }

    // Ear idle flick.
    this.earTimer -= dt;
    if (this.earTimer <= 0) {
      this.earTimer = 4.0 + Math.random() * 4.5;
      this.earFlick = 0.25;
    }
    if (this.earFlick > 0) this.earFlick -= dt;
    const flick = this.earFlick > 0 ? Math.sin((0.25 - this.earFlick) * 45) * 0.18 : 0;
    m.ears[0].rotation.z = 0.13 + flick;
    m.ears[1].rotation.z = -0.13 - flick;

    // Invulnerability blink and damage flash.
    if (this.flash > 0) {
      this.materials.fur.emissive.setHex(0x5a1717);
      this.materials.fur.emissiveIntensity = 1.2;
      this.materials.furHi.emissive.setHex(0x4a1111);
      this.materials.furHi.emissiveIntensity = 0.9;
    } else {
      this.materials.fur.emissive.setHex(0x000000);
      this.materials.fur.emissiveIntensity = 0;
      this.materials.furHi.emissive.setHex(0x000000);
      this.materials.furHi.emissiveIntensity = 0;
    }
    if (this.invuln > 0 && this.state !== "dead") {
      this.root.visible = Math.floor(this.animTime * 18) % 2 === 0;
    } else {
      this.root.visible = true;
    }
  };

  Panther.prototype.statusText = function () {
    if (this.state === "pounce") return "POUNCE";
    if (this.state === "grab" || this.state === "grabHold") return "GRAB";
    if (this.state === "throw") return "THROW";
    return this.stateLabel.toUpperCase();
  };

  NF.Panther = Panther;
})();
