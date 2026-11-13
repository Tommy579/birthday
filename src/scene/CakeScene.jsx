import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { animate, motionValue } from "motion";
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
    const goal = new THREE.Vector3();
    let rigDist = 11;
    let rigPitch = 0.28;
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

    /* ── rotation physique (Motion inertia + spring) ─────── */
    const rotY = motionValue(0);
    const pitchOffset = motionValue(0);
    let idleSpinAngle = 0;
    let spinRate = 0;

    function updateCamera(dt) {
      const { f } = currentFrame();
      const size = f.size;
      const dist = CAKE_TOP / (2 * size * vTan);
      const viewH = CAKE_TOP / size;
      const viewW = viewH * (w / h);
      const targetY = CAKE_TOP + (f.top - 0.5) * viewH;
      const targetX = -(f.x || 0) * viewW;
      goal.set(targetX, targetY, 0);

      const k = first ? 1 : 1 - Math.exp(-dt * 4.2);
      rigTarget.lerp(goal, k);
      rigDist += (dist - rigDist) * k;
      rigPitch += (f.pitch - rigPitch) * k;

      const pitch = THREE.MathUtils.clamp(rigPitch + pitchOffset.get(), 0.06, 0.72);
      camera.position.set(
        rigTarget.x,
        rigTarget.y + Math.sin(pitch) * rigDist,
        rigTarget.z + Math.cos(pitch) * rigDist
      );
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
    let lastMoveTime = 0;
    let velY = 0;

    const releasePhysics = () => {
      const stale = performance.now() - lastMoveTime > 85;
      const releaseVelY = stale ? 0 : THREE.MathUtils.clamp(velY, -12, 12);
      velY = 0;

      if (!reduce && Math.abs(releaseVelY) > 0.12) {
        animate(rotY, rotY.get(), {
          type: "inertia",
          velocity: releaseVelY,
          power: 0.46,
          timeConstant: 420,
          restDelta: 0.0005,
          restSpeed: 0.005,
        });
      }

      if (reduce) {
        pitchOffset.set(0);
      } else {
        animate(pitchOffset, 0, {
          type: "spring",
          stiffness: 170,
          damping: 24,
          mass: 0.85,
          restDelta: 0.0005,
          restSpeed: 0.005,
        });
      }
    };

    const onDown = (e) => {
      if (!interactiveRef.current || !e.isPrimary) return;
      dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = performance.now();
      velY = 0;
      rotY.stop();
      pitchOffset.stop();
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
      const now = performance.now();
      const dtMs = Math.max(4, now - lastMoveTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = now;

      const sensY = (Math.PI * 1.45) / Math.max(320, Math.min(w, 720));
      const deltaY = dx * sensY;
      rotY.set(rotY.get() + deltaY);

      const instVelY = (deltaY / dtMs) * 1000;
      velY = dtMs > 60 ? instVelY : velY * 0.45 + instVelY * 0.55;

      const curP = pitchOffset.get();
      const stepP = dy * 0.0022;
      const limit = stepP > 0 ? 0.22 : 0.14;
      const over = Math.max(0, Math.abs(curP) - limit * 0.65);
      const damp = 1 / (1 + over * 6);
      pitchOffset.set(THREE.MathUtils.clamp(curP + stepP * damp, -0.16, 0.24));
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
      releasePhysics();
    };

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      pointerId = null;
      host.classList.remove("is-grabbing");
      releasePhysics();
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
    function animateFrame() {
      raf = requestAnimationFrame(animateFrame);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();
      const { f } = currentFrame();
      const targetSpin = reduce ? 0 : f.spin;

      updateCamera(dt);

      const coasting = dragging || Math.abs(rotY.getVelocity()) > 0.18;
      const goalSpin = coasting ? 0 : targetSpin;
      const spinBlend = 1 - Math.exp(-dt * (coasting ? 8 : 1.8));
      spinRate += (goalSpin - spinRate) * spinBlend;
      idleSpinAngle += spinRate * dt;

      cake.rotation.y = rotY.get() + idleSpinAngle;
      cake.rotation.x = 0;
      cake.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.015;

      if (blownRef.current) {
        if (!blownAt) blownAt = t;
        const p = Math.max(0, t - blownAt);
        const k = Math.min(1, p / 0.45);
        for (let i = 0; i < flames.length; i++) {
          const fl = flames[i];
          fl.visible = k < 1;
          fl.scale.set(1.05 * (1 - k), 2.9 * (1 - k), 1.05 * (1 - k));
        }
        for (let i = 0; i < glows.length; i++) {
          glows[i].material.opacity = 0.36 * (1 - k);
        }
        for (let i = 0; i < smokes.length; i++) {
          const s = smokes[i];
          s.position.y = s.baseY + p * 0.25 + Math.sin(p * 0.9 + i) * 0.05;
          s.position.x = s.baseX + Math.sin(p * 0.7 + i * 1.7) * 0.06;
          s.material.opacity =
            0.38 * Math.min(1, p / 0.6) * Math.max(0, 1 - Math.max(0, p - 1.4) / 2.4);
        }
        for (let i = 0; i < lights.length; i++) {
          const l = lights[i];
          l.light.intensity = l.base * Math.max(0, 1 - k);
        }
      } else {
        if (blownAt) {
          blownAt = 0;
          resetBlow();
        }
        if (!reduce) {
          for (let i = 0; i < flames.length; i++) {
            const s = 0.94 + 0.12 * Math.sin(t * 11 + i * 2.1) + 0.06 * Math.sin(t * 23 + i);
            flames[i].scale.set(1.05, 2.9 * s, 1.05);
          }
          for (let i = 0; i < lights.length; i++) {
            const l = lights[i];
            l.light.intensity =
              l.base *
              (0.86 + 0.14 * Math.sin(t * 8.5 + l.seed) + 0.05 * Math.sin(t * 19 + l.seed * 3));
          }
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
      animateFrame();
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
      rotY.stop();
      pitchOffset.stop();
      rotY.destroy();
      pitchOffset.destroy();
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
