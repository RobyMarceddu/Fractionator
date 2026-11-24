import assert from "node:assert/strict";
import test from "node:test";
import { calculateFractions, formatFraction, getGraphModel, parseOperand, type Operation } from "../lib/fractions/index";
import { calculatorReducer, initialState, type Action } from "../components/calculator-state";

function operand(numerator: string, denominator: string | null = null) {
  return parseOperand({ numerator, denominator });
}

for (const [a, ad, operation, b, bd, expected] of [
  ["1", "4", "+", "1", "2", "3/4"],
  ["1", "2", "−", "1", "4", "1/4"],
  ["2", "3", "×", "3", "4", "1/2"],
  ["7", "8", "÷", "1", "2", "7/4"],
  ["2", "3", "÷", "4", "5", "5/6"],
  ["1", "4", "−", "1", "2", "-1/4"],
  ["1", "4", "−", "1", "4", "0"],
  ["4", "2", "+", "1", "1", "3"],
  ["1", "-2", "+", "0", "1", "-1/2"],
  ["1", "2", "÷", "-1", "4", "-2"],
] as const) {
  test(`${a}/${ad} ${operation} ${b}/${bd} = ${expected}`, () => {
    const result = calculateFractions(operand(a, ad), operand(b, bd), operation);
    assert.equal(formatFraction(result.fraction), expected);
    assert.equal(result.steps.at(-1)?.formula, expected);
  });
}

test("i passaggi spiegano denominatore comune, prodotto e semplificazione", () => {
  const sum = calculateFractions(operand("1", "4"), operand("1", "2"), "+");
  assert.equal(sum.steps[0].formula, "1/4 + 2/4");
  const product = calculateFractions(operand("2", "3"), operand("3", "4"), "×");
  assert.ok(product.steps.some(step => step.formula === "6/12 = 1/2"));
  const division = calculateFractions(operand("7", "8"), operand("1", "2"), "÷");
  assert.equal(division.steps[0].formula, "7/8 × 2");
});

test("numeri oltre la precisione Number restano esatti", () => {
  const result = calculateFractions(operand("9007199254740993"), operand("1"), "+");
  assert.equal(formatFraction(result.fraction), "9007199254740994");
});

test("validazione con messaggi italiani per input incompleti e zero", () => {
  assert.throws(() => operand(""), /Completa il numeratore/);
  assert.throws(() => operand("1", ""), /Completa il denominatore/);
  assert.throws(() => operand("1", "0"), /denominatore deve essere diverso da zero/);
  assert.throws(() => operand("1.5"), /Completa il numeratore/);
  assert.throws(() => operand("9".repeat(25)), /24 cifre/);
  assert.throws(() => calculateFractions(operand("1", "2"), operand("0", "5"), "÷"), /Impossibile dividere per zero/);
});

test("grafico: zero, frazioni, improprie, raggruppamenti e segni", () => {
  assert.equal(getGraphModel(operand("0")).description, "0 interi");
  assert.equal(getGraphModel(operand("1", "4")).ratio, .25);
  const improper = getGraphModel(operand("7", "4"));
  assert.equal(improper.fullDisks, 1);
  assert.equal(improper.ratio, .75);
  assert.equal(improper.description, "1 intero e 3/4");
  assert.equal(getGraphModel(operand("13", "4")).fullDisks, 3);
  const grouped = getGraphModel(operand("41", "4"));
  assert.equal(grouped.grouped, true);
  assert.equal(grouped.whole, 10n);
  assert.equal(grouped.fullDisks, 1);
  assert.equal(getGraphModel(operand("-3", "4")).description, "Risultato negativo, -3/4");
});

function enter(actions: Action[]) {
  return actions.reduce(calculatorReducer, initialState());
}
const digit = (value: string): Action => ({ type: "digit", value });
const operator = (value: Operation): Action => ({ type: "operator", value });

test("tastierino: input → calcolo → modifica senza risultato obsoleto → reset", () => {
  const result = enter([digit("1"), { type: "denominator" }, digit("4"), operator("+"), digit("1"), { type: "denominator" }, digit("2"), { type: "calculate" }]);
  assert.equal(formatFraction(result.result!.fraction), "3/4");
  const editing = calculatorReducer(result, { type: "backspace" });
  assert.equal(editing.result, null);
  assert.equal(editing.operands[1].denominator, "");
  assert.deepEqual(calculatorReducer(editing, { type: "clear" }), initialState());
});

test("errore correggibile senza ricominciare", () => {
  const error = enter([digit("1"), operator("÷"), digit("0"), { type: "calculate" }]);
  assert.equal(error.error, "Impossibile dividere per zero");
  const correction: Action[] = [{ type: "backspace" }, digit("2"), { type: "calculate" }];
  const corrected = correction.reduce(calculatorReducer, error);
  assert.equal(corrected.error, null);
  assert.equal(formatFraction(corrected.result!.fraction), "1/2");
});

test("selezione del primo operando permette di correggere il denominatore", () => {
  let state = enter([digit("1"), { type: "denominator" }, digit("2"), operator("+"), digit("1")]);
  for (const action of [{ type: "select", operand: 0, field: "denominator" }, { type: "backspace" }, digit("0"), { type: "calculate" }] as Action[]) state = calculatorReducer(state, action);
  assert.equal(state.error, "Il denominatore deve essere diverso da zero");
  for (const action of [{ type: "backspace" }, digit("2"), { type: "calculate" }] as Action[]) state = calculatorReducer(state, action);
  assert.equal(formatFraction(state.result!.fraction), "3/2");
});
