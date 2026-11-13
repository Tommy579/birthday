import * as THREE from "three";

/* ── palette 3D (alignée sur les tokens CSS blanc & rose) ── */
const C = {
  creamWhite: 0xfff3ec,
  creamRose: 0xeba0b8,
  icingWhite: 0xfffaf7,
  icingRose: 0xf4b6c9,
  biscuit: 0xdfaf88,
  berry: 0xc9185b,
  candle: 0xdd5885,
  plate: 0xfbeaf0,
  roseGold: 0xc96b89,
  heart: 0xc9185b,
};

/* ── utils ────────────────────────────────────────────────── */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function instanced(geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    p.set(it.p[0], it.p[1], it.p[2]);
    e.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
    q.setFromEuler(e);
    s.set(it.s?.[0] ?? 1, it.s?.[1] ?? 1, it.s?.[2] ?? 1);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    if (it.c !== undefined) mesh.setColorAt(i, col.set(it.c));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function radialTexture(inner, mid, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, mid);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 3.0,
    bevelEnabled: true,
    bevelThickness: 0.45,
    bevelSize: 0.32,
    bevelSegments: 6,
    curveSegments: 18,
  });
  geo.center();
  geo.rotateZ(Math.PI);
  geo.scale(0.027, 0.027, 0.027);
  return geo;
}

/* ── géométrie du gâteau ──────────────────────────────────── */
const TIERS = [
  { r: 1.4, h: 0.9, y: 0.54, icing: 0.34, drips: 20, seed: 11 },
  { r: 0.9, h: 0.62, y: 1.3, icing: 0.22, drips: 15, seed: 29 },
];
export const TOP = 1.61;

/* 18 bougies : 12 sur le rebord de l'étage bas, 6 sur l'étage haut. */
const CANDLES = [
  ...Array.from({ length: 12 }, (_, i) => ({
    a: (i / 12) * Math.PI * 2 + 0.12,
    r: 1.12,
    y: 0.99 + 0.22,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    a: (i / 6) * Math.PI * 2 + Math.PI / 6,
    r: 0.35,
    y: TOP + 0.22,
  })),
];

