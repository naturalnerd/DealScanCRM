'use strict';

angular.module('dealScanCrmApp')
  .factory('Customer', function (Auth, Util, $q, CustomerResource) {
    // Service logic
    // ...

    var _customers = [];
    var _customersInfo = [];
    var _pageSize = 1000;

    /*
    * Returns a list of customers
    * */
    function getCustomers() {
      _customers.length = 0;
      return CustomerResource.get()
        .$promise.then(function (customers) {
          _customers = customers || [];
          _customersInfo = customers ? customers.rows :  [];
          _customersInfo = (_customersInfo.length > _pageSize) ? _customersInfo.slice(0, _pageSize) : _customersInfo;
          return _customersInfo;
        }).catch(function (err) {
          console.log(err);
        })
    }


    /*
    * Returns customer with specified customerId
    * */
    function getCustomer(customerID) {
      console.log(customerID);
      return CustomerResource.get({id: customerID})
        .$promise.then(function (customer) {
           return customer;
        }).catch(function(err){
          console.log(err);
        })
    }

    /*
    * Returns a list of customers with the associated name
    *
    *
    * */
    function findCustomer(customerName) {
      return CustomerResource.query({name: Util.slimTrim(customerName)}).
          $promise.then(function(customers){
          return customers || [];
      }).catch(function(err){
          console.log(err);
        })
    }


    // Public API here
    return {
      get: getCustomer,
      find: findCustomer,
      getCustomers: getCustomers,
      customers: function(){
        return _customersInfo;
      },
      getRows: function(){
        return _customers.rows;
      },
      getCount: function(){
        return _customers.count;
      }
    };


  });
