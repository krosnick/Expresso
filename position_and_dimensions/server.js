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
	res.json({
		"views": views,
		"elementRules": elementRules,
		"cssRules": cssRules
	});
});

app.post('/cloneOriginal', function(req, res) {
	var clonedView = cloneViewObj();
	views.push(clonedView);

	// Send back to client
	res.json({
		"view": clonedView,
		"elementRules": elementRules
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
	//convertClientDataToInts(req.body.oldView);
	updateElementAndPageData(req.body.oldView);

	// For each view, call convertClientDataToInts(req.body.oldView);
	for(var i = 0; i < views.length; i++){
		convertClientDataToInts(views[i]);
	}
	
	// Based on all keyframes, should update element and css rules here
	updateCSSRules();
	//res.end();

	// Perhaps also send elementRules back too?
	res.json({
		"cssRules": cssRules
	});
});

app.post("/updateRules", function(req, res){
	elementRules = req.body.rules;
	
	updateCSSRules();
	
	//res.end();
	res.json({
		"cssRules": cssRules
	});
});

app.listen(8080);



// ------------ Helpers ------------

var convertClientDataToInts = function(viewObj){
	//var elementsData = viewObj["elementsData"];
	var elementsData = viewObj["elements"];
	for(var i = 0; i < elementsData.length; i++){
		var element = elementsData[i];
		element["id"] = parseInt(element["id"]);
		element["width"] = parseInt(element["width"]);
		element["height"] = parseInt(element["height"]);
		element["x"] = parseInt(element["x"]);
		element["y"] = parseInt(element["y"]);
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

var createElementObj = function(id, x, y, width, height, color){
	return {
		"id": id,
		"x": x,
		"y": y,
		"width": width,
		"height": height,
		"color": color
	};
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

var cloneViewObj = function(){
	var original = views[0];
	var clonedView = Object.assign({}, original);
	clonedView["id"] = viewCounter;
	viewCounter++;
	return clonedView;
};

// Create CSS rule string based on rules for given element
/*var createCSSRule = function(elementRules){
	
	var ruleString = "#element" + elementRules["id"] + "{\n";

	// Element x
	//var leftRule = 
	if(elementRules["x"]["rule"] === "constant"){
		ruleString += "\tleft: " + elementRules["x"]["value"] + "px;\n";
	}else if(elementRules["x"]["rule"] === "ratio"){
		ruleString += "\tleft: " + elementRules["x"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element y
	if(elementRules["y"]["rule"] === "constant"){
		ruleString += "\ttop: " + elementRules["y"]["value"] + "px;\n";
	}else if(elementRules["y"]["rule"] === "ratio"){
		ruleString += "\ttop: " + elementRules["y"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element width
	if(elementRules["width"]["rule"] === "constant"){
		ruleString += "\twidth: " + elementRules["width"]["value"] + "px;\n";
	}else if(elementRules["width"]["rule"] === "ratio"){
		ruleString += "\twidth: " + elementRules["width"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element height
	if(elementRules["height"]["rule"] === "constant"){
		ruleString += "\theight: " + elementRules["height"]["value"] + "px;\n";
	}else if(elementRules["height"]["rule"] === "ratio"){
		ruleString += "\theight: " + elementRules["height"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	ruleString += "}";

	return ruleString;
};*/

var createValue = function(m, c){
	var valueString;
	if(m == 0 && c == 0){
		valueString = "0";
	}else if(m == 0){
		valueString = "" + c + constantUnit;
	}else if(c == 0){
		//valueString = "" + (m * 100) + "vw";
		valueString = "" + (m * 100) + "%";
	}else{
		//valueString = "" + (m * 100) + "vw + " + c + constantUnit;
		//valueString = "calc(" + (m * 100) + "vw + " + c + constantUnit + ")";
		valueString = "calc(" + (m * 100) + "% + " + c + constantUnit + ")";
	}
	return valueString;
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + ";";
}

var createCSSRule = function(elementRules){
	
	//var ruleString = "#element" + elementRules["id"] + "{\n";
	var ruleString = "#element" + elementRules["id"] + "{";

	/*// Element x
	if(elementRules["x"]["rule"] === "constant"){
		ruleString += "\tleft: " + elementRules["x"]["value"] + "px;\n";
	}else if(elementRules["x"]["rule"] === "ratio"){
		ruleString += "\tleft: " + elementRules["x"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element y
	if(elementRules["y"]["rule"] === "constant"){
		ruleString += "\ttop: " + elementRules["y"]["value"] + "px;\n";
	}else if(elementRules["y"]["rule"] === "ratio"){
		ruleString += "\ttop: " + elementRules["y"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element width
	if(elementRules["width"]["rule"] === "constant"){
		ruleString += "\twidth: " + elementRules["width"]["value"] + "px;\n";
	}else if(elementRules["width"]["rule"] === "ratio"){
		ruleString += "\twidth: " + elementRules["width"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}

	// Element height
	if(elementRules["height"]["rule"] === "constant"){
		ruleString += "\theight: " + elementRules["height"]["value"] + "px;\n";
	}else if(elementRules["height"]["rule"] === "ratio"){
		ruleString += "\theight: " + elementRules["height"]["value"] + "%;\n";
	}else{
		// Inconsistent rule?
		// Figure out later what the default should be
	}*/

	var elementXValueString = createValue(elementRules["x"]["m"], elementRules["x"]["b"]);
	var elementXPropertyValueString = createPropertyValueString("left", elementXValueString);
	//ruleString += "\t" + elementXPropertyValueString + "\n";
	ruleString += elementXPropertyValueString;

	var elementYValueString = createValue(elementRules["y"]["m"], elementRules["y"]["b"]);
	var elementYPropertyValueString = createPropertyValueString("top", elementYValueString);
	//ruleString += "\t" + elementYPropertyValueString + "\n";
	ruleString += elementYPropertyValueString;

	var elementWidthValueString = createValue(elementRules["width"]["m"], elementRules["width"]["b"]);
	var elementWidthPropertyValueString = createPropertyValueString("width", elementWidthValueString);
	//ruleString += "\t" + elementWidthPropertyValueString + "\n";
	ruleString += elementWidthPropertyValueString;

	var elementHeightValueString = createValue(elementRules["height"]["m"], elementRules["height"]["b"]);
	var elementHeightPropertyValueString = createPropertyValueString("height", elementHeightValueString);
	//ruleString += "\t" + elementHeightPropertyValueString + "\n";
	ruleString += elementHeightPropertyValueString;

	ruleString += "}";

	return ruleString;
};

// This should probably update element rules and css rule strings
// Should take into account all keyframes and try to infer rules; either create media queries or say "inconsistent rule" when not all keyframes can be satisfied by a single rule
var updateCSSRules = function(){
	
	cssRules = [];

	// Use logic from processInput.js
	// For each element, compare its properties in each view
	// views array
	var numElements = views[0]["elements"].length;
	var properties = ["width", "height", "x", "y"];
	var horizontalProperties = ["width", "x"];
	var verticalProperties = ["height", "y"];

	var elementPatterns = {};

	for(var elementIndex = 0; elementIndex < numElements; elementIndex++){
		var elementId = views[0]["elements"][elementIndex]["id"];
		console.log("elementId: "  + elementId);
		var keyframesDataForThisElement = [];
		for(var viewIndex = 0; viewIndex < views.length; viewIndex++){
			var elementObjAtKeyframe = Object.assign({}, views[viewIndex]["elements"][elementId]);
			elementObjAtKeyframe["pageWidth"] = views[viewIndex]["pageWidth"];
			elementObjAtKeyframe["pageHeight"] = views[viewIndex]["pageHeight"];
			elementObjAtKeyframe["keyframeId"] = views[viewIndex]["id"];
			keyframesDataForThisElement.push(elementObjAtKeyframe);
			console.log(elementObjAtKeyframe);
		}
		// will need to sort by width and height separately?

		keyframesDataForThisElement.sort(comparePageWidths);
		var elementWidthPattern = determinePattern(keyframesDataForThisElement, "width", "pageWidth");
		console.log(elementWidthPattern);
		var elementXPattern = determinePattern(keyframesDataForThisElement, "x", "pageWidth");
		
		keyframesDataForThisElement.sort(comparePageHeights);
		var elementHeightPattern = determinePattern(keyframesDataForThisElement, "height", "pageHeight");
		var elementYPattern = determinePattern(keyframesDataForThisElement, "y", "pageHeight");
		
		/*var patterns = {
			"width": elementWidthPattern,
			"height": elementHeightPattern,
			"x": elementXPattern,
			"y": elementYPattern
		};*/

		// For now assume only one chunk/media query
		var patterns = {
			"width": elementWidthPattern[0],
			"height": elementHeightPattern[0],
			"x": elementXPattern[0],
			"y": elementYPattern[0],
			"id": elementId
		};

		elementPatterns[elementId] = patterns;

		console.log(patterns);
	}

	//return elementPatterns;

	var arrayOfElementRules = Object.values(elementPatterns);
	for(var i = 0; i < arrayOfElementRules.length; i++){
		var elementRuleSet = arrayOfElementRules[i];
		var cssRuleString = createCSSRule(elementRuleSet);
		cssRules.push(cssRuleString);
	}
	
	console.log("updateCSSRules called");
};
/*var updateCSSRules = function(){
	cssRules = [];
	var arrayOfElementRules = Object.values(elementRules);
	for(var i = 0; i < arrayOfElementRules.length; i++){
		var elementRuleSet = arrayOfElementRules[i];
		var cssRuleString = createCSSRule(elementRuleSet);
		cssRules.push(cssRuleString);
	}
};*/

var comparePageWidths = function(a, b) {
  if (a["pageWidth"] < b["pageWidth"]) {
    return -1;
  }
  if (a["pageWidth"] > b["pageWidth"]) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

var comparePageHeights = function(a, b) {
  if (a["pageHeight"] < b["pageHeight"]) {
    return -1;
  }
  if (a["pageHeight"] > b["pageHeight"]) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

//var determinePattern = function(dataPoints, getDatumOfInterest, attributeName){
// axisName is "pageWidth" or "pageHeight"
var determinePattern = function(dataPoints, attributeName, axisName){
	// sort dataPoints by pageWidth value
	dataPoints.sort(comparePageWidths);
	
	var elementSelector = dataPoints[0]["id"];

	// for left and for right (separately)
	// Let's do "left" first
	// possibly only 1 of left/right will follow a behavior based on pageWidth; possibly only 2/3 of left/right/elementWidth could follow a behavior based on pageWidth
	// if there are no adjacent pairs with the same slope, assume there is no pageWidth-based pattern for that property (left or right)

	var slopes = [];

	// compute slopes
	for(var i = 1; i < dataPoints.length; i++){
		var point1 = dataPoints[i-1];
		var point2 = dataPoints[i];

		//var leftPageWidthSlope = (point2["left"] - point1["left"])/(point2["pageWidth"] - point1["pageWidth"]);
		//var leftPageWidthSlope = (getDatumOfInterest(point2, attributeName) - getDatumOfInterest(point1, attributeName))/(point2["pageWidth"] - point1["pageWidth"]);
		var leftPageWidthSlope = (point2[attributeName] - point1[attributeName])/(point2[axisName] - point1[axisName]);
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
	
	var chunkLineFitData = [];

	/*if(dataPoints.length > 4 && chunkStartIndices.length == (dataPoints.length - 1)){
		// If we have more than 4 datapoints and no adjacent datapoint pairs have the same slope
		// Probably means no pattern for "left"
		// Right now using "> 4" because potentially a user could provide 4 examples (e0, e1, e2, e3)
		// the inner 2 (e1 and e2) to specify the slope/relationship between an element property and the page width,
		// and then the outer 2 pairs (e0 with e1, and e2 with e3) to specify min and max values of the element property
		// (where e0 and e1 have the same element property value, and likewise for e2 with e3)

		// Or maybe get rid of this "> 4" thing. Maybe in processDataPoints just compare all possible patterns,
		// and for left/right in particular, take the one with the fewest number of chunks?
		// (a CSS rule can't have both left/right, it doesn't make sense)

		return noPattern;
	}else{*/
		// There are patterns and chunks larger than 2 data points. Let's solve system of equations for each chunk
	
	for(var i = 0; i < chunkStartIndices.length; i++){
		// Choose any 2 arbitrary points in the chunk (for ease, just the first two), and fit a line to them
		// equation: y = m*x + c
		// matrix multiplication for this? or just quick formula
		var pointIndex1 = chunkStartIndices[i];
		var pointIndex2 = pointIndex1 + 1;
		var point1 = dataPoints[pointIndex1];
		var point2 = dataPoints[pointIndex2];

		//var pointData = [ [point1["pageWidth"], point1["left"]], [point2["pageWidth"], point2["left"]] ];
		var pointData = [ [point1[axisName], point1[attributeName]], [point2[axisName], point2[attributeName]] ];
		result = regression.linear(pointData);
		var m = result.equation[0];
		var c = result.equation[1];

		var chunkStart = point1[axisName];
		var chunkEnd;
		if(i < chunkStartIndices.length - 1){
			chunkEnd = dataPoints[chunkStartIndices[i+1]][axisName];
		}else{
			chunkEnd = dataPoints[dataPoints.length - 1][axisName];
		}

		chunkLineFitData.push( { "m": m, "b": c, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector } );
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
}

// ------------ Constants ------------
var constantUnit = "px";

// ------------ State ------------
// View raw data
var views = [];
var viewCounter = 0;

// var createElementObj = function(id, x, y, width, height, color){
var view0 = createViewObj(1480, 800);
view0["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view0["elements"].push(createElementObj(1, 600, 300, 296, 400, "red"));
views.push(view0);

var view1= createViewObj(740, 800);
view1["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view1["elements"].push(createElementObj(1, 600, 300, 148, 400, "red"));
views.push(view1);

// Rules
var elementRules = {};
// give a default rule for each property of each element (probably constant)
var viewPageWidth = views[0]["pageWidth"];
var viewPageHeight = views[0]["pageHeight"];
for(var i = 0; i < views[0]["elements"].length; i++){
	var elementObj = views[0]["elements"][i];

	var elementRuleObj = {};
	/*elementRuleObj["id"] = elementObj["id"];
	// Element x
	elementRuleObj["x"] = {
		"rule": "constant", // could be "constant", "ratio", or "inconsistent"
		"value": elementObj["x"] // if "rule" were "ratio", "value" would be elementObj["x"]/viewPageWidth
	};

	// Element y
	elementRuleObj["y"] = {
		"rule": "constant",
		"value": elementObj["y"]
	};

	// Element width
	elementRuleObj["width"] = {
		"rule": "constant",
		"value": elementObj["width"]
	};

	// Element height
	elementRuleObj["height"] = {
		"rule": "constant",
		"value": elementObj["height"]
	};*/

	elementRuleObj["id"] = elementObj["id"];
	// Element x
	elementRuleObj["x"] = {
		"m": 0,
		"b": elementObj["x"]
	};

	// Element y
	elementRuleObj["y"] = {
		"m": 0,
		"b": elementObj["y"]
	};

	// Element width
	elementRuleObj["width"] = {
		"m": 0,
		"b": elementObj["width"]
	};

	// Element height
	elementRuleObj["height"] = {
		"m": 0,
		"b": elementObj["height"]
	};

	elementRules[elementObj["id"]] = elementRuleObj;
	//elementRules.push(elementRuleObj);
}

// List of CSS-style rules as strings, e.g. "#element0 { width: 5px; height: 10px; position: absolute; left: 20px}"
var cssRules = [];
/*var arrayOfElementRules = Object.values(elementRules);
for(var i = 0; i < arrayOfElementRules.length; i++){
	var elementRuleSet = arrayOfElementRules[i];
	var cssRuleString = createCSSRule(elementRuleSet);
	cssRules.push(cssRuleString);
}*/

updateCSSRules();

/*for(var i = 0; i < views[0]["elements"].length; i++){
	var elementObj = views[0]["elements"][i];
	var elementRuleSet = elementRules[elementObj["id"]];
	var cssRuleString = createCSSRule(elementRuleSet);
	cssRules.push(cssRuleString);
}*/