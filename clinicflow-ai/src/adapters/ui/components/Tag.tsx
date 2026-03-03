interface TagProps {
  children: string;
  tone?: "neutral" | "success" | "warning" | "info";
}

export const Tag = ({ children, tone = "neutral" }: TagProps) => {
  return <span className={`tag tag-${tone}`}>{children}</span>;
};
