interface IconGoogleProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconGoogle = ({
  width = 18,
  height = 18,
  className = "",
}: IconGoogleProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 533.5 544.3"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill="#4285f4"
        d="M533.5 278.4c0-18.4-1.5-36.1-4.3-53.4H272v101h146.9c-6.3 34-25 62.8-53.2 82v68.2h86.1c50.3-46.3 81.7-114.4 81.7-197.8z"
      />
      <path
        fill="#34a853"
        d="M272 544.3c72.8 0 134-24.1 178.6-65.3l-86.1-68.2c-23.9 16-54.5 25.4-92.5 25.4-71 0-131.2-47.9-152.7-112.1H30.4v70.4C74.6 476.1 166.4 544.3 272 544.3z"
      />
      <path
        fill="#fbbc04"
        d="M119.3 324.1c-10.5-31.8-10.5-66.3 0-98.1V155.6H30.4c-39.4 78.8-39.4 171.8 0 250.6l88.9-70.4z"
      />
      <path
        fill="#ea4335"
        d="M272 107.7c39.6-.6 77.6 14.3 106.6 41.7l79.4-79.4C410.4 24.9 344.8-1.3 272 0 166.4 0 74.6 68.1 30.4 155.6l88.9 70.4C140.8 155.6 201 107.7 272 107.7z"
      />
    </svg>
  );
};
