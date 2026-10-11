interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export function ScoreGauge({ score, label = 'Santé financière', size = 200 }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(20, score));
  const pct = clamped / 20;
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = clamped >= 16 ? 'hsl(var(--success))' : clamped >= 8 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 200 110" width={size} height={size * 0.55}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth={14} strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="-mt-8 flex flex-col items-center">
        <span className="font-display text-4xl font-medium tabular">{clamped.toFixed(0)}<span className="text-lg text-muted-foreground">/20</span></span>
        <span className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
