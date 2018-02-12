var currentViewId = 0;
var dataChanged = false;
var elementPositionInfoId = "elementPositionInfo";
var elementDimensionsInfoId = "elementDimensionsInfo";
var pageDimensionsInfoId = "pageDimensionsInfo";

$(document).ready(function() {
    // Get views from server
    // Need to get enough info to show list of views and current view
    $.ajax({
        type: "GET",
        url: "/currentData"
    }).done(function(data) {
    	var views = data.views;

    	// Show menu of views at the bottom
    	views.forEach(function(view){
    		addViewMenuItem(view["id"]);
    	});

    	makeFontBold($("#view" + 0 + " a"), $(".clone a"));

		// Render view 0 by default
		renderView(views[0]);
		$(".userPage").resizable();
    });

    // Possibly want to use templates later (store views in json, then render in template)

    $("#cloneButton").on("click", function(event){
	    $.ajax({
	        type: "POST",
	        url: "/cloneOriginal"
	    }).done(function(data) {

	    	var newCloneId = data["view"]["id"];
	    	// Add link for this new clone
	    	addViewMenuItem(newCloneId);

	    	// Make this link bold
			makeFontBold($("#view" + newCloneId + " a"), $(".clone a"));
			
			// Render this view in the UI
			updateView(newCloneId);
	    	
	    });
	});

    $("#demoCSSMenu").on("click", ".clone a", function(event){
    	var viewId = $(event.target).parent().attr("viewId"); // need to call "parent()" because $(event.target) is the <a> element and its parent has the "viewId" attribute 
    	// Make this link bold
		makeFontBold($(event.target), $(".clone a"));
		// Render this view in the UI
		updateView(viewId);
	});

    $("body").on("resize drag", ".modifiable", function(event){
    	// On resize or drag
    	dataChanged = true;
    });


    // ------------- Behavior on element drag  -------------
    $("body").on("dragstart", ".pageElement", function(event, ui){
    	// Create a relatively positioned box containing the (x, y) coordinates?
    	var dragInfo = $("<div id=" + elementPositionInfoId + "></div>");
    	$(event.target).append(dragInfo);
    });
    $("body").on("drag", ".pageElement", function(event){
    	// Update element's (x, y) position in the box shown
    	var element = $(event.target);
    	var coords = "(" + element.css("left") + ", " + element.css("top") + ")";
    	$("#" + elementPositionInfoId).text(coords);
    });
    $("body").on("dragstop", ".pageElement", function(event, ui){
    	// Remove the relatively positioned box containing the (x, y) coordinates
    	$("#" + elementPositionInfoId).remove();
    });
    // -----------------------------------------------------


    // ------------- Behavior on element resize  -------------
    $("body").on("resizestart", ".pageElement", function(event, ui){
    	// Create a relatively positioned box containing the (x, y) coordinates?
    	var resizeInfo = $("<div id=" + elementDimensionsInfoId + "></div>");
    	$(event.target).append(resizeInfo);
    });
    $("body").on("resize", ".pageElement", function(event){
    	// Update element's width, height in the box shown
    	var element = $(event.target);
    	var dimensions = "width: " + element.css("width") + ", height: " + element.css("height");
    	$("#" + elementDimensionsInfoId).text(dimensions);
    });
    $("body").on("resizestop", ".pageElement", function(event, ui){
    	// Remove the relatively positioned box containing the dimensions
    	$("#" + elementDimensionsInfoId).remove();
    });
    // -------------------------------------------------------


    // ------------- Behavior on page resize  -------------
    $("body").on("resize", ".userPage", function(event){
    	// Show page's width, height
    	updatePageDimensionsLabel();
    });
    // ----------------------------------------------------

    $(".userPage").resizable();

    // Probably should have a timer to send updated element data to server to be saved
    window.setInterval(function(){
    	if(dataChanged){
			var viewData = captureElementAndPageData();
			dataChanged = false;

    		// Send update to server
    		$.ajax({
		        type: "POST",
		        url: "/updateData",
		        data: viewData
		    });
    	}
    }, 1000);
});

