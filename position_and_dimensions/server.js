var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var regression = require('regression');

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
	/*res.json({
		"views": views,
		"elementRules": elementRules,
		"cssRules": cssRules
	});*/
	res.json({
		"views": Object.values(views),
		"elementRules": elementRules,
		"cssRules": cssRules
	});
});

app.post('/cloneOriginal', function(req, res) {
	var clonedView = cloneViewObj();
	views[clonedView["id"]] = clonedView;
	//views.push(clonedView);

	// Send back to client
	res.json({
		"view": clonedView,
		"elementRules": elementRules
	});
});

app.post('/deleteKeyframe', function(req, res){
	//{"viewId": currentViewId, "nextViewToShow": nextKeyframeToShow}
	var viewIdToDelete = parseInt(req.body.viewId);

	/*var viewIdToReturn = parseInt(req.body.nextViewToShow);
	var viewToReturn = views[viewIdToReturn];*/

	//views.splice(viewIdToDelete, 1);
	delete views[viewIdToDelete];

	// For simplicity, make viewToReturn the leftmost one/first in Object.values(views)[0]?
	var viewToReturn = Object.values(views)[0];

	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}

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
		"view": views[viewId],
		"elementRules": elementRules
	});
});

app.post("/updateData", function(req, res){
	updateElementAndPageData(req.body.oldView);

	// For each view, call convertClientDataToInts(req.body.oldView);
	//for(var i = 0; i < views.length; i++){
	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		//convertClientDataToInts(views[i]);
		convertClientDataToInts(views[viewId]);
	}
	
	// Based on all keyframes, should update element and css rules here
	updateCSSRules();
	
	// Perhaps also send elementRules back too?
	res.json({
		"cssRules": cssRules
	});
});

app.post("/updateRules", function(req, res){
	elementRules = req.body.rules;
	
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
			var elementBehaviorListOfOptions = Object.keys(elementBehaviorDictOfOptions);
			for(var optionIndex = 0; optionIndex < elementBehaviorListOfOptions.length; optionIndex++){
				var propertyOptionName = elementBehaviorListOfOptions[optionIndex];
				var propertyOptionValue = elementBehaviorDictOfOptions[propertyOptionName];
				element[behaviorName][propertyOptionName] = parseInt(propertyOptionValue);
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
	//var original = views[0];
	/*var viewIds = Object.keys(views);
	var firstViewCurrently = views[viewIds[0]];*/
	var firstViewCurrently = getFirstViewObj();
	//var original = views[0];
	//var clonedView = Object.assign({}, original);
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
		//valueString = "" + (m * 100) + "vw";
		valueString = "" + (m * 100) + "%";
	}else{
		//valueString = "" + (m * 100) + "vw + " + b + constantUnit;
		//valueString = "calc(" + (m * 100) + "vw + " + b + constantUnit + ")";
		valueString = "calc(" + (m * 100) + "% + " + b + constantUnit + ")";
	}
	return valueString;
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + ";";
}

var createCSSRule = function(elementRules){
	
	var ruleString = "#element" + elementRules["id"] + "{";

	for(var propertyIndex = 0; propertyIndex < properties.length; propertyIndex++){
		var propertyName = properties[propertyIndex];


		//var elementXValueString = createValue(elementRules[propertyName]["m"], elementRules[propertyName]["b"]);
		var elementXValueString = createValue(elementRules[propertyName][0]["m"], elementRules[propertyName][0]["b"]);
		var elementXPropertyValueString = createPropertyValueString(propertyName, elementXValueString);
		ruleString += elementXPropertyValueString;
	}

	ruleString += "}";

	return ruleString;
};

var generateCSSRulesList = function(elementId, pageDim, behaviorName, propertyName, elementPropertyPattern){
	//var ruleString = "";
	//for(var mediaQueryIndex = 0; mediaQueryIndex < elementPropertyPattern.length; mediaQueryIndex++){
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

		/*if(mediaQueryIndex === elementPropertyPattern.length-1){
			// When mediaQueryIndex === elementPropertyPattern.length-1, should just generate a normal CSS rule with no "@media" rule;
			// This makes sense for when there's only one rule in elementPropertyPattern,
			// as well as for when there are multiple rules in elementPropertyPattern,
			// because this is the general rule that later media queries override
			ruleString += "#element" + rule["elementSelector"] + "{";
			var elementValueString = createValue(rule["m"], rule["b"]);
			var elementPropertyValueString = createPropertyValueString(propertyName, elementValueString);
			ruleString += elementPropertyValueString;
			ruleString += "}";
		}else{
			// Use media queries

			// media query syntax start

			// will be either "max-width" or "max-height" depending on what pageDim is
			var mediaQueryMaxProperty = pageDimensionsAndBehaviorsTheyInfluence[pageDim]["mediaMaxProperty"];
			var mediaPrefix = "@media (" + mediaQueryMaxProperty + ": " + rule["end"] + constantUnit + ") {";
			ruleString += mediaPrefix;

			// rule content
			ruleString += "#element" + rule["elementSelector"] + "{";
			var elementValueString = createValue(rule["m"], rule["b"]);
			var elementPropertyValueString = createPropertyValueString(propertyName, elementValueString);
			ruleString += elementPropertyValueString;
			ruleString += "}";
			ruleString += "}"; // for ending media query

			// media query syntax end

		}
		ruleString += "\n";*/
	}
	//return ruleString;
	console.log(ruleList);
	return ruleList;
};

