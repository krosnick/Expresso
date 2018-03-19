var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var regression = require('regression');
var fs = require('fs');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '')));

app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	res.render("index");
});

app.get('/currentData',function(req,res){
	res.json({
		"views": Object.values(views),
		/*"elementRules": elementRules,*/
		"cssRules": cssRules
	});
});

app.post('/cloneOriginal', function(req, res) {
	var clonedView = cloneViewObj();
	views[clonedView["id"]] = clonedView;
	
	writeDataToJSONFile();
	
	// Send back to client
	res.json({
		"view": clonedView/*,
		"elementRules": elementRules*/
	});
});

app.post('/deleteKeyframe', function(req, res){
	var viewIdToDelete = parseInt(req.body.viewId);

	delete views[viewIdToDelete];

	// For simplicity, make viewToReturn the leftmost one/first in Object.values(views)[0]?
	var viewToReturn = Object.values(views)[0];

	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}

	writeDataToJSONFile();

	// Based on the remaining keyframes, should update CSS rules
	updateCSSRules();

	res.json({
		"nextViewToShow": viewToReturn,
		"cssRules": cssRules
	});
});

app.post('/view', function(req, res){
	updateElementAndPageData(req.body.oldView);

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]/*,
		"elementRules": elementRules*/
	});
});

app.post("/updateData", function(req, res){
	updateElementAndPageData(req.body.oldView);

	// For each view, call convertClientDataToInts(req.body.oldView);
	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}
	
	writeDataToJSONFile();

	// Based on all keyframes, should update element and css rules here
	updateCSSRules();
	
	// Perhaps also send elementRules back too?
	res.json({
		"cssRules": cssRules
	});
});

app.post("/updateRules", function(req, res){
	//elementRules = req.body.rules;
	
	updateCSSRules();
	
	res.json({
		"cssRules": cssRules
	});
});

app.listen(8080);



// ------------ Helpers ------------

var convertClientDataToInts = function(viewObj){
	var elementsData = viewObj["elements"];
	for(var i = 0; i < elementsData.length; i++){
		var element = elementsData[i];
		var elementBehaviorKeyValues = Object.entries(elementDataFormat);
		for(var behaviorIndex = 0; behaviorIndex < elementBehaviorKeyValues.length; behaviorIndex++){
			var behaviorKeyAndValue = elementBehaviorKeyValues[behaviorIndex];
			var behaviorName = behaviorKeyAndValue[0];
			var elementBehaviorDictOfOptions = element[behaviorName];
			console.log(elementBehaviorDictOfOptions);
			//if(elementBehaviorDictOfOptions){
			if(elementBehaviorDictOfOptions !== undefined && elementBehaviorDictOfOptions !== null){
				var elementBehaviorListOfOptions = Object.keys(elementBehaviorDictOfOptions);
				for(var optionIndex = 0; optionIndex < elementBehaviorListOfOptions.length; optionIndex++){
					var propertyOptionName = elementBehaviorListOfOptions[optionIndex];
					var propertyOptionValue = elementBehaviorDictOfOptions[propertyOptionName];
					console.log(propertyOptionName);
					console.log(propertyOptionValue);
					//if(typeof(propertyOptionValue) === "string"){
					if(typeof(propertyOptionValue) === "string" && propertyOptionName !== "transition"){
						var parseClientDataFunc = elementDataFormat[behaviorName]["parseClientData"];
						var parsedClientData = parseClientDataFunc(propertyOptionValue);
						element[behaviorName][propertyOptionName] = parsedClientData;
					}else{

					}
				}
			}
		}
	}
};

