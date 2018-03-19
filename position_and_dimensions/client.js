var currentViewId = 0;
var dataChanged = false;
var elementPositionInfoId = "elementPositionInfo";
var elementDimensionsInfoId = "elementDimensionsInfo";
var pageDimensionsInfoId = "pageDimensionsInfo";
//var allElementRules;
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
				var computedColor = this.css("color");
				console.log(computedColor);
				if(computedColor !== "rgba(0, 0, 0, 0)"){
					return computedColor;
				}else{
					return "";
				}
			}
		}
	]
};

var generateRuleInferenceHTML = function(widgetName){
	//var ruleInferenceSelectWidgetHTML = generateRuleInferenceDirectionHTML(widgetName, "Left") + generateRuleInferenceDirectionHTML(widgetName, "Right");
	//var ruleInferenceSelectWidgetHTML = generateRuleInferenceDirectionHTML(widgetName, "Left");
	var ruleInferenceSelectWidgetHTML = generateRuleInferenceDirectionHTML(widgetName);
	return ruleInferenceSelectWidgetHTML;
};

//var generateRuleInferenceDirectionHTML = function(widgetName, direction){
var generateRuleInferenceDirectionHTML = function(widgetName){
	/*var optionLinearInterp = '<option value="1" selected>Linear interpolation</option>';
	var optionPrevRule = '<option value="2">Previous rule</option>';
	var optionConstantValue = '<option value="3">Constant value</option>';*/

	//var transitionOptions = ["linearInterpolation", "prevKeyframeRule", "nextKeyframeRule", "prevKeyframeConstantValue", "currentKeyframeConstantValue"];
	var optionLinearInterp = '<option value="linearInterpolation" selected>Linear interpolation</option>';
	var optionPrevKeyframeRule = '<option value="prevKeyframeRule">Previous keyframe rule</option>';
	var optionNextKeyframeRule = '<option value="nextKeyframeRule">Next keyframe rule</option>';
	var optionPrevKeyframeConstantValue = '<option value="prevKeyframeConstantValue">Previous keyframe constant value</option>';
	var optionCurrentKeyframeConstantValue = '<option value="currentKeyframeConstantValue">Current keyframe constant value</option>';

	//var selectWidgetId = widgetName + "_select_" + direction;
	//var selectWidgetId = widgetName + "_select";
	//var ruleInferenceSelectWidgetHTML = '<select class="ruleInferenceSelect">' + optionLinearInterp + optionPrevRule + optionConstantValue + '</select>';
	//var selectHTML = '<select class="ruleInferenceSelect" id=' + selectWidgetId +' >' + optionLinearInterp + optionPrevRule + optionConstantValue + '</select>';
	
	//var selectHTML = '<select class="ruleInferenceSelect" id=' + selectWidgetId +' >' + optionLinearInterp + optionPrevKeyframeRule + optionNextKeyframeRule + optionPrevKeyframeConstantValue + optionCurrentKeyframeConstantValue + '</select>';
	var selectHTML = '<select class="ruleInferenceSelect" transition=' + selectWidgetId +' >' + optionLinearInterp + optionPrevKeyframeRule + optionNextKeyframeRule + optionPrevKeyframeConstantValue + optionCurrentKeyframeConstantValue + '</select>';

	//var labelHTML = '<label for="' + selectWidgetId + '">' + direction + ':&nbsp;</label>';
	//var ruleInferenceDirectionSelectWidgetHTML = labelHTML + selectHTML;
	var ruleInferenceDirectionSelectWidgetHTML = selectHTML;
	return ruleInferenceDirectionSelectWidgetHTML;
}

