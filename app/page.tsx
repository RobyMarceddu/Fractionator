import { Calculator } from "../components/calculator";
import "./calculator.css";

export default function Home() {
  return (
    <div className="fractionator min-h-screen">
      <Calculator />
      <footer className="px-4 pb-6 text-center text-sm text-[#9BA3A8]">
        Roberta Marceddu - 2026
      </footer>
    </div>
  );
}
