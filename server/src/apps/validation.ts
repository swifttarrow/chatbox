import { z } from 'zod'
import type { AppDefinition, AppDefinitionRecord, ToolDefinition } from './types.js'

const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/

export function validateToolName(name: string): boolean {
  return SNAKE_CASE_RE.test(name)
}

export function validateAppDefinition(def: AppDefinition): void {
  if (!def.id || !def.displayName || !def.description) {
    throw new Error(`App definition missing required fields: id, displayName, description`)
  }

  const names = new Set<string>()
  for (const tool of def.tools) {
    if (!validateToolName(tool.name)) {
      throw new Error(`Tool name "${tool.name}" must be snake_case`)
    }
    if (names.has(tool.name)) {
      throw new Error(`Duplicate tool name "${tool.name}" in app "${def.id}"`)
    }
    if (!(tool.parameters instanceof z.ZodObject)) {
      throw new Error(`Tool "${tool.name}" parameters must be a z.object()`)
    }
    names.add(tool.name)
  }
}

export function toAppDefinitionRecord(def: AppDefinition): AppDefinitionRecord {
  return {
    id: def.id,
    version: def.version,
    appType: def.appType,
    displayName: def.displayName,
    description: def.description,
    toolSummaries: def.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameterNames: Object.keys((t.parameters as z.ZodObject<any>).shape),
      isLauncher: t.isLauncher,
    })),
    sessionSchemaVersion: def.sessionSchemaVersion,
    uiUrl: def.uiUrl,
    enabled: def.enabled,
    authRequirements: def.authRequirements,
    allowedOrigins: def.allowedOrigins,
  }
}
