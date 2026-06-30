import Game from './Game';
import './index.css';

type AppProps = {
  embedded?: boolean;
};

export default function App({ embedded = false }: AppProps) {
  return (
    <div className={`cluster-command-game${embedded ? ' is-embedded' : ''}`}>
      <Game />
    </div>
  );
}
