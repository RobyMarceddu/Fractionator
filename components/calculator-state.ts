import {
  calculateFractions,
  FractionError,
  parseOperand,
  type Calculation,
  type Operand,
  type Operation,
} from "../lib/fractions";

export type Field = "numerator" | "denominator";
export type State = {
  operands: [Operand, Operand];
  operation: Operation | null;
  active: 0 | 1;
  field: Field;
  result: Calculation | null;
  error: string | null;
};
export type Action =
  | { type: "digit"; value: string }
  | { type: "operator"; value: Operation }
  | { type: "select"; operand: 0 | 1; field: Field }
  | { type: "denominator" | "sign" | "negativeDenominator" | "backspace" | "clear" | "calculate" | "example" };

export function initialState(): State {
  return {
    operands: [{ numerator: "", denominator: null }, { numerator: "", denominator: null }],
    operation: null,
    active: 0,
    field: "numerator",
    result: null,
    error: null,
  };
}

function editOperand(state: State, operand: Operand): State {
  const operands: [Operand, Operand] = [...state.operands];
  operands[state.active] = operand;
  return { ...state, operands, result: null, error: null };
}

export function calculatorReducer(state: State, action: Action): State {
  const operand = state.operands[state.active];
  switch (action.type) {
    case "clear": return initialState();
    case "example": return {
      ...initialState(),
      operands: [{ numerator: "1", denominator: "4" }, { numerator: "1", denominator: "2" }],
      operation: "+", active: 1, field: "denominator",
    };
    case "select":
      return { ...state, active: action.operand, field: action.field };
    case "digit": {
      if (!/^\d$/.test(action.value)) return state;
      const current = operand[state.field] ?? "";
      if (current.replace("-", "").length >= 24) {
        return { ...state, result: null, error: "Usa al massimo 24 cifre per ogni numero" };
      }
      const next = current === "0" ? action.value : current === "-0" ? `-${action.value}` : current + action.value;
      return editOperand(state, { ...operand, [state.field]: next });
    }
    case "denominator":
      if (!/^-?\d+$/.test(operand.numerator)) {
        return { ...state, result: null, error: "Completa il numeratore" };
      }
      return { ...editOperand(state, { ...operand, denominator: operand.denominator ?? "" }), field: "denominator" };
    case "sign":
      return editOperand(state, {
        ...operand,
        numerator: operand.numerator.startsWith("-") ? operand.numerator.slice(1) : `-${operand.numerator}`,
      });
    case "negativeDenominator":
      if (state.field === "denominator" && operand.denominator === "") {
        return editOperand(state, { ...operand, denominator: "-" });
      }
      return state;
    case "backspace": {
      if (state.field === "denominator") {
        if (operand.denominator) return editOperand(state, { ...operand, denominator: operand.denominator.slice(0, -1) });
        return { ...editOperand(state, { ...operand, denominator: null }), field: "numerator" };
      }
      if (operand.numerator) return editOperand(state, { ...operand, numerator: operand.numerator.slice(0, -1) });
      if (state.active === 1 && state.operation) {
        return { ...state, operation: null, active: 0, field: state.operands[0].denominator === null ? "numerator" : "denominator", result: null, error: null };
      }
      return state;
    }
    case "operator":
      try {
        parseOperand(state.operands[0]);
        return { ...state, operation: action.value, active: 1, field: state.operands[1].denominator === null ? "numerator" : "denominator", result: null, error: null };
      } catch (error) {
        return { ...state, result: null, error: error instanceof FractionError ? error.message : "Controlla l'operazione" };
      }
    case "calculate":
      try {
        const left = parseOperand(state.operands[0]);
        if (!state.operation) throw new FractionError("Scegli un'operazione");
        const right = parseOperand(state.operands[1]);
        return { ...state, result: calculateFractions(left, right, state.operation), error: null };
      } catch (error) {
        return { ...state, result: null, error: error instanceof FractionError ? error.message : "Controlla l'operazione e riprova" };
      }
  }
}
