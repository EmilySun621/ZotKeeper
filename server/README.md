# Recipe API (Spoonacular proxy)

Proxies Spoonacular API so the API key stays server-side. Uses in-memory cache (≤1 hour) to save points.

## Setup

1. **Install and run**
   ```bash
   cd server
   npm install
   cp ../.env.example .env   # or create server/.env
   # Edit .env and set SPOONACULAR_API_KEY=your_key
   npm run dev
   ```
   Server runs at `http://localhost:3001`.

2. **Frontend**  
   In dev, Vite proxies `/api/search`, `/api/cuisines`, `/api/recipes` to this server. No `VITE_RECIPE_API_URL` needed.  
   For production, set `VITE_RECIPE_API_URL` to your deployed recipe API URL.

## Endpoints

- `POST /api/search` — body: `{ keyword, filters, limit }` → Spoonacular `complexSearch` with `addRecipeInformation=true` (no nutrition in list to save points).
- `GET /api/cuisines` — returns supported cuisine tags.
- `GET /api/recipes/:id` — single recipe with nutrition (detail page).
- `GET /api/recipes/bulk?ids=1,2,3` — bulk info for saved recipes (1 point for many).

## Points

- Cache TTL ~58 min. List/search: no `addRecipeNutrition`. Nutrition only on detail and bulk when needed.
