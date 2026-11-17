import {
  Bell, ChartColumn, Check, CircleCheck, Clock, FileText, History, House, Image, Link as LinkIcon,
  MapPin, Megaphone, MessageSquare, Pencil, Search, Settings, Sparkles, Store, Wrench, X,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "bell": Bell,
  "chart-column": ChartColumn,
  "check": Check,
  "circle-check": CircleCheck,
  "clock": Clock,
  "file-text": FileText,
  "history": History,
  "house": House,
  "image": Image,
  "link": LinkIcon,
  "map-pin": MapPin,
  "megaphone": Megaphone,
  "message-square": MessageSquare,
  "pencil": Pencil,
  "search": Search,
  "settings": Settings,
  "sparkles": Sparkles,
  "store": Store,
  "wrench": Wrench,
  "x": X,
};

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const C = ICONS[name] ?? CircleCheck;
  return <C size={size} color={color} strokeWidth={strokeWidth} aria-hidden />;
}

/** Colored rounded square with a white icon, used all over the activity lists. */
export function IconBadge({
  name,
  color,
  size = 40,
  radius = 12,
  iconSize = 18,
}: {
  name: string;
  color: string;
  size?: number;
  radius?: number;
  iconSize?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: radius,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={iconSize} color="#ffffff" />
    </span>
  );
}
