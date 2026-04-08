import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Generate a 4-point star shape procedurally
function generateStarPositions(count: number, size: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Create a 4-point star distribution
    const angle = Math.random() * Math.PI * 2;
    const armIndex = Math.floor(Math.random() * 4);
    const armAngle = (armIndex * Math.PI) / 2;
    const spread = Math.random();
    const alongArm = Math.pow(Math.random(), 0.6) * size;
    const perpSpread = (Math.random() - 0.5) * size * 0.15 * (1 - spread * 0.5);
    
    // Mix between star arms and a central cluster
    if (Math.random() < 0.3) {
      // Central cluster
      const r = Math.random() * size * 0.3;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * size * 0.2;
    } else {
      // Star arms
      positions[i * 3] = Math.cos(armAngle) * alongArm + Math.cos(armAngle + Math.PI / 2) * perpSpread;
      positions[i * 3 + 1] = Math.sin(armAngle) * alongArm + Math.sin(armAngle + Math.PI / 2) * perpSpread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * size * 0.15;
    }
  }
  return positions;
}

interface ParticlesProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function Particles({ mouse }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const count = 8000;
  const size = 12;

  const [basePositions, currentPositions] = useMemo(() => {
    const base = generateStarPositions(count, size);
    const current = new Float32Array(base);
    return [base, current];
  }, []);

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    const green = new THREE.Color('hsl(160, 99%, 39%)');
    const white = new THREE.Color('hsl(0, 0%, 100%)');
    for (let i = 0; i < count; i++) {
      const mix = Math.random();
      const col = green.clone().lerp(white, mix * 0.6);
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    return c;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * 0.15;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute('position');
    const arr = posAttr.array as Float32Array;

    // Cursor influence
    const mx = mouse.current.x * 3;
    const my = mouse.current.y * 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Gentle floating motion
      const bx = basePositions[ix];
      const by = basePositions[iy];
      const bz = basePositions[iz];

      const drift = Math.sin(time + i * 0.01) * 0.3;
      const driftY = Math.cos(time * 0.8 + i * 0.013) * 0.3;

      // Cursor repulsion
      const dx = bx - mx;
      const dy = by - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repulse = Math.max(0, 1 - dist / 5) * 2;

      arr[ix] = bx + drift + (dx / (dist + 0.1)) * repulse;
      arr[iy] = by + driftY + (dy / (dist + 0.1)) * repulse;
      arr[iz] = bz + Math.sin(time * 0.5 + i * 0.005) * 0.2;
    }

    posAttr.needsUpdate = true;

    // Slow rotation
    meshRef.current.rotation.z = time * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleStarField() {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * 15;
    mouse.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2 * 15;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ opacity: 0.3 }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
      >
        <Particles mouse={mouse} />
      </Canvas>
    </div>
  );
}
