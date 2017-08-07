 function initModal(root, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalBody, contriblyFormResponsesUrl, postSubmitCallback) {

         var defaultForm =  {
                name: "",
                fields: [
                    {
                        name: "headline",
                        type: "input",
                        label: "Title",
                        required: true,
                        public: true
                    },
                    {
                        name: "body",
                        type: "textarea",
                        label: "Add a description",
                        required: false,
                        public: true
                    },
                    {
                        name: "location",
                        type: "location",
                        label: "Location",
                        required: false,
                        public: true
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

        initModalBody(defaultForm, clientKey, contriblyClientsUrl, contriblyTokenUrl, requestedAssignment, contriblyAssignmentsUrl, modalBody, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyFormResponsesUrl, postSubmitCallback);
    }




function initModalBody(defaultForm, clientKey, contriblyClientsUrl, contriblyTokenUrl, requestedAssignment, contriblyAssignmentsUrl, modalContent, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyFormResponsesUrl, postSubmitCallback) {

  function handleSubmit(token, modalContent, contributeForm, assignmentForm) {   // TODO pass in as a closure
        $contriblyjQuery('.notification').hide();
        contributeForm.hide();
        modalContent.find('.progress-tab').show();
        submit(token, modalContent, contributeForm, $contriblyjQuery, contriblyContributionsUrl, assignmentForm, contriblyMediaUrl, contriblyFormResponsesUrl, postSubmitCallback);
  }

  function anonymousAuth() {
            return {
                'grant_type': 'anonymous',
                'client_id': clientKey
            }
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


    var eventualClient = clientPromise(clientKey);
    eventualClient.fail(function() {
        showError('Invalid client');    // TODO show actual error message
        modalContent.find(".contribly-widget").show();
    });

    eventualClient.done(function(clientData) {
        var ownedBy = $contriblyjQuery.map(clientData, function(c) {
            return c.ownedBy;
        })[0];  // TODO 404 use case

        // Obtain an anonymous access token
        var eventualToken = tokenPromise(anonymousAuth());

        eventualToken.fail(function() {
            showError('Could not obtain token');
            modalContent.find(".contribly-widget").show();
        });

        eventualToken.done(function(data) {
            var token = data['access_token'];

            eventualAssignment = requestedAssignment != undefined ? assignmentPromise(requestedAssignment) : $contriblyjQuery.when(null);

            eventualAssignment.fail(function() {
                showError('Could not load assignment');
                modalContent.find(".contribly-widget").show();
            });

            eventualAssignment.done(function(assignment) {
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
                        showError('Could not load assignment form');
                        modalContent.find(".contribly-widget").show();
                    });

                    if (assignment.owner.id == "4523aaf2-ab2a-420d-9fbf-29e4965b9f37") {    // TODO push up
                        var completeMessage = "<h2>Thank you for contributing</h2><img src=\"https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/formsuccess.png\"><p>We review all submissions to be sure they are suitable before publishing.</p><p>To contribute more to Irish Times Abroad, or receive a weekly digest of stories, <a href=\" http://www.irishtimes.com/life-and-style/abroad/join-us\" target=\"_blank\">click here to join the Network</a>.</p>";
                        var completeMessageDiv = modalContent.find(".complete-message");
                        completeMessageDiv.html(completeMessage);
                    }

                    eventualForm.done(function(assignmentForm) {

                        if (assignmentForm != null) {
                            var fieldSet = renderForm(assignmentForm, assignment.description);
                            var formActions = contributeForm.find(".form-actions");
                            fieldSet.insertBefore(formActions);
                        }

                        var submitBtn = contributeForm.find('input[type="submit"]');
                        if (submitBtn) {
                            submitBtn.on('click', function(e) {
                                e.preventDefault();
                                if (validateSubmission(assignmentForm, contributeForm)) {
                                    handleSubmit(token, modalContent, contributeForm, assignmentForm);
                                }
                            });

                           var completeTab = modalContent.find('.complete');

                            var contributeAgainBtn = completeTab.find(".contribute-again");
                            if (contributeAgainBtn) {
                                 contributeAgainBtn.on('click', function(e) {
                                     e.preventDefault();
                                     modalContent.find(".complete").hide();
                                     contributeForm.show();
                                 });
                            }

                            modalContent.find(".contribly-widget").show();
                            contributeForm.show();

                            //publishContriblyEvent({type: "form-loaded"})  TODO reinstate
                        }

                    });

                 };
                });
            });

    });
}