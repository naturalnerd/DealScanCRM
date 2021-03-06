'use strict';

angular.module('dealScanCrmApp')
  .controller('ImagesCtrl', function ($scope, Auth, Images, selectedCustomer, SweetAlert) {

    var _images = this;

    _images.user = Auth.getCurrentUser();
    _images.thisCustomer = selectedCustomer;
    _images.loadingImages = false;
    _images.imagesInfo = [];



    _images.uploadOptions = {
      target : '/api/uploads',
      permanentErrors : [ 500, 501 ],
      maxChunkRetries : 1,
      chunkRetryInterval : 5000,
      simultaneousUploads : 4,
      progressCallbacksInterval : 1,
      withCredentials : true,
      fileParameterName: 'customerImage',
      query: {'userID': _images.user.userID, 'customerID': _images.thisCustomer.customerID},
      headers : {Authorization : 'Bearer ' + Auth.getToken()}
    };

    var loadImages = function(){
      if (_images.loadingImages) return;
      _images.loadingImages = true;
      Images.getImages().then(function(images){
        if (images)_images.imagesInfo = images;
        _images.loadingImages  = false;
      }).catch(function(err){
        _images.loadingImages = false;
        console.log(err);
        SweetAlert.swal('Images Load Error', 'Sorry, an error occured while attempting to retreive your images', 'error');
      })
    }

    loadImages();

    _images.remove = function(img){
        var idx = _images.data.indexOf(img);
        if (idx != -1) _images.data.splice(idx, 1);
    }

    _images.data = [];


  });
