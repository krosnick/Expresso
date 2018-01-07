var noPattern = "No pattern";
var constantUnit = "px";
var regression = require('regression');
/*// propertyValue could be a position (e.g., left, top) or a dimension (i.e., element width or height), or possibly other things
// dataPoints is a list of [pageWidth, pageHeight, propertyValue] triplets
var processDataPoints = function(dataPoints){
	// Identify chunks; if propertyValue is the same for 2+ points in the same dimension (x or y), then cutoff point (or min/max value)
	// Chunks of linear pieces of the graph (perhaps compute slopes of adjacent pairs and compare); but how to do in 2D?

	// Should we try solving with only one dimension first? Only pageWidth or only pageHeight? Should we try both and see if there's a solution to either?

	// Try solving z = a*x + b*y + c system of equations first
}*/

// dataPoints is a list of {"pageWidth": pageWidth, "left": left, "right": right, "elementWidth": elementWidth} objects
// Note that "left" and "right" are the computed left and right values, not necessarily CSS rules
// Making assumption that left, right, and width values could depend only on page width (and not page height, and not necessarily elementWidth)
/*var processDataPoints = function(dataPoints){

	// sort dataPoints by pageWidth value
	dataPoints.sort(comparePageWidths);
	console.log(dataPoints);

	// for left and for right (separately)
	// Let's do "left" first
	// possibly only 1 of left/right will follow a behavior based on pageWidth; possibly only 2/3 of left/right/elementWidth could follow a behavior based on pageWidth
	// if there are no adjacent pairs with the same slope, assume there is no pageWidth-based pattern for that property (left or right)

	var slopes = [];

	// compute slopes
	for(var i = 1; i < dataPoints.length; i++){
		var point1 = dataPoints[i-1];
		var point2 = dataPoints[i];

		var leftPageWidthSlope = (point2["left"] - point1["left"])/(point2["pageWidth"] - point1["pageWidth"]);
		slopes.push(leftPageWidthSlope);
	}
	console.log(slopes);

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
	console.log(chunkStartIndices);

	var chunkLineFitData = [];

	if(dataPoints.length > 2 && chunkStartIndices.length == (dataPoints.length - 1)){
		// If we have more than 2 datapoints and no adjacent datapoint pairs have the same slope
		// Probably means no pattern for "left"
		console.log("No pattern for left");
	}else{
		// There are patterns and chunks larger than 2 data points. Let's solve system of equations for each chunk
		for(var i = 0; i < chunkStartIndices.length; i++){
			// Choose any 2 arbitrary points in the chunk (for ease, just the first two), and fit a line to them
			// equation: y = m*x + c
			// matrix multiplication for this? or just quick formula
			var pointIndex1 = chunkStartIndices[i];
			var pointIndex2 = pointIndex1 + 1;
			var point1 = dataPoints[pointIndex1];
			var point2 = dataPoints[pointIndex2];

			var pointData = [ [point1["pageWidth"], point1["left"]], [point2["pageWidth"], point2["left"]] ];
			result = regression.linear(pointData);
			var m = result.equation[0];
			var c = result.equation[1];
			chunkLineFitData.push({ "m": m, "c": c });
		}
		console.log(chunkLineFitData);
	}


	// Identify chunks; if propertyValue is the same for 2+ points in the same dimension (x or y), then cutoff point (or min/max value)
	// Chunks of linear pieces of the graph (perhaps compute slopes of adjacent pairs and compare);

	// sort by pageWidth

	// determine slope for adjacent points
	// if adjacent pairs of slopes are different, then break into media queries
	// identify largest chunks of data points with same slope
	// for each chunk, solve y = a*x + b; now for that chunk we can calculate CSS values

}*/

var getDatumOfInterest = function(dataPoint, attributeName){
	return dataPoint[attributeName];
}

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

