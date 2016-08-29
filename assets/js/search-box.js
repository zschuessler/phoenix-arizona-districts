var $ = jQuery;

function SearchBox(config) {
    config = config || {};

    if (!config.Map) {
        console.error('Google Map object by name of "Map" is required for this module.');
    }

    this.dom = {
        $searchInput: $('.address-input'),
        $notFoundAlert: $('.alert-districtNotFound')
    };
    this.SearchAutoComplete = null;
    this.Map = config.Map;
}

SearchBox.prototype.init = function() {
    google.maps.event.addListenerOnce(this.Map, 'bounds_changed', function(){
        this.createAutocomplete()
            .registerEvents();
    }.bind(this));
};

SearchBox.prototype.createAutocomplete = function() {
    this.SearchAutoComplete = new google.maps.places.SearchBox(
        this.dom.$searchInput[0],
        {
            map: this.Map,
            bounds: this.Map.getBounds()
        }
    );

    return this;
};

SearchBox.prototype.registerEvents = function() {
    // Map idle
    google.maps.event.addListenerOnce(this.Map, 'idle', function(){
        this.Map.fitBounds(this.Map.getBounds());
    }.bind(this));

    // Map bounds changed
    this.Map.addListener('bounds_changed', function() {
        this.SearchAutoComplete.setBounds(this.Map.getBounds());
    }.bind(this));

    // Autocomplete selection
    this.SearchAutoComplete.addListener('places_changed', this.onPlacesChanged)

    // Autocomplete: District found
    $(document).on('district_found', function() {
        this.dom.$notFoundAlert.css('display', 'block');
    }.bind(this));

    // Autocomplete: District not found
    $(document).on('district_notFound', function() {
        this.dom.$notFoundAlert.css('display', 'none');
    }.bind(this));
}

SearchBox.prototype.onPlacesChanged = function() {
    var places = this.SearchAutoComplete.getPlaces();

    // require valid result
    if (!Array.isArray(places) || !places.length) {
        return;
    }

    var location = places[0].geometry.location;
    var foundDistrict;

    // find if intersects
    this.Map.data.forEach(function(districtFeature) {
        console.log(this)
        var featureGeom = districtFeature.getGeometry();

        if ('Polygon' === featureGeom.getType()) {
            var polygon = featureGeom.getAt(0).getArray();
            if (SearchBox.checkPolygonIntersection(location, polygon)) {
                foundDistrict = districtFeature;
            }
        } else if ('MultiPolygon' === featureGeom.getType()) {
            var multiPolygon = featureGeom.getArray();
            multiPolygon.forEach(function(multiPolygon) {
                var polygon = multiPolygon.getAt(0).getArray();
                if (SearchBox.checkPolygonIntersection(location, polygon)) {
                    foundDistrict = districtFeature;
                }
            });
        }
    });

    if (!foundDistrict) {
        $(document).trigger('district_found');
    } else {
        $(document).trigger('district_notFound')
    }

};

SearchBox.prototype.checkPolygonIntersection = function(point, geometryPaths) {
    var polyX = new google.maps.Polygon({
        paths: geometryPaths
    });
    return google.maps.geometry.poly.containsLocation(point, polyX);
};

module.exports = SearchBox;
