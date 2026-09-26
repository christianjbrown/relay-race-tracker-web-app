// Quiet street maps, so the coloured legs and the runner are what the eye
// finds. Towns and countries keep clear labels; Google names them in the
// page's language by itself.
const LIGHT = [
  { elementType: 'geometry', stylers: [{ saturation: -80 }, { lightness: 10 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7670' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e4e1dc' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f1efeb' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d6dde3' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f0ec' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eceae4' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cfcac2' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#4f4b45' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#5c5852' }] },
];

const DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1f1d1b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8d877e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#161412' }, { weight: 3 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2b28' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#262320' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#383430' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12171b' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#22201d' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#45403a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#c4bdb2' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#aaa297' }] },
];

export const MAP_STYLES = Object.freeze({ light: LIGHT, dark: DARK });