var determinePattern = function(dataPoints, getDatumOfInterest, attributeName){
	// sort dataPoints by pageWidth value
	dataPoints.sort(comparePageWidths);
	//console.log("dataPoints");
	//console.log(dataPoints);

	var elementSelector = dataPoints[0]["elementSelector"];

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
		var leftPageWidthSlope = (getDatumOfInterest(point2, attributeName) - getDatumOfInterest(point1, attributeName))/(point2["pageWidth"] - point1["pageWidth"]);
		slopes.push(leftPageWidthSlope);
	}
	//console.log(slopes);

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
	//console.log(chunkStartIndices);

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

		//console.log("No pattern for left");
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
		var pointData = [ [point1["pageWidth"], getDatumOfInterest(point1, attributeName)], [point2["pageWidth"], getDatumOfInterest(point2, attributeName)] ];
		result = regression.linear(pointData);
		var m = result.equation[0];
		var c = result.equation[1];

		var chunkStart = point1["pageWidth"];
		var chunkEnd;
		if(i < chunkStartIndices.length - 1){
			chunkEnd = dataPoints[chunkStartIndices[i+1]]["pageWidth"];
		}else{
			chunkEnd = dataPoints[dataPoints.length - 1]["pageWidth"];
		}

		chunkLineFitData.push( { "m": m, "c": c, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector } );
	}
	//console.log(chunkLineFitData);
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

// dataPoints is a list of {"pageWidth": pageWidth, "left": left, "right": right, "elementWidth": elementWidth} objects
// Note that "left" and "right" are the computed left and right values, not necessarily CSS rules
// Making assumption that left, right, and width values could depend only on page width (and not page height, and not necessarily elementWidth)
var processDataPoints = function(dataPoints){
	
	var elementSelector = dataPoints[0]["elementSelector"];

	var leftPatternInfo = determinePattern(examplePoints, getDatumOfInterest, "left");
	console.log("leftPatternInfo");
	console.log(leftPatternInfo);
	console.log("\n");

	var rightPatternInfo = determinePattern(examplePoints, getDatumOfInterest, "right");
	console.log("rightPatternInfo");
	console.log(rightPatternInfo);
	console.log("\n");

	var leftRightPattern;
	if(leftPatternInfo.length > rightPatternInfo.length){ // We want the pattern with fewer chunks (stronger pattern)
		//leftRightPattern = rightPatternInfo;
		leftRightPattern = "right";
		console.log("rightPatternInfo chosen");
	}else{
		//leftRightPattern = leftPatternInfo;
		leftRightPattern = "left";
		console.log("leftPatternInfo chosen");
	}

	var elementWidthPatternInfo = determinePattern(examplePoints, getDatumOfInterest, "elementWidth");
	console.log("elementWidthPatternInfo");
	console.log(elementWidthPatternInfo);
	console.log("\n");

	return {
		"leftRightPattern": leftRightPattern,
		"leftPatternInfo": leftPatternInfo,
		"rightPatternInfo": rightPatternInfo,
		"elementWidthPatternInfo": elementWidthPatternInfo,
		"elementSelector": elementSelector
	}

	/*return {
		"leftRightPattern": leftRightPattern,
		"elementWidthPatternInfo": elementWidthPatternInfo
	}*/

}

var createValue = function(m, c){
	var valueString;
	if(m == 0 && c == 0){
		valueString = "0";
	}else if(m == 0){
		valueString = "" + c + constantUnit;
	}else if(c == 0){
		valueString = "" + (m * 100) + "vw";
	}else{
		valueString = "" + (m * 100) + "vw + " + c + constantUnit;
	}
	return valueString;
}

var createPropertyValueString = function(property, value){
	return "" + property + ": " + value + ";";
}

var createRule = function(selector, propertyValueStringList){
	var rule = "" + selector + "{\n";
	//rule = rule.concat(...propertyValueStringList);

	for(var i = 0; i < propertyValueStringList.length; i++){
		rule += propertyValueStringList[i] + "\n";
	}
	rule += "}";

	return rule;
}

