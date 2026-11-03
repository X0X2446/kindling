export function mark(dev: string, variant = "original", simple = dev, color = "white") {
  return {
    icon: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${dev}/${dev}-${variant}.svg`,
    iconFallback: `https://cdn.simpleicons.org/${simple}/${color}`,
  };
}
