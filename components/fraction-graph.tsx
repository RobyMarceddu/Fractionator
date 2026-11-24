import { formatFraction, getGraphModel, type Fraction } from "../lib/fractions";

function Disk({ ratio }: { ratio: number }) {
  const angle = ratio * 2 * Math.PI;
  const x = 80 + 76 * Math.sin(angle);
  const y = 80 - 76 * Math.cos(angle);
  return (
    <svg viewBox="0 0 160 160" className="fraction-disk" aria-hidden="true">
      {ratio === 0 || ratio === 1 ? (
        <circle className={ratio === 1 ? "disk-represented sector-major" : "disk-remaining sector-major"} cx="80" cy="80" r="76" fill={ratio === 1 ? "#F7B0FC" : "#FEEFFE"} stroke="#191B1C" strokeWidth="1.5" />
      ) : (
        <>
          <path className={`disk-remaining ${ratio < .5 ? "sector-major" : "sector-minor"}`} d={`M80 80 L${x} ${y} A76 76 0 ${ratio < .5 ? 1 : 0} 1 80 4 Z`} fill="#FEEFFE" stroke="#191B1C" strokeWidth="1.5" />
          <path className={`disk-represented ${ratio >= .5 ? "sector-major" : "sector-minor"}`} d={`M80 80 L80 4 A76 76 0 ${ratio > .5 ? 1 : 0} 1 ${x} ${y} Z`} fill="#F7B0FC" stroke="#191B1C" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export function FractionGraph({ fraction }: { fraction: Fraction }) {
  const model = getGraphModel(fraction);
  const disks = Array.from({ length: model.fullDisks }, (_, index) => <Disk key={index} ratio={1} />);
  const represented = model.remainder > 0n
    ? `${model.remainder}/${model.denominator}`
    : formatFraction({ numerator: fraction.numerator < 0n ? -fraction.numerator : fraction.numerator, denominator: fraction.denominator });
  return (
    <figure className="graph-result">
      <div className="graph-disks" aria-hidden="true">
        {model.negative && <span className="graph-minus">−</span>}
        {model.grouped ? (
          <div className="grouped-disk"><Disk ratio={1} /><span>× {String(model.whole)}</span></div>
        ) : disks}
        {(model.remainder > 0n || model.whole === 0n) && <Disk ratio={model.ratio} />}
      </div>
      <figcaption>
        <p className="graph-description">{model.description}</p>
        <div className="graph-legend">
          <span><i className="legend-swatch represented" aria-hidden="true" />{model.whole > 0n && model.remainder > 0n ? `${represented} dell’ultimo intero` : `${represented} rappresentato`}</span>
          {model.remainder > 0n && <span><i className="legend-swatch remaining" aria-hidden="true" />{String(model.denominator - model.remainder)}/{String(model.denominator)} rimanenti</span>}
        </div>
      </figcaption>
    </figure>
  );
}
