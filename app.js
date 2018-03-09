function contriblyContributeShowError(message) {
    $contriblyjQuery('.notification').addClass('alert alert-danger').html(message);
    $contriblyjQuery(".notification").show();
}

function contriblyInitContributeWidget(button, displayMode) {

    function publishContriblyEvent(ce) {
        if (typeof contriblyEventListener === "function") {
            ce['widget'] = 'contribute';
            contriblyEventListener(ce);
        }
    }

    var overrideContriblyApi = button.attr('data-api');
    var contriblyApi = (overrideContriblyApi) ? overrideContriblyApi : "https://contriblyapi.global.ssl.fastly.net/1";

    var contriblyAssignmentsUrl = contriblyApi + '/assignments';
    var contriblyClientsUrl = contriblyApi + '/clients';
    var contriblyContributionsUrl = contriblyApi + '/contributions';
    var contriblyFormsUrl = contriblyApi + '/forms';
    var contriblyFormResponsesUrl = contriblyApi + '/form-responses';
    var contriblyMediaUrl = contriblyApi + '/media';
    var contriblyTokenUrl = contriblyApi + '/token';

    var clientKey = button.attr('data-client');
    if (clientKey == undefined) {
       params = (new URL(window.location)).searchParams;        // Check browser compatibility
       clientKey = params.get('client');
    }

    var requestedAssignment = button.attr('data-assignment');
    if (requestedAssignment == undefined) {
       params = (new URL(window.location)).searchParams;	// Check browser compatibility
       requestedAssignment = params.get('assignment');
    }

    var callToAction = "Add your contribution";
    if (clientKey && clientKey == "9fc0f2a4-9bf9-4464-8b77-ec351ad0db03") {
        callToAction = "Add your story";
    }

    var formHtml = '<form class="contribute-form" method="POST" enctype="multipart/form-data" style="display: none"><input name="assignment" type="hidden" /><div class="form-actions"><a class="terms-and-conditions" target="_blank" href="" style="display: none">Terms and conditions</a><input type="submit" class="btn btn-primary" value="' + callToAction + '" /></div></form>';
    var progressHtml = '<div class="progress-tab" style="display: none"><p><strong class="progress-step"></strong></p><div class="progress"><div class="progress-bar" role="progressbar"></div></div></div>';
    var successHtml = '<div class="complete" style="display: none"><div class="complete-message"></div><div class="success-buttons"><a class="btn btn-primary contribute-again" href="#">Contribute again</a></div>';

    var modalBody = $contriblyjQuery('<div class="modal-body"><div class="contribly-widget" style="display: none"><div class="notification" role="alert"></div>' + formHtml + progressHtml + successHtml + '<div class="loader"></div></div>');

    function postSubmitCallback(contribution) {
        publishContriblyEvent({type: "submitted", contribution: contribution})
    }

    if (displayMode == "modal") {

        function focusFirstInput(div) {
            var firstVisibleInput = div.find('input,textarea,select').filter(':visible:first');
            if(firstVisibleInput.length > 0) {
                firstVisibleInput.focus();
            }
        }

        var contributeModal = $contriblyjQuery('<div class="contribute-modal-inner"><div class="modal-dialog"><div class="modal-content"></div></div>');

        function focusFirstInputCallback(i) {
            focusFirstInput(i);
        };

        function findModalInner() {
            return $contriblyjQuery('body').children('.contribly').find('.contribute-modal-inner');
        }

        function closeModal(e) {
          e.preventDefault();

          var contributeModal = findModalInner();
          var completeTab = contributeModal.find('.complete');
          if(completeTab.is(':visible')) {
            completeTab.hide();
            contributeModal.find(".contribute-form").show();
          }

          contributeModal.find('.notification').html("");
          contributeModal.find(".notification").hide();

          contributeModal.hide();
          $contriblyjQuery('.contribly-modal-backdrop').hide();
        }

        function launchModal(e) {
            // var root = e.data.root;
            findModalInner().show();    // TODO needs to be anchored to the right widget
            $contriblyjQuery('.contribly-modal-backdrop').show();
            focusFirstInput(contributeModal);
        }

        var headerHtml = '<button class="close" type="button" aria-hidden="true">&times;</button><h3 class="heading">Contribute</h3>'
        var modalHeader = $contriblyjQuery('<div class="modal-header">' + headerHtml + '</div>');
        var modalContent = contributeModal.find('.modal-content');
        modalContent.append(modalHeader);
        modalContent.append(modalBody);

        var closeModalButton = contributeModal.find('.close');
        closeModalButton.on('click', {modal: contributeModal}, closeModal);

        var successCloseButton = $contriblyjQuery('<a class="btn btn-close" href="#" aria-hidden="true">Close this window</a>');
        successCloseButton.on('click', {modal: contributeModal}, closeModal);
        modalBody.find(".success-buttons").append(successCloseButton);

        contributeModal.hide();
        $contriblyjQuery('.contribly').append(contributeModal);

        function renderModalButton(i, assignment) {
            var isAssignmentOpen = assignment == null || assignment.open;
            if (isAssignmentOpen) {
                var buttonHtml = '<span class="contribly"><a class="btn btn-primary btn-contribute">' + callToAction + '</a></span>';
                button.html(buttonHtml);
                var contriblyClass = button.find(".contribly");
                contriblyClass.find('.btn-contribute').on('click', {root: contriblyClass}, launchModal);
                publishContriblyEvent({type: "button-shown"})

            } else {
                var buttonHtml = '<span class="contribly"><a class="btn closed">Assignment closed</a></span>';
                button.html(buttonHtml);
            }
        }

        function openOnContributeHash(i) {
            var hash = window.location.hash;
            if (hash == "#contribute") {
                launchModal();
            }
        }

        initContributeForm(contributeModal, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalContent, contriblyFormResponsesUrl, postSubmitCallback, displayMode, [renderModalButton, openOnContributeHash]);
    }

    if (displayMode == "inline") {
        var div = $contriblyjQuery('<div>', {class: "contribly"});
        div.append(modalBody);
        button.append(div);
        initContributeForm(div, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalBody, contriblyFormResponsesUrl, postSubmitCallback, displayMode, []);
    }

}

