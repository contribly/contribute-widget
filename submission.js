function submit(token, modalContent, contributeForm, contriblyjQuery, contriblyContributionsUrl, assignmentForm, contriblyMediaUrl, contriblyFormResponsesUrl, postSubmitCallback) {

    function submitContributionPromise(token, contribution) {
        var contributionJSON = JSON.stringify(contribution);

        modalContent.find('.progress-step').text('Submitting contribution');
        return $contriblyjQuery.ajax({
            url: contriblyContributionsUrl,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            type: 'POST',
            crossDomain:true,
            contentType: 'application/json',
            processData: false,
            data: contributionJSON
        }).promise();
    }

   function submitFormPromise(token, assignmentForm, contributionId) {
        modalContent.find('.progress-step').text('Submitting form');

        var formResponse = {
            "form": assignmentForm.id,
            "contribution": contributionId
        }
        var form = contributeForm.find(".form-actions");
        var responses = {};
        $contriblyjQuery.each(assignmentForm.fields, function(i, field) {
            var fieldInput = contributeForm.find("[name=\"" + field.name + "\"]");  // TODO null safe

            var value = field.type == "checkbox" ? fieldInput.prop('checked').toString() : fieldInput.val();
            responses[field.name] = value;
        });
        formResponse["responses"] = responses;

        return $contriblyjQuery.ajax({
            url: contriblyFormResponsesUrl,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            type: 'POST',
            crossDomain:true,
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(formResponse)
        });
    }

    function submitMediaPromise(mediaFile, token) {
        modalContent.find('.progress-step').text('Uploading media');
        progressBar = modalContent.find('.progress-bar');
        progressBar.css('width', '0%');

        return $contriblyjQuery.ajax({
            type:'POST',
            url: contriblyMediaUrl,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        var percent = Math.ceil(e.loaded / e.total * 100);
                        var percentVal = percent + '%';
                        progressBar.css('width', percentVal);
                    }
                }, false);
                return xhr;
            },
            data: mediaFile,
            cache: false,
            contentType: false,
            processData: false
        }).promise();
    }

    function buildContribution(media) {

        function serializeForm(form) {
                var data = {};
                var inputs = form.serializeArray();
                $contriblyjQuery.each(inputs, function() {
                  if (data[this.name] !== undefined) {
                    if (!data[this.name].push) {
                        data[this.name] = [o[this.name]];
                    }
                    data[this.name].push(this.value || '');
                  } else {
                    data[this.name] = this.value || '';
                  }
                });
                return data;
            };

            var contribution = serializeForm(contributeForm);

            if (media != null) {
                contribution.mediaUsages = [{
                    "media": media
                }];
            }

            var assignmentId = contribution.assignment;
            if (assignmentId != null) {
                contribution.assignment = {
                    "id": assignmentId
                };
            }

            var locationField = contributeForm.find("input[name=location]");
            if (locationField.length > 0) {
                var latitude = locationField.attr("data-selected-latitude")
                var longitude = locationField.attr("data-selected-longitude")
                if (latitude && longitude) {
                    var parsedLatitude = parseFloat(latitude);
                    var parsedLongitude = parseFloat(longitude);
                    if (parsedLatitude && parsedLongitude) {
                        contribution.place = {
                            'latLong': {
                                'latitude': parsedLatitude,
                                'longitude': parsedLongitude
                            }
                        }
                    }
                }

                var selectedLocation = locationField.attr("data-selected-value")
                if (selectedLocation) {
                    contribution.place.name = selectedLocation;
                }

                var osmPlaceId = locationField.attr("data-selected-osmid");
                var osmPlaceType = locationField.attr("data-selected-osmtype");
                if (osmPlaceId && osmPlaceType) {
                    var parsedOsmId = parseFloat(osmPlaceId);
                    if (parsedOsmId) {
                        contribution.place.osm = {
                            'osmId': parsedOsmId,
                            'osmType': osmPlaceType
                        };
                    }
                }
            }

            return contribution;
        }

    var mediaField = contributeForm.find("input[name=media]");
    var hasMediaFile = mediaField.length !== 0 && mediaField.prop('files').length !== 0;
    var mediaFile = (hasMediaFile) ? mediaField.prop('files')[0] : null;

    modalContent.find('.progress-tab').show();

    var eventualMedia = (mediaFile != null) ? submitMediaPromise(mediaFile, token) : contriblyjQuery.when(null);

    eventualMedia.fail(function() {
        modalContent.find('.progress-tab').hide();
        contributeForm.show();
        contriblyContributeShowError('Could not upload media');
    });

    eventualMedia.done(function(media) {
        modalContent.find('.progress-tab').hide();

        var contribution = buildContribution(media);

        var eventualContribution = submitContributionPromise(token, contribution)

        eventualContribution.fail(function(err) {
            modalContent.find('.progress-tab').hide();
            modalContent.find('.progress-step').text('');
            contributeForm.show();

            fieldErrors = contriblyjQuery.map(err.responseJSON.fields, function(field, i) {
                return field.name + " " + field.message;
            });

            contriblyContributeShowError(err.responseJSON.message + " " + fieldErrors);
        });

        eventualContribution.done(function(contribution) {

            var eventualFormResponse = assignmentForm && assignmentForm.id ? submitFormPromise(token, assignmentForm, contribution.id) : contriblyjQuery.when(null);

            eventualFormResponse.fail(function(err) {
                modalContent.find('.progress-tab').hide();
                modalContent.find('.progress-step').text('');
                contributeForm.show();
                contriblyContributeShowError(err);
            });

            eventualFormResponse.done(function(formResponse) {
                postSubmitCallback(contribution);

                modalContent.find('.progress-tab').hide();
                modalContent.find('.progress-step').text('');
                modalContent.find('.complete').show();

                function resetContributeForm() {
                    var locationField = contributeForm.find("input[name=location]"); // Explictly clear the location input so that the autocomplete plugin has a chance to clear it's state
                    if (locationField.length > 0) {
                        locationField.val("");
                        locationField.change(); // onChange listeners don't react to programmatic value changes
                    }

                    contributeForm.find(".has-error").removeClass("has-error");

                    contributeForm[0].reset();
                }

                resetContributeForm();
            });

        });
    });
}