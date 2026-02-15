# ZotKeeper — Recipe Recommendation Frontend

Frontend for a recipe recommendation app: daily feed, search with filters and preference weights, recipe detail, and profile with saved recipes and preference settings.

**Data:** The app uses **[TheMealDB](https://www.themealdb.com/)** for recipes (free API, no key required). Feed is built from category filters (Beef, Chicken, Seafood, etc.); search uses meal name; detail and saved recipes use lookup by id. Local data in `src/data/` is no longer used by default.

## Run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

---

## Pages / Routes

| Route | Description |
|-------|-------------|
| **/** | Home — Daily feed with “Today’s Picks” hero and load-more feed. Cards: big image, title, hook, tags, save button. |
| **/search** | Search — Keyword + filters (time, budget, cuisine, diet, difficulty, calories, include/exclude ingredients). Results ranked by match + **preference weights** (cuisine sliders, diet toggles from Profile). |
| **/recipe/:id** | Recipe detail — Cover image, title, rating, time, servings, ingredients, steps, nutrition, “Why recommended”, save button. |
| **/profile** | Profile — Mock user; tabs: **Saved Recipes** (grid/list, sort by recent / cook time / rating), **Preference Settings** (cuisine 0–5, diet toggles, spice, disliked ingredients, default budget/time). All persisted in `localStorage`. |

---

## Structure

```
src/
├── App.jsx                 # Routes + Layout
├── main.jsx                # BrowserRouter + App
├── index.css               # Tailwind + app-bg + heart-pop animation
├── components/
│   ├── layout/             # Layout.jsx, Nav.jsx (top nav desktop, bottom nav mobile)
│   ├── feed/               # FeedCard, Feed, HeroPicks
│   ├── search/             # SearchBar, FilterPanel (collapsible), SearchResults
│   ├── recipe/             # WhyRecommended, NutritionSummary
│   └── profile/            # ProfileHeader, SavedRecipesTab, PreferenceSettingsTab
├── pages/
│   ├── HomePage.jsx        # Feed ranking (popularity + date seed + preference boost)
│   ├── SearchPage.jsx      # Keyword + filters + preference ranking
│   ├── RecipeDetailPage.jsx # Full recipe view
│   └── ProfilePage.jsx      # Saved + Preference tabs
├── api/
│   ├── themealdb.js       # TheMealDB client (search, lookup, filter by category, feed)
│   └── spoonacular.js     # Legacy Spoonacular client (unused)
├── data/
│   ├── recipeData.js      # Local getRecipeById/getAllRecipes (fallback/unused by default)
│   ├── epicuriousRecipes.json  # Local recipes (optional)
│   └── mockRecipes.js     # Mock fallback
├── hooks/
│   ├── useFeedRecipes.js  # TheMealDB feed (getFeedMeals + rank)
│   ├── useSearchRecipes.js # TheMealDB search + client-side filter/rank
│   ├── useRecipeById.js   # TheMealDB lookup by id
│   ├── useSavedRecipesData.js # TheMealDB bulk lookup for saved IDs
│   ├── useSavedRecipes.js # localStorage saved IDs; isSaved, toggleSaved
│   └── usePreferences.js # localStorage preferences
├── utils/
│   ├── feedRanking.js      # rankFeedRecipes(recipes, preferences)
│   └── searchRanking.js    # filterAndRankRecipes(recipes, keyword, filters, preferences)
└── constants/
    └── preferences.js     # CUISINE_OPTIONS, DIET_OPTIONS, TIME/BUDGET/DIFFICULTY, DEFAULT_PREFERENCES
```

---

## Behavior

- **Feed**: Rank = `popularityScore` + date-seeded randomness + boost if recipe matches user cuisine weights / diet toggles.
- **Search**: Filter by keyword and panel filters; rank by rating/popularity + preference boost. Profile “disliked ingredients” are merged into search exclude list.
- **Saved recipes**: Stored as IDs in `localStorage`; Profile → Saved Recipes shows them with grid/list and sort.
- **Preferences**: Stored in `localStorage`; used for feed and search ranking and for default budget/time.

---

## Tech

- React 18, React Router 6, Vite, Tailwind CSS. Functional components and hooks only. Mobile-first layout; bottom nav on mobile, top nav on desktop.
# ZotKeeper-
