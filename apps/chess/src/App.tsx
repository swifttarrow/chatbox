import { useState, useEffect, useCallback } from 'react'
import { sendToHost, onHostMessage } from './bridge'
import { AppCommandTypes, AppEventTypes } from './bridge-constants'
import type { ChessDomainState } from './types'
import Board from './components/Board'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export default function App() {
  const [fen, setFen] = useState(INITIAL_FEN)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [gameStatus, setGameStatus] = useState<string>('')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [isMyTurn, setIsMyTurn] = useState(true)

  const applyDomainState = useCallback((state: ChessDomainState) => {
    setFen(state.fen)
    setPlayerColor(state.playerColor)
    setMoveHistory(state.moveHistory)

    const myTurnColor = state.playerColor === 'white' ? 'w' : 'b'
    setIsMyTurn(state.turn === myTurnColor)

    if (state.isCheckmate) {
      setGameStatus(state.turn === myTurnColor ? 'Checkmate - You lose' : 'Checkmate - You win!')
    } else if (state.isStalemate) {
      setGameStatus('Stalemate - Draw')
    } else if (state.isDraw) {
      setGameStatus('Draw')
    } else if (state.isCheck) {
      setGameStatus('Check!')
    } else if (state.isGameOver) {
      setGameStatus('Game Over')
    } else {
      setGameStatus(state.turn === 'w' ? "White's turn" : "Black's turn")
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onHostMessage((type, payload) => {
      switch (type) {
        case AppCommandTypes.INIT:
        case AppCommandTypes.STATE_PATCH: {
          const msg = payload as { domainState: ChessDomainState }
          if (msg.domainState) {
            applyDomainState(msg.domainState)
          }
          break
        }
        case AppCommandTypes.RESET:
          setFen(INITIAL_FEN)
          setMoveHistory([])
          setGameStatus("White's turn")
          setIsMyTurn(playerColor === 'white')
          break
      }
    })
    return unsubscribe
  }, [applyDomainState, playerColor])

  const handleMove = useCallback(
    (from: string, to: string) => {
      sendToHost(AppEventTypes.USER_ACTION, {
        action: 'make_move',
        data: { from, to },
      })
    },
    []
  )

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
      <Board fen={fen} playerColor={playerColor} onMove={handleMove} disabled={!isMyTurn} />
      <div style={{ minWidth: 180 }}>
        <h3 style={{ marginBottom: 8 }}>Status</h3>
        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>{gameStatus || (isMyTurn ? 'Your turn' : "Opponent's turn")}</p>
        <h3 style={{ marginBottom: 8 }}>Moves</h3>
        <div
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            fontSize: 13,
            fontFamily: 'monospace',
            lineHeight: 1.6,
          }}
        >
          {moveHistory.map((move, i) => (
            <span key={i}>
              {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}
              {move}{' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
