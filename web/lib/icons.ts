import {
  Globe,
  Monitor,
  Database,
  HardDrive,
  Network,
  KeyRound,
  Box,
  LayoutGrid,
  Shield,
  Cloud,
  Server,
  Lock,
  Cpu,
  Folder,
  Layers,
  GitMerge,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Monitor,
  Database,
  HardDrive,
  Network,
  KeyRound,
  Box,
  LayoutGrid,
  Shield,
  Cloud,
  Server,
  Lock,
  Cpu,
  Folder,
  Layers,
  GitMerge,
  ShieldCheck,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Cloud;
}
