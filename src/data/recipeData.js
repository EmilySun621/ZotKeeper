/**
 * Recipe data: default = LOCAL (no API, no cost).
 * Uses Epicurious JSON (scripts/load_epicurious.py) or mock fallback.
 * Spoonacular API is optional — enable in settings if you want online search (uses points).
 */

import epicuriousRecipes from './epicuriousRecipes.json'
import { MOCK_RECIPES } from './mockRecipes'

const LOCAL_RECIPES = Array.isArray(epicuriousRecipes) && epicuriousRecipes.length > 0
  ? epicuriousRecipes
  : MOCK_RECIPES

export function getRecipeById(id) {
  return LOCAL_RECIPES.find((r) => r.id === id) ?? null
}

export function getAllRecipes() {
  return [...LOCAL_RECIPES]
}
