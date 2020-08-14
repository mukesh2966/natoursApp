/* eslint-disable*/
// disabling ES line

// now to get location data----one thing we can do is do a request to our api->API CALL
// but that is not necessary
// what we are doing is----------------------
// storing the tour.locations data as a string in a div tag database in the tour.pug
// So, that later our mapbox.js can directly use it from there.

const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoieG11a2VzaCIsImEiOiJja2RteDd4cjMxY25qMnhxMzUyOG9wcmk5In0.wMXa4G04WG1jSgTzsMS5Ug';
var map = new mapboxgl.Map({
  container: 'map', // put the container on an element with an id of map
  style: 'mapbox://styles/mapbox/streets-v11',
});
