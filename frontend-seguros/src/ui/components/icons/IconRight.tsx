import type { IconProps } from "./icons.types";

export const IconRight = ({ size = 14, className = "" }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size * 0.57}
      height={size}
      viewBox="0 0 8 14"
      fill="none"
      className={className}
    >
      <path
        d="M0.75 0.75L6.75 6.75L0.75 12.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
