"use client";

import { Float, OrbitControls, RoundedBox, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Component, ReactNode, useMemo, useRef, useState } from "react";
import { Group, PointLight, Shape } from "three";
import type { Product } from "@/lib/api";

type BoundaryProps = { children: ReactNode; fallback: ReactNode };
type BoundaryState = { failed: boolean };

class SceneBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("WebGL product experience could not start.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FollowLight() {
  const light = useRef<PointLight>(null);
  useFrame((state) => {
    if (!light.current) return;
    light.current.position.x += (state.pointer.x * 2.4 - light.current.position.x) * 0.06;
    light.current.position.y += (state.pointer.y * 1.6 - light.current.position.y) * 0.06;
  });
  return <pointLight ref={light} intensity={18} color="#3dcf8a" distance={7} position={[0.6, 0.8, 3]} />;
}

function HeroFallback({ product, image }: { product: Product; image: string }) {
  return <img src={image} alt={product.name} className="h-full w-full object-contain p-8" />;
}

export function HeroScene({ product, image }: { product: Product; image: string }) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  return (
    <SceneBoundary fallback={<HeroFallback product={product} image={image} />}>
      <Canvas
        camera={{ position: [0, 0, 4.9], fov: 41 }}
        dpr={[1, 1.3]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
      >
        <ambientLight intensity={1.15} />
        <pointLight position={[3, 3, 4]} intensity={42} color="#8ef0c0" distance={9} />
        <pointLight position={[-3, 0, 2]} intensity={18} color="#ffffff" distance={8} />
        <pointLight position={[0, -2, -2]} intensity={10} color="#3dcf8a" distance={7} />
        <FollowLight />
        <group scale={0.78}><ProductModel product={product} animate={animate} /></group>
        <Sparkles count={16} scale={3.9} size={1.05} speed={0.08} opacity={0.22} color="#3dcf8a" />
        <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.55} autoRotate={animate} autoRotateSpeed={0.22} dampingFactor={0.12} enableDamping />
      </Canvas>
    </SceneBoundary>
  );
}

function Lens() {
  return (
    <>
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.65, 0.65, 0.12, 48]} />
        <meshPhysicalMaterial color="#292b39" metalness={0.82} roughness={0.18} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.155]}>
        <circleGeometry args={[0.5, 48]} />
        <meshPhysicalMaterial color="#3dcf8a" metalness={0.35} roughness={0.12} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <circleGeometry args={[0.25, 48]} />
        <meshBasicMaterial color="#a5e9ff" />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <circleGeometry args={[0.09, 32]} />
        <meshBasicMaterial color="#f1e8ff" />
      </mesh>
    </>
  );
}

function Headphones() {
  return (
    <group rotation={[0.12, 0, 0.08]}>
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.77, 0.115, 18, 80, Math.PI]} />
        <meshPhysicalMaterial color="#3dcf8a" metalness={0.68} roughness={0.23} clearcoat={1} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <group key={x} position={[x, -0.24, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <mesh><cylinderGeometry args={[0.29, 0.29, 0.22, 40]} /><meshPhysicalMaterial color="#d8d3e8" metalness={0.42} roughness={0.28} /></mesh>
          <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.2, 0.2, 0.035, 40]} /><meshPhysicalMaterial color="#353341" roughness={0.83} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Laptop() {
  return (
    <group rotation={[0.35, -0.24, 0]}>
      <RoundedBox args={[2.05, 0.105, 1.4]} radius={0.08} smoothness={3} position={[0, -0.49, 0.08]}><meshStandardMaterial color="#bbb9cb" metalness={0.75} roughness={0.25} /></RoundedBox>
      <RoundedBox args={[1.98, 1.48, 0.1]} radius={0.09} smoothness={3} position={[0, 0.25, -0.57]} rotation={[-0.12, 0, 0]}><meshStandardMaterial color="#d4d1e0" metalness={0.72} roughness={0.24} /></RoundedBox>
      <RoundedBox args={[1.78, 1.24, 0.018]} radius={0.045} smoothness={3} position={[0, 0.26, -0.511]} rotation={[-0.12, 0, 0]}><meshStandardMaterial color="#163226" emissive="#3dcf8a" emissiveIntensity={0.28} metalness={0.3} roughness={0.25} /></RoundedBox>
      {Array.from({ length: 4 }, (_, row) => Array.from({ length: 11 }, (_, col) => (
        <RoundedBox key={`${row}-${col}`} args={[0.095, 0.03, 0.07]} radius={0.012} smoothness={2} position={[-0.82 + col * 0.164, -0.416, -0.36 + row * 0.13]}><meshStandardMaterial color="#696879" metalness={0.45} roughness={0.42} /></RoundedBox>
      )))}
      <RoundedBox args={[0.43, 0.016, 0.26]} radius={0.035} smoothness={3} position={[0, -0.421, 0.37]}><meshStandardMaterial color="#848296" metalness={0.52} roughness={0.35} /></RoundedBox>
    </group>
  );
}

