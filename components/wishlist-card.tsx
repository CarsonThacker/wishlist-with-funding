'use client'

import { useState } from 'react'
import { CircularProgress } from './circular-progress'
import { VenmoButton } from './venmo-button'
import type { WishlistItem } from '@/lib/db/schema'

interface WishlistCardProps {
  item: WishlistItem
}

export function WishlistCard({ item }: WishlistCardProps) {
  const [showFund, setShowFund] = useState(false)

  const price = parseFloat(String(item.price))
  const saved = parseFloat(String(item.saved))
  const percent = price > 0 ? Math.min((saved / price) * 100, 100) : 0
  const remaining = Math.max(price - saved, 0)
  const isComplete = percent >= 100

  return (
    <div
      className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
      style={{
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isComplete && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Fully Funded!
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
          <CircularProgress percent={percent} size={64} strokeWidth={5} />
        </div>

        {/* Price bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span className="font-medium text-gray-600">${saved.toFixed(2)} saved</span>
            <span>${price.toFixed(2)} goal</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${percent}%`,
                background: percent <= 20
                  ? '#FF3B30'
                  : percent <= 50
                  ? '#FF9500'
                  : percent <= 80
                  ? '#34C759'
                  : '#007AFF',
              }}
            />
          </div>
          {remaining > 0 && (
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              ${remaining.toFixed(2)} to go
            </p>
          )}
        </div>

        {/* Fund button */}
        {!isComplete && (
          <div>
            {showFund ? (
              <div
                className="rounded-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ backgroundColor: '#F0F8FF' }}
              >
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Help Carson fund this! Send via Venmo:
                  <span className="font-bold text-gray-800 ml-1">@carsonthacker</span>
                </p>
                <VenmoButton itemName={item.name} suggestedAmount={Math.ceil(remaining / 4)} />
              </div>
            ) : (
              <button
                onClick={() => setShowFund(true)}
                className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:opacity-90"
                style={{ backgroundColor: '#3D95CE', color: '#fff' }}
              >
                Fund this gift
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
