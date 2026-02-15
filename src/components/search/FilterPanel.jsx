import { useState } from 'react'
import {
  TIME_OPTIONS,
  BUDGET_OPTIONS,
  DIFFICULTY_OPTIONS,
  CUISINE_OPTIONS,
  DIET_OPTIONS,
} from '../../constants/preferences'

const defaultFilters = {
  time: '',
  budget: '',
  cuisines: [],
  diets: [],
  difficulty: '',
  caloriesMin: '',
  caloriesMax: '',
  includeIngredient: '',
  excludeIngredients: [],
}

function toggleInList(list, item) {
  if (list.includes(item)) return list.filter((x) => x !== item)
  return [...list, item]
}

export default function FilterPanel({ filters, onChange, preferences }) {
  const [open, setOpen] = useState(false)
  const [excludeInput, setExcludeInput] = useState('')

  const f = { ...defaultFilters, ...filters }

  const set = (key, value) => onChange({ ...f, [key]: value })

  const toggleCuisine = (c) => set('cuisines', toggleInList(f.cuisines, c))
  const toggleDiet = (d) => set('diets', toggleInList(f.diets, d))

  const addExclude = () => {
    const v = excludeInput.trim().toLowerCase()
    if (v && !f.excludeIngredients.includes(v)) {
      set('excludeIngredients', [...f.excludeIngredients, v])
      setExcludeInput('')
    }
  }

  const removeExclude = (ing) => {
    set('excludeIngredients', f.excludeIngredients.filter((x) => x !== ing))
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-warm">
      {/* Collapsible trigger on mobile */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-stone-800 md:hidden"
      >
        Filters & preferences
        <span className="text-stone-500">{open ? '▲' : '▼'}</span>
      </button>

      <div className={`px-4 pb-4 ${open ? 'block' : 'hidden'} md:block`}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Time</label>
            <select
              value={f.time}
              onChange={(e) => set('time', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-cream-50 px-3 py-2 text-sm focus:border-tomato-400 focus:ring-2 focus:ring-tomato-400/20"
            >
              <option value="">Any</option>
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Budget</label>
            <select
              value={f.budget}
              onChange={(e) => set('budget', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-cream-50 px-3 py-2 text-sm focus:border-tomato-400 focus:ring-2 focus:ring-tomato-400/20"
            >
              <option value="">Any</option>
              {BUDGET_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Cuisine (multi)</label>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_OPTIONS.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCuisine(c)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    f.cuisines.includes(c)
                      ? 'bg-tomato-500 text-white'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Your cuisine preference weights (in Profile) also boost ranking.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Diet (multi)</label>
            <div className="flex flex-wrap gap-1.5">
              {DIET_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiet(d)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    f.diets.includes(d)
                      ? 'bg-tomato-500 text-white'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Difficulty</label>
            <select
              value={f.difficulty}
              onChange={(e) => set('difficulty', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-cream-50 px-3 py-2 text-sm focus:border-tomato-400 focus:ring-2 focus:ring-tomato-400/20"
            >
              <option value="">Any</option>
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Cal min</label>
              <input
                type="number"
                min="0"
                value={f.caloriesMin}
                onChange={(e) => set('caloriesMin', e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full rounded-lg border border-stone-200 bg-cream-50 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Cal max</label>
              <input
                type="number"
                min="0"
                value={f.caloriesMax}
                onChange={(e) => set('caloriesMax', e.target.value ? Number(e.target.value) : '')}
                placeholder="999"
                className="w-full rounded-lg border border-stone-200 bg-cream-50 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Must include ingredient</label>
            <input
              type="text"
              value={f.includeIngredient}
              onChange={(e) => set('includeIngredient', e.target.value)}
              placeholder="e.g. chicken"
              className="w-full rounded-lg border border-stone-200 bg-cream-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-500">Exclude ingredients</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExclude())}
                placeholder="Add to exclude list"
                className="flex-1 rounded-lg border border-stone-200 bg-cream-50 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addExclude}
                className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300"
              >
                Add
              </button>
            </div>
            {f.excludeIngredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.excludeIngredients.map((ing) => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-red-600"
                  >
                    {ing}
                    <button type="button" onClick={() => removeExclude(ing)} aria-label={`Remove ${ing}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
