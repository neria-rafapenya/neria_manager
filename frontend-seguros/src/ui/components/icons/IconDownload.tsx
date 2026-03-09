interface IconDownloadProps {
  width?: number;
  height?: number;
  className?: string;
}

export const IconDownload = ({
  width = 18,
  height = 18,
  className = "",
}: IconDownloadProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 20 21"
      fill="none"
      className={className}
    >
      <path
        d="M19 11C19.5523 11 20 11.4477 20 12V18C20 19.6569 18.6569 21 17 21H3C1.34315 21 0 19.6569 0 18V12C0 11.4477 0.447715 11 1 11C1.55228 11 2 11.4477 2 12V18C2 18.5523 2.44771 19 3 19H17C17.5523 19 18 18.5523 18 18V12C18 11.4477 18.4477 11 19 11ZM10 0C10.5523 0 11 0.447715 11 1V12.4316L14.2637 8.87891C14.6373 8.47238 15.2701 8.44584 15.6768 8.81934C16.0832 9.19294 16.1098 9.82576 15.7363 10.2324L10.7363 15.6768C10.547 15.8828 10.2799 16 10 16C9.72015 16 9.45304 15.8828 9.26367 15.6768L4.26367 10.2314C3.89036 9.82479 3.91688 9.1929 4.32324 8.81934C4.72995 8.44583 5.36274 8.47233 5.73633 8.87891L9 12.4316V1C9 0.447715 9.44771 0 10 0Z"
        fill="currentColor"
      />
    </svg>
  );
};
