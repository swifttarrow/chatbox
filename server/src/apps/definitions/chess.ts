import { z } from 'zod'
import type { AppDefinition } from '../types.js'

export const chessDefinition: AppDefinition = {
  id: 'chess',
  version: '1.0.0',
  appType: 'hybrid_session',
  displayName: 'Chess',
  description:
    'Play an interactive chess game. The user can start a new game, make moves, ask for help analyzing the board, and play until checkmate or draw.',
  tools: [
    {
      name: 'start_chess_game',
      description: 'Start a new chess game. Call this when the user wants to play chess.',
      parameters: z.object({
        color: z
          .enum(['white', 'black'])
          .optional()
          .describe('The color the user plays as. Default white.'),
      }),
      isLauncher: true,
    },
    {
      name: 'get_board_state',
      description: 'Get the current chess board state including FEN, legal moves, and game status.',
      parameters: z.object({}),
    },
    {
      name: 'suggest_move',
      description: 'Analyze the current board position and suggest a good move for the user.',
      parameters: z.object({}),
    },
  ],
  sessionSchemaVersion: 1,
  uiUrl:
    process.env.NODE_ENV === 'production'
      ? '/apps/chess/index.html'
      : 'http://localhost:3200',
  enabled: true,
  authRequirements: 'none',
  allowedOrigins: [],
}
