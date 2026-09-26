/** One colour per kind of segment, used on the map, the card and the legend. */
export const COLOURS = Object.freeze({ run: '#EB6834', drive: '#E87BA4', sleep: '#5F4D8C', free: '#A9A79C' });

export const KINDS = Object.freeze(['run', 'drive', 'sleep', 'free']);

/** What changes with the map's theme: the halo under each line, the course, and an empty dot. */
export const THEMES = Object.freeze({
  light: { name: 'light', halo: '#ffffff', course: '#9a978f', blank: '#ffffff' },
  dark: { name: 'dark', halo: '#161412', course: '#6a655d', blank: '#2a2724' },
});

/** Dark for everyone, whatever the device prefers; `?theme=light` for the light one. */
export function chooseTheme(search, root) {
  const asked = new URLSearchParams(search).get('theme');
  const theme = THEMES[asked] ?? THEMES.dark;
  root.dataset.theme = theme.name;
  return theme;
}
