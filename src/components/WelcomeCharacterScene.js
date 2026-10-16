"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function Character({ mood }) {
  const root = useRef();
  const head = useRef();
  const armL = useRef();
  const armR = useRef();
  const mouth = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let y = Math.sin(t * 2) * 0.05;
    let rotY = 0, headX = 0;
    let aL = 0.2, aR = 0.2;

    if (mood === "dance") {
      y = Math.abs(Math.sin(t * 6)) * 0.25;
      rotY = Math.sin(t * 4) * 0.45;
      aL = 1.8 + Math.sin(t * 8) * 0.7;
      aR = 1.8 + Math.sin(t * 8 + Math.PI) * 0.7;
    } else if (mood === "sad") {
      y = -0.1;
      headX = 0.4;
      aL = aR = 0.05;
    } else if (mood === "happy") {
      y = Math.abs(Math.sin(t * 5)) * 0.5;
      rotY = Math.sin(t * 3) * 0.3;
      aL = aR = 2.5;
    } else {
      aL = aR = 0.2 + Math.sin(t * 2) * 0.05;
    }

    root.current.position.y = y;
    root.current.rotation.y = rotY;
    head.current.rotation.x = headX;
    armL.current.rotation.z = -aL;
    armR.current.rotation.z = aR;
    mouth.current.rotation.z = mood === "sad" ? 0 : Math.PI;
    mouth.current.position.y = mood === "sad" ? -0.22 : -0.08;
  });

  return (
    <group ref={root}>
      {/* body */}
      <mesh position={[0, -0.2, 0]} scale={[1, 1.2, 0.9]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#d4af37" />
      </mesh>
      {/* arms */}
      <group ref={armL} position={[-0.6, 0.15, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.11, 0.4, 8, 16]} />
          <meshStandardMaterial color="#f2c9a0" />
        </mesh>
      </group>
      <group ref={armR} position={[0.6, 0.15, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.11, 0.4, 8, 16]} />
          <meshStandardMaterial color="#f2c9a0" />
        </mesh>
      </group>
      {/* head */}
      <group ref={head} position={[0, 0.85, 0]}>
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial color="#f2c9a0" />
        </mesh>
        <mesh position={[-0.2, 0.1, 0.48]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#1a1420" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.48]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#1a1420" />
        </mesh>
        <mesh position={[-0.33, -0.08, 0.42]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ff8a8a" />
        </mesh>
        <mesh position={[0.33, -0.08, 0.42]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ff8a8a" />
        </mesh>
        <mesh ref={mouth} position={[0, -0.08, 0.5]}>
          <torusGeometry args={[0.14, 0.03, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#7a2e2e" />
        </mesh>
      </group>
    </group>
  );
}

export default function WelcomeCharacterScene({ mood = "idle" }) {
  return (
    <div className="character-canvas" role="img" aria-label="3D cartoon character">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 4], fov: 40 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <Character mood={mood} />
      </Canvas>
    </div>
  );
}