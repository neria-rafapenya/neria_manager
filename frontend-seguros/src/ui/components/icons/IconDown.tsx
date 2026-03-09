import type { IconProps } from "./icons.types";

export const IconDown = ({ size = 14, className = "" }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 0.57}
      viewBox="0 0 14 8"
      fill="none"
      className={className}
    >
      <path
        d="M12.75 0.75L6.75 6.75L0.75 0.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
