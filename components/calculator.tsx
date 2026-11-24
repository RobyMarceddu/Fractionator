"use client";

import { useEffect, useReducer, useRef } from "react";
import { formatFraction, type Fraction, type Operation } from "../lib/fractions";
import { calculatorReducer, initialState, type Action, type Field } from "./calculator-state";
import { FractionGraph } from "./fraction-graph";

const keys: { label: string; name: string; action: Action; kind?: string }[] = [
  { label: "AC", name: "Azzera il calcolo", action: { type: "clear" }, kind: "clear" },
  { label: "⌫", name: "Cancella ultimo carattere", action: { type: "backspace" }, kind: "backspace" },
  { label: "±", name: "Cambia segno", action: { type: "sign" } },
  { label: "÷", name: "Dividi", action: { type: "operator", value: "÷" } },
  ...["7", "8", "9"].map(digitKey),
  { label: "×", name: "Moltiplica", action: { type: "operator", value: "×" } },
  ...["4", "5", "6"].map(digitKey),
  { label: "−", name: "Sottrai", action: { type: "operator", value: "−" } },
  ...["1", "2", "3"].map(digitKey),
  { label: "+", name: "Somma", action: { type: "operator", value: "+" } },
  { ...digitKey("0"), kind: "zero" },
  { label: "/", name: "Inserisci denominatore", action: { type: "denominator" } },
  { label: "=", name: "Calcola", action: { type: "calculate" }, kind: "equals" },
];

function digitKey(value: string) {
  return { label: value, name: value, action: { type: "digit", value } as Action };
}

function FractionValue({ value }: { value: Fraction }) {
  const negative = value.numerator < 0n;
  const absolute = negative ? -value.numerator : value.numerator;
  return (
    <span className="formatted-fraction" role="math" aria-label={formatFraction(value)}>
      <span aria-hidden="true" className="fraction-content">
        {negative && <span className="fraction-sign">−</span>}
        {value.denominator === 1n ? <span>{String(absolute)}</span> : (
          <span className="fraction-stack"><span>{String(absolute)}</span><span>{String(value.denominator)}</span></span>
        )}
      </span>
    </span>
  );
}

