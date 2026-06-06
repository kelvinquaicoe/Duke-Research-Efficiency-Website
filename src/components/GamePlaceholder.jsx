import { useState } from "react";
import "./GamePlaceholder.css";

export default function GamePlaceholder() {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="game-wrapper">
      <div className="game-frame">
        <iframe
          className="godot-game"
          src="/game/index.html"
          title="Cluster Command Game"
          onLoad={() => setHasError(false)}
          onError={() => setHasError(true)}
        />
        {hasError && (
          <div className="game-fallback">
            <h2>Game not found</h2>
            <p>
              The Godot web export is not in place yet. Add the exported files to
              <code>/public/game/</code> and reload.
            </p>
            <p className="hint">
              Expected files: <code>index.html</code>, <code>index.js</code>, <code>index.wasm</code>, <code>index.pck</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}