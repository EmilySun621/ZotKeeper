export default function SelectField({ id, label, value, options, labels, onChange }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition focus:border-tomato-500 focus:outline-none focus:ring-2 focus:ring-tomato-400/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels ? labels[opt] ?? opt : opt}
          </option>
        ))}
      </select>
    </div>
  )
}
