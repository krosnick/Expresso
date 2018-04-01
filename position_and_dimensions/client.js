var currentViewId = 0; // Should this start as 0?
var dataChanged = false;
var resizingElement = false;
var repositioningElement = false;

/*var elementPositionInfoId = "elementPositionInfo";
var elementDimensionsInfoId = "elementDimensionsInfo";*/

var pageDimensionsInfoId = "pageDimensionsInfo";
//var allElementRules;
var emptyElementName = "(select an element to see)";

//var currentlySelectedElement;
var selectedElementNums = [];
var ctrlKeyDown = false;

var elementCSSRules = "elementCSSRules";
var cssRules = [];

var draggedElementX = undefined;
var draggedElementY = undefined;

var resizedElementWidth = undefined;
var resizedElementHeight = undefined;


var getPageWidth = function(){
	return $(".userPage").width();
};

var getPageHeight = function(){
	return $(".userPage").height();
};

var elementDataFormat = {
	"width": [
		{
			"property": "width",
			"get": function(){
				return this.width();
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
		},
		{
			"property": "right",
			"get": function(){
				return $(".userPage").width() - this.width() - this.offset().left;
			}
		}
	],
	"y": [
		{
			"property": "top",
			"get": function(){
				return this.offset().top;
			}
		},
		{
			"property": "bottom",
			"get": function(){
				return $(".userPage").height() - this.height() - this.offset().top;
			}
		}
	],
	"font-size": [
		{
			"property": "font-size",
			"get": function(){
				return extractPixelValue(this.css("font-size"));
			}
		}
	],
	"background-color": [
		{
			"property": "background-color",
			"get": function(){
				//return this.css("background-color");
				var computedBackgroundColor = this.css("background-color");
				if(computedBackgroundColor !== "rgba(0, 0, 0, 0)"){
					return computedBackgroundColor;
				}else{
					return "";
				}
			}
		}
	],
	"color": [
		{
			"property": "color",
			"get": function(){
				if(this.text().trim().length === 0){ // If there's no text, don't set "color" property
					return "";
				}
				var computedColor = this.css("color");
				if(computedColor !== "rgba(0, 0, 0, 0)"){
					return computedColor;
				}else{
					return "";
				}
			}
		}
	]/*,
	"visibility": [
		{
			"property": "visibility",
			"get": function(){
				return this.css("visibility");
			}
		}
	]*/
};

var generateRuleInferenceHTML = function(behaviorName){
	//var ruleInferenceSelectWidgetHTML = '<div class="transitionPiece">Left </div>' + generateRuleInferenceDirectionHTML(behaviorName, "left") + '<div class="transitionPiece"> Current </div>' + generateRuleInferenceDirectionHTML(behaviorName, "right") + '<div class="transitionPiece"> Right </div>';
	var ruleInferenceSelectWidgetHTML = '<div class="transitionPiece textLabel textLabelLeft">Left </div>' + generateRuleInferenceDirectionHTML(behaviorName, "left") + '<div class="transitionPiece textLabel textLabelCenter"> Current </div>' + generateRuleInferenceDirectionHTML(behaviorName, "right") + '<div class="transitionPiece textLabel textLabelRight"> Right </div>';
	return ruleInferenceSelectWidgetHTML;
};

var generateRuleInferenceDirectionHTML = function(behaviorName, side){
	
	var optionsHTML = "";
	var transitionOptionIds = Object.keys(transitionOptions);
	for(var i = 0; i < transitionOptionIds.length; i++){
		var transitionKey = transitionOptionIds[i];
		var transitionDataClass = transitionOptions[transitionKey];
		//var optionString = '<option value="' + transitionKey + '"data-class="' + transitionDataClass + '">&nbsp;</option>';
		var optionString = '<option value="' + transitionKey + '"data-class="' + transitionDataClass + "_" + side +  'Side" side="' + side + '">&nbsp;</option>';
		optionsHTML += optionString;
	}

	optionsHTML += '<option value="empty" data-class="empty" disabled>&nbsp;</option>';

	var name = "ruleInferenceSelect_" + behaviorName;
	var id = "ruleInferenceSelect_" + behaviorName;
	var selectHTML = '<fieldset class="transitionPiece"><select name="' + name + '" id="' + id + '" class="ruleInferenceSelect" behavior-name=' + behaviorName +' side="' + side + '">' + optionsHTML + '</select></fieldset>';

	var ruleInferenceDirectionSelectWidgetHTML = selectHTML;
	return ruleInferenceDirectionSelectWidgetHTML;
}

/*var transitionOptions = {
	"left-closed-right-closed": "left-closed-right-closed",
	"left-closed-right-open": "left-closed-right-open",
	"left-open-right-closed": "left-open-right-closed"
};*/
var transitionOptions = {
	"left-closed-right-open": "left-closed-right-open",
	"left-closed-right-closed": "left-closed-right-closed",
	"left-open-right-closed": "left-open-right-closed"
};

var propertyToCSSStringFunction = {
	width: function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"height": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"left": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"right": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"top": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"bottom": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"font-size": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"background-color": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createRGBCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	},
	"color": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createRGBCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	}/*,
	"visibility": function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
		return createDiscreteSingleAttributeCSSString(ruleObject, elementId, propertyName, dimensionValue, imageRatio);
	}*/
};


var getUserPageDimValue = function(relevantPageDim){
	var userPageObj = $(".userPage");
	if(relevantPageDim === "pageWidth"){
		return userPageObj.width();
	}else if(relevantPageDim === "pageHeight"){
		return userPageObj.height();
	}else{
		console.error("Error");
	}
};

