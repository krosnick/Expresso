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


app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	res.render("index");
});

app.get('/currentData',function(req,res){
	res.json({
		"views": views
	});
});

app.post('/cloneOriginal', function(req, res) {
	var clonedView = cloneViewObj();
	views.push(clonedView);

	// Send back to client
	res.json({
		"view": clonedView
	});
});

app.post('/view', function(req, res){

	updateElementAndPageData(req.body.oldView);

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]
	});
});

app.post("/updateData", function(req, res){
	updateElementAndPageData(req.body.oldView);

	res.end();
});

app.listen(8080);



// ------------ Helpers ------------

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
}

var views = [];
var viewCounter = 0;

var view0 = createViewObj(1480, 800);
view0["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view0["elements"].push(createElementObj(1, 600, 300, 300, 400, "red"));
views.push(view0);

/*var view1= createViewObj(740, 800);
view1["elements"].push(createElementObj(0, 100, 40, 400, 250, "blue"));
view1["elements"].push(createElementObj(1, 400, 300, 300, 400, "red"));
views.push(view1);*/