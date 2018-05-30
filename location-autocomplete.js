function contriblyGeocode(position, locationField) {

    function recordSelectedLocation(data) {
        if (data.osm_id && data.osm_type) {
            locationField.val(data.display_name);
            locationField.attr("data-selected-value", data.display_name);
            locationField.attr("data-selected-latitude", data.lat);
            locationField.attr("data-selected-longitude", data.lon);
            locationField.attr("data-selected-osmid", data.osm_id);
            locationField.attr("data-selected-osmtype", data.osm_type.substr(0, 1).toUpperCase());
        }
    }

    var coords = position.coords;
    var url = "https://nominatim.eelpieconsulting.co.uk/reverse?format=json&lat=" + coords.latitude + "&lon=" + coords.longitude + "&zoom=10";
    $contriblyjQuery.ajax({
        url: url,
        cache: true,
        success: function(data) {
            recordSelectedLocation(data);
        }
    });
}

// Attaches a location name autocomplete behaviour to the given input field.
// Implemented using the jQuery UI autocomplete plugin.
// The location data source is OpenStreetMap.
function contriblyLocationAutocomplete(locationField, profile) {

    function recordSelectedLocation(selectedLocation) {
        locationField.attr("data-selected-value", selectedLocation.value);
        locationField.attr("data-selected-latitude", selectedLocation.latitude);
        locationField.attr("data-selected-longitude", selectedLocation.longitude);
        locationField.attr("data-selected-osmid", selectedLocation.osmId);
        locationField.attr("data-selected-osmtype", selectedLocation.osmType);
    }

    function currentlySelectedLocationName() {
        return locationField.attr("data-selected-value");
    }

    function clearSelectedLocation() {
        locationField.attr("data-selected-value", "");
        locationField.attr("data-selected-latitude", "");
        locationField.attr("data-selected-longitude", "");
        locationField.attr("data-selected-osmid", "");
    }

    if (locationField.autocomplete !== undefined) {
        locationField.autocomplete({
            source: function( request, response ) {
                $contriblyjQuery.ajax({
                    url: "https://nominatim-ac.eelpieconsulting.co.uk/search",
                    cache: true,
                    method: "GET",
                    data: {
                        q: request.term,
                        profile: profile
                    },
                    success: function(data) {
                        response($contriblyjQuery.map(data, function(item) {
                            return {
                                label: item.address,
                                value: item.address,
                                osmId: item.osmId,
                                osmType: item.osmType,
                                latitude: item.latlong.lat,
                                longitude: item.latlong.lon
                            }
                        }));
                    },
                    messages: {
                        noResults: '',
                        results: function() {}
                    }
                });
            },
            select: function( event, ui ) {
                recordSelectedLocation(ui.item);
            },
            appendTo: locationField.parent()
        });

        locationField.on('change paste keyup', function() {
            var currentInput = this.value;
            if (currentInput != currentlySelectedLocationName()) {  // TODO not strictly true for different OSM ids with the same label
                clearSelectedLocation();
            }
        });

        locationField.on('blur', function() {
            var currentInput = this.value;
            if (currentInput != currentlySelectedLocationName()) {
                this.value = '';
                clearSelectedLocation();
            }
        });
    }

}