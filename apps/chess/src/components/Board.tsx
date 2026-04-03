import { useState, useMemo, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

interface BoardProps {
  fen: string
  playerColor: 'white' | 'black'
  onMove: (from: string, to: string) => void
  disabled: boolean
}

export default function Board({ fen, playerColor, onMove, disabled }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)

  const game = useMemo(() => {
    const g = new Chess()
    try {
      g.load(fen)
    } catch {
      // keep default position on invalid FEN
    }
    return g
  }, [fen])

  const legalMoveSquares = useMemo(() => {
    if (!selectedSquare) return {}
    const moves = game.moves({ square: selectedSquare, verbose: true })
    const highlights: Record<string, React.CSSProperties> = {}
    for (const m of moves) {
      highlights[m.to] = {
        background: 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
        borderRadius: '50%',
      }
    }
    highlights[selectedSquare] = {
      background: 'rgba(255, 255, 0, 0.4)',
    }
    return highlights
  }, [selectedSquare, game])

  const onSquareClick = useCallback(
    (square: Square) => {
      if (disabled) return

      if (selectedSquare) {
        // Attempt move
        const moves = game.moves({ square: selectedSquare, verbose: true })
        const isLegal = moves.some((m) => m.to === square)
        if (isLegal) {
          onMove(selectedSquare, square)
          setSelectedSquare(null)
          return
        }
      }

      // Select new piece if it belongs to the current player
      const piece = game.get(square)
      if (piece) {
        const pieceIsWhite = piece.color === 'w'
        const playerIsWhite = playerColor === 'white'
        if (pieceIsWhite === playerIsWhite) {
          setSelectedSquare(square)
          return
        }
      }

      setSelectedSquare(null)
    },
    [disabled, selectedSquare, game, onMove, playerColor]
  )

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (disabled) return false
      onMove(sourceSquare, targetSquare)
      return true
    },
    [disabled, onMove]
  )

  return (
    <Chessboard
      id="chess-board"
      position={fen}
      boardOrientation={playerColor}
      onPieceDrop={onPieceDrop}
      onSquareClick={onSquareClick}
      customSquareStyles={legalMoveSquares}
      boardWidth={400}
      animationDuration={200}
    />
  )
}
