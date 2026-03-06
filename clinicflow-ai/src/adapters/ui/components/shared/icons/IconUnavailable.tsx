interface IconUnavailableProps {
  width?: number;
  height?: number;
  className?: string;
  hoverClass?: string;
}

export const IconUnavailable = ({
  width = 16,
  height = 16,
  className = "",
  hoverClass = "",
}: IconUnavailableProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 72 72"
      fill="none"
      className={`${className} ${hoverClass}`}
    >
      <path
        d="M50.9199 0L72 21.0801V50.9199L50.9199 72H21.0801L0 50.9199V21.0801L21.0801 0H50.9199ZM36 30.3604L24.6797 19.04L19.04 24.6797L30.3604 36L19.04 47.3203L24.6797 52.96L36 41.6396L47.3203 52.96L52.96 47.3203L41.6396 36L52.96 24.6797L47.3203 19.04L36 30.3604Z"
        fill="currentColor"
      />
    </svg>
  );
};
