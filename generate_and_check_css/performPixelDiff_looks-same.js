var PixelDiff = require('pixel-diff');
var BlinkDiff = require('blink-diff');
var PNGImage = require('pngjs-image');
var pixelmatch = require('pixelmatch');
var looksSame = require('looks-same');
//var Jimp = require("jimp");

var imagePath1 = '../sample_webpages/boxes/greenbox.png';
var imagePath2 = '../sample_webpages/boxes/redbox.png';

var timeStampBeforeImageRead = Date.now();

PNGImage.readImage(imagePath1, function (err1, image1) {
  //if (err1) throw err1;
  var timeStampAfterImage1Read = Date.now();
  console.log("Time to read image: " + (timeStampAfterImage1Read - timeStampBeforeImageRead) + " milliseconds");
  PNGImage.readImage(imagePath2, function (err2, image2) {
    //if (err2) throw err2;
    var timeStampAfterImage2Read = Date.now();
    var image1Buffer = image1.getBlob();
    var image2Buffer = image2.getBlob();
    looksSame(image1Buffer, image2Buffer, function(error, equal) {
        console.log(error);
        //equal will be true, if images looks the same 
        var timeStampAfterPixelDiff = Date.now();
        console.log("Time to do pixel diff: " + (timeStampAfterPixelDiff - timeStampAfterImage2Read) + " milliseconds");
        console.log(equal);
    });
    //var numDiffPixels = pixelmatch(image1, image2, null, 3360, 1702, {threshold: 0.1});

    /*let diff = new BlinkDiff({
      imageA: image1,
      imageB: image2,
      cropImageA: {x:0, y:0, width: 1000, height: 500},
      cropImageB: {x:0, y:0, width: 1000, height: 500},
      thresholdType: BlinkDiff.THRESHOLD_PERCENT,
      threshold: 0.01
    });

    var timeStampAfterInitPixelDiffObj = Date.now();
    console.log("Time to create PixelDiff obj: " + (timeStampAfterInitPixelDiffObj - timeStampAfterImage2Read) + " milliseconds");
    diff.run((error, result) => {
       var timeStampAfterPixelDiff = Date.now();
       console.log("Time to do pixel diff: " + (timeStampAfterPixelDiff - timeStampAfterInitPixelDiffObj) + " milliseconds");
       if (error) {
          throw error;
       } else {
          console.log(diff.hasPassed(result.code) ? 'Passed' : 'Failed');
          console.log('Found ' + result.differences + ' differences.');
          console.log(result);
       }
    });*/
  });
});