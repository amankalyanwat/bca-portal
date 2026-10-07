import { useEffect, useState } from "react";

const watched = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyE"]);
export default function useControls() {
  const [keys, setKeys] = useState({});
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const update = (pressed) => (event) => { if (watched.has(event.code)) { if (["Space", "KeyE"].includes(event.code)) event.preventDefault(); setKeys((current) => ({ ...current, [event.code]: pressed })); } };
    const down = update(true); const up = update(false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return { keys, joystick, setJoystick };
}
