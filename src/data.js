const merchants = [
  "North Campus Store",
  "Library Cafe",
  "Student Events",
  "Book Rental",
  "Parking Services",
  "Dining Hall",
  "Lab Supplies",
  "Theater Tickets",
  "Gym Membership",
  "Alumni Shop",
  "Clinic Desk",
  "Dorm Laundry",
  "Print Services",
  "Music Program",
  "Scholarship Gala",
  "Career Fair",
  "Campus Tours",
  "Tech Desk",
  "Study Abroad",
  "Pool Access",
  "Biology Club",
  "Robotics Team",
  "Art Studio",
  "Field Trip",
  "Guest Housing",
  "Admissions",
  "Math Lab",
  "Chemistry Store",
  "Radio Station",
  "Online Degree",
  "Language Center",
  "Graduation",
  "Procurement Desk",
  "Legal Clinic",
  "Seminar Series",
  "Museum",
  "Aquatics",
  "Childcare",
  "Continuing Ed",
  "Esports Arena",
  "Testing Center",
  "Garden Program",
  "Dining Catering",
  "Conference Hall",
  "Research Admin",
  "Wellness Center",
  "Veterans Office",
  "Security Desk",
  "Student Union",
  "Online Store",
  "Refund Desk",
  "Grant Office"
];

const exceptionPlan = {
  missingBankIndexes: new Set([7, 23, 46]),
  amountMismatchIndex: 14,
  dateToleranceIndex: 29,
  duplicateReferenceIndex: 41
};

export const initialBatch = createSettlementBatch(0);
export const processorSettlements = initialBatch.processorSettlements;
export const bankDeposits = initialBatch.bankDeposits;

export function createSettlementBatch(seed = Date.now()) {
  const random = seededRandom(seed);
  const batchNumber = seed === 0 ? 0 : Math.floor(random() * 7000) + 1000;
  const settlementStart = 1001 + batchNumber * 100;
  const paymentStart = 9001 + batchNumber * 100;
  const baseDate = new Date("2026-08-01T00:00:00Z");

  const processorRows = merchants.map((merchant, index) => {
    const settlementId = `STL-${settlementStart + index}`;
    const processorRef = `PAY-${paymentStart + index}`;
    const signedAmount = merchant === "Refund Desk" ? -1 : 1;
    const amount = signedAmount * roundMoney(95 + random() * 5900);
    const processorDate = addDays(baseDate, Math.floor(index / 2));

    return {
      settlementId,
      processorRef,
      merchant,
      amount,
      currency: "USD",
      processorDate
    };
  });

  const bankRows = processorRows
    .filter((row, index) => !exceptionPlan.missingBankIndexes.has(index) && index !== exceptionPlan.amountMismatchIndex && index !== exceptionPlan.dateToleranceIndex)
    .map((row) => createBankDeposit(row, 1));

  const mismatchSettlement = processorRows[exceptionPlan.amountMismatchIndex];
  bankRows.push({
    ...createBankDeposit(mismatchSettlement, 1),
    amount: roundMoney(mismatchSettlement.amount - 10)
  });

  const lateSettlement = processorRows[exceptionPlan.dateToleranceIndex];
  bankRows.push(createBankDeposit(lateSettlement, 4));

  const duplicateSettlement = processorRows[exceptionPlan.duplicateReferenceIndex];
  bankRows.push({
    ...createBankDeposit(duplicateSettlement, 1),
    bankRef: `${bankRefFor(duplicateSettlement)}-DUP`
  });

  bankRows.push({
    bankRef: `BNK-UNALLOC-${String(batchNumber + 1).padStart(4, "0")}`,
    processorRef: `PAY-${paymentStart + 999}`,
    amount: roundMoney(100 + random() * 250),
    currency: "USD",
    bankDate: addDays(baseDate, 26)
  });

  return {
    batchId: `BATCH-${String(batchNumber + 1).padStart(4, "0")}`,
    generatedAt: new Date().toISOString(),
    processorSettlements: processorRows,
    bankDeposits: bankRows
  };
}

function createBankDeposit(settlement, lagDays) {
  return {
    bankRef: bankRefFor(settlement),
    processorRef: settlement.processorRef,
    amount: settlement.amount,
    currency: settlement.currency,
    bankDate: addDays(`${settlement.processorDate}T00:00:00Z`, lagDays)
  };
}

function bankRefFor(settlement) {
  return `BNK-${settlement.processorRef.slice(4)}`;
}

function addDays(dateInput, days) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function seededRandom(seed) {
  let value = normalizeSeed(seed);
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function normalizeSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) return Math.abs(Math.floor(seed)) || 1;
  return String(seed)
    .split("")
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 1);
}
