# Settlement Q&A Finance Controller

## What It Does

- Reconciles processor settlements against bank deposits.
- Reports reviewed rows, matched rows, match rate, and exception count.
- Detects amount mismatches, missing bank records, missing processor records, duplicate references, and date tolerance issues.
- Shows audit evidence for every row.
- Answers Q&A only from computed reconciliation output.
- Refuses unsupported questions rather than inventing answers.

## Project Structure

```text
settlement-qa-finance-controller/
  index.html
  styles.css
  package.json
  src/
    app.js
    data.js
    qaAgent.js
    reconciliation.js
  tests/
    qaAgent.test.js
    reconciliation.test.js
  scripts/
    run-tests.mjs
    serve.mjs
  docs/
    arch.md
    flow_plan_design.md
    problems.md
```

## Run Locally

```bash
npm test
npm start
```

Then open `http://localhost:4173`.

Use the local server instead of opening `index.html` directly, because browser module imports are more reliable over HTTP.

## Why This Can Be Trusted More Than A Pure Agent

The reconciliation engine is deterministic. It handles exact financial checks, date tolerances, duplicates, and exception classification without an LLM. The Q&A layer sits on top and is allowed to explain only what the engine already computed.

This separation matters because finance controls need repeatability, audit evidence, and refusal behavior.

## Production Hardening Checklist

- Add authentication and role-based access.
- Validate uploaded files before reconciliation.
- Store immutable audit events for every run and reviewer action.
- Version reconciliation rules and tolerance settings.
- Add importer contract tests for every bank and processor format.
- Add monitoring for exception-rate spikes.
- Add human approval workflows before any settlement status is changed.
- Add PII masking and encrypted storage.

## GitHub Setup

```bash
git init
git add .
git commit -m "Build settlement Q&A finance controller"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/settlement-qa-finance-controller.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username after creating the empty repository on GitHub.
