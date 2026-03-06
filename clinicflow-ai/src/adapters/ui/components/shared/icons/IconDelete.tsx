interface IconDeleteProps {
  width?: number;
  height?: number;
  className?: string;
  hoverClass?: string;
}

export const IconDelete = ({
  width = 18,
  height = 18,
  className = "",
  hoverClass = "",
}: IconDeleteProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 63 72"
      fill="none"
      className={`${className} ${hoverClass}`}
    >
      <path
        d="M57.5996 21.5996V37.2598C56.4597 36.8398 55.2897 36.5254 54.0898 36.3154C52.89 36.1055 51.6602 36 50.4004 36V25.2002H32.4004V7.2002H7.2002V64.7998H30.0596C30.5396 66.1798 31.1404 67.4699 31.8604 68.6699C32.5803 69.8699 33.4199 70.98 34.3799 72H0V0H36L57.5996 21.5996ZM63 50.04L55.5303 57.5996L63 65.1602L57.96 70.2002L50.4004 62.7305L42.8398 70.2002L37.7998 65.1602L45.3604 57.5996L37.7998 50.04L42.8398 45L50.4004 52.5596L57.96 45L63 50.04Z"
        fill="currentColor"
      />
    </svg>
  );
};
