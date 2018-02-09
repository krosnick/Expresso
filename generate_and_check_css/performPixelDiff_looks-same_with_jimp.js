var PixelDiff = require('pixel-diff');
var BlinkDiff = require('blink-diff');
var PNGImage = require('pngjs-image');
var pixelmatch = require('pixelmatch');
var looksSame = require('looks-same');
var Jimp = require("jimp");

var imagePath1 = "../sample_webpages/boxes/greenbox.png";
var imagePath2 = "../sample_webpages/boxes/redbox.png";

var timeStampBeforeImageRead = Date.now();

Jimp.read(imagePath1, function (err1, image1) {
    var image1Buffer = image1.getBuffer( Jimp.MIME_PNG, function(){
        Jimp.read(imagePath2, function (err2, image2) {
          var image2Buffer = image2.getBuffer( Jimp.MIME_PNG, function(){
            var timeStampAfterImage2Read = Date.now();
            looksSame(image1Buffer, image2Buffer, function(error, equal) {
                console.log(error);
                //equal will be true, if images looks the same 
                var timeStampAfterPixelDiff = Date.now();
                console.log("Time to do pixel diff: " + (timeStampAfterPixelDiff - timeStampAfterImage2Read) + " milliseconds");
                console.log(equal);
            });
          });
        });
    });
});