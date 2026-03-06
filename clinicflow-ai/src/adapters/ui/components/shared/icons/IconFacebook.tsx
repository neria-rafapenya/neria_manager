interface IconFacebookProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconFacebook = ({
  width = 18,
  height = 18,
  className = "",
}: IconFacebookProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill="#ffffff"
        d="M22 12.1C22 6.5 17.5 2 11.9 2S2 6.5 2 12.1c0 5 3.7 9.1 8.4 9.8v-6.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.7-1.6 1.5V12h2.7l-.4 3h-2.3v6.9c4.7-.7 8.4-4.8 8.4-9.8z"
      />
    </svg>
  );
};
