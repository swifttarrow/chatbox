import {
  AppAdapter,
  type ToolCallInput,
  type ToolCallResult,
  type UserActionInput,
  type UserActionResult,
  type AppSnapshot,
} from '../adapter.js'
import { getAccessToken } from '../../auth/oauth.js'

const GITHUB_API = 'https://api.github.com'

async function githubFetch(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ChatBridge/1.0',
    },
  })
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export class GitHubAppAdapter extends AppAdapter {
  readonly appId = 'github'

  getInitialState(): unknown {
    return {}
  }

  async onToolCall(input: ToolCallInput): Promise<ToolCallResult> {
    const token = await getAccessToken(input.userId, 'github')
    if (!token) {
      return {
        success: false,
        error:
          'Please connect your GitHub account first. Visit /api/oauth/github/authorize to connect.',
      }
    }

    switch (input.toolName) {
      case 'list_repos': {
        const sort = (input.parameters.sort as string) || 'updated'
        const repos = (await githubFetch(`/user/repos?sort=${sort}&per_page=10`, token)) as any[]
        const summary = repos.map((r: any) => ({
          name: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          language: r.language,
          updatedAt: r.updated_at,
        }))
        return { success: true, result: JSON.stringify(summary, null, 2) }
      }

      case 'get_repo_info': {
        const { owner, repo } = input.parameters as { owner: string; repo: string }
        const data = (await githubFetch(`/repos/${owner}/${repo}`, token)) as any
        return {
          success: true,
          result: `${data.full_name}: ${data.description || 'No description'}\nStars: ${data.stargazers_count}, Forks: ${data.forks_count}, Language: ${data.language}\nOpen issues: ${data.open_issues_count}`,
        }
      }

      case 'search_repos': {
        const { query } = input.parameters as { query: string }
        const data = (await githubFetch(
          `/search/repositories?q=${encodeURIComponent(query)}&per_page=5`,
          token,
        )) as any
        const results = data.items.map((r: any) => ({
          name: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          language: r.language,
        }))
        return { success: true, result: JSON.stringify(results, null, 2) }
      }

      default:
        return { success: false, error: `Unknown tool: ${input.toolName}` }
    }
  }

  async onUserAction(_input: UserActionInput): Promise<UserActionResult> {
    return { success: true }
  }

  getSnapshot(_domainState: unknown, appSessionId: string): AppSnapshot {
    return {
      app: 'github',
      appSessionId,
      stateVersion: 0,
      source: 'server_validated',
      summary: {},
    }
  }
}
