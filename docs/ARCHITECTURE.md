# Architecture

This project is a trust-first finance-controller prototype for settlement reconciliation and grounded Q&A.

## Components

- `src/data.js`: Synthetic 50+ record processor and bank settlement batch.
- `src/reconciliation.js`: Deterministic matching engine. This is intentionally not an LLM because money movement controls need repeatable rules and audit evidence.
- `src/qaAgent.js`: Lightweight Q&A agent that answers only from reconciliation output. This is where an LLM could be added later with retrieval and guardrails.
- `src/app.js`: Browser UI that renders metrics, exceptions, evidence, filters, and Q&A.
- `tests/`: Regression tests for reconciliation accuracy, exception handling, and Q&A refusal behavior.

## Where Agents Belong

Use an agent for:

- Explaining exception evidence to finance operators.
- Drafting next-step messages for unresolved settlements.
- Summarizing batches for controllers.
- Routing exceptions by type and urgency.

Do not use an agent for:

- Exact amount comparison.
- Date tolerance checks.
- Duplicate detection.
- Ledger mutation or settlement approval without human review.

The core matching engine should stay deterministic. The Q&A layer can be agentic only when it is grounded in computed facts and forced to cite evidence.
