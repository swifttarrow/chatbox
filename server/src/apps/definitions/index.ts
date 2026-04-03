import type { AppDefinition } from '../types.js'
import { chessDefinition } from './chess.js'
import { equationSolverDefinition } from './equation-solver.js'
import { weatherDefinition } from './weather.js'
import { githubDefinition } from './github-app.js'

export const allAppDefinitions: AppDefinition[] = [
  chessDefinition,
  equationSolverDefinition,
  weatherDefinition,
  githubDefinition,
]
