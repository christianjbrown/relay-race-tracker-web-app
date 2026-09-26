/** The map itself, as the rest of the page sees it: plain positions in, no Google types out. */
export class GoogleMapSurface {
  constructor(maps, map) {
    this.maps = maps;
    this.map = map;
  }

  fitBounds(points, padding) {
    const bounds = new this.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    this.map.fitBounds(bounds, padding);
  }

  panTo(pos) {
    this.map.panTo(pos);
  }

  panBy(x, y) {
    this.map.panBy(x, y);
  }

  getZoom() {
    return this.map.getZoom();
  }

  setZoom(zoom) {
    this.map.setZoom(zoom);
  }

  onDragStart(fn) {
    this.map.addListener('dragstart', fn);
  }
}

/** A new map in this element, quiet and dark (or light), filling the page. */
export function createMap(maps, el, styles, center) {
  return new maps.Map(el, {
    center,
    zoom: 7,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: maps.ControlPosition.RIGHT_TOP },
    gestureHandling: 'greedy',
    // Lets fitBounds use the space it is given rather than rounding down a
    // whole zoom level, which matters most when the card is pulled away.
    isFractionalZoomEnabled: true,
    clickableIcons: false,
    mapTypeId: maps.MapTypeId.ROADMAP,
    styles,
  });
}
