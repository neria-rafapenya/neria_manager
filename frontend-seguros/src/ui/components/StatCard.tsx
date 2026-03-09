interface Props {
  title: string;
  value: string;
  delta: string;
}

export function StatCard({ title, value, delta }: Props) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <div className="stat-value">
        <strong>{value}</strong>
        <span>{delta}</span>
      </div>
    </div>
  );
}
