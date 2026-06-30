import type { SlurmMood } from '../game/types';

const slurmImg = '/snail.png';

interface SlurmOProps {
  message: string;
  mood: SlurmMood;
}

export function SlurmO({ message, mood }: SlurmOProps) {
  const glowColor = mood === 'happy' || mood === 'excited'
    ? '#53d5fd'
    : mood === 'worried'
    ? '#ff4444'
    : '#aaa';

  const bounce = mood === 'excited' ? 'animate-bounce' : '';

  return (
    <div className="flex items-end gap-3 select-none">
      <div
        className={`relative flex-shrink-0 ${bounce}`}
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        <img
          src={slurmImg}
          alt="Slurm-O the cyber snail"
          className="w-16 h-16 object-contain pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
        {mood === 'excited' && (
          <div className="absolute -top-1 -right-1 text-xs animate-ping">⚡</div>
        )}
      </div>

      <div className="relative max-w-xs">
        {/* Speech bubble */}
        <div
          className="relative rounded-lg px-3 py-2 text-sm font-mono leading-snug"
          style={{
            background: 'rgba(10,10,20,0.95)',
            border: `1px solid ${glowColor}`,
            boxShadow: `0 0 8px ${glowColor}33`,
            color: '#e0f8ff',
          }}
        >
          <div
            className="absolute -left-2 bottom-3 w-0 h-0"
            style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: `8px solid ${glowColor}`,
            }}
          />
          <span className="font-bold" style={{ color: glowColor }}>Slurm-O: </span>
          {message}
        </div>
      </div>
    </div>
  );
}
