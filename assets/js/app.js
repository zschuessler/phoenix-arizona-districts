var $ = jQuery;
var SearchBox = require('./search-box');
var InfoWindow = require('./info-window');

function App() {
    this.geojsonFilePath = 'assets/geometry/council-districts.json';
    this.Map = null;
    this.InfoWindow = null;

    this.dom = {
        $mapWrapper: $('.map-wrapper')
    };
}

App.prototype.loadGeoJson = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.geojsonFilePath, true);
    var self = this;
    xhr.onload = function() {
        var featureCollectionJson = JSON.parse(this.responseText).features;
        featureCollectionJson.forEach(function(district) {
            self.Map.data.addGeoJson(district);

            self.Map.data.setStyle(function(feature) {
                return {
                    fillColor: feature.getProperty('fill_color'),
                    fillOpacity: 0.5,
                    strokeColor: 'white',
                    strokeOpacity: 0.9,
                    strokeWeight: 2.5,
                    zIndex: 11
                };
            });
        });
        self.createDistrictLabels();
        self.createSearchBox();
    };
    xhr.send();
};

App.prototype.createSearchBox = function() {
    this.SearchBox = new SearchBox({
        Map: this.Map
    });

    this.SearchBox.init();
};

App.prototype.createDistrictLabels = function() {
    this.Map.data.forEach(function(feature) {
        var labelLatLng = feature.getProperty('label_latlng');
        var latLng = new google.maps.LatLng(labelLatLng[0], labelLatLng[1]);
        var mapLabel = new MapLabel({
            position: {lat: labelLatLng[0], lng: labelLatLng[1]},
            text: feature.getProperty('district_id'),
            map: this.Map,
            fontSize: 15,
            strokeWeight: 4
        });
        mapLabel.set('position', latLng);
    }.bind(this));

    return this;
};

App.prototype.setProperty = function(key, value) {
    this[key] = value;

    return this;
};

App.prototype.onDistrictClicked = function(event) {
    var popupHtml = InfoWindow.getHtml(event.feature);

    this.InfoWindow.setContent(popupHtml);
    this.InfoWindow.setPosition(event.latLng);
    this.InfoWindow.setOptions({pixelOffset: new google.maps.Size(0,-30)});
    this.InfoWindow.open(this.Map);

    this.SearchBox.hide();
}

App.prototype.getGoogleMapConfig = function () {
    return {
        disableDefaultUI: true,
        // Phoenix center
        center: {lat: 33.59148994725138, lng: -112.05343763476559},
        zoom: 10,
        styles: [
            {
                featureType: 'all',
                stylers: [
                    {saturation: -80}
                ]
            }, {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [
                    {hue: '#00ffee'},
                    {saturation: 50}
                ]
            }, {
                featureType: 'poi.business',
                elementType: 'labels',
                stylers: [
                    {visibility: 'off'}
                ]
            }]
    };
};

module.exports = App;