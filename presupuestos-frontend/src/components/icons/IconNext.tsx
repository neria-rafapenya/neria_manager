import type { SVGProps } from "react";

type IconNextProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export default function IconNext({ title, ...props }: IconNextProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M11 0C17.0751 0 22 4.92487 22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2ZM11.293 6.29297C11.6835 5.90244 12.3165 5.90244 12.707 6.29297L16.707 10.293C17.0976 10.6835 17.0976 11.3165 16.707 11.707L12.707 15.707C12.3165 16.0976 11.6835 16.0976 11.293 15.707C10.9024 15.3165 10.9024 14.6835 11.293 14.293L13.5859 12H6C5.44772 12 5 11.5523 5 11C5 10.4477 5.44772 10 6 10H13.5859L11.293 7.70703C10.9024 7.31651 10.9024 6.68349 11.293 6.29297Z"
        fill="currentColor"
      />
    </svg>
  );
}
