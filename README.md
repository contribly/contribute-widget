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
display     | The display mode. Inline of modal (inline|model)

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


### Mapping Contribly events to Google Analytics events

If Google Analytics is available on the page where the widget is to be shown, the [Google Analytics Events Tracking](https://developers.google.com/analytics/devguides/collection/analyticsjs/events) API can be to record Contribly widget events.

Insert the following code onto the page, somewhere after Google Analytics but before the widget:

```
<script>
function contriblyEventListener(ce) {
    if (ga === "function") {
        ga('send', 'event', 'Contribly', ce.type, ce.widget);
    }
};
</script>
```

This code generates an analytics event for each Contribly widget event. These events should be visible in the Google Analytics console (Reporting / Behaviour / Events) under the event category 'Contribly'.


### Mapping to Google Tag Manager events

The events callback approach can also be used to map Contribly events to [Google Tag Manager events](https://developers.google.com/tag-manager/devguide#events).

```
<script>
    function contriblyEventListener(ce) {
        dataLayer.push({
            'category': 'Contribly',
		    'widget': ce.widget,
                'action': ce.type
            }, {'event': 'data-layer-event'}
            );
</script>
```
