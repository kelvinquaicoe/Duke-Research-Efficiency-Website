import App from "../game/src/app/App.tsx";
import "./GamePlaceholder.css";

export default function GamePlaceholder() {
  return (
    <div className="game-wrapper">
      <div className="game-frame">
        <App embedded />
      </div>
    </div>
  );
}
