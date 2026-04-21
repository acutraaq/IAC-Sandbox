/* eslint-disable react-hooks/static-components */
// DynamicIcon renders a Lucide icon by name. Lucide icons are stateless
// pure components, so the React Compiler concern about state reset does not apply.
import { getIcon } from "@/lib/icons";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = getIcon(name);
  return <Icon className={className} />;
}
