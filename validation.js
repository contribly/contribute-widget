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
            if (field.required) {
                 if (field.type == "checkbox") {
                    if (!fieldInput.prop('checked')) {
                      fieldInput.parent().parent().addClass("has-error");
                      problemFields.push(fieldInput);
                    }
                 } else {
                     if (isBlank(fieldInput.val())) {
                        fieldInput.parent().addClass("has-error");
                        problemFields.push(fieldInput);
                     }
                 }
            }

            if ("email" == field.validator) {
                 if (!isBlank(fieldInput.val()) && !validateEmail(fieldInput.val())) {
                    fieldInput.parent().addClass("has-error");
                    problemFields.push(fieldInput);
                 }
            }
        });
    }

    return problemFields.length == 0;
}
