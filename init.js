 function initContributeForm(root, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalBody, contriblyFormResponsesUrl, postSubmitCallback, displayMode, completionCallbacks) {

    class AnonymousAuthentication {
        buildGrant() {
         return {
            'grant_type': 'anonymous',
            'client_id': clientKey
          }
        }
        isSignedIn() {
            return true;
        }
        signinPrompt() {
        }
    }

    class GuardianCookieAuthentication {
        buildGrant() {
          var gu_u = Cookies.get('GU_U');
          return (gu_u) ? {
            'grant_type': 'guardianCookie',
            'cookie': gu_u,
            'client_id': clientKey
            } : null;
        }

        isSignedIn() {
            var gu_u = Cookies.get('GU_U');
            return gu_u != undefined;
        }

        signinPrompt(modalContent) {
            var returnUrl = window.location;
            if (window.location.hash == '') {
                returnUrl = returnUrl + "#contribute";
            }

            var signinUrl = "https://profile.theguardian.com/signin?returnUrl=" + encodeURIComponent(returnUrl);
            //if (displayMode == "modal") {
            //    window.location = signinUrl;
            //} else {

            var signinPrompt = $contriblyjQuery('<div class="signin-prompt">Please <a href="' + signinUrl + '">sign in</a> to start contributing.</div>');    // TODO how does this get removed?
            modalContent.find(".contribly-widget").append(signinPrompt);
            modalContent.find(".contribly-widget").show();
            //}
        }
    }

     var defaultForm =  {
        name: "",
        fields: [
            {
                name: "headline",
                type: "input",
                label: "Title",
                required: true,
                public: true,
                placeholder: "What's going on? Who's involved? (Keep it short)"
            },
            {
                name: "body",
                type: "textarea",
                label: "Add a description",
                required: false,
                public: true,
                placeholder: "Tell us more. What's the context? What evidence to you have?"
            },
            {
                name: "location",
                type: "location",
                label: "Location",
                required: false,
                public: true,
                placeholder: "Set the location"
            },
            {
                name: "media",
                type: "media",
                label: "Add a photo or video",
                required: false,
                public: true
            }
        ]
    }

    function initModalBody(defaultForm, clientKey, contriblyClientsUrl, contriblyTokenUrl, requestedAssignment, contriblyAssignmentsUrl, modalContent, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyFormResponsesUrl, postSubmitCallback, displayMode) {

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
                url: contriblyFormsUrl + "/" + formId
            }).promise();
        }


        function tokenPromise(grant) {
            return $contriblyjQuery.ajax({
                type:'POST',
                url: contriblyTokenUrl,
                data: grant
            }).promise();
        }

        function assignmentPromise(assignmentId) {
            return $contriblyjQuery.ajax({
                type:'GET',
                url: contriblyAssignmentsUrl + "/" + assignmentId
            }).promise();
        }

        function cssLoadPromise(cssUrlToLoad) {
            console.log("Attempting to load additional CSS: " + cssUrlToLoad);
            return $contriblyjQuery.ajax({
                url: cssUrlToLoad,
                success: function(data) {
                    $contriblyjQuery("head").append("<style>" + data + "</style>");
                },
                error: function( jqXHR, textStatus, errorThrown ) {
                    console.log("Failed to load form specific CSS from URL: " + cssUrlToLoad + ". Possibly causes could include CORS issues.");
                }
            }).promise().catch( function() {console.log("Ignoring form specific CSS due to load error")});
        }

        var eventualClient = clientPromise(clientKey);
        eventualClient.fail(function() {
            contriblyContributeShowError('Invalid client');    // TODO show actual error message
            modalContent.find(".contribly-widget").show();
        });

        eventualClient.done(function(clientData) {
            var ownedBy = $contriblyjQuery.map(clientData, function(c) {
                return c.ownedBy;
            })[0];  // TODO 404 use case

            eventualAssignment = requestedAssignment != undefined ? assignmentPromise(requestedAssignment) : $contriblyjQuery.when(null);

            eventualAssignment.fail(function() {
                contriblyContributeShowError('Could not load assignment');
                modalContent.find(".contribly-widget").show();
            });

            eventualAssignment.done(function(assignment) {

                var availableAuthentications = [];

                var allowsAnonymousContributions = assignment != null && assignment.allowsAnonymousContributions;
                if (allowsAnonymousContributions) {
                    availableAuthentications.unshift(new AnonymousAuthentication());
                }

                if (ownedBy == "783e3e8e-a427-90c9-8272-11a118f20bb2") {    // TODO push up
                    availableAuthentications.unshift(new GuardianCookieAuthentication());
                }

                if (availableAuthentications.length > 0) {
                    var authenticationToUse = availableAuthentications[0];

                    var isSignedIn = authenticationToUse.isSignedIn();
                    if (isSignedIn) {

                        var contributeForm = modalContent.find('.contribute-form');

                        if (assignment != null) {
                            var modalHeading = modalContent.find('.heading');
                            if (modalHeading) {
                                if (assignment.webUrl) {
                                    modalHeading.html('Contribute to ' + '<a href="' + assignment.webUrl + '" target="_blank">' + assignment.name + '</a>');
                                } else {
                                    modalHeading.text("Contribute to " + assignment.name);
                                }
                            }

                            var assignmentSelect = contributeForm.find('input[name=assignment]');
                            if (assignmentSelect) {
                                assignmentSelect.val(assignment.id);
                            }

                            var eventualForm = (assignment.form != undefined) ? formPromise(assignment.form) : $contriblyjQuery.when(defaultForm);

                            eventualForm.fail(function() {
                                contriblyContributeShowError('Could not load assignment form');
                                modalContent.find(".contribly-widget").show();
                            });


                            var receiptMessage = "We review everything to check that it's suitable before publishing";
                            if (assignment.receiptMessage !== undefined && assignment.receiptMessage.length > 0) {
                                receiptMessage = assignment.receiptMessage;
                            }

                            var completeMessage = "<h2>Thank you for contributing</h2><img src=\"https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/formsuccess.png\"><p>" + receiptMessage + "</p>";
                            var completeMessageDiv = modalContent.find(".complete-message");
                            completeMessageDiv.html(completeMessage);

                            locationAutocompleteProfile = "countryCityTownSuburb";
                            if (ownedBy == "4523aaf2-ab2a-420d-9fbf-29e4965b9f37") {
                                locationAutocompleteProfile = "countryStateCity";
                            }

                            eventualForm.done(function(assignmentForm) {
                                var formSpecificCssToLoad = assignmentForm.cssUrl;
                                var eventualFormSpecificCssApplied = (formSpecificCssToLoad != undefined) ? cssLoadPromise(formSpecificCssToLoad) : $contriblyjQuery.when(null);
                                eventualFormSpecificCssApplied.done(function() {

                                    var isAssignmentOpen = assignment == null || assignment.open;
                                    if (isAssignmentOpen) {
                                        if (assignmentForm != null) {
                                            var fieldSet = renderForm(assignmentForm, assignment.description, locationAutocompleteProfile);
                                            var formActions = contributeForm.find(".form-actions");
                                            fieldSet.insertBefore(formActions);
                                        }

                                        var submitBtn = contributeForm.find('input[type="submit"]');
                                        if (submitBtn) {
                                            submitBtn.on('click', function(e) {
                                                e.preventDefault();
                                                if (validateSubmission(assignmentForm, contributeForm)) {

                                                   function handleSubmit(token, modalContent, contributeForm, assignmentForm) {
                                                        $contriblyjQuery('.notification').hide();
                                                        contributeForm.hide();
                                                        modalContent.find('.progress-tab').show();
                                                        submit(token, modalContent, contributeForm, $contriblyjQuery, contriblyContributionsUrl, assignmentForm, contriblyMediaUrl, contriblyFormResponsesUrl, postSubmitCallback);
                                                    }

                                                    // Obtain an access token
                                                    var grant = authenticationToUse.buildGrant();
                                                    if (grant) {
                                                        var eventualToken = tokenPromise(grant);

                                                        eventualToken.fail(function() {
                                                            contriblyContributeShowError('Could not obtain token');
                                                            modalContent.find(".contribly-widget").show();
                                                        });

                                                        eventualToken.done(function(data) {
                                                            var token = data['access_token'];
                                                            console.log("Submitting using token: " + token);
                                                            handleSubmit(token, modalContent, contributeForm, assignmentForm);
                                                        });

                                                    } else {
                                                        // TODO UI
                                                        console.log("No grant");
                                                    }
                                                }
                                            });
                                        }

                                       var completeTab = modalContent.find('.complete');

                                        var contributeAgainBtn = completeTab.find(".contribute-again");
                                        if (contributeAgainBtn) {
                                             contributeAgainBtn.on('click', function(e) {
                                                 e.preventDefault();
                                                 modalContent.find(".complete").hide();
                                                 contributeForm.show();
                                             });
                                        }

                                        if (ownedBy == "783e3e8e-a427-90c9-8272-11a118f20bb2") {
                                            var termsAndConditionsLink = modalContent.find(".terms-and-conditions");
                                            termsAndConditionsLink.attr("href", "https://witness.theguardian.com/terms");    // TODO push up
                                            termsAndConditionsLink.show();
                                        }

                                        modalContent.find(".contribly-widget").show();
                                        contributeForm.show();

                                        //publishContriblyEvent({type: "form-loaded"})  TODO reinstate

                                    } else {
                                        var assignmentClosed = $contriblyjQuery('<div>This assignment is closed</div>');
                                        modalContent.find(".contribly-widget").append(assignmentClosed);
                                        modalContent.find(".contribly-widget").show();
                                    }

                                });
                            });
                        };

                    } else {
                        // The authentication method is not signed in; ask it to prompt
                        console.log("Not signed in");
                        authenticationToUse.signinPrompt(modalContent);
                    }

                    completionCallbacks.forEach(function(cb) {
                        cb(modalContent, assignment);
                    });

                } else {
                    console.log("No auth methods available");   // TODO UI
                }

            });
        });
    }

    initModalBody(defaultForm, clientKey, contriblyClientsUrl, contriblyTokenUrl, requestedAssignment, contriblyAssignmentsUrl, modalBody, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyFormResponsesUrl, postSubmitCallback, displayMode);
}
