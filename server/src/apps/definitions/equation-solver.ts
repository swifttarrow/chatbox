import { z } from 'zod'
import type { AppDefinition } from '../types.js'

export const equationSolverDefinition: AppDefinition = {
  id: 'equation-solver',
  version: '1.0.0',
  appType: 'server_tool',
  displayName: 'Equation Solver',
  description:
    'Solve mathematical equations, evaluate expressions, and simplify algebra. Handles algebra, arithmetic, calculus, and unit conversions.',
  tools: [
    {
      name: 'solve_equation',
      description: 'Solve a mathematical equation for unknowns.',
      parameters: z.object({
        equation: z.string().describe('The equation to solve, e.g. "x^2 + 3x - 4 = 0"'),
      }),
      isLauncher: true,
    },
    {
      name: 'evaluate_expression',
      description: 'Evaluate a numeric mathematical expression.',
      parameters: z.object({
        expression: z.string().describe('The expression to evaluate, e.g. "sin(pi/4) * sqrt(2)"'),
      }),
    },
    {
      name: 'simplify_expression',
      description: 'Simplify an algebraic expression.',
      parameters: z.object({
        expression: z.string().describe('The expression to simplify, e.g. "(x^2 - 1) / (x - 1)"'),
      }),
    },
  ],
  sessionSchemaVersion: 1,
  uiUrl: null,
  enabled: true,
  authRequirements: 'none',
  allowedOrigins: [],
}
