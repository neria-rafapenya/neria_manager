type IconProps = {
  className?: string;
  size?: number;
};

export const IconSend = ({ className, size = 18 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 84) / 87}
      viewBox="0 0 87 84"
      fill="none"
      className={className}
    >
      <path
        d="M48.4966 83.161L86.3056 -5.57899e-05L1.21635e-06 29.9438L18.8302 50.6663L68.5665 16.1655L29.6073 62.4924L48.4966 83.161Z"
        fill="currentColor"
      />
    </svg>
  );
};
