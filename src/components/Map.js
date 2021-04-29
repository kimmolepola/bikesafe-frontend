import React, { useRef, useEffect, useState } from 'react';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker'; // eslint-disable-line
import {
  Box, Container, Paper, Button, Link, FormControlLabel, Switch, TextField,
} from '@material-ui/core';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import ReactDOM from 'react-dom';
import {
  useMutation, useQuery, gql,
} from '@apollo/client';
import Theme from '../Theme';

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    position: 'relative',
    background: 'green',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sidebar: {
    position: 'absolute',
    backgroundColor: 'rgba(35, 55, 75, 0.9)',
    color: '#ffffff',
    padding: '6px 12px',
    font: '15px/24px monospace',
    zIndex: 1,
    top: 0,
    left: 0,
    margin: '12px',
    borderRadius: '4px',
  },
}));

const ALL_POINTS = gql`query{allPoints}`;
const ADD_POINT = gql`mutation ($point: String!){
  addPoint(
    point: $point
  ) 
}`;

const handleError = (error) => {
  console.error(error);
};

const setupPopupAnchor = ({ mapContainer, e }) => {
  const mapDimensions = mapContainer.current.getBoundingClientRect();
  const popupMaxHeight = mapContainer.current.clientHeight / 2;
  const popupWidthAbout = 400;

  let popupAnchor = 'left';
  if (e.point.y <= popupMaxHeight / 2 && e.point.x < mapDimensions.width - popupWidthAbout) {
    popupAnchor = 'top-left';
  } else if (e.point.y <= popupMaxHeight / 2
    && e.point.x >= mapDimensions.width - popupWidthAbout) {
    popupAnchor = 'top-right';
  } else if (e.point.y >= mapDimensions.height - popupMaxHeight / 2
    && e.point.x < mapDimensions.width - popupWidthAbout) {
    popupAnchor = 'bottom-left';
  } else if (e.point.y >= mapDimensions.height - popupMaxHeight / 2
    && e.point.x >= mapDimensions.width - popupWidthAbout) {
    popupAnchor = 'bottom-right';
  } else if (e.point.x >= mapDimensions.width - popupWidthAbout) {
    popupAnchor = 'right';
  }
  return popupAnchor;
};

const naviEditHandleClick = ({
  map, e, mapContainer, addPoint,
}) => {
  const inputTitle = React.createRef();
  const inputType = React.createRef();
  const inputGroupID = React.createRef();
  const inputCategory = React.createRef();
  const inputLng = React.createRef();
  const inputLat = React.createRef();

  const content = document.createElement('div');

  const styleFormField = { marginTop: 10 };

  const popup = new mapboxgl.Popup({
    anchor: setupPopupAnchor({ mapContainer, e }),
  })
    .setLngLat([e.lngLat.lng, e.lngLat.lat])
    // .setHTML(`<h3>${feature.properties.type}</h3>`)
    .setDOMContent(content)
    .addTo(map);

  const onSubmit = (ev) => {
    ev.preventDefault();
    console.log(map.getSource('points'));
    const newPoint = {
      // feature for point A
      // id: pointsSource.data.previousFeatureId + 1,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          inputLng.current.value,
          inputLat.current.value,
        ],
      },
      properties: {
        title: inputTitle.current.value,
        type: inputType.current.value,
        category: inputCategory.current.value,
        groupID: inputGroupID.current.value,
      },
    };

    addPoint({
      variables: {
        point: JSON.stringify(newPoint),
      },
    });

    popup.remove();

    /*
    const newPointsSource = { ...pointsSource };
    newPointsSource.data.previousFeatureId = newPoint.id;
    newPointsSource.data.features.push(newPoint);
    setPointsSource(newPointsSource);
    console.log(newPointsSource);
    const setData = async () => {
      await map.getSource('points').setData(newPointsSource.data);
      popup.remove();
    };
    setData();
    */
  };

  ReactDOM.render(
    <div style={{ maxHeight: mapContainer.current.clientHeight / 2, overflowY: 'auto' }}>
      <div>Add a point</div>
      <form onSubmit={onSubmit} noValidate autoComplete="off">
        <TextField style={styleFormField} size="small" inputRef={inputTitle} placeholder="e.g. Point A" id="outlined-basic" label="Title" />
        <TextField style={styleFormField} size="small" inputRef={inputType} placeholder="e.g. line" id="outlined-basic" label="Type" />
        <TextField style={styleFormField} size="small" inputRef={inputGroupID} placeholder="" id="outlined-basic" label="GroupID" />
        <TextField style={styleFormField} size="small" inputRef={inputCategory} placeholder="e.g. u-rack" id="outlined-basic" label="Category" />
        <TextField style={styleFormField} defaultValue={e.lngLat.lng} size="small" inputRef={inputLng} id="outlined-basic" label="Longitude" />
        <TextField style={styleFormField} defaultValue={e.lngLat.lat} size="small" inputRef={inputLat} id="outlined-basic" label="Latitude" />
        <Button style={styleFormField} type="submit" variant="contained" color="primary">Submit</Button>
      </form>
    </div>,
    content,
  );
};

