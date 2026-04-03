import { db } from '../db/index.js'
import { appDefinitions } from '../db/schema.js'
import { allAppDefinitions } from './definitions/index.js'
import { validateAppDefinition, toAppDefinitionRecord } from './validation.js'
import type { AppDefinition } from './types.js'

const definitionMap = new Map<string, AppDefinition>()

export async function seedAppDefinitions(): Promise<void> {
  for (const def of allAppDefinitions) {
    validateAppDefinition(def)
    const record = toAppDefinitionRecord(def)

    await db
      .insert(appDefinitions)
      .values({
        id: record.id,
        version: record.version,
        appType: record.appType,
        displayName: record.displayName,
        description: record.description,
        toolSchemas: record.toolSummaries,
        sessionSchemaVersion: record.sessionSchemaVersion,
        uiUrl: record.uiUrl,
        enabled: record.enabled,
        authRequirements: record.authRequirements,
        allowedOrigins: record.allowedOrigins,
      })
      .onConflictDoUpdate({
        target: appDefinitions.id,
        set: {
          version: record.version,
          displayName: record.displayName,
          description: record.description,
          toolSchemas: record.toolSummaries,
          sessionSchemaVersion: record.sessionSchemaVersion,
          uiUrl: record.uiUrl,
          enabled: record.enabled,
          authRequirements: record.authRequirements,
          allowedOrigins: record.allowedOrigins,
          updatedAt: new Date(),
        },
      })

    definitionMap.set(def.id, def)
    console.log(`Seeded app: ${def.id}`)
  }
}

export function getAppDefinition(appId: string): AppDefinition | undefined {
  return definitionMap.get(appId)
}

export function getAllAppDefinitions(): AppDefinition[] {
  return [...definitionMap.values()]
}
