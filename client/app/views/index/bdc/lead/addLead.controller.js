angular.module('dealScanCrmApp')
  .controller('AddLeadCtrl',
    function ($scope, $uibModalInstance, $filter, Lead, Dealers, toaster, Util) {
      console.log("add lead controller loaded");

      var _newLead = this;
      _newLead.selectedSource = {};
      _newLead.saving = false;
      _newLead.dealers = Dealers;
      console.log('\n\n\n DEALERS \n\n');
      console.log(_newLead.dealers);
      console.log('\n\n ________________\n\n');

      _newLead.prospect = {
        name: '',
        phone: '',
        email: '',
        address: '',
        interest: '',
        additionalInfo: '',
        source: '',
        assignedManager: ''
      };

      _newLead.sources = [
        {
          id: 'phone',
          name: 'Phone',
          type: 'Phone'
        },
        {
          id: 'true_car',
          name: 'TrueCar',
          type: 'Internet'
        },
        {
          id: 'car_dot_com',
          name: 'Cars.com',
          type: 'Internet'
        },
        {
          id: 'autoTrader',
          name: 'AutoTrader',
          type: 'Internet'
        },
        {
          id: 'edmunds',
          name: 'Edmunds',
          type: 'Internet'
        }, {
          id: 'carCode',
          name: 'Edmunds CarCode',
          type: 'Internet'
        }, {
          id: 'website',
          name: 'hagerstownford.com',
          type: 'Internet'
        },
        {
          id: 'carfax',
          name: 'Carfax',
          type: 'Internet'
        }, {
          id: 'fatwin',
          name: 'FATWIN',
          type: 'Internet'
        }
      ];

      _newLead.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
      _newLead.format = _newLead.formats[0];
      _newLead.altInputFormats = ['M!/d!/yyyy'];


      _newLead.today = function () {
        _newLead.dt = new Date();
      };

      //_newLead.today();
      _newLead.minDate = new Date();

      _newLead.clear = function () {
        _newLead.dt = null;
      };


      _newLead.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
      };

      _newLead.create = function () {
        if (_newLead.saving) return;
        _newLead.saving = true;
        var details = {};
        var n = Util.slimTrim(_newLead.prospect.name).split(' ');
        details.firstName = n[0];
        details.middleInitial = (n.length > 2) ? n[1] : '';
        details.lastName = (n.length > 2 ) ? n[2]: n[1];
        details.phone = _newLead.prospect.phone;
        details.email = _newLead.prospect.email;
        details.address = _newLead.prospect.address;
        details.interest = _newLead.prospect.interest;
        details.additionalInfo = _newLead.prospect.additionalInfo;
        details.source = _newLead.prospect.source;
        details.appointment = _newLead.dt;
        details.manager = _newLead.prospect.assignedManager

        Lead.create(details).then(function (lead) {
          console.log(lead);
          if (lead && !lead.error) {
            toaster.success({
              title: 'New Lead', body: 'Lead (' + details.name + ') was successfully created' +
              (details.appointment && details.appointment.toString().trim() != '' ?
              ' and appointment was scheduled for ' + details.appointment + '!': '!')
            });
            $uibModalInstance.close(lead);
          } else toaster.error({title: 'New Lead Error', body: lead.error.msg});
          _newLead.saving = false;
        }).catch(function (err) {
          console.log(err);
          _newLead.saving = false;
          toaster.error({title: 'New Lead Error', body: 'An error occurred while attempting to create lead'});
        })

      };

      _newLead.cancel = function () {
        $uibModalInstance.dismiss();
      };

    });
