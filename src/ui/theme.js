export const KINDS = Object.freeze(['run', 'drive', 'sleep', 'free']);

/** What changes with the map's theme: the halo under each line, the course, and an empty dot. */
export const THEMES = Object.freeze({
  light: { name: 'light', halo: '#ffffff', course: '#8a867e', blank: '#ffffff' },
  dark: { name: 'dark', halo: '#161412', course: '#948e85', blank: '#2a2724' },
});

/** Dark for everyone, whatever the device prefers; `?theme=light` for the light one. */
export function chooseTheme(search, root) {
  const asked = new URLSearchParams(search).get('theme');
  const theme = THEMES[asked] ?? THEMES.dark;
  root.dataset.theme = theme.name;
  return theme;
}
