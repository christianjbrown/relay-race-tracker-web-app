/**
 * Just enough of google.maps for the adapters to be driven in tests. Every
 * object remembers what it was made with and what was done to it.
 */
export function fakeMaps() {
  const made = { polylines: [], markers: [], maps: [] };

  class LatLng {
    constructor(lat, lng) {
      this.latValue = lat;
      this.lngValue = lng;
    }

    lat() { return this.latValue; }

    lng() { return this.lngValue; }
  }

  class LatLngBounds {
    constructor() {
      this.points = [];
    }

    extend(p) {
      this.points.push(p);
    }
  }

  class Drawn {
    constructor(opts) {
      this.opts = opts;
      this.map = opts.map ?? null;
    }

    setMap(map) {
      this.map = map;
    }
  }

  class Polyline extends Drawn {
    constructor(opts) {
      super(opts);
      made.polylines.push(this);
    }
  }

  class Marker extends Drawn {
    constructor(opts) {
      super(opts);
      made.markers.push(this);
    }
  }

  /** Overlays are added and removed through setMap, as Google's are. */
  class OverlayView {
    setMap(map) {
      if (this.map && !map) this.onRemove();
      this.map = map;
      if (map) this.onAdd();
    }

    getMap() { return this.map; }

    getPanes() { return this.map.panes; }

    getProjection() { return this.map.projection; }
  }

  class GoogleMap {
    constructor(el, opts) {
      this.el = el;
      this.opts = opts;
      this.zoom = opts.zoom;
      this.calls = [];
      this.listeners = {};
      this.panes = null;
      this.projection = null;
      made.maps.push(this);
    }

    fitBounds(bounds, padding) { this.calls.push(['fitBounds', bounds.points, padding]); }

    panTo(pos) { this.calls.push(['panTo', pos]); }

    panBy(x, y) { this.calls.push(['panBy', x, y]); }

    getZoom() { return this.zoom; }

    setZoom(zoom) { this.zoom = zoom; }

    getDiv() { return this.el; }

    addListener(event, fn) { this.listeners[event] = fn; }
  }

  /** Answers each route request with whatever `answer(request)` gives: [result, status]. */
  class DirectionsService {
    route(request, callback) {
      callback(...DirectionsService.answer(request));
    }
  }
  DirectionsService.answer = () => [null, 'ZERO_RESULTS'];

  return {
    made,
    LatLng,
    LatLngBounds,
    Polyline,
    Marker,
    OverlayView,
    Map: GoogleMap,
    DirectionsService,
    SymbolPath: { CIRCLE: 'circle' },
    ControlPosition: { RIGHT_TOP: 'right-top' },
    MapTypeId: { ROADMAP: 'roadmap' },
    TravelMode: { DRIVING: 'DRIVING' },
  };
}

/** A projection that puts a position at (lng * 100, lat * 100) pixels, on the map and the container alike. */
export const flatProjection = {
  fromLatLngToDivPixel: (ll) => ({ x: ll.lng() * 100, y: ll.lat() * 100 }),
  fromLatLngToContainerPixel: (ll) => ({ x: ll.lng() * 100, y: ll.lat() * 100 }),
};
