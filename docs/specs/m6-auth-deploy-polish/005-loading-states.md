# Task 005: Loading States & Progress Indicators

## Purpose

Add visual feedback throughout the application so users always know what's happening: streaming indicators, app loading spinners, tool execution progress, and connection status.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `src/renderer/components/bridge/`, `src/renderer/packages/bridge/store.ts`

## Outputs

- Modify: `src/renderer/components/bridge/BridgeChat.tsx` (streaming indicator, typing dots)
- Modify: `src/renderer/components/bridge/AppContainer.tsx` (loading spinner, progress)
- Create: `src/renderer/components/bridge/ConnectionStatus.tsx` (connection indicator)
- Create: `src/renderer/components/bridge/ToolProgress.tsx` (tool execution indicator)

## Dependencies

- Prior task: `004-error-handling.md`
- Required artifacts: Bridge components, bridge store

## Constraints

- Use existing Mantine components where possible (Loader, Badge, Alert)
- Indicators must not block interaction with other parts of the UI
- Streaming: show typing indicator (animated dots) while waiting for first token
- Tool execution: show "Using Chess..." or "Solving equation..." with spinner
- App loading: show spinner with app name
- Connection: small badge in corner (green=connected, yellow=reconnecting, red=disconnected)

## Required Changes

1. Create `src/renderer/components/bridge/ConnectionStatus.tsx`:
   - Small pill/badge showing connection state
   - Green: "Connected", Yellow: "Reconnecting...", Red: "Disconnected"
   - Position: top-right or in header
2. Create `src/renderer/components/bridge/ToolProgress.tsx`:
   - Shows when a tool is being executed
   - Text: "Using [App Name]..." with spinner
   - Appears in message flow where the tool result will go
3. Modify `BridgeChat.tsx`:
   - Show typing indicator (three animated dots) while waiting for assistant response
   - Show tool progress when run status is `invoking_tool`
   - Smooth transition from typing -> tool progress -> typing -> message
4. Modify `AppContainer.tsx`:
   - Spinner with "Loading [App Name]..." during iframe load
   - Progress bar or message during state transitions
   - Smooth fade-in when app is ready

## Acceptance Criteria

- [ ] Typing indicator shows while waiting for first token
- [ ] Tool execution shows progress indicator with app name
- [ ] App iframe shows loading spinner before ready
- [ ] Connection status visible and accurate
- [ ] No "dead time" where nothing appears to be happening
- [ ] Indicators disappear cleanly when action completes

## Validation

- [ ] Send a message: observe typing dots -> streaming text -> done
- [ ] Trigger a tool call: observe typing dots -> "Using Chess..." -> tool result -> assistant text
- [ ] Open an app: observe loading spinner -> app appears
- [ ] Check connection indicator matches actual connection state

## Stop and Ask

- If Mantine Loader or Badge components are not available, use simple CSS animations
