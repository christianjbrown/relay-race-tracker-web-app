/** Below this width the card is a sheet over the bottom of the map; above it, a side panel. */
export const NARROW_PX = 720;

export const isNarrow = (win) => win.innerWidth < NARROW_PX;
