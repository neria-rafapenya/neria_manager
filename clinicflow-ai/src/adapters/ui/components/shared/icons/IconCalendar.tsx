interface IconCalendarProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconCalendar = ({
  width = 18,
  height = 18,
  className = "",
}: IconCalendarProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 80 84"
      fill="none"
      className={className}
    >
      <path
        d="M60 44C65.5333 44 70.2504 45.9496 74.1504 49.8496C78.0504 53.7496 80 58.4667 80 64C80 69.5333 78.0504 74.2504 74.1504 78.1504C70.2504 82.0504 65.5333 84 60 84C54.4667 84 49.7496 82.0504 45.8496 78.1504C41.9496 74.2504 40 69.5333 40 64C40 58.4667 41.9496 53.7496 45.8496 49.8496C49.7496 45.9496 54.4667 44 60 44ZM20 8H52V0H60V8H72V38.7002C70.7333 38.1002 69.4329 37.6002 68.0996 37.2002C66.7664 36.8002 65.3999 36.4998 64 36.2998V32H8V72H33.2002C33.6669 73.4666 34.2163 74.8669 34.8496 76.2002C35.4829 77.5335 36.233 78.8001 37.0996 80H0V8H12V0H20V8ZM58 64.7998L66.7002 73.5L69.5 70.7002L62 63.2002V52H58V64.7998ZM8 24H64V16H8V24Z"
        fill="currentColor"
      />
    </svg>
  );
};
