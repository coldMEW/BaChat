'use client'

interface Props {
  value: number       // 0..1
  size?: number
  stroke?: number
  color: string
  trackColor?: string
  label?: string
  sublabel?: string
}

export function BudgetProgressRing({
  value,
  size = 120,
  stroke = 10,
  color,
  trackColor = 'var(--bg-card-soft)',
  label,
  sublabel,
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const offset = c * (1 - v)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="font-mono font-semibold tabular-nums" style={{ fontSize: 28, color: 'var(--text-primary)', lineHeight: 1 }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
