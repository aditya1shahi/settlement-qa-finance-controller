import { bankDeposits, createSettlementBatch, processorSettlements } from "../src/data.js";
import { reconcileSettlements } from "../src/reconciliation.js";

test("reconciles a 50+ record settlement batch with honest exceptions", () => {
  const result = reconcileSettlements(processorSettlements, bankDeposits);

  assert.equal(result.summary.processorRecords, 52);
  assert.equal(result.summary.totalRows, 53);
  assert.equal(result.summary.matched, 46);
  assert.equal(result.summary.exceptions, 7);
  assert.equal(result.summary.exceptionBreakdown.amount_mismatch, 1);
  assert.equal(result.summary.exceptionBreakdown.missing_bank_record, 3);
  assert.equal(result.summary.exceptionBreakdown.date_out_of_tolerance, 1);
  assert.equal(result.summary.exceptionBreakdown.duplicate_processor_reference, 1);
  assert.equal(result.summary.exceptionBreakdown.missing_processor_record, 1);
});

test("flags amount mismatch with auditable evidence", () => {
  const result = reconcileSettlements(processorSettlements, bankDeposits);
  const row = result.rows.find((candidate) => candidate.settlement?.settlementId === "STL-1015");

  assert.equal(row.status, "amount_mismatch");
  assert.match(row.evidence.join(" "), /Processor amount/);
  assert.match(row.evidence.join(" "), /bank amount/);
  assert.match(row.evidence.join(" "), /Delta is -\$10\.00/);
});

test("does not allow duplicate bank references to pass as matched", () => {
  const result = reconcileSettlements(processorSettlements, bankDeposits);
  const row = result.rows.find((candidate) => candidate.settlement?.settlementId === "STL-1042");

  assert.equal(row.status, "duplicate_processor_reference");
  assert.match(row.evidence.join(" "), /2 bank deposits/);
});

test("generates a different settlement batch for refresh actions", () => {
  const first = createSettlementBatch("refresh-one");
  const second = createSettlementBatch("refresh-two");

  assert.notEqual(first.batchId, second.batchId);
  assert.notEqual(first.processorSettlements[0].settlementId, second.processorSettlements[0].settlementId);
  assert.equal(first.processorSettlements.length, 52);
  assert.equal(second.processorSettlements.length, 52);
});
