import type { SVGProps } from "react";
import IconNext from "./IconNext";

type IconPrevProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export default function IconPrev({ title, style, ...props }: IconPrevProps) {
  return (
    <IconNext
      title={title}
      style={{ transform: "rotate(180deg)", ...style }}
      {...props}
    />
  );
}
