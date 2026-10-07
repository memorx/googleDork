import { describe, expect, it } from 'vitest'
import { dorks, getEngineById } from './dorks'
import { playbooks } from './playbooks'
import { getRecipeById } from './recipes'
import { resources } from './resources'

describe('playbooks data', () => {
  it('has 4 playbooks with unique ids', () => {
    expect(playbooks).toHaveLength(4)
    const ids = playbooks.map((playbook) => playbook.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each playbook has between 5 and 8 steps with title and description', () => {
    for (const playbook of playbooks) {
      expect(playbook.name.length).toBeGreaterThan(0)
      expect(playbook.steps.length).toBeGreaterThanOrEqual(5)
      expect(playbook.steps.length).toBeLessThanOrEqual(8)
      for (const step of playbook.steps) {
        expect(step.title.length).toBeGreaterThan(0)
        expect(step.description.length).toBeGreaterThan(0)
      }
    }
  })

  it('step references point to existing recipes, dorks and engines', () => {
    for (const playbook of playbooks) {
      for (const step of playbook.steps) {
        if (step.recipeId) expect(getRecipeById(step.recipeId)).toBeTruthy()
        if (step.dorkId) expect(dorks.some((dork) => dork.id === step.dorkId)).toBe(true)
        if (step.engineId) expect(getEngineById(step.engineId)).toBeTruthy()
      }
    }
  })
})

describe('resources data', () => {
  it('has 8-12 curated resources with unique ids and https URLs', () => {
    expect(resources.length).toBeGreaterThanOrEqual(8)
    expect(resources.length).toBeLessThanOrEqual(12)
    const ids = resources.map((resource) => resource.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const resource of resources) {
      expect(resource.url.startsWith('https://')).toBe(true)
      expect(resource.category.length).toBeGreaterThan(0)
    }
  })
})
