// src/adapters/ui/react/components/icons/IconSend.tsx
import type { FC } from "react";

export interface IconSendProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IconSend: FC<IconSendProps> = ({
  size = 24,
  color = "#FFFFFF",
  className,
}) => {
  // Mantiene la proporción original 41x33
  const width = size;
  const height = (size * 33) / 41;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 41 33"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M40.0566 1.98277e-05L15.667 32.172L0 5.03601L40.0566 1.98277e-05ZM9.75696 14.1016L21.4015 10.7705L12.6945 19.1895L16.1217 25.1256L31.3227 5.0425L6.32971 8.16541L9.75696 14.1016Z"
        fill={color}
      />
    </svg>
  );
};

export default IconSend;
