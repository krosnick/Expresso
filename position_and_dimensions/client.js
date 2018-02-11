var currentViewId = 0;

$(document).ready(function() {
    // Get views from server
    // Need to get enough info to show list of views and current view
    $.ajax({
        type: "GET",
        url: "/currentData"
    }).done(function(data) {
    	var views = data.views;

    	// Show menu of views at the bottom
    	views.forEach(function(view){
    		addViewMenuItem(view["id"]);
    	});

    	makeFontBold($("#view" + 0 + " a"), $(".clone a"));

		// Render view 0 by default
		renderView(views[0]);
		$(".userPage").resizable();
    });

    // Possibly want to use templates later (store views in json, then render in template)

    $("#cloneButton").on("click", function(event){
		$.ajax({
	        type: "POST",
	        url: "/cloneOriginal",
	        data: getCurrentViewWidthHeight()
	    }).done(function(data) {

	    	// data should be the new view id
	    	var newViewId = data.newViewId;
	    	var addOriginalLink = data.firstClone;
	    	
	    	if(addOriginalLink){
	    		$("#originalView").css("visibility", "visible");
	    	}

	    	// Add link for new view
	    	/*var newViewText = "Clone " + newViewId;
	    	var newViewIdString = "view" + newViewId;
	    	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + newViewId + '><a href="#">' + newViewText + '</a></span>');
	    	$("#demoCSSMenu").append(newViewObject);*/
	    	addViewMenuItem(newViewId);

	    	// Make this link bold
	    	makeFontBold($("#view" + newViewId + " a"), $(".clone a"));
	    	
	    	// Render this view in the UI; server should include the view (html string?) in the response object
	        updateView(newViewId);
	    });
	});

    $("#demoCSSMenu").on("click", ".clone a", function(event){
    	var viewId = $(event.target).parent().attr("viewId"); // need to call "parent()" because $(event.target) is the <a> element and its parent has the "viewId" attribute 
    	// Make this link bold
		makeFontBold($(event.target), $(".clone a"));
		// Render this view in the UI, so probably need to ask server for the view
		updateView(viewId);
	});

    //$("#userPageOriginal").resizable();
	//$("#userPageClone").resizable();
	$(".userPage").resizable();
});

var makeFontBold = function(elementToBeBold, elementsNotToBeBold){
	elementsNotToBeBold.css("font-weight", "normal");
	elementToBeBold.css("font-weight", "bold");
}

var getCurrentViewWidthHeight = function(){
	/*var containerElement;
	if(currentViewId == 0){
		containerElement = $("#userPageOriginal");
	}else{
		containerElement = $("#userPageClone");
	}*/
	var containerElement = $(".userPage");
	var width = containerElement.width();
	var height = containerElement.height();
	return {
		"width": width,
		"height": height
	};
}

var updateView = function(viewId){
	var currentViewWidthHeight = getCurrentViewWidthHeight();
	var currentViewWidth = currentViewWidthHeight["width"];
	var currentViewHeight = currentViewWidthHeight["height"];
	var viewData = {
    	"newViewId": parseInt(viewId),
    	"oldView": {
    		"oldViewId": currentViewId,
    		"oldViewWidth": currentViewWidth,
    		"oldViewHeight": currentViewHeight
	    }
	};
    $.ajax({
        type: "POST",
        url: "/view",
        data: viewData
    }).done(function(data) {
    	
    	currentViewId = viewId;

    	renderView(data["view"]);
    	/*if(viewId == 0){ // original view
    		// Make #userPageOriginal node visible
    		$("#userPageOriginal").css("visibility", "visible");

    		// Make clone node hidden
    		$("#userPageClone").css("visibility", "hidden");
    	}else{
    		var viewWidth = data["view"]["width"];
    		var viewHeight = data["view"]["height"];

    		$("#userPageClone").css("width", viewWidth);
    		$("#userPageClone").css("height", viewHeight);

    		// Replace the contents of #userPageClone with the HTML returned
    		var viewHTMLString = data["view"]["viewHTMLString"];
    		$("#userPageCloneContent").html(viewHTMLString);

    		// Make #userPageClone visible and hide #userPageOriginal (original view)
    		$("#userPageOriginal").css("visibility", "hidden");
    		$("#userPageClone").css("visibility", "visible");

    		$("#userPageClone").resizable();

    		// Make modifiable elements (i.e., the box right now) draggable and resizable; should only be the case for clones
    		$(".modifiable").draggable();
    		$(".modifiable").resizable();
    	}*/
    });
};

var addViewMenuItem = function(viewId){
	var newViewText = "Clone " + viewId;
	var newViewIdString = "view" + viewId;
	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + viewId + '><a href="#">' + newViewText + '</a></span>');
	$("#demoCSSMenu").append(newViewObject);
};

var renderView = function(viewData){
	console.log(viewData);
	var viewWidth = viewData["pageWidth"];
	var viewHeight = viewData["pageHeight"];

	/*$("#userPageClone").css("width", viewWidth);
	$("#userPageClone").css("height", viewHeight);*/
	$(".userPage").css("width", viewWidth);
	$(".userPage").css("height", viewHeight);

	/*// Replace the contents of #userPageClone with the HTML returned
	var viewHTMLString = viewData["viewHTMLString"];*/
	// Construct DOM for this view. Render each element
	var elementsData = viewData["elements"];
	/*var elements = $();

	elementsData.forEach(function(elementData){
		elements.after(createDOMElement(elementData));
	});*/

	$(".userPageContent").empty();
	elementsData.forEach(function(elementData){
		var element = createDOMElement(elementData);
		//console.log(element);
		$(".userPageContent").append(element);
	});

	// Make modifiable elements (i.e., the box right now) draggable and resizable; should only be the case for clones
	$(".modifiable").draggable();
	$(".modifiable").resizable();
};

var createDOMElement = function(elementData){
	var element = $("<div></div>").attr("id", "element" + elementData["id"]);
	element.css("left", elementData["x"]);
	element.css("top", elementData["y"]);
	element.css("width", elementData["width"]);
	element.css("height", elementData["height"]);
	element.css("background-color", elementData["color"]);
	element.addClass("pageElement");
	element.addClass("modifiable");
	return element;
};