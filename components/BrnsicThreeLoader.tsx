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
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 5.2;

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

        // Core acoustic wireframe icosahedron
        const coreGeo = new THREE.IcosahedronGeometry(1.08, 2);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0x1ed760,
          wireframe: true,
          transparent: true,
          opacity: 0.38
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        scene.add(coreMesh);

        // Inner glowing crystalline solid
        const innerGeo = new THREE.IcosahedronGeometry(0.72, 1);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.14
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        scene.add(innerMesh);

        // Orbital acoustic rings
        const ring1Geo = new THREE.TorusGeometry(1.55, 0.014, 16, 100);
        const ring1Mat = new THREE.MeshBasicMaterial({
          color: 0x1ed760,
          transparent: true,
          opacity: 0.55
        });
        const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        ring1.rotation.x = Math.PI * 0.38;
        ring1.rotation.y = Math.PI * 0.14;
        scene.add(ring1);

        const ring2Geo = new THREE.TorusGeometry(1.9, 0.009, 16, 100);
        const ring2Mat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2
        });
        const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.rotation.x = -Math.PI * 0.32;
        ring2.rotation.y = Math.PI * 0.28;
        scene.add(ring2);

        // Ambient 3D sound particles
        const particleCount = 140;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          const radius = 2.1 + Math.random() * 2.2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0x1ed760,
          size: 0.038,
          transparent: true,
          opacity: 0.65
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

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

          const pulse = 1 + Math.sin(t * 2.4) * 0.055;
          coreMesh.scale.setScalar(pulse);
          coreMesh.rotation.y = t * 0.45;
          coreMesh.rotation.x = Math.sin(t * 0.6) * 0.25;

          innerMesh.scale.setScalar(1 + Math.cos(t * 2.4) * 0.06);
          innerMesh.rotation.y = -t * 0.35;

          ring1.rotation.z = t * 0.55;
          ring2.rotation.z = -t * 0.38;
          particles.rotation.y = t * 0.12;
          particles.rotation.x = Math.sin(t * 0.25) * 0.08;

          renderer.render(scene, camera);
        };
        animate();

        cleanupFn = () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(frameId);
          coreGeo.dispose();
          coreMat.dispose();
          innerGeo.dispose();
          innerMat.dispose();
          ring1Geo.dispose();
          ring1Mat.dispose();
          ring2Geo.dispose();
          ring2Mat.dispose();
          particleGeo.dispose();
          particleMat.dispose();
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
        <div className="w-16 h-16 rounded-2xl bg-black/75 border border-[#1ed760]/40 flex items-center justify-center shadow-[0_0_35px_rgba(30,215,96,0.35)]">
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
