var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '')));





/*var views = [];

var originalView = {
	"viewHTMLString": '<div class="myBox modifiable"></div>',
	"width": undefined,
	"height": undefined
};*/

app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	//res.sendFile('index.html', options);
	res.render("index");
});

app.get('/currentData',function(req,res){
	res.json({
		"views": views
	});
});

/*app.post('/cloneOriginal', function(req, res) {

	var widthHeightData = req.body;

	//var original = views[0];
	var firstClone = views.length == 1;
	
	views.push(createNewView(widthHeightData));
	//views.push(original);
	//views.push("test" + views.length);
	var newViewId = views.length - 1;
	
	res.json({
		"newViewId": newViewId,
		"firstClone": firstClone
	});
});*/

app.post('/cloneOriginal', function(req, res) {

	/*var widthHeightData = req.body;

	//var original = views[0];
	var firstClone = views.length == 1;
	
	views.push(createNewView(widthHeightData));
	//views.push(original);
	//views.push("test" + views.length);
	var newViewId = views.length - 1;
	
	res.json({
		"newViewId": newViewId,
		"firstClone": firstClone
	});*/

	/*var oldViewId = req.body.oldView.oldViewId;
	var oldViewWidth = req.body.oldView.oldViewWidth;
	var oldViewHeight = req.body.oldView.oldViewHeight;

	// Updating page width and height of previously displayed view
	views[parseInt(oldViewId)]["pageWidth"] = parseInt(oldViewWidth);
	views[parseInt(oldViewId)]["pageHeight"] = parseInt(oldViewHeight);*/

	// Clone original view
	/*var original = views[0];
	var clonedView = Object.assign({}, original);
	clonedView["id"]*/
	var clonedView = cloneViewObj();
	views.push(clonedView);

	// Send back to client
	res.json({
		"view": clonedView
	});
});

app.post('/view', function(req, res){

	var oldViewId = req.body.oldView.oldViewId;
	var oldViewWidth = req.body.oldView.oldViewWidth;
	var oldViewHeight = req.body.oldView.oldViewHeight;
	var oldViewElementsData = req.body.oldView.elementsData;
	
	var oldViewIdAsInt = parseInt(oldViewId);
	var oldViewServerObj = views[oldViewIdAsInt];
	// Updating page width and height of previously displayed view
	oldViewServerObj["pageWidth"] = parseInt(oldViewWidth);
	oldViewServerObj["pageHeight"] = parseInt(oldViewHeight);

	// Updating elements of previously displayed view, if there are changes
	if(oldViewElementsData){ // if undefined, then no updates have been made
		oldViewServerObj["elements"] = oldViewElementsData;
	}

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]
	});
});

app.listen(8080);



// ------------ Helpers ------------

/*var createNewView = function(widthHeightData){
	var original = views[0];
	var width = original["width"];
	var height = original["height"];
	if(width == undefined){
		width = widthHeightData["width"];
	}
	if(height == undefined){
		height = widthHeightData["height"];
	}
	var newView = {
		"viewHTMLString": original["viewHTMLString"],
		"width": width,
		"height": height
	};
	return newView;
};*/

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
}

var views = [];
var viewCounter = 0;

var view0 = createViewObj(1680, 800);
view0["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view0["elements"].push(createElementObj(1, 600, 300, 300, 400, "red"));

var view1= createViewObj(840, 800);
view1["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view1["elements"].push(createElementObj(1, 400, 300, 300, 400, "red"));

views.push(view0);
views.push(view1);
