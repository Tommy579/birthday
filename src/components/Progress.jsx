/* Filet de progression : une seule ligne, remplie d'un trait rose. */
export default function Progress({ index, total }) {
  const pct = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={index + 1}
      aria-label="Progression"
    >
      <span className="fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
