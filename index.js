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
import {
  Point,
  Polygon,
} from 'ol/geom';

import { Delaunay } from 'd3-delaunay';

import { stations } from './stations';

const DEFAULT_VIEW = {
  lat: 49.2199539,
  lon: -123.0327729,
  zoom: 11,
}

const BOUNDING_BOX = {
  xmin: -123.25540036,
  xmax: -122.71461074,
  ymin: 49.1396771,
  ymax: 49.3386934,
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

function computeVoronoiPolygons() {
  const sites = stations.map(({ lat, lon }) => [lon, lat]);
  const delaunay = Delaunay.from(sites);
  const voronoi = delaunay.voronoi([BOUNDING_BOX.xmin, BOUNDING_BOX.ymin, BOUNDING_BOX.xmax, BOUNDING_BOX.ymax]);

  const cellPolygons = voronoi.cellPolygons();
  const cellFeatures = [];
  for (const cellPolygon of cellPolygons) {
    console.log('cellPolygon: ', cellPolygon);
    const vertices = [];
    for (const p of cellPolygon) {
      console.log('p: ', p);
      vertices.push(fromLonLat(p));
    }

    const cellFeature = new Feature({
      type: 'cell',
      geometry: new Polygon([
        vertices,
      ])
    });

    cellFeatures.push(cellFeature);
  }

  return { cells: cellFeatures };
}

function buildVectorLayer() {
  const stationMarkers = [];
  for (const station of stations) {
    const marker = new Feature({
      type: 'station',
      geometry: new Point(fromLonLat([station.lon, station.lat])),
    });

    stationMarkers.push(marker);
  }

  const { cells } = computeVoronoiPolygons();

  const styles = {
    'station': new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    }),
    'cell': new Style({
      stroke: new Stroke({
        color: 'red',
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.1)',
      }),
    }),
  }

  return new VectorLayer({
    source: new VectorSource({
      features: [...cells, ...stationMarkers],
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
