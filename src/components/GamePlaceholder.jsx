import { useEffect, useState } from "react";
import App from "../game/src/App.tsx";
import "./GamePlaceholder.css";

export default function GamePlaceholder() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="game-placeholder-wrapper">
      <div className={`game-placeholder-frame${isReady ? " is-ready" : ""}`}>
        <div className="game-placeholder-loading" aria-hidden={isReady}>
          <div className="game-placeholder-loading-title">Loading Cluster Command</div>
          <div className="game-placeholder-loading-subtitle">Initializing game systems...</div>
        </div>
        <div className="game-placeholder-content">
          <App embedded />
        </div>
      </div>
    </div>
  );
}
