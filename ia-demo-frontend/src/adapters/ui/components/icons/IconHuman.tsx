// src/adapters/ui/react/components/icons/IconHuman.tsx
import type { FC } from "react";

export interface IconHumanProps {
  size?: number;
  color?: string;
}

export const IconHuman: FC<IconHumanProps> = ({
  size = 18,
  color = "#ffffff",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.9-3.7 4-6 7.5-6s6.6 2.3 7.5 6" />
    </svg>
  );
};

export default IconHuman;
