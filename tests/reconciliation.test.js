import { bankDeposits, processorSettlements } from "../src/data.js";
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
  assert.match(row.evidence.join(" "), /\$4,100\.00/);
  assert.match(row.evidence.join(" "), /\$4,090\.00/);
});

test("does not allow duplicate bank references to pass as matched", () => {
  const result = reconcileSettlements(processorSettlements, bankDeposits);
  const row = result.rows.find((candidate) => candidate.settlement?.settlementId === "STL-1042");

  assert.equal(row.status, "duplicate_processor_reference");
  assert.match(row.evidence.join(" "), /2 bank deposits/);
});
