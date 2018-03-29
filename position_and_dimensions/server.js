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

/*app.post('/cloneOriginal', function(req, res) {
	var clonedView = cloneViewObj();
	views[clonedView["id"]] = clonedView;
	
	writeDataToJSONFile();
	
	// Send back to client
	res.json({
		"view": clonedView
	});
});*/

app.post('/createKeyframe', function(req, res) {
	/*var clonedView = cloneViewObj();
	views[clonedView["id"]] = clonedView;*/
	var viewObj = req.body.oldView;

	var newViewId = viewCounter;
	viewObj["oldViewId"] = newViewId;
	viewCounter++;

	updateData(viewObj);
	
	writeDataToJSONFile();

	// Send back to client
	res.json({
		"newView": views[newViewId],
		"views": Object.values(views)
	});
	/*res.json({
		"view": clonedView
	});*/
});

app.post('/deleteKeyframe', function(req, res){
	var viewIdToDelete = parseInt(req.body.viewId);

	// Sort views and choose one adjacent to viewIdToDelete
	var viewObjArray = Object.values(views);
	viewObjArray.sort(comparePageWidths);

	var viewToReturn; // The next smallest view compared to viewIdToDelete
	for(var i = 1; i < viewObjArray.length; i++){
		var viewObj = viewObjArray[i];
		var viewObjId = viewObj["id"];
		if(viewObjId == viewIdToDelete){
			viewToReturn = viewObjArray[i-1];
		}
	}

	if(!viewToReturn){
		// Means that the viewIdToDelete was the smallest one
		// We'll choose the new smallest view as the one to show
		viewToReturn = viewObjArray[1];
	}

	delete views[viewIdToDelete];

	/*// For simplicity, make viewToReturn the leftmost one/first in Object.values(views)[0]?
	var viewToReturn = Object.values(views)[0];*/

	// Should return adjacent view
	//var viewToReturn = ;

	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}
	confirmHasTransitionProperty();

	writeDataToJSONFile();

	// Based on the remaining keyframes, should update CSS rules
	updateCSSRules();

	res.json({
		"nextViewToShow": viewToReturn,
		"cssRules": cssRules
	});
});

/*app.post('/view', function(req, res){
	updateElementAndPageData(req.body.oldView);

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]
	});
});*/

app.post('/view', function(req, res){
	if(req.body.oldView.oldViewId){
		updateElementAndPageData(req.body.oldView);
	}

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]
	});
});

