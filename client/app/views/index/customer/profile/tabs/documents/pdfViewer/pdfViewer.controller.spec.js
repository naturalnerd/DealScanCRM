'use strict';

describe('Controller: PdfViewerCtrlCtrl', function () {

  // load the controller's module
  beforeEach(module('dealscanCrmApp'));

  var PdfViewerCtrlCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PdfViewerCtrlCtrl = $controller('PdfViewerCtrlCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
