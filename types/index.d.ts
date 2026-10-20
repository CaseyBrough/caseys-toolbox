export type ToolboxPick = string

declare module 'claude-code' {
  interface PluginState {
    'caseys-toolbox': {
      isAutoModel: boolean
      isBusy: boolean
      original: string | null
      lastPick: ToolboxPick | null
    }
  }
}
