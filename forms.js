// Renders a Contribly form as an HTML fieldset element
function renderForm(form, description, locationAutocompleteProfile) {   // TODO profile should move towards been an attribute of the location field

    function renderInput(contriblyjQuery, field) {

        var formGroup = contriblyjQuery("<div>", {class: "form-group"});
        var placeholder = field.placeholder ? field.placeholder : ""

        if (field.type != "checkbox") {
            formGroup.append(contriblyjQuery("<label>", {for: field.name}).text(field.label));
        }

        if (field.type == "select") {
            var select = contriblyjQuery('<select>', { name: field.name, class: "form-control"});
            contriblyjQuery.each(field.options, function(i, option) {
                var optionTag = contriblyjQuery('<option>', { value: option}).text(option);
                select.append(optionTag);
            });
            formGroup.append(select);
             if (field.description) {
                formGroup.append(contriblyjQuery("<div>", {class: "description"}).text(field.description));
            }

        } else if (field.type =="radio") {
            contriblyjQuery.each(field.options, function(i, option) {
                var radio = contriblyjQuery("<div>", {class: "radio"});
                var label = contriblyjQuery("<label>", {});
                label.append(contriblyjQuery("<input>", { name: field.name, value: option, type: "radio"}));
                label.append(document.createTextNode(option))
                radio.append(label);

                formGroup.append(radio);
             });

       } else if (field.type =="checkbox") {
            var checkbox = contriblyjQuery("<div>", {class: "checkbox"});
            var label = contriblyjQuery("<label>");
            var input = contriblyjQuery('<input>', {name: field.name, type: "checkbox", value: "checked"});
            label.append(input);
            label.append(field.label);
            checkbox.append(label);

            label.on("tap click", "a", function( event, data ){
                event.stopPropagation();
                event.preventDefault();
                window.open(contriblyjQuery(this).attr('href'), contriblyjQuery(this).attr('target'));
                return false;
            });

            formGroup.append(checkbox);

        } else if (field.type == "media") {
            var input = contriblyjQuery('<input>', {name: field.name, type: "file", class: "form-control"});
            // <div class="form-group"><label for="contribly-media"><strong>Add a photo or video</strong> <span class="optional">(optional)</span></label><input type="file" name="media"></div>
            // <input type="file" name="media">
            formGroup.append(input);
            if (field.description) {
                formGroup.append(contriblyjQuery("<div>", {class: "description"}).text(field.description));
            }

        } else if (field.type == "textarea") {
            var input = contriblyjQuery('<textarea>', {name: field.name, class: "form-control", placeholder: placeholder});
            formGroup.append(input);
            if (field.description) {
                formGroup.append(contriblyjQuery("<div>", {class: "description"}).text(field.description));
            }

        } else {
            var input = contriblyjQuery('<input>', {name: field.name, class: "form-control", placeholder: placeholder});
            formGroup.append(input);
            if (field.description) {
                formGroup.append(contriblyjQuery("<div>", {class: "description"}).text(field.description));
            }
        }

        return formGroup;
    }

    var fieldSet = $contriblyjQuery('<fieldset>', {id: form.id});
    fieldSet.append($contriblyjQuery("<div>", {class: "description"}).html(description));

    $contriblyjQuery.each(form.fields, function(i, field) {
        var input = renderInput($contriblyjQuery, field);
        fieldSet.append(input);
    });

    var locationField = fieldSet.find("input[name=location]");
    if (locationField.length > 0 ) {
        contriblyLocationAutocomplete(locationField, locationAutocompleteProfile);

        var enableMyLocation = location.protocol === 'https:' && navigator.geolocation !== null;    // TODO Not entirely complete; Safari rejects mixed content pages
        if (enableMyLocation) {
            var locationFormGroup = locationField.parent();
            var inputGroup = $contriblyjQuery('<div>', {class: "input-group"})
            inputGroup.append(locationField);
            var addOn = $contriblyjQuery('<span class="input-group-addon contribly-user-location"><span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>');
            inputGroup.append(addOn);
            locationFormGroup.append(inputGroup);

            function showPosition(position) {
               contriblyGeocode(position, locationField);
            }

            function showError(e) {
               var container = inputGroup;
               container.addClass("has-error");
            }

            // HTML5 location detection
            addOn.on('click', function(e) {
              e.preventDefault();
              var geoOptions = {
                enableHighAccuracy : false,
                timeout : 10000,
                maximumAge : 3000
              };
              navigator.geolocation.getCurrentPosition(showPosition, showError, geoOptions);
            })
        }
    }
    return fieldSet;
}