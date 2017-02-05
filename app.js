var $contriblyjQuery = jQuery.noConflict();

function contriblyInitContributeButton(button) {

    function showError(message) {
        $contriblyjQuery('.notification').addClass('alert alert-danger').html(message);
        $contriblyjQuery(".notification").show();
    }

    function publishContriblyEvent(ce) {
        if (typeof contriblyEventListener === "function") {
            contriblyEventListener(ce);
        }
    }

    function handleSubmit(token, contributeModal, contributeForm, assignmentForm) {

        function submitMediaPromise(mediaFile, token) {
            contributeModal.find('.progress-step').text('Uploading media');
            progressBar = contributeModal.find('.progress-bar');
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

        function submitContributionPromise(token, contribution) {
            var contributionJSON = JSON.stringify(contribution);

            contributeModal.find('.progress-step').text('Submitting contribution');
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
            contributeModal.find('.progress-step').text('Submitting form');

            var formResponse = {
                "form": assignmentForm.id,
                "contribution": contributionId
            }
            var form = contributeForm.find(".form-actions");
            var responses = {};
            $contriblyjQuery.each(assignmentForm.fields, function(i, field) {
                var fieldInput = contributeForm.find("[name=\"" + field.name + "\"]");  // TODO null safe
                responses[field.name] = fieldInput.val();
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

        function submit(token, contributeModal, contributeForm) {
            var mediaField = contributeForm.find("input[name=media]");
            var mediaFile = (mediaField.prop('files').length !== 0 ) ? mediaField.prop('files')[0] : null;

            contributeModal.find('.progress-tab').show();

            var eventualMedia = (mediaFile != null) ? submitMediaPromise(mediaFile, token) : $contriblyjQuery.when(null);

            eventualMedia.fail(function() {
                contributeModal.find('.progress-tab').hide();
                contributeForm.show();
                showError('Could not upload media');
            });

            eventualMedia.done(function(media) {
                contributeModal.find('.progress-tab').hide();

                var contribution = buildContribution(media);

                var eventualContribution = submitContributionPromise(token, contribution)

                eventualContribution.fail(function(err) {
                    contributeModal.find('.progress-tab').hide();
                    contributeModal.find('.progress-step').text('');
                    contributeForm.show();
                    showError(err.responseJSON);
                });

                eventualContribution.done(function(contribution) {
                    var eventualFormResponse = assignmentForm ? submitFormPromise(token, assignmentForm, contribution.id) : $contriblyjQuery.when(null);

                    eventualFormResponse.fail(function(err) {
                        contributeModal.find('.progress-tab').hide();
                        contributeModal.find('.progress-step').text('');
                        contributeForm.show();
                        showError(err);
                    });

                    eventualFormResponse.done(function(formResponse) {
                        publishContriblyEvent({type: "submitted", contribution: contribution})
                        contributeModal.find('.progress-tab').hide();
                        contributeModal.find('.progress-step').text('');
                        contributeModal.find('.complete').show();

                        function resetContributeForm() {
                            var locationField = contributeForm.find("input[name=location]"); // Explictly clear the location input so that the autocomplete plugin has a chance to clear it's state
                            if (locationField.length > 0) {
                                locationField.val("");
                                locationField.change(); // onChange listeners don't react to programmatic value changes
                            }
                            contributeForm[0].reset();
                        }

                        resetContributeForm();
                    });

                });

            });
        }

        $contriblyjQuery('.notification').hide();
        contributeForm.hide();
        contributeModal.find('.progress-tab').show();
        submit(token, contributeModal, contributeForm);
    }

    function closeModal(e) {
      e.preventDefault();

      var contributeModal = e.data.modal;

      var completeTab = contributeModal.find('.complete');
      if(completeTab.is(':visible')) {
            completeTab.hide();
            contributeModal.find(".contribute-form").show();
      }

      contributeModal.find('.notification').html("");
      contributeModal.find(".notification").hide();

      contributeModal.hide();
      $contriblyjQuery('#contribly-modal-backdrop').hide();
    }

    function launchModal(e) {
        var root = e.data.root;

        function initModal(root) {

            function anonymousAuth() {
                return {
                    'grant_type': 'anonymous',
                    'client_id': clientKey
                }
            }

            root.append(contributeModal);

            var closeModalButton = contributeModal.find('.close');
            closeModalButton.on('click', {modal: contributeModal}, closeModal);

            function assignmentPromise(assignmentId) {
                return $contriblyjQuery.ajax({
                    type:'GET',
                    url: contriblyAssignmentsUrl + "/" + assignmentId
                }).promise();
            }

            function clientPromise(clientKey) {
                return $contriblyjQuery.ajax({
                    type:'GET',
                    url: contriblyClientsUrl,
                    data: {
                       key: clientKey
                    }
               }).promise();
            }

            function formPromise(formId) {
                return $contriblyjQuery.ajax({
                    type:'GET',
                    url: contriblyFormsUrl,
                    data: {
                       key: formId
                    }
                }).promise();
            }

            function tokenPromise(grant) {
                return $contriblyjQuery.ajax({
                    type:'POST',
                    url: contriblyTokenUrl,
                    data: grant
                }).promise();
            }

            var eventualClient = clientPromise(clientKey);
            eventualClient.fail(function() {
                showError('Invalid client');
                contributeModal.find(".contribly-widget").show();
            });

            eventualClient.done(function(clientData) {
                var ownedBy = $contriblyjQuery.map(clientData, function(c) {
                    return c.ownedBy;
                })[0];  // TODO 404 use case

                // Obtain an anonymous access token
                var eventualToken = tokenPromise(anonymousAuth());

                eventualToken.fail(function() {
                    showError('Could not obtain token');
                    contributeModal.find(".contribly-widget").show();
                });

                eventualToken.done(function(data) {
                    var token = data['access_token'];
                    var requestedAssignment = button.attr('data-assignment');

                    eventualAssignment = requestedAssignment != undefined ? assignmentPromise(requestedAssignment) : $cf.when(null);

                    eventualAssignment.fail(function() {
                        showError('Could not load assignment');
                        contributeModal.find(".contribly-widget").show();
                    });

                    eventualAssignment.done(function(assignment) {
                        var contributeForm = contributeModal.find('.contribute-form');

                        if (assignment != null) {
                            var modalHeading = contributeModal.find('.heading');
                            if (assignment.webUrl) {
                                modalHeading.html('Contribute to ' + '<a href="' + assignment.webUrl + '" target="_blank">' + assignment.name + '</a>');
                            } else {
                                modalHeading.text("Contribute to " + assignment.name);
                            }

                            var assignmentSelect = contributeForm.find('select[name=assignment]');
                            if (assignmentSelect) {
                                var assignmentOption = $contriblyjQuery("<option>").attr("value", assignment.id).text(assignment.name);
                                assignmentSelect.append(assignmentOption);
                                var assignmentControlGroup = assignmentSelect.parent();  // TODO generalise
                                assignmentControlGroup.hide();
                            }

                            if (assignment.mediaRequired == true) {
                                var mediaField = contributeForm.find('input[name=media]');
                                var mediaControlGroup = mediaField.parent();  // TODO generalise
                                var mediaOptional = mediaControlGroup.find('.optional');
                                mediaOptional.hide();    // TODO apply to assignments dropdown as well
                            }

                            var eventualForm = (assignment.null != undefined) ? formPromise(assignment.form) : $contriblyjQuery.when(null);
                            eventualForm.fail(function() {
                                showError('Could not load assignment form');
                                contributeModal.find(".contribly-widget").show();
                            });

                            eventualForm.done(function(assignmentForm) {

                                function renderInput(field) {
                                    function inputTagFor(field) {
                                        var formGroup = $contriblyjQuery("<div>", {class: "form-group"});
                                        formGroup.append($contriblyjQuery("<label>", {for: field.name}).text(field.label));

                                        if (field.type == "select") {
                                            var select = $contriblyjQuery('<select>', { name: field.name, class: "form-control"});
                                            $contriblyjQuery.each(field.options, function(i, option) {
                                                var optionTag = $contriblyjQuery('<option>', { value: option}).text(option);
                                                select.append(optionTag);
                                            });
                                            formGroup.append(select);

                                        } else if (field.type =="radio") {
                                            $contriblyjQuery.each(field.options, function(i, option) {
                                                var radio = $contriblyjQuery("<div>", {class: "radio"});
                                                var label = $contriblyjQuery("<label>", {});
                                                label.append($contriblyjQuery("<input>", { name: field.name, value: option, type: "radio"}));
                                                label.append(document.createTextNode(option))
                                                radio.append(label);

                                                formGroup.append(radio);
                                             });

                                        } else {
                                            var input = $contriblyjQuery('<input>', {name: field.name, class: "form-control"});
                                            formGroup.append(input);
                                        }

                                        return formGroup;
                                    }

                                    var fromGroup = $contriblyjQuery('<div>', {class: "form-group"});
                                    var label = $contriblyjQuery("<label>", {for: field.name}).text(field.label);
                                    var input = inputTagFor(field);

                                    fromGroup.append(label);
                                    fromGroup.append(input);
                                    return input;
                                }

                                if (assignmentForm != null) {
                                    var fieldSet = $contriblyjQuery('<fieldset>', {id: form.id});
                                    fieldSet.append($contriblyjQuery("<h4>").text(form.name));

                                    $contriblyjQuery.each(form.fields, function(i, field) {
                                        fieldSet.append(renderInput(field));
                                    });

                                    var formActions = contributeForm.find(".form-actions");
                                    fieldSet.insertBefore(formActions);
                                }

                                var locationField = contributeForm.find("input[name=location]");
                                if (locationField.length > 0 ) {
                                    contriblyLocationAutocomplete(locationField);
                                }

                                var submitBtn = contributeForm.find('input[type="submit"]');
                                if (submitBtn) {
                                    submitBtn.on('click', function(e) {
                                        e.preventDefault();
                                        handleSubmit(token, contributeModal, contributeForm, assignmentForm);
                                    });

                                   var completeTab = contributeModal.find('.complete');
                                    completeTab.find(".btn-close").on('click', {modal: contributeModal}, closeModal);

                                    var contributeAgainBtn = completeTab.find(".contribute-again");
                                    if (contributeAgainBtn) {
                                         contributeAgainBtn.on('click', function(e) {
                                             e.preventDefault();
                                             contributeModal.find(".complete").hide();
                                             contributeForm.show();
                                         });
                                    }

                                    contributeModal.find(".contribly-widget").show();
                                    contributeForm.show();

                                    publishContriblyEvent({type: "form-loaded"})
                                }

                            });

                        };
                    });
                });

            });

        }

        var isInitalised = root.find('.contribute-modal-inner').length > 0;
        if (!isInitalised) {
            initModal(root);
        }
        root.find('.contribute-modal-inner').show();

        $contriblyjQuery('#contribly-modal-backdrop').show();
    }

    var overrideContriblyApi = button.attr('data-api');
    var contriblyApi = (overrideContriblyApi) ? overrideContriblyApi : "https://api.contribly.com/1";

    var contriblyAssignmentsUrl = contriblyApi + '/assignments';
    var contriblyClientsUrl = contriblyApi + '/clients';
    var contriblyContributionsUrl = contriblyApi + '/contributions';
    var contriblyFormsUrl = contriblyApi + '/forms';
    var contriblyFormResponsesUrl = contriblyApi + '/form-responses';
    var contriblyMediaUrl = contriblyApi + '/media';
    var contriblyTokenUrl = contriblyApi + '/token';

    var clientKey = button.attr('data-client');

    var headerHtml = '<button class="close" type="button" aria-hidden="true">&times;</button><h3 class="heading">Contribute</h3>'
    var formHtml = '<form class="contribute-form" method="POST" enctype="multipart/form-data" style="display: none"><fieldset><div class="form-group"><label for="contribly-title"><strong>Title</strong></label><input type="text" id="contribly-title" class="form-control" name="headline" placeholder="What\'s going on? Who\'s involved? (Keep it short)"/></div>' + '<div class="form-group"><label for="assignment"><strong>Assignment</strong></label><select class="form-control" name="assignment"/></select></div>' + '<div class="form-group"><label for="contribly-body"><strong>Add a description</strong> <span class="optional">(optional)</span></label><textarea id="contribly-body" class="form-control" name="body" rows="3" placeholder="Tell us more. What\'s the context? What evidence do you have?"></textarea></div><div class="form-group"><label for="contribly-media"><strong>Add a photo or video</strong> <span class="optional">(optional)</span></label><input type="file" name="media"></div><div class="form-group"><label for="contribly-location"><strong>Location</strong> <span class="optional">(optional)</span></label><input class="form-control" name="location"><input id="contribly-latitude" name="latitude" type="hidden"><input id="contribly-longitude" name="longitude" type="hidden"><input name="selectedlocation" type="hidden"><input name="googleplaceid" type="hidden"><input name="osmplaceid" type="hidden"><input name="osmplacetype" type="hidden"></div></fieldset><div class="form-actions"><a class="terms-and-conditions" target="_blank" href="" style="display: none">Terms and conditions</a><input type="submit" class="btn btn-primary" value="Contribute" /></div></form>';
    var progressHtml = '<div class="progress-tab" style="display: none"><p><strong class="progress-step"></strong></p><div class="progress"><div class="progress-bar" role="progressbar"></div></div></div>';
    var successHtml = '<div class="complete" style="display: none"><h2>Thank you for your submission</h2><img src="https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/formsuccess.png"><p>We review everything to check that it\'s suitable before publishing</p><a class="btn btn-close" href="#" aria-hidden="true">Close this window</a><a class="btn btn-primary contribute-again" href="#">Contribute again</a>';

    var contributeModal = $contriblyjQuery('<div class="contribute-modal-inner"><div class="modal-dialog"><div class="modal-content"><div class="modal-header">' + headerHtml + '</div><div class="modal-body"><div class="contribly-widget" style="display: none"><div class="notification" role="alert"></div>' + formHtml + progressHtml + successHtml + '<div class="loader"></div></div></div></div>');

    button.html('<span class="contribly"><a class="btn btn-primary btn-contribute">Add your contribution</a></span>');

    var contriblyClass = button.find(".contribly");
    contriblyClass.find('.btn-contribute').on('click', {root: contriblyClass}, launchModal);

    publishContriblyEvent({type: "button-shown"})
}

$contriblyjQuery.ajax({
    url: "https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/contribute2017012801-SNAPSHOT.css",
    success:function(data) {
        $contriblyjQuery("head").append("<style>" + data + "</style>");

        var backdrop = $contriblyjQuery('<div class="contribly"><div id="contribly-modal-backdrop" class="modal-backdrop" style="display: none"></div></div>');
        $contriblyjQuery("body").append(backdrop);

        $contriblyjQuery('.contribly-contribute').each(function(i, v) {
            contriblyInitContributeButton($contriblyjQuery(v));
        });
    }
});