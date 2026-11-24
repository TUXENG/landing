import {
  CircuitBoard,
  Code2,
  Cpu,
  Globe,
  GraduationCap,
  Laptop,
  Layers,
  Server,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

const ICON_MAP = {
  globe: Globe,
  server: Server,
  smartphone: Smartphone,
  cpu: Cpu,
  laptop: Laptop,
  zap: Zap,
  wrench: Wrench,
  code: Code2,
  layers: Layers,
  "circuit-board": CircuitBoard,
  graduation: GraduationCap,
} as const;

export function ServiceIcon({ name, className = "h-5 w-5" }: { name?: string; className?: string }) {
  const key = (name || "").toLowerCase() as keyof typeof ICON_MAP;
  const Icon = ICON_MAP[key] || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