var confirmHasTransitionProperty = function(){
	var viewIds = Object.keys(views);
	for(var keyframeIndex = 0; keyframeIndex < viewIds.length; keyframeIndex++){
		var viewId = viewIds[keyframeIndex];
		var viewObj = views[viewId];
		var elementsData = viewObj["elements"];
		for(var i = 0; i < elementsData.length; i++){
			var element = elementsData[i];
			var elementBehaviorKeyValues = Object.entries(elementDataFormat);
			for(var behaviorIndex = 0; behaviorIndex < elementBehaviorKeyValues.length; behaviorIndex++){
				var behaviorKeyAndValue = elementBehaviorKeyValues[behaviorIndex];
				var behaviorName = behaviorKeyAndValue[0];
				var elementBehaviorDictOfOptions = element[behaviorName];
				if(elementBehaviorDictOfOptions){
					// Doesn't have "transition" property?
					if(!elementBehaviorDictOfOptions["transition"]){
						element[behaviorName]["transition"] = defaultTransition;
					}
				}
			}
		}
	}
};

var updateElementAndPageData = function(viewObj){

	var viewId = viewObj.oldViewId;
	var viewWidth = viewObj.oldViewWidth;
	var viewHeight = viewObj.oldViewHeight;
	var viewElementsData = viewObj.elementsData;

	var oldViewIdAsInt = parseInt(viewId);
	var oldViewServerObj = views[oldViewIdAsInt];
	// Updating page width and height of previously displayed view
	oldViewServerObj["pageWidth"] = parseInt(viewWidth);
	oldViewServerObj["pageHeight"] = parseInt(viewHeight);

	// Updating elements of previously displayed view, if there are changes
	if(viewElementsData){ // if undefined, then no updates have been made
		oldViewServerObj["elements"] = viewElementsData;
	}
};

var writeDataToJSONFile = function(){
	//dataFile
	var dataToWrite = { "keyframes": views };
	var dataString = JSON.stringify(dataToWrite);
	fs.writeFile(dataFile, dataString, function(err){
		console.log("Data written");
	});

};

var createViewObj = function(pageWidth, pageHeight){
	var newView = {
		"elements": [],
		"pageWidth": pageWidth,
		"pageHeight": pageHeight,
		"id": viewCounter
	};
	viewCounter++;
	return newView;
};

var getFirstViewObj = function(){
	var viewIds = Object.keys(views);
	var firstViewCurrently = views[viewIds[0]];
	return firstViewCurrently;
};

var cloneViewObj = function(){
	var firstViewCurrently = getFirstViewObj();
	var clonedView = Object.assign({}, firstViewCurrently);
	clonedView["id"] = viewCounter;
	viewCounter++;
	return clonedView;
};

var createValue = function(m, b){
	var valueString;
	if(m == 0 && b == 0){
		valueString = "0";
	}else if(m == 0){
		valueString = "" + b + constantUnit;
	}else if(b == 0){
		valueString = "" + (m * 100) + "%";
	}else{
		valueString = "calc(" + (m * 100) + "% + " + b + constantUnit + ")";
	}
	return valueString;
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + ";";
}

var generateCSSRulesList = function(elementId, pageDim, behaviorName, propertyName, elementPropertyPattern){
	var ruleList = [];
	for(var mediaQueryIndex = elementPropertyPattern.length-1; mediaQueryIndex >= 0; mediaQueryIndex--){
		var ruleObj = {};
		var rule = elementPropertyPattern[mediaQueryIndex];

		ruleObj["start"] = null;
		ruleObj["end"] = null;
		if(mediaQueryIndex > 0){
			ruleObj["start"] = rule["start"];
		}
		if(mediaQueryIndex < elementPropertyPattern.length-1){
			ruleObj["end"] = rule["end"];
		}

		var singleRule = "#element" + rule["elementSelector"] + "{";
		var elementValueString = createValue(rule["m"], rule["b"]);
		var elementPropertyValueString = createPropertyValueString(propertyName, elementValueString);
		singleRule += elementPropertyValueString;
		singleRule += "}";

		ruleObj["cssRuleString"] = singleRule;

		ruleList.push(ruleObj);
	}
	return ruleList;
};