$(document).ready(function() {
    // Get views from server
    // Need to get enough info to show list of views and current view
    $.ajax({
        type: "GET",
        url: "/currentData"
    }).done(function(data) {
    	var views = data["views"];
    	//allElementRules = data["elementRules"];
    	cssRules = data["cssRules"];
    	
    	views.sort(comparePageWidths);
    	var initViewId = views[views.length-1]["id"]; // The last one (or the widest viewport)
    	updateViewsMenu(views, initViewId);

    	// Should we inject cssRules here? And then when we render view0 below, only add elements, no styling?
    	// Technically maybe just need to insert element divs into the DOM; could have a list of all element ids + other properties that don't change as page dims change

    	replaceCSSRules();

		// Render view 0 by default
		//renderView(views[0]);
		//renderView(views[initViewId]);
		renderView(views[views.length-1]);
		

		// Commenting this out, since initially a keyframe is shown, and the page size should not be resizable
		//$(".userPage").resizable();
		// Adding this back
		$(".userPage").resizable({
		  handles: "e"
		});
    });

    // Possibly want to use templates later (store views in json, then render in template)

    // This should create a keyframe for the current page size in the "final webpage" view
	$("#cloneButton").on("click", function(event){
	    var viewData = captureElementAndPageData();
	    $.ajax({
	        type: "POST",
	        url: "/createKeyframe",
	        data: viewData
	    }).done(function(data) {

	    	//allElementRules = data["elementRules"];

	    	var newCloneId = data["newView"]["id"];
	    	/*// Add link for this new clone
	    	addViewMenuItem(data["newView"]);*/

	    	var views = data["views"];
	    	updateViewsMenu(views, newCloneId);

	    	// Make this link bold
			makeFontBold($("#view" + newCloneId + " a"), $(".nav-pills a"));
			
			// Render this view in the UI
			updateView(newCloneId);

			// need to clear "final webpage" things and add keyframe things
	    	
	    	// Since we are adding a new keyframe, that means there are now at least 2 keyframes; ok for the delete keyframe button to be enabled now
	    	$("#deleteButton").prop('disabled', false);
	    });
	});

	// Delete current keyframe
	$("#deleteButton").on("click", function(event){
		// Should handle 0-keyframe case at some point

	    $.ajax({
	        type: "POST",
	        url: "/deleteKeyframe",
	        data: {"viewId": currentViewId}
	    }).done(function(data) {

	    	// Need to remove deleted keyframe's link
	    	removeViewMenuItem(currentViewId);

	    	var nextViewToShow = data["nextViewToShow"];
	    	var nextKeyframeToShowId =  nextViewToShow["id"]; // sent from server; in the future maybe ask from client?
	    	//makeFontBold($("#view" + nextKeyframeToShowId + " a"), $(".clone a"));
	    	makeFontBold($("#view" + nextKeyframeToShowId + " a"), $(".nav-pills a"));

	    	cssRules = data["cssRules"];
	    	//replaceCSSRules(); // Maybe this isn't needed?
	    	
	    	//allElementRules = data["elementRules"];
	    	currentViewId = nextViewToShow["id"];
	    	renderView(nextViewToShow);
	    	// Commenting this out, since initially a keyframe is shown, and the page size should not be resizable
			//$(".userPage").resizable();

	    	// Let's try this - yes this worked
	    	replaceCSSRules();

	    	/*if(currentlySelectedElement){
		    	selectElement($("[elementId=" + currentlySelectedElement + "]"));
		    }*/
		    if(selectedElementNums.length > 0){
		    	selectMultipleElements();
		    }

	    	/*// Now select what was currentlySelectedElement before
	    	$("[elementId=" + currentlySelectedElement + "]").addClass("selected");*/

	    	// If only one keyframe left, disable the delete button (we don't want to allow deleting the last keyframe; current version of our tool relies on having at least one keyframe)
	    	if($(".clone").length == 1){
	    		$("#deleteButton").prop('disabled', true);
	    	}
	    });
	});

    $("#viewsMenu").on("click", ".clone a", function(event){
    	var viewId = $(event.target).parent().attr("viewId"); // need to call "parent()" because $(event.target) is the <a> element and its parent has the "viewId" attribute 
    	// Make this link bold
		//makeFontBold($(event.target), $(".clone a"));
		makeFontBold($(event.target), $(".nav-pills a"));
		// Render this view in the UI
		updateView(viewId);
	});

	// Need a on-click for #viewOnlyMode
	$("#viewOnlyMode").on("click", "a", function(event){

		switchFromKeyframeToFinalWepageMode();

		/*
		//currentlySelectedElement = undefined;
		selectedElementNums = [];
		dataChanged = false;
		currentViewId = null;

		// Perhaps also send updated keyframe view (before this point) to the server, to make sure it's update to date?
		//---------------------

		makeFontBold($(event.target), $(".nav-pills a"));

		// There's no particular view to select though. But we need to update the view to show the "view only" view;
		// elements not editable, but keyframe size is

		$(".pageElement.selected").removeClass("selected");
    	$("#toolsMenu").hide();

    	// Update buttons
    	// Make sure the create new keyframe button is shown

    	$("#cloneButton").prop('disabled', false);
    	$("#deleteButton").prop('disabled', true);

		destroyElementModifiable();
		//$(".userPage").resizable();
		$(".userPage").resizable({
		  handles: "e"
		});

		// Let's see if this works
		replaceCSSRules();

		// Clear rules menu
		$("#selectedElementRules").css("display", "none"); // This element may not be used anymore
		*/
	});

    //$(".userPage").on("click", function(event){
    // Not ideal selector; later on add a container for the .userPage and the gray area (for when the .userPage doesn't take up full 1200px area)
    $("body").on("click", function(event){
    	// Check and see if the clicked element is #viewsMenu or #rightMenu, or is a child of one of those; if so, then do not unselect the element
    	// Only unselect the element if the clicked area is not in #viewsMenu or #rightMenu
    	if($(event.target).attr("id") === "viewsMenu" || $(event.target).attr("id") === "rightMenu" || $(event.target).parents("#viewsMenu").length > 0 || $(event.target).parents("#rightMenu").length > 0){
    		// Do nothing. The currently selected element (if there is one) should remain selected
    	}else if($(event.target).hasClass("ui-icon")){
    		// Do nothing. The currently selected element (if there is one) should remain selected
    	}else{
    		if(currentViewId !== null && currentViewId !== undefined){ // Keyframe mode
    			var elementToSelect;
    			if($(event.target).hasClass("pageElement")){
			    	elementToSelect = $(event.target);
		    	}else if($(event.target).parent(".pageElement").length > 0){
		    		// This means the user has clicked on an <img> element. We should select its parent
		    		elementToSelect = $(event.target).parent(".pageElement");
		    	}
		    	if(elementToSelect){
		    		if(ctrlKeyDown){
		    			var elementId = elementToSelect.attr("elementId");
		    			if(selectedElementNums.includes(elementId)){
		    				// If elementToSelect's id is already in selectedElementNums, then we want to remove it and deselect it
		    				var indexOfElementId = selectedElementNums.indexOf(elementId);
		    				selectedElementNums.splice(indexOfElementId, 1);
		    				elementToSelect.removeClass("selected");

		    				// Give focus to another element
		    				$("[elementId=" + selectedElementNums[selectedElementNums.length-1] + "]").focus();
		    			}else{
		    				selectElement(elementToSelect);
		    			}
		    		}else{
		    			selectElement(elementToSelect);
		    		}
		    	}else{
		    		//currentlySelectedElement = undefined;
		    		if(ctrlKeyDown){
		    			// Do nothing. The already selected elements should remain selected
		    		}else{
		    			selectedElementNums = [];
			    		// Clear rules menu
			    		$("#selectedElementRules").css("display", "none");
			    		$(".pageElement.selected").removeClass("selected");
		    		}
		    	}

    		}else{ // "Final page" mode
	    		$(".pageElement.selected").removeClass("selected");
		    	$("#toolsMenu").hide();
    		}

    		updateRightMenuWidgets();
    	}
    });

    /*$("body").on("resizestart", ".userPage", function(event, ui){
    	// If in keyframe mode, switch to "final webpage" mode"
    	if(currentViewId != null && currentViewId != undefined){
    		switchFromKeyframeToFinalWepageMode();
    	}
    });*/

    $("body").on("resizestart", ".userPage", function(event, ui){
    	// If not page element
    	if(!$(event.target).hasClass("pageElement")){
    		// If in keyframe mode, switch to "final webpage" mode"
	    	if(currentViewId != null && currentViewId != undefined){
	    		switchFromKeyframeToFinalWepageMode();
	    	}
    	}
    });

    $("body").on("resize", ".userPage", function(event, ui){

    	// If not page element
    	if(!$(event.target).hasClass("pageElement")){
	    	replaceCSSRules();

	    	// Show page's width, height
	    	updatePageDimensionsLabel();
    	}
    });

    /*$("body").on("resize", ".userPage", function(event, ui){

    	replaceCSSRules();

    	// Show page's width, height
    	updatePageDimensionsLabel();
    });*/

    $("body").on("resizestop dragstop", ".pageElement", function(event, ui){
    	dataChanged = true;

    	draggedElementX = undefined;
    	draggedElementY = undefined;

    	resizedElementWidth = undefined;
    	resizedElementHeight = undefined;
    });

    // Should we support ctrl-a?
    $(document).on('keydown', function(event){
    	//if(event.ctrlKey) {
		if(event.ctrlKey || event.metaKey) {
			ctrlKeyDown = true;
		}
	});

	$(document).on('keyup', function(event){
		ctrlKeyDown = false;
	});

    $("body").on("keydown", ".pageElement", function(event){
    	// If an element is currently selected, move it in the direction of pressed arrow key
    	//if(currentlySelectedElement){
    	if(selectedElementNums.length > 0){
    		if(event.originalEvent.which >= 37 && event.originalEvent.which <= 40){
    			var deltaMagnitude = 4;
    			if(event.originalEvent.which === 37 || event.originalEvent.which === 39){ // If left/right arrow
    				var delta;
    				if(event.originalEvent.which === 37){
    					delta = -1 * deltaMagnitude;
    				}else{ // 39
    					delta = 1 * deltaMagnitude;
    				}
    				// Move elements appropriately
    				selectedElementNums.forEach(function(elementNum){
    					var currentLeftValue = $("[elementId=" + elementNum + "]").offset().left;
    					$("[elementId=" + elementNum + "]").offset({ left: currentLeftValue + delta });
    				});
    			}else{ // If up/down arrow (38 or 40)
    				var delta;
    				if(event.originalEvent.which === 38){
    					delta = -1 * deltaMagnitude;
    				}else{ // 40
    					delta = 1 * deltaMagnitude;
    				}
    				// Move element appropriately
    				selectedElementNums.forEach(function(elementNum){
    					var currentTopValue = $("[elementId=" + elementNum + "]").offset().top;
    					$("[elementId=" + elementNum + "]").offset({ top: currentTopValue + delta });
    				});
    			}
    			/*//updateRightMenuWidgets($(event.target));
    			//dataChanged = true;*/
    		}
    	}
    });

    $("body").on("keyup", ".pageElement", function(event){
    	// If an element is currently selected, move it in the direction of pressed arrow key
    	//if(currentlySelectedElement){
    	if(selectedElementNums.length > 0){
    		if(event.originalEvent.which >= 37 && event.originalEvent.which <= 40){
    			// The user was using the arrow keys to move the element around. Now that they've let go, let's update the data
    			dataChanged = true;
    		}
    	}
    });

    // ------------- Behavior on element drag  -------------
    $("body").on("dragstart", ".pageElement", function(event, ui){
    	/*// Create a relatively positioned box containing the (x, y) coordinates?
    	var dragInfo = $("<div id=" + elementPositionInfoId + "></div>");
    	$(event.target).append(dragInfo);*/

    	var elementId = $(event.target).attr("elementId");
		if(!selectedElementNums.includes(elementId)){
			// If this element is not part of the currently selected list, select this element (and deselect the rest)
			selectElement($(event.target));
		}
    	// If this element is part of the currently selected list, then just drag all of them (do not thing special here)
    	
    	draggedElementX = $(event.target).offset().left;
    	draggedElementY = $(event.target).offset().top;
    });
    $("body").on("drag", ".pageElement", function(event){
    	// Don't need to do dataChanged = true here (since we don't need to send the data to the server immediately)
    	// but let's somewhat frequently update the rightmenu widget at least. We'll have a second variable for this
    	repositioningElement = true;

    	var xDiff = $(event.target).offset().left - draggedElementX;
    	var yDiff = $(event.target).offset().top - draggedElementY;

    	// Update all the other selected elements in this way
    	selectedElementNums.forEach(function(elementNum){
    		if(elementNum != $(event.target).attr("elementId")){
    			var currentLeftValue = $("[elementId=" + elementNum + "]").offset().left;
				$("[elementId=" + elementNum + "]").offset({ left: currentLeftValue + xDiff });

				var currentTopValue = $("[elementId=" + elementNum + "]").offset().top;
				$("[elementId=" + elementNum + "]").offset({ top: currentTopValue + yDiff });
    		}
		});

    	draggedElementX = $(event.target).offset().left;
    	draggedElementY = $(event.target).offset().top;

    	/*// Update element's (x, y) position in the box shown
    	var element = $(event.target);
    	var coords = "(" + element.css("left") + ", " + element.css("top") + ")";
    	$("#" + elementPositionInfoId).text(coords);
    	//updateRightMenuWidgets($(event.target));
    	//updateRulesMenu(element);*/
    });
    /*$("body").on("dragstop", ".pageElement", function(event, ui){
    	// Remove the relatively positioned box containing the (x, y) coordinates
    	$("#" + elementPositionInfoId).remove();
    	//updateRightMenuWidgets($(event.target));
    });*/
    // -----------------------------------------------------


    // ------------- Behavior on element resize  -------------
    $("body").on("resizestart", ".pageElement", function(event, ui){
    	/*// Create a relatively positioned box containing the (x, y) coordinates?
    	var resizeInfo = $("<div id=" + elementDimensionsInfoId + "></div>");
    	$(event.target).append(resizeInfo);*/

    	//selectElement($(event.target));

    	var elementId = $(event.target).attr("elementId");
		if(!selectedElementNums.includes(elementId)){
			// If this element is not part of the currently selected list, select this element (and deselect the rest)
			selectElement($(event.target));
		}

		resizedElementWidth = $(event.target).width();
		resizedElementHeight = $(event.target).height();
    });
    $("body").on("resize", ".pageElement", function(event){
    	// Don't need to do dataChanged = true here (since we don't need to send the data to the server immediately)
    	// but let's somewhat frequently update the rightmenu widget at least. We'll have a second variable for this
    	resizingElement = true;

    	var widthDiff = $(event.target).width() - resizedElementWidth;
    	var heightDiff = $(event.target).height() - resizedElementHeight;

    	var widthRatioChange = 1.0 * widthDiff / resizedElementWidth;
    	var heightRatioChange = 1.0 * heightDiff / resizedElementHeight;

    	// Update all the other selected elements with the same ratio change
    	selectedElementNums.forEach(function(elementNum){
    		if(elementNum != $(event.target).attr("elementId")){
    			var element = $("[elementId=" + elementNum + "]");
    			var elementChildren = element.children("img");
    			if(elementChildren.length > 0){
    				// If element is an image, then only widthRatioChange or heightRatioChange should be directly applied;
	    			// the other dimension should follow to keep the fixed aspect ratio
	    			// Let's choose the dimension that had a larger percentage change

	    			if(Math.abs(widthRatioChange) > Math.abs(heightRatioChange)){
	    				// Use widthRatioChange to update the width, and then set the height accordingly
	    				var currentWidthValue = element.width();
		    			var newWidthValue = currentWidthValue * (1.0 + widthRatioChange);
						element.width(newWidthValue);

						var imageRatio = elementChildren.attr("image-ratio");
						var newHeightValue = 1.0 * newWidthValue / imageRatio;
						element.height(newHeightValue);
	    			}else{
	    				// Use heightRatioChange to update the height, and then set the width accordingly
	    				var currentHeightValue = element.height();
		    			var newHeightValue = currentHeightValue * (1.0 + heightRatioChange);
						element.height(newHeightValue);

						var imageRatio = elementChildren.attr("image-ratio");
						var newWidthValue = newHeightValue * imageRatio;
						element.width(newWidthValue);
	    			}

    			}else{
	    			var currentWidthValue = element.width();
	    			var newWidthValue = currentWidthValue * (1.0 + widthRatioChange);
					element.width(newWidthValue);

					var currentHeightValue = element.height();
	    			var newHeightValue = currentHeightValue * (1.0 + heightRatioChange);
					element.height(newHeightValue);
    			}
    		}
		});

		resizedElementWidth = $(event.target).width();
		resizedElementHeight = $(event.target).height();

    	/*// Update element's width, height in the box shown
    	var element = $(event.target);
    	var dimensions = "width: " + element.css("width") + ", height: " + element.css("height");
    	$("#" + elementDimensionsInfoId).text(dimensions);
    	//updateRightMenuWidgets($(event.target));
    	//updateRulesMenu(element);*/
    });
    /*$("body").on("resizestop", ".pageElement", function(event, ui){
    	// Remove the relatively positioned box containing the dimensions
    	$("#" + elementDimensionsInfoId).remove();
    	//updateRightMenuWidgets($(event.target));
    });*/
    // -------------------------------------------------------
    

    /*// ------------- Behavior on page resize  -------------
    $("body").on("resize", ".userPage", function(event){
    	// Show page's width, height
    	updatePageDimensionsLabel();
    });*/
    // ----------------------------------------------------

    // Commenting this out, since initially a keyframe is shown, and the page size should not be resizable
	//$(".userPage").resizable();
    
    // Probably should have a timer to send updated element data to server to be saved
    
    // Commenting out for now; clogging the JS event loop
    /*window.setInterval(function(){
    	if(currentlySelectedElement){
			var elementObj = $("[elementId=" + currentlySelectedElement + "]");
			updateRightMenuWidgets(elementObj);
		}
    }, 500);*/

    window.setInterval(function(){
    	if(dataChanged){
			
			//if(currentlySelectedElement){
			if(selectedElementNums.length > 0){
				// Need to update all elements here
				/*var elementObj = $("[elementId=" + currentlySelectedElement + "]");
				updateRightMenuWidgets(elementObj);*/
				updateRightMenuWidgets();
			}

			var viewData = captureElementAndPageData();
			dataChanged = false;
			resizingElement = false;
			repositioningElement = false;

			// should element rules be updated here? Or maybe let the server take care of that

    		// Send update to server
    		$.ajax({
		        type: "POST",
		        url: "/updateData",
		        data: viewData
		    }).done(function(data) {
		    	cssRules = data["cssRules"];
		    	replaceCSSRules();
		    });
    	}else if(resizingElement){
    		// Update the element width and height widgets in the right menu
    		
    		selectedElementNums.forEach(function(elementNum){
    			var element = $("[elementId=" + elementNum + "]");
	    		var widthAmount = element.width();
				$( "#widthAmount" ).html( Math.round(widthAmount)  + "px" );
				var heightAmount = element.height();
				$( "#heightAmount" ).html( Math.round(heightAmount)  + "px" );
    		});

    		/*var element = $("[elementId=" + currentlySelectedElement + "]");
    		var widthAmount = element.width();
			$( "#widthAmount" ).html( Math.round(widthAmount)  + "px" );
			var heightAmount = element.height();
			$( "#heightAmount" ).html( Math.round(heightAmount)  + "px" );*/
    		resizingElement = false;
    	}else if(repositioningElement){
    		// Update the element x and y position widgets in the right menu
    		
    		selectedElementNums.forEach(function(elementNum){
    			var element = $("[elementId=" + elementNum + "]");
	    		var leftAmount = element.offset().left;
				$( "#leftAmount" ).html( Math.round(leftAmount)  + "px" );
				var topAmount = element.offset().top;
				$( "#topAmount" ).html( Math.round(topAmount)  + "px" );
    		});

    		/*var element = $("[elementId=" + currentlySelectedElement + "]");
    		var leftAmount = element.offset().left;
			$( "#leftAmount" ).html( Math.round(leftAmount)  + "px" );
			var topAmount = element.offset().top;
			$( "#topAmount" ).html( Math.round(topAmount)  + "px" );*/
    		repositioningElement = false;
    	}
    }, 1000);
    //}, 10000);

    $("#background_color_colorpicker").spectrum({
	    showButtons: false,
	    allowEmpty: true,
	    showPalette: true,
	    showSelectionPalette: true,
	    palette: [ ],
	    localStorageKey: "spectrum.homepage",
	    move: function(color) {
	    	// update selected element color
	    	var hexColorString = color.toHexString();

	    	selectedElementNums.forEach(function(elementNum){
	    		$("[elementId=" + elementNum + "]").css("background-color", hexColorString);
	    	});
	    	//$("[elementId=" + currentlySelectedElement + "]").css("background-color", hexColorString);
	    	dataChanged = true;
	    }
	});

	$("#text_color_colorpicker").spectrum({
	    showButtons: false,
	    allowEmpty: true,
	    showPalette: true,
	    showSelectionPalette: true,
	    palette: [ ],
	    localStorageKey: "spectrum.homepage",
	    move: function(color) {
	    	// update selected element color
	    	var hexColorString = color.toHexString();
	    	
	    	selectedElementNums.forEach(function(elementNum){
	    		$("[elementId=" + elementNum + "]").css("color", hexColorString);
	    	});
	    	//$("[elementId=" + currentlySelectedElement + "]").css("color", hexColorString);
	    	dataChanged = true;
	    }
	});

	$("#slider").slider({
      min: 8,
      max: 96,
      slide: function( event, ui ) {
        //$( "#amount" ).val( ui.value  + "px" );
        //$( "#amount" ).val( Math.round(ui.value)  + "px" );
        $( "#amount" ).html( Math.round(ui.value)  + "px" );

        selectedElementNums.forEach(function(elementNum){
    		$("[elementId=" + elementNum + "]").css("font-size", ui.value  + "px");
    	});

        //$("[elementId=" + currentlySelectedElement + "]").css("font-size", ui.value  + "px");
	    dataChanged = true;
      }
    });

    /*$("#widthSlider").slider({
      min: 1,
      max: 1200,
      slide: function( event, ui ) {
        //$( "#widthAmount" ).val( ui.value  + "px" );
        //$( "#widthAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#widthAmount" ).html( Math.round(ui.value)  + "px" );
        $("[elementId=" + currentlySelectedElement + "]").css("width", ui.value  + "px");
	    dataChanged = true;
      }
    });

    $("#heightSlider").slider({
      min: 1,
      max: 800,
      slide: function( event, ui ) {
        //$( "#heightAmount" ).val( ui.value  + "px" );
        //$( "#heightAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#heightAmount" ).html( Math.round(ui.value)  + "px" );
        $("[elementId=" + currentlySelectedElement + "]").css("height", ui.value  + "px");
	    dataChanged = true;
      }
    });

    $("#leftSlider").slider({
      min: -1200,
      max: 1200,
      slide: function( event, ui ) {
        //$( "#leftAmount" ).val( ui.value  + "px" );
        //$( "#leftAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#leftAmount" ).html( Math.round(ui.value)  + "px" );
        //$("[elementId=" + currentlySelectedElement + "]").css("left", ui.value + "px");
        $("[elementId=" + currentlySelectedElement + "]").css({
        	"left": ui.value + "px",
        	"right": "auto"
        });
	    dataChanged = true;
      }
    });

    $("#rightSlider").slider({
      min: -1200,
      max: 1200,
      slide: function( event, ui ) {
        //$( "#rightAmount" ).val( ui.value  + "px" );
        //$( "#rightAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#rightAmount" ).html( Math.round(ui.value)  + "px" );
        //$("[elementId=" + currentlySelectedElement + "]").css("right", ui.value + "px");
        $("[elementId=" + currentlySelectedElement + "]").css({
        	"left": "auto",
        	"right": ui.value + "px"
        });
	    dataChanged = true;
      }
    });

    $("#topSlider").slider({
      min: -800,
      max: 800,
      slide: function( event, ui ) {
        //$( "#topAmount" ).val( ui.value  + "px" );
        //$( "#topAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#topAmount" ).html( Math.round(ui.value)  + "px" );
        //$("[elementId=" + currentlySelectedElement + "]").css("left", ui.value + "px");
        $("[elementId=" + currentlySelectedElement + "]").css({
        	"top": ui.value + "px",
        	"bottom": "auto"
        });
	    dataChanged = true;
      }
    });

    $("#bottomSlider").slider({
      min: -800,
      max: 800,
      slide: function( event, ui ) {
        //$( "#bottomAmount" ).val( ui.value  + "px" );
        //$( "#bottomAmount" ).val( Math.round(ui.value)  + "px" );
        $( "#bottomAmount" ).html( Math.round(ui.value)  + "px" );
        //$("[elementId=" + currentlySelectedElement + "]").css("right", ui.value + "px");
        $("[elementId=" + currentlySelectedElement + "]").css({
        	"top": "auto",
        	"bottom": ui.value + "px"
        });
	    dataChanged = true;
      }
    });*/

    /*$("#visibilityWidget").on("change", function(event){
    	// Based on the value, update the element's "visibility" property
    	var visibilityWidgetValue = $("#visibilityWidget").val();
    	$("[elementId=" + currentlySelectedElement + "]").css("visibility", visibilityWidgetValue);
    	dataChanged = true;
    });*/

    /*$("body").on("change", "[name='xPosition']", function(event){
    	// switch which widget is visible
    	var selectedRadioButtonValue = $(event.target).val();
    	if(selectedRadioButtonValue === "left"){
    		$(".leftWidgets").show();
    		$(".rightWidgets").hide();
    	}else{ // === "right"
    		$(".leftWidgets").hide();
    		$(".rightWidgets").show();
    	}
    });

    $("body").on("change", "[name='yPosition']", function(event){
    	// switch which widget is visible
    	var selectedRadioButtonValue = $(event.target).val();
    	if(selectedRadioButtonValue === "top"){
    		$(".topWidgets").show();
    		$(".bottomWidgets").hide();
    	}else{ // === "right"
    		$(".topWidgets").hide();
    		$(".bottomWidgets").show();
    	}
    });*/


	// Fill all .propertyRules divs with dropdown menu HTML
	$(".propertyRules").each(function(index, element){
		var propertyToolAncestor = $(this).closest(".propertyTool");
		var behaviorName = propertyToolAncestor.attr("behavior-name");
		var ruleInferenceQuestions = generateRuleInferenceHTML(behaviorName);
		$(this).html(ruleInferenceQuestions);
	});

	/* Some copied/adapted from jquery-ui */
	$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
		_renderItem: function( ul, item ) {
	        var li = $( "<li>" ),
	          wrapper = $( "<div>", { text: item.label } );
	 
	        if ( item.disabled ) {
	          li.addClass( "ui-state-disabled" );
	        }

	        if(item.value === "empty"){
	        	li.hide();
	        }
	 
	        $( "<span>", {
	          style: item.element.attr( "data-style" ),
	          "class": "ui-icon " + item.element.attr( "data-class" )
	        })
	        .appendTo( wrapper );
 
			return li.append( wrapper ).appendTo( ul );
		},
		_renderButtonItem: function( item ) {
			var buttonItem = $( "<span>", {
			/*"class": "ui-selectmenu-text"*/
			});
			//this._setText( buttonItem, item.label );

			//buttonItem.css( "background-color", item.value );
			//.ui-icon.left-closed-right-closed
			//buttonItem.addClass("ui-icon left-closed-right-closed");
			buttonItem.addClass("ui-icon");
			buttonItem.addClass("transition-image");
			//buttonItem.addClass(item.label);
			//buttonItem.addClass(item.value);
			var dropdownClass = item.element[0]["dataset"]["class"];
			//buttonItem.addClass(item.value + "_" + item.side + "Side");
			buttonItem.addClass(dropdownClass);

			return buttonItem;
		}
    });

	$( ".ruleInferenceSelect" )
      .iconselectmenu({
      	change: function( event, ui ) {
      		// Use this as the event handler for updating element attributes, updating transition rules
      		
	    	// Transition rule value
	    	var newTransitionRule = $(this).val();
	    	
	    	var behaviorName = $(this).attr("behavior-name");
	    	var transitionSide = $(this).attr("side");
	    	
	    	// Update widget's "transition" property
	    	//$("[elementId=" + currentlySelectedElement + "]").attr(behaviorName + "-transition", newTransitionRule);
	    	if(newTransitionRule && newTransitionRule !== "empty"){
	    		//$("[elementId=" + currentlySelectedElement + "]").attr(behaviorName + "-transition", newTransitionRule);
	    		
	    		selectedElementNums.forEach(function(elementNum){
	    			$("[elementId=" + elementNum + "]").attr(behaviorName + "-" + transitionSide + "-transition", newTransitionRule);
	    		});

	    		//$("[elementId=" + currentlySelectedElement + "]").attr(behaviorName + "-" + transitionSide + "-transition", newTransitionRule);
	    	}

	    	// Capture data/send to server
	    	dataChanged = true;
      	}
      })
      .iconselectmenu( "menuWidget" )
        .addClass( "ui-menu-icons customicons" );

    /*$( ".ruleInferenceSelect" )
      .iconselectmenu()
      .iconselectmenu( "menuWidget" )
        .addClass( "ui-menu-icons customicons" );*/


    /*var selectMenuObj = $( ".ruleInferenceSelect" )
      .iconselectmenu()
      .iconselectmenu( "menuWidget" );
      selectMenuObj.addClass( "ui-menu-icons customicons" );*/

    //$( "#amount" ).val( $( "#slider" ).slider( "value" ) + "px" );

});

