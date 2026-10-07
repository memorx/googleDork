import { describe, expect, it } from 'vitest'
import { engines, buildSearchUrl } from './dorks'
import { getRecipeById, getRecipes, recipes } from './recipes'

describe('recipes data', () => {
  it('has between 8 and 12 recipes', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(8)
    expect(recipes.length).toBeLessThanOrEqual(12)
  })

  it('every recipe has required fields', () => {
    for (const recipe of recipes) {
      expect(recipe.id).toBeTruthy()
      expect(recipe.name).toBeTruthy()
      expect(recipe.description).toBeTruthy()
      expect(recipe.query).toBeTruthy()
      expect(recipe.engine).toBeTruthy()
      expect(recipe.steps.length).toBeGreaterThan(0)
      for (const step of recipe.steps) {
        expect(step).toBeTruthy()
      }
    }
  })

  it('recipe ids are unique', () => {
    const ids = recipes.map((recipe) => recipe.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every recipe uses a valid engine', () => {
    const engineIds = new Set(engines.map((engine) => engine.id))
    for (const recipe of recipes) {
      expect(engineIds.has(recipe.engine)).toBe(true)
    }
  })

  it('every recipe query builds a valid search URL', () => {
    for (const recipe of recipes) {
      expect(() => buildSearchUrl(recipe.engine, recipe.query)).not.toThrow()
      expect(buildSearchUrl(recipe.engine, recipe.query)).toMatch(/^https:\/\//)
    }
  })

  it('getRecipes returns all recipes', () => {
    expect(getRecipes()).toEqual(recipes)
  })

  it('getRecipeById finds a recipe and returns undefined for unknown ids', () => {
    expect(getRecipeById('secretos-github')?.engine).toBe('github')
    expect(getRecipeById('no-existe')).toBeUndefined()
  })
})