export function buildCake() {
  const group = new THREE.Group();
  group.rotation.order = "YXZ";

  const matCreamWhite = new THREE.MeshStandardMaterial({
    color: C.creamWhite,
    roughness: 0.68,
    envMapIntensity: 0.35,
  });
  const matCreamRose = new THREE.MeshStandardMaterial({
    color: C.creamRose,
    roughness: 0.66,
    envMapIntensity: 0.35,
  });
  const matSponge = new THREE.MeshStandardMaterial({
    color: C.biscuit,
    roughness: 0.9,
    envMapIntensity: 0.15,
  });
  const matJam = new THREE.MeshStandardMaterial({
    color: C.berry,
    roughness: 0.32,
    envMapIntensity: 0.45,
  });
  const matIcingWhite = new THREE.MeshStandardMaterial({
    color: C.icingWhite,
    roughness: 0.36,
    envMapIntensity: 0.45,
  });
  const matIcingRose = new THREE.MeshStandardMaterial({
    color: C.icingRose,
    roughness: 0.38,
    envMapIntensity: 0.45,
  });
  const matCandle = new THREE.MeshStandardMaterial({
    color: C.candle,
    roughness: 0.42,
    envMapIntensity: 0.38,
  });
  const matRoseGold = new THREE.MeshStandardMaterial({
    color: C.roseGold,
    metalness: 0.78,
    roughness: 0.26,
    envMapIntensity: 0.95,
  });
  const matHeart = new THREE.MeshStandardMaterial({
    color: C.heart,
    metalness: 0.42,
    roughness: 0.24,
    envMapIntensity: 0.85,
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: C.plate,
    roughness: 0.24,
    metalness: 0.08,
    envMapIntensity: 0.55,
  });

  const SPRINKLE_COLORS = [C.icingWhite, C.candle, C.berry, C.creamRose];

  /* plateau porcelaine + liseré rose doré */
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.78, 1.64, 0.1, 96),
    matPlate
  );
  plate.position.y = 0.05;
  group.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.022, 10, 96), matRoseGold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.1;
  group.add(rim);

  /* étages : alternance rose poudré / chantilly blanche */
  const sprinkles = [];
  const dripsWhite = [];
  const dripsRose = [];
  const rosettesWhite = [];
  const rosettesRose = [];

  TIERS.forEach((tier, ti) => {
    const rand = rng(tier.seed);
    const isBottom = ti === 0;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r, tier.r, tier.h, 96, 1, false),
      isBottom ? matCreamRose : matCreamWhite
    );
    body.position.y = tier.y;
    group.add(body);

    /* tranche apparente : biscuit + filet framboise */
    const spongeH = tier.h * 0.3;
    const spongeY = tier.y - tier.h * 0.24;
    const sponge = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.005, tier.r + 0.005, spongeH, 96, 1, true),
      matSponge
    );
    sponge.position.y = spongeY;
    group.add(sponge);

    const jam = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.008, tier.r + 0.008, 0.015, 96, 1, true),
      matJam
    );
    jam.position.y = spongeY + 0.012;
    group.add(jam);

    /* glaçage contrasté : blanc sur l'étage rose, rose sur l'étage blanc */
    const icingMat = isBottom ? matIcingWhite : matIcingRose;
    const dripList = isBottom ? dripsWhite : dripsRose;
    const rosetteList = isBottom ? rosettesWhite : rosettesRose;

    const icingTop = tier.y + tier.h / 2;
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.022, tier.r + 0.03, tier.icing, 96, 1, false),
      icingMat
    );
    collar.position.y = icingTop - tier.icing / 2;
    group.add(collar);

    const collarTop = new THREE.Mesh(new THREE.CircleGeometry(tier.r + 0.02, 96), icingMat);
    collarTop.rotation.x = -Math.PI / 2;
    collarTop.position.y = icingTop + 0.001;
    group.add(collarTop);

    const dripEdge = icingTop - tier.icing + 0.01;
    for (let i = 0; i < tier.drips * 2; i++) {
      const a = (i / (tier.drips * 2)) * Math.PI * 2 + rand() * 0.14;
      const len = 0.04 + Math.pow(rand(), 2.2) * 0.2;
      dripList.push({
        p: [Math.cos(a) * (tier.r + 0.032), dripEdge - len / 2, Math.sin(a) * (tier.r + 0.032)],
        s: [1, len / 0.152, 1],
      });
    }

    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2;
      rosetteList.push({
        p: [Math.cos(a) * (tier.r + 0.004), icingTop - 0.012, Math.sin(a) * (tier.r + 0.004)],
        s: [1, 1, 1],
      });
    }

    const inner = isBottom ? tier.r * 0.72 : 0.42;
    const outer = tier.r - 0.08;
    for (let i = 0; i < (isBottom ? 90 : 40); i++) {
      const a = rand() * Math.PI * 2;
      const rad = inner + Math.sqrt(rand()) * (outer - inner);
      sprinkles.push({
        p: [Math.cos(a) * rad, icingTop + 0.012, Math.sin(a) * rad],
        r: [Math.PI / 2, 0, rand() * Math.PI * 2],
        s: [1, 1, 1],
        c: SPRINKLE_COLORS[Math.floor(rand() * SPRINKLE_COLORS.length)],
      });
    }
  });

  const dripGeo = new THREE.CapsuleGeometry(0.027, 0.1, 4, 12);
  group.add(instanced(dripGeo, matIcingWhite, dripsWhite));
  group.add(instanced(dripGeo, matIcingRose, dripsRose));

  const rosetteGeo = new THREE.SphereGeometry(0.04, 12, 10);
  group.add(instanced(rosetteGeo, matIcingWhite, rosettesWhite));
  group.add(instanced(rosetteGeo, matIcingRose, rosettesRose));

  const sprinkleGeo = new THREE.CapsuleGeometry(0.014, 0.05, 3, 6);
  const sprinkleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    envMapIntensity: 0.35,
  });
  group.add(instanced(sprinkleGeo, sprinkleMat, sprinkles));

  /* ── 18 bougies ─────────────────────────────────────────── */
  const candleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.44, 16);
  const wickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6);
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x2b1a14, roughness: 1 });
  const flameGeo = new THREE.SphereGeometry(0.044, 14, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff9d2e,
    transparent: true,
    opacity: 0.96,
  });

  const glowTex = radialTexture(
    "rgba(255, 224, 148, 0.55)",
    "rgba(255, 168, 92, 0.16)",
    "rgba(255, 140, 80, 0)"
  );
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffc680,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    opacity: 0.36,
  });

  const smokeTex = radialTexture(
    "rgba(110, 84, 96, 0.46)",
    "rgba(110, 84, 96, 0.18)",
    "rgba(110, 84, 96, 0)"
  );
  const smokeMat = new THREE.SpriteMaterial({
    map: smokeTex,
    color: 0x806a73,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });

  const flames = [];
  const glows = [];
  const smokes = [];
  const lights = [];

  CANDLES.forEach((c, i) => {
    const x = Math.cos(c.a) * c.r;
    const z = Math.sin(c.a) * c.r;

    const candle = new THREE.Mesh(candleGeo, matCandle);
    candle.position.set(x, c.y, z);
    candle.rotation.y = c.a;
    group.add(candle);

    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(x, c.y + 0.25, z);
    group.add(wick);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, c.y + 0.3, z);
    flame.scale.set(1.05, 2.9, 1.05);
    group.add(flame);
    flames.push(flame);

    const glow = new THREE.Sprite(glowMat.clone());
    glow.position.set(x, c.y + 0.31, z);
    glow.scale.setScalar(0.38);
    group.add(glow);
    glows.push(glow);

    const smoke = new THREE.Sprite(smokeMat.clone());
    smoke.position.set(x, c.y + 0.31, z);
    smoke.scale.setScalar(0.24);
    smoke.baseX = x;
    smoke.baseY = c.y + 0.31;
    smoke.baseZ = z;
    group.add(smoke);
    smokes.push(smoke);

    if (i % 3 === 0) {
      const light = new THREE.PointLight(0xffb470, 0.85, 2.8, 2);
      light.position.set(x * 0.8, c.y + 0.38, z * 0.8);
      group.add(light);
      lights.push({ light, base: 0.85, seed: i });
    }
  });

  /* cœur rose sur tige rose dorée */
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8), matRoseGold);
  stick.position.y = TOP + 0.23;
  group.add(stick);

  const heart = new THREE.Mesh(heartGeometry(), matHeart);
  heart.position.y = TOP + 0.78;
  group.add(heart);

  const heartGlowTex = radialTexture(
    "rgba(233, 130, 165, 0.38)",
    "rgba(233, 130, 165, 0.12)",
    "rgba(233, 130, 165, 0)"
  );
  const heartGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: heartGlowTex,
      color: 0xe684a6,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0.35,
    })
  );
  heartGlow.position.y = TOP + 0.78;
  heartGlow.scale.setScalar(1.25);
  group.add(heartGlow);

  /* poussière rose légère */
  const sparkCount = 120;
  const randS = rng(77);
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = randS() * Math.PI * 2;
    const rad = 1.55 + randS() * 1.45;
    sparkPos[i * 3] = Math.cos(a) * rad;
    sparkPos[i * 3 + 1] = randS() * 3.1;
    sparkPos[i * 3 + 2] = Math.sin(a) * rad;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkTex = radialTexture(
    "rgba(201, 24, 91, 0.75)",
    "rgba(201, 24, 91, 0.28)",
    "rgba(201, 24, 91, 0)"
  );
  const sparkMat = new THREE.PointsMaterial({
    size: 0.06,
    map: sparkTex,
    color: 0xd95f89,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.position.y = 0.1;
  group.add(sparks);

  /* ombre douce sur le studio blanc */
  const shadowTex = radialTexture(
    "rgba(54, 18, 32, 0.28)",
    "rgba(54, 18, 32, 0.11)",
    "rgba(54, 18, 32, 0)"
  );
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return { group, flames, glows, smokes, lights, heart, heartGlow, sparks, sparkMat };
}
