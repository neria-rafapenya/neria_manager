type IconProps = {
  className?: string;
  size?: number;
};

export const IconViewDocument = ({ className, size = 16 }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 88) / 72}
      viewBox="0 0 72 88"
      fill="none"
      className={className}
    >
      <path
        d="M72 88H40V80H72V88ZM60 44.0996V60.7998L66.4004 54.4004L72 60L56 76L40 60L45.5996 54.4004L52 60.7998V44.0996H60ZM60 24V36.0996H52V28H32V8H8V64H32V72H0V0H36L60 24Z"
        fill="currentColor"
      />
    </svg>
  );
};
