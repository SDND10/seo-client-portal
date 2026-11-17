// Activity type -> [color, lucide icon name], matching the design.
export const KINDS: Record<string, [string, string]> = {
  "Content": ["#2c54f2", "file-text"],
  "Google My Business": ["#15803d", "map-pin"],
  "On-page": ["#b45309", "pencil"],
  "Backlinks": ["#7c4dff", "link"],
  "Technical": ["#0e1a3a", "wrench"],
  "Keywords": ["#0d7d77", "search"],
  "AI visibility": ["#c026d3", "sparkles"],
  "Approved": ["#15803d", "check"],
  "Rejected": ["#dc2626", "x"],
};

// GMB subtype -> [color, icon]
export const GMB_KINDS: Record<string, [string, string]> = {
  "Reviews": ["#7c4dff", "message-square"],
  "Posts": ["#2c54f2", "megaphone"],
  "Photos": ["#b45309", "image"],
  "Profile updates": ["#15803d", "store"],
};

export function kindOf(type: string): [string, string] {
  return KINDS[type] ?? ["#5f6b82", "circle-check"];
}
