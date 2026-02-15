export default function WhyRecommended({ text }) {
  if (!text) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <h4 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-amber-800">
        Why recommended
      </h4>
      <p className="text-sm text-amber-900">{text}</p>
    </div>
  )
}
