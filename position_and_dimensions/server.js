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





var views = [];

var originalView = {
	"viewHTMLString": '<div class="myBox"></div>',
	"width": undefined,
	"height": undefined
}

// For now hardcode starting info
//views.push('<div class="myBox"></div>');
views.push(originalView);


app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	//res.sendFile('index.html', options);
	res.render("index");
});

app.post('/cloneOriginal', function(req, res) {

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
});

app.post('/view', function(req, res){

	var oldViewId = req.body.oldView.oldViewId;
	var oldViewWidth = req.body.oldView.oldViewWidth;
	var oldViewHeight = req.body.oldView.oldViewHeight;

	views[parseInt(oldViewId)]["width"] = parseInt(oldViewWidth);
	views[parseInt(oldViewId)]["height"] = parseInt(oldViewHeight);

	var viewId = parseInt(req.body.newViewId);
	res.json({
		"view": views[viewId]
	});
});

var createNewView = function(widthHeightData){
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
	/*var original = views[0];
	return original;*/
}

app.listen(8080);