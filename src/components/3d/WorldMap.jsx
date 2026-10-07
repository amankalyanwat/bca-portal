import { Cloud, Detailed, Sky, Stars } from "@react-three/drei";
import { CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

const buildings = [[-9,0,-5,"#ef476f"],[8,0,-6,"#7c5ce0"],[-8,0,8,"#0fa3b1"],[8,0,8,"#f4a261"],[0,0,-12,"#2a9d8f"]];
function Building({ data }) { const [x,y,z,color] = data; return <group position={[x,y,z]}><Detailed distances={[0,18,35]}><mesh castShadow><boxGeometry args={[3,4,3]} /><meshStandardMaterial color={color} flatShading /></mesh><mesh castShadow><boxGeometry args={[2.2,2.8,2.2]} /><meshStandardMaterial color={color} flatShading /></mesh><mesh><boxGeometry args={[1,1,1]} /><meshStandardMaterial color={color} /></mesh></Detailed><mesh position={[0,2.35,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[2.6,1.5,4]} /><meshStandardMaterial color="#f8fafc" flatShading /></mesh><CuboidCollider args={[1.5,2,1.5]} position={[0,2,0]} /></group>; }
export default function WorldMap() { return <><color attach="background" args={["#9cd9f5"]} /><fog attach="fog" args={["#9cd9f5",30,70]} /><Sky distance={450000} sunPosition={[50,25,-40]} turbidity={7} rayleigh={1.5} /><Stars radius={90} depth={40} count={1000} factor={3} fade /><ambientLight intensity={.7} /><directionalLight position={[16,25,10]} intensity={1.8} castShadow shadow-mapSize={[1024,1024]} shadow-camera-far={70} />
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow frustumCulled><circleGeometry args={[31,64]} /><meshStandardMaterial color="#72b765" flatShading /></mesh><CuboidCollider args={[31,.2,31]} position={[0,-.2,0]} />
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.02,0]} receiveShadow><planeGeometry args={[5,57]} /><meshStandardMaterial color="#d7c6a4" /></mesh><mesh rotation={[-Math.PI/2,0,Math.PI/2]} position={[0,.025,0]} receiveShadow><planeGeometry args={[5,57]} /><meshStandardMaterial color="#d7c6a4" /></mesh>
  {buildings.map((building, index) => <Building data={building} key={index} />)}
  {[[-16,-15],[16,-15],[-16,15],[16,15],[-20,0],[20,0]].map(([x,z], index) => <group position={[x,0,z]} key={index}><mesh position={[0,2,0]} castShadow><cylinderGeometry args={[.18,.28,4,6]} /><meshStandardMaterial color="#7b4f31" flatShading /></mesh><mesh position={[0,4.2,0]} castShadow><coneGeometry args={[1.5,3.5,7]} /><meshStandardMaterial color="#3d8c59" flatShading /></mesh></group>)}
  <Cloud position={[-14,12,-20]} speed={.08} opacity={.35} /><Cloud position={[15,15,-10]} speed={.05} opacity={.3} />
</>; }
