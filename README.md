# Contribly contribute widget

Reference implementation of a Javascript contribute widget. This widget is intended to demonstrate the use of the Contribly API from client-side JavaScript code.
Prompts the user to contribute to an assignment, submitting the contribution to the Contribly API.

Implemented using jQuery.


## Configuration and deployment

The widget is configured via data attributes on the HTML span

Attribute | Description
-----------|------------
assignment  | The id of the assignment that contributions will be submitted to (required)
client      | The Contribly client key of the application (required)


The widget can be inserted into a target page by pasting the HTML snippet into that page.
The approriate snippets can be found in the Contribly moderation tool.

ie.
```
<span class="contribly-contribute" data-client="a-client-key" data-assignment="an-assignment-id"></span><script type="text/javascript" src="https://s3-eu-west-1.amazonaws.com/contribly-widgets/contribute/contribute.js"></script>
```


## Receiving widget events

You may wish to be informed about events which occur within the contributes widget. Calling your analytics service is a common use case.

You can receive widget event callbacks by defining a function named 'contriblyEventLister'. 
If this function is defined it will be called with an object describing the widget events as they occur.

The format of this object is:

Field      | Description
-----------|------------
type       | The type of the event (button-shown, form-loaded, submitted)
contribution | The contribution if applicable.

ie.
```
function contriblyEventListener(ce) {
    console.log("Received Contribly widget event: " + ce);
    // Do something with this event information
    if (ce.type === "submit") {
        console.log("Contribution submitted has headline: " + ce.contribution.headline);  
    }
};
```