function Watch() {
  return (
    <group rotation={[0.23, -0.2, 0.18]}>
      <RoundedBox args={[0.47, 1.18, 0.17]} radius={0.2} smoothness={5} position={[0, 0, -0.11]}><meshStandardMaterial color="#a799d1" metalness={0.58} roughness={0.34} /></RoundedBox>
      <RoundedBox args={[0.83, 0.92, 0.3]} radius={0.19} smoothness={6} position={[0, 0, 0.045]}><meshStandardMaterial color="#dbd9e5" metalness={0.82} roughness={0.2} /></RoundedBox>
      <RoundedBox args={[0.68, 0.76, 0.025]} radius={0.15} smoothness={6} position={[0, 0, 0.216]}><meshStandardMaterial color="#163226" emissive="#3dcf8a" emissiveIntensity={0.28} roughness={0.2} /></RoundedBox>
      <mesh position={[0.45, 0.1, 0.02]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.055, 0.055, 0.14, 24]} /><meshStandardMaterial color="#e8e3f2" metalness={0.84} roughness={0.23} /></mesh>
    </group>
  );
}

function Jacket() {
  const fabric = "#8273bd";
  const trim = "#b8a9ed";
  return (
    <group rotation={[0.12, -0.2, 0.04]}>
      <RoundedBox args={[1.24, 1.38, 0.34]} radius={0.16} smoothness={5} position={[0, 0, 0]}>
        <meshPhysicalMaterial color={fabric} roughness={0.64} clearcoat={0.16} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.76, 0.02, 0]} rotation={[0, 0, side * -0.2]}>
          <RoundedBox args={[0.38, 1.04, 0.3]} radius={0.17} smoothness={5}>
            <meshPhysicalMaterial color={fabric} roughness={0.64} clearcoat={0.16} />
          </RoundedBox>
          <RoundedBox args={[0.39, 0.14, 0.31]} radius={0.055} smoothness={4} position={[0, -0.46, 0]}>
            <meshStandardMaterial color={trim} roughness={0.55} />
          </RoundedBox>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={`lapel-${side}`} position={[side * 0.21, 0.52, 0.19]} rotation={[0, 0, side * -0.42]}>
          <RoundedBox args={[0.32, 0.47, 0.07]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color={trim} roughness={0.58} />
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[0.035, 0.99, 0.035]} radius={0.014} smoothness={2} position={[0, -0.08, 0.19]}>
        <meshStandardMaterial color="#e1d9ff" metalness={0.35} roughness={0.3} />
      </RoundedBox>
      {[-0.2, -0.43].map((y) => (
        <mesh key={y} position={[0.29, y, 0.194]}>
          <circleGeometry args={[0.12, 24]} />
          <meshStandardMaterial color={trim} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function Backpack() {
  return (
    <group rotation={[0.1, -0.22, 0.04]}>
      <RoundedBox args={[1.32, 1.67, 0.69]} radius={0.24} smoothness={5} position={[0, 0, 0]}><meshPhysicalMaterial color="#716d98" roughness={0.72} clearcoat={0.12} /></RoundedBox>
      <RoundedBox args={[1.05, 0.68, 0.14]} radius={0.15} smoothness={5} position={[0, -0.47, 0.386]}><meshStandardMaterial color="#a193cd" roughness={0.74} /></RoundedBox>
      <RoundedBox args={[0.5, 0.11, 0.11]} radius={0.05} smoothness={3} position={[0, -0.51, 0.481]}><meshStandardMaterial color="#d5d0df" metalness={0.4} roughness={0.5} /></RoundedBox>
      {[-0.44, 0.44].map((x) => <RoundedBox key={x} args={[0.15, 1.34, 0.12]} radius={0.06} smoothness={3} position={[x, 0, -0.24]} rotation={[0, 0, x > 0 ? -0.08 : 0.08]}><meshStandardMaterial color="#9690b2" roughness={0.78} /></RoundedBox>)}
      <mesh position={[0, 0.9, -0.28]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.24, 0.075, 12, 40, Math.PI]} /><meshStandardMaterial color="#9891b5" roughness={0.7} /></mesh>
    </group>
  );
}

function Shoe() {
  return (
    <group rotation={[0.12, -0.16, 0.06]}>
      <RoundedBox args={[1.85, 0.22, 0.67]} radius={0.1} smoothness={4} position={[0, -0.35, 0]}><meshStandardMaterial color="#ebe9ef" roughness={0.72} /></RoundedBox>
      <RoundedBox args={[1.48, 0.53, 0.59]} radius={0.22} smoothness={5} position={[-0.04, -0.04, 0]}><meshPhysicalMaterial color="#9786d9" roughness={0.67} /></RoundedBox>
      <mesh position={[0.57, -0.13, 0.02]} scale={[0.46, 0.27, 0.32]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#b4a7e8" roughness={0.7} /></mesh>
      {[-0.34, -0.2, -0.06].map((y) => <mesh key={y} position={[-0.12, y, 0.3]}><boxGeometry args={[0.61, 0.025, 0.025]} /><meshStandardMaterial color="#eee9ff" roughness={0.5} /></mesh>)}
    </group>
  );
}

function CoffeeMaker() {
  return (
    <group rotation={[0.05, -0.2, 0]}>
      <RoundedBox args={[1.17, 1.62, 0.78]} radius={0.2} smoothness={5} position={[0, 0, 0]}><meshPhysicalMaterial color="#d4d1de" metalness={0.36} roughness={0.26} /></RoundedBox>
      <RoundedBox args={[0.9, 0.43, 0.08]} radius={0.12} smoothness={4} position={[0, 0.53, 0.418]}><meshStandardMaterial color="#383547" roughness={0.42} /></RoundedBox>
      <RoundedBox args={[0.63, 0.47, 0.15]} radius={0.05} smoothness={3} position={[0, -0.22, 0.437]}><meshStandardMaterial color="#403953" metalness={0.35} roughness={0.35} /></RoundedBox>
      <RoundedBox args={[0.77, 0.09, 0.47]} radius={0.045} smoothness={3} position={[0, -0.68, 0.09]}><meshStandardMaterial color="#9793a5" metalness={0.6} roughness={0.36} /></RoundedBox>
      <mesh position={[0, 0.17, 0.435]}><sphereGeometry args={[0.065, 24, 16]} /><meshBasicMaterial color="#3dcf8a" /></mesh>
    </group>
  );
}

function DeskLamp() {
  return (
    <group rotation={[0.03, -0.23, -0.12]}>
      <mesh position={[0, -0.71, 0]}><cylinderGeometry args={[0.54, 0.6, 0.12, 40]} /><meshStandardMaterial color="#aca4c9" metalness={0.72} roughness={0.3} /></mesh>
      <mesh position={[-0.28, -0.06, 0]} rotation={[0, 0, -0.45]}><cylinderGeometry args={[0.055, 0.055, 1.35, 20]} /><meshStandardMaterial color="#c9c4d8" metalness={0.86} roughness={0.22} /></mesh>
      <mesh position={[0.25, 0.44, 0]} rotation={[0, 0, 0.77]}><cylinderGeometry args={[0.045, 0.045, 1.15, 20]} /><meshStandardMaterial color="#c9c4d8" metalness={0.86} roughness={0.22} /></mesh>
      <mesh position={[0.67, 0.79, 0]} rotation={[0, 0, -0.35]}><coneGeometry args={[0.55, 0.57, 40, 1, true]} /><meshPhysicalMaterial color="#9a8cd3" metalness={0.55} roughness={0.3} side={2} /></mesh>
      <mesh position={[0.67, 0.51, 0]}><circleGeometry args={[0.38, 40]} /><meshBasicMaterial color="#ffe1a3" /></mesh>
      <pointLight position={[0.67, 0.42, 0.1]} intensity={9} distance={2.7} color="#ffd995" />
    </group>
  );
}

function ProductModel({ product, animate }: { product: Product; animate: boolean }) {
  const mesh = useRef<Group>(null);
  const name = product.name.toLowerCase();
  useFrame((state, delta) => {
    if (!mesh.current || !animate) return;
    mesh.current.rotation.y += delta * 0.045;
    mesh.current.rotation.x += ((state.pointer.y * -0.12) - mesh.current.rotation.x) * 0.04;
    mesh.current.position.x += ((state.pointer.x * 0.08) - mesh.current.position.x) * 0.04;
  });
  const model = name.includes("headphone") || name.includes("earbud") ? <Headphones />
    : name.includes("laptop") || name.includes("computer") ? <Laptop />
      : name.includes("watch") ? <Watch />
        : name.includes("jacket") || name.includes("shirt") || name.includes("coat") ? <Jacket />
        : name.includes("backpack") || name.includes("bag") ? <Backpack />
          : name.includes("shoe") || name.includes("sneaker") ? <Shoe />
            : name.includes("coffee") ? <CoffeeMaker />
              : name.includes("lamp") ? <DeskLamp />
                : <Lens />;

  return (
    <group ref={mesh}>
      <Float speed={1} floatIntensity={0.13} rotationIntensity={0.055}>
        {model}
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.64, 72]} />
          <meshStandardMaterial color="#3dcf8a" transparent opacity={0.09} metalness={0.55} roughness={0.3} />
        </mesh>
      </Float>
    </group>
  );
}

function ProductFallback({ product, image }: { product: Product; image: string }) {
  return (
    <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[26px] border border-white/[.08] bg-[#161823]">
      <img src={image} alt={product.name} className="h-full w-full object-cover" />
      <span className="absolute bottom-3 left-3 rounded-full bg-[#10111ad9] px-3 py-2 text-[10px] text-white">3D unavailable — showing product photo</span>
    </div>
  );
}

export function ProductStudio({ product, image }: { product: Product; image: string }) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  return (
    <SceneBoundary fallback={<ProductFallback product={product} image={image} />}>
      <div className="relative aspect-square w-full overflow-hidden rounded-[26px] border border-white/[.08] bg-[radial-gradient(ellipse_at_50%_44%,#1a2a22_0%,#121212_40%,#0a0a0a_77%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_92%,#3dcf8a18_0%,transparent_48%)]" />
        <Canvas
          camera={{ position: [0, 0, 4.9], fov: 41 }}
          dpr={[1, 1.3]}
          gl={{ antialias: false, powerPreference: "low-power" }}
          onCreated={({ gl }) => setWebglAvailable(Boolean(gl.getContext()))}
          style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
        >
          <ambientLight intensity={1.2} />
          <pointLight position={[3, 3, 4]} intensity={42} color="#8ef0c0" distance={9} />
          <pointLight position={[-3, 0, 2]} intensity={16} color="#ffffff" distance={8} />
          <pointLight position={[0, -2, -2]} intensity={10} color="#3dcf8a" distance={7} />
          <ProductModel product={product} animate={animate} />
          <Sparkles count={18} scale={3.9} size={1.05} speed={0.08} opacity={0.22} color="#3dcf8a" />
          <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.55} autoRotate={animate} autoRotateSpeed={0.22} dampingFactor={0.12} enableDamping />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
          <span className="rounded-full border border-white/10 bg-[#10111ac9] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-white/80 backdrop-blur">3D studio · drag to explore</span>
        </div>
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-[#10111ac9] px-3 py-1.5 text-[9px] uppercase tracking-wider text-accent backdrop-blur">
          {webglAvailable === false ? "Product preview" : "Interactive object"}
        </div>
      </div>
    </SceneBoundary>
  );
}

function skateboardDeck(length: number, halfWidth: number) {
  const endRadius = halfWidth * 0.72;
  const shoulder = length / 2 - endRadius;
  const shape = new Shape();
  shape.moveTo(-shoulder, -halfWidth);
  shape.quadraticCurveTo(-length / 2, -halfWidth, -length / 2, -endRadius);
  shape.lineTo(-length / 2, endRadius);
  shape.quadraticCurveTo(-length / 2, halfWidth, -shoulder, halfWidth);
  shape.lineTo(shoulder, halfWidth);
  shape.quadraticCurveTo(length / 2, halfWidth, length / 2, endRadius);
  shape.lineTo(length / 2, -endRadius);
  shape.quadraticCurveTo(length / 2, -halfWidth, shoulder, -halfWidth);
  shape.closePath();
  return shape;
}

function SkateboardModel({ animate }: { animate: boolean }) {
  const board = useRef<Group>(null);
  const deck = useMemo(() => skateboardDeck(3.1, 0.43), []);
  const grip = useMemo(() => skateboardDeck(2.92, 0.355), []);

  useFrame((state, delta) => {
    if (!board.current || !animate) return;
    board.current.rotation.z += delta * 0.045;
    board.current.rotation.x += (state.pointer.y * -0.07 - board.current.rotation.x) * 0.025;
    board.current.rotation.y += (state.pointer.x * 0.12 - board.current.rotation.y) * 0.025;
  });

  return (
    <group ref={board} rotation={[-0.12, 0.08, -0.08]}>
      <Float speed={0.8} floatIntensity={0.11} rotationIntensity={0.025}>
        <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
          <extrudeGeometry args={[deck, { depth: 0.13, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 12 }]} />
          <meshPhysicalMaterial color="#c9945a" metalness={0.12} roughness={0.38} clearcoat={0.32} clearcoatRoughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.091]} receiveShadow>
          <extrudeGeometry args={[grip, { depth: 0.018, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.006, curveSegments: 12 }]} />
          <meshStandardMaterial color="#202125" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.119]}>
          <boxGeometry args={[0.58, 0.045, 0.004]} />
          <meshStandardMaterial color="#3dcf8a" metalness={0.2} roughness={0.55} />
        </mesh>
        <mesh position={[0.15, 0, 0.12]}>
          <boxGeometry args={[0.09, 0.045, 0.004]} />
          <meshStandardMaterial color="#d8e7dc" roughness={0.55} />
        </mesh>

        {[-1, 1].map((truck) => (
          <group key={truck} position={[truck * 0.94, 0, -0.19]}>
            <mesh position={[0, 0, 0.02]} castShadow>
              <boxGeometry args={[0.34, 0.4, 0.07]} />
              <meshStandardMaterial color="#aeb3b5" metalness={0.82} roughness={0.27} />
            </mesh>
            <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.48, 24]} />
              <meshStandardMaterial color="#c3c7c8" metalness={0.9} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.23, 20]} />
              <meshStandardMaterial color="#858b91" metalness={0.85} roughness={0.3} />
            </mesh>
            {[-1, 1].map((side) => (
              <group key={side} position={[0, side * 0.57, -0.14]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.235, 0.235, 0.17, 40]} />
                  <meshPhysicalMaterial color="#e9e9e4" roughness={0.42} clearcoat={0.18} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.183, 0.045, 12, 40]} />
                  <meshStandardMaterial color="#d2d4d0" roughness={0.52} />
                </mesh>
                <mesh position={[0, side * 0.088, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.072, 0.072, 0.014, 32]} />
                  <meshStandardMaterial color="#4d9f7c" metalness={0.38} roughness={0.35} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {[-0.94, 0.94].flatMap((x) =>
          [-0.25, 0.25].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.125]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.012, 16]} />
              <meshStandardMaterial color="#d3d5d4" metalness={0.9} roughness={0.2} />
            </mesh>
          )),
        )}

        <mesh position={[0, 0, -0.48]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.95, 64]} />
          <meshBasicMaterial color="#3dcf8a" transparent opacity={0.075} />
        </mesh>
      </Float>
    </group>
  );
}

