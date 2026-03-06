interface IconAvailableProps {
  width?: number;
  height?: number;
  className?: string;
  hoverClass?: string;
}

export const IconAvailable = ({
  width = 16,
  height = 16,
  className = "",
  hoverClass = "",
}: IconAvailableProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 71 54"
      fill="none"
      className={`${className} ${hoverClass}`}
    >
      <path
        d="M70.4004 5.59961L22.4004 53.5996L0 31.2002L5.59961 25.5996L22.4004 42.4004L64.7998 0L70.4004 5.59961Z"
        fill="currentColor"
      />
    </svg>
  );
};