var switchFromKeyframeToFinalWepageMode = function(){
	selectedElementNums = [];
	dataChanged = false;
	currentViewId = null;

	// Perhaps also send updated keyframe view (before this point) to the server, to make sure it's update to date?
	//---------------------

	//makeFontBold($("#viewOnlyMode"), $(".nav-pills a"));
	makeFontBold($("#viewOnlyMode .nav-link"), $(".nav-pills a"));

	// There's no particular view to select though. But we need to update the view to show the "view only" view;
	// elements not editable, but keyframe size is

	$(".pageElement.selected").removeClass("selected");
	$("#toolsMenu").hide();

	// Update buttons
	// Make sure the create new keyframe button is shown
	/*$("#cloneButton").show();
	// Make sure the delete keyframe button is hidden
	$("#deleteButton").hide();*/

	$("#cloneButton").prop('disabled', false);
	$("#deleteButton").prop('disabled', true);

	destroyElementModifiable();
	

	//$(".userPage").resizable();
	
	/*$(".userPage").resizable({
	  handles: "e"
	});*/

	// Let's see if this works
	replaceCSSRules();

	// Clear rules menu
	$("#selectedElementRules").css("display", "none"); // This element may not be used anymore
};

var comparePageWidths = function(a, b) {
  if (a["pageWidth"] < b["pageWidth"]) {
    return -1;
  }
  if (a["pageWidth"] > b["pageWidth"]) {
    return 1;
  }
  // a must be equal to b
  return 0;
};

