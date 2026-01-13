import { useEffect, useState } from "react";

export default function GameTimer({ 
  start, 
  isPaused, 
  onTimeUpdate 
}: { 
  start: number; 
  isPaused: boolean;
  onTimeUpdate?: (seconds: number) => void;
}) {
  const [seconds, setSeconds] = useState(start);

  useEffect(() => {
    setSeconds(start);
  }, [start]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (onTimeUpdate) onTimeUpdate(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return <span className="font-mono tabular-nums">{formatTime(seconds)}</span>;
}