// This should probably update element rules and css rule strings
// Should take into account all keyframes and try to infer rules; either create media queries or say "inconsistent rule" when not all keyframes can be satisfied by a single rule
var updateCSSRules = function(){
	
	cssRules = [];

	// Use logic from processInput.js
	// For each element, compare its properties in each view
	// views array
	//var numElements = views[0]["elements"].length;
	var viewIds = Object.keys(views);
	var firstViewCurrently = views[viewIds[0]];
	var numElements = firstViewCurrently["elements"].length;
	var elementPatterns = {};

	for(var elementIndex = 0; elementIndex < numElements; elementIndex++){
		//var elementId = views[0]["elements"][elementIndex]["id"];
		var elementId = firstViewCurrently["elements"][elementIndex]["id"];
		var keyframesDataForThisElement = [];
		//for(var viewIndex = 0; viewIndex < views.length; viewIndex++){
		for(var viewIndex = 0; viewIndex < viewIds.length; viewIndex++){
			var viewKey = viewIds[viewIndex];
			/*var elementObjAtKeyframe = Object.assign({}, views[viewIndex]["elements"][elementId]);
			elementObjAtKeyframe["pageWidth"] = views[viewIndex]["pageWidth"];
			elementObjAtKeyframe["pageHeight"] = views[viewIndex]["pageHeight"];
			elementObjAtKeyframe["keyframeId"] = views[viewIndex]["id"];*/
			var elementObjAtKeyframe = Object.assign({}, views[viewKey]["elements"][elementId]);
			elementObjAtKeyframe["pageWidth"] = views[viewKey]["pageWidth"];
			elementObjAtKeyframe["pageHeight"] = views[viewKey]["pageHeight"];
			elementObjAtKeyframe["keyframeId"] = views[viewKey]["id"];
			keyframesDataForThisElement.push(elementObjAtKeyframe);
		}
		// will need to sort by width and height separately?

		//pageDimensionsAndBehaviorsTheyInfluence
		var pageDimensions = Object.keys(pageDimensionsAndBehaviorsTheyInfluence);

		/*var patterns = {
			"id": elementId
		};*/

		console.log(keyframesDataForThisElement);

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

				var chosenElementPropertyPattern = undefined;
				var chosenPropertyName = undefined;

				// Need to consider the multiple properties per behavior, and choose the one with the fewest media queries?
				
				//var propertiesObject = elementDataFormat[behaviorName];
				//var propertiesList = Object.keys(propertiesObject);
				
				var propertiesList = elementDataFormat[behaviorName]["properties"];
				//console.log(propertiesList);
				for(var propertyIndex = 0; propertyIndex < propertiesList.length; propertyIndex++){
					var propertyName = propertiesList[propertyIndex];
					// Hacky: Maybe test it out first to see if this property exists in this set of keyframes?
					//console.log(keyframesDataForThisElement[0][behaviorName]);
					//[propertyIndex][attributeName]

					//var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, propertyIndex, pageDim);
					
					if(keyframesDataForThisElement[0][behaviorName][propertyName] !== undefined){
						var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
						if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
							chosenElementPropertyPattern = elementPropertyPattern;
							chosenPropertyName = propertyName;
						}
					}
				}

				// Change elementDataFormat[behaviorName].length to something else...
				/*for(var propertyIndex = 0; propertyIndex < elementDataFormat[behaviorName].length; propertyIndex++){
					var propertyName = elementDataFormat[behaviorName][propertyIndex]["property"];
					
					// Hacky: Maybe test it out first to see if this property exists in this set of keyframes?
					//keyframesDataForThisElement[0][behaviorName]
					//[propertyIndex][attributeName]

					//var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, propertyIndex, pageDim);
					var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
					if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
						chosenElementPropertyPattern = elementPropertyPattern;
					}
				}*/
				// maybe remove the above and have it occur within determinePattern?

				/*var propertyName = elementDataFormat[behaviorName][0]["property"];
				// Should I pass in behavior and property name into determinePattern?
				//var elementPropertyPattern = determinePattern(keyframesDataForThisElement, propertyName, pageDim);
				var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
				// Should it be patterns[propertyName] or patterns[behaviorName][propertyName]?*/
				
				//patterns[propertyName] = chosenElementPropertyPattern;
				
				// Generate CSS rules/rule strings for the pattern elementPropertyPattern (for behaviorName, pageWidth/pageHeight, elementId)
				// Sort array from largest page height/width to smallest
				// For first rule, just insert CSS string normally
				// For remaining rules, have a max-width rule (with the max width being the prior rule's startWidth (or startWidth-1?)) 

				//var cssRulesList = generateCSSRulesList(elementId, pageDim, behaviorName, propertyName, elementPropertyPattern);
				

				/*var cssRulesList = generateCSSRulesList(elementId, pageDim, behaviorName, propertyName, chosenElementPropertyPattern);
				var cssRulesObj = {
					"cssRulesList": cssRulesList,
					"behaviorName": behaviorName,
					"propertyName": propertyName,
					"pageDim": pageDim
				}
				cssRules.push(cssRulesObj);*/

				var cssRulesList = generateCSSRulesList(elementId, pageDim, behaviorName, chosenPropertyName, chosenElementPropertyPattern);
				var cssRulesObj = {
					"cssRulesList": cssRulesList,
					"behaviorName": behaviorName,
					"propertyName": chosenPropertyName,
					"pageDim": pageDim
				}
				cssRules.push(cssRulesObj);

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
//var determinePattern = function(dataPoints, attributeName, axisName){
//var determinePattern = function(dataPoints, behaviorName, attributeName, propertyIndex, axisName){
var determinePattern = function(dataPoints, behaviorName, attributeName, axisName){
	/*console.log(dataPoints);
	console.log(behaviorName);
	console.log(attributeName);
	console.log(axisName);*/

	var elementSelector = dataPoints[0]["id"];
	var chunkLineFitData = [];

	if(dataPoints.length == 1){
		// If one point only, assume properties will remain constant throughout all viewport sizes
		var m = 0;
		var b = dataPoints[0][behaviorName][attributeName];
		//var b = dataPoints[0][behaviorName][propertyIndex][attributeName];

		var chunkStart = dataPoints[0][axisName];
		var chunkEnd = dataPoints[0][axisName];
		chunkLineFitData.push( { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector } );
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

			//var leftPageWidthSlope = (point2[attributeName] - point1[attributeName])/(point2[axisName] - point1[axisName]);
			var leftPageWidthSlope = (point2[behaviorName][attributeName] - point1[behaviorName][attributeName])/(point2[axisName] - point1[axisName]);
			//var leftPageWidthSlope = (point2[behaviorName][propertyIndex][attributeName] - point1[behaviorName][propertyIndex][attributeName])/(point2[axisName] - point1[axisName]);
			
			slopes.push(leftPageWidthSlope);
		}

		var chunkStartIndices = [];
		chunkStartIndices.push(0);

		// compare slopes, identify chunks
		for(var i = 1; i < slopes.length; i++){
			var slope1 = slopes[i-1];
			var slope2 = slopes[i];
			if(slope1 == slope2){
				// Same chunk, nothing to do
			}else{
				// Different chunk
				chunkStartIndices.push(i);
			}
		}
		
		//var chunkLineFitData = [];

		for(var i = 0; i < chunkStartIndices.length; i++){
			// Choose any 2 arbitrary points in the chunk (for ease, just the first two), and fit a line to them
			// equation: y = m*x + c
			// matrix multiplication for this? or just quick formula
			var pointIndex1 = chunkStartIndices[i];
			var pointIndex2 = pointIndex1 + 1;
			var point1 = dataPoints[pointIndex1];
			var point2 = dataPoints[pointIndex2];

			//var pointData = [ [point1["pageWidth"], point1["left"]], [point2["pageWidth"], point2["left"]] ];
			//var pointData = [ [point1[axisName], point1[attributeName]], [point2[axisName], point2[attributeName]] ];
			var pointData = [ [point1[axisName], point1[behaviorName][attributeName]], [point2[axisName], point2[behaviorName][attributeName]] ];
			//var pointData = [ [point1[axisName], point1[behaviorName][propertyIndex][attributeName]], [point2[axisName], point2[behaviorName][propertyIndex][attributeName]] ];
			result = regression.linear(pointData);
			var m = result.equation[0];
			var b = result.equation[1];

			var chunkStart = point1[axisName];
			var chunkEnd;
			if(i < chunkStartIndices.length - 1){
				chunkEnd = dataPoints[chunkStartIndices[i+1]][axisName];
			}else{
				chunkEnd = dataPoints[dataPoints.length - 1][axisName];
			}

			chunkLineFitData.push( { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector } );
		}
	}

	return chunkLineFitData;
	
	//}


	// Identify chunks; if propertyValue is the same for 2+ points in the same dimension (x or y), then cutoff point (or min/max value)
	// Chunks of linear pieces of the graph (perhaps compute slopes of adjacent pairs and compare);

	// sort by pageWidth

	// determine slope for adjacent points
	// if adjacent pairs of slopes are different, then break into media queries
	// identify largest chunks of data points with same slope
	// for each chunk, solve y = a*x + b; now for that chunk we can calculate CSS values
};

