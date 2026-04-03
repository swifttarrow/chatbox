import * as math from 'mathjs'
import {
  AppAdapter,
  type ToolCallInput,
  type ToolCallResult,
  type UserActionInput,
  type UserActionResult,
  type AppSnapshot,
} from '../adapter.js'

export class EquationSolverAdapter extends AppAdapter {
  readonly appId = 'equation-solver'

  getInitialState(): unknown {
    return {}
  }

  async onToolCall(input: ToolCallInput): Promise<ToolCallResult> {
    switch (input.toolName) {
      case 'solve_equation': {
        const { equation } = input.parameters as { equation: string }
        try {
          // Handle "= 0" format by extracting left side
          let expr = equation
          if (expr.includes('=')) {
            const [left, right] = expr.split('=').map((s) => s.trim())
            expr = `(${left}) - (${right})`
          }
          // Try to solve symbolically
          const simplified = math.simplify(expr).toString()
          // Try numeric evaluation
          try {
            const result = math.evaluate(equation.replace('=', '=='))
            return { success: true, result: `Equation: ${equation}\nResult: ${result}\nSimplified: ${simplified}` }
          } catch {
            return { success: true, result: `Equation: ${equation}\nSimplified form: ${simplified}` }
          }
        } catch (err) {
          return { success: false, error: `Could not solve: ${(err as Error).message}` }
        }
      }

      case 'evaluate_expression': {
        const { expression } = input.parameters as { expression: string }
        try {
          const result = math.evaluate(expression)
          return { success: true, result: `${expression} = ${result}` }
        } catch (err) {
          return { success: false, error: `Could not evaluate: ${(err as Error).message}` }
        }
      }

      case 'simplify_expression': {
        const { expression } = input.parameters as { expression: string }
        try {
          const result = math.simplify(expression).toString()
          return { success: true, result: `Simplified: ${result}` }
        } catch (err) {
          return { success: false, error: `Could not simplify: ${(err as Error).message}` }
        }
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
      app: 'equation-solver',
      appSessionId,
      stateVersion: 0,
      source: 'server_validated',
      summary: {},
    }
  }
}
