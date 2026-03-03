interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  tone?: "positive" | "warning" | "neutral";
}

export const StatCard = ({ label, value, change, tone = "neutral" }: StatCardProps) => {
  return (
    <div className={`card stat-card ${tone}`}>
      <p className="stat-label">{label}</p>
      <div className="stat-row">
        <p className="stat-value">{value}</p>
        {change && <span className="stat-change">{change}</span>}
      </div>
    </div>
  );
};
