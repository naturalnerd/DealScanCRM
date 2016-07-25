
angular.module('dealScanCrmApp').controller('BDCCtrl',

    function ($scope, $state, $uibModal,$anchorScroll, BDCService, Auth, Util, Dashboard, appConfig, DTOptionsBuilder, $filter, Lead, toaster) {
      $("#page-wrapper").css("overflow-x", "scroll");

      console.log("dashboard controller loaded");
      var _bdc = this;

      _bdc.user = Auth.getCurrentUser();
      _bdc.isAdmin = Auth.isAdmin;
      _bdc.isManager = false;
      _bdc.isGM = false;
      _bdc.showTable = false;
      _bdc.sidebar = false;
      _bdc.openChat = false;
      _bdc.loadingLeads = false;
      _bdc.savingAppointment  = false;
      _bdc.savingNote = false;
      _bdc.note = {content: ''};
      _bdc.leads = [];

      Auth.hasRole(appConfig.userRoles[2], function (ans) {
        _bdc.isManager = ans;
      });

      Auth.hasRole(appConfig.userRoles[7], function (ans) {
        _bdc.isGM = ans;
      })


      _bdc.viewOptions = 'list';
      _bdc.showBarChart = false;
      _bdc.selectedPie = null;


      _bdc.tabs = [
        {
          id: 'new_leads',
          title: 'New Leads',
          icon: 'fa fa-users'
        },
        {
          id: 'processed',
          title: 'Processed',
          icon: 'fa fa-user'
        },
        {
          id: 'follow_up',
          title: 'Follow Up',
          icon: 'fa fa-exchange'
        }
      ]

      _bdc.activeTab = _bdc.tabs[0];
      _bdc.viewTab = function(tab){
        _bdc.activeTab = tab;
      }


      _bdc.loadLeads = function(){
        if (_bdc.loadingLeads) return;
        _bdc.loadingLeads = true;
        Lead.leads().then(function(leads){
          console.log(leads);
          if (leads && !leads.error){
            _bdc.leads = leads;
          } else toaster.error({title: 'Leads Load Error', body:'An error occured while attempting to load leads'});
          _bdc.loadingLeads = false;
        }).catch(function(err){
          console.log(err);
          _bdc.loadingLeads = false;
          toaster.error({title: 'Leads Load Error', body: 'An error occurred while attempting to load leads.'})
        });
      }

      _bdc.loadLeads();
      _bdc.activeLead = null;
      _bdc.showInDetails = function(lead){
        _bdc.activeLead = lead;
      }

      /**
       * Pie Chart Data
       */

      /**
       * Pie Chart Options
       */
      _bdc.pieOptions = {
        series: {
          pie: {
            show: true
          }
        },
        grid: {
          hoverable: true,
          clickable: true
        },
        tooltip: true,
        tooltipOpts: {
          content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
          shifts: {
            x: 20,
            y: 0
          },
          defaultTheme: false
        }
      };

      _bdc.sales = [];
      _bdc.models = [];
      _bdc.color = '#1ab394';

      _bdc.showDetails = function($event, pos, item, chart){
        console.log(item);
        console.log(chart);
        _bdc.selectedPie = chart;
        _bdc.color = item.series.color;

        var barData;
        switch(chart){
          case 'won':
            barData = _bdc.wonDeals.bar[item.seriesIndex];
            break;
          case 'lost':
            barData = _bdc.lostDeals.bar[item.seriesIndex];
            break;
          case 'total':
            barData = _bdc.totalDeals.bar[item.seriesIndex];
            break;
        }

        //set section title
        _bdc.displayingCategory = barData.category;

        //set labels
        _bdc.models.length = 0;
        angular.forEach(barData.models, function(value, key){
          _bdc.models.push([key, value]);
        });

        //set sales
        _bdc.sales.length = 0;
        angular.forEach(barData.sales, function(value,key){
          _bdc.sales.push([key, value]);
        });

        if (!_bdc.showBarChart) _bdc.showBarChart = true;


        console.log('WonDeals');
        console.log(_bdc.wonDeals);
        console.log("*****************************");

        console.log('LostDeals');
        console.log(_bdc.lostDeals);
        console.log("*****************************");

        console.log('TotalDeals');
        console.log(_bdc.totalDeals);
        console.log("*****************************");


        console.log('*** DEBUG Data Generated ***');
        console.log("*****************************");

        console.log(' Bar Color ');
        console.log(_bdc.color);
        console.log("*****************************");

        console.log(' Models Data');
        console.log(_bdc.models);
        console.log("*****************************");
        console.log(' Sales Data ');
        console.log(_bdc.sales);
        console.log("*****************************");
      }

      _bdc.barChartData = [
        {
          label: "Sales",
          grow:{stepMode:"linear"},
          data: _bdc.sales,
          color: _bdc.color,
          bars: {
            show: true,
            align: "center",
            barWidth: .62,  //24 * 60 *60 * 600
            lineWidth: 1
          }
        },
      ];

      _bdc.barChartOptions = {
        grid: {
          hoverable: true,
          clickable: true,
          tickColor: "#d5d5d5",
          borderWidth: 1,
          color: '#d5d5d5'
        },
        colors: ["#1ab394", "#464f88"],
        tooltip: true,
        xaxis: {
          ticks: _bdc.models,
          tickLength: 1,
          axisLabel: "Models",
          axisLabelUseCanvas: true,
          axisLabelFontSizePixels: 12,
          axisLabelFontFamily: 'Arial',
          axisLabelPadding: 10,
          color: "#d5d5d5"
        },
        yaxes: [
          {
            position: "left",
            color: "#d5d5d5",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Arial',
            axisLabelPadding: 3,
          }
        ],
        legend: {
          noColumns: 1,
          labelBoxBorderColor: "#d5d5d5",
          position: "ne"
        }
      };

      var getDealsData = function(status){
        var deals;
        switch(status){
          case 'won':
            deals = _bdc.wonDeals;
            break;
          case 'lost':
            deals = _bdc.lostDeals;
            break;
          case 'total':
            deals = _bdc.totalDeals;
            break;
        }
        return deals;
      }

      /**
       *
       * @type {{category: string, status: string}}
       */

      _bdc.sectionTitle = {category: '', status: ''};
      _bdc.setTableData = function(chart, status, category){
        console.log(chart);
        console.log(status);
        if (status){
          _bdc.sectionTitle.status = status;
          _bdc.sectionTitle.category = chart ? chart.series.label: '';
        } else {
          var barData = getDealsData(_bdc.sectionTitle.status).bar;
          for(var i= 0; i < barData.length; i++){
            if (barData[i].category == category){
              _bdc.sectionTitle.category = barData[i].models[chart.dataIndex];
              break;
            }
          }
        }

        var tableData = getDealsData(_bdc.sectionTitle.status).tableData;
        console.log(tableData);
        console.log(_bdc.sectionTitle.category);
        var data = $filter('filter')(tableData, {$: _bdc.sectionTitle.category});
        console.log(data);
        _bdc.dealsTableData = data;
      }

      /**
       *  Display Details Table
       * @param $event
       * @param pos
       * @param item
       */
      _bdc.displayTable = function($event, pos, item, status, category){
        if (!_bdc.showTable) _bdc.showTable = true;
        _bdc.setTableData(item, status, category);
      }


      /**
       *  deals  table Data
       */
      _bdc.dealsTableData = [];
      _bdc.dtOptions = DTOptionsBuilder.newOptions()
          .withDOM('<"html5buttons"B>lTfgitp')
          .withButtons([
            {extend: 'copy'},
            {extend: 'csv'},
            {extend: 'excel', title: 'ExampleFile'},
            {extend: 'pdf', title: 'ExampleFile'},
            {extend: 'print',
              customize: function (win){
                $(win.document.body).addClass('white-bg');
                $(win.document.body).css('font-size', '10px');
                $(win.document.body).find('table')
                    .addClass('compact')
                    .css('font-size', 'inherit');
              }
            }
          ]);




      /**
       * sales metrics
       * @type {*[]}
       */

      _bdc.dismissSidebar = function(from){
        console.log('*** called From: '+from+' **');
        _bdc.sidebar = false;
      }

      _bdc.showStatsSummary = function(stats, filter){
        var idx = Util.indexOfObject(_bdc.metricSummaryTabs, 'id', stats);
        if (idx != -1) {
          _bdc.metricSummaryTabs[idx].active = true;
          if (filter) _bdc.metricSummaryTabs[idx].contentFilter = filter;
        }
      }



      // _bdc.selectedDealership = _bdc.dealerships[0];
      // _bdc.selectedTeam = _bdc.selectedDealership.teams[0];
      // _bdc.selectedEmployee = _bdc.selectedTeam.members[0];

      _bdc.datePickerOptions = {
        'ranges': {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
          'Last 7 Days': [moment().subtract(6, 'days'), moment()],
          'Last 30 Days': [moment().subtract(29, 'days'), moment()],
          'This Month': [moment().startOf('month'), moment().endOf('month')],
          'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        "alwaysShowCalendars": true,
        'opens': 'left',
      };

      _bdc.dateRange = {startDate: _bdc.datePickerOptions.ranges.Today[0],
        endDate: _bdc.datePickerOptions.ranges.Today[1]};

      _bdc.displayStatsDetails = function(stat){
        if (!_bdc.sidebar) _bdc.sidebar = true;
        console.log(stat);
        var categoryId, filter;
        switch(stat.category){
          case 'calls':
            categoryId = 'Phone';
            break
          case 'text':
            categoryId = 'Correspondence';
            filter = 'Text';
            break;
          case 'mail':
            categoryId = 'Correspondence';
            filter = 'Mail';
            break;
          case 'appointment_made':
            categoryId = 'Appointments';
            filter = 'Made';
            break;
          case 'appointment_sold':
            categoryId = 'Appointments';
            filter = 'Sold';
            break;
          case 'appointment_missed':
            categoryId = 'Appointments';
            filter = 'Missed';
            break;

        }
        _bdc.showStatsSummary(categoryId, filter);
      }

      var updateBarChart = function(status, category){
        var barData, idx;
        switch(status){
          case 'won':
            idx  = Util.indexOfObject(_bdc.wonDeals.bar, 'category', category);
            if (idx != -1) barData = _bdc.wonDeals.bar[idx];
            break;
          case 'lost':
            idx  = Util.indexOfObject(_bdc.lostDeals.bar, 'category', category);
            if (idx != -1) barData = _bdc.lostDeals.bar[idx];
            break;
          case 'total':
            idx  = Util.indexOfObject(_bdc.totalDeals.bar, 'category', category);
            if (idx != -1) barData = _bdc.totalDeals.bar[idx];
            break;
        }

        //update sales
        _bdc.sales.length = 0;
        angular.forEach(barData.sales, function(value,key){
          _bdc.sales.push([key, value]);
        });
      }

      var updateTableData = function(status, category){
        var tableData = getDealsData(status).tableData;
        var data = $filter('filter')(tableData, {$: category});
        console.log(data);
        _bdc.dealsTableData = data;
      }

      _bdc.filterDeals = function(status){
        var idx = Util.indexOfObject(_bdc.stats, 'id', status);
        console.log(idx);
        if (idx != -1){
          var s = _bdc.stats[idx].sources;
          console.log(s);
          var sources = [];
          for(var i= 0; i < s.length; i++){
            if (s[i].state) sources.push(s[i].id)
          }
          Dashboard.filter(status, sources);
          if (_bdc.showBarChart) updateBarChart(status, _bdc.displayingCategory);
          if (_bdc.showTable) updateTableData(status, _bdc.displayingCategory);
          console.log('*** Deals Filtered ***');
        }
      }

      _bdc.chatRecipient = {name: '', number: ''};

      _bdc.composeText = function(deal){
        if (!_bdc.openChat) _bdc.openChat = true;
        console.log('*** Compose Text ***');
        console.log(deal);
        _bdc.chatRecipient = {name:deal.customerDetails.name, number: deal.customerDetails.phone};
      }

      _bdc.composeMail = function(deal){
        console.log('*** Compose Mail ****');
        console.log(deal);
        var modalInstance = $uibModal.open({
          size: 'lg',
          //windowClass: 'animated slideInRight',
          templateUrl: 'app/views/index/dashboard/modalMailCompose.html',
          resolve: {
            deal: function(){
              return deal;
            }
          },
          controller: function($scope, $uibModalInstance, deal){
            console.log(deal);
            $scope.recipient = deal.customerDetails;
            $scope.ok = function () {
              $uibModalInstance.close();
            };

            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
          }
        });
      }

      _bdc.addLead = function () {
        var modalInstance = $uibModal.open({
          animation: true,
          windowClass: 'slide-up',
          templateUrl: 'app/views/index/bdc/lead/addLead.html',
          controller: 'AddLeadCtrl',
          controllerAs: 'newLead',
          resolve: {
            loadPlugin: function ($ocLazyLoad) {
              return $ocLazyLoad.load([
                {
                  serie: true,
                  name: 'angular-ladda',
                  files: ['.resources/plugins/ladda/spin.min.js', '.resources/plugins/ladda/ladda.min.js',
                    '.styles/plugins/ladda/ladda-themeless.min.css','.resources/plugins/ladda/angular-ladda.min.js']
                }
              ]);
            }
          }
        });




      }

      _bdc.editLead = function(lead){
        console.log('*** Edit Lead ****');
        var modalInstance = $uibModal.open({
          animation: true,
          windowClass: 'slide-up',
          templateUrl: 'app/views/index/bdc/lead/editLead.html',
          controller: 'EditLeadCtrl',
          controllerAs: 'editLead',
          resolve: {
            lead: function(){
              return lead;
            },
            loadPlugin: function ($ocLazyLoad) {
              return $ocLazyLoad.load([
                {
                  serie: true,
                  name: 'angular-ladda',
                  files: ['.resources/plugins/ladda/spin.min.js', '.resources/plugins/ladda/ladda.min.js',
                    '.styles/plugins/ladda/ladda-themeless.min.css','.resources/plugins/ladda/angular-ladda.min.js']
                }
              ]);
            }
          }
        });

        modalInstance.result.then(function (result) {
            _bdc.activeLead = result;
        }).catch(function(e){
          console.log(e);
        });
      }

      _bdc.appointment = {};
      _bdc.appointment.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
      _bdc.appointment.format = _bdc.appointment.formats[0];
      _bdc.appointment.altInputFormats = ['M!/d!/yyyy'];

      _bdc.today = function () {
        _bdc.appointment.dt = new Date();
      };

      _bdc.today();
      _bdc.appointment.minDate = new Date();

      _bdc.clear = function () {
        _bdc.appointment.dt = null;
      };


      _bdc.appointment.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
      };

      _bdc.scheduleLeadAppointment = function(lead){
        console.log('*** Schedule Lead ****');
        if (_bdc.savingAppointment) return;
        _bdc.savingAppointment = true;
        var details = {};
        details.leadID = lead.leadID;
        details.description = _bdc.appointment.description;
        console.log(_bdc.appointment.dt);
        console.log(_bdc.appointment.time);
        //details.appointment = moment(_bdc.appointment.dt.format('YYYY-MM-DD') +''+_bdc.appointment.time);
        var aptTime = moment(_bdc.appointment.dt).format('YYYY-MM-DD') +' '+_bdc.appointment.time;
        console.log(aptTime);
        details.appointment = moment(aptTime);
        console.log(details.appointment);
        console.log(details);
        Lead.appointment(details).then(function(appointment){
          console.log(appointment);
          if (appointment && !appointment.error){
            toaster.success({title:'New Appointment', body: 'Appointment for Lead ('+lead.name+') was scheduled for '+details.appointment});
          } else toaster.error({title:'New Appointment Error', body: appointment.error.msg});
          _bdc.savingAppointment = false;
        }).catch(function(err){
          console.log(err);
          _bdc.savingAppointment = false;
          toaster.error({title:'New Lead Error', body: 'An error occurred while attempting to schedule appointment'});
        })

      }

      _bdc.addNote = function(lead){
        console.log('*** Add Note ****');
        if (_bdc.savingNote) return;
        _bdc.savingNote = true;
        var details = {};
        details.leadID = lead.leadID;
        details.note = _bdc.note.content;
        console.log(details);
        Lead.note(details).then(function(note){
          console.log(note);
          if (note && !note.error){
            toaster.success({title:'New Note', body: 'Note added for Lead ('+lead.name+')'});
          } else toaster.error({title:'New Note Error', body: appointment.error.msg});
          _bdc.savingNote = false;
        }).catch(function(err){
          console.log(err);
          _bdc.savingAppointment = false;
          toaster.error({title:'New Lead Error', body: 'An error occurred while attempting to schedule appointment'});
        });
      }

      _bdc.addTask = function () {
        var modalInstance = $uibModal.open({
          animation: true,
          windowClass: 'slide-up',
          templateUrl: 'app/account/task/addTask.html',
          controller: 'AddTaskCtrl',
        });
      }

    });


angular.module('dealScanCrmApp').controller('dashboardMap', dashboardMap);

