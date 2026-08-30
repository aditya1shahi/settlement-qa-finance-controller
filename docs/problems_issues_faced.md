problems faced during building this project and how i solved them

## bad source data

Records may arrive with missing references, currency errors, duplicate IDs, or delayed deposits

solved it with schema validation, required-field checks, duplicate detection, currency normalization, and a quarantine queue for invalid records

## False matches

Loose matching can pair the wrong processor settlement with a bank deposit

solved it by starting with strict reference matching, adding tolerances only where business-approved, and logging every match rule used

## LLM hallucination

A Q&A agent may answer beyond the reconciled batch or sound confident about unsupported facts

Solved it with retrieval-only context, refusal rules, citation/evidence requirements, deterministic financial calculations, and tests for unsupported questions

## audit failure

controller cannot trust a system that cannot explain why a row was matched or failed

solved it by storing inputs, outputs, rule version, timestamps, evidence strings, and reviewer actions for every row

## Privacy and access control

real settlement files can contain sensitive financial or customer data

solved it with role-based access, encryption at rest, encrypted transport, least-privilege service accounts, and masked logs

## race conditions == coinciding requests

two users or jobs may attempt to resolve the same exception
solved it with row-level locking, optimistic concurrency checks, and immutable audit events

## over automation

agent might close exceptions that require judgment
solved it with confidence thresholds, policy-based escalation, approval queues, and hard blocks around cash-impacting actions
