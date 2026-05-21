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
  Zap,
  MessageSquare,
  Radio,
  GitBranch,
  Clock,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

const iconMap = {
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
  Zap,
  MessageSquare,
  Radio,
  GitBranch,
  Clock,
  ArrowLeftRight,
} as const;

/** Valid icon name keys exported for type-safe usage. */
export type IconName = keyof typeof iconMap;

export function getIcon(name: string): LucideIcon {
  return iconMap[name as IconName] ?? Cloud;
}
