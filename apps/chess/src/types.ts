export interface ChessDomainState {
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
