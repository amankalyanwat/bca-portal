import { useEffect, useState } from "react";
import { onDisconnect, onValue, ref, remove, set } from "firebase/database";
import { rtdb } from "../firebase";

export default function useMultiplayer(user, position) {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    if (!user) return undefined;
    const playerRef = ref(rtdb, `worldPresence/${user.uid}`); const allRef = ref(rtdb, "worldPresence");
    const leave = onDisconnect(playerRef); leave.remove().catch(() => {});
    const unsubscribe = onValue(allRef, (snapshot) => setPlayers(Object.entries(snapshot.val() || {}).filter(([id]) => id !== user.uid).map(([id, value]) => ({ id, ...value }))), () => setPlayers([]));
    return () => { unsubscribe(); remove(playerRef).catch(() => {}); };
  }, [user]);
  useEffect(() => {
    if (!user || !position) return;
    const timer = window.setTimeout(() => set(ref(rtdb, `worldPresence/${user.uid}`), { x: position.x, y: position.y, z: position.z, name: user.displayName || user.email?.split("@")[0] || "Student", updatedAt: Date.now() }).catch(() => {}), 80);
    return () => window.clearTimeout(timer);
  }, [user, position?.x, position?.y, position?.z]);
  return players;
}
