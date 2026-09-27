/** The course under everything, its start and finish, and the name of every rest stop. */
export class CourseLayer {
  constructor(maps, map, theme, PlaceLabel) {
    this.maps = maps;
    this.map = map;
    this.theme = theme;
    this.PlaceLabel = PlaceLabel;
  }

  draw(points) {
    const t = this.theme;
    new this.maps.Polyline({ map: this.map, path: points, strokeColor: t.course, strokeWeight: 3, strokeOpacity: 0.85, zIndex: 1, clickable: false });
    const end = (position, label) => new this.maps.Marker({
      map: this.map,
      position,
      zIndex: 6,
      clickable: false,
      label: { text: label, fontSize: '13px' },
      icon: { path: this.maps.SymbolPath.CIRCLE, scale: 13, fillColor: t.blank, fillOpacity: 1, strokeColor: t.course, strokeWeight: 2 },
    });
    end(points[points.length - 1], '🏁');
    end(points[0], '▶️');
  }

  /**
   * Each rest stop's name, once, on the side facing away from the course,
   * so it covers open map rather than the legs.
   */
  labelStops(points, segments, nameOf) {
    const lngs = points.map((p) => p.lng);
    const middle = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const seen = new Set();
    for (const seg of segments) {
      if (seg.kind !== 'sleep') continue;
      const name = nameOf(seg.at);
      if (seen.has(name)) continue;
      seen.add(name);
      new this.PlaceLabel(seg.at, name, seg.at.lng < middle ? 'left' : 'right').setMap(this.map);
    }
  }
}
