import { Chess } from 'chess.js'
import {
  AppAdapter,
  type ToolCallInput,
  type ToolCallResult,
  type UserActionInput,
  type UserActionResult,
  type AppSnapshot,
} from '../adapter.js'

interface ChessDomainState {
  fen: string
  pgn: string
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isStalemate: boolean
  isGameOver: boolean
  moveHistory: string[]
  playerColor: 'white' | 'black'
}

export class ChessAdapter extends AppAdapter {
  readonly appId = 'chess'

  getInitialState(): ChessDomainState {
    const game = new Chess()
    return {
      fen: game.fen(),
      pgn: '',
      turn: 'w',
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      isStalemate: false,
      isGameOver: false,
      moveHistory: [],
      playerColor: 'white',
    }
  }

  async onToolCall(input: ToolCallInput): Promise<ToolCallResult> {
    switch (input.toolName) {
      case 'start_chess_game': {
        const color = (input.parameters.color as string) || 'white'
        const state = this.getInitialState()
        state.playerColor = color as 'white' | 'black'
        return {
          success: true,
          result: `Chess game started! You are playing as ${color}. The board is set up and ready.`,
          domainState: state,
          uiCommand: { type: 'init', payload: state },
        }
      }

      case 'get_board_state': {
        const state = input.parameters as unknown as ChessDomainState
        // Reconstruct from session state (passed via orchestrator)
        return {
          success: true,
          result: `Current position (FEN): ${state?.fen || 'unknown'}. Turn: ${state?.turn === 'w' ? 'White' : 'Black'}. ${state?.isCheck ? 'Check!' : ''} ${state?.isGameOver ? 'Game over.' : `${new Chess(state?.fen).moves().length} legal moves available.`}`,
        }
      }

      case 'suggest_move': {
        const state = input.parameters as unknown as ChessDomainState
        try {
          const game = new Chess(state?.fen)
          const moves = game.moves()
          if (moves.length === 0) {
            return { success: true, result: 'No legal moves available. The game may be over.' }
          }
          // Pick a random move for MVP
          const suggestion = moves[Math.floor(Math.random() * moves.length)]
          return { success: true, result: `I suggest: ${suggestion}` }
        } catch {
          return { success: true, result: 'Unable to analyze the position.' }
        }
      }

      default:
        return { success: false, error: `Unknown tool: ${input.toolName}` }
    }
  }

  async onUserAction(input: UserActionInput): Promise<UserActionResult> {
    const state = input.currentDomainState as ChessDomainState

    switch (input.action) {
      case 'make_move': {
        const { from, to, promotion } = input.payload as {
          from: string
          to: string
          promotion?: string
        }

        try {
          const game = new Chess(state.fen)
          const move = game.move({ from, to, promotion })
          if (!move) {
            return { success: false, error: 'Invalid move' }
          }

          const newState: ChessDomainState = {
            ...state,
            fen: game.fen(),
            pgn: game.pgn(),
            turn: game.turn(),
            isCheck: game.isCheck(),
            isCheckmate: game.isCheckmate(),
            isDraw: game.isDraw(),
            isStalemate: game.isStalemate(),
            isGameOver: game.isGameOver(),
            moveHistory: [...state.moveHistory, move.san],
          }

          if (newState.isGameOver) {
            return {
              success: true,
              domainState: newState,
              uiCommand: { type: 'state_patch', payload: newState },
              isComplete: true,
            }
          }

          // AI opponent move (random for MVP)
          if (!game.isGameOver()) {
            const aiMoves = game.moves()
            if (aiMoves.length > 0) {
              const aiMove = game.move(aiMoves[Math.floor(Math.random() * aiMoves.length)])
              newState.fen = game.fen()
              newState.pgn = game.pgn()
              newState.turn = game.turn()
              newState.isCheck = game.isCheck()
              newState.isCheckmate = game.isCheckmate()
              newState.isDraw = game.isDraw()
              newState.isStalemate = game.isStalemate()
              newState.isGameOver = game.isGameOver()
              newState.moveHistory = [...newState.moveHistory, aiMove.san]

              if (newState.isGameOver) {
                return {
                  success: true,
                  domainState: newState,
                  uiCommand: { type: 'state_patch', payload: newState },
                  isComplete: true,
                }
              }
            }
          }

          return {
            success: true,
            domainState: newState,
            uiCommand: { type: 'state_patch', payload: newState },
          }
        } catch (err) {
          return { success: false, error: (err as Error).message }
        }
      }

      case 'resign': {
        const newState: ChessDomainState = {
          ...state,
          isGameOver: true,
        }
        return {
          success: true,
          domainState: newState,
          uiCommand: { type: 'state_patch', payload: newState },
          isComplete: true,
        }
      }

      default:
        return { success: false, error: `Unknown action: ${input.action}` }
    }
  }

  getSnapshot(domainState: unknown, appSessionId: string): AppSnapshot {
    const state = domainState as ChessDomainState
    return {
      app: 'chess',
      appSessionId,
      stateVersion: 0,
      source: 'server_validated',
      summary: {
        fen: state.fen,
        turn: state.turn === 'w' ? 'white' : 'black',
        status: state.isGameOver
          ? state.isCheckmate
            ? 'checkmate'
            : state.isStalemate
              ? 'stalemate'
              : 'draw'
          : 'in_progress',
        lastMove: state.moveHistory.at(-1) ?? null,
        totalMoves: state.moveHistory.length,
        isCheck: state.isCheck,
      },
    }
  }
}
