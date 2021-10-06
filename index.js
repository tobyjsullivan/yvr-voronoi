import 'ol/ol.css';

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import {
  Style,
  Circle,
  Fill,
  Stroke
} from 'ol/style';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';

import { stations } from './stations';

const DEFAULT_VIEW = {
  lat: 49.2199539,
  lon: -123.0327729,
  zoom: 11,
}

function drawMap($root) {
  return new Map({
    target: $root,
    layers: [
      new Tile({
        source: new OSM()
      }),
    ],
    view: new View({
      center: fromLonLat([DEFAULT_VIEW.lon, DEFAULT_VIEW.lat]),
      zoom: DEFAULT_VIEW.zoom
    })
  });
}

function buildVectorLayer() {
  const markers = [];
  for (const station of stations) {
    const marker = new Feature({
      type: 'marker',
      geometry: new Point(fromLonLat([station.lon, station.lat])),
    });

    markers.push(marker);
  }

  const styles = {
    'marker': new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    })
  }

  return new VectorLayer({
    source: new VectorSource({
      features: [...markers],
    }),
    style: function (feature) {
      return styles[feature.get('type')];
    },
  });
}

function main() {
  const map = drawMap(document.getElementById('map'));
  const vectorLayer = buildVectorLayer();
  map.addLayer(vectorLayer);
}

main();
