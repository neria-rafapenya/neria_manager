interface IconInfoProps {
  width?: number;
  height?: number;
  className?: string;
  hoverClass?: string;
}

export const IconInfo = ({
  width = 18,
  height = 18,
  className = "",
  hoverClass = "",
}: IconInfoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={`${className} ${hoverClass}`}
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 10V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
};
