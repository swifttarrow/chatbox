import { z } from 'zod'

export interface ToolDefinition {
  name: string
  description: string
  parameters: z.ZodObject<any>
  isLauncher?: boolean
}

export type AppType = 'server_tool' | 'hybrid_session' | 'client_widget'

export interface AppDefinition {
  id: string
  version: string
  appType: AppType
  displayName: string
  description: string
  tools: ToolDefinition[]
  sessionSchemaVersion: number
  uiUrl: string | null
  enabled: boolean
  authRequirements: 'none' | 'internal' | 'oauth'
  allowedOrigins: string[]
}

export interface AppDefinitionRecord {
  id: string
  version: string
  appType: AppType
  displayName: string
  description: string
  toolSummaries: { name: string; description: string; parameterNames: string[]; isLauncher?: boolean }[]
  sessionSchemaVersion: number
  uiUrl: string | null
  enabled: boolean
  authRequirements: string
  allowedOrigins: string[]
}
