export const STATUS_LABELS = {
  matched: "Matched",
  amount_mismatch: "Amount mismatch",
  missing_bank_record: "Missing bank record",
  missing_processor_record: "Missing processor record",
  duplicate_processor_reference: "Duplicate processor reference",
  date_out_of_tolerance: "Date out of tolerance"
};

export function reconcileSettlements(processorSettlements, bankDeposits, options = {}) {
  const amountTolerance = options.amountTolerance ?? 0.01;
  const dateToleranceDays = options.dateToleranceDays ?? 2;
  const bankByProcessorRef = groupBy(bankDeposits, "processorRef");
  const processorRefs = new Set(processorSettlements.map((row) => row.processorRef));
  const rows = [];
  const usedBankRefs = new Set();

  for (const settlement of processorSettlements) {
    const candidates = bankByProcessorRef.get(settlement.processorRef) ?? [];
    const result = classifySettlement(settlement, candidates, amountTolerance, dateToleranceDays);
    for (const candidate of candidates) usedBankRefs.add(candidate.bankRef);
    rows.push(result);
  }

  for (const bankDeposit of bankDeposits) {
    if (!processorRefs.has(bankDeposit.processorRef) && !usedBankRefs.has(bankDeposit.bankRef)) {
      rows.push({
        settlement: null,
        bankDeposit,
        status: "missing_processor_record",
        severity: "exception",
        evidence: [
          `Bank deposit ${bankDeposit.bankRef} references ${bankDeposit.processorRef}, but no processor settlement exists.`
        ]
      });
    }
  }

  const matched = rows.filter((row) => row.status === "matched").length;
  const exceptions = rows.length - matched;
  return {
    rows,
    summary: {
      totalRows: rows.length,
      processorRecords: processorSettlements.length,
      bankRecords: bankDeposits.length,
      matched,
      exceptions,
      matchRate: Number((matched / rows.length).toFixed(4)),
      exceptionBreakdown: countBy(rows.filter((row) => row.status !== "matched"), "status")
    }
  };
}

function classifySettlement(settlement, candidates, amountTolerance, dateToleranceDays) {
  if (candidates.length === 0) {
    return {
      settlement,
      bankDeposit: null,
      status: "missing_bank_record",
      severity: "exception",
      evidence: [`No bank deposit found for processor reference ${settlement.processorRef}.`]
    };
  }

  if (candidates.length > 1) {
    return {
      settlement,
      bankDeposit: candidates[0],
      status: "duplicate_processor_reference",
      severity: "exception",
      evidence: [
        `${candidates.length} bank deposits share processor reference ${settlement.processorRef}.`,
        `Bank refs: ${candidates.map((candidate) => candidate.bankRef).join(", ")}.`
      ]
    };
  }

  const bankDeposit = candidates[0];
  const amountDelta = roundMoney(bankDeposit.amount - settlement.amount);
  if (Math.abs(amountDelta) > amountTolerance) {
    return {
      settlement,
      bankDeposit,
      status: "amount_mismatch",
      severity: "exception",
      evidence: [
        `Processor amount ${formatMoney(settlement.amount)} does not equal bank amount ${formatMoney(bankDeposit.amount)}.`,
        `Delta is ${formatMoney(amountDelta)}.`
      ]
    };
  }

  const dateDelta = daysBetween(settlement.processorDate, bankDeposit.bankDate);
  if (dateDelta > dateToleranceDays) {
    return {
      settlement,
      bankDeposit,
      status: "date_out_of_tolerance",
      severity: "warning",
      evidence: [
        `Bank date ${bankDeposit.bankDate} is ${dateDelta} days after processor date ${settlement.processorDate}.`,
        `Allowed settlement lag is ${dateToleranceDays} days.`
      ]
    };
  }

  return {
    settlement,
    bankDeposit,
    status: "matched",
    severity: "matched",
    evidence: [
      `Matched by processor reference ${settlement.processorRef}.`,
      `Amount and currency agree within tolerance; settlement lag is ${dateDelta} day(s).`
    ]
  };
}

export function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / 86400000);
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  }
  return grouped;
}

function countBy(rows, key) {
  return rows.reduce((accumulator, row) => {
    accumulator[row[key]] = (accumulator[row[key]] ?? 0) + 1;
    return accumulator;
  }, {});
}
