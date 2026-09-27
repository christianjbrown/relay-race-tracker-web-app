/**
 * Things drawn on the map as page elements rather than Google's own
 * markers, so they can use the page's type and CSS. Each class is made
 * from the loaded library's OverlayView, which does not exist before it.
 */

/** Positions an element at a place on the map, or hides it when there is none. */
function place(overlay, el, pos) {
  const projection = overlay.getProjection();
  el.hidden = !pos || !projection;
  if (el.hidden) return null;
  const at = new overlay.maps.LatLng(pos.lat, pos.lng);
  const pt = projection.fromLatLngToDivPixel(at);
  el.style.left = `${pt.x}px`;
  el.style.top = `${pt.y}px`;
  return { projection, at };
}

/** The runner on the map: their face, with a badge for what they are doing and a cake on their birthday. */
export function makeRunnerMarker(maps, doc) {
  return class RunnerMarker extends maps.OverlayView {
    constructor({ avatar, alt, colours, badges, onClick }) {
      super();
      this.maps = maps;
      this.colours = colours;
      this.badges = badges;
      this.pos = null;
      this.el = doc.createElement('div');
      this.el.className = 'runner';
      this.el.hidden = true;
      const img = doc.createElement('img');
      img.src = avatar;
      img.alt = alt;
      this.badge = doc.createElement('span');
      this.badge.className = 'badge';
      this.badge.hidden = true;
      this.cake = doc.createElement('span');
      this.cake.className = 'cake';
      this.cake.hidden = true;
      this.cake.textContent = '🎂';
      this.el.append(img, this.badge, this.cake);
      this.el.addEventListener('click', onClick);
    }

    onAdd() { this.getPanes().floatPane.appendChild(this.el); }

    onRemove() { this.el.remove(); }

    draw() { place(this, this.el, this.pos); }

    /** `badge` is a key of the badges ('run', 'finished', ...) or null for none. */
    update(pos, badge, birthday) {
      this.pos = pos;
      this.cake.hidden = !birthday;
      this.badge.hidden = !badge;
      if (badge) {
        this.badge.textContent = this.badges[badge];
        this.badge.style.setProperty('--badge', this.colours[badge] ?? this.colours.run);
      }
      this.draw();
    }
  };
}

/**
 * A small tag on the map, wherever a tracker really is: the vehicle, or
 * (as 'group-marker') the rest of the team on the course.
 */
export function makeVehicleMarker(maps, doc) {
  return class VehicleMarker extends maps.OverlayView {
    constructor(label, className = 'vehicle-marker') {
      super();
      this.maps = maps;
      this.pos = null;
      this.el = doc.createElement('div');
      this.el.className = className;
      this.el.textContent = label;
      this.el.hidden = true;
    }

    onAdd() { this.getPanes().overlayMouseTarget.appendChild(this.el); }

    onRemove() { this.el.remove(); }

    draw() { place(this, this.el, this.pos); }

    update(pos) {
      this.pos = pos;
      this.draw();
    }
  };
}

const NARROW_PX = 720;
const LABELS_FROM_ZOOM = 8;

/** A stop's name beside it, on whichever side keeps it on the map. */
export function makePlaceLabel(maps, doc) {
  return class PlaceLabel extends maps.OverlayView {
    constructor(pos, text, side) {
      super();
      this.maps = maps;
      this.pos = pos;
      this.side = side;
      this.el = doc.createElement('div');
      this.el.className = `place-label ${side}`;
      this.el.textContent = text;
    }

    onAdd() { this.getPanes().overlayLayer.appendChild(this.el); }

    onRemove() { this.el.remove(); }

    draw() {
      const placed = place(this, this.el, this.pos);
      if (!placed) return;
      const width = this.getMap().getDiv().clientWidth;
      // On a phone the whole route is too small for the names to sit beside
      // it without covering it; they appear once you zoom in.
      this.el.hidden = width < NARROW_PX && this.getMap().getZoom() < LABELS_FROM_ZOOM;
      // Flip to the other side when the preferred one would run off the map.
      const x = placed.projection.fromLatLngToContainerPixel(placed.at).x;
      const need = this.el.offsetWidth + 22;
      let side = this.side;
      if (side === 'right' && x + need > width) side = 'left';
      else if (side === 'left' && x - need < 0) side = 'right';
      this.el.classList.toggle('left', side === 'left');
      this.el.classList.toggle('right', side === 'right');
    }
  };
}
