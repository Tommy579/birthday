import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ---------- palette (alignée sur le CSS) ---------- */
const C = {
  cream: 0xf0d3b3,
  creamRose: 0xf8dcdf,
  icing: 0xfff6ea,
  biscuit: 0xd8a67d,
  berry: 0x8e3b52,
  rose: 0xe7a2b4,
  plum: 0x2a1119,
  gold: 0xf2c260,
  flame: 0xffd98a,
};

/* ---------- utils ---------- */
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
  geo.rotateZ(Math.PI); // la forme three.js d'origine est un cœur tête en bas
  geo.scale(0.027, 0.027, 0.027);
  return geo;
}

/* ---------- géométrie du gâteau ---------- */
const TIERS = [
  { r: 1.4, h: 0.9, y: 0.54, icing: 0.34, drips: 20, seed: 11 },
  { r: 0.9, h: 0.62, y: 1.3, icing: 0.22, drips: 15, seed: 29 },
];
const TOP = 1.61;

function buildCake() {
  const group = new THREE.Group();
  group.rotation.order = "YXZ";

  const matCream = new THREE.MeshStandardMaterial({
    color: C.cream,
    roughness: 0.72,
    envMapIntensity: 0.3,
  });
  const matCreamRose = new THREE.MeshStandardMaterial({
    color: C.creamRose,
    roughness: 0.7,
    envMapIntensity: 0.3,
  });
  const matSponge = new THREE.MeshStandardMaterial({
    color: C.biscuit,
    roughness: 0.92,
    envMapIntensity: 0.15,
  });
  const matJam = new THREE.MeshStandardMaterial({
    color: C.berry,
    roughness: 0.35,
    envMapIntensity: 0.5,
  });
  const matIcing = new THREE.MeshStandardMaterial({
    color: C.icing,
    roughness: 0.4,
    envMapIntensity: 0.5,
  });
  const matBiscuit = new THREE.MeshStandardMaterial({
    color: C.biscuit,
    roughness: 0.8,
    envMapIntensity: 0.2,
  });
  const matRose = new THREE.MeshStandardMaterial({
    color: C.rose,
    roughness: 0.45,
    envMapIntensity: 0.4,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xe8b95f,
    metalness: 0.92,
    roughness: 0.3,
    envMapIntensity: 1.1,
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: C.plum,
    roughness: 0.32,
    metalness: 0.35,
    envMapIntensity: 0.7,
  });

  const SPRINKLE_COLORS = [C.icing, C.rose, 0xc97c92, 0xffd9b0];

  /* plateau */
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.78, 1.64, 0.1, 96),
    matPlate
  );
  plate.position.y = 0.05;
  group.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.022, 10, 96), matGold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.1;
  group.add(rim);

  /* étages */
  const sprinkles = [];
  const drips = [];
  const rosettes = [];

  TIERS.forEach((tier, ti) => {
    const rand = rng(tier.seed);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r, tier.r, tier.h, 96, 1, false),
      ti === 1 ? matCreamRose : matCream
    );
    body.position.y = tier.y;
    group.add(body);

    /* tranche apparente : biscuit + filet de confiture (naked layer cake) */
    const spongeH = tier.h * 0.3;
    const spongeY = tier.y - tier.h * 0.24;
    const sponge = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.005, tier.r + 0.005, spongeH, 96, 1, true),
      matSponge
    );
    sponge.position.y = spongeY;
    group.add(sponge);

    const jam = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.008, tier.r + 0.008, 0.013, 96, 1, true),
      matJam
    );
    jam.position.y = spongeY + 0.012;
    group.add(jam);

    /* glaçage : collerette + coulures */
    const icingTop = tier.y + tier.h / 2;
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.r + 0.022, tier.r + 0.03, tier.icing, 96, 1, false),
      matIcing
    );
    collar.position.y = icingTop - tier.icing / 2;
    group.add(collar);

    const collarTop = new THREE.Mesh(
      new THREE.CircleGeometry(tier.r + 0.02, 96),
      matIcing
    );
    collarTop.rotation.x = -Math.PI / 2;
    collarTop.position.y = icingTop + 0.001;
    group.add(collarTop);

    const dripEdge = icingTop - tier.icing + 0.01;
    for (let i = 0; i < tier.drips * 2; i++) {
      const a = (i / (tier.drips * 2)) * Math.PI * 2 + rand() * 0.14;
      const len = 0.04 + Math.pow(rand(), 2.2) * 0.2;
      drips.push({
        p: [Math.cos(a) * (tier.r + 0.032), dripEdge - len / 2, Math.sin(a) * (tier.r + 0.032)],
        s: [1, len / 0.152, 1],
      });
    }

    /* petite perle de glaçage sur le bord supérieur */
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2;
      rosettes.push({
        p: [Math.cos(a) * (tier.r + 0.004), icingTop - 0.012, Math.sin(a) * (tier.r + 0.004)],
        s: [1, 1, 1],
      });
    }

    /* vermicelles sur la surface supérieure */
    const inner = ti === 0 ? tier.r * 0.72 : 0.18;
    const outer = tier.r - 0.08;
    for (let i = 0; i < (ti === 0 ? 90 : 55); i++) {
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

  /* rosace centrale sur l'étage du haut */
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    rosettes.push({
      p: [Math.cos(a) * 0.62, TOP + 0.03, Math.sin(a) * 0.62],
      s: [1.9, 1.4, 1.9],
    });
  }

  const dripGeo = new THREE.CapsuleGeometry(0.027, 0.1, 4, 12);
  group.add(instanced(dripGeo, matIcing, drips));

  const rosetteGeo = new THREE.SphereGeometry(0.04, 12, 10);
  group.add(instanced(rosetteGeo, matIcing, rosettes));

  const sprinkleGeo = new THREE.CapsuleGeometry(0.014, 0.05, 3, 6);
  const sprinkleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    envMapIntensity: 0.4,
  });
  group.add(instanced(sprinkleGeo, sprinkleMat, sprinkles));

  /* bougies */
  const candleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.44, 16);
  const wickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6);
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x2b1a14, roughness: 1 });
  const flameGeo = new THREE.SphereGeometry(0.045, 14, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffb347,
    transparent: true,
    opacity: 0.95,
  });
  const glowTex = radialTexture(
    "rgba(255,236,190,0.95)",
    "rgba(255,170,80,0.42)",
    "rgba(255,120,40,0)"
  );
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffc070,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  });

  const flames = [];
  const lights = [];
  const CANDLES = 5;
  for (let i = 0; i < CANDLES; i++) {
    const a = (i / CANDLES) * Math.PI * 2 + Math.PI / 5;
    const rad = 0.44;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;

    const candle = new THREE.Mesh(candleGeo, matRose);
    candle.position.set(x, TOP + 0.22, z);
    candle.rotation.y = a;
    group.add(candle);

    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(x, TOP + 0.47, z);
    group.add(wick);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, TOP + 0.54, z);
    flame.scale.set(0.9, 2.4, 0.9);
    group.add(flame);
    flames.push(flame);

    const glow = new THREE.Sprite(glowMat.clone());
    glow.position.set(x, TOP + 0.56, z);
    glow.scale.setScalar(0.62);
    group.add(glow);

    if (i % 2 === 0) {
      const light = new THREE.PointLight(0xffa860, 1.5, 3.4, 2);
      light.position.set(x * 0.8, TOP + 0.62, z * 0.8);
      group.add(light);
      lights.push({ light, base: 1.5, seed: i });
    }
  }

  /* coeur doré sur pic */
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8),
    matGold
  );
  stick.position.y = TOP + 0.23;
  group.add(stick);

  const heart = new THREE.Mesh(heartGeometry(), matGold);
  heart.position.y = TOP + 0.78;
  group.add(heart);
  const heartGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffc979,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
    })
  );
  heartGlow.position.y = TOP + 0.78;
  heartGlow.scale.setScalar(1.35);
  group.add(heartGlow);

  /* poussière d'or */
  const sparkCount = 150;
  const randS = rng(77);
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = randS() * Math.PI * 2;
    const rad = 1.5 + randS() * 1.5;
    sparkPos[i * 3] = Math.cos(a) * rad;
    sparkPos[i * 3 + 1] = randS() * 3.1;
    sparkPos[i * 3 + 2] = Math.sin(a) * rad;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.075,
    map: glowTex,
    color: 0xffd8a0,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.position.y = 0.1;

  /* ombre de contact */
  const shadowTex = radialTexture(
    "rgba(0,0,0,0.55)",
    "rgba(0,0,0,0.28)",
    "rgba(0,0,0,0)"
  );
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return { group, flames, lights, heart, heartGlow, sparks, sparkMat };
}