var extractPixelValue = function(fontSizeString){
	return fontSizeString.substring(0, fontSizeString.length - 2);
};

var selectElement = function(element){
	var selectedElementNum = element.attr("elementId");
	if(ctrlKeyDown){
		// Currently selected elements should remain selected
	}else{
		// Currently selected elements should now be unselected
		$(".pageElement.selected").removeClass("selected");
		selectedElementNums = [];
	}
	selectedElementNums.push(selectedElementNum);

	// Select this element (put box shadow around it)
	element.addClass("selected");

	//updateRightMenuWidgets(element);
	updateRightMenuWidgets(); // Should update right menu based on all the elements in selectedElementNums 

	// Give focus to the element
	//$("[elementId=" + currentlySelectedElement + "]").focus();
	$("[elementId=" + selectedElementNum + "]").focus();
};

var selectMultipleElements = function(){
	// Select all elements in selectedElementNums
	selectedElementNums.forEach(function(elementNum) {
		var element = $("[elementId=" + elementNum + "]");
		element.addClass("selected");
	});
	updateRightMenuWidgets(); // Should update right menu based on all the elements in selectedElementNums

	// We'll give focus to the last element in selectedElementNums
	var element = $("[elementId=" + selectedElementNums[selectedElementNums.length-1] + "]");
	element.focus();
}

