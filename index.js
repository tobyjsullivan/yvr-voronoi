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
import Polygon from 'ol/geom/Polygon';

import { Delaunay } from 'd3-delaunay';

import { stations } from './stations';

const DEFAULT_VIEW = {
  lat: 49.2199539,
  lon: -123.0327729,
  zoom: 11,
}

const BOUNDING_BOX = {
  left: -123.25540036,
  right: -122.71461074,
  top: 49.3386934,
  bottom: 49.1396771,
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

  console.log('bbox: ', BOUNDING_BOX);

  const bboxPoly = new Feature({
    type: 'polygon',
    geometry: new Polygon([
      [
        fromLonLat([BOUNDING_BOX.left, BOUNDING_BOX.bottom]),
        fromLonLat([BOUNDING_BOX.right, BOUNDING_BOX.bottom]),
        fromLonLat([BOUNDING_BOX.right, BOUNDING_BOX.top]),
        fromLonLat([BOUNDING_BOX.left, BOUNDING_BOX.top]),
        fromLonLat([BOUNDING_BOX.left, BOUNDING_BOX.bottom]),
      ]
    ]),
  });

  const sites = stations.map(({ lat, lon }) => [lon, lat]);

  console.log('sites: ', sites);

  const delaunay = Delaunay.from(sites);
  console.log('delaunay: ', delaunay)

  const polygons = [];
  const { triangles, points } = delaunay;
  const numTriangles = triangles.length / 3;
  for (let i = 0; i < numTriangles; i++) {
    const t0 = triangles[i * 3 + 0];
    const t1 = triangles[i * 3 + 1];
    const t2 = triangles[i * 3 + 2];

    const point0 = [points[t0 * 2], points[t0 * 2 + 1]]
    const point1 = [points[t1 * 2], points[t1 * 2 + 1]]
    const point2 = [points[t2 * 2], points[t2 * 2 + 1]]

    const polygon = new Feature({
      type: 'polygon',
      geometry: new Polygon([[
        fromLonLat(point0),
        fromLonLat(point1),
        fromLonLat(point2),
      ]]),
    });

    polygons.push(polygon);
  }

  return { bboxPoly, polygons, points: [] };
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

  const { bboxPoly, polygons: voronoiCells, points } = computeVoronoiPolygons();

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
    }),
    'vertex': new Style({
      image: new Circle({
        radius: 3,
        fill: new Fill({ color: 'white' }),
        stroke: new Stroke({
          color: 'blue',
          width: 2,
        }),
      }),
    }),
    'polygon': new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)',
      })
    }),
  }

  return new VectorLayer({
    source: new VectorSource({
      features: [bboxPoly, ...voronoiCells, ...markers, ...points],
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
