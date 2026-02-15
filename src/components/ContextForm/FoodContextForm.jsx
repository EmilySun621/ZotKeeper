import { FOOD_CONTEXT_KEYS, DEFAULT_FOOD_CONTEXT } from '../../types/context'
import { FOOD_LABELS } from '../../constants/labels'
import SelectField from './SelectField'

export default function FoodContextForm({ context, onChange }) {
  const ctx = { ...DEFAULT_FOOD_CONTEXT, ...context }

  const set = (key, value) => onChange({ ...ctx, [key]: value })

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
        Your context
      </h3>
      <SelectField
        id="timeOfDay"
        label="Time of day"
        value={ctx.timeOfDay}
        options={FOOD_CONTEXT_KEYS.timeOfDay}
        labels={FOOD_LABELS.timeOfDay}
        onChange={(v) => set('timeOfDay', v)}
      />
      <SelectField
        id="location"
        label="Location"
        value={ctx.location}
        options={FOOD_CONTEXT_KEYS.location}
        labels={FOOD_LABELS.location}
        onChange={(v) => set('location', v)}
      />
      <SelectField
        id="budget"
        label="Budget"
        value={ctx.budget}
        options={FOOD_CONTEXT_KEYS.budget}
        labels={FOOD_LABELS.budget}
        onChange={(v) => set('budget', v)}
      />
      <SelectField
        id="mood"
        label="Mood / energy"
        value={ctx.mood}
        options={FOOD_CONTEXT_KEYS.mood}
        labels={FOOD_LABELS.mood}
        onChange={(v) => set('mood', v)}
      />
      <SelectField
        id="timeAvailable"
        label="Time available"
        value={ctx.timeAvailable}
        options={FOOD_CONTEXT_KEYS.timeAvailable}
        labels={FOOD_LABELS.timeAvailable}
        onChange={(v) => set('timeAvailable', v)}
      />
      <SelectField
        id="weather"
        label="Weather"
        value={ctx.weather}
        options={FOOD_CONTEXT_KEYS.weather}
        labels={FOOD_LABELS.weather}
        onChange={(v) => set('weather', v)}
      />
      <SelectField
        id="dietary"
        label="Dietary"
        value={ctx.dietary}
        options={FOOD_CONTEXT_KEYS.dietary}
        labels={FOOD_LABELS.dietary}
        onChange={(v) => set('dietary', v)}
      />
      <SelectField
        id="noise"
        label="Noise"
        value={ctx.noise}
        options={FOOD_CONTEXT_KEYS.noise}
        labels={FOOD_LABELS.noise}
        onChange={(v) => set('noise', v)}
      />
      <SelectField
        id="partySize"
        label="Party size"
        value={ctx.partySize}
        options={FOOD_CONTEXT_KEYS.partySize}
        labels={FOOD_LABELS.partySize}
        onChange={(v) => set('partySize', v)}
      />
      <div className="space-y-1.5">
        <label htmlFor="ingredients" className="block text-sm font-medium text-stone-500">
          Ingredients you have (optional)
        </label>
        <input
          id="ingredients"
          type="text"
          value={ctx.ingredients}
          onChange={(e) => set('ingredients', e.target.value)}
          placeholder="e.g. eggs, bread"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition focus:border-tomato-500 focus:outline-none focus:ring-2 focus:ring-tomato-400/20"
        />
      </div>
    </div>
  )
}
