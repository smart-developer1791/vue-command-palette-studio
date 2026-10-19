import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseSettings } from '../src/domain/palette.ts'

const sample = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

test('enumerated import settings require strings and preserve the input on failure', () => {
  for (const path of ['accent']) {
    const keys = path.split('.')
    const original = structuredClone(sample)
    const valid = parseSettings(original)
    let parent = original
    for (const key of keys.slice(0, -1)) parent = parent[key]
    const key = keys.at(-1)!
    for (const invalid of [[parent[key]], null, {}, 1, true]) {
      const input = structuredClone(original)
      let record = input
      for (const key of keys.slice(0, -1)) record = record[key]
      record[key] = invalid
      const before = JSON.stringify(input)
      assert.throws(() => parseSettings(input), path)
      assert.equal(JSON.stringify(input), before, 'Rejected input was mutated')
    }
    assert.deepEqual(parseSettings(original), valid)
  }
})
