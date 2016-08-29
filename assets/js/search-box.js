var $ = jQuery;
var handlebars   = require('handlebars');
var modalTemplate = require('raw!./templates/district-modal.html');

function SearchBox(config) {
    config = config || {};

    if (!config.Map) {
        console.error('Google Map object by name of "Map" is required for this module.');
    }

    this.dom = {
        $wrapper: $('.map-sidebar'),
        $searchInput: $('.address-input'),
        $notFoundAlert: $('.alert-districtNotFound'),
        $toggleBtn: $('.map-sidebar-toggle'),
        $modal: $('.app-modal-container'),
        $hideSidebarBtn: $('.js-hideSidebar')
    };
    this.SearchAutoComplete = null;
    this.Map = config.Map;
    this.loaded = false;
}

SearchBox.prototype.init = function() {
    google.maps.event.addListenerOnce(this.Map, 'bounds_changed', function() {
        if (!this.loaded) {
            this.createAutocomplete()
                .registerEvents();
            this.loaded = true;
        }
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
    this.SearchAutoComplete.addListener('places_changed', function() {
        this.onPlacesChanged();
    }.bind(this));

    // Autocomplete: District found
    $(document).on('district_found', function(e,foundDistrict) {
        this.dom.$notFoundAlert.css('display', 'none');
        this.onDistrictFound(foundDistrict);
    }.bind(this));

    // Autocomplete: District not found
    $(document).on('district_notFound', function() {
        this.dom.$notFoundAlert.css('display', 'block');
    }.bind(this));

    // Toggle button
    this.dom.$toggleBtn.on('click', function() {
        this.show();
    }.bind(this));

    this.dom.$hideSidebarBtn.on('click', function() {
        this.hide();
    }.bind(this));
};

SearchBox.prototype.hide = function() {
    this.dom.$wrapper.addClass('transition-hide');
};

SearchBox.prototype.show = function() {
    this.dom.$wrapper.removeClass('transition-hide');
};

SearchBox.prototype.onPlacesChanged = function() {
    var places = this.SearchAutoComplete.getPlaces();

    // require valid result
    if (!Array.isArray(places) || !places.length) {
        return;
    }

    var location = places[0].geometry.location;
    var self = this;
    var foundDistrict;

    // find if intersects
    this.Map.data.forEach(function(districtFeature) {
        var featureGeom = districtFeature.getGeometry();

        if ('Polygon' === featureGeom.getType()) {
            var polygon = featureGeom.getAt(0).getArray();
            if (self.checkPolygonIntersection(location, polygon)) {
                foundDistrict = districtFeature;
            }
        } else if ('MultiPolygon' === featureGeom.getType()) {
            var multiPolygon = featureGeom.getArray();
            multiPolygon.forEach(function(multiPolygon) {
                var polygon = multiPolygon.getAt(0).getArray();
                if (self.checkPolygonIntersection(location, polygon)) {
                    foundDistrict = districtFeature;
                }
            });
        }
    });

    if (foundDistrict) {
        $(document).trigger('district_found', [foundDistrict]);
    } else {
        $(document).trigger('district_notFound')
    }
};

SearchBox.prototype.onDistrictFound = function(foundDistrict) {
    var template = handlebars.compile(modalTemplate);
    var html = template(foundDistrict.f);

    this.dom.$modal.html(html);
    this.dom.$modal.modal({
        show: true
    });
};

SearchBox.prototype.checkPolygonIntersection = function(point, geometryPaths) {
    var polyX = new google.maps.Polygon({
        paths: geometryPaths
    });
    return google.maps.geometry.poly.containsLocation(point, polyX);
};

module.exports = SearchBox;
