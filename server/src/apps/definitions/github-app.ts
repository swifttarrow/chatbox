import { z } from 'zod'
import type { AppDefinition } from '../types.js'

export const githubDefinition: AppDefinition = {
  id: 'github',
  version: '1.0.0',
  appType: 'server_tool',
  displayName: 'GitHub',
  description:
    'Browse and search GitHub repositories. Requires connecting your GitHub account via OAuth.',
  tools: [
    {
      name: 'list_repos',
      description:
        'List your GitHub repositories. Requires GitHub OAuth connection.',
      parameters: z.object({
        sort: z
          .enum(['updated', 'stars'])
          .optional()
          .describe('Sort order: updated (default) or stars'),
      }),
      isLauncher: true,
    },
    {
      name: 'get_repo_info',
      description: 'Get details about a specific GitHub repository.',
      parameters: z.object({
        owner: z.string().describe('Repository owner/organization'),
        repo: z.string().describe('Repository name'),
      }),
    },
    {
      name: 'search_repos',
      description: 'Search GitHub repositories by query.',
      parameters: z.object({
        query: z.string().describe('Search query'),
      }),
    },
  ],
  sessionSchemaVersion: 1,
  uiUrl: null,
  enabled: true,
  authRequirements: 'oauth',
  allowedOrigins: [],
}
