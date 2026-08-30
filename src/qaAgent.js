import { formatMoney, statusLabel } from "./reconciliation.js";

export const SUGGESTED_QUESTIONS = [
  "What is the match rate?",
  "List the exceptions.",
  "Why did STL-1015 fail?",
  "Which records need human review?"
];

export function answerQuestion(question, reconciliation) {
  const normalized = question.trim().toLowerCase();
  if (!normalized) {
    return "Ask a settlement-control question about match rate, exceptions, evidence, or a settlement ID.";
  }

  if (containsAny(normalized, ["match rate", "accuracy", "matched"])) {
    const pct = (reconciliation.summary.matchRate * 100).toFixed(2);
    return `Match rate is ${pct}% (${reconciliation.summary.matched} matched out of ${reconciliation.summary.totalRows} reviewed rows). This is computed after including unresolved bank-only deposits, so it is not cherry-picked.`;
  }

  if (containsAny(normalized, ["exception", "exceptions", "unresolved", "human review", "review"])) {
    return summarizeExceptions(reconciliation);
  }

  if (containsAny(normalized, ["cash", "exposure", "delta", "money at risk"])) {
    return summarizeCashExposure(reconciliation);
  }

  const settlementId = normalized.match(/stl-\d{4}/i)?.[0]?.toUpperCase();
  if (settlementId) {
    return explainSettlement(settlementId, reconciliation);
  }

  return "I can answer only from the reconciled settlement batch. Try asking for the match rate, exception list, cash exposure, or a specific settlement such as STL-1015.";
}

function summarizeExceptions(reconciliation) {
  const exceptions = reconciliation.rows.filter((row) => row.status !== "matched");
  if (exceptions.length === 0) return "No exceptions found. Every reviewed processor and bank row matched.";

  const lines = exceptions.map((row) => {
    const id = row.settlement?.settlementId ?? row.bankDeposit.bankRef;
    return `- ${id}: ${statusLabel(row.status)}. ${row.evidence.join(" ")}`;
  });

  return `There are ${exceptions.length} exception row(s):\n${lines.join("\n")}`;
}

function summarizeCashExposure(reconciliation) {
  const amountIssues = reconciliation.rows.filter((row) => row.status === "amount_mismatch");
  const missingBank = reconciliation.rows.filter((row) => row.status === "missing_bank_record");
  const missingProcessor = reconciliation.rows.filter((row) => row.status === "missing_processor_record");
  const amountDelta = amountIssues.reduce((sum, row) => sum + (row.bankDeposit.amount - row.settlement.amount), 0);
  const missingBankAmount = missingBank.reduce((sum, row) => sum + row.settlement.amount, 0);
  const unknownBankAmount = missingProcessor.reduce((sum, row) => sum + row.bankDeposit.amount, 0);

  return [
    `Known amount mismatch delta: ${formatMoney(amountDelta)}.`,
    `Processor cash not found in bank feed: ${formatMoney(missingBankAmount)}.`,
    `Bank cash without processor support: ${formatMoney(unknownBankAmount)}.`,
    "Treat this as an operational exposure summary, not financial advice."
  ].join("\n");
}

function explainSettlement(settlementId, reconciliation) {
  const row = reconciliation.rows.find((candidate) => candidate.settlement?.settlementId === settlementId);
  if (!row) return `${settlementId} is not present in this settlement batch.`;

  const settlement = row.settlement;
  const bankText = row.bankDeposit
    ? `${row.bankDeposit.bankRef} on ${row.bankDeposit.bankDate} for ${formatMoney(row.bankDeposit.amount, row.bankDeposit.currency)}`
    : "no linked bank deposit";

  return [
    `${settlementId} is ${statusLabel(row.status)}.`,
    `Processor: ${settlement.processorRef}, ${settlement.merchant}, ${formatMoney(settlement.amount, settlement.currency)} on ${settlement.processorDate}.`,
    `Bank: ${bankText}.`,
    `Evidence: ${row.evidence.join(" ")}`
  ].join("\n");
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}
