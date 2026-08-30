import { bankDeposits, processorSettlements } from "../src/data.js";
import { answerQuestion } from "../src/qaAgent.js";
import { reconcileSettlements } from "../src/reconciliation.js";

const reconciliation = reconcileSettlements(processorSettlements, bankDeposits);

test("answers match-rate questions from computed reconciliation results", () => {
  const answer = answerQuestion("What is the match rate?", reconciliation);

  assert.match(answer, /86\.79%/);
  assert.match(answer, /46 matched out of 53/);
});

test("explains a specific settlement with source evidence", () => {
  const answer = answerQuestion("Why did STL-1015 fail?", reconciliation);

  assert.match(answer, /STL-1015 is Amount mismatch/);
  assert.match(answer, /PAY-9015/);
  assert.match(answer, /Delta is -\$10\.00/);
});

test("refuses to invent answers outside the settlement batch", () => {
  const answer = answerQuestion("Should I invest in this company?", reconciliation);

  assert.match(answer, /only from the reconciled settlement batch/);
});
