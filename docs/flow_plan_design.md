Requirements:

1. Create a GitHub-ready repository with clear file names, source folders, tests, and documentation.
2. Build a browser app that reconciles a synthetic 50+ record settlement batch between processor settlements and bank deposits.
3. Report total reviewed records, matched records, match rate, and unresolved exceptions.
4. Show a table with settlement ID, processor reference, bank reference, amount, status, and evidence.
5. Implement a Q&A agent that answers only from computed reconciliation results. It must answer match-rate questions, exception questions, cash-exposure questions, and settlement-ID questions.
6. The agent must refuse unrelated or unsupported questions instead of inventing answers.
7. Use deterministic code for matching, amount checks, duplicate checks, date tolerance, and exception classification. Do not use an LLM for exact financial calculations.
8. Include tests for:
   - 50+ input records.
   - accurate match-rate calculation.
   - amount mismatch detection.
   - missing bank record detection.
   - missing processor record detection.
   - duplicate reference detection.
   - date tolerance detection.
   - Q&A grounded answers.
   - Q&A refusal for unsupported questions.
9. Add docs explaining architecture, where agents should be used, where agents should not be used, and what can break in production with fixes.
10. Make the UI clean, responsive, and operator-focused. It should feel like an internal finance tool, not a marketing landing page.

Suggested implementation:

- Use plain HTML, CSS, and JavaScript modules or React if the project already uses it.
- Keep the reconciliation engine pure and independently testable.
- Keep synthetic data separate from logic.
- Add an audit evidence field to every reconciliation result.
- Add a README with setup, usage, tests, architecture, and production hardening notes.

Trust rules:

- No financial mutation without human approval.
- No answer without source evidence.
- No hidden exception filtering.
- No generated financial advice.
- No silent tolerance changes.
