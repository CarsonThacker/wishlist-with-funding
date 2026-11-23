type BrandMarkProps = { className?: string }

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <a href="/" aria-label="If You Ask home" className={`inline-flex min-h-11 items-center gap-2.5 text-gray-950 ${className}`}>
      <img src="/if-you-ask-logo.jpeg" alt="" aria-hidden="true" className="size-10 object-contain" />
      <span className="font-semibold tracking-tight">If You Ask</span>
    </a>
  )
}
