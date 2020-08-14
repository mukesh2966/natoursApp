/* eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoieG11a2VzaCIsImEiOiJja2RuNDQxd3YwN2U0Mnh0dmp6OWs4ZWg1In0.XfWzW8gtmdI2swecxc0WIg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/xmukesh/ckdn6bd3n3rik1iny492viz3d',
    //   centre: [-118, 34],
    //   zoom: 4,
    //   interative:false
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map); // add to the map variable that we created

    // Add PopUP
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });
  // for map to fit the bounds
  map.fitBounds(bounds, {
    padding: {
      //padding for the container---so that the bounds does not get covered behind the images on the page
      top: 200,
      bottom: 150,
      left: 100,
      right: 100, //---these values are in pixles
    },
  });
};
