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
	"font-size" : [
		{
			"property": "font-size",
			"get": function(){
				return extractPixelValue(this.css("font-size"));
			}
		}
	]
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
    	allElementRules = data["elementRules"];
    	cssRules = data["cssRules"];
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
	    	makeFontBold($("#view" + nextKeyframeToShowId + " a"), $(".clone a"));

	    	cssRules = data["cssRules"];
	    	replaceCSSRules();
	    	
	    	//allElementRules = data["elementRules"];
	    	currentViewId = nextViewToShow["id"];
	    	renderView(nextViewToShow);
	    	$(".userPage").resizable();
	    	// Now select what was currentlySelectedElement before
	    	$("[elementId=" + currentlySelectedElement + "]").addClass("selected");    	
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
    	$("#toolsMenu").hide();
    	if($(event.target).hasClass("pageElement")){
	    	selectElement($(event.target));
    	}else{
    		currentlySelectedElement = undefined;
    		// Clear rules menu
    		$("#selectedElementRules").css("display", "none");
    	}
    });

    $("body").on("resize", ".userPage", function(event, ui){
    	replaceCSSRules();
    });

    $("body").on("resizestop dragstop", ".modifiable", function(event, ui){
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


    /*
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
    */


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
		    	replaceCSSRules();
		    });
    	}
    }, 1000);
    //}, 10000);

    $("#colorpicker").spectrum({
	    showButtons: false,
	    allowEmpty: true,
	    move: function(color) {
	    	// update selected element color
	    	var hexColorString = color.toHexString();
	    	$("[elementId=" + currentlySelectedElement + "]").css("background-color", hexColorString);
	    	dataChanged = true;
	    }
	});

	$( "#slider" ).slider({
      min: 8,
      max: 96,
      slide: function( event, ui ) {
        $( "#amount" ).val( ui.value  + "px" );
        $("[elementId=" + currentlySelectedElement + "]").css("font-size", ui.value  + "px");
	    dataChanged = true;
      }
    });
    //$( "#amount" ).val( $( "#slider" ).slider( "value" ) + "px" );
});

var extractPixelValue = function(fontSizeString){
	return fontSizeString.substring(0, fontSizeString.length - 2);
};

var selectElement = function(element){
	// Select this element (put box shadow around it)
	element.addClass("selected");

	var selectedElementNum = element.attr("elementId");
	currentlySelectedElement = selectedElementNum;

	// Set colorpicker color to that of selected element
	$("#colorpicker").spectrum("set", element.css("background-color"));
	
	// Ensure tools menu is shown
	$("#toolsMenu").show();
	// Only show font tools menu if the currently selected element has text
	if(element.text().trim().length > 0){
		$("#fontTools").show();
	}else{
		$("#fontTools").hide();
	}

	var fontSize = extractPixelValue(element.css("font-size"));
	$( "#slider" ).slider( "value", fontSize );
	$( "#amount" ).val( fontSize  + "px" );

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
		var elementText = jqueryUIElement.text();
		var uiElementData = {
			"id": elementId,
			"background-color": {
				"background-color": elementColor
			},
			"text": elementText
		};

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
				//var propertyObj = {};
				uiElementData[behaviorName][propertyName] = propertyValue;
				//propertyObj[propertyName] = propertyValue;
				//uiElementData[behaviorName] = propertyObj;
				//propertyOptions.push(propertyObj);
			}

			//uiElementData[behaviorName] = propertyOptions;
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

    	replaceCSSRules();

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

var removeViewMenuItem = function(viewId){
	$("[viewId=" + viewId + "]").remove();
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
	element.css("background-color", elementData["background-color"]["background-color"]);
	element.text(elementData["text"]);
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

		var ruleObject = cssRules[i];
		// Using cssRules, need to choose the rule that is correct for each object in the list, and then add it to cssRulesString
		/*var relevantCSSRule = returnRelevantCSSRule(ruleObject);
		console.log(relevantCSSRule);
		cssRulesString += relevantCSSRule;*/
		var cssString = generateCSSString(ruleObject);
		console.log(cssString);
		cssRulesString += cssString;
		//cssRulesString += cssRules[i];
	}
	$("#" + elementCSSRules).append("<style>" + cssRulesString + "</style>");
};

var generateCSSString = function(ruleObject){
	
	/*var cssRulesObj = {
		"cssRulesList": chosenElementPropertyPattern,
		"behaviorName": behaviorName,
		"propertyName": chosenPropertyName,
		"pageDim": pageDim,
		"elementId": elementId
	}*/

	var dimValue = getUserPageDimValue(ruleObject["pageDim"]);
	console.log(dimValue);
	var cssRulesList = ruleObject["cssRulesList"];
	var behaviorName = ruleObject["behaviorName"];
	var propertyName = ruleObject["propertyName"];
	var pageDim = ruleObject["pageDim"];
	var elementId = ruleObject["elementId"];
	console.log(ruleObject);
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

		var m = ruleOption["m"];
		var b = ruleOption["b"];

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
			var computedValue = m * dimValue + b;

			// Construct CSS rule string
			var singleRule = "#element" + elementId + "{";
			singleRule += createPropertyValueString(propertyName, computedValue);
			singleRule += "}";
			console.log(singleRule);
			return singleRule;
		}
	}

	// generate hard-coded value for this ruleObject
	// e.g., #element0 { width: 100px }

	// Get current .userPage width/height
	/*var dimValue = getUserPageDimValue(ruleObject["pageDim"]);

	// Determine which rule the .userPage width/height falls into
	var ruleList = ruleObject["cssRulesList"];
	for(var i = 0; i < ruleList.length; i++){
		var ruleOption = ruleList[i];
		var ruleStart = ruleOption["start"];
		var ruleEnd = ruleOption["end"];

		if(ruleStart === null && ruleEnd === null){
			return ruleOption["cssRuleString"];
		}else if(ruleStart === null){
			// Check ruleEnd
			if(dimValue <= ruleEnd){
				return ruleOption["cssRuleString"];
			}
		}else if(ruleEnd === null){
			// Check ruleStart
			if(dimValue >= ruleStart){
				return ruleOption["cssRuleString"];
			}
		}else{
			// Check both ruleStart and ruleEnd
			if(dimValue >= ruleStart && dimValue <= ruleEnd){
				return ruleOption["cssRuleString"];
			}
		}
	}*/
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + "px;";
}

/*var returnRelevantCSSRule = function(ruleObject){
	// Get current .userPage width/height
	var dimValue = getUserPageDimValue(ruleObject["pageDim"]);

	// Determine which rule the .userPage width/height falls into
	var ruleList = ruleObject["cssRulesList"];
	for(var i = 0; i < ruleList.length; i++){
		var ruleOption = ruleList[i];
		var ruleStart = ruleOption["start"];
		var ruleEnd = ruleOption["end"];

		if(ruleStart === null && ruleEnd === null){
			return ruleOption["cssRuleString"];
		}else if(ruleStart === null){
			// Check ruleEnd
			if(dimValue <= ruleEnd){
				return ruleOption["cssRuleString"];
			}
		}else if(ruleEnd === null){
			// Check ruleStart
			if(dimValue >= ruleStart){
				return ruleOption["cssRuleString"];
			}
		}else{
			// Check both ruleStart and ruleEnd
			if(dimValue >= ruleStart && dimValue <= ruleEnd){
				return ruleOption["cssRuleString"];
			}
		}
	}
}*/