var propertyToCSSStringFunction = {
	width: function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"height": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"left": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"right": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"top": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"bottom": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"font-size": function(ruleObject, dimensionValue, elementId, propertyName){
		return createSingleAttributeCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"background-color": function(ruleObject, dimensionValue, elementId, propertyName){
		return createRGBCSSString(ruleObject, dimensionValue, elementId, propertyName);
	},
	"color": function(ruleObject, dimensionValue, elementId, propertyName){
		return createRGBCSSString(ruleObject, dimensionValue, elementId, propertyName);
	}
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

	    	//allElementRules = data["elementRules"];

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
    	/*if($(event.target).hasClass("pageElement")){
	    	selectElement($(event.target));
    	}else{
    		currentlySelectedElement = undefined;
    		// Clear rules menu
    		$("#selectedElementRules").css("display", "none");
    	}*/
    	if($(event.target).hasClass("pageElement")){
	    	selectElement($(event.target));
    	}else if($(event.target).parent(".pageElement").length > 0){
    		// This means the user has clicked on an <img> element. We should select its parent
    		selectElement($(event.target).parent(".pageElement"));
    	}else{
    		currentlySelectedElement = undefined;
    		// Clear rules menu
    		$("#selectedElementRules").css("display", "none");
    	}
    });

    $("body").on("resize", ".userPage", function(event, ui){
    	replaceCSSRules();
    });

    // Should this only be on non-.userPage elements?
    /*$("body").on("resizestop dragstop", ".modifiable", function(event, ui){
    	dataChanged = true;
    });*/
    $("body").on("resizestop dragstop", ".pageElement", function(event, ui){
    	dataChanged = true;
    });

    $("body").on("keydown", ".pageElement", function(event){
    	// If an element is currently selected, move it in the direction of pressed arrow key
    	if(currentlySelectedElement){
    		if(event.originalEvent.which >= 37 && event.originalEvent.which <= 40){
    			var deltaMagnitude = 4;
    			if(event.originalEvent.which === 37 || event.originalEvent.which === 39){ // If left/right arrow
    				var delta;
    				if(event.originalEvent.which === 37){
    					delta = -1 * deltaMagnitude;
    				}else{ // 39
    					delta = 1 * deltaMagnitude;
    				}
    				// Move element appropriately
    				var currentLeftValue = $("[elementId=" + currentlySelectedElement + "]").offset().left;
    				$("[elementId=" + currentlySelectedElement + "]").offset({ left: currentLeftValue + delta });
    			}else{ // If up/down arrow (38 or 40)
    				var delta;
    				if(event.originalEvent.which === 38){
    					delta = -1 * deltaMagnitude;
    				}else{ // 40
    					delta = 1 * deltaMagnitude;
    				}
    				// Move element appropriately
    				var currentTopValue = $("[elementId=" + currentlySelectedElement + "]").offset().top;
    				$("[elementId=" + currentlySelectedElement + "]").offset({ top: currentTopValue + delta });
    			}
    			dataChanged = true;
    		}
    	}
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
	    	$("[elementId=" + currentlySelectedElement + "]").css("background-color", hexColorString);
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
	    	$("[elementId=" + currentlySelectedElement + "]").css("color", hexColorString);
	    	dataChanged = true;
	    }
	});

	$("#slider").slider({
      min: 8,
      max: 96,
      slide: function( event, ui ) {
        $( "#amount" ).val( ui.value  + "px" );
        $("[elementId=" + currentlySelectedElement + "]").css("font-size", ui.value  + "px");
	    dataChanged = true;
      }
    });

    //$(".ruleInferenceSelect").change(function(event) {
    $("body").on("change", ".ruleInferenceSelect", function(){
    	// Transition rule value
    	var newTransitionRule = $(this).val();
    	//console.log($(this));
    	console.log(newTransitionRule);

    	// Property widget
    	var widgetId = $(this).attr("id");
    	console.log(widgetId);

    	// Update widget's "transition" property

    	// Capture data/send to server
    	dataChanged = true;
	});

	// Fill all .propertyRules divs with dropdown menu HTML
	//var ruleInferenceQuestions = "<div>Test content</div>";
	//var ruleInferenceQuestions = var generateRuleInferenceHTML = function(widgetName){
	//$(".propertyRules").html(ruleInferenceQuestions);

	$(".propertyRules").each(function(index, element){

		var propertyToolAncestor = $(this).closest(".propertyTool");
		var widgetName = propertyToolAncestor.attr("widgetName");
		var ruleInferenceQuestions = generateRuleInferenceHTML(widgetName);
		$(this).html(ruleInferenceQuestions);
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
	$("#background_color_colorpicker").spectrum("set", element.css("background-color"));
	
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
	$("#text_color_colorpicker").spectrum("set", element.css("color"));	

	//updateRulesMenu(element);

	// Give focus to the element
	$("[elementId=" + currentlySelectedElement + "]").focus();
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
		}

		uiElementsData.push(uiElementData);
		console.log(uiElementData);
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
    	//allElementRules = data["elementRules"];

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
	
	//$(".pageElement").resizable();
	// pageElements that contain an image should get aspectRatio: true
	$(".pageElement").has("img").resizable({aspectRatio: true});

	$(".pageElement").not(":has(img)").resizable();
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
		//console.log(cssString);
		cssRulesString += cssString;
		//cssRulesString += cssRules[i];
	}
	$("#" + elementCSSRules).append("<style>" + cssRulesString + "</style>");
};

