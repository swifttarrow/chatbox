# Task 006: App Switching in Conversations

## Purpose

Support using multiple apps within a single conversation -- starting chess, switching to weather, coming back to chess, etc. The UI must handle multiple app sessions and the model must maintain context for all.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `server/src/apps/sessions.ts`, `src/renderer/components/bridge/AppContainer.tsx`, `src/renderer/packages/bridge/store.ts`

## Outputs

- Create: `src/renderer/components/bridge/AppTabs.tsx` (tab bar for switching between active app sessions)
- Modify: `src/renderer/components/bridge/BridgeLayout.tsx` (render AppTabs + visible AppContainer)
- Modify: `src/renderer/packages/bridge/store.ts` (track multiple app sessions)
- Modify: `server/src/orchestrator/context.ts` (include snapshots from all active sessions)
- Modify: `server/src/orchestrator/tools.ts` (include tools from all active sessions)

## Dependencies

- Prior task: `005-multi-app-routing.md`
- Required artifacts: All app adapters, bridge store, BridgeChat component

## Constraints

- Multiple app sessions can be active simultaneously in one conversation
- Only one iframe is visible at a time (tab/accordion UI or show the most recently activated)
- Tools from all active sessions are available to the model each turn
- Completed sessions show their final state but cannot be interacted with
- Creating a new session for the same app type is allowed (e.g., play chess twice)

## Required Changes

1. Modify bridge store:
   - `activeAppSessions`: array of `{ sessionId, appId, status }` per conversation
   - `visibleAppSessionId`: which app's iframe is currently shown
   - `setVisibleApp(sessionId)`: switch visible app
   - Load all active sessions when entering a conversation

2. Create `src/renderer/components/bridge/AppTabs.tsx`:
   - New component rendered inside `BridgeLayout.tsx` (from M2-007) above the `BridgeChat` area
   - Renders tabs/pills for each active app session (e.g., "Chess", "Weather") using Mantine `Tabs` or `SegmentedControl`
   - Click a tab: calls `setVisibleApp(sessionId)` from store
   - Active tab highlighted; completed sessions shown in dimmed/strikethrough style
   - When no apps are active, the component renders nothing (hidden)

   Modify `src/renderer/components/bridge/BridgeLayout.tsx`:
   - Import and render `AppTabs` between the header area and the chat/iframe area
   - Render `AppContainer` for the currently visible app session only
   - Other apps' iframes are unmounted (not hidden) to save memory; state restores from server on tab switch via `app.init`

3. Modify orchestrator context:
   - Include snapshots from ALL active app sessions (not just the most recent)
   - Label each snapshot with app name for model clarity

4. Modify orchestrator tools:
   - `buildToolsForTurn` includes tools from all active sessions
   - Prefix tool names or include appId metadata to prevent collisions (e.g., tool metadata contains appId)

## Acceptance Criteria

- [ ] User can play chess, then ask about weather, then return to chess -- all in one conversation
- [ ] App tabs show all active/completed sessions
- [ ] Switching tabs shows the correct app iframe
- [ ] Model has context for all active apps simultaneously
- [ ] Starting a new chess game while one is in progress creates a separate session

## Validation

- [ ] In one conversation: play chess (a few moves), ask about weather (dashboard shows), switch back to chess (board shows current state)
- [ ] Ask the model "what apps am I using?" -- should reference both chess and weather
- [ ] `pnpm --filter @chatbox/server build` and `pnpm build:web` compile without errors

## Stop and Ask

- If rendering multiple iframes causes performance issues, consider lazy loading (only mount iframe when tab is active, restore state via app.init on remount)
