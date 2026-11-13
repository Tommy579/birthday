/* Barre de progression passive, non cliquable. */
export default function Progress({ index, total }) {
  const pct = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="progress-wrap">
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
      <span className="progress-count" aria-hidden="true">
        {index + 1} / {total}
      </span>
    </div>
  );
}