// This should probably update element rules and css rule strings
// Should take into account all keyframes and try to infer rules; either create media queries or say "inconsistent rule" when not all keyframes can be satisfied by a single rule
var updateCSSRules = function(){
	
	cssRules = [];

	// Use logic from processInput.js
	// For each element, compare its properties in each view
	var viewIds = Object.keys(views);
	var firstViewCurrently = views[viewIds[0]];
	var numElements = firstViewCurrently["elements"].length;
	var elementPatterns = {};

	for(var elementIndex = 0; elementIndex < numElements; elementIndex++){
		var elementId = firstViewCurrently["elements"][elementIndex]["id"];
		/*var elementImageRatio = null;
		if(firstViewCurrently["elements"][elementIndex]["imageRatio"]){
			elementImageRatio = firstViewCurrently["elements"][elementIndex]["imageRatio"];
		}*/
		var elementImageRatio = firstViewCurrently["elements"][elementIndex]["image-ratio"];
		var keyframesDataForThisElement = [];
		for(var viewIndex = 0; viewIndex < viewIds.length; viewIndex++){
			var viewKey = viewIds[viewIndex];
			var elementObjAtKeyframe = Object.assign({}, views[viewKey]["elements"][elementId]);
			elementObjAtKeyframe["pageWidth"] = views[viewKey]["pageWidth"];
			elementObjAtKeyframe["pageHeight"] = views[viewKey]["pageHeight"];
			elementObjAtKeyframe["keyframeId"] = views[viewKey]["id"];
			keyframesDataForThisElement.push(elementObjAtKeyframe);
		}
		// will need to sort by width and height separately?

		var pageDimensions = Object.keys(pageDimensionsAndBehaviorsTheyInfluence);

		for(var pageDimIndex = 0; pageDimIndex < pageDimensions.length; pageDimIndex++){
			var pageDim = pageDimensions[pageDimIndex];
			var compareFunc = pageDimensionsAndBehaviorsTheyInfluence[pageDim]["compareFunc"];
			
			// Sort based on appropriate page dimension
			keyframesDataForThisElement.sort(compareFunc);
			var behaviorsInfluenced = pageDimensionsAndBehaviorsTheyInfluence[pageDim]["behaviorsInfluenced"];
			for(var behaviorIndex = 0; behaviorIndex < behaviorsInfluenced.length; behaviorIndex++){
				var behaviorName = behaviorsInfluenced[behaviorIndex];
				// maybe need to do some more processing here, or maybe within "determinePattern"
				// need to consider the possible properties for each element behavior

				if(!elementImageRatio || (elementImageRatio && behaviorName !== "height")){
					if(keyframesDataForThisElement[0][behaviorName] !== undefined){

						var chosenElementPropertyPattern = undefined;
						var chosenPropertyName = undefined;

						// Need to consider the multiple properties per behavior, and choose the one with the fewest media queries?
						
						/*var propertiesList = elementDataFormat[behaviorName]["properties"];
						for(var propertyIndex = 0; propertyIndex < propertiesList.length; propertyIndex++){
							var propertyName = propertiesList[propertyIndex];
							// Hacky: Maybe test it out first to see if this property exists in this set of keyframes?
							if(keyframesDataForThisElement[0][behaviorName][propertyName] !== undefined){
								var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
								if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
									chosenElementPropertyPattern = elementPropertyPattern;
									chosenPropertyName = propertyName;
								}
							}
						}*/

						var propertiesList = elementDataFormat[behaviorName]["properties"];
						for(var propertyIndex = 0; propertyIndex < propertiesList.length; propertyIndex++){
							var propertyName = propertiesList[propertyIndex];
							// Hacky: Maybe test it out first to see if this property exists in this set of keyframes?
							if(keyframesDataForThisElement[0][behaviorName][propertyName] !== undefined){
								var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
								
								/*
								// Hacky: For now, if behavior is y and element is an image, only support "top" property
								if(elementImageRatio && behaviorName === "y"){
									if(propertyName === "top"){
										chosenElementPropertyPattern = elementPropertyPattern;
										chosenPropertyName = propertyName;
									}
								}else{
									if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
										chosenElementPropertyPattern = elementPropertyPattern;
										chosenPropertyName = propertyName;
									}
								}
								*/
								if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
									chosenElementPropertyPattern = elementPropertyPattern;
									chosenPropertyName = propertyName;
								}
							}
						}

						// Only create the rule if we've actually succesfully generated chosenElementPropertyPattern
						if(chosenPropertyName){
							var cssRulesObj = {
								"cssRulesList": chosenElementPropertyPattern,
								"behaviorName": behaviorName,
								"propertyName": chosenPropertyName,
								"pageDim": pageDim,
								"elementId": elementId,
								"image-ratio": elementImageRatio
							}
							if(!(elementImageRatio && propertyName === "height")){
								cssRules.push(cssRulesObj);
							}
						}
					}
				}

			}

		}
	}
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

