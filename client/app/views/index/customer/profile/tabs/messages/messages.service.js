'use strict';

angular.module('dealScanCrmApp')
  .factory('Messages', function (Util, MessageResource) {
    // Service logic
    // ...


    function getInbox(email){
      return MessageResource.query({email: email}).$promise
        .then(function(inbox){
          console.log(inbox);
          return inbox;
      }).catch(function(err){
        console.log(err);
        return err;
      })
    }



    // Public API here
    return {
      inbox: getInbox
    };


  });
