var currentViewId = 0;
var dataChanged = false;
var elementPositionInfoId = "elementPositionInfo";
var elementDimensionsInfoId = "elementDimensionsInfo";
var pageDimensionsInfoId = "pageDimensionsInfo";
var allElementRules;
var emptyElementName = "(select an element to see)";
var currentlySelectedElement;
var elementCSSRules = "elementCSSRules";
var cssRules = [];

var elementDataFormat = {
	"width": [
		{
			"property": "width",
			"get": function(){
				return this.width();
				//width();
				//this.offsetWidth;
			}
		}
	],
	"height": [
		{
			"property": "height",
			"get": function(){
				return this.height();
			}
		}
	],
	"x": [
		{
			"property": "left",
			"get": function(){
				return this.offset().left;
			}
		}/*,
		{
			"property": "right",
			"get": function(){
				return this.offset().right;
			}
		}*/
	],
	"y": [
		{
			"property": "top",
			"get": function(){
				return this.offset().top;
			}
		}/*,
		{
			"property": "bottom",
			"get": function(){
				return this.offset().bottom;
			}
		}*/
	]
};

$(document).ready(function() {
    // Get views from server
    // Need to get enough info to show list of views and current view
    $.ajax({
        type: "GET",
        url: "/currentData"
    }).done(function(data) {
    	var views = data["views"];
    	allElementRules = data["elementRules"];
    	//console.log(allElementRules);
    	cssRules = data["cssRules"];
    	//console.log(cssRules);
    	// Show menu of views at the bottom
    	views.forEach(function(view){
    		addViewMenuItem(view["id"]);
    	});

    	makeFontBold($("#view" + 0 + " a"), $(".clone a"));

    	// Should we inject cssRules here? And then when we render view0 below, only add elements, no styling?
    	// Technically maybe just need to insert element divs into the DOM; could have a list of all element ids + other properties that don't change as page dims change

    	replaceCSSRules();

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

    $(".userPage").on("click", function(event){
    	// Unselect any other selected elements (if there are any)
    	$(".pageElement.selected").removeClass("selected");
    	if($(event.target).hasClass("pageElement")){
	    	selectElement($(event.target));
    	}else{
    		currentlySelectedElement = undefined;
    		// Clear rules menu
    		$("#selectedElementRules").css("display", "none");
    	}
    });

    $("body").on("resize drag", ".modifiable", function(event, ui){
    	dataChanged = true;
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

    	//updateRulesMenu(element);
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

    	//updateRulesMenu(element);
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


    // ------------- Behavior on radio button change -------------
    $("input[type=radio]").on("change", function(event){
    	var elementRulesToUpdate = allElementRules[currentlySelectedElement];
    	var elementProperty = event.target.name;
    	var elementRuleType = event.target.value;
    	//var elementRuleValue = event.target["rule-value"];
    	var elementRuleValue = parseFloat($(event.target).attr("rule-value"));
    	elementRulesToUpdate[elementProperty]["rule"] = elementRuleType;
    	elementRulesToUpdate[elementProperty]["value"] = elementRuleValue;
    	// Where is this value stored? Only directly in HTML text, or can it be stored as an attribute value or in a datastructure?

    	// Need to update value here? Or probably value should be determined on server? For now update value here
    	// If "ratio" is selected, include percentage; if "constant" is selected, include pixel value
    	// Later on: Use logic (from processInput.js) to determine pattern, and to determine if rule is inconsistent for all keyframes
    	
    	// Send rules back to server
    	$.ajax({
	        type: "POST",
	        url: "/updateRules",
	        data: {"rules": allElementRules}
	    }).done(function(data) {
	    	cssRules = data["cssRules"];
	    	replaceCSSRules();
	    });
    });
    // -----------------------------------------------------------


    $(".userPage").resizable();
    
    // Probably should have a timer to send updated element data to server to be saved
    window.setInterval(function(){
    	if(dataChanged){
			var viewData = captureElementAndPageData();
			dataChanged = false;

			// should element rules be updated here? Or maybe let the server take care of that

    		// Send update to server
    		$.ajax({
		        type: "POST",
		        url: "/updateData",
		        data: viewData
		    }).done(function(data) {
		    	cssRules = data["cssRules"];
		    	console.log(cssRules);
		    	replaceCSSRules();
		    });
    	}
    }, 1000);
    //}, 10000);
});

var selectElement = function(element){
	// Select this element (put box shadow around it)
	element.addClass("selected");

	// Update the rules menu
	var selectedElementNum = element.attr("elementId");
	currentlySelectedElement = selectedElementNum;
	
	//updateRulesMenu(element);
};

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
		var elementId = parseInt(jqueryUIElement.attr("elementId"));
		
		var elementColor = jqueryUIElement.css("background-color");
		var uiElementData = {
			"id": elementId,
			"color": elementColor
		};

		var elementPropertyKeyValues = Object.entries(elementDataFormat);
		for(var propertyIndex = 0; propertyIndex < elementPropertyKeyValues.length; propertyIndex++){
			var propertyKeyAndValue = elementPropertyKeyValues[propertyIndex];
			var behaviorName = propertyKeyAndValue[0];
			var propertyDataList = propertyKeyAndValue[1];
			
			for(var optionIndex = 0; optionIndex < propertyDataList.length; optionIndex++){
				var optionData = propertyDataList[optionIndex];
				var propertyName = optionData["property"];
				var propertyValue = (optionData["get"]).call(jqueryUIElement);
				var propertyObj = {};
				propertyObj[propertyName] = propertyValue;
				uiElementData[behaviorName] = propertyObj;
			}
		}

		uiElementsData.push(uiElementData);
	}
	console.log(uiElementsData);
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
    	
    	// Now select what was currentlySelectedElement before
    	$("[elementId=" + currentlySelectedElement + "]").addClass("selected");
    });
};

var addViewMenuItem = function(viewId){
	var newViewText = "Keyframe " + viewId;
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
};

var createDOMElement = function(elementData){
	var element = $("<div></div>").attr("id", "element" + elementData["id"]);
	element.attr("elementId", elementData["id"]);
	element.css("background-color", elementData["color"]);
	element.addClass("pageElement");
	element.addClass("modifiable");

	// Commenting these out, since they'll be set by the CSS rules we inject
	/*element.css("left", elementData["x"]);
	element.css("top", elementData["y"]);
	element.css("width", elementData["width"]);
	element.css("height", elementData["height"]);*/

	return element;
};

var replaceCSSRules = function(){
	$("#" + elementCSSRules).empty();
	var cssRulesString = "";
	for(var i = 0; i < cssRules.length; i++){
		cssRulesString += cssRules[i];
	}
	$("#" + elementCSSRules).append("<style>" + cssRulesString + "</style>");
};