// ------------ Constants ------------
var constantUnit = "px";

var pageDimensionsAndBehaviorsTheyInfluence = {
	"pageWidth": {
		"compareFunc": comparePageWidths,
		"behaviorsInfluenced": ["width", "x"],
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

/*var elementDataFormat = {
	"width": [
		{
			"property": "width",
			"pageDimension": "pageWidth"
		}
	],
	"height": [
		{
			"property": "height",
			"pageDimension": "pageHeight"
		}
	],
	"x": [
		{
			"property": "left",
			"pageDimension": "pageWidth"
		},
		{
			"property": "right",
			"pageDimension": "pageWidth"
		}
	],
	"y": [
		{
			"property": "top",
			"pageDimension": "pageHeight"
		},
		{
			"property": "bottom",
			"pageDimension": "pageHeight"
		}
	]
};*/

var elementDataFormat = {
	"width": {
		"pageDimension": "pageWidth",
		"properties": ["width"]
	},
	"height": {
		"pageDimension": "pageHeight",
		"properties": ["height"]
	},
	"x": {
		"pageDimension": "pageWidth",
		"properties": ["left", "right"]
	},
	"y": {
		"pageDimension": "pageHeight",
		"properties": ["top", "bottom"]
	}
};

// maybe generate this list later from elementDataFormat? 
var properties = ["width", "height", "left", "top"];

// ------------ State ------------
// View raw data
//var views = [];
var views = {};
var viewCounter = 0;

var view0Element0 = {
	"id": 0,
	"color": "blue",
	"x": {
		"left": 100
	},
	"y": {
		"top": 40
	},
	"width": {
		"width": 400
	},
	"height": {
		"height": 250
	}
};
var view0Element1 = {
	"id": 1,
	"color": "red",
	"x": {
		"left": 600
	},
	"y": {
		"top": 300
	},
	"width": {
		"width": 296
	},
	"height": {
		"height": 400
	}
};

/*var view0Element0 = {
	"id": 0,
	"color": "blue",
	"x": [
		{"left": 100}
	],
	"y": [
		{"top": 40}
	],
	"width": [
		{"width": 400}
	],
	"height": [
		{"height": 250}
	]
};
var view0Element1 = {
	"id": 1,
	"color": "red",
	"x": [
		{"left": 600}
	],
	"y": [
		{"top": 300}
	],
	"width": [
		{"width": 296}
	],
	"height": [
		{"height": 400}
	]
};*/

/*var view0Element0 = {
	"id": 0,
	"color": "blue",
	"x": [
		{"left": 100},
		{"right": 980}
	],
	"y": [
		{"top": 40},
		{"bottom": 510}
	],
	"width": [
		{"width": 400}
	],
	"height": [
		{"height": 250}
	]
};
var view0Element1 = {
	"id": 1,
	"color": "red",
	"x": [
		{"left": 600},
		{"right": 584}
	],
	"y": [
		{"top": 300},
		{"bottom": 100}
	],
	"width": [
		{"width": 296}
	],
	"height": [
		{"height": 400}
	]
};*/
var view0 = createViewObj(1480, 800);
view0["elements"].push(view0Element0);
view0["elements"].push(view0Element1);
//views.push(view0);
views[view0["id"]] = view0;

var view1Element0 = {
	"id": 0,
	"color": "blue",
	"x": {
		"left": 100
	},
	"y": {
		"top": 40
	},
	"width": {
		"width": 400
	},
	"height": {
		"height": 250
	}
};
var view1Element1 = {
	"id": 1,
	"color": "red",
	"x": {
		"left": 600
	},
	"y": {
		"top": 300
	},
	"width": {
		"width": 148
	},
	"height": {
		"height": 400
	}
};

/*var view1Element0 = {
	"id": 0,
	"color": "blue",
	"x": [
		{"left": 100}
	],
	"y": [
		{"top": 40}
	],
	"width": [
		{"width": 400}
	],
	"height": [
		{"height": 250}
	]
};
var view1Element1 = {
	"id": 1,
	"color": "red",
	"x": [
		{"left": 600}
	],
	"y": [
		{"top": 300}
	],
	"width": [
		{"width": 148}
	],
	"height": [
		{"height": 400}
	]
};*/

/*var view1Element0 = {
	"id": 0,
	"color": "blue",
	"x": [
		{"left": 100},
		{"right": 240}
	],
	"y": [
		{"top": 40},
		{"bottom": 510}
	],
	"width": [
		{"width": 400}
	],
	"height": [
		{"height": 250}
	]
};
var view1Element1 = {
	"id": 1,
	"color": "red",
	"x": [
		{"left": 600},
		{"right": 52}
	],
	"y": [
		{"top": 300},
		{"bottom": 100}
	],
	"width": [
		{"width": 148}
	],
	"height": [
		{"height": 400}
	]
};*/

/*var view1= createViewObj(740, 800);
view1["elements"].push(view1Element0);
view1["elements"].push(view1Element1);
//views.push(view1);
views[view1["id"]] = view1;*/

// Rules
var elementRules = {};
// give a default rule for each property of each element (probably constant)

// List of CSS-style rules as strings, e.g. "#element0 { width: 5px; height: 10px; position: absolute; left: 20px}"
var cssRules = [];
updateCSSRules();