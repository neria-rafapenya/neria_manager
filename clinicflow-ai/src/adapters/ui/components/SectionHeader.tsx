interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  action,
}: SectionHeaderProps) => {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="btn btn-primary btn-normal">{action}</button>
      )}
    </div>
  );
};
