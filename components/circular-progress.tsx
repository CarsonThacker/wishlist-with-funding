'use client'

import { useEffect, useState } from 'react'

interface CircularProgressProps {
  percent: number
  size?: number
  strokeWidth?: number
  className?: string
}

function getColor(percent: number) {
  if (percent <= 20) return '#FF3B30'       // red
  if (percent <= 50) return '#FF9500'       // orange
  if (percent <= 80) return '#34C759'       // green
  return '#007AFF'                          // blue (almost there!)
}

export function CircularProgress({
  percent,
  size = 80,
  strokeWidth = 6,
  className = '',
}: CircularProgressProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100)
    return () => clearTimeout(timer)
  }, [percent])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPercent / 100) * circumference
  const color = getColor(percent)

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F2F2F7"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-semibold tabular-nums"
          style={{ fontSize: size * 0.18, color }}
        >
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  )
}
