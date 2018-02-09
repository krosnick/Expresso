var PixelDiff = require('pixel-diff');
var BlinkDiff = require('blink-diff');
var PNGImage = require('pngjs-image');
var pixelmatch = require('pixelmatch');
var looksSame = require('looks-same');
var fs = require('fs');
//var Jimp = require("jimp");

var imagePath1 = '../sample_webpages/boxes/greenbox.png';
var imagePath2 = '../sample_webpages/boxes/redbox.png';

var timeStampBeforeImageRead = Date.now();

fs.readFile(imagePath1, function(err1, image1) {
  //if (err1) throw err1;
  var timeStampAfterImage1Read = Date.now();
  console.log("Time to read image: " + (timeStampAfterImage1Read - timeStampBeforeImageRead) + " milliseconds");
  fs.readFile(imagePath2, function(err2, image2) {
    //if (err2) throw err2;
    var timeStampAfterImage2Read = Date.now();
    looksSame(image1, image2, function(error, equal) {
        //equal will be true, if images looks the same 
        var timeStampAfterPixelDiff = Date.now();
        console.log("Time to do pixel diff: " + (timeStampAfterPixelDiff - timeStampAfterImage2Read) + " milliseconds");
        console.log(equal);
    });
  });
});