//var createSingleAttributeCSSString = function(ruleObject, dimensionValue, elementId, propertyName){
// imageRatio will be null if the element is not an image
var createSingleAttributeCSSString = function(ruleObject, dimensionValue, elementId, propertyName, imageRatio){

	var m = ruleObject["m"];
	var b = ruleObject["b"];
	var computedValue = m * dimensionValue + b;

	// Construct CSS rule string
	var singleRule = "#element" + elementId + "{";
	//singleRule += createPropertyValueString(propertyName, computedValue);
	singleRule += "" + propertyName + ": " + computedValue + "px;";
	singleRule += "}";
	//console.log(singleRule);

	// Is this needed? Is explicitly setting the "height" needed?
	if(imageRatio != null && propertyName === "width"){
		// Set the height that corresponds to the width we just set
		var heightValue = 1.0*computedValue / imageRatio;
		//console.log("heightValue: " + heightValue);
		singleRule += "#element" + elementId + "{";
		singleRule += "height: " + heightValue + "px;";
		singleRule += "}";
	}

	return singleRule;
}

var createRGBCSSString = function(ruleObject, dimensionValue, elementId, propertyName){
	var rData = ruleObject["r"];
	var gData = ruleObject["g"];
	var bData = ruleObject["b"];

	var rComputedValue = postProcessRGBValue(rData["m"] * dimensionValue + rData["b"]);
	var gComputedValue = postProcessRGBValue(gData["m"] * dimensionValue + gData["b"]);
	var bComputedValue = postProcessRGBValue(bData["m"] * dimensionValue + bData["b"]);
	


	var rgbString = "rgb(" + rComputedValue + ", " + gComputedValue + ", " + bComputedValue + ")";

	var rgbRule = "#element" + elementId + "{";
	//rgbRule += createPropertyValueString(propertyName, rgbString);
	rgbRule += "" + propertyName + ": " + rgbString + ";";
	rgbRule += "}";
	//console.log(rgbRule);
	return rgbRule;
}

var postProcessRGBValue = function(value){
	// Make an int, bound to [0, 255]
	return Math.min(Math.max(Math.round(value), 0), 255);
};

var generateCSSString = function(ruleObject){
	var dimValue = getUserPageDimValue(ruleObject["pageDim"]);
	//console.log(dimValue);
	var cssRulesList = ruleObject["cssRulesList"];
	var behaviorName = ruleObject["behaviorName"];
	var propertyName = ruleObject["propertyName"];
	var pageDim = ruleObject["pageDim"];
	var elementId = ruleObject["elementId"];
	var imageRatio = ruleObject["image-ratio"];
	/*if(imageRatio){
		console.log("imageRatio: " + imageRatio);
	}
	console.log(ruleObject);*/
	//console.log("elementId: " + elementId + "; propertyName: " + propertyName + "; imageRatio: " + imageRatio);
	//console.log("imageRatio: " + imageRatio);
	//console.log(ruleObject);

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
		//console.log("isRelevantRule: " + isRelevantRule);
		if(isRelevantRule){
			var cssStringFunction = propertyToCSSStringFunction[propertyName];
			var cssString = cssStringFunction(ruleOption, dimValue, elementId, propertyName, imageRatio);
			//console.log(cssString);
			return cssString;
		}
	}
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + "px;";
}