/* ---------- composant ---------- */
export default function CakeScene({ active = true }) {
  const hostRef = useRef(null);
  const activeRef = useRef(active);
  const apiRef = useRef(null);
  const [failed, setFailed] = useState(false);

  activeRef.current = active;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer, scene, camera, cake, flames, lights, heart, heartGlow, sparks, sparkMat;
    let frame = 0;
    let disposed = false;
    const timer = new THREE.Timer();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    if (!renderer.getContext()) {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.domElement.className = "cake-canvas";
    host.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.05);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xffdbc4, 0x1a0b12, 0.75);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2e4, 2.2);
    key.position.set(4.5, 7, 5.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5c8a, 2.0);
    rim.position.set(-5, 3.5, -4.5);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffbb92, 12, 14, 2);
    fill.position.set(-2.4, 1.4, 4.2);
    scene.add(fill);

    const built = buildCake();
    cake = built.group;
    flames = built.flames;
    lights = built.lights;
    heart = built.heart;
    heartGlow = built.heartGlow;
    sparks = built.sparks;
    sparkMat = built.sparkMat;
    scene.add(cake);
    scene.add(sparks);

    const target = new THREE.Vector3(0, 1.18, 0);
    const RY = 1.66;
    const RX = 1.82;

    function resize() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const dV = RY / Math.tan(vFov / 2);
      const dH = RX / Math.tan(hFov / 2);
      const dist = Math.max(dV, dH) * 1.02;
      const angle = 0.3; // léger surplomb
      camera.position.set(0, target.y + Math.sin(angle) * dist, Math.cos(angle) * dist);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---------- interaction ---------- */
    const el = renderer.domElement;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let velY = 0;
    let velX = 0;
    let idle = 0;

    const AUTO = reduce ? 0 : 0.16;

    const onDown = (e) => {
      if (!e.isPrimary) return;
      dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = 0;
      velX = 0;
      idle = 0;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      host.classList.add("is-grabbing");
    };

    const onMove = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.0092;
      velX = dy * 0.0035;
      cake.rotation.y += velY;
      cake.rotation.x = THREE.MathUtils.clamp(cake.rotation.x + velX, -0.22, 0.3);
    };

    const onUp = (e) => {
      if (e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      idle = 0;
      host.classList.remove("is-grabbing");
      if (el.hasPointerCapture?.(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("lostpointercapture", onUp);
    const stopDrag = () => {
      dragging = false;
      pointerId = null;
      host.classList.remove("is-grabbing");
    };
    el.addEventListener("pointerleave", stopDrag);
    window.addEventListener("blur", stopDrag);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("dragstart", (e) => e.preventDefault());

    /* expose un état minimal pour les tests / le debug */
    apiRef.current = {
      rotY: () => cake.rotation.y,
      rotX: () => cake.rotation.x,
      triangles: () => renderer.info.render.triangles,
      calls: () => renderer.info.render.calls,
      start: () => start(),
      stop: () => stop(),
    };
    window.__cake = apiRef.current;

    let running = false;

    function animate() {
      frame = requestAnimationFrame(animate);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();

      if (!dragging) {
        idle += dt;
        velY *= 0.935;
        velX *= 0.9;
        cake.rotation.y += velY + AUTO * dt;
        cake.rotation.x += (0 - cake.rotation.x) * Math.min(1, dt * 2.2);
      }
      cake.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.015;
      if (!reduce) {
        cake.rotation.z = Math.sin(t * 0.55) * 0.004;
        flames.forEach((f, i) => {
          const s = 0.94 + 0.12 * Math.sin(t * 11 + i * 2.1) + 0.06 * Math.sin(t * 23 + i);
          f.scale.set(0.92, 1.9 * s, 0.92);
        });
        lights.forEach(({ light, base, seed }) => {
          light.intensity = base * (0.86 + 0.14 * Math.sin(t * 8.5 + seed) + 0.05 * Math.sin(t * 19 + seed * 3));
        });
        heart.position.y = TOP + 0.78 + Math.sin(t * 0.9) * 0.03;
        heartGlow.position.y = heart.position.y;
        heartGlow.material.opacity = 0.42 + 0.1 * Math.sin(t * 1.6);
        sparks.rotation.y = t * 0.07;
        sparkMat.opacity = 0.55 + 0.22 * Math.sin(t * 1.25);
      }

      renderer.render(scene, camera);
    }

    function start() {
      if (running) return;
      running = true;
      timer.update();
      timer.getDelta();
      animate();
    }
    function stop() {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(host);
    start();

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", stopDrag);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("lostpointercapture", onUp);
      el.removeEventListener("pointerleave", stopDrag);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      envRT.dispose();
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.classList.toggle("is-paused", !active);
    const api = apiRef.current;
    if (!api) return;
    if (active) api.start();
    else api.stop();
  }, [active]);

  return (
    <div className="cake-stage" ref={hostRef} aria-label="Gâteau d'anniversaire en 3D, à faire tourner">
      {failed && (
        <div className="cake-fallback" role="img" aria-label="Gâteau">
          🎂
        </div>
      )}
    </div>
  );
}
