var currentViewId = 0;
var dataChanged = false;
var elementPositionInfoId = "elementPositionInfo";
var elementDimensionsInfoId = "elementDimensionsInfo";
var pageDimensionsInfoId = "pageDimensionsInfo";
var allElementRules;
var emptyElementName = "(select an element to see)";
var currentlySelectedElement;

$(document).ready(function() {
    // Get views from server
    // Need to get enough info to show list of views and current view
    $.ajax({
        type: "GET",
        url: "/currentData"
    }).done(function(data) {
    	var views = data["views"];
    	allElementRules = data["elementRules"];

    	// Show menu of views at the bottom
    	views.forEach(function(view){
    		addViewMenuItem(view["id"]);
    	});

    	makeFontBold($("#view" + 0 + " a"), $(".clone a"));

		// Render view 0 by default
		renderView(views[0]);
		$(".userPage").resizable();
		//$(".userPageContent").selectable();
    });

    // Possibly want to use templates later (store views in json, then render in template)

    $("#cloneButton").on("click", function(event){
	    $.ajax({
	        type: "POST",
	        url: "/cloneOriginal"
	    }).done(function(data) {

	    	allElementRules = data["elementRules"];

	    	var newCloneId = data["view"]["id"];
	    	// Add link for this new clone
	    	addViewMenuItem(newCloneId);

	    	// Make this link bold
			makeFontBold($("#view" + newCloneId + " a"), $(".clone a"));
			
			// Render this view in the UI
			updateView(newCloneId);
	    	
	    });
	});

    $("#viewsMenu").on("click", ".clone a", function(event){
    	var viewId = $(event.target).parent().attr("viewId"); // need to call "parent()" because $(event.target) is the <a> element and its parent has the "viewId" attribute 
    	// Make this link bold
		makeFontBold($(event.target), $(".clone a"));
		// Render this view in the UI
		updateView(viewId);
	});

    /*$("body").on("resizestart dragstart", ".modifiable", function(event){
    	// On resize or drag
    	dataChanged = true;

    	var elementNum = $(event.target).attr("elementId");
    	$("#elementName").text("Element #" + elementNum);
    	currentlySelectedElement = elementNum;
    	$("#selectedElementRules").css("display", "block");
    });

    $("body").on("resizestop dragstop", ".modifiable", function(event){
    	// On resize or drag
    	dataChanged = true;
    	$("#selectedElementRules").css("display", "none");
    	$("#elementName").text(emptyElementName);
    	currentlySelectedElement = undefined;
    });*/

    $(".userPage").on("click", function(event){
    	// Unselect any other selected elements (if there are any)
    	$(".pageElement.selected").removeClass("selected");
    	if($(event.target).hasClass("pageElement")){
    		/*// Select this element (put box shadow around it)
	    	var newlySelectedElement = $(event.target);
	    	newlySelectedElement.addClass("selected");

	    	// Update the rules menu
	    	var selectedElementNum = newlySelectedElement.attr("elementId");
	    	currentlySelectedElement = selectedElementNum;
	    	//console.log(selectedElementNum);
	    	var selectedElementRules = allElementRules[selectedElementNum];
	    	updateRulesMenu(newlySelectedElement, selectedElementRules);*/
	    	selectElement($(event.target));
    	}else{
    		currentlySelectedElement = undefined;
    		// Clear rules menu
    		$("#selectedElementRules").css("display", "none");
    	}
    });

    /*$("body").on("click", ".pageElement", function(event){
    	// Unselect any other selected elements (if there are any)
    	$(".pageElement.selected").removeClass("selected");

    	// Select this element (put box shadow around it)
    	var newlySelectedElement = $(event.target);
    	newlySelectedElement.addClass("selected");

    	// Update the rules menu
    	var selectedElementNum = newlySelectedElement.attr("elementId");
    	currentlySelectedElement = selectedElementNum;
    	//console.log(selectedElementNum);
    	var selectedElementRules = allElementRules[selectedElementNum];
    	updateRulesMenu(newlySelectedElement, selectedElementRules);
    });

    $("body").on("click", ":not(.pageElement)", function(event){
    	currentlySelectedElement = undefined;
    	$(".pageElement.selected").removeClass("selected");
    });*/

    $("body").on("resize drag", ".modifiable", function(event, ui){
    	//console.log("Happening");
    	// On resize or drag
    	dataChanged = true;
    	//console.log(event);
    	//console.log(ui);

    	//var selectedElementActualId = event.target.id;
    	//var selectedElement = $("#" + selectedElementActualId);
    	

    	/*if(currentlySelectedElement){
	    	var selectedElement = $("#" + currentlySelectedElement);
	    	//var selectedElement = $(event.target);
	    	//console.log(selectedElement);
	    	var selectedElementNum = selectedElement.attr("elementId");
	    	//console.log(selectedElementNum);
	    	var selectedElementRules = allElementRules[selectedElementNum];
	    	//console.log(selectedElementRules);
	    	
	    	// comment out for now only
	    	//updateRulesMenu(selectedElement, selectedElementRules);
	    	console.log("updateRulesMenu 1");
	    	updateRulesMenu(selectedElement);
    	}*/
    });


    // ------------- Behavior on element drag  -------------
    $("body").on("dragstart", ".pageElement", function(event, ui){
    	// Create a relatively positioned box containing the (x, y) coordinates?
    	var dragInfo = $("<div id=" + elementPositionInfoId + "></div>");
    	$(event.target).append(dragInfo);

    	selectElement($(event.target));
    });
    $("body").on("drag", ".pageElement", function(event){
    	// Update element's (x, y) position in the box shown
    	var element = $(event.target);
    	var coords = "(" + element.css("left") + ", " + element.css("top") + ")";
    	$("#" + elementPositionInfoId).text(coords);

    	//console.log("updateRulesMenu 2");
    	updateRulesMenu(element);
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

    	selectElement($(event.target));
    });
    $("body").on("resize", ".pageElement", function(event){
    	// Update element's width, height in the box shown
    	var element = $(event.target);
    	var dimensions = "width: " + element.css("width") + ", height: " + element.css("height");
    	$("#" + elementDimensionsInfoId).text(dimensions);

    	//console.log("updateRulesMenu 3");
    	updateRulesMenu(element);
    });
    $("body").on("resizestop", ".pageElement", function(event, ui){
    	// Remove the relatively positioned box containing the dimensions
    	$("#" + elementDimensionsInfoId).remove();
    });
    // -------------------------------------------------------


    // ------------- Behavior on element selected  -------------
    /*$("body").on("selectableselected", ".userPageContent", function(event, ui){

    	console.log(event);
    	console.log(ui);
    	var selectedElementActualId = ui.selected.id;
    	var selectedElement = $("#" + selectedElementActualId);
    	console.log(selectedElement);
    	var selectedElementNum = selectedElement.attr("elementId");
    	console.log(selectedElementNum);
    	var selectedElementRules = allElementRules[selectedElementNum];
    	console.log(selectedElementRules);
    	updateRulesMenu(selectedElement, selectedElementRules);

    	$("#elementName").text("Element #" + selectedElementNum);
    	currentlySelectedElement = selectedElementNum;
    	$("#selectedElementRules").css("display", "block");
    });
    $("body").on("selectableunselected", ".userPageContent", function(event, ui){
    	$("#selectedElementRules").css("display", "none");
    	$("#elementName").text(emptyElementName);
    	currentlySelectedElement = undefined;
    });*/

    // ------------- Behavior on page resize  -------------
    $("body").on("resize", ".userPage", function(event){
    	// Show page's width, height
    	updatePageDimensionsLabel();
    });
    // ----------------------------------------------------


    // ------------- Behavior on radio button change -------------
    $("input[type=radio]").on("change", function(event){
    	//console.log(event);
    	var property = event.target.name;
    	// currentlySelectedElement is the element
    	// Now need to update the corresponding rule
    	// Send relevant info back to server
    	// Then get full rule data structure back from server
    });
    // -----------------------------------------------------------


    $(".userPage").resizable();
    //$(".userPageContent").selectable();

    //$("#elementWidthRules input").checkboxradio();

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

var selectElement = function(element){
	// Select this element (put box shadow around it)
	element.addClass("selected");

	/*// Update the rules menu
	var selectedElementNum = element.attr("elementId");
	currentlySelectedElement = selectedElementNum;
	//console.log(selectedElementNum);
	var selectedElementRules = allElementRules[selectedElementNum];*/

	// Update the rules menu
	var selectedElementNum = element.attr("elementId");
	currentlySelectedElement = selectedElementNum;
	
	// comment out for now only
	//updateRulesMenu(element, selectedElementRules);
	//console.log("updateRulesMenu 4");
	updateRulesMenu(element);
};

//var updateRulesMenu = function(jQueryElement, elementRules){
var updateRulesMenu = function(jQueryElement){
	//console.log("inside of updateRulesMenu");

	//console.log(jQueryElement);

	var selectedElementNum = jQueryElement.attr("elementId");
	//console.log(selectedElementNum);

	//console.log(allElementRules);

	var elementRules = allElementRules[selectedElementNum];

	//console.log(elementRules);

	// Set radio button constant + ratio text values
    // Set selected radio button

    // width, height, x, y

    // Width
    // Calculate current constant, current ratio
    var currentWidthConstant = jQueryElement.width();
    var currentPageWidth = $(".userPage").width();
    var currentWidthRatio = 1.0 * currentWidthConstant / currentPageWidth * 100;
    $("#radio-width-constant-value").text(currentWidthConstant + "px");
    $("#radio-width-ratio-value").text(currentWidthRatio + "% of page width");

    if(elementRules["width"]["rule"] === "constant"){
    	$("#radio-width-constant").attr("checked", true);
    }else if(elementRules["width"]["rule"] === "ratio"){
    	$("#radio-width-ratio").attr("checked", true);
    }else{
    	// Something is wrong, or indicate "inconsistent rule"
    	console.log("Inconsistent rule");
    }
    // If doesn't match value in elementRules...?

    // Height
    var currentHeightConstant = jQueryElement.height();
    var currentPageHeight = $(".userPage").height();
    var currentHeightRatio = 1.0 * currentHeightConstant / currentPageHeight * 100;
    $("#radio-height-constant-value").text(currentHeightConstant + "px");
    $("#radio-height-ratio-value").text(currentHeightRatio + "% of page height");

    if(elementRules["height"]["rule"] === "constant"){
    	$("#radio-height-constant").attr("checked", true);
    }else if(elementRules["height"]["rule"] === "ratio"){
    	$("#radio-height-ratio").attr("checked", true);
    }else{
    	// Something is wrong, or indicate "inconsistent rule"
    	console.log("Inconsistent rule");
    }

    // x
    var currentXConstant = jQueryElement.offset().left;
    var currentPageWidth = $(".userPage").width();
    var currentXRatio = 1.0 * currentXConstant / currentPageWidth * 100;
    $("#radio-x-constant-value").text(currentXConstant + "px");
    $("#radio-x-ratio-value").text(currentXRatio + "% of page width");

    if(elementRules["x"]["rule"] === "constant"){
    	$("#radio-x-constant").attr("checked", true);
    }else if(elementRules["x"]["rule"] === "ratio"){
    	$("#radio-x-ratio").attr("checked", true);
    }else{
    	// Something is wrong, or indicate "inconsistent rule"
    	console.log("Inconsistent rule");
    }

    // y
    var currentYConstant = jQueryElement.offset().top;
    var currentPageHeight = $(".userPage").height();
    var currentYRatio = 1.0 * currentYConstant / currentPageHeight * 100;
    $("#radio-y-constant-value").text(currentYConstant + "px");
    $("#radio-y-ratio-value").text(currentYRatio + "% of page height");

    if(elementRules["y"]["rule"] === "constant"){
    	$("#radio-y-constant").attr("checked", true);
    }else if(elementRules["y"]["rule"] === "ratio"){
    	$("#radio-y-ratio").attr("checked", true);
    }else{
    	// Something is wrong, or indicate "inconsistent rule"
    	console.log("Inconsistent rule");
    }

    // Ensure menu is visible
    $("#selectedElementRules").css("display", "block");
}

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
    	allElementRules = data["elementRules"];

    	currentViewId = viewId;

    	renderView(data["view"]);

    	$(".userPage").resizable();
    	//$(".userPageContent").selectable();
    });
};

var addViewMenuItem = function(viewId){
	var newViewText = "Clone " + viewId;
	var newViewIdString = "view" + viewId;
	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewText + '</a></span>');
	$("#viewsMenu").append(newViewObject);
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
	//$(".pageElement").selectable();
	//$(".userPageContent").selectable();
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