var updatePageDimensionsLabel = function(){
	var element = $(".userPage");
	var dimensions = "width: " + element.css("width") + ", height: " + element.css("height");
    $("#" + pageDimensionsInfoId).text(dimensions);
};

// Capture element width/height/x/y data
var captureElementData = function(){
	var uiElements = $(".pageElement");
	var uiElementsData = [];
	for(var i = 0; i < uiElements.length; i++){
		var uiElementId = uiElements[i].id;
		var jqueryUIElement = $("#" + uiElementId);
		var elementId = jqueryUIElement.attr("elementId");
		var elementWidth = jqueryUIElement.css("width");
		var elementHeight = jqueryUIElement.css("height");
		var elementX = jqueryUIElement.css("left");
		var elementY = jqueryUIElement.css("top");
		var elementColor = jqueryUIElement.css("background-color");
		var uiElementData = {
			"id": elementId,
			"width": elementWidth,
			"height": elementHeight,
			"x": elementX,
			"y": elementY,
			"color": elementColor
		};
		uiElementsData.push(uiElementData);
	}
	return uiElementsData;
}

var captureElementAndPageData = function(){
	var currentViewWidthHeight = getCurrentViewWidthHeight();
	var currentViewWidth = currentViewWidthHeight["width"];
	var currentViewHeight = currentViewWidthHeight["height"];
	var elementsData;
	elementsData = captureElementData();
	var viewData = {
    	"oldView": {
    		"oldViewId": currentViewId,
    		"oldViewWidth": currentViewWidth,
    		"oldViewHeight": currentViewHeight,
    		"elementsData": elementsData
	    }
	};
	return viewData;
}

var makeFontBold = function(elementToBeBold, elementsNotToBeBold){
	elementsNotToBeBold.css("font-weight", "normal");
	elementToBeBold.css("font-weight", "bold");
}

var getCurrentViewWidthHeight = function(){
	var containerElement = $(".userPage");
	var width = containerElement.width();
	var height = containerElement.height();
	return {
		"width": width,
		"height": height
	};
}

var updateView = function(viewId){
	var viewData = captureElementAndPageData();
	viewData["newViewId"] = parseInt(viewId);
	dataChanged = false;

    $.ajax({
        type: "POST",
        url: "/view",
        data: viewData
    }).done(function(data) {
    	currentViewId = viewId;

    	renderView(data["view"]);

    	$(".userPage").resizable();
    });
};

var addViewMenuItem = function(viewId){
	var newViewText = "Clone " + viewId;
	var newViewIdString = "view" + viewId;
	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewText + '</a></span>');
	$("#demoCSSMenu").append(newViewObject);
};

var renderView = function(viewData){
	var viewWidth = viewData["pageWidth"];
	var viewHeight = viewData["pageHeight"];

	$(".userPage").css("width", viewWidth);
	$(".userPage").css("height", viewHeight);

	updatePageDimensionsLabel();

	// Construct DOM for this view. Render each element
	var elementsData = viewData["elements"];
	
	$(".userPageContent").empty();
	elementsData.forEach(function(elementData){
		var element = createDOMElement(elementData);
		$(".userPageContent").append(element);
	});

	// Make pageElement elements (i.e., the box right now) draggable and resizable
	$(".pageElement").draggable();
	$(".pageElement").resizable();
};

var createDOMElement = function(elementData){
	var element = $("<div></div>").attr("id", "element" + elementData["id"]);
	element.attr("elementId", elementData["id"]);
	element.css("left", elementData["x"]);
	element.css("top", elementData["y"]);
	element.css("width", elementData["width"]);
	element.css("height", elementData["height"]);
	element.css("background-color", elementData["color"]);
	element.addClass("pageElement");
	element.addClass("modifiable");
	return element;
};