/*var updateRightMenuWidgets = function(element){
	// Set colorpicker color to that of selected element
	
	// If the element is an image, hide the color picker; otherwise, show and set it
	if(element.children("img").length > 0){
		$("#backgroundColorRow").hide();
	}else{
		$("#backgroundColorRow").show();
		$("#background_color_colorpicker").spectrum("set", element.css("background-color"));
	}
	
	// Ensure tools menu is shown
	$("#toolsMenu").show();
	// Only show font tools menu if the currently selected element has text
	if(element.text().trim().length > 0){
		$("#fontTools").show();
	}else{
		$("#fontTools").hide();
	}

	// Font size slider
	var fontSize = extractPixelValue(element.css("font-size"));
	$( "#slider" ).slider( "value", fontSize );
	$( "#amount" ).html( Math.round(fontSize)  + "px" );
	
	// Width slider
	var widthAmount = element.width();
	$( "#widthAmount" ).html( Math.round(widthAmount)  + "px" );

	// Height slider
	var heightAmount = element.height();
	$( "#heightAmount" ).html( Math.round(heightAmount)  + "px" );

	var leftAmount = element.offset().left;
	$( "#leftAmount" ).html( Math.round(leftAmount)  + "px" );

	// top, bottom
	var topAmount = element.offset().top;
	$( "#topAmount" ).html( Math.round(topAmount)  + "px" );

	$("#text_color_colorpicker").spectrum("set", element.css("color"));	

	// Maybe this should be done per behavior (so handle left and right in the same callback)
	var selectWidgets = $("select.ruleInferenceSelect");
	selectWidgets.each(function(index, element){
		// Update the <select> value given the transition value embedded in the currently selected element
		var behaviorName = $(this).attr("behavior-name");
		var side = $(this).attr("side");
		var behaviorTransitionValue = $("[elementId=" + currentlySelectedElement + "]").attr(behaviorName + "-" + side + "-transition");
		
		// Now need to set this in the appropriate select widget
		var selectWidgetId =  $(this).attr("id") + "-button";
		var selectWidgetImageElement = $("#" + selectWidgetId + " .transition-image");
		
		if(behaviorTransitionValue){
			$(this).val(behaviorTransitionValue);
			$(this).iconselectmenu("refresh");
		}
	});
};*/

