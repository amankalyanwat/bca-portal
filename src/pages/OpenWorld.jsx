import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Canvas3D from "../components/3d/Canvas3D";
import HUD from "../components/ui/HUD";
import ZoneModal from "../components/ui/Modals/ZoneModal";
import useControls from "../hooks/useControls";
import useMultiplayer from "../hooks/useMultiplayer";
import { useAuth } from "../AuthContext";
export default function OpenWorld() { const navigate=useNavigate(); const controls=useControls(); const [player,setPlayer]=useState({x:0,y:1,z:8}); const [zone,setZone]=useState(null); const [nearby,setNearby]=useState(null); const {user}=useAuth(); const players=useMultiplayer(user,player); const openZone=(value)=>setZone(value); return <main className="open-world"><Canvas3D controls={controls} player={player} onPlayer={setPlayer} remotePlayers={players} onZone={openZone} onNearby={setNearby} /><HUD onBack={()=>navigate("/")} controls={controls} nearby={nearby} /><ZoneModal zone={zone} onClose={()=>setZone(null)} /><div className="world-zone-list">{["Materials Library","MCQ Arena","Doubt Forum","Code Lab"].map((name)=><span key={name}>{name}</span>)}</div></main>; }
