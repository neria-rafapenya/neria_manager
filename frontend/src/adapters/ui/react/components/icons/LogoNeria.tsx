import React, { useMemo } from "react";

export interface LogoNeriaProps {
  size?: number | string;
  color?: string;
  className?: string;
  title?: string;
}

const ORIGINAL_W = 167;
const ORIGINAL_H = 169;

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
      viewBox="0 0 167 169"
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
        d="M158.237 2.00434C161.382 -1.18203 166.808 1.05481 166.794 5.53223L166.433 120.632C166.429 121.516 165.414 122.011 164.715 121.471L3.69356 28.6476C2.41705 27.7013 1.30434 24.8376 1.30916 23.2484L1.36481 5.54443C1.37783 1.46778 6.00186 -0.880637 9.30135 1.5137L131.981 66.6995C135.312 69.1163 139.974 66.6988 139.918 62.5838L139.775 22.8253C139.756 21.4867 140.276 20.1966 141.216 19.2439L158.237 2.00434Z"
        fill="#F7951F"
      />
      <path
        d="M1.35489 54.0113C1.3678 49.9345 5.99287 47.5861 9.2924 49.9806L115.996 111.618L115.996 111.661L159.001 137.503C165.001 141.503 165.73 143.461 165.722 146.003L165.722 159.813C165.702 166.336 158.457 169.618 153.239 165.82L115.195 143.713L115.203 143.767L3.31229 78.7481C2.03576 77.8018 1.28486 76.3043 1.28981 74.7153L1.35489 54.0113Z"
        fill="#504646"
      />
      <path
        d="M0.231597 103.011C0.24451 98.9347 4.86958 96.5862 8.16911 98.9808L26.3304 109.842C28.4918 111.098 29.8994 113.651 29.8702 117.682L29.8727 118.747C29.9004 118.92 29.9215 119.089 29.9326 119.251L29.8973 128.007L29.9021 129.577C29.9017 129.71 29.8957 129.843 29.8892 129.974L29.8148 148.963C29.8065 151.505 28.591 153.891 26.5407 155.392L7.92773 167.381C4.61333 169.754 0.00332918 167.377 0.0157117 163.3L0.137378 124.596C0.138008 124.398 0.150623 124.2 0.174391 124.006C0.169098 123.909 0.166223 123.813 0.166514 123.715L0.231597 103.011Z"
        fill="#CE3434"
      />
    </svg>
  );
};

export default LogoNeria;