var updateRightMenuWidgets = function(){

	if(selectedElementNums.length > 0){
	
		// Ensure tools menu is shown
		$("#toolsMenu").show();

		// Set colorpicker color to that of selected element
		// Background color
		var backgroundColorValue = undefined;
		var existsAnImage = false;
		selectedElementNums.forEach(function(elementNum){
			var element = $("[elementId=" + elementNum + "]");
			var elementImageChildren = element.children("img");
			if(elementImageChildren.length > 0){
				// If there's an image, there's no background color
				existsAnImage = true;
			}else{
				if(backgroundColorValue === undefined){
					backgroundColorValue = element.css("background-color");
				}else{
					if(backgroundColorValue === false){
						// remain false
					}else{
						var thisElementBackgroundColor = element.css("background-color");
						if(backgroundColorValue === thisElementBackgroundColor){
							// keep backgroundColorValue the same
						}else{
							backgroundColorValue = false;
						}
					}
				}
			}
		});

		if(!existsAnImage){ // Only include background color widget if none of the selected elements are images
			$("#backgroundColorRow").show();
			if(backgroundColorValue !== false){
				// All elements had the same background color, so show that widget
				$("#background_color_colorpicker").spectrum("set", backgroundColorValue);
			}else{
				// Set to empty
				$("#background_color_colorpicker").spectrum("set", "");
			}
		}else{
			$("#backgroundColorRow").hide();
		}

		/*// If the element is an image, hide the color picker; otherwise, show and set it
		if(element.children("img").length > 0){
			$("#backgroundColorRow").hide();
		}else{
			$("#backgroundColorRow").show();
			$("#background_color_colorpicker").spectrum("set", element.css("background-color"));
		}*/



		// Check if all elements have text
		var haveText = true;
		selectedElementNums.forEach(function(elementNum){
			var element = $("[elementId=" + elementNum + "]");
			if(element.text().trim().length == 0){
				haveText = false;
			}
		});

		if(haveText){
			$("#fontTools").show();
		}else{
			$("#fontTools").hide();
		}
		/*// Only show font tools menu if the currently selected element has text
		if(element.text().trim().length > 0){
			$("#fontTools").show();
		}else{
			$("#fontTools").hide();
		}*/


		if(haveText){
			var fontSize = undefined;
			selectedElementNums.forEach(function(elementNum){
				if(fontSize != false){
					var element = $("[elementId=" + elementNum + "]");
					if(fontSize === undefined){
						fontSize = extractPixelValue(element.css("font-size"));
					}else{
						var thisElementFontSize = extractPixelValue(element.css("font-size"));
						if(fontSize == thisElementFontSize){
							// Nothing
						}else{
							fontSize = false;
						}
					}
				}
			});
			if(fontSize){
				$( "#slider" ).slider( "value", fontSize );
				$( "#amount" ).html( Math.round(fontSize)  + "px" );
			}else{
				$("#fontTools").hide();
			}



			var fontColor = undefined;
			selectedElementNums.forEach(function(elementNum){
				if(fontColor != false){
					var element = $("[elementId=" + elementNum + "]");
					if(fontColor === undefined){
						fontColor = element.css("color");
					}else{
						var thisElementFontColor = element.css("color");
						if(fontColor == thisElementFontColor){
							// Nothing
						}else{
							fontColor = false;
						}
					}
				}
			});
			if(fontColor){
				$("#text_color_colorpicker").spectrum("set", fontColor);
			}else{
				// Set to empty
				$("#text_color_colorpicker").spectrum("set", "");
			}

		}

		/*// Font size slider
		var fontSize = extractPixelValue(element.css("font-size"));
		$( "#slider" ).slider( "value", fontSize );
		$( "#amount" ).html( Math.round(fontSize)  + "px" );*/
		
		//$("#text_color_colorpicker").spectrum("set", element.css("color"));	

		// Width slider
		var widthAmount = undefined;
		selectedElementNums.forEach(function(elementNum){
			if(widthAmount != false){
				var element = $("[elementId=" + elementNum + "]");
				if(widthAmount === undefined){
					widthAmount = element.width();
				}else{
					var thisElementWidth = element.width();
					if(widthAmount != thisElementWidth){
						widthAmount = false
					}
				}
			}
		});
		if(widthAmount){
			$( "#widthAmount" ).html( Math.round(widthAmount)  + "px" );
		}else{
			$( "#widthAmount" ).html(" ");
		}
		/*var widthAmount = element.width();
		$( "#widthAmount" ).html( Math.round(widthAmount)  + "px" );*/


		// Height slider
		var heightAmount = undefined;
		selectedElementNums.forEach(function(elementNum){
			if(heightAmount != false){
				var element = $("[elementId=" + elementNum + "]");
				if(heightAmount === undefined){
					heightAmount = element.height();
				}else{
					var thisElementHeight = element.width();
					if(heightAmount != thisElementHeight){
						heightAmount = false
					}
				}
			}
		});
		if(heightAmount){
			$( "#heightAmount" ).html( Math.round(heightAmount)  + "px" );
		}else{
			$( "#heightAmount" ).html(" ");
		}
		/*var heightAmount = element.height();
		$( "#heightAmount" ).html( Math.round(heightAmount)  + "px" );*/


		// Left
		var leftAmount = undefined;
		selectedElementNums.forEach(function(elementNum){
			if(leftAmount != false){
				var element = $("[elementId=" + elementNum + "]");
				if(leftAmount === undefined){
					leftAmount = element.offset().left;
				}else{
					var thisElementLeft = element.offset().left;
					if(leftAmount != thisElementLeft){
						leftAmount = false
					}
				}
			}
		});
		if(leftAmount){
			$( "#leftAmount" ).html( Math.round(leftAmount)  + "px" );
		}else{
			$( "#leftAmount" ).html(" ");
		}

		/*var leftAmount = element.offset().left;
		$( "#leftAmount" ).html( Math.round(leftAmount)  + "px" );*/

		// top, bottom
		var topAmount = undefined;
		selectedElementNums.forEach(function(elementNum){
			if(topAmount != false){
				var element = $("[elementId=" + elementNum + "]");
				if(topAmount === undefined){
					topAmount = element.offset().top;
				}else{
					var thisElementTop = element.offset().top;
					if(topAmount != thisElementTop){
						topAmount = false
					}
				}
			}
		});
		if(topAmount){
			$( "#topAmount" ).html( Math.round(topAmount)  + "px" );
		}else{
			$( "#topAmount" ).html(" ");
		}
		/*var topAmount = element.offset().top;
		$( "#topAmount" ).html( Math.round(topAmount)  + "px" );*/

		// Update transition widgets based on the values for all selected elements
			// Do we need to add an "empty" option? (for when not all the same)
		// Maybe this should be done per behavior (so handle left and right in the same callback)
		var selectWidgets = $("select.ruleInferenceSelect");
		selectWidgets.each(function(index, element){
			// Update the <select> value given the transition value embedded in the currently selected element
			var behaviorName = $(this).attr("behavior-name");
			var side = $(this).attr("side");
			
			var behaviorTransitionValue = undefined;
			selectedElementNums.forEach(function(elementNum){
				var element = $("[elementId=" + elementNum + "]");
				if(behaviorTransitionValue === undefined){
					behaviorTransitionValue = element.attr(behaviorName + "-" + side + "-transition");
				}else{
					var thisElementBehaviorTransitionValue = element.attr(behaviorName + "-" + side + "-transition");
					if(behaviorTransitionValue != thisElementBehaviorTransitionValue){
						behaviorTransitionValue = false;
					}
				}

			});
			//var behaviorTransitionValue = $("[elementId=" + currentlySelectedElement + "]").attr(behaviorName + "-" + side + "-transition");
			
			// Now need to set this in the appropriate select widget
			var selectWidgetId =  $(this).attr("id") + "-button";
			var selectWidgetImageElement = $("#" + selectWidgetId + " .transition-image");
			
			if(behaviorTransitionValue){
				$(this).val(behaviorTransitionValue);
				$(this).iconselectmenu("refresh");
			}else{
				// Set to empty?
				$(this).val("empty");
				$(this).iconselectmenu("refresh");
			}
		});
	}else{
		$("#toolsMenu").hide();
	}
};

var updatePageDimensionsLabel = function(){
	var element = $(".userPage");
	var dimensions = "width: " + element.css("width") + ", height: " + element.css("height");
    $("#" + pageDimensionsInfoId).text(dimensions);
};

/*var captureTransitionRule = function(){

};*/