var contriblyContributeNeedsLoading = contriblyContributeLoading == undefined;
var contriblyContributeLoading = true;

if (contriblyContributeNeedsLoading) {
    var $contriblyjQuery = jQuery.noConflict();

    var contriblyContributeSnippets = $contriblyjQuery('.contribly-contribute');
    if (contriblyContributeSnippets.length > 0) {
        var contriblyContributeCssUrl = "https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/contributeSNAPSHOT.css";

        var cssToLoad = contriblyContributeCssUrl
        var firstContributeWidget = contriblyContributeSnippets[0];
        var requestedCss = $contriblyjQuery(firstContributeWidget).attr('data-css');
        if (requestedCss != undefined) {
            cssToLoad = requestedCss;
        }

        $contriblyjQuery.ajax({
            url: cssToLoad,
            success: function(data) {
                $contriblyjQuery("head").append("<style>" + data + "</style>");

                var contributeModalBackdropHtml = '<div class="contribly"><div class="modal-backdrop contribly-modal-backdrop" style="display: none"></div></div>';
                var backdrop = $contriblyjQuery(contributeModalBackdropHtml);
                $contriblyjQuery('body').append(backdrop);

                $contriblyjQuery('.contribly-contribute').each(function(i, v) {
                    var requestedDisplayMode = $contriblyjQuery(v).attr('data-display');
                    var displayMode = (requestedDisplayMode != undefined) ? requestedDisplayMode : "modal";
                    contriblyInitContributeWidget($contriblyjQuery(v), displayMode);
                });
            }
        });

    }
}
