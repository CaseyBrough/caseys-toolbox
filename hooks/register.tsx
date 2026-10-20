import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const isAutoModel = atom({ plugin: 'caseys-toolbox', key: 'isAutoModel' } as const, true)
const isBusy = atom({ plugin: 'caseys-toolbox', key: 'isBusy' } as const, false)
const original = atom({ plugin: 'caseys-toolbox', key: 'original' } as const, null)
const lastPick = atom({ plugin: 'caseys-toolbox', key: 'lastPick' } as const, null)

const TIERS = { quick: 'haiku', standard: 'sonnet', deep: 'opus' } as const

const REPROMPT_SYSTEM = `You rewrite a user's rough prompt for a coding/creative AI assistant into a clearer, higher-quality prompt.
Keep the user's intent and voice. State the goal, relevant context, constraints, and what "done" looks like. Do not invent facts or requirements; where something essential is missing, add a short "Open questions" line.
Be concise. Output ONLY the rewritten prompt, no preamble.`

async function reprompt($: any) {
  const { text } = await $.prompt.read()
  if (!text.trim()) return $.ui.toast('Type something first, then reprompt.')
  await update($, isBusy, () => true)
  try {
    const r = await $.model.complete({
      model: 'sonnet',
      system: REPROMPT_SYSTEM,
      prompt: text,
      maxTokens: 2000,
      timeoutMs: 45000,
    })
    if (!r.isAnswered) return $.ui.toast(`Reprompt failed: ${r.reason}`)
    await update($, original, () => text)
    await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
    $.ui.toast('Reprompted. Edit it, press Enter, or /reprompt undo.')
  } finally {
    await update($, isBusy, () => false)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'reprompt', description: 'Rewrite the text in the prompt box as a stronger prompt (undo to revert)' })
    await $.command.register({ name: 'auto-model', description: 'Toggle automatic model selection per prompt (on/off)' })
    await $.command.register({ name: 'toolbox', description: 'Open Casey\'s Toolbox pane' })
    return next(e)
  })

  on('command.run', { command: 'toolbox' }, async $ => {
    await $.ui.open({ id: 'toolbox', title: "Casey's Toolbox" })
    return { text: 'Toolbox opened.' }
  })

  on('command.run', { command: 'reprompt' }, async ($, e) => {
    if (e.args.trim() === 'undo') {
      const prev = await read($, original)
      if (prev === null) return { text: 'Nothing to undo.' }
      await $.prompt.fill({ text: prev, mode: 'replace' })
      return { text: 'Restored your original prompt.' }
    }
    await reprompt($)
    return { text: 'Done.' }
  })

  on('command.run', { command: 'auto-model' }, async ($, e) => {
    const arg = e.args.trim()
    const next = arg === 'on' ? true : arg === 'off' ? false : !(await read($, isAutoModel))
    await update($, isAutoModel, () => next)
    return { text: `Auto model selection ${next ? 'on' : 'off'}.` }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind !== 'composer' || e.text.trim().startsWith('/')) return next(e)
    try {
      if (!(await read($, isAutoModel))) return next(e)
      const tier = await $.model.classify(
        `Pick the model tier for this request.\nquick = trivial lookups, small edits, renames, short questions.\nstandard = normal coding, writing, analysis.\ndeep = hard debugging, architecture, multi-file refactors, ambiguous or high-stakes reasoning.\n\nRequest:\n${e.text.slice(0, 4000)}`,
        ['quick', 'standard', 'deep'],
      )
      const alias = tier ? TIERS[tier as keyof typeof TIERS] : undefined
      const current = await $.session.model()
      if (alias && !current.includes(alias)) {
        await $.command.run({ command: 'model', args: alias })
        await update($, lastPick, () => alias)
        $.ui.toast(`Auto model: ${alias}`)
      }
    } catch {
      // classification is best-effort; never block the prompt
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const auto = await read($, isAutoModel)
    const busy = await read($, isBusy)
    return (
      <Box>
        <Button key="rp" label={busy ? '… working' : '✨ Reprompt'} onPress={() => void reprompt($)} />
        <Text dimColor> · </Text>
        <Button key="am" label={auto ? 'Auto ●' : 'Auto ○'} onPress={() => update($, isAutoModel, v => !v)} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: 'toolbox' }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const auto = await read($, isAutoModel)
    const busy = await read($, isBusy)
    const pick = await read($, lastPick)
    return (
      <Box flexDirection="column">
        <Text bold>Casey's Toolbox</Text>
        <Text dimColor>Reprompt rewrites what is in the prompt box. Undo: /reprompt undo</Text>
        <Button key="rp" label={busy ? 'Reprompting…' : '✨ Reprompt prompt box'} onPress={() => void reprompt($)} />
        <Text dimColor>Auto model picks Haiku, Sonnet or Opus per prompt.</Text>
        <Button key="am" label={`Auto model: ${auto ? 'on' : 'off'}`} onPress={() => update($, isAutoModel, v => !v)} />
        <Text dimColor>Last pick: {pick ?? 'none yet'}</Text>
      </Box>
    )
  })
}