function SkateboardFallback() {
  return (
    <div aria-label="Skateboard preview" className="grid h-full w-full place-items-center">
      <div className="relative h-24 w-[78%] -rotate-[12deg] rounded-[50%] border-[9px] border-[#c9945a] bg-[#202125] shadow-[0_35px_55px_rgba(61,207,138,.14)]">
        <span className="absolute left-1/2 top-1/2 h-2 w-12 -translate-x-1/2 -translate-y-1/2 bg-accent" />
        <span className="absolute -bottom-5 left-[18%] h-5 w-5 rounded-full bg-[#e9e9e4]" />
        <span className="absolute -bottom-5 right-[18%] h-5 w-5 rounded-full bg-[#e9e9e4]" />
      </div>
    </div>
  );
}

export function SkateboardScene() {
  const reducedMotion = useReducedMotion();
  return (
    <SceneBoundary fallback={<SkateboardFallback />}>
      <Canvas
        camera={{ position: [0, 1.35, 5.5], fov: 39 }}
        dpr={[1, 1.4]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
      >
        <ambientLight intensity={1.15} />
        <pointLight position={[2, 3, 4]} intensity={38} color="#fff1d5" distance={9} />
        <pointLight position={[-3, 0, 2]} intensity={24} color="#8ef0c0" distance={8} />
        <pointLight position={[0, -2, -2]} intensity={12} color="#3dcf8a" distance={7} />
        <SkateboardModel animate={!reducedMotion} />
        <Sparkles count={20} scale={4.4} size={1} speed={0.07} opacity={0.2} color="#9cebc5" />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.48}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.16}
          dampingFactor={0.12}
          enableDamping
        />
      </Canvas>
    </SceneBoundary>
  );
}
