/** Google's driving directions, as `{ path, seconds, metres }` with plain positions. */
export class GoogleDirections {
  constructor(maps, service) {
    this.maps = maps;
    this.service = service;
  }

  route({ origin, destination, departureTime }) {
    const ask = { origin, destination, travelMode: this.maps.TravelMode.DRIVING };
    if (departureTime) ask.drivingOptions = { departureTime };
    return new Promise((resolve, reject) => {
      this.service.route(ask, (result, status) => {
        if (status !== 'OK') {
          reject(new Error(`Directions answered ${status}`));
          return;
        }
        const leg = result.routes[0].legs[0];
        resolve({
          path: result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
          seconds: (leg.duration_in_traffic ?? leg.duration).value,
          metres: leg.distance.value,
        });
      });
    });
  }
}
