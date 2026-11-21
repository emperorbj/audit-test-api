// The investigation trace: every tool the agent called, with its parameters and how many
// results came back (scope US-05, FR-12). Lets an auditor repeat the investigation.

import type { TraceStep } from '../../api/types'

export function TraceView({ steps }: { steps: TraceStep[] }) {
  if (steps.length === 0) return <p className="muted">The agent did not call any tools.</p>

  return (
    <ol className="trace">
      {steps.map((step, index) => (
        <li key={index} className="trace__step">
          <div className="trace__head">
            <span className="trace__number" aria-hidden="true">{index + 1}</span>
            <code className="trace__tool">{step.tool}</code>
            <span className="muted small">
              {!step.ok
                ? '✕ failed'
                : step.result_count === null
                  ? ''
                  : `${step.result_count} result${step.result_count === 1 ? '' : 's'}`}
            </span>
          </div>
          {Object.keys(step.args).length > 0 && (
            <pre className="code-block code-block--small">{JSON.stringify(step.args, null, 2)}</pre>
          )}
        </li>
      ))}
    </ol>
  )
}
