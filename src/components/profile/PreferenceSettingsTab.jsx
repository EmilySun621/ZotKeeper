import { useState, useEffect } from 'react'
import {
  CUISINE_OPTIONS,
  BUDGET_OPTIONS,
  TIME_OPTIONS,
} from '../../constants/preferences'
import { DIETARY_OPTIONS, ALLERGY_OPTIONS, SPICE_OPTIONS } from '../../data/profileOptions'
import { usePreferences } from '../../hooks/usePreferences'

/** Map display label to dietToggles key */
function dietKey(label) {
  const map = {
    Vegetarian: 'vegetarian',
    Vegan: 'vegan',
    Pescatarian: 'pescatarian',
    'No red meat': 'no-red-meat',
    'No pork': 'no-pork',
    'No beef': 'no-beef',
    'No seafood': 'no-seafood',
    Halal: 'halal',
    Kosher: 'kosher',
    'Gluten-free': 'gluten-free',
    'Dairy-free': 'dairy-free',
    'Low carb': 'low-carb',
    'Low sugar': 'low-sugar',
  }
  return map[label] ?? label.toLowerCase().replace(/\s+/g, '-')
}

const spiceToValue = { "Can't do spicy": 0, 'Mild is okay': 2, 'Love spicy': 5 }

export default function PreferenceSettingsTab() {
  const { preferences, setCuisineWeight, setDietToggle, update, addDislikedIngredient, removeDislikedIngredient } = usePreferences()
  const [dislikeInput, setDislikeInput] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  useEffect(() => {
    if (!showSaved) return
    const t = setTimeout(() => setShowSaved(false), 2000)
    return () => clearTimeout(t)
  }, [showSaved])

  const { cuisineWeights, dietToggles, spiceLevel, dislikedIngredients, budgetDefault, timeDefault } = preferences

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Dietary preferences
        </h3>
        <p className="mb-3 text-xs text-stone-500">
          Pick any that apply. We’ll avoid ingredients that don’t fit.
        </p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((label) => {
            const key = dietKey(label)
            const on = !!dietToggles[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDietToggle(key, !on)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  on ? 'bg-sage-500 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Allergies to avoid
        </h3>
        <p className="mb-3 text-xs text-stone-500">
          Select allergens to exclude from recommendations.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((label) => {
            const key = label.trim().toLowerCase()
            const on = dislikedIngredients.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => (on ? removeDislikedIngredient(key) : addDislikedIngredient(label))}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  on ? 'bg-rose-100 text-red-600' : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Cuisine preference (0–5)
        </h3>
        <p className="mb-3 text-xs text-stone-500">
          Higher = recipes from this cuisine rank higher in feed and search. Changes save automatically.
        </p>
        {showSaved && (
          <p className="mb-2 text-sm font-medium text-sage-600" role="status">Saved — search will use this order.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.slice(0, 12).map((c) => (
            <div key={c} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
              <span className="w-20 truncate text-sm text-stone-700">{c}</span>
              <input
                type="range"
                min="0"
                max="5"
                value={cuisineWeights[c] ?? 0}
                onChange={(e) => {
                  setCuisineWeight(c, Number(e.target.value))
                  setShowSaved(true)
                }}
                className="h-2 w-24 accent-tomato-500"
              />
              <span className="w-4 text-sm font-medium text-stone-500">{cuisineWeights[c] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Spice level
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {SPICE_OPTIONS.map((label) => {
            const value = spiceToValue[label]
            const on = (spiceLevel ?? 2) === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => update({ spiceLevel: value })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  on ? 'bg-tomato-500 text-stone-800' : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            value={spiceLevel ?? 2}
            onChange={(e) => update({ spiceLevel: Number(e.target.value) })}
            className="h-3 w-40 accent-tomato-500"
          />
          <span className="text-sm font-medium text-stone-700">{spiceLevel ?? 2}</span>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Default budget & time
        </h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Budget</label>
            <select
              value={budgetDefault ?? 'medium'}
              onChange={(e) => update({ budgetDefault: e.target.value })}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm"
            >
              {BUDGET_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Time</label>
            <select
              value={timeDefault ?? 'medium'}
              onChange={(e) => update({ timeDefault: e.target.value })}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm"
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
          Disliked ingredients
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={dislikeInput}
            onChange={(e) => setDislikeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDislikedIngredient(dislikeInput), setDislikeInput(''))}
            placeholder="Add ingredient to exclude"
            className="flex-1 rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => { addDislikedIngredient(dislikeInput); setDislikeInput(''); }}
            className="rounded-lg bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300"
          >
            Add
          </button>
        </div>
        {dislikedIngredients?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dislikedIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs text-red-600"
              >
                {ing}
                <button type="button" onClick={() => removeDislikedIngredient(ing)} aria-label={`Remove ${ing}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">Saved in localStorage. Used to filter search when you add them to exclude list.</p>
      </section>
    </div>
  )
}
