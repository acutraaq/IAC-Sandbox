import { createElement } from "react";
import { getIcon } from "@/lib/icons";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  return createElement(getIcon(name), { className });
}
