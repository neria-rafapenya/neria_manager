import type { IconProps } from "./icons.types";

export const IconTrash = ({ size = 20, className = "" }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 22) / 20}
      viewBox="0 0 20 22"
      fill="none"
      className={className}
    >
      <path
        d="M12 0C13.6569 0 15 1.34315 15 3V4H19C19.5523 4 20 4.44772 20 5C20 5.55228 19.5523 6 19 6H18V19C18 20.6569 16.6569 22 15 22H5C3.34315 22 2 20.6569 2 19V6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H5V3C5 1.34315 6.34315 0 8 0H12ZM4 19C4 19.5523 4.44771 20 5 20H15C15.5523 20 16 19.5523 16 19V6H4V19ZM8 9C8.55228 9 9 9.44771 9 10V16C9 16.5523 8.55228 17 8 17C7.44772 17 7 16.5523 7 16V10C7 9.44771 7.44772 9 8 9ZM12 9C12.5523 9 13 9.44771 13 10V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V10C11 9.44771 11.4477 9 12 9ZM8 2C7.44771 2 7 2.44771 7 3V4H13V3C13 2.44771 12.5523 2 12 2H8Z"
        fill="currentColor"
      />
    </svg>
  );
};
