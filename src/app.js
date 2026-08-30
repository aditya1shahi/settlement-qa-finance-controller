import { createSettlementBatch, initialBatch } from "./data.js";
import { answerQuestion, SUGGESTED_QUESTIONS } from "./qaAgent.js";
import { formatMoney, reconcileSettlements, statusLabel } from "./reconciliation.js";

const state = {
  batch: initialBatch,
  reconciliation: reconcileSettlements(initialBatch.processorSettlements, initialBatch.bankDeposits),
  filter: "all"
};

const elements = {
  recordCount: document.querySelector("#recordCount"),
  matchedCount: document.querySelector("#matchedCount"),
  matchRate: document.querySelector("#matchRate"),
  exceptionCount: document.querySelector("#exceptionCount"),
  settlementRows: document.querySelector("#settlementRows"),
  statusFilter: document.querySelector("#statusFilter"),
  rerunButton: document.querySelector("#rerunButton"),
  quickQuestions: document.querySelector("#quickQuestions"),
  qaForm: document.querySelector("#qaForm"),
  questionInput: document.querySelector("#questionInput"),
  answerBox: document.querySelector("#answerBox"),
  loadingOverlay: document.querySelector("#loadingOverlay")
};

function render() {
  const { summary, rows } = state.reconciliation;
  elements.recordCount.textContent = summary.totalRows;
  elements.matchedCount.textContent = summary.matched;
  elements.matchRate.textContent = `${(summary.matchRate * 100).toFixed(2)}%`;
  elements.exceptionCount.textContent = summary.exceptions;

  const visibleRows = rows.filter((row) => state.filter === "all" || row.status === state.filter);
  elements.settlementRows.innerHTML = visibleRows.map(renderRow).join("");
}

function renderRow(row) {
  const settlement = row.settlement;
  const bankDeposit = row.bankDeposit;
  const id = settlement?.settlementId ?? "Bank-only";
  const processor = settlement
    ? `${settlement.processorRef}<br><span class="mono">${formatMoney(settlement.amount, settlement.currency)}</span>`
    : "Missing";
  const bank = bankDeposit
    ? `${bankDeposit.bankRef}<br><span class="mono">${formatMoney(bankDeposit.amount, bankDeposit.currency)}</span>`
    : "Missing";
  const severityClass = row.severity === "matched" ? "matched" : row.severity === "warning" ? "warning" : "exception";

  return `
    <tr>
      <td><strong>${escapeHtml(id)}</strong><br>${escapeHtml(settlement?.merchant ?? "Unallocated bank deposit")}</td>
      <td>${processor}</td>
      <td>${bank}</td>
      <td><span class="status ${severityClass}">${escapeHtml(statusLabel(row.status))}</span></td>
      <td>${escapeHtml(row.evidence.join(" "))}</td>
    </tr>
  `;
}

function renderQuickQuestions() {
  elements.quickQuestions.innerHTML = SUGGESTED_QUESTIONS.map((question) => (
    `<button type="button" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`
  )).join("");
}

function ask(question) {
  elements.answerBox.textContent = answerQuestion(question, state.reconciliation);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

elements.statusFilter.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

elements.rerunButton.addEventListener("click", () => {
  refreshBatch();
});

async function refreshBatch() {
  setLoading(true);
  await delay(650);
  state.batch = createSettlementBatch(`${Date.now()}-${globalThis.crypto?.randomUUID?.() ?? Math.random()}`);
  state.reconciliation = reconcileSettlements(state.batch.processorSettlements, state.batch.bankDeposits);
  state.filter = "all";
  elements.statusFilter.value = "all";
  render();
  ask(`New ${state.batch.batchId} reconciled. What is the match rate?`);
  setLoading(false);
}

function setLoading(isLoading) {
  elements.rerunButton.disabled = isLoading;
  elements.rerunButton.classList.toggle("is-loading", isLoading);
  elements.loadingOverlay.hidden = !isLoading;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

elements.quickQuestions.addEventListener("click", (event) => {
  const question = event.target.dataset.question;
  if (!question) return;
  elements.questionInput.value = question;
  ask(question);
});

elements.qaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(new FormData(event.currentTarget).get("question"));
});

renderQuickQuestions();
render();
ask("What is the match rate?");
