import { describe, expect, it } from 'vitest'
import { engines, buildSearchUrl } from './dorks'
import { getRecipeById, getRecipes, recipes } from './recipes'

describe('recipes data', () => {
  it('has between 12 and 28 recipes', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(12)
    expect(recipes.length).toBeLessThanOrEqual(28)
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

  it('the new dark-side recipes exist, are sensitive and well formed', () => {
    const newRecipes: Array<{ id: string; engine: string }> = [
      { id: 'camaras-hikvision', engine: 'google' },
      { id: 'tokens-slack-github', engine: 'github' },
      { id: 'vpn-openvpn-configs', engine: 'google' },
      { id: 'elasticsearch-abiertos', engine: 'shodan' },
      { id: 'redis-sin-password', engine: 'shodan' },
      { id: 'webmails-empresa', engine: 'google' },
    ]
    for (const { id, engine } of newRecipes) {
      const recipe = getRecipeById(id)
      expect(recipe, `receta ${id}`).toBeTruthy()
      expect(recipe!.engine).toBe(engine)
      expect(recipe!.sensitive).toBe(true)
      expect(recipe!.steps.length).toBeGreaterThanOrEqual(3)
      expect(() => buildSearchUrl(recipe!.engine, recipe!.query)).not.toThrow()
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
