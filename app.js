var $contriblyjQuery = jQuery.noConflict();


    function showError(message) {
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

    function findModalInner() {
        return $contriblyjQuery('body').children('.contribly').find('.contribute-modal-inner');
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
    var requestedAssignment = button.attr('data-assignment');

    var callToAction = "Add your contribution";
    if (clientKey && clientKey == "9fc0f2a4-9bf9-4464-8b77-ec351ad0db03") {
        callToAction = "Add your story";
    }

    var headerHtml = '<button class="close" type="button" aria-hidden="true">&times;</button><h3 class="heading">Contribute</h3>'
    var modalHeader = $contriblyjQuery('<div class="modal-header">' + headerHtml + '</div>');

    var formHtml = '<form class="contribute-form" method="POST" enctype="multipart/form-data" style="display: none"><input name="assignment" type="hidden" /><div class="form-actions"><a class="terms-and-conditions" target="_blank" href="" style="display: none">Terms and conditions</a><input type="submit" class="btn btn-primary" value="' + callToAction + '" /></div></form>';
    var progressHtml = '<div class="progress-tab" style="display: none"><p><strong class="progress-step"></strong></p><div class="progress"><div class="progress-bar" role="progressbar"></div></div></div>';
    var successHtml = '<div class="complete" style="display: none"><div class="complete-message"><h2>Thank you for your submission</h2><img src="https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/formsuccess.png"><p>We review everything to check that it\'s suitable before publishing</p></div><div class="success-buttons"><a class="btn btn-primary contribute-again" href="#">Contribute again</a></div>';

    var modalBody = $contriblyjQuery('<div class="modal-body"><div class="contribly-widget" style="display: none"><div class="notification" role="alert"></div>' + formHtml + progressHtml + successHtml + '<div class="loader"></div></div>');

    var contributeModal = $contriblyjQuery('<div class="contribute-modal-inner"><div class="modal-dialog"><div class="modal-content"></div></div>');
    var modalContent = contributeModal.find('.modal-content');
    modalContent.append(modalHeader);
    modalContent.append(modalBody);


    function postSubmitCallback(contribution) {
        publishContriblyEvent({type: "submitted", contribution: contribution})
    }


    if (displayMode == "modal") {

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
            var root = e.data.root;

            var isInitalised = findModalInner().length > 0;
            if (!isInitalised) {
                initModal(root, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalContent, contriblyFormResponsesUrl, postSubmitCallback);

                var successCloseButton = $contriblyjQuery('<a class="btn btn-close" href="#" aria-hidden="true">Close this window</a>');
                successCloseButton.on('click', {modal: contributeModal}, closeModal);
                modalBody.find(".success-buttons").append(successCloseButton);

                $contriblyjQuery('body').children('.contribly').append(contributeModal);
            }

            findModalInner().show();
            $contriblyjQuery('.contribly-modal-backdrop').show()
        }

        var closeModalButton = contributeModal.find('.close');
        closeModalButton.on('click', {modal: contributeModal}, closeModal);

        var buttonHtml = '<span class="contribly"><a class="btn btn-primary btn-contribute">' + callToAction + '</a></span>';
        button.html(buttonHtml);
        var contriblyClass = button.find(".contribly");
        contriblyClass.find('.btn-contribute').on('click', {root: contriblyClass}, launchModal);
        publishContriblyEvent({type: "button-shown"})
    }

    if (displayMode == "inline") {
        var div = $contriblyjQuery('<div>', {class: "contribly"});
        div.append(modalBody);
        button.append(div);
        initModal(div, requestedAssignment, clientKey, contriblyClientsUrl, contriblyAssignmentsUrl, contriblyContributionsUrl, contriblyMediaUrl, contriblyFormsUrl, contriblyTokenUrl, modalBody, contriblyFormResponsesUrl, postSubmitCallback);
    }

}

var contriblyContributeCssUrl = "https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/contribute2017030701.css";

var contributeModalBackdropHtml = '<div class="contribly"><div class="modal-backdrop contribly-modal-backdrop" style="display: none"></div></div>';
var backdrop = $contriblyjQuery(contributeModalBackdropHtml);
$contriblyjQuery('body').append(backdrop);

$contriblyjQuery('.contribly-contribute').each(function(i, v) {
    var requestedCss = $contriblyjQuery.attr('data-css');
    var cssToLoad = (requestedCss != undefined) ? requestedCss : contriblyContributeCssUrl;

    var requestedDisplayMode = $contriblyjQuery(v).attr('data-display');
    var displayMode = (requestedDisplayMode != undefined) ? requestedDisplayMode : "inline";

    $contriblyjQuery.ajax({ // TODO duplicate CSS load
        url: cssToLoad,
        success: function(data) {
            $contriblyjQuery("head").append("<style>" + data + "</style>");
            contriblyInitContributeWidget($contriblyjQuery(v), displayMode);
        }
    });
});








