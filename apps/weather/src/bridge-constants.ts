export const BRIDGE_PROTOCOL_VERSION = '1.0'

export const AppCommandTypes = {
  INIT: 'app.init',
  COMMAND: 'app.command',
  STATE_PATCH: 'app.state_patch',
  RESET: 'app.reset',
  DISPOSE: 'app.dispose',
} as const

export const AppEventTypes = {
  READY: 'app.ready',
  USER_ACTION: 'app.user_action',
  UI_EVENT: 'app.ui_event',
  ERROR: 'app.error',
  ACK: 'app.ack',
} as const
