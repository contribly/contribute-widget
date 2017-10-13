function validateSubmission(assignmentForm, contributeForm) {

    function findFieldByName(name) {
        return contributeForm.find("[name=\"" + name + "\"]")
    }

    function isBlank(string) {
        return string == null || string.trim().length === 0;
    }

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    var problemFields = [];
    if (assignmentForm != null) {
        $contriblyjQuery.each(assignmentForm.fields, function(i, field) {
            var fieldInput = findFieldByName(field.name)

            var hasProblem = false;
            var container = fieldInput.parent();

            if (field.required) {
                 if (field.type == "checkbox") {
                    container = fieldInput.parent().parent();
                    if (!fieldInput.prop('checked')) {
                        hasProblem = true;
                    }
                 } else {
                     if (isBlank(fieldInput.val())) {
                        hasProblem = true;
                     }
                 }
            }

            if ("email" == field.validator) {
                 if (!isBlank(fieldInput.val()) && !validateEmail(fieldInput.val())) {
                    hasProblem = true;
                 }
            }

            if (hasProblem) {
                problemFields.push(fieldInput);
                container.addClass("has-error");
            } else {
                container.removeClass("has-error");
            }
        });
    }

    return problemFields.length == 0;
}
