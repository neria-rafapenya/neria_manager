export default function IconInfo({
  width = 16,
  height = 16,
  color = "currentColor",
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 10V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1.5" fill={color} />
    </svg>
  );
}