var comparePageHeights = function(a, b) {
  if (a["pageHeight"] < b["pageHeight"]) {
    return -1;
  }
  if (a["pageHeight"] > b["pageHeight"]) {
    return 1;
  }
  // a must be equal to b
  return 0;
};

// axisName is "pageWidth" or "pageHeight"
var determinePattern = function(dataPoints, behaviorName, propertyName, axisName){

	var elementSelector = dataPoints[0]["id"];
	var chunkLineFitData = [];

	if(dataPoints.length == 1){
		// If one point only, assume properties will remain constant throughout all viewport sizes

		var chunkStart = dataPoints[0][axisName];
		var chunkEnd = dataPoints[0][axisName];

		if(typeof(dataPoints[0][behaviorName][propertyName]) === "object"){
			var valueAttributes = Object.keys(dataPoints[0][behaviorName][propertyName]);
			var fitDataObject = {
				"start": chunkStart,
				"end": chunkEnd,
				"elementSelector": elementSelector
			};
			for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
				var attributeName = valueAttributes[attrIndex];
				// compute y=mx+b fit for attribute; then create data to add to chunkLineFitData
				var m = 0;
				var b = dataPoints[0][behaviorName][propertyName][attributeName];
				var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector };
				fitDataObject[attributeName] = lineOfBestFit;
			}
			chunkLineFitData.push(fitDataObject);
		}else{
			//var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName], point2[axisName], point2[behaviorName][propertyName], chunkStart, chunkEnd, elementSelector);
			var m = 0;
			var b = dataPoints[0][behaviorName][propertyName];
			var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector };
			chunkLineFitData.push(lineOfBestFit);
		}

	}else{
		// sort dataPoints by pageWidth value
		dataPoints.sort(comparePageWidths);

		// for left and for right (separately)
		// Let's do "left" first
		// possibly only 1 of left/right will follow a behavior based on pageWidth; possibly only 2/3 of left/right/elementWidth could follow a behavior based on pageWidth
		// if there are no adjacent pairs with the same slope, assume there is no pageWidth-based pattern for that property (left or right)

		var slopes = [];

		// compute slopes
		for(var i = 1; i < dataPoints.length; i++){
			var point1 = dataPoints[i-1];
			var point2 = dataPoints[i];

			var slope;

			if(typeof(point1[behaviorName][propertyName]) === "object"){
				// For each key in the object, compute a slope. Put in an object or array?
				slope = {};
				var valueAttributes = Object.keys(point1[behaviorName][propertyName]);
				for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
					var attributeName = valueAttributes[attrIndex];
					slope[attributeName] = (point2[behaviorName][propertyName][attributeName] - point1[behaviorName][propertyName][attributeName])/(point2[axisName] - point1[axisName]);
				}
			}else{
				slope = (point2[behaviorName][propertyName] - point1[behaviorName][propertyName])/(point2[axisName] - point1[axisName]);
			}
			
			slopes.push(slope);
		}

		var chunkStartIndices = [];
		chunkStartIndices.push(0);

		// compare slopes, identify chunks
		for(var i = 1; i < slopes.length; i++){
			var slope1 = slopes[i-1];
			var slope2 = slopes[i];
			if(typeof(slope1) === "object"){
				var allAttributesSame = true;
				var valueAttributes = Object.keys(slope1);
				for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
					var attributeName = valueAttributes[attrIndex];
					if(slope1[attributeName] === slope2[attributeName]){
						// Same chunk, nothing to do
					}else{
						allAttributesSame = false;
					}
				}
				if(allAttributesSame){
					// Same chunk, nothing to do
				}else{
					// Different chunk
					chunkStartIndices.push(i);
				}
			}else{
				if(slope1 == slope2){
				// Same chunk, nothing to do
				}else{
					// Different chunk
					chunkStartIndices.push(i);
				}
			}
		}

		for(var i = 0; i < chunkStartIndices.length; i++){
			// Choose any 2 arbitrary points in the chunk (for ease, just the first two), and fit a line to them
			// equation: y = m*x + c
			// matrix multiplication for this? or just quick formula
			var pointIndex1 = chunkStartIndices[i];
			var pointIndex2 = pointIndex1 + 1;
			var point1 = dataPoints[pointIndex1];
			var point2 = dataPoints[pointIndex2];

			var chunkStart = point1[axisName];
			var chunkEnd;
			if(i < chunkStartIndices.length - 1){
				chunkEnd = dataPoints[chunkStartIndices[i+1]][axisName];
			}else{
				chunkEnd = dataPoints[dataPoints.length - 1][axisName];
			}

			// what should be the format of this?
			//var fitDataObject = {};

			if(typeof(point1[behaviorName][propertyName]) === "object"){
				var valueAttributes = Object.keys(point1[behaviorName][propertyName]);
				var fitDataObject = {
					"start": chunkStart,
					"end": chunkEnd,
					"elementSelector": elementSelector
				};
				for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
					var attributeName = valueAttributes[attrIndex];
					// compute y=mx+b fit for attribute; then create data to add to chunkLineFitData
					var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName][attributeName], point2[axisName], point2[behaviorName][propertyName][attributeName], chunkStart, chunkEnd, elementSelector);
					fitDataObject[attributeName] = lineOfBestFit;
				}
				chunkLineFitData.push(fitDataObject);
			}else{
				var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName], point2[axisName], point2[behaviorName][propertyName], chunkStart, chunkEnd, elementSelector);
				chunkLineFitData.push(lineOfBestFit);
			}
		}
	}
	return chunkLineFitData;
};