const naviAppHandleClick = ({
  map, e, setSelectedFeatures, setTab,
}) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['points'], // replace this with the name of the layer
  });

  if (!features.length) {
    return;
  }

  const feature = features[0];

  console.log(feature);

  const onClick = () => {
    setSelectedFeatures([feature]);
    setTab(1);
  };

  const content = document.createElement('div');
  ReactDOM.render(
    <div>
      <div>ID: {feature.id}</div>
      <Button onClick={onClick}>more</Button>
    </div>,
    content,
  );

  const popup = new mapboxgl.Popup()
    .setLngLat(feature.geometry.coordinates)
    // .setHTML(`<h3>${feature.properties.type}</h3>`)
    .setDOMContent(content)
    .addTo(map);
};

const setupMap = ({
  addPoint,
  setMap,
  navi,
  setTab,
  setSelectedFeatures,
  mapContainer,
  lng,
  lat,
  zoom,
  setLng,
  setLat,
  setZoom,
}) => {
  mapboxgl.workerClass = MapboxWorker;
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOXGL_ACCESSTOKEN;

  const map = new mapboxgl.Map({
    container: mapContainer.current,
    // style: 'mapbox://styles/mapbox/streets-v11',
    style: process.env.REACT_APP_MAPPBOX_STYLE,
    center: [lng, lat],
    zoom,
  });

  map.on('load', () => {
    // Add an image to use as a custom marker
    map.loadImage(
      'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
      (error, image) => {
        if (error) throw error;
        map.addImage('custom-marker', image);

        map.addSource('points', {
          type: 'geojson',
          tolerance: 0,
          data: {
            type: 'FeatureCollection',
            previousFeatureId: 0,
            features: [
            ],
          },
        });

        // Add a symbol layer
        map.addLayer({
          id: 'points',
          type: 'symbol',
          source: 'points',
          layout: {
            'icon-image': 'custom-marker',
            'icon-anchor': 'bottom',
            // get the title name from the source's "title" property
            'text-field': ['get', 'title'],
            'text-font': [
              'Open Sans Semibold',
              'Arial Unicode MS Bold',
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': 'white',
            'text-halo-blur': 0,
            'text-halo-width': 1,
            'text-halo-color': 'black',
          },
        });
        setMap(map);
      },
    );
  });

  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on('mouseenter', 'points', () => {
    if (navi.current !== 'Edit') {
      map.getCanvas().style.cursor = 'pointer';
    }
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'points', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('contextmenu', (e) => {
    naviEditHandleClick({
      map, e, mapContainer, addPoint,
    });
  });

  map.on('click', (e) => {
    naviAppHandleClick({
      map, setSelectedFeatures, setTab, e,
    });
  });

  map.on('move', () => {
    setLng(map.getCenter().lng.toFixed(4));
    setLat(map.getCenter().lat.toFixed(4));
    setZoom(map.getZoom().toFixed(2));
  });

  return () => {
    map.remove();
  };
};

const Map = ({
  navigation, tab, setFeatures, setSelectedFeatures, setTab,
}) => {
  const classes = useStyles();
  const [lng, setLng] = useState(24.9454);
  const [lat, setLat] = useState(60.1655);
  const [zoom, setZoom] = useState(13.76);
  const [map, setMap] = useState(null);

  const mapContainer = useRef();
  const navi = useRef();
  navi.current = navigation;

  const {
    loading: pointsLoading,
    error: pointsError,
    data: pointsData,
  } = useQuery(ALL_POINTS, { fetchPolicy: 'network-only' });

  /*
  const refetch = () => {
    console.log('asdf');
  };
  const pointsData = {
    allPoints: JSON.stringify({
      type: 'geojson',
      tolerance: 0,
      data: {
        type: 'FeatureCollection',
        previousFeatureId: 112,
        features: [
          {
          // feature for point A
            id: 111,
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                24.9454,
                60.1655,
              ],
            },
            properties: {
              title: 'Point A',
            },
          },
          {
          // feature for point B
            id: 112,
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                24.9554,
                60.1755,
              ],
            },
            properties: {
              title: 'Point B',
            },
          },
        ],
      },
    }),
  };
*/

  const [addPoint] = useMutation(ADD_POINT, {
    onError: handleError,
    refetchQueries: [{ query: ALL_POINTS, notifyOnNetworkStatusChange: true }],
  });

  useEffect(() => {
    setupMap({
      addPoint,
      setMap,
      navi,
      setTab,
      setSelectedFeatures,
      setFeatures,
      mapContainer,
      lng,
      lat,
      zoom,
      setLng,
      setLat,
      setZoom,
    });
  }, []);

  // workaround for useEffect to notice change in pointsData
  // after addPoint mutation fires refetchQueries
  // const asfd = pointsData ? pointsData.length : null;
  console.log(pointsData ? JSON.parse(pointsData.allPoints) : null);

  useEffect(() => {
    const doIt = () => {
      console.log('use effect fire');
      if (map && pointsData) {
        const source = map.getSource('points');
        if (source) {
          map.getSource('points').setData(JSON.parse(pointsData.allPoints).data);
        }
      }
    };
    doIt();
  }, [map, pointsData]);

  return (
    <Box style={{ display: tab === 0 ? '' : 'none' }} className={classes.container}>
      <div className={classes.sidebar}>
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div className={clsx('map-container', classes.mapContainer)} ref={mapContainer} />
    </Box>
  );
};

export default Map;
