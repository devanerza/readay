import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

// Maps the Material Symbols names used in the original design to the closest
// MaterialIcons glyph name available in @expo/vector-icons.
const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  menu: "menu",
  search: "search",
  settings: "settings",
  auto_stories: "auto-stories",
  explore: "explore",
  book_2: "menu-book",
  person_2: "person",
  auto_awesome_motion: "auto-awesome-motion",
  auto_awesome: "auto-awesome",
  play_arrow: "play-arrow",
  schedule: "schedule",
  arrow_forward: "arrow-forward",
  arrow_back: "arrow-back",
  chevron_right: "chevron-right",
  favorite: "favorite",
  share: "share",
  bookmark: "bookmark-border",
  timer: "timer",
  pause: "pause",
  stop_circle: "stop-circle",
  format_quote: "format-quote",
  wb_twilight: "wb-twilight",
  mood: "mood",
  light_mode: "light-mode",
  edit: "edit",
  lightbulb: "lightbulb-outline",
};

export type IconName = keyof typeof ICON_MAP;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
};

export default function Icon({ name, size = 24, color = "#1b1c1a", filled }: Props) {
  const glyph = ICON_MAP[name] ?? "help-outline";
  return <MaterialIcons name={glyph} size={size} color={color} style={filled ? { opacity: 1 } : undefined} />;
}
