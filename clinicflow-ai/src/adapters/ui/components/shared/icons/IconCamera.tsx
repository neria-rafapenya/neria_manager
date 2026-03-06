type IconProps = {
  className?: string;
  size?: number;
};

export const IconCamera = ({ className, size = 18 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 72) / 80}
      viewBox="0 0 80 72"
      fill="none"
      className={className}
    >
      <path
        d="M52 0L59.3203 8H80V72H0V8H20.6797L28 0H52ZM40 20C28.96 20 20 28.96 20 40C20 51.04 28.96 60 40 60C51.04 60 60 51.04 60 40C60 28.96 51.04 20 40 20ZM40 28C46.6274 28 52 33.3726 52 40C52 46.6274 46.6274 52 40 52C33.3726 52 28 46.6274 28 40C28 33.3726 33.3726 28 40 28Z"
        fill="currentColor"
      />
    </svg>
  );
};
