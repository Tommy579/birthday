import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildCake, TOP } from "./buildCake.js";
import { CAKE_TOP, FRAMES, FRAMES_WIDE, WIDE_MIN } from "../content.js";

const FOV = 30;

/* ──────────────────────────────────────────────────────────
   Une seule scène, montée pour tout le site.
   La caméra change de cadrage à chaque page (fondu doux),
   le gâteau tourne, et les 18 bougies s'éteignent au souffle.
   ────────────────────────────────────────────────────────── */
export default function CakeScene({ frame = "hero", interactive = false, blown = false, onInteract }) {
  const hostRef = useRef(null);
  const frameRef = useRef(frame);
  const interactiveRef = useRef(interactive);
  const blownRef = useRef(blown);
  const onInteractRef = useRef(onInteract);
  const [failed, setFailed] = useState(false);

  frameRef.current = frame;
  interactiveRef.current = interactive;
  blownRef.current = blown;
  onInteractRef.current = onInteract;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer;
    let scene;
    let camera;
    let cake;
    let flames;
    let glows;
    let smokes;
    let lights;
    let heart;
    let heartGlow;
    let sparks;
    let sparkMat;
    let raf = 0;
    let disposed = false;
    let blownAt = 0;
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
    renderer.toneMappingExposure = 1;
    renderer.domElement.className = "cake-canvas";
    host.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.05);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xffffff, 0xf2ccd8, 0.82);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfffaf6, 1.5);
    key.position.set(4.5, 7, 5.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xea84a7, 1.15);
    rim.position.set(-5, 3.5, -4.5);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffe5ee, 4, 14, 2);
    fill.position.set(-2.4, 1.4, 4.2);
    scene.add(fill);

    const built = buildCake();
    cake = built.group;
    flames = built.flames;
    glows = built.glows;
    smokes = built.smokes;
    lights = built.lights;
    heart = built.heart;
    heartGlow = built.heartGlow;
    sparks = built.sparks;
    sparkMat = built.sparkMat;
    scene.add(cake);
    scene.add(sparks);

    /* ── rig caméra ─────────────────────────────────────── */
    const rigTarget = new THREE.Vector3(0, 1.2, 0);
    const rigCam = new THREE.Vector3(0, 2.6, 11);
    const goal = new THREE.Vector3();
    const goalCam = new THREE.Vector3();
    let w = 1;
    let h = 1;
    let first = true;

    const vFov = (FOV * Math.PI) / 180;
    const vTan = Math.tan(vFov / 2);

    /* Un grand écran en paysage bascule en deux colonnes :
       cadrage large, gâteau décalé vers la droite. */
    function currentFrame() {
      const wide = w >= WIDE_MIN && w > h;
      const set = wide ? FRAMES_WIDE : FRAMES;
      const f = set[frameRef.current] || set.hero;
      return { f, wide };
    }

    function resize() {
      w = host.clientWidth || 1;
      h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      first = true;
    }

    function updateCamera(dt) {
      const { f } = currentFrame();
      const size = f.size;
      const dist = CAKE_TOP / (2 * size * vTan);
      const viewH = CAKE_TOP / size;
      const viewW = viewH * (w / h);
      const targetY = CAKE_TOP + (f.top - 0.5) * viewH;
      const targetX = -(f.x || 0) * viewW;
      goal.set(targetX, targetY, 0);
      goalCam.set(
        targetX,
        targetY + Math.sin(f.pitch) * dist,
        Math.cos(f.pitch) * dist
      );
      const k = first ? 1 : 1 - Math.exp(-dt * 4.2);
      rigTarget.lerp(goal, k);
      rigCam.lerp(goalCam, k);
      camera.position.copy(rigCam);
      camera.lookAt(rigTarget);
      first = false;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* ── interaction (doigt ou souris) ──────────────────── */
    const el = renderer.domElement;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let velY = 0;
    let velX = 0;

    const onDown = (e) => {
      if (!interactiveRef.current || !e.isPrimary) return;
      dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = 0;
      velX = 0;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      host.classList.add("is-grabbing");
      onInteractRef.current?.();
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
      host.classList.remove("is-grabbing");
      if (el.hasPointerCapture?.(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const stopDrag = () => {
      dragging = false;
      pointerId = null;
      host.classList.remove("is-grabbing");
    };

    const onContext = (e) => e.preventDefault();
    const onDragStart = (e) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("lostpointercapture", onUp);
    el.addEventListener("pointerleave", stopDrag);
    el.addEventListener("contextmenu", onContext);
    el.addEventListener("dragstart", onDragStart);
    window.addEventListener("blur", stopDrag);

    /* ── souffle : flammes éteintes, fumée, lumière basse ── */
    function resetBlow() {
      flames.forEach((f) => {
        f.visible = true;
        f.scale.set(1.05, 2.9, 1.05);
      });
      glows.forEach((g) => {
        g.material.opacity = 0.36;
      });
      smokes.forEach((s) => {
        s.material.opacity = 0;
        s.position.set(s.baseX, s.baseY, s.baseZ);
      });
      lights.forEach((l) => {
        l.light.intensity = l.base;
      });
    }

    /* ── boucle ─────────────────────────────────────────── */
    function animate() {
      raf = requestAnimationFrame(animate);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();
      const { f } = currentFrame();
      const spin = reduce ? 0 : f.spin;

      updateCamera(dt);

      if (!dragging) {
        velY *= 0.935;
        velX *= 0.9;
        cake.rotation.y += velY + spin * dt;
        cake.rotation.x += (0 - cake.rotation.x) * Math.min(1, dt * 2.2);
      }
      cake.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.015;

      if (blownRef.current) {
        if (!blownAt) blownAt = t;
        const p = Math.max(0, t - blownAt);
        const k = Math.min(1, p / 0.45);
        flames.forEach((fl) => {
          fl.visible = k < 1;
          fl.scale.set(1.05 * (1 - k), 2.9 * (1 - k), 1.05 * (1 - k));
        });
        glows.forEach((g) => {
          g.material.opacity = 0.36 * (1 - k);
        });
        smokes.forEach((s, i) => {
          s.position.y = s.baseY + p * 0.25 + Math.sin(p * 0.9 + i) * 0.05;
          s.position.x = s.baseX + Math.sin(p * 0.7 + i * 1.7) * 0.06;
          s.material.opacity =
            0.38 * Math.min(1, p / 0.6) * Math.max(0, 1 - Math.max(0, p - 1.4) / 2.4);
        });
        lights.forEach((l) => {
          l.light.intensity = l.base * Math.max(0, 1 - k);
        });
      } else {
        if (blownAt) {
          blownAt = 0;
          resetBlow();
        }
        if (!reduce) {
          flames.forEach((fl, i) => {
            const s = 0.94 + 0.12 * Math.sin(t * 11 + i * 2.1) + 0.06 * Math.sin(t * 23 + i);
            fl.scale.set(1.05, 2.9 * s, 1.05);
          });
          lights.forEach((l) => {
            l.light.intensity =
              l.base *
              (0.86 + 0.14 * Math.sin(t * 8.5 + l.seed) + 0.05 * Math.sin(t * 19 + l.seed * 3));
          });
          heart.position.y = TOP + 0.78 + Math.sin(t * 0.9) * 0.03;
          heartGlow.position.y = heart.position.y;
          heartGlow.material.opacity = 0.28 + 0.08 * Math.sin(t * 1.6);
          sparks.rotation.y = t * 0.07;
          sparkMat.opacity = 0.36 + 0.14 * Math.sin(t * 1.25);
        }
      }

      renderer.toneMappingExposure = THREE.MathUtils.lerp(
        renderer.toneMappingExposure,
        f.expo,
        1 - Math.exp(-dt * 4.2)
      );
      renderer.render(scene, camera);
    }

    function start() {
      if (raf) return;
      timer.update();
      timer.getDelta();
      animate();
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
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
      el.removeEventListener("contextmenu", onContext);
      el.removeEventListener("dragstart", onDragStart);
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

  return (
    <div className="cake-stage" ref={hostRef} aria-label="Gâteau d'anniversaire en 3D, à faire tourner">
      {failed && (
        <div className="cake-fallback" role="img" aria-label="Gâteau d'anniversaire">
          <svg viewBox="0 0 64 64" width="108" height="108" aria-hidden="true">
            <rect x="12" y="34" width="40" height="16" rx="4" fill="#f5c2d1" stroke="#b84b70" strokeWidth="2" />
            <rect x="18" y="22" width="28" height="12" rx="3" fill="#fff9f7" stroke="#b84b70" strokeWidth="2" />
            <path d="M26 22v-7M32 22v-7M38 22v-7" stroke="#b84b70" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="12" r="2" fill="#c9185b" />
            <circle cx="32" cy="12" r="2" fill="#c9185b" />
            <circle cx="38" cy="12" r="2" fill="#c9185b" />
          </svg>
        </div>
      )}
    </div>
  );
}
