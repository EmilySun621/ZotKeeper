# ZotKeeper — Recipe Recommendation App

ZotKeeper is a recipe discovery app with a daily feed, keyword search, and profile-based personalization. It uses a small Node proxy to keep the Spoonacular API key server-side.

**Data source:** [Spoonacular Food API](https://spoonacular.com/food-api) via the local proxy in `server/`.

---

## Quick Start (Dev)

### 1) Start the API proxy

```bash
cd server
npm install
# Create server/.env and set your key:
# SPOONACULAR_API_KEY=your_key_here
npm run dev
```

The proxy runs at `http://localhost:3001`.

### 2) Start the frontend

```bash
cd ..
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`).

**Production note:** set `VITE_RECIPE_API_URL` to your deployed proxy URL.

---

## How to Use

- **Sign up / log in** (local demo auth stored in `localStorage`).
- **Browse** the daily feed and explore cuisines by region.
- **Search** with filters (time, budget, diet, calories, include/exclude ingredients).
- **Save recipes** with the heart icon.
- **Set preferences** to personalize ranking (cuisine weights, dietary toggles, allergies, nutrition priorities, default budget/time).

---

## Pages / Routes

| Route | Description |
|-------|-------------|
| **/** | Home — Daily feed, hero picks, and explore by region. |
| **/map** | Region explorer — choose cuisine and browse results. |
| **/search** | Search — keyword + filters with preference-aware ranking. |
| **/recipe/:id** | Recipe detail — summary, ingredients, steps, nutrition, save button. |
| **/profile** | Profile — saved recipes + preference settings. |
| **/login** | Local demo login/signup. |

---

## Ranking & Preferences (Current)

- **Search ranking** = Relevance + Preference + Quality  
  - Preference uses cuisine weights, diet toggles, default budget/time, and nutrition priorities (low-calorie, high-protein, low-carb, budget-friendly).
  - Allergies/disliked ingredients are used as hard exclusions.
- **Feed ranking** = popularity + date-seeded randomness + preference boosts.

---

## Project Structure (Key Files)

```
server/
└── index.js                 # Express proxy for Spoonacular

src/
├── App.jsx                  # Routes + layout
├── api/
│   └── recipesBackend.js    # Client for /api/* proxy
├── hooks/
│   ├── useFeedRecipes.js    # Feed fetch + ranking
│   ├── useSearchRecipes.js  # Search fetch + filtering + ranking
│   ├── useRecipeById.js     # Detail fetch
│   ├── useSavedRecipes.js   # Per-user saved IDs
│   └── usePreferences.js    # Per-user preferences
├── pages/
│   ├── HomePage.jsx
│   ├── MapPage.jsx
│   ├── SearchPage.jsx
│   ├── RecipeDetailPage.jsx
│   └── ProfilePage.jsx
├── utils/
│   ├── feedRanking.js
│   └── searchRanking.js
└── constants/
    └── preferences.js
```

---

## Tech

- React 18, React Router 6, Vite, Tailwind CSS
