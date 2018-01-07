$(document).ready(function() {
    $("#cloneButton").on("click", function(event){
		// Clone what is within #userPage div; clone into new jQuery object?
		// Send this part of page over to server
		// How to represent the page and its elements?
		// 
		//console.log("clicked");

		$.ajax({
	        type: "POST",
	        url: "/cloneOriginal"
	    }).done(function(data) {

	    	// data should be the new view id
	    	var newViewId = data.newViewId;
	    	var addOriginalLink = data.firstClone;
	    	//console.log(data);
	    	//console.log(data.newViewId);

	    	if(addOriginalLink){
	    		$("#originalView").css("visibility", "visible");
	    	}

	    	// Add link for new view
	    	var newViewText = "Clone " + newViewId;
	    	var newViewIdString = "view" + newViewId;
	    	var newViewObject = $('<span class="clone" id="' + newViewIdString + '" viewId=' + newViewId + '><a href="#">' + newViewText + '</a></span>');
	    	//var newViewObject = $('<span class="clone" id="view' + newViewId + '" viewId=' + newViewId + '><a href="#">' + newViewText + '</a></span>');
	    	$("#demoCSSMenu").append(newViewObject);

	    	// Make this link bold
	    	makeFontBold($("#" + newViewIdString + " a"), $(".clone a"));
	    	
	    	// Render this view in the UI; server should include the view (html string?) in the response object
	        renderView(newViewId);
	    });
	});

    $("#demoCSSMenu").on("click", ".clone a", function(event){
    	//console.log(event);
    	var viewId = $(event.target).parent().attr("viewId"); // need to call "parent()" because $(event.target) is the <a> element and its parent has the "viewId" attribute 
    	//console.log(viewId);
		// Make this link bold
		makeFontBold($(event.target), $(".clone a"));
		// Render this view in the UI, so probably need to ask server for the view
		renderView(viewId);
	});

	//$("#userPage").resizable();
});

var makeFontBold = function(elementToBeBold, elementsNotToBeBold){
	//console.log(elementToBeBold);
	//console.log(elementsNotToBeBold);
	elementsNotToBeBold.css("font-weight", "normal");
	elementToBeBold.css("font-weight", "bold");
}

var renderView = function(viewId){
	$.ajax({
        /*type: "GET",*/
        type: "POST",
        url: "/view",
        data: {"viewId": viewId}
        /*data: viewId*/
    }).done(function(data) {
    	// Replace the contents of #userPage with the HTML returned
    	console.log(data);
    	var viewHTMLString = data.viewHTMLString;
    	$("#userPage").html(viewHTMLString);
    	console.log(viewHTMLString);
    	console.log("replaced");
    });
}