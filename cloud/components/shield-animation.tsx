"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ShieldAnimation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 28;

    // --- Particle field (background nodes) ---
    const NODE_COUNT = 80;
    const nodePositions = new Float32Array(NODE_COUNT * 3);
    const nodeColors = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePositions[i * 3] = (Math.random() - 0.5) * 60;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      // Mix of green and orange tones
      const t = Math.random();
      nodeColors[i * 3] = t > 0.7 ? 1.0 : 0.1;
      nodeColors[i * 3 + 1] = t > 0.7 ? 0.4 : 0.9;
      nodeColors[i * 3 + 2] = t > 0.7 ? 0.1 : 0.3;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));
    const nodeMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.7 });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodes);

    // --- Connection lines between nearby nodes ---
    const linePositions: number[] = [];
    const CONNECT_DIST = 14;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodePositions[i * 3] - nodePositions[j * 3];
        const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
        const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < CONNECT_DIST) {
          linePositions.push(
            nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2],
            nodePositions[j * 3], nodePositions[j * 3 + 1], nodePositions[j * 3 + 2],
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.08 });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // --- Flowing particles (threat events moving toward center) ---
    const FLOW_COUNT = 40;
    type Particle = { mesh: THREE.Mesh; vel: THREE.Vector3; blocked: boolean; blockTimer: number };
    const particles: Particle[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.12, 6, 6);

    function spawnParticle(): Particle {
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 6;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 4,
      );
      const isRed = Math.random() < 0.3;
      const mat = new THREE.MeshBasicMaterial({ color: isRed ? 0xff4444 : 0x4ade80, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.copy(pos);
      const vel = pos.clone().negate().normalize().multiplyScalar(0.04 + Math.random() * 0.03);
      scene.add(mesh);
      return { mesh, vel, blocked: isRed, blockTimer: 0 };
    }

    for (let i = 0; i < FLOW_COUNT; i++) particles.push(spawnParticle());

    // --- Central shield ring ---
    const ringGeo = new THREE.TorusGeometry(5.5, 0.08, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(5.2, 0.04, 8, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.3 });
    scene.add(new THREE.Mesh(ring2Geo, ring2Mat));

    // Pulse ring
    const pulseGeo = new THREE.TorusGeometry(5.5, 0.06, 8, 64);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0 });
    const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseRing);

    let frame = 0;
    let pulseScale = 1;

    function animate() {
      frame++;
      const raf = requestAnimationFrame(animate);
      animRef.current = raf;

      // Slow rotation of node field
      nodes.rotation.y += 0.0005;
      nodes.rotation.x += 0.0002;

      // Pulse ring
      pulseScale += 0.01;
      if (pulseScale > 1.6) pulseScale = 1;
      pulseRing.scale.setScalar(pulseScale);
      (pulseMat as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - (pulseScale - 1) / 0.6);

      // Flow particles
      for (const p of particles) {
        const dist = p.mesh.position.length();
        if (p.blocked && dist < 5.8) {
          // Deflect: burst outward
          p.blockTimer++;
          if (p.blockTimer === 1) {
            // Flash the ring briefly
            (ringMat as THREE.MeshBasicMaterial).color.setHex(0xff4444);
            setTimeout(() => (ringMat as THREE.MeshBasicMaterial).color.setHex(0x22c55e), 200);
          }
          if (p.blockTimer > 30) {
            scene.remove(p.mesh);
            const idx = particles.indexOf(p);
            particles.splice(idx, 1, spawnParticle());
          }
        } else if (!p.blocked && dist < 0.8) {
          // Absorbed
          scene.remove(p.mesh);
          const idx = particles.indexOf(p);
          particles.splice(idx, 1, spawnParticle());
        } else {
          p.mesh.position.add(p.vel);
        }
      }

      renderer.render(scene, camera);
    }

    const animRef = { current: 0 };
    animate();

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" aria-hidden />;
}
