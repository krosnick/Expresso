var PixelDiff = require('pixel-diff');
var BlinkDiff = require('blink-diff');
var PNGImage = require('pngjs-image');
//var Jimp = require("jimp");

var imagePath1 = '../sample_webpages/boxes/greenbox.png';
var imagePath2 = '../sample_webpages/boxes/redbox.png';

var timeStampBeforeImageRead = Date.now();

PNGImage.readImage(imagePath1, function (err1, image1) {
  if (err1) throw err1;
  var timeStampAfterImage1Read = Date.now();
  console.log("Time to read image: " + (timeStampAfterImage1Read - timeStampBeforeImageRead) + " milliseconds");
  PNGImage.readImage(imagePath2, function (err2, image2) {
    if (err2) throw err2;
    var timeStampAfterImage2Read = Date.now();
    let diff = new PixelDiff({
      imageA: image1,
      imageB: image2,
      thresholdType: BlinkDiff.THRESHOLD_PERCENT,
      threshold: 0.01/*, // 1% threshold 
      imageOutputPath: 'imageDiff2.png'*/
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
    });
  });
});