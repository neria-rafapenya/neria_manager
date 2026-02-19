import React, { useMemo } from "react";

export interface LogoNeriaProps {
  size?: number | string;
  color?: string;
  className?: string;
  title?: string;
}

const ORIGINAL_W = 133;
const ORIGINAL_H = 160;

const LogoNeria: React.FC<LogoNeriaProps> = ({
  size = 95,
  color = "#F1F5F8",
  className,
  title = "Neria",
}) => {
  const finalSize = typeof size === "number" ? `${size}px` : size || "95px";

  // Mantener proporción: height = width * (160/133)
  const { width, height } = useMemo(() => {
    if (typeof size === "number") {
      const w = size;
      const h = Math.round((ORIGINAL_H / ORIGINAL_W) * w);
      return { width: `${w}px`, height: `${h}px` };
    }

    // Si size es string (ej "120px", "6rem"), usamos el mismo valor para width
    // y calculamos height via CSS con aspect-ratio.
    return { width: finalSize, height: undefined as unknown as string };
  }, [size, finalSize]);

  const fill = color;

  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={typeof size === "number" ? height : undefined}
      viewBox="0 0 133 160"
      fill="none"
      role="img"
      aria-label={title}
      style={
        typeof size === "number"
          ? undefined
          : {
              width: finalSize,
              height: "auto",
              aspectRatio: `${ORIGINAL_W} / ${ORIGINAL_H}`,
              display: "block",
            }
      }
    >
      <path
        d="M97.808 65.753C101.147 68.1599 105.801 65.7276 105.731 61.6124L105.464 45.8543C105.441 44.5156 105.957 43.2237 106.894 42.268L123.86 24.975C126.995 21.7787 132.429 23.999 132.429 28.4766V120.577C132.429 121.461 131.415 121.96 130.714 121.421L129.056 120.145C129.033 120.127 129 120.143 129 120.172C129 120.2 128.968 120.217 128.945 120.2L2.03508 26.739C0.755458 25.7967 0 24.3021 0 22.713V5.00887C0 0.93197 4.61692 -1.43119 7.924 0.952984L97.808 65.753Z"
        fill={fill}
      />
      <path
        d="M27.67 100.726C31.7484 103.598 32.2325 109.462 28.6804 112.964L13.6166 127.816C8.56071 132.8 0 129.219 0 122.119V96.6588C0 90.1763 7.30609 86.3855 12.6062 90.118L27.67 100.726Z"
        fill={fill}
      />
      <path
        d="M128.746 134.123C130.792 135.631 132 138.021 132 140.563V151.604C132 158.128 124.61 161.909 119.319 158.092L3.31934 74.4027C1.23493 72.8989 0 70.4851 0 67.9149V55.0739C0 48.5124 7.4641 44.7412 12.7461 48.6339L128.746 134.123Z"
        fill={fill}
      />
    </svg>
  );
};

export default LogoNeria;