var computeLineOfBestFit = function(axisVal1, attributeVal1, axisVal2, attributeVal2, chunkStart, chunkEnd, elementSelector){
	var pointData = [ [axisVal1, attributeVal1], [axisVal2, attributeVal2] ];
	result = regression.linear(pointData);
	var m = result.equation[0];
	var b = result.equation[1];
	var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector };
	return lineOfBestFit;
};

var determineLargestId = function(){
	
	var viewIds = Object.keys(views);
	var largestId = 0;
	for(var i = 0; i < viewIds.length; i++){
		var currentViewId = views[viewIds[i]]["id"];
		if(currentViewId > largestId){
			largestId = currentViewId;
		}
	}
	return largestId;
};

// ------------ Constants ------------
var constantUnit = "px";

var pageDimensionsAndBehaviorsTheyInfluence = {
	"pageWidth": {
		"compareFunc": comparePageWidths,
		/*"behaviorsInfluenced": ["width", "x"],*/
		/*"behaviorsInfluenced": ["width", "x", "font-size"],*/
		"behaviorsInfluenced": ["width", "x", "font-size", "background-color", "color"],
		"mediaMaxProperty": "max-width",
		"mediaMinProperty": "min-width",
	},
	"pageHeight": {
		"compareFunc": comparePageHeights,
		"behaviorsInfluenced": ["height", "y"],
		"mediaMaxProperty": "max-height",
		"mediaMinProperty": "min-height",
	}
};