app.post("/updateData", function(req, res){
	/*updateElementAndPageData(req.body.oldView);

	// For each view, call convertClientDataToInts(req.body.oldView);
	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}
	confirmHasTransitionProperty();
	
	writeDataToJSONFile();

	// Based on all keyframes, should update element and css rules here
	updateCSSRules();*/

	updateData(req.body.oldView);
	
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

var updateData = function(viewObj){
	updateElementAndPageData(viewObj);

	// For each view, call convertClientDataToInts(req.body.oldView);
	var viewIds = Object.keys(views);
	for(var i = 0; i < viewIds.length; i++){
		var viewId = viewIds[i];
		convertClientDataToInts(views[viewId]);
	}
	confirmHasTransitionProperty();
	
	writeDataToJSONFile();

	// Based on all keyframes, should update element and css rules here
	updateCSSRules();
}

var convertClientDataToInts = function(viewObj){
	var elementsData = viewObj["elements"];
	for(var i = 0; i < elementsData.length; i++){
		var element = elementsData[i];
		var elementBehaviorKeyValues = Object.entries(elementDataFormat);
		for(var behaviorIndex = 0; behaviorIndex < elementBehaviorKeyValues.length; behaviorIndex++){
			var behaviorKeyAndValue = elementBehaviorKeyValues[behaviorIndex];
			var behaviorName = behaviorKeyAndValue[0];
			var elementBehaviorDictOfOptions = element[behaviorName];
			//if(elementBehaviorDictOfOptions){
			if(elementBehaviorDictOfOptions !== undefined && elementBehaviorDictOfOptions !== null){
				var elementBehaviorListOfOptions = Object.keys(elementBehaviorDictOfOptions);
				for(var optionIndex = 0; optionIndex < elementBehaviorListOfOptions.length; optionIndex++){
					var propertyOptionName = elementBehaviorListOfOptions[optionIndex];
					var propertyOptionValue = elementBehaviorDictOfOptions[propertyOptionName];
					if(typeof(propertyOptionValue) === "string" && propertyOptionName !== "left-transition" && propertyOptionName !== "right-transition"){
						var parseClientDataFunc = elementDataFormat[behaviorName]["parseClientData"];
						var parsedClientData = parseClientDataFunc(propertyOptionValue);
						element[behaviorName][propertyOptionName] = parsedClientData;
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
					// Doesn't have "left-transition" property?
					if(!elementBehaviorDictOfOptions["left-transition"]){
						element[behaviorName]["left-transition"] = defaultTransition;
					}
					// Doesn't have "right-transition" property?
					if(!elementBehaviorDictOfOptions["right-transition"]){
						element[behaviorName]["right-transition"] = defaultTransition;
					}
				}
			}
		}
	}
};

var confirmHasVisibilityProperty = function(){
	var viewIds = Object.keys(views);
	for(var keyframeIndex = 0; keyframeIndex < viewIds.length; keyframeIndex++){
		var viewId = viewIds[keyframeIndex];
		var viewObj = views[viewId];
		var elementsData = viewObj["elements"];
		for(var i = 0; i < elementsData.length; i++){
			var element = elementsData[i];
			if(!element["visibility"] || !element["visibility"]["visibility"]){
				// If "visibility" isn't set, set it to "visible"
				//element["visibility"]["visibility"] = "visible";
				element["visibility"] = {
					"visibility": "visible"
				};
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

	views[oldViewIdAsInt] = {
		"id": viewId,
		"pageWidth": parseInt(viewWidth),
		"pageHeight": parseInt(viewHeight),
		"elements": viewElementsData
	};

	// Now need to update adjacent keyframes transitions (to make sure they are consistent)

	// Sort
	var viewObjArray = Object.values(views);
	viewObjArray.sort(comparePageWidths);

	// Find index of current keyframe (i.e., the one we're updating on the server)
	var currentKeyframeIndex = -1;
	for(var i = 0; i < viewObjArray.length; i++){
		if(viewObjArray[i]["pageWidth"] == parseInt(viewWidth)){
			currentKeyframeIndex = i;
		}
	}

	// Update left keyframe's "right-transition" values to be this keyframe's "left-transition" values
	if(currentKeyframeIndex > 0){ // Is there a keyframe to the left?
		var leftKeyframeElements = viewObjArray[currentKeyframeIndex-1]["elements"];

		// Loop through current keyframe's elements/properties; for each left-transition, update left keyframe's right-transition
		for(var i = 0; i < viewElementsData.length; i++){
			var element = viewElementsData[i];
			// Can we assume elements have the same order for each keyframe?
			var elementBehaviorKeyValues = Object.entries(elementDataFormat);
			for(var behaviorIndex = 0; behaviorIndex < elementBehaviorKeyValues.length; behaviorIndex++){
				var behaviorKeyAndValue = elementBehaviorKeyValues[behaviorIndex];
				var behaviorName = behaviorKeyAndValue[0];
				if(element[behaviorName]){
					var currentKeyframeBehaviorLeftTransition = element[behaviorName]["left-transition"];
					//leftKeyframeElements[behaviorName]["right-transition"] = currentKeyframeBehaviorLeftTransition;
					leftKeyframeElements[i][behaviorName]["right-transition"] = currentKeyframeBehaviorLeftTransition;
				}
			}
		}
	}

	// Update right keyframe's "left-transition" values to be this keyframe's "right-transition" values
	if(currentKeyframeIndex < viewObjArray.length-1){ // Is there a keyframe to the right?
		var rightKeyframeElements = viewObjArray[currentKeyframeIndex+1]["elements"];

		// Loop through current keyframe's elements/properties; for each right-transition, update right keyframe's left-transition
		for(var i = 0; i < viewElementsData.length; i++){
			var element = viewElementsData[i];
			var elementBehaviorKeyValues = Object.entries(elementDataFormat);
			for(var behaviorIndex = 0; behaviorIndex < elementBehaviorKeyValues.length; behaviorIndex++){
				var behaviorKeyAndValue = elementBehaviorKeyValues[behaviorIndex];
				var behaviorName = behaviorKeyAndValue[0];
				if(element[behaviorName]){
					var currentKeyframeBehaviorRightTransition = element[behaviorName]["right-transition"];
					//rightKeyframeElements[behaviorName]["left-transition"] = currentKeyframeBehaviorRightTransition;
					rightKeyframeElements[i][behaviorName]["left-transition"] = currentKeyframeBehaviorRightTransition;
				}
			}
		}
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

/*var cloneViewObj = function(){
	var firstViewCurrently = getFirstViewObj();
	var clonedView = Object.assign({}, firstViewCurrently);
	clonedView["id"] = viewCounter;
	viewCounter++;
	return clonedView;
};*/

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

						var propertiesList = elementDataFormat[behaviorName]["properties"];
						for(var propertyIndex = 0; propertyIndex < propertiesList.length; propertyIndex++){
							var propertyName = propertiesList[propertyIndex];
							// Hacky: Maybe test it out first to see if this property exists in this set of keyframes?
							if(keyframesDataForThisElement[0][behaviorName][propertyName] !== undefined){
								var elementPropertyPattern = determinePattern(keyframesDataForThisElement, behaviorName, propertyName, pageDim);
								
								// Maybe should bring this back if bugs persist
								
								// Hacky: For now, if behavior is y and element is an image, only support "top" property
								/*if(elementImageRatio && behaviorName === "y"){
									if(propertyName === "top"){
										chosenElementPropertyPattern = elementPropertyPattern;
										chosenPropertyName = propertyName;
									}
								}else{
									if(chosenElementPropertyPattern === undefined || elementPropertyPattern.length < chosenElementPropertyPattern.length){
										chosenElementPropertyPattern = elementPropertyPattern;
										chosenPropertyName = propertyName;
									}
								}*/
								
								
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

/*var comparePageHeights = function(a, b) {
  if (a["pageHeight"] < b["pageHeight"]) {
    return -1;
  }
  if (a["pageHeight"] > b["pageHeight"]) {
    return 1;
  }
  // a must be equal to b
  return 0;
};*/

// axisName is "pageWidth" or "pageHeight"
var determinePattern = function(dataPoints, behaviorName, propertyName, axisName){

	var elementSelector = dataPoints[0]["id"];
	var chunkLineFitData = [];
	// Push an undefined for each chunk interval (external and internal) and each keyframe
	// So there will be 2*(dataPoints.length)+1
	// Indexing into this to get ith interval: 2*i
	// Indexing into this to get ith keyframe: 2*i+1
	for(var i = 0; i < 2*(dataPoints.length)+1; i++){
		chunkLineFitData.push(undefined);
	}

	var conciseChunkLineFitData = [];

	if(dataPoints.length == 1){
		// If one point only, assume properties will remain constant throughout all viewport sizes
		var chunkStart = dataPoints[0][axisName];
		var chunkEnd = dataPoints[0][axisName];

		var ruleDataObj = {
			"start": chunkStart,
			"end": chunkEnd,
			"containsStart": true,
			"containsEnd": true,
			"elementSelector": elementSelector
		};

		var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
		var valueData = getSingleKeyframeRuleFunc(dataPoints[0][behaviorName][propertyName]);
		ruleDataObj["valueData"] = valueData;
		var keyframeRuleIndex = 2 * 0 + 1; // === 1
		chunkLineFitData[keyframeRuleIndex] = ruleDataObj;
		conciseChunkLineFitData.push(ruleDataObj);
	}else{
		// sort dataPoints by pageWidth value
		dataPoints.sort(comparePageWidths);

		// a chunk index i represents the behavior between the ith and (i+1)th keyframes 

		var chunksIndicesToBeAddressInSecondIteration = [];

		// First round of computing rules; only compute for linear interpolation segments and for leftmost and rightmost keyframes
		for(var i = 0; i < dataPoints.length-1; i++){
			// Choose any 2 arbitrary points in the chunk (for ease, just the first two), and fit a line to them
			// equation: y = m*x + c
			// matrix multiplication for this? or just quick formula
			var pointIndex1 = i;
			var pointIndex2 = pointIndex1+1;
			var point1 = dataPoints[pointIndex1];
			var point2 = dataPoints[pointIndex2];

			/*var point1Transition = point1[behaviorName]["transition"];
			var point2Transition = point2[behaviorName]["transition"];*/

			// Process one segment transition at a time
			var point1Transition = point1[behaviorName]["right-transition"];
			var point2Transition = point2[behaviorName]["left-transition"];
			// These should be the same! Maybe print out to confirm
			// Let's just use point1Transition?

			var chunkStart = point1[axisName];
			var chunkEnd = point2[axisName];

			// (In first round, only compute for linear interpolation segments and for leftmost and rightmost keyframes)
			// (will come back and fill in other chunks in second round)

			// For continuous behaviors, if linear interpolation
			// This should only be possible for continuous behaviors; shouldn't happen for discrete behaviors (we won't allow these adjacent rules)
			//var isLinearInterpolation = (point1Transition === "smoothRight" || point1Transition === "smoothBoth") && (point2Transition === "smoothLeft" || point2Transition === "smoothBoth");
			var isLinearInterpolation = (point1Transition === "left-closed-right-closed");
			if(isLinearInterpolation){
				var ruleDataObj = {
					"start": chunkStart,
					"end": chunkEnd,
					"containsStart": true,
					"containsEnd": true,
					"elementSelector": elementSelector
				};
				var valueData = Continuous["getLinearInterpolationRule"](point1, point2, behaviorName, propertyName, axisName);
				ruleDataObj["valueData"] = valueData;
				//var index = 2 * i + 2;
				var index = 2 * pointIndex1 + 2;
				chunkLineFitData[index] = ruleDataObj;
			}else{
				chunksIndicesToBeAddressInSecondIteration.push(i);
			}
		}

		// Second round
		// Iterate through chunksIndicesToBeAddressInSecondIteration and set rules
		// These are inner chunks
		for(var i = 0; i < chunksIndicesToBeAddressInSecondIteration.length; i++){
			var pointIndex1 = chunksIndicesToBeAddressInSecondIteration[i];
			var pointIndex2 = pointIndex1 + 1;
			var point1 = dataPoints[pointIndex1];
			var point2 = dataPoints[pointIndex2];

			/*var point1Transition = point1[behaviorName]["transition"];
			var point2Transition = point2[behaviorName]["transition"];*/
			var point1Transition = point1[behaviorName]["right-transition"];
			var point2Transition = point2[behaviorName]["left-transition"];

			var chunkStart = point1[axisName];
			var chunkEnd = point2[axisName];

			var leftClosedRightOpen = (point1Transition === "left-closed-right-open");
			var leftOpenRightClosed = (point1Transition === "left-open-right-closed");
			//if((point1Transition === "smoothRight" || point1Transition === "smoothBoth") && (point2Transition !== "smoothLeft" && point2Transition !== "smoothBoth")){
			if(leftClosedRightOpen){
				// If this segment is connected to the left keyframe, but disconnected from the right keyframe
				var ruleDataObj = {
					"start": chunkStart,
					"end": chunkEnd,
					"containsStart": true,
					"containsEnd": false,
					"elementSelector": elementSelector
				};

				// Use rule from previous chunk
				var prevChunkIndex = pointIndex1 * 2;
				
				var propertyValue = point1[behaviorName][propertyName];
				if(chunkLineFitData[prevChunkIndex]){ // If the previous chunk exists, use its rule
					var valueData = chunkLineFitData[prevChunkIndex]["valueData"];
					var getDeepCopyFunc = elementDataFormat[behaviorName]["type"]["getDeepCopy"];
					ruleDataObj["valueData"] = getDeepCopyFunc(valueData, propertyValue);
				}else{
					// The previous chunk doesn't exist yet (should only be if index 0 (before first keyframe) isn't defined yet),
					// so will have to use constant value at the left keyframe
					var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
					var valueData = getSingleKeyframeRuleFunc(propertyValue);
					ruleDataObj["valueData"] = valueData;
				}
				var ruleIndex = 2 * pointIndex1 + 2;
				chunkLineFitData[ruleIndex] = ruleDataObj;
			//}else if((point1Transition !== "smoothRight" && point1Transition !== "smoothBoth") && (point2Transition === "smoothLeft" || point2Transition === "smoothBoth")){
			}else if(leftOpenRightClosed){
				// If this segment is connected to the right keyframe, but disconnected from the left keyframe
				var ruleDataObj = {
					"start": chunkStart,
					"end": chunkEnd,
					"containsStart": false,
					"containsEnd": true,
					"elementSelector": elementSelector
				};

				// Use rule from next chunk
				var nextChunkIndex = pointIndex2 * 2 + 2;
				
				var propertyValue = point2[behaviorName][propertyName];
				if(chunkLineFitData[nextChunkIndex]){ // If the next chunk exists, use its rule
					var valueData = chunkLineFitData[nextChunkIndex]["valueData"];
					var getDeepCopyFunc = elementDataFormat[behaviorName]["type"]["getDeepCopy"];
					ruleDataObj["valueData"] = getDeepCopyFunc(valueData, propertyValue);
				}else{
					// The next chunk doesn't exist yet, so will have to use constant value at the right keyframe
					/*ruleDataObj["valueData"] = {
						"m": 0,
						"b": propertyValue
					}*/

					var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
					var valueData = getSingleKeyframeRuleFunc(propertyValue);
					ruleDataObj["valueData"] = valueData;

				}
				var ruleIndex = 2 * pointIndex1 + 2;
				chunkLineFitData[ruleIndex] = ruleDataObj;
			}else{
				// This state isn't possible
				console.log("not possible");
			}

			// TODO
			// In the second round, do we also need to check whether each keyframe is contained within one of the adjacent chunks?
				// We would do this only for inner keyframes (i=1 through i=length-2)?
				// Outer keyframes (i=0 and i=length-1) will at the very least be covered in the third round (where we cover the outer chunks)
			// We can do this for just point1 in each iteration for example;
			// can check if point1 is contained in the previous chunk rule or the chunk rule being created right now;
			// if neither, should add a special single point rule for it
			
			// Check if contained in before chunk
			// 2 * pointIndex1
			//console.log(chunkLineFitData[2 * pointIndex1]);
			//var chunkBeforeContains = chunkLineFitData[2 * pointIndex1]["containsEnd"];
			var chunkBeforeContains = false;
			if(chunkLineFitData[2 * pointIndex1] && chunkLineFitData[2 * pointIndex1]["containsEnd"]){
				chunkBeforeContains = true;
			}

			// Check if contained in after chunk
			// 2 * pointIndex1 + 2;
			//var chunkAfterContains = chunkLineFitData[2 * pointIndex1 + 2]["containsStart"];
			var chunkAfterContains = false;
			if(chunkLineFitData[2 * pointIndex1 + 2] && chunkLineFitData[2 * pointIndex1 + 2]["containsStart"]){
				chunkAfterContains = true;
			}

			if(!chunkBeforeContains && !chunkAfterContains){
				var ruleDataObj = {
					"start": point1[axisName],
					"end": point1[axisName],
					"containsStart": true,
					"containsEnd": true,
					"elementSelector": elementSelector
				};
				var propertyValue = point1[behaviorName][propertyName];
				var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
				var valueData = getSingleKeyframeRuleFunc(propertyValue);
				ruleDataObj["valueData"] = valueData;
				chunkLineFitData[2 * pointIndex1 + 1] = ruleDataObj;
			}

		}

		// Third round - outer chunks
		// Chunk before the first keyframe
		var pointIndex = 0;
		var point = dataPoints[pointIndex];
		//var pointTransition = point[behaviorName]["transition"];
		var pointTransition = point[behaviorName]["right-transition"];
		var chunkStart = point[axisName]; // On the client will be treated as applying to left of the keyframe too
		var chunkEnd = point[axisName];
		var ruleDataObj = {
			"start": chunkStart,
			"end": chunkEnd,
			"containsStart": true,
			"containsEnd": true,
			"elementSelector": elementSelector
		};
		//if(pointTransition === "smoothRight" || pointTransition === "smoothBoth"){
		if(pointTransition === "left-closed-right-closed" || pointTransition === "left-closed-right-open"){
			// If the first keyframe is connected to its right chunk, then use this rule
			var rightChunkRuleIndex = 2;
			var valueData = chunkLineFitData[rightChunkRuleIndex]["valueData"];
			var propertyValue = point[behaviorName][propertyName];
			var getDeepCopyFunc = elementDataFormat[behaviorName]["type"]["getDeepCopy"];
			ruleDataObj["valueData"] = getDeepCopyFunc(valueData, propertyValue);
		}else{
			// If the first keyframe is disconnected from its right chunk, then just use constant value
			var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
			var valueData = getSingleKeyframeRuleFunc(point[behaviorName][propertyName]);
			ruleDataObj["valueData"] = valueData;
		}
		chunkLineFitData[0] = ruleDataObj;


		// Chunk after the last keyframe
		var pointIndex = dataPoints.length-1;
		var point = dataPoints[pointIndex];
		//var pointTransition = point[behaviorName]["transition"];
		var pointTransition = point[behaviorName]["left-transition"];
		var chunkStart = point[axisName]; // On the client will be treated as applying to left of the keyframe too
		var chunkEnd = point[axisName];
		var ruleDataObj = {
			"start": chunkStart,
			"end": chunkEnd,
			"containsStart": true,
			"containsEnd": true,
			"elementSelector": elementSelector
		};
		//if(pointTransition === "smoothLeft" || pointTransition === "smoothBoth"){
		if(pointTransition === "left-closed-right-closed" || pointTransition === "left-open-right-closed"){
			// If the last keyframe is connected to its left chunk, then use this rule
			var leftChunkRuleIndex = 2 * pointIndex;
			var valueData = chunkLineFitData[leftChunkRuleIndex]["valueData"];
			var propertyValue = point[behaviorName][propertyName];
			var getDeepCopyFunc = elementDataFormat[behaviorName]["type"]["getDeepCopy"];
			ruleDataObj["valueData"] = getDeepCopyFunc(valueData, propertyValue);
		}else{
			// If the last keyframe is disconnected from its left chunk, then just use constant value
			var getSingleKeyframeRuleFunc = elementDataFormat[behaviorName]["type"]["getSingleKeyframeRule"];
			var valueData = getSingleKeyframeRuleFunc(point[behaviorName][propertyName]);
			ruleDataObj["valueData"] = valueData;
		}
		chunkLineFitData[chunkLineFitData.length-1] = ruleDataObj;

		// Only include non "undefined" entries in conciseChunkLineFitData
		for(var chunkRuleIndex = 0; chunkRuleIndex < chunkLineFitData.length; chunkRuleIndex++){
			var chunkRule = chunkLineFitData[chunkRuleIndex];
			if(chunkRule){
				conciseChunkLineFitData.push(chunkRule);
			}
		}

		// Combine chunks with same rule
	}

	/*if(elementSelector == "8" && (propertyName === "left" || propertyName === "right")){
		console.log(propertyName);
		console.log(conciseChunkLineFitData);
	}*/
	conciseChunkLineFitData = condenseChunks(conciseChunkLineFitData);
	if(elementSelector == "8" && (propertyName === "left" || propertyName === "right")){
		console.log(propertyName);
		console.log(conciseChunkLineFitData);
	}
	return conciseChunkLineFitData;
};

var condenseChunks = function(chunkData){
	// For adjacent keyframes (need to sort by page width), should compare the values to see if they're the same; if the same, combine chunks
	// compare slopes, identify chunks
	var outputChunks = [];
	outputChunks.push(chunkData[0]);
	for(var i = 1; i < chunkData.length; i++){
		var point1 = chunkData[i-1]["valueData"];
		var point2 = chunkData[i]["valueData"];
		//if(typeof(point1) === "object"){
		if(point1["r"]){ // hack to see if this is an rgb
			var allAttributesSame = true;
			var valueAttributes = Object.keys(point1);
			for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
				var attributeName = valueAttributes[attrIndex];
				//if(point1[attributeName] === point2[attributeName]){
				if(compareData(point1[attributeName], point2[attributeName])){
					// Same chunk
					// Update the last chunk in outputChunks to have "end" value of the chunkData[i]'s "end"
					outputChunks[outputChunks.length-1]["end"] = chunkData[i]["end"];
				}else{
					allAttributesSame = false;
				}
			}
			if(allAttributesSame){
				// Same chunk, nothing to do
			}else{
				// Different chunk
				//chunkStartIndices.push(i);
				outputChunks.push(chunkData[i]);
			}
		}else{
			//if(point1 == point2){
			if(compareData(point1, point2)){
				// Same chunk
				// Update the last chunk in outputChunks to have "end" value of the chunkData[i]'s "end"
				outputChunks[outputChunks.length-1]["end"] = chunkData[i]["end"];
			}else{
				// Different chunk
				//chunkStartIndices.push(i);
				outputChunks.push(chunkData[i]);
			}
		}
	}
	return outputChunks;
};

var compareData = function(obj1, obj2){
	var attributes = Object.keys(obj1);
	for(var attrIndex = 0; attrIndex < attributes.length; attrIndex++){
		var attribute = attributes[attrIndex];
		var obj1Value = obj1[attribute];
		var obj2Value = obj2[attribute];
		if(obj1Value !== obj2Value){
			return false;
		}
	}
	return true;
};


/*var computeLineOfBestFit = function(axisVal1, attributeVal1, axisVal2, attributeVal2, chunkStart, chunkEnd, containsStart, containsEnd, elementSelector){
	var pointData = [ [axisVal1, attributeVal1], [axisVal2, attributeVal2] ];
	var m;
	var b;
	if(axisVal1 === axisVal2){
		// attributeVal1 and attributeVal2 should be the same
		m = 0;
		b = attributeVal1;
	}else{
		result = regression.linear(pointData);
		m = result.equation[0];
		b = result.equation[1];
	}
	var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "containsStart": containsStart, "containsEnd": containsEnd, "elementSelector": elementSelector };
	return lineOfBestFit;
};*/

var computeLineOfBestFit = function(axisVal1, attributeVal1, axisVal2, attributeVal2){
	var pointData = [ [axisVal1, attributeVal1], [axisVal2, attributeVal2] ];
	var m;
	var b;
	if(axisVal1 === axisVal2){
		// attributeVal1 and attributeVal2 should be the same
		m = 0;
		b = attributeVal1;
	}else{
		result = regression.linear(pointData);
		m = result.equation[0];
		b = result.equation[1];
	}
	//var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "containsStart": containsStart, "containsEnd": containsEnd, "elementSelector": elementSelector };
	var lineOfBestFit = {
		"m": m,
		"b": b
	};
	return lineOfBestFit;
};

/*var deepCopy = function(ruleObject){
	if(typeof(point1[behaviorName][propertyName]) === "object"){
		var valueAttributes = Object.keys(point1[behaviorName][propertyName]);
		var fitDataObject = {
			"start": chunkStart,
			"end": chunkEnd,
			"containsStart": true,
			"containsEnd": false,
			"elementSelector": elementSelector
		};
		for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
			var attributeName = valueAttributes[attrIndex];
			// compute y=mx+b fit for attribute; then create data to add to chunkLineFitData
			//var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName][attributeName], point2[axisName], point2[behaviorName][propertyName][attributeName], chunkStart, chunkEnd, elementSelector);
			var m = previousChunkRule[attributeName]["m"];
			var b = previousChunkRule[attributeName]["b"];
			var lineOfBestFit = { "m": m, "b": b, "start": chunkStart, "end": chunkEnd, "elementSelector": elementSelector, "containsStart": true, "containsEnd": false };
			fitDataObject[attributeName] = lineOfBestFit;
		}
		//chunkLineFitData.push(fitDataObject);
		chunkLineFitData[pointIndex1] = fitDataObject;
	}else{
		//var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName], point2[axisName], point2[behaviorName][propertyName], chunkStart, chunkEnd, elementSelector);
		var m = previousChunkRule["m"];
		var b = previousChunkRule["b"];
		var lineOfBestFit = {
			"m": m,
			"b": b,
			"start": chunkStart,
			"end": chunkEnd,
			"containsStart": true,
			"containsEnd": false,
			"elementSelector": elementSelector
		};
		//chunkLineFitData.push(lineOfBestFit);
		chunkLineFitData[pointIndex1] = lineOfBestFit;
	}
}

// For a given segment, return the rule dictated by its left side
var getLeftRule = function(){

};

// For a given segment, return the rule dictated by its right side
var getRightRule = function(){
	
};*/

var Discrete = {
	getLeftRule: function(){

	},
	getRightRule: function(){

	},
	getDefaultRule: function(){
		// We'll just say "getLeftRule" is the default
		return getLeftRule();
	},
	getSingleKeyframeRule: function(dataPointForThisProperty){
		return {
			"value": dataPointForThisProperty
		}
	},
	getDeepCopy: function(ruleObject, propertyValue){
		return {
			"value": ruleObject["value"]
		}
	}
};

var Continuous = {
	getLeftRule: function(){

	},
	getRightRule: function(){

	},
	getDefaultRule: function(dataPoint1, dataPoint2){
		// Linear interpolation
		return getLinearInterpolationRule(dataPoint1, dataPoint2);
	},
	getSingleKeyframeRule: function(dataPointForThisProperty){
		if(typeof(dataPointForThisProperty) === "object"){
			var valueAttributes = Object.keys(dataPointForThisProperty);
			var dataObj = {};
			for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
				var attributeName = valueAttributes[attrIndex];
				// compute y=mx+b fit for attribute; then create data to add to chunkLineFitData
				dataObj[attributeName] = {
					"m": 0,
					"b": dataPointForThisProperty[attributeName]
				}
			}
			return dataObj;
		}else{
			//var lineOfBestFit = computeLineOfBestFit(point1[axisName], point1[behaviorName][propertyName], point2[axisName], point2[behaviorName][propertyName], chunkStart, chunkEnd, elementSelector);
			return {
				"m": 0,
				"b": dataPointForThisProperty
			}
		}
	},
	getLinearInterpolationRule: function(dataPoint1, dataPoint2, behaviorName, propertyName, axisName){
		if(typeof(dataPoint1[behaviorName][propertyName]) === "object"){
			var valueAttributes = Object.keys(dataPoint1[behaviorName][propertyName]);
			var dataObj = {};
			for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
				var attributeName = valueAttributes[attrIndex];
				// compute y=mx+b fit for attribute; then create data to add to chunkLineFitData
				//var lineOfBestFit = computeLineOfBestFit(dataPoint1[axisName], dataPoint1[behaviorName][propertyName][attributeName], dataPoint2[axisName], dataPoint2[behaviorName][propertyName][attributeName], chunkStart, chunkEnd, containsStart, containsEnd, elementSelector);
				var lineOfBestFit = computeLineOfBestFit(dataPoint1[axisName], dataPoint1[behaviorName][propertyName][attributeName], dataPoint2[axisName], dataPoint2[behaviorName][propertyName][attributeName]);
				dataObj[attributeName] = lineOfBestFit;
			}
			return dataObj;
		}else{
			var lineOfBestFit = computeLineOfBestFit(dataPoint1[axisName], dataPoint1[behaviorName][propertyName], dataPoint2[axisName], dataPoint2[behaviorName][propertyName]);
			return lineOfBestFit;
		}
	},
	getDeepCopy: function(ruleObject, propertyValue){
		if(typeof(propertyValue) === "object"){
			var valueAttributes = Object.keys(ruleObject);
			var ruleObjectCopy = {};
			for(var attrIndex = 0; attrIndex < valueAttributes.length; attrIndex++){
				var attributeName = valueAttributes[attrIndex];
				var m = ruleObject[attributeName]["m"];
				var b = ruleObject[attributeName]["b"];
				ruleObjectCopy[attributeName] = {
					"m": m,
					"b": b
				};
			}
			return ruleObjectCopy;
		}else{
			var ruleObjectCopy = {
				"m": ruleObject["m"],
				"b": ruleObject["b"]
			};
			return ruleObjectCopy;
		}
	}
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

/*var pageDimensionsAndBehaviorsTheyInfluence = {
	"pageWidth": {
		"compareFunc": comparePageWidths,
		"behaviorsInfluenced": ["width", "x", "font-size", "background-color", "color", "visibility"],
		"mediaMaxProperty": "max-width",
		"mediaMinProperty": "min-width",
	},
	"pageHeight": {
		"compareFunc": comparePageHeights,
		"behaviorsInfluenced": ["height", "y"],
		"mediaMaxProperty": "max-height",
		"mediaMinProperty": "min-height",
	}
};*/

var pageDimensionsAndBehaviorsTheyInfluence = {
	"pageWidth": {
		"compareFunc": comparePageWidths,
		"behaviorsInfluenced": ["width", "x", "font-size", "background-color", "color", "visibility", "height", "y"],
		"mediaMaxProperty": "max-width",
		"mediaMinProperty": "min-width",
	}/*,
	"pageHeight": {
		"compareFunc": comparePageHeights,
		"behaviorsInfluenced": ["height", "y"],
		"mediaMaxProperty": "max-height",
		"mediaMinProperty": "min-height",
	}*/
};

var elementDataFormat = {
	"width": {
		"pageDimension": "pageWidth",
		"properties": ["width"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"height": {
		"pageDimension": "pageWidth",
		"properties": ["height"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"x": {
		"pageDimension": "pageWidth",
		"properties": ["left", "right"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"y": {
		"pageDimension": "pageWidth",
		"properties": ["top", "bottom"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"font-size": {
		"pageDimension": "pageWidth",
		"properties": ["font-size"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
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
		},
		"type": Continuous
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
		},
		"type": Continuous
	},
	"visibility": {
		"pageDimension": "pageWidth",
		"properties": ["visibility"],
		parseClientData: function(clientString){
			return clientString;
		},
		"type": Discrete
	}
};

/*var elementDataFormat = {
	"width": {
		"pageDimension": "pageWidth",
		"properties": ["width"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"height": {
		"pageDimension": "pageHeight",
		"properties": ["height"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"x": {
		"pageDimension": "pageWidth",
		"properties": ["left", "right"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"y": {
		"pageDimension": "pageHeight",
		"properties": ["top", "bottom"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
	},
	"font-size": {
		"pageDimension": "pageWidth",
		"properties": ["font-size"],
		parseClientData: function(clientString){
			return parseInt(clientString);
		},
		"type": Continuous
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
		},
		"type": Continuous
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
		},
		"type": Continuous
	},
	"visibility": {
		"pageDimension": "pageWidth",
		"properties": ["visibility"],
		parseClientData: function(clientString){
			return clientString;
		},
		"type": Discrete
	}
};*/

//var transitionOptions = ["linearInterpolation", "prevKeyframeRule", "nextKeyframeRule", "prevKeyframeConstantValue", "currentKeyframeConstantValue"];
/*var transitionOptions = ["linearInterpolation", "leftJump", "rightJump"];
var defaultTransition = "linearInterpolation";*/

//var transitionOptions = ["smoothRight", "smoothLeft", "smoothBoth"];
//var defaultTransition = "smoothBoth";
var defaultTransition = "left-closed-right-closed";

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
    	confirmHasVisibilityProperty();
    	confirmHasTransitionProperty();
    	writeDataToJSONFile();

    	//viewCounter = Object.keys(views).length;
    	viewCounter = determineLargestId() + 1;
    	updateCSSRules();
    }
});