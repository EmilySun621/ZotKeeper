import { TRAVEL_CONTEXT_KEYS, DEFAULT_TRAVEL_CONTEXT } from '../../types/context'
import { TRAVEL_LABELS } from '../../constants/labels'
import SelectField from './SelectField'

export default function TravelContextForm({ context, onChange }) {
  const ctx = { ...DEFAULT_TRAVEL_CONTEXT, ...context }

  const set = (key, value) => onChange({ ...ctx, [key]: value })

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-tomato-500">
        Your context
      </h3>
      <SelectField
        id="t-weather"
        label="Weather"
        value={ctx.weather}
        options={TRAVEL_CONTEXT_KEYS.weather}
        labels={TRAVEL_LABELS.weather}
        onChange={(v) => set('weather', v)}
      />
      <SelectField
        id="t-timeAvailable"
        label="Time available"
        value={ctx.timeAvailable}
        options={TRAVEL_CONTEXT_KEYS.timeAvailable}
        labels={TRAVEL_LABELS.timeAvailable}
        onChange={(v) => set('timeAvailable', v)}
      />
      <SelectField
        id="t-companion"
        label="Companion"
        value={ctx.companion}
        options={TRAVEL_CONTEXT_KEYS.companion}
        labels={TRAVEL_LABELS.companion}
        onChange={(v) => set('companion', v)}
      />
      <SelectField
        id="t-energy"
        label="Energy level"
        value={ctx.energy}
        options={TRAVEL_CONTEXT_KEYS.energy}
        labels={TRAVEL_LABELS.energy}
        onChange={(v) => set('energy', v)}
      />
    </div>
  )
}