export function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, undefined, initialState);
  const graphHeading = useRef<HTMLHeadingElement>(null);
  const navigatingWithTab = useRef(false);
  const { result, error } = state;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select, [contenteditable=true]")) return;
      if (event.key === "Tab") { navigatingWithTab.current = true; return; }
      if (event.key === "Enter" && target.matches("button, a") && navigatingWithTab.current) return;
      if (event.key === "Enter" && target.matches("a, .example-button")) return;
      let action: Action | undefined;
      if (/^\d$/.test(event.key)) action = { type: "digit", value: event.key };
      else if (event.key === "/") action = { type: "denominator" };
      else if (event.key === "Enter" || event.key === "=") action = { type: "calculate" };
      else if (event.key === "Backspace") action = { type: "backspace" };
      else if (event.key === "Escape" || event.key === "Delete") action = { type: "clear" };
      else if (event.key === "F9") action = { type: "sign" };
      else if (event.key === "-" && state.field === "denominator" && state.operands[state.active].denominator === "") action = { type: "negativeDenominator" };
      else {
        const operators: Record<string, Operation> = { "+": "+", "-": "−", "*": "×", "x": "×", ":": "÷", "\\": "÷" };
        if (operators[event.key]) action = { type: "operator", value: operators[event.key] };
        else if (event.key === "-" && state.operands[state.active].numerator === "") action = { type: "sign" };
      }
      // A leading minus enters a signed operand instead of selecting subtraction.
      if (event.key === "-" && state.field === "numerator" && state.operands[state.active].numerator === "") action = { type: "sign" };
      if (action) {
        navigatingWithTab.current = false;
        event.preventDefault();
        dispatch(action);
      }
    }
    function handlePointer() { navigatingWithTab.current = false; }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointer);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointer);
    };
  }, [state.active, state.field, state.operands]);

  function renderInputField(operand: 0 | 1, field: Field) {
    const value = state.operands[operand][field];
    const active = state.active === operand && state.field === field && !result;
    return (
      <button
        type="button"
        className={`expression-field ${active ? "is-active" : ""}`}
        aria-label={`${field === "numerator" ? "Numeratore" : "Denominatore"} ${operand === 0 ? "prima" : "seconda"} frazione: ${value || "vuoto"}`}
        aria-pressed={active}
        onClick={() => dispatch({ type: "select", operand, field })}
      >{value ? value.replace("-", "−") : <span className="input-placeholder">□</span>}</button>
    );
  }

  function renderOperand(operand: 0 | 1) {
    const hasDenominator = state.operands[operand].denominator !== null;
    return (
      <span className={hasDenominator ? "expression-operand stacked" : "expression-operand"}>
        {renderInputField(operand, "numerator")}
        {hasDenominator && renderInputField(operand, "denominator")}
      </span>
    );
  }

  function goToGraph(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    graphHeading.current?.focus({ preventScroll: true });
    graphHeading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  const announcement = error || (result ? `Risultato: ${formatFraction(result.fraction)}` : "");
  const hasInput = Boolean(state.operands[0].numerator || state.operation);

  const display = (
    <section className="panel display-panel" aria-labelledby="result-title">
      <div className="panel-inner display-inner">
        <div className="display-top flex items-center justify-between gap-3">
          <h2 id="result-title" className="eyebrow">Il tuo calcolo</h2>
          {result && <span className="display-meta">Risultato semplificato</span>}
        </div>
        <div className="display-bottom">
          <div className="expression-line" aria-label="Espressione">
            {hasInput ? <>
              {renderOperand(0)}
              {state.operation && <><span className="expression-operator">{state.operation}</span>{renderOperand(1)}</>}
              {result && <span className="expression-operator">=</span>}
            </> : <p className="empty-instruction">Inserisci un&apos;operazione</p>}
          </div>
          <div className={`result-line ${error ? "has-error" : ""}`}>
            {error ? <p className="error-message">{error}</p> : result ? <FractionValue value={result.fraction} /> : <span className="result-placeholder" aria-label="Nessun risultato">—</span>}
          </div>
        </div>
      </div>
    </section>
  );

  const keypad = (
    <section className="panel keypad-panel" aria-labelledby="keypad-title">
      <div className="panel-inner keypad-inner">
        <div className="flex items-center justify-between gap-2">
          <h2 id="keypad-title" className="panel-title">Tastierino</h2>
        </div>
        <div className="keypad-grid">
          {keys.map(key => (
            <button
              key={key.label}
              type="button"
              aria-label={key.name}
              className={`calculator-key ${key.kind ? `key-${key.kind}` : ""}`}
              onClick={() => dispatch(key.action)}
            >{key.kind === "backspace" ? <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5h11v14H9l-7-7 7-7Z"/><path d="m12 9 6 6m0-6-6 6"/></svg> : key.label}</button>
          ))}
        </div>
        <div className="keypad-help">
          <p><span>/</span> inserisce il denominatore <span className="help-divider">·</span> <span>÷</span> divide</p>
          <p className="keyboard-help">Da tastiera: <kbd>/</kbd> frazione, <kbd>:</kbd> divisione, <kbd>Invio</kbd> calcola.</p>
        </div>
        {result && <a className="details-link" href="#grafico" onClick={goToGraph}>Vedi grafico e passaggi</a>}
      </div>
    </section>
  );

  const details = (
    <div className="details-column">
      <section className="panel graph-panel" aria-labelledby="grafico">
        <div className="panel-inner">
          <h2 id="grafico" ref={graphHeading} tabIndex={-1} className="panel-title">Grafico</h2>
          {result ? <FractionGraph fraction={result.fraction} /> : <div className="graph-empty">
            <svg viewBox="0 0 120 120" className="empty-chart" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M60 12v48h48M60 60 26 94" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            <p>{error ? "Correggi l'operazione per vedere il grafico" : "Il grafico compare dopo il calcolo"}</p>
          </div>}
        </div>
      </section>

      <section className="panel steps-panel" aria-labelledby="steps-title">
        <div className="panel-inner">
          <h2 id="steps-title" className="panel-title">Passaggi del calcolo</h2>
          <p className="steps-hint">Dal denominatore comune alla semplificazione, ogni passaggio ha il suo perché.</p>
          {result ? <ol className="calculation-steps">
            {result.steps.map((step, index) => <li key={index} className={step.final ? "final-step" : ""}>
              <p className="step-title">{step.title}</p>
              <div className="step-formula"><span>{step.formula}</span></div>
            </li>)}
          </ol> : <div className="steps-empty">
            <p>{error ? "Correggi l'operazione per vedere i passaggi" : "I passaggi compaiono dopo il calcolo"}</p>
            <button type="button" className="example-button" onClick={() => dispatch({ type: "example" })}>Prova 1/4 + 1/2</button>
          </div>}
        </div>
      </section>
    </div>
  );

  return (
    <main className="app-shell">
      <header className="app-header flex flex-wrap items-center justify-between gap-3">
        <h1 className="brand"><span className="brand-mark" aria-hidden="true">f<span>/</span></span>Fractionator</h1>
        <p className="tagline">Calcolatrice di frazioni</p>
      </header>
      {display}
      <div className="workspace">
        {keypad}
        {details}
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    </main>
  );
}
