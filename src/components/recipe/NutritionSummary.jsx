/**
 * Nutrition summary for recipe detail (from Spoonacular when available).
 */
export default function NutritionSummary({ recipe }) {
  const nut = recipe?.nutrition
  const items = [
    { label: 'Calories', value: nut?.calories ?? recipe?.calories ?? '—' },
    { label: 'Protein', value: nut?.protein != null ? `${nut.protein}g` : '—' },
    { label: 'Carbs', value: nut?.carbs != null ? `${nut.carbs}g` : '—' },
    { label: 'Fat', value: nut?.fat != null ? `${nut.fat}g` : '—' },
  ]

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 font-display text-sm font-semibold text-stone-800">
        Nutrition (per serving)
      </h4>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        {items.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <dt className="text-stone-500">{label}</dt>
            <dd className="font-medium text-stone-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