var generateCSSFromExamples = function(dataPoints){
	var processedData = processDataPoints(examplePoints);
	console.log(processedData);

	var elementSelector = processedData["elementSelector"];

	var cssPropertyValueStringList = [];

	// Assume only one chunk/pattern right now for each element property
	var elementWidthPatternInfo = processedData["elementWidthPatternInfo"][0];
	var elementWidthValueString = createValue(elementWidthPatternInfo["m"], elementWidthPatternInfo["c"]);
	var elementWidthPropertyValueString = createPropertyValueString("width", elementWidthValueString);
	cssPropertyValueStringList.push(elementWidthPropertyValueString);

	var cssSolutionString = "";

	var leftRightPattern = processedData["leftRightPattern"];
	if(leftRightPattern == "left"){
		var leftPatternInfo = processedData["leftPatternInfo"][0];
		var leftPatternValueString = createValue(leftPatternInfo["m"], leftPatternInfo["c"]);
		var leftPatternPropertyValueString = createPropertyValueString("left", leftPatternValueString);
		cssPropertyValueStringList.push(leftPatternPropertyValueString);
	}else{ // == "right"
		var rightPatternInfo = processedData["leftPatternInfo"][0];
		var rightPatternValueString = createValue(leftPatternInfo["m"], leftPatternInfo["c"]);
		var rightPatternPropertyValueString = createPropertyValueString("left", leftPatternValueString);
		cssPropertyValueStringList.push(rightPatternPropertyValueString);
	}

	var positionPropertyValueString = createPropertyValueString("position", "relative");
	cssPropertyValueStringList.push(positionPropertyValueString);

	var cssRule = createRule(elementSelector, cssPropertyValueStringList);
	console.log("\n");
	console.log(cssRule);
}

//----------------------------------------------------------------------------

// Left pattern
//[ 0, 0, 0.05, 0.05, 0, 0, 0 ]
//[ 0, 2, 4 ]
//[ { m: 0, c: 25 }, { m: 0.05, c: 0 }, { m: 0, c: 75 } ]
/*var examplePoints = [
{"pageWidth": 1000, "left": 50, "right": 850, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 1500, "left": 75, "right": 1375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 500, "left": 25, "right": 375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 250, "left": 25, "right": 375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 0, "left": 25, "right": 375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 1750, "left": 75, "right": 1375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 2000, "left": 75, "right": 1375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 2001, "left": 75, "right": 1375, "elementWidth": 100, "elementSelector": ".myBox"},
];*/


// No left pattern
/*var examplePoints = [
  { "pageWidth": 0, "left": 25, "right": 375, "elementWidth": 100 },
  { "pageWidth": 250, "left": 26, "right": 375, "elementWidth": 100 },
  { "pageWidth": 500, "left": 24, "right": 375, "elementWidth": 100 },
  { "pageWidth": 1000, "left": 50, "right": 850, "elementWidth": 100 },
  { "pageWidth": 1500, "left": 73, "right": 1375, "elementWidth": 100 },
  { "pageWidth": 1750, "left": 74, "right": 1375, "elementWidth": 100 },
  { "pageWidth": 2000, "left": 28, "right": 1375, "elementWidth": 100 },
  { "pageWidth": 2001, "left": 28, "right": 1375, "elementWidth": 100 } ];*/

// Single slope/pattern
var examplePoints = [
{"pageWidth": 1000, "left": 50, "right": 850, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 1500, "left": 75, "right": 1375, "elementWidth": 100, "elementSelector": ".myBox"},
{"pageWidth": 500, "left": 25, "right": 375, "elementWidth": 100, "elementSelector": ".myBox"}
];

//processDataPoints(examplePoints);
//determinePattern(examplePoints, getDatumOfInterest, "left");
generateCSSFromExamples(examplePoints);