'use strict';

angular.module('dealScanCrmApp')
  .controller('SocialMediaCtrl', function ($scope, Auth, Util, $filter, $aside, SocialMedia) {

    var _sm =this;
    _sm.user = Auth.getCurrentUser();


    _sm.views  = [{id:'discover', name:'Social Media Discovery', active: true},
                  {id: 'monitor', name: 'Social Media Monitoring', active: false}];

    _sm.currentView = _sm.views[0];

    _sm.setCurrentView = function(id){
       console.log('setting view with id: '+id);
       var idx = Util.indexOfObject(_sm.views, 'id', id);
       console.log('Idx: '+idx);
       if (idx != -1) {
         _sm.currentView = _sm.views[idx];
         _sm.views[idx].active = true;
         for (var i = 0; i < _sm.views.length; i++)
           if (id != _sm.views[i].id)
             _sm.views[i].active = false;
       }
    }


    /**
     * StatsMap & Options
     * @type {{}}
     */
    _sm.map = {};
    _sm.mapOptions = {
      zoom: 11,
      center: new google.maps.LatLng(38.9072, -77.0369),
      // Style for Google Maps
      styles: [
        {
          "featureType": "water",
          "stylers": [{"saturation": 43}, {"lightness": -11}, {"hue": "#0088ff"}]
        }, {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{"hue": "#ff0000"}, {"saturation": -100}, {"lightness": 99}]
        }, {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#808080"}, {"lightness": 54}]
        }, {
          "featureType": "landscape.man_made",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#ece2d9"}]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#ccdca1"}]
        }, {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#767676"}]
        }, {
          "featureType": "road",
          "elementType": "labels.text.stroke",
          "stylers": [{"color": "#ffffff"}]
        }, {"featureType": "poi", "stylers": [{"visibility": "off"}]}, {
          "featureType": "landscape.natural",
          "elementType": "geometry.fill",
          "stylers": [{"visibility": "on"}, {"color": "#b8cb93"}]
        }, {"featureType": "poi.park", "stylers": [{"visibility": "on"}]}, {
          "featureType": "poi.sports_complex",
          "stylers": [{"visibility": "on"}]
        }, {"featureType": "poi.medical", "stylers": [{"visibility": "on"}]}, {
          "featureType": "poi.business",
          "stylers": [{"visibility": "simplified"}]
        }],
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };


    /**
     * Refresh Map on hide and show
     * @param map
     */
    _sm.refreshMap = function (map) {
      $scope.$applyAsync(function(){
        var m = map ? map : _sm.map;
        if (m) {
          console.log(m);
          google.maps.event.trigger(m, 'resize');
          console.log('*** Refreshed Map ***');
        }
      })
    }

    _sm.refreshMap();

    _sm.broadcast = function(){
      var asideInstance = $aside.open({
        templateUrl: 'app/views/index/socialMedia/socialMedia.broadcast.html',
        controller: 'SocialMediaBroadcastCtrl as smBroadcast',
        placement: 'right',
        size:'sm',
        resolve: {
          loadPlugin: function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                files: ['.styles/plugins/iCheck/custom.css','.resources/plugins/iCheck/icheck.min.js']
              }
            ]);
          }
        }
      });
    }



    //Search Twitter
    _sm.searchTwitter = function(){

         var searchOptions = {term: 'luda'}; //search for luda on twitter
         SocialMedia.searchTwitter(searchOptions).then(function(data){
           console.log('\n *** Printing Results ***\n');
           console.log(data);
           console.log('\n ************************\n');
         })
           .catch(function(err){
             console.log('\n*** Printing Error ***\n');
             console.log(err);
             console.log('****************************');
         })
    }

    _sm.searchTwitter();

  });