/**
 * Created by milesjohnson on 4/4/16.
 */
angular.module('dealScanCrmApp')
  .controller('AddCustomerCtrl', ['$scope', '$rootScope', '$timeout', '$compile', '$state', '$window', '$uibModal', '$uibModalInstance', '$filter', function ($scope, $rootScope, $timeout, $compile, $state, $window, $uibModal, $uibModalInstance, $filter) {
    console.log("add customer controller loaded");

    $scope.today = function () {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

    $scope.lead = {'Assignee': 'Cary'};
    $scope.ok = function () {
      $uibModalInstance.close($scope.lead);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.states = [
      { name: 'ALABAMA', code: 'AL'},
      { name: 'ALASKA', code: 'AK'},
      { name: 'AMERICAN SAMOA', code: 'AS'},
      { name: 'ARIZONA', code: 'AZ'},
      { name: 'ARKANSAS', code: 'AR'},
      { name: 'CALIFORNIA', code: 'CA'},
      { name: 'COLORADO', code: 'CO'},
      { name: 'CONNECTICUT', code: 'CT'},
      { name: 'DELAWARE', code: 'DE'},
      { name: 'DISTRICT OF COLUMBIA', code: 'DC'},
      { name: 'FEDERATED STATES OF MICRONESIA', code: 'FM'},
      { name: 'FLORIDA', code: 'FL'},
      { name: 'GEORGIA', code: 'GA'},
      { name: 'GUAM', code: 'GU'},
      { name: 'HAWAII', code: 'HI'},
      { name: 'IDAHO', code: 'ID'},
      { name: 'ILLINOIS', code: 'IL'},
      { name: 'INDIANA', code: 'IN'},
      { name: 'IOWA', code: 'IA'},
      { name: 'KANSAS', code: 'KS'},
      { name: 'KENTUCKY', code: 'KY'},
      { name: 'LOUISIANA', code: 'LA'},
      { name: 'MAINE', code: 'ME'},
      { name: 'MARSHALL ISLANDS', code: 'MH'},
      { name: 'MARYLAND', code: 'MD'},
      { name: 'MASSACHUSETTS', code: 'MA'},
      { name: 'MICHIGAN', code: 'MI'},
      { name: 'MINNESOTA', code: 'MN'},
      { name: 'MISSISSIPPI', code: 'MS'},
      { name: 'MISSOURI', code: 'MO'},
      { name: 'MONTANA', code: 'MT'},
      { name: 'NEBRASKA', code: 'NE'},
      { name: 'NEVADA', code: 'NV'},
      { name: 'NEW HAMPSHIRE', code: 'NH'},
      { name: 'NEW JERSEY', code: 'NJ'},
      { name: 'NEW MEXICO', code: 'NM'},
      { name: 'NEW YORK', code: 'NY'},
      { name: 'NORTH CAROLINA', code: 'NC'},
      { name: 'NORTH DAKOTA', code: 'ND'},
      { name: 'NORTHERN MARIANA ISLANDS', code: 'MP'},
      { name: 'OHIO', code: 'OH'},
      { name: 'OKLAHOMA', code: 'OK'},
      { name: 'OREGON', code: 'OR'},
      { name: 'PALAU', code: 'PW'},
      { name: 'PENNSYLVANIA', code: 'PA'},
      { name: 'PUERTO RICO', code: 'PR'},
      { name: 'RHODE ISLAND', code: 'RI'},
      { name: 'SOUTH CAROLINA', code: 'SC'},
      { name: 'SOUTH DAKOTA', code: 'SD'},
      { name: 'TENNESSEE', code: 'TN'},
      { name: 'TEXAS', code: 'TX'},
      { name: 'UTAH', code: 'UT'},
      { name: 'VERMONT', code: 'VT'},
      { name: 'VIRGIN ISLANDS', code: 'VI'},
      { name: 'VIRGINIA', code: 'VA'},
      { name: 'WASHINGTON', code: 'WA'},
      { name: 'WEST VIRGINIA', code: 'WV'},
      { name: 'WISCONSIN', code: 'WI'},
      { name: 'WYOMING', code: 'WY' }
    ];
    //
    //$scope.$watch(function () {
    //    return $scope.f1;
    //  },
    //  function (newValue, oldValue) {
    //    $scope.f2 = $scope.f1;
    //  }, true);
    //
    //function DropdownCtrl($scope) {
    //
    //  $scope.selectedItem = "Items";
    //
    //  $scope.OnItemClick = function(event) {
    //    $scope.selectedItem = event;
    //  }
    //}
  }]);
