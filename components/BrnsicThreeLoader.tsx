"use client";

import React, { useEffect, useRef } from "react";

export default function BrnsicThreeLoader({
  fallbackIconSrc
}: {
  fallbackIconSrc: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let frameId = 0;
    let cleanupFn: (() => void) | null = null;

    (async () => {
      try {
        const THREE = await import("three");
        if (!isMounted || !mountRef.current) return;

        const container = mountRef.current;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
        camera.position.set(0, 0.25, 6.2);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 1);
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // 1. Flowing 3D Harmonic Melody Waves ("Alunan Nada")
        const waveConfigs = [
          { color: 0x1ed760, opacity: 0.85, amp: 0.55, freq: 1.4, speed: 2.1, z: 0.2, yOffset: 0 },
          { color: 0x10b981, opacity: 0.48, amp: 0.42, freq: 1.9, speed: 1.6, z: -0.35, yOffset: 0.12 },
          { color: 0xffffff, opacity: 0.22, amp: 0.32, freq: 2.3, speed: 1.3, z: -0.8, yOffset: -0.1 }
        ];

        const pointCount = 120;
        const waveLines: Array<{
          line: any;
          geo: any;
          mat: any;
          cfg: (typeof waveConfigs)[number];
        }> = [];

        for (const cfg of waveConfigs) {
          const positions = new Float32Array(pointCount * 3);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          const mat = new THREE.LineBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: cfg.opacity
          });
          const line = new THREE.Line(geo, mat);
          scene.add(line);
          waveLines.push({ line, geo, mat, cfg });
        }

        // 2. Floating 3D Musical Notes drifting along the melody
        const headGeo = new THREE.SphereGeometry(0.085, 16, 12);
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8);
        const flagGeo = new THREE.BoxGeometry(0.11, 0.035, 0.02);

        const noteMatGreen = new THREE.MeshBasicMaterial({
          color: 0x1ed760,
          transparent: true,
          opacity: 0.9
        });
        const noteMatSoft = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.55
        });

        const notes: Array<{
          group: any;
          baseX: number;
          baseY: number;
          baseZ: number;
          speed: number;
          phase: number;
        }> = [];

        const noteCount = 14;
        for (let i = 0; i < noteCount; i++) {
          const group = new THREE.Group();
          const mat = i % 3 === 0 ? noteMatSoft : noteMatGreen;

          const head = new THREE.Mesh(headGeo, mat);
          head.scale.set(1.25, 0.85, 0.85);
          head.rotation.z = 0.35;
          group.add(head);

          const stem = new THREE.Mesh(stemGeo, mat);
          stem.position.set(0.08, 0.16, 0);
          group.add(stem);

          if (i % 2 === 0) {
            const flag = new THREE.Mesh(flagGeo, mat);
            flag.position.set(0.13, 0.3, 0);
            flag.rotation.z = -0.35;
            group.add(flag);
          }

          const baseX = -3.4 + (i / (noteCount - 1)) * 6.8 + (Math.random() - 0.5) * 0.4;
          const baseY = (Math.random() - 0.5) * 1.6;
          const baseZ = (Math.random() - 0.5) * 1.4;
          group.position.set(baseX, baseY, baseZ);
          const scale = 0.65 + Math.random() * 0.55;
          group.scale.setScalar(scale);
          scene.add(group);

          notes.push({
            group,
            baseX,
            baseY,
            baseZ,
            speed: 0.7 + Math.random() * 0.7,
            phase: Math.random() * Math.PI * 2
          });
        }

        const handleResize = () => {
          if (!mountRef.current) return;
          const w = mountRef.current.clientWidth || window.innerWidth;
          const h = mountRef.current.clientHeight || window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        const clock = new THREE.Clock();
        const animate = () => {
          if (!isMounted) return;
          frameId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();

          // Update flowing harmonic waves
          for (const { geo, cfg } of waveLines) {
            const posAttr = geo.getAttribute("position");
            for (let i = 0; i < pointCount; i++) {
              const u = i / (pointCount - 1);
              const x = -4.8 + u * 9.6;
              // Envelope tapers smoothly at screen edges
              const envelope = Math.sin(u * Math.PI);
              const y =
                cfg.yOffset +
                envelope *
                  cfg.amp *
                  (Math.sin(x * cfg.freq - t * cfg.speed) * 0.68 +
                    Math.cos(x * (cfg.freq * 1.7) + t * (cfg.speed * 0.7)) * 0.32);
              const z = cfg.z + Math.sin(x * 0.8 + t * 1.1) * 0.18;
              posAttr.setXYZ(i, x, y, z);
            }
            posAttr.needsUpdate = true;
          }

          // Drift musical notes along the wave
          for (const n of notes) {
            n.group.position.y = n.baseY + Math.sin(t * n.speed + n.phase) * 0.42;
            n.group.position.x = n.baseX + Math.cos(t * 0.45 + n.phase) * 0.18;
            n.group.rotation.y = Math.sin(t * 0.8 + n.phase) * 0.35;
            n.group.rotation.z = Math.sin(t * 1.2 + n.phase) * 0.12;
          }

          renderer.render(scene, camera);
        };
        animate();

        cleanupFn = () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(frameId);
          for (const { geo, mat } of waveLines) {
            geo.dispose();
            mat.dispose();
          }
          headGeo.dispose();
          stemGeo.dispose();
          flagGeo.dispose();
          noteMatGreen.dispose();
          noteMatSoft.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch {
        // WebGL fallback handled by centered icon overlay
      }
    })();

    return () => {
      isMounted = false;
      cancelAnimationFrame(frameId);
      cleanupFn?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none overflow-hidden">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-black/80 border border-[#1ed760]/45 flex items-center justify-center shadow-[0_0_38px_rgba(30,215,96,0.35)]">
          <img
            src="/app-icon.png"
            alt="Brnsic"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackIconSrc;
            }}
            className="w-11 h-11 rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