// Capture element width/height/x/y data
var captureElementData = function(){
	var uiElements = $(".pageElement");
	var uiElementsData = [];
	for(var i = 0; i < uiElements.length; i++){
		var uiElementId = uiElements[i].id;
		var jqueryUIElement = $("#" + uiElementId);
		var elementId = parseInt(jqueryUIElement.attr("elementId"));
		
		//var elementColor = jqueryUIElement.css("background-color");
		var elementText = jqueryUIElement.text();
		//var imageSource = jqueryUIElement.css("background-image");

		/*var uiElementData = {
			"id": elementId,
			"text": elementText,
			"image": imageSource
		};*/

		var uiElementData = {
			"id": elementId,
			"text": elementText
		};

		var imageChildren = jqueryUIElement.children("img");
		if(imageChildren.length > 0){
			var imageSource = imageChildren.attr("src");
			uiElementData["image"] = imageSource;
			uiElementData["image-ratio"] = imageChildren.attr("image-ratio");
		}

		var elementPropertyKeyValues = Object.entries(elementDataFormat);
		for(var propertyIndex = 0; propertyIndex < elementPropertyKeyValues.length; propertyIndex++){
			var propertyKeyAndValue = elementPropertyKeyValues[propertyIndex];
			var behaviorName = propertyKeyAndValue[0];
			var propertyDataList = propertyKeyAndValue[1];
			
			var propertyOptions = [];

			uiElementData[behaviorName] = {};

			for(var optionIndex = 0; optionIndex < propertyDataList.length; optionIndex++){
				var optionData = propertyDataList[optionIndex];
				var propertyName = optionData["property"];
				var propertyValue = (optionData["get"]).call(jqueryUIElement);
				//uiElementData[behaviorName][propertyName] = propertyValue;

				// Perhaps a hack: don't set property value if it's undefined, null, or empty string ""
				if(propertyValue !== "" && propertyValue !== null && propertyValue !== undefined){
					uiElementData[behaviorName][propertyName] = propertyValue;
				}
			}
			// Capture transition property
			/*var transitionValue = jqueryUIElement.attr(behaviorName + "-transition");
			if(transitionValue && transitionValue !== "empty"){
				uiElementData[behaviorName]["transition"] = transitionValue;
			}*/
			var leftTransitionValue = jqueryUIElement.attr(behaviorName + "-left-transition");
			if(leftTransitionValue && leftTransitionValue !== "empty"){
				uiElementData[behaviorName]["left-transition"] = leftTransitionValue;
			}
			var rightTransitionValue = jqueryUIElement.attr(behaviorName + "-right-transition");
			if(rightTransitionValue && rightTransitionValue !== "empty"){
				uiElementData[behaviorName]["right-transition"] = rightTransitionValue;
			}
		}

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
	/*elementsNotToBeBold.css("font-weight", "normal");
	elementToBeBold.css("font-weight", "bold");*/
	elementsNotToBeBold.removeClass("active");
	elementToBeBold.addClass("active");
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
    	//allElementRules = data["elementRules"];

    	currentViewId = viewId;

    	renderView(data["view"]);

    	replaceCSSRules();

    	/*if(currentlySelectedElement){
	    	selectElement($("[elementId=" + currentlySelectedElement + "]"));
	    }*/
	    if(selectedElementNums.length > 0){
	    	selectMultipleElements();
	    }

    	// Commenting this out, since initially a keyframe is shown, and the page size should not be resizable
		//$(".userPage").resizable();
    	
    	/*// Now select what was currentlySelectedElement before
    	$("[elementId=" + currentlySelectedElement + "]").addClass("selected");*/

    	// Update buttons
    	// Make sure the delete keyframe button is shown
    	/*$("#deleteButton").show();
    	// Make sure the create new keyframe button is hidden
    	$("#cloneButton").hide();*/
    	$("#cloneButton").prop('disabled', true);
    	$("#deleteButton").prop('disabled', false);
    });
};

//var addViewMenuItem = function(viewId){
/*var addViewMenuItem = function(viewObj){
	var viewportWidth = viewObj["pageWidth"];
	var viewportHeight = viewObj["pageHeight"];
	var viewId = viewObj["id"];
	var newViewIdString = "view" + viewId;

	//var newViewText = "width: " + viewportWidth + "px; " + "height: " + viewportHeight + "px";
	var newViewContent = '<span>' + "width: " + viewportWidth + "px" + '</span>' + '<span>' + "height: " + viewportHeight + "px" + '</span>'

	//var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewText + '</a></span>');
	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewContent + '</a></span>');
	$("#viewsMenu").append(newViewObject);
};*/

// Instead maybe should have rows + cols?
// Maybe instead (or in addition) should we recreate view menu?
var addViewMenuItem = function(viewObj){
	var viewportWidth = viewObj["pageWidth"];
	var viewportHeight = viewObj["pageHeight"];
	var viewId = viewObj["id"];
	var newViewIdString = "view" + viewId;

	//var newViewText = "width: " + viewportWidth + "px; " + "height: " + viewportHeight + "px";
	//var newViewContent = '<span>' + "width: " + viewportWidth + "px" + '</span>' + '<span>' + "height: " + viewportHeight + "px" + '</span>';
	/*var widthRow = '<div class="row">' + "width: " + viewportWidth + "px" + '</div>';
	var heightRow = '<div class="row">' + "height: " + viewportHeight + "px" + '</div>';
	var newViewContent = '<div class="col">' + widthRow + heightRow +  '</div>';*/

	//var newViewContent = "width: " + viewportWidth + "px; height: " + viewportHeight + "px";
	var newViewContent = "width: " + viewportWidth + "px <br> height: " + viewportHeight + "px";

	//var newViewObject = $('<li class="nav-item">' + '<a class="nav-link" href="#">' + newViewContent + '</a>' + '</li>');
	var newViewObject = $('<li class="clone nav-item" id="' + newViewIdString + '" viewId=' + viewId + '>' + '<a class="nav-link" href="#">' + newViewContent + '</a>' + '</li>');

	//var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewText + '</a></span>');
	//var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewContent + '</a></span>');

	$("#viewsNavMenu").append(newViewObject);
};

var updateViewsMenu = function(views, activeViewId){
	// First empty 
	$("#viewsNavMenu").empty();

	// Show menu of views at the bottom
	views.sort(comparePageWidths);
	views.forEach(function(view){
		addViewMenuItem(view);
	});
	makeFontBold($("#view" + activeViewId + " a"), $(".clone a"));
};

/*<div class="container">
  <div class="row">
    <div class="col">Column</div>
    <div class="col">Column</div>
    <div class="w-100"></div>
    <div class="col">Column</div>
    <div class="col">Column</div>
  </div>
</div>*/

var removeViewMenuItem = function(viewId){
	$("[viewId=" + viewId + "]").remove();
};

var renderView = function(viewData){
	
	// When a particular keyframe is shown, the page size should not be resizable
	//$(".userPage").resizable("destroy");
	
	// We're now keeping userPage resizable all the time. Resizing it just doesn't affect particular keyframe dimensions
	/*if($(".userPage").hasClass("ui-resizable")){
		$(".userPage").resizable("destroy");
	}*/

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
	
	//$(".pageElement").resizable();
	// pageElements that contain an image should get aspectRatio: true
	/*$(".pageElement").has("img").resizable({aspectRatio: true});
	$(".pageElement").not(":has(img)").resizable();*/

	$(".pageElement").has("img").resizable({aspectRatio: true, handles: "n, e, s, w, ne, se, sw, nw"});
	$(".pageElement").not(":has(img)").resizable({handles: "n, e, s, w, ne, se, sw, nw"});

    /*if(currentlySelectedElement){
    	selectElement($("[elementId=" + currentlySelectedElement + "]"));
    }*/
    if(selectedElementNums.length > 0){
    	selectMultipleElements();
    }

    // Determine if we need to disable/enable left-transition and right-transition selectmenus
    // If leftmost keyframe, should disable left-transition selectmenus
    var leftmostKeyframeId = $(".clone").first().attr("viewid");
    if(currentViewId == leftmostKeyframeId){
    	// Disable left-transition selectmenus
    	$("select.ruleInferenceSelect[side='left']").iconselectmenu("disable");
    }else{
    	// Enable left-transition selectmenus
    	$("select.ruleInferenceSelect[side='left']").iconselectmenu("enable");
    }

    // If righmost keyframe, should disable right-transition selectmenus
    var rightmostKeyframeId = $(".clone").last().attr("viewid");
    if(currentViewId == rightmostKeyframeId){
    	// Disable right-transition selectmenus
    	$("select.ruleInferenceSelect[side='right']").iconselectmenu("disable");
    }else{
    	// Enable right-transition selectmenus
    	$("select.ruleInferenceSelect[side='right']").iconselectmenu("enable");
    }

};

var destroyElementModifiable = function(){
	$(".pageElement").draggable("destroy");
	$(".pageElement").resizable("destroy");
};

var createDOMElement = function(elementData){
	var element = $("<div></div>").attr("id", "element" + elementData["id"]);
	element.attr("elementId", elementData["id"]);
	//element.css("background-color", elementData["background-color"]["background-color"]);
	element.text(elementData["text"]);
	//element.css("background-image", elementData["image"]);
	//element.css("background-repeat", "no-repeat");
	if(elementData["image"] !== undefined && elementData["image"] !== "none"){
		var imageElement = $("<img>").attr("src", elementData["image"]);
		imageElement.width("100%");
		imageElement.height("100%");
		imageElement.attr("image-ratio", elementData["image-ratio"]);
		element.append(imageElement);
	}
	element.addClass("pageElement");
	element.addClass("modifiable");
	element.attr("tabindex", elementData["id"]);

	// for each key in elementData that has an object value, set an attribute on the DOM element
	var behaviorNames = Object.keys(elementDataFormat);
	for(var i = 0; i < behaviorNames.length; i++){
		var behaviorName = behaviorNames[i];
		var elementDataObject = elementData[behaviorName];
		if(elementDataObject){
			/*var transitionValue = elementDataObject["transition"];
			var elementBehaviorTransitionAttr = behaviorName + "-transition";
			element.attr(elementBehaviorTransitionAttr, transitionValue);*/

			var leftTransitionValue = elementDataObject["left-transition"];
			var elementBehaviorLeftTransitionAttr = behaviorName + "-left-transition";
			element.attr(elementBehaviorLeftTransitionAttr, leftTransitionValue);

			var rightTransitionValue = elementDataObject["right-transition"];
			var elementBehaviorRightTransitionAttr = behaviorName + "-right-transition";
			element.attr(elementBehaviorRightTransitionAttr, rightTransitionValue);
		}/*else{
			var elementBehaviorTransitionAttr = behaviorName + "-transition";
			element.attr(elementBehaviorTransitionAttr, "empty");
		}*/
	}

	return element;
};

