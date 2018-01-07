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

// For now hardcode starting info
views.push('<div class="myBox"></div>');



app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	//res.sendFile('index.html', options);
	res.render("index");
});

app.post('/cloneOriginal', function(req, res) {
	//var original = views[0];
	var firstClone = views.length == 1;
	
	views.push(createNewViewHTML());
	//views.push(original);
	//views.push("test" + views.length);
	var newViewId = views.length - 1;
	
	res.json({
		"newViewId": newViewId,
		"firstClone": firstClone
	});
});

app.post('/view', function(req, res){
//app.get('/view/:id', function(req, res){
	//console.log(req);
	console.log(req.body);
	var viewId = req.body.viewId;
	console.log(viewId);
	var viewHTMLString = views[viewId];
	console.log(viewHTMLString);
	res.json({
		"viewHTMLString": viewHTMLString
	});
});

var createNewViewHTML = function(){
	var original = views[0];
	//var newView = "<div class='viewClone'>" + original + "</div>";
	//return newView;
	return original;
}

/*app.get('/view', function(req, res){
//app.get('/view/:id', function(req, res){
	var paramId = req.params.id;
	console.log(paramId);
	//console.log(req);
	console.log(req.body);
	var viewId = req.body.viewId;
	console.log(viewId);
	var viewHTMLString = views[viewId];
	console.log(viewHTMLString);
	res.json({
		"viewHTMLString": viewHTMLString
	});
});

//app.get('/view', function(req, res){
app.get('/view/:id', function(req, res){
	var paramId = req.params.id;
	console.log(paramId);
	//console.log(req);
	console.log(req.body);
	var viewId = req.body.viewId;
	console.log(viewId);
	var viewHTMLString = views[viewId];
	console.log(viewHTMLString);
	res.json({
		"viewHTMLString": viewHTMLString
	});
});*/

app.listen(8080);