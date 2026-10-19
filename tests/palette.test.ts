import test from 'node:test'
import assert from 'node:assert/strict'
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc'
import { matchesShortcut, parseSettings, sample, searchCommands } from '../src/domain/palette.ts'
import { componentSource } from '../src/domain/export.ts'

test('imports reject duplicate shortcuts, identities and unsupported actions', () => {
  assert.deepEqual(parseSettings({ ...sample, metadata: 'ignored' }), sample)
  const change = structuredClone(sample)
  change.commands[0]!.shortcut = sample.launcher
  assert.throws(() => parseSettings(change), /unique/)
  change.commands[0]!.shortcut = 'mod+r'
  assert.throws(() => parseSettings(change), /shortcuts/)
  change.commands[0]!.shortcut = ''
  change.commands[1]!.id = change.commands[0]!.id
  assert.throws(() => parseSettings(change), /unique/)
  assert.throws(() => parseSettings({ ...sample, commands: [] }))
})
test('search combines keywords, ranks title matches and promotes recent commands', () => {
  assert.equal(searchCommands(sample.commands, 'dark')[0]!.id, 'theme')
  assert.equal(searchCommands(sample.commands, 'note idea')[0]!.id, 'capture')
  assert.equal(searchCommands(sample.commands, '', ['clear'])[0]!.id, 'clear')
  assert.equal(searchCommands(sample.commands, 'nothing fits').length, 0)
})
test('hotkeys distinguish modifiers and reject unsupported browser shortcuts', () => {
  const event = { key: 'k', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }
  assert.equal(matchesShortcut(event, 'Mod + K'), true)
  assert.equal(matchesShortcut({ ...event, ctrlKey: false, metaKey: true }, 'mod+k'), true)
  assert.equal(matchesShortcut({ ...event, shiftKey: true }, 'mod+k'), false)
  assert.equal(matchesShortcut({ ...event, altKey: true }, 'mod+k'), false)
  assert.equal(matchesShortcut({ ...event, key: 'r' }, 'mod+r'), false)
})
test('downloadable SFC compiles with escaped script-closing text', () => {
  const config = structuredClone(sample)
  config.title = '</script><script>bad()</script>'
  const source = componentSource(config)
  const parsed = parse(source)
  assert.deepEqual(parsed.errors, [])
  const script = compileScript(parsed.descriptor, { id: 'export-test' })
  const template = compileTemplate({
    source: parsed.descriptor.template!.content,
    filename: 'CommandPalette.vue',
    id: 'export-test',
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(template.errors, [])
  assert.ok(source.includes('\\u003c/script>'))
})
