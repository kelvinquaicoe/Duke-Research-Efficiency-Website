import type { GameEvent } from '../game/types';

interface EventBannerProps {
  events: GameEvent[];
  onDismiss: (id: string) => void;
  tick: number;
}

const EVENT_STYLE = {
  gpu_surge: { color: '#53d5fd', icon: '⚡', bg: '#001830' },
  deadline: { color: '#ffcc44', icon: '⏰', bg: '#1a1000' },
  maintenance: { color: '#aaaaaa', icon: '🔧', bg: '#111111' },
  node_failure: { color: '#ff4444', icon: '💀', bg: '#1a0000' },
  cooling: { color: '#ff8833', icon: '🌡', bg: '#1a0a00' },
};

export function EventBanner({ events, onDismiss, tick }: EventBannerProps) {
  const active = events.filter(e => !e.resolved);
  if (active.length === 0) return null;

  return (
    <div className="px-4 py-1.5 space-y-1">
      {active.map(event => {
        const style = EVENT_STYLE[event.type];
        const remaining = Math.max(0, event.durationTicks - (tick - event.startTick));
        const pct = 1 - remaining / event.durationTicks;

        return (
          <div
            key={event.id}
            className="relative flex items-center gap-3 rounded-lg px-3 py-2 overflow-hidden"
            style={{
              background: style.bg,
              border: `1px solid ${style.color}55`,
              boxShadow: `0 0 8px ${style.color}22`,
            }}
          >
            {/* Progress drain */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${style.color}11 ${pct * 100}%, transparent ${pct * 100}%)`,
              }}
            />
            <span className="text-base relative z-10">{style.icon}</span>
            <div className="flex-1 relative z-10">
              <div className="text-xs font-bold font-mono" style={{ color: style.color }}>{event.title}</div>
              <div className="text-xs text-gray-500">{event.description}</div>
            </div>
            <button
              onClick={() => onDismiss(event.id)}
              className="relative z-10 text-xs px-2 py-0.5 rounded font-mono transition-all hover:opacity-70"
              style={{ color: style.color, border: `1px solid ${style.color}55` }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
