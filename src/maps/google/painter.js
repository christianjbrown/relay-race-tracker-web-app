/**
 * Draws the journey's pieces: each line solid with a halo, or dashed when
 * it is still to come, and each stop as a dot, filled once it is reached.
 */
export class Painter {
  constructor(maps, map, theme, colours) {
    this.maps = maps;
    this.map = map;
    this.theme = theme;
    this.colours = colours;
    this.drawn = [];
  }

  paint(pieces) {
    this.drawn.forEach((o) => o.setMap(null));
    this.drawn = [];
    for (const p of pieces) {
      const colour = this.colours[p.kind];
      if (p.path) {
        if (p.faded) this.dashed(p.path, colour);
        else this.solid(p.path, colour);
      }
      if (p.spot) this.stop(p, colour);
    }
  }

  solid(path, colour) {
    this.add(new this.maps.Polyline({ path, strokeColor: this.theme.halo, strokeWeight: 9, strokeOpacity: 0.9, zIndex: 2, clickable: false }));
    this.add(new this.maps.Polyline({ path, strokeColor: colour, strokeWeight: 5, zIndex: 3, clickable: false }));
  }

  dashed(path, colour) {
    this.add(new this.maps.Polyline({
      path,
      strokeOpacity: 0,
      zIndex: 2,
      clickable: false,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, strokeColor: colour, strokeWeight: 4, scale: 2 },
        offset: '0',
        repeat: '12px',
      }],
    }));
  }

  stop(p, colour) {
    this.add(new this.maps.Marker({
      position: p.spot,
      title: p.title,
      zIndex: p.faded ? 4 : 5,
      icon: {
        path: this.maps.SymbolPath.CIRCLE,
        // Free time can be where the runner rested, so it is the smaller
        // dot and the rest's ring stays visible round it.
        scale: p.kind === 'free' ? 5 : 8,
        fillColor: p.faded ? this.theme.blank : colour,
        fillOpacity: 1,
        strokeColor: p.faded ? colour : this.theme.halo,
        strokeWeight: 3,
      },
    }));
  }

  add(o) {
    o.setMap(this.map);
    this.drawn.push(o);
  }
}