var elementDataFormat = {
	"width": {
		"pageDimension": "pageWidth",
		"properties": ["width"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		}
	},
	"height": {
		"pageDimension": "pageHeight",
		"properties": ["height"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		}
	},
	"x": {
		"pageDimension": "pageWidth",
		"properties": ["left", "right"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		}
	},
	"y": {
		"pageDimension": "pageHeight",
		"properties": ["top", "bottom"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		}
	},
	"font-size": {
		"pageDimension": "pageWidth",
		"properties": ["font-size"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		}
	},
	"background-color": {
		"pageDimension": "pageWidth",
		"properties": ["background-color"],
		parseClientData: function(clientString){
			//return parseInt(clientString);
			// extract from rgb(r, g, b)
			var indexOfOpenParen = clientString.indexOf("(");
			var indexOfFirstComma = clientString.indexOf(",", indexOfOpenParen+1);
			var indexOfSecondComma = clientString.indexOf(",", indexOfFirstComma+1);
			var indexOfCloseParen = clientString.indexOf(")");

			var rString = clientString.substring(indexOfOpenParen + 1, indexOfFirstComma);
			var gString = clientString.substring(indexOfFirstComma + 1, indexOfSecondComma);
			var bString = clientString.substring(indexOfSecondComma + 1, indexOfCloseParen);
			
			var rgbObject = {
				"r": parseInt(rString),
				"g": parseInt(gString),
				"b": parseInt(bString)
			};
			return rgbObject;
		}
	},
	"color": {
		"pageDimension": "pageWidth",
		"properties": ["color"],
		parseClientData: function(clientString){
			//return parseInt(clientString);
			// extract from rgb(r, g, b)
			var indexOfOpenParen = clientString.indexOf("(");
			var indexOfFirstComma = clientString.indexOf(",", indexOfOpenParen+1);
			var indexOfSecondComma = clientString.indexOf(",", indexOfFirstComma+1);
			var indexOfCloseParen = clientString.indexOf(")");

			var rString = clientString.substring(indexOfOpenParen + 1, indexOfFirstComma);
			var gString = clientString.substring(indexOfFirstComma + 1, indexOfSecondComma);
			var bString = clientString.substring(indexOfSecondComma + 1, indexOfCloseParen);
			
			var rgbObject = {
				"r": parseInt(rString),
				"g": parseInt(gString),
				"b": parseInt(bString)
			};
			return rgbObject;
		}
	}
};

var transitionOptions = ["linearInterpolation", "prevKeyframeRule", "nextKeyframeRule", "prevKeyframeConstantValue", "currentKeyframeConstantValue"];
var defaultTransition = "linearInterpolation";

var properties = [];
var behaviorObjList = Object.values(elementDataFormat);
for(var behaviorObjIndex = 0; behaviorObjIndex < behaviorObjList.length; behaviorObjIndex++){
	var behaviorProperties = behaviorObjList[behaviorObjIndex]["properties"];
	for(var propertyIndex = 0; propertyIndex < behaviorProperties.length; propertyIndex++){
		var property = behaviorProperties[propertyIndex];
		properties.push(property);
	}
}

// ------------ State ------------
var views = {};
var viewCounter;

// ------------ Render given webpage data ------------
var dataFile = process.argv[2];
// Read in file and store data in "views"
fs.readFile(dataFile, function(err, data){
	if(err){
        console.log(err);
    }else{
    	var jsonFileData = JSON.parse(data);
    	views = jsonFileData["keyframes"];

    	// Confirm that element property of each keyframe has a "transition" property; if one doesn't, then set it to defaultTransition
    	// Later will probably want to have a specific defaultTransition per property type (e.g., "prevKeyframeConstantValue" for img src, "linearInterpolation" for element width)
    	confirmHasTransitionProperty();
    	writeDataToJSONFile();

    	//viewCounter = Object.keys(views).length;
    	viewCounter = determineLargestId() + 1;
    	updateCSSRules();
    }
});