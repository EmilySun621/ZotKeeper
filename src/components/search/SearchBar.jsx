export default function SearchBar({ value, onChange, placeholder = 'Search recipes, ingredients, cuisine...' }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-tomato-500 focus:outline-none focus:ring-2 focus:ring-tomato-400/20"
      />
    </div>
  )
}
