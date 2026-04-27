import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Grid, Edges, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize, Box, Layout, ArrowUp, ArrowRight, RotateCw, Monitor, Zap } from 'lucide-react';

interface Part3D {
  id: string | number;
  width: number;
  length: number;
  thickness: number;
  x: number;
  y: number;
  z: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  finish?: string;
  isSelected?: boolean;
}

interface PartPreview3DProps {
  parts: Part3D[];
}

function StonePlate({ width, length, thickness, x, y, z, rotX = 0, rotY = 0, rotZ = 0, finish, isSelected }: Part3D) {
  const scale = 0.001; 
  const w = width * scale;
  const l = length * scale; // profundidade (Y do usuário -> Z do Three)
  const t = thickness * scale; // espessura da pedra (Z do usuário -> Y do Three)
  
  const rx = (rotX * Math.PI) / 180;
  const ry = (rotY * Math.PI) / 180;
  const rz = (rotZ * Math.PI) / 180;

  return (
    <group 
      position={[x * scale, z * scale, y * scale]} 
      rotation={[rx, ry, rz]}
    >
      <mesh position={[w / 2, t / 2, l / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, t, l]} />
        <meshStandardMaterial 
          color={isSelected ? '#3b82f6' : '#334155'} 
          roughness={finish === 'Polido' ? 0.1 : 0.8}
          metalness={finish === 'Polido' ? 0.2 : 0}
          transparent={!isSelected}
          opacity={isSelected ? 1 : 0.9}
        />
        {isSelected && (
          <Edges
            scale={1}
            threshold={15} 
            color="#60a5fa"
          />
        )}
      </mesh>
    </group>
  );
}

export default function PartPreview3D({ parts }: PartPreview3DProps) {
  const [isOrthographic, setIsOrthographic] = useState(false);
  const controlsRef = useRef<any>(null);

  const setView = (position: [number, number, number]) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.object.position.set(...position);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  return (
    <div className="w-full h-full bg-slate-900/50 rounded-2xl overflow-hidden border border-border-dark relative min-h-[400px]">
      <Canvas shadows>
        <color attach="background" args={['#0f172a']} />
        
        {isOrthographic ? (
          <OrthographicCamera makeDefault position={[1.5, 1.5, 1.5]} zoom={400} far={1000} near={0.1} />
        ) : (
          <PerspectiveCamera makeDefault position={[1.5, 1.5, 1.5]} fov={40} />
        )}

        <Suspense fallback={null}>
          <Environment preset="city" />
          <group position={[-0.5, 0, -0.5]}>
            {parts.map((part, idx) => (
              <StonePlate 
                key={part.id || idx} 
                id={part.id}
                width={part.width}
                length={part.length}
                thickness={part.thickness}
                x={part.x}
                y={part.y}
                z={part.z}
                rotX={part.rotX}
                rotY={part.rotY}
                rotZ={part.rotZ}
                finish={part.finish}
                isSelected={part.isSelected}
              />
            ))}
            
            <ContactShadows 
              position={[0.5, 0, 0.5]}
              opacity={0.4} 
              scale={10} 
              blur={2.4} 
              far={0.8} 
            />
          </group>
          
          <Grid 
            infiniteGrid 
            fadeDistance={10} 
            cellColor="#1e293b" 
            sectionColor="#334155" 
            position={[0, -0.001, 0]}
          />
        </Suspense>

        <OrbitControls ref={controlsRef} makeDefault />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
      </Canvas>
      
      {/* Controles de Câmera */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
        <div className="flex gap-0.5 bg-black/40 backdrop-blur-md p-0.5 rounded-lg border border-white/10">
          <button 
            onClick={() => setIsOrthographic(false)}
            className={`px-2 py-1 rounded-md text-[8px] font-bold transition-all ${!isOrthographic ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Persp.
          </button>
          <button 
            onClick={() => setIsOrthographic(true)}
            className={`px-2 py-1 rounded-md text-[8px] font-bold transition-all ${isOrthographic ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Orto.
          </button>
        </div>

        <div className="grid grid-cols-3 gap-0.5 bg-black/40 backdrop-blur-md p-0.5 rounded-lg border border-white/10">
          <button onClick={() => setView([0, 2, 0])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="Topo">
            <ArrowUp size={12} />
            <span className="text-[6px] font-black uppercase">Topo</span>
          </button>
          <button onClick={() => setView([0, 0, 2])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="Frente">
            <Monitor size={12} />
            <span className="text-[6px] font-black uppercase">Frt.</span>
          </button>
          <button onClick={() => setView([2, 0, 0])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="Direita">
            <ArrowRight size={12} />
            <span className="text-[6px] font-black uppercase">Dir.</span>
          </button>
          <button onClick={() => setView([-2, 0, 0])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="Esquerda">
            <ArrowRight size={12} className="rotate-180" />
            <span className="text-[6px] font-black uppercase">Esq.</span>
          </button>
          <button onClick={() => setView([1.5, 1.5, 1.5])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="ISO">
            <RotateCw size={12} />
            <span className="text-[6px] font-black uppercase">Iso</span>
          </button>
          <button onClick={() => setView([0, 0, -2])} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all flex flex-col items-center" title="Atrás">
            <Layout size={12} className="rotate-180" />
            <span className="text-[6px] font-black uppercase">Trás</span>
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {parts.length} Peças no Módulo
        </div>
      </div>
    </div>
  );
}
