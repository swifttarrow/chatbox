import { db } from '../db/index.js'
import { oauthConnections } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

interface OAuthConfig {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
}

const providers: Record<string, OAuthConfig> = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'user:email'],
  },
}

export function getAuthorizationUrl(
  provider: string,
  userId: string,
  redirectUri: string,
): string {
  const config = providers[provider]
  if (!config) throw new Error(`Unknown OAuth provider: ${provider}`)

  const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64url')
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(' '),
    state,
  })

  return `${config.authorizeUrl}?${params.toString()}`
}

export async function exchangeCode(
  provider: string,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
  const config = providers[provider]
  if (!config) throw new Error(`Unknown OAuth provider: ${provider}`)

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  const data = await res.json() as Record<string, unknown>
  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`)
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresAt: data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000)
      : undefined,
  }
}

export async function storeTokens(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(oauthConnections)
    .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.provider, provider)))

  if (existing) {
    await db
      .update(oauthConnections)
      .set({
        accessTokenEncrypted: accessToken,
        refreshTokenEncrypted: refreshToken ?? null,
        expiresAt: expiresAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(oauthConnections.id, existing.id))
  } else {
    await db.insert(oauthConnections).values({
      userId,
      provider,
      accessTokenEncrypted: accessToken,
      refreshTokenEncrypted: refreshToken ?? null,
      expiresAt: expiresAt ?? null,
      scopes: providers[provider]?.scopes.join(' ') ?? null,
    })
  }
}

export async function getAccessToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const [conn] = await db
    .select()
    .from(oauthConnections)
    .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.provider, provider)))

  if (!conn) return null
  return conn.accessTokenEncrypted
}

export async function removeConnection(userId: string, provider: string): Promise<void> {
  await db
    .delete(oauthConnections)
    .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.provider, provider)))
}
