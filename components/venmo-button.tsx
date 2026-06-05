'use client'

interface VenmoButtonProps {
  itemName: string
  suggestedAmount?: number
}

export function VenmoButton({ itemName, suggestedAmount }: VenmoButtonProps) {
  const username = 'carsonthacker'
  const note = encodeURIComponent(`Helping fund: ${itemName} 🎁`)
  const amount = suggestedAmount ? `&amount=${suggestedAmount}` : ''
  const venmoUrl = `https://venmo.com/${username}?txn=pay&note=${note}${amount}`

  return (
    <a
      href={venmoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:scale-[1.02]"
      style={{ backgroundColor: '#3D95CE', color: '#fff' }}
    >
      {/* Venmo logo mark */}
      <svg width="18" height="18" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M93.8 6.5c3.1 5.1 4.5 10.4 4.5 17.1 0 21.3-18.2 49-33 68.4H32.8L11.3 10.1l38.3-3.6 11.1 44.7C68.5 38.3 76.5 22.1 76.5 9.8c0-5.1-1-9.6-2.7-13.3L93.8 6.5z"
          fill="white"
        />
      </svg>
      Fund with Venmo
    </a>
  )
}