var replaceCSSRules = function(){
	$("#" + elementCSSRules).empty();
	var cssRulesString = "";

	//console.log(cssRules);

	for(var i = 0; i < cssRules.length; i++){

		var ruleObject = cssRules[i];
		// Using cssRules, need to choose the rule that is correct for each object in the list, and then add it to cssRulesString
		/*var relevantCSSRule = returnRelevantCSSRule(ruleObject);
		cssRulesString += relevantCSSRule;*/
		var cssString = generateCSSString(ruleObject);
		cssRulesString += cssString;
		//cssRulesString += cssRules[i];
	}
	$("#" + elementCSSRules).append("<style>" + cssRulesString + "</style>");
};

var createDiscreteSingleAttributeCSSString = function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
	//var computedValue = ruleObject["value"];
	var computedValue = ruleObject["valueData"]["value"];
	// Construct CSS rule string
	var singleRule = "#element" + elementId + "{";
	//singleRule += createPropertyValueString(propertyName, computedValue);
	singleRule += "" + propertyName + ": " + computedValue + ";";
	singleRule += "}";

	return singleRule;
}

//var createSingleAttributeCSSString = function(ruleObject, dimensionValue, elementId, propertyName){
// imageRatio will be null if the element is not an image
var createSingleAttributeCSSString = function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
	var valueData = ruleObject["valueData"];
	var m = valueData["m"];
	var b = valueData["b"];
	/*var m = ruleObject["m"];
	var b = ruleObject["b"];*/
	var computedValue = m * dimensionValue + b;

	if(propertyName === "font-size"){
		// Putting a min on the font-size
		if(computedValue < 8){
			computedValue = 8;
		}
	}

	// Construct CSS rule string
	var singleRule = "#element" + elementId + "{";
	//singleRule += createPropertyValueString(propertyName, computedValue);
	singleRule += "" + propertyName + ": " + computedValue + "px;";
	singleRule += "}";
	
	// Is this needed? Is explicitly setting the "height" needed?
	if(imageRatio != null && propertyName === "width"){
		// Set the height that corresponds to the width we just set
		var heightValue = 1.0*computedValue / imageRatio;
		singleRule += "#element" + elementId + "{";
		singleRule += "height: " + heightValue + "px;";
		singleRule += "}";
	}

	return singleRule;
}

var createRGBCSSString = function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
	var valueData = ruleObject["valueData"];
	/*var rData = ruleObject["r"];
	var gData = ruleObject["g"];
	var bData = ruleObject["b"];*/
	var rData = valueData["r"];
	var gData = valueData["g"];
	var bData = valueData["b"];

	var rComputedValue = postProcessRGBValue(rData["m"] * dimensionValue + rData["b"]);
	var gComputedValue = postProcessRGBValue(gData["m"] * dimensionValue + gData["b"]);
	var bComputedValue = postProcessRGBValue(bData["m"] * dimensionValue + bData["b"]);
	


	var rgbString = "rgb(" + rComputedValue + ", " + gComputedValue + ", " + bComputedValue + ")";

	var rgbRule = "#element" + elementId + "{";
	//rgbRule += createPropertyValueString(propertyName, rgbString);
	rgbRule += "" + propertyName + ": " + rgbString + ";";
	rgbRule += "}";
	return rgbRule;
}

var postProcessRGBValue = function(value){
	// Make an int, bound to [0, 255]
	return Math.min(Math.max(Math.round(value), 0), 255);
};

/*var generateCSSString = function(ruleObject){
	var dimValue = getUserPageDimValue(ruleObject["pageDim"]);
	var cssRulesList = ruleObject["cssRulesList"];
	var behaviorName = ruleObject["behaviorName"];
	var propertyName = ruleObject["propertyName"];
	var pageDim = ruleObject["pageDim"];
	var elementId = ruleObject["elementId"];
	var imageRatio = ruleObject["image-ratio"];

	// This is an image, and the propertyName is "height"; height will be set using imageRatio when the width is set
	if(imageRatio != null && propertyName === "height"){
		return "";
	}

	for(var mediaQueryIndex = 0; mediaQueryIndex < cssRulesList.length; mediaQueryIndex++){
		var ruleOption = cssRulesList[mediaQueryIndex];
		var ruleStart = null;
		var ruleEnd = null;
		
		if(mediaQueryIndex > 0){
			ruleStart = ruleOption["start"];
		}
		if(mediaQueryIndex < cssRulesList.length-1){
			ruleEnd = ruleOption["end"];
		}

		var isRelevantRule = false;

		if(ruleStart === null && ruleEnd === null){
			isRelevantRule = true;
		}else if(ruleStart === null){
			// Check ruleEnd
			if(dimValue <= ruleEnd){
				isRelevantRule = true;
			}
		}else if(ruleEnd === null){
			// Check ruleStart
			if(dimValue >= ruleStart){
				isRelevantRule = true;
			}
		}else{
			// Check both ruleStart and ruleEnd
			if(dimValue >= ruleStart && dimValue <= ruleEnd){
				isRelevantRule = true;
			}
		}
		if(isRelevantRule){
			var cssStringFunction = propertyToCSSStringFunction[propertyName];
			var cssString = cssStringFunction(ruleOption, dimValue, elementId, propertyName, imageRatio);
			return cssString;
		}
	}
}*/

var generateCSSString = function(ruleObject){
	var dimValue = getUserPageDimValue(ruleObject["pageDim"]);
	var cssRulesList = ruleObject["cssRulesList"];
	var behaviorName = ruleObject["behaviorName"];
	var propertyName = ruleObject["propertyName"];
	var pageDim = ruleObject["pageDim"];
	var elementId = ruleObject["elementId"];
	var imageRatio = ruleObject["image-ratio"];

	// This is an image, and the propertyName is "height"; height will be set using imageRatio when the width is set
	if(imageRatio != null && propertyName === "height"){
		return "";
	}

	for(var mediaQueryIndex = 0; mediaQueryIndex < cssRulesList.length; mediaQueryIndex++){
		var ruleOption = cssRulesList[mediaQueryIndex];
		var ruleStart = null;
		var ruleEnd = null;
		
		if(mediaQueryIndex > 0){
			ruleStart = ruleOption["start"];
		}
		if(mediaQueryIndex < cssRulesList.length-1){
			ruleEnd = ruleOption["end"];
		}

		var containsStart = ruleOption["containsStart"];
		var containsEnd = ruleOption["containsEnd"];

		var isRelevantRule = false;

		if(ruleStart === null && ruleEnd === null){
			isRelevantRule = true;
		}else if(ruleStart === null){
			// Check ruleEnd
			/*if(dimValue <= ruleEnd){
				isRelevantRule = true;
			}*/
			if((containsEnd && dimValue <= ruleEnd) || (!containsEnd && dimValue < ruleEnd)){
				isRelevantRule = true;
			}
		}else if(ruleEnd === null){
			// Check ruleStart
			/*if(dimValue >= ruleStart){
				isRelevantRule = true;
			}*/
			if((containsStart && dimValue >= ruleStart) || (!containsStart && dimValue > ruleStart)){
				isRelevantRule = true;
			}
		}else{
			// Check both ruleStart and ruleEnd
			/*if(dimValue >= ruleStart && dimValue <= ruleEnd){
				isRelevantRule = true;
			}*/
			if(((containsStart && dimValue >= ruleStart) || (!containsStart && dimValue > ruleStart)) && ((containsEnd && dimValue <= ruleEnd) || (!containsEnd && dimValue < ruleEnd))){
				isRelevantRule = true;
			}
		}
		if(isRelevantRule){
			var cssStringFunction = propertyToCSSStringFunction[propertyName];
			//function(ruleObject, elementId, propertyName, dimensionValue, imageRatio){
			//var cssString = cssStringFunction(ruleOption, dimValue, elementId, propertyName, imageRatio);
			var cssString = cssStringFunction(ruleOption, elementId, propertyName, dimValue, imageRatio);
			return cssString;
		}
	}
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + "px;";
}