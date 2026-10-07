import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

export default function InteractiveZone({ zone, player, onNear, onInteract }) {
  const [near, setNear] = useState(false); const ring = useRef();
  useFrame((state) => { if (ring.current) ring.current.rotation.z += state.clock.getDelta() * .35; const distance = Math.hypot(player.x - zone.position[0], player.z - zone.position[2]); const inside = distance < zone.radius; if (inside !== near) { setNear(inside); onNear(inside ? zone : null); } });
  return <group position={zone.position}><mesh rotation={[-Math.PI / 2, 0, 0]} ref={ring}><ringGeometry args={[zone.radius - .08, zone.radius, 40]} /><meshBasicMaterial color={zone.color} transparent opacity={.8} /></mesh><mesh position={[0, .15, 0]}><cylinderGeometry args={[.55, .7, .3, 6]} /><meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={.25} /></mesh>{near && <Html center distanceFactor={12}><button className="world-prompt" onClick={() => onInteract(zone)}><b>E</b> Explore {zone.name}</button></Html>}</group>;
}
