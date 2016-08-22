
angular.module('dealScanCrmApp').controller('DashboardCtrl',

  function ($scope, $state, $uibModal, $anchorScroll, Auth, Util, Dashboard, appConfig, NgMap, DTOptionsBuilder, $filter, toaster, $window, $timeout) {

    var _dashboard = this;

    _dashboard.user = Auth.getCurrentUser();
    _dashboard.isAdmin = Auth.isAdmin;
    _dashboard.isManager = false;
    _dashboard.isGM = false;
    _dashboard.showTable = false;
    _dashboard.sidebar = false;
    _dashboard.openChat = false;
    _dashboard.dataFilters = [];
    _dashboard.stats = [];
    _dashboard.emptyResults = null;
    _dashboard.viewIsReady = false;
    _dashboard.loadingKPI = false;
    _dashboard.filtered = [{id: 'won', state: false}, {id: 'lost', state: false}, {id: 'total', state: false}];
    _dashboard.noWonDeals = null;
    _dashboard.noLostDeals = null;
    _dashboard.noTotalDeals = null;
    _dashboard.kpis = [];
    _dashboard.mapCenter = [39.628, -77.766];
    NgMap.getMap().then(function (map) {
      _dashboard.drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.CIRCLE,
          ]
        },
        circleOptions: {
          fillColor: '#c6ccd7',
          strokeColor: '#41577c',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          clickable: false,
          editable: true,
          zIndex: 1
        }
      });

      _dashboard.drawingManager.setOptions({
        drawingControl: false
      });
      _dashboard.drawingManager.setMap(map);
      _dashboard.map = map;
    });

    var resetDealFlags = function(){
      _dashboard.noWonDeals = null;
      _dashboard.noLostDeals = null;
      _dashboard.noTotalDeals = null;
    }

    var resetFilterFlags = function () {
      _dashboard.filtered = [{id: 'won', state: false}, {id: 'lost', state: false}, {id: 'total', state: false}];
    }

    Auth.hasRole(appConfig.userRoles[2], function (ans) {
      _dashboard.isManager = ans;
    });

    Auth.hasRole(appConfig.userRoles[7], function (ans) {
      _dashboard.isGM = ans;
    })


    _dashboard.KPI = function(){
      if (_dashboard.loadingKPI) return;
      _dashboard.loadingKPI = true;
      Dashboard.kpi().then(function(res){
        console.log(res);
        _dashboard.kpis = res;
        _dashboard.loadingKPI = false;
        toaster.wait({title: res.RemainingWorkingDays+' remaining working days!'})
      }).catch(function(err){
         console.log(err);
         _dashboard.loadingKPI = false;
         toaster.error({title: 'KPI Error', body: 'An error occurred while retrieving KPI Info'})
      })
    }

    _dashboard.KPI();

    _dashboard.dealTypes = [{id: 0, text: 'All'}, {id: 1, text: 'New'}, {id: 2, text: 'Used'}];
    _dashboard.selectedDealership = {};
    _dashboard.selectedTeam = {};

    _dashboard.getFilters = function(){
      Dashboard.filters().then(function(filters){
        console.log(filters);
        if (filters){
          _dashboard.dataFilters = filters;
          _dashboard.selectedType = _dashboard.dealTypes[0];
          _dashboard.selectedDealership = _dashboard.dataFilters[0];
          _dashboard.selectedTeam = _dashboard.selectedDealership.Teams[0];
          _dashboard.selectedEmployee  = (_dashboard.user.role == 'sale_rep') ?
              {MemberID: _dashboard.user.userID, profile: _dashboard.user.profile} :
              _dashboard.selectedEmployee = _dashboard.selectedTeam.TeamMembers[0];
          _dashboard.viewIsReady = true;
          _dashboard.getSales();
        }
      }).catch(function(err){
          console.log(err);
          toaster.error({title: 'Dashboard Error', body: 'An error occurred while loading data filters'})
      });
    }
    _dashboard.getFilters();

    _dashboard.groupByRole = function (employee){
       return employee.profile.role;
    };






    /**
     * Deals Type
     * @type {*[]}
     */




    _dashboard.datePickerOptions = {
      'ranges': {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      },

      'opens': 'left',
       eventHandlers: {'apply.daterangepicker': function(ev, picker) {
          console.log(ev);
          console.log(picker);
         _dashboard.getSales();
       }}
    };

    _dashboard.dateRange = {startDate: _dashboard.datePickerOptions.ranges['This Month'][0],
      endDate: _dashboard.datePickerOptions.ranges.Today[1]};


    _dashboard.getSales = function(){
      if (_dashboard.retreivingDeals) return;
      _dashboard.retreivingDeals = true;
      _dashboard.emptyResults = null;
      resetFilterFlags();
      console.log('**** GETTING DEALS DATA *****');
      var searchOptions = {};
      searchOptions.type = _dashboard.selectedType;
      searchOptions.dealershipID = _dashboard.selectedDealership.DealershipID;
      searchOptions.teamID = _dashboard.selectedTeam.TeamID;
      searchOptions.employee = _dashboard.selectedEmployee;
      searchOptions.from = _dashboard.dateRange.startDate.format('YYYY/MM/DD');
      searchOptions.to = _dashboard.dateRange.endDate.format('YYYY/MM/DD');
      console.log(searchOptions);
      Dashboard.deals(searchOptions).then(function(sales){
        console.log(sales);
        if (sales && sales.length > 0){
           _dashboard.emptyResults = false;
          _dashboard.wonDeals = Dashboard.won();
          _dashboard.lostDeals = Dashboard.lost();
          _dashboard.totalDeals = Dashboard.total();
          _dashboard.stats = getStats();
          _dashboard.noWonDeals = _dashboard.wonDeals.tableData && _dashboard.wonDeals.tableData.length == 0;
          _dashboard.noLostDeals = _dashboard.lostDeals.tableData && _dashboard.lostDeals.tableData.length == 0;
          _dashboard.noTotalDeals = _dashboard.totalDeals.tableData && _dashboard.totalDeals.tableData.length == 0;
        } else _dashboard.emptyResults = true;
        _dashboard.retreivingDeals = false;
      }).catch(function(err){
         _dashboard.retreivingDeals = false;
         console.log(err);
         toaster.error({title: 'Sales Load Error', body: 'An Error occurred while attempting to retreive sales data'});
      });
    }

    _dashboard.goToProfile = function(deal){
      console.log(deal);
      console.log(Util.slimTrim(deal.customerDetails.name));
      console.log('>> going to customer page...');
      $state.go('index.customer.profile', {
        customerID: deal.customerDetails.customerID,
        customerName: Util.slimTrim(deal.customerDetails.name).replace(/\ /g, '_')
      });
    }

    _dashboard.summaryStats = [
      {
        bgStyle: 'navy-bg',
        category: 'calls',
        value: 217
      },
      {
        bgStyle: 'navy-bg',
        category: 'mail',
        value: 400
      },
      {
        bgStyle: 'navy-bg',
        category: 'text',
        value: 10
      },
      {
        bgStyle: 'lazur-bg',
        category: 'appointment_made',
        value: 120
      },
      {
        bgStyle: 'navy-bg',
        category: 'appointment_sold',
        value: 462
      },
      {
        bgStyle: 'red-bg',
        category: 'appointment_missed',
        value: 610
      },

    ];
    _dashboard.displayStatsDetails = function(stat){
      if (!_dashboard.sidebar) _dashboard.sidebar = true;
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
      _dashboard.showStatsSummary(categoryId, filter);
    }

    /**
     * sales metrics
     * @type {*[]}
     */

    _dashboard.dismissSidebar = function(from){
      console.log('*** called From: '+from+' **');
      _dashboard.sidebar = false;
    }
    _dashboard.activeTab = 0;
    _dashboard.showStatsSummary = function(stats, filter){
      var idx = Util.indexOfObject(_dashboard.metricSummaryTabs, 'id', stats);
      if (idx != -1) {
        _dashboard.activeTab = idx;
        if (filter) _dashboard.metricSummaryTabs[idx].contentFilter = filter;
      }
    }


    _dashboard.metricSummaryTabs = [
      {
        id: 'Phone', title: 'fa fa-phone', contentFilter: '',
        contentData: [
          {
            cname: 'Job Bloe', cavatar: 'assets/images/a1.jpg', ctype: 'outgoing',
            ctime: 'Today 4:21 pm', comments: 'Follow up with customer regarding service calls'
          },
          {
            cname: 'John Cacron', cavatar: 'assets/images/a2.jpg', ctype: 'incoming',
            ctime: 'Today 4:21 pm', comments: 'Customer wanted to know when his car was going to be ready'
          },
          {
            cname: 'OJ Simpson', cavatar: 'assets/images/a3.jpg', ctype: 'missed',
            ctime: 'Today 4:21 pm', commments: ''
          },
          {
            cname: 'Bob Shapiro', cavatar: 'assets/images/a4.jpg', ctype: 'outgoing',
            ctime: 'Today 4:21 pm', comments: ''
          },
          {
            cname: 'Jesus Christ', cavatar: 'assets/images/a5.jpg', ctype: 'missed',
            ctime: 'Today 4:21 pm', comments: ''
          }
        ]
      },
      {
        id: 'Correspondence', title: 'fa fa-exchange', contentFilter: '',
        contentData: [
          {
            crname: 'Luda Agodio',
            crtype: 'Text',
            crsubject: '',
            crcontent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ',
            crtime: '9hours ago'
          },
          {
            crname: 'Eric Carper',
            crtype: 'Text',
            crsubject: '',
            crcontent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ',
            crtime: '9hours ago'
          },
          {
            crname: 'Miles Johnson',
            crtype: 'Mail',
            crsubject: 'Attention Required',
            crcontent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ',
            crtime: '9hours ago'
          },
          {
            crname: 'Ronda Roussey',
            crtype: 'Mail',
            crsubject: 'Re: Luda is good',
            crcontent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ',
            crtime: '9hours ago'
          },
          {
            crname: 'Chris Brown',
            crtype: 'Mail',
            crsubject: 'Progress Report',
            crcontent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ',
            crtime: '9hours ago'
          },
        ]
      },
      {
        id: 'Appointments', title: 'fa fa-calendar-o', contentFilter: '',
        sortableOptions: {connectWith: ".connectList"},
        contentData: [
          {
            cname: 'Johnny Bloe',
            comments: 'Sometimes by accident, sometimes on purpose (injected humour and the like).',
            date: '16.11.2015',
            statusClass: 'info',
            tagName: 'Mark',
            appointmentStatusClass: 'made',
          },
          {
            cname: 'Johnny Bloe',
            comments: 'Sometimes by accident, sometimes on purpose (injected humour and the like).',
            date: '16.11.2015',
            statusClass: 'danger',
            tagName: 'Mark',
            appointmentStatusClass: 'missed',
          },
          {
            cname: 'Johnny Bloe',
            comments: 'Sometimes by accident, sometimes on purpose (injected humour and the like).',
            date: '16.11.2015',
            statusClass: 'danger',
            tagName: 'Mark',
            appointmentStatusClass: 'missed',
          },
          {
            cname: 'Johnny Bloe',
            comments: 'Sometimes by accident, sometimes on purpose (injected humour and the like).',
            date: '16.11.2015',
            statusClass: 'success',
            tagName: 'Mark',
            appointmentStatusClass: 'sold',
          },
          {
            cname: 'Johnny Bloe',
            comments: 'Sometimes by accident, sometimes on purpose (injected humour and the like).',
            date: '16.11.2015',
            statusClass: 'success',
            tagName: 'Mark',
            appointmentStatusClass: 'sold',
          },
        ]
      },
    ]


    var updateBarChart = function(status, category){
      var barData, idx;
      switch(status){
        case 'won':
          idx  = Util.indexOfObject(_dashboard.wonDeals.bar, 'category', category);
          if (idx != -1) barData = _dashboard.wonDeals.bar[idx];
          break;
        case 'lost':
          idx  = Util.indexOfObject(_dashboard.lostDeals.bar, 'category', category);
          if (idx != -1) barData = _dashboard.lostDeals.bar[idx];
          break;
        case 'total':
          idx  = Util.indexOfObject(_dashboard.totalDeals.bar, 'category', category);
          if (idx != -1) barData = _dashboard.totalDeals.bar[idx];
          break;
      }

      //update sales
      _dashboard.sales.length = 0;
      angular.forEach(barData.sales, function(value,key){
        _dashboard.sales.push([key, value]);
      });
    }

    var updateTableData = function(status, category){
      var tableData = getDealsData(status).tableData;
      var data = $filter('filter')(tableData, {$: category});
      console.log(data);
      $scope.$applyAsync(function(){
        _dashboard.dealsTableData = data;
      });
    }

    _dashboard.filterDeals = function(status){
      var idx = Util.indexOfObject(_dashboard.stats, 'id', status);
      console.log(idx);
      if (idx != -1){
        var s = _dashboard.stats[idx].sources;
        console.log(s);
        var sources = [];
        for(var i= 0; i < s.length; i++){
          if (s[i].state) sources.push(s[i].id)
        }
        if (status == 'won') _dashboard.filtered[0].state = true;
        if (status == 'lost') _dashboard.filtered[1].state = true;
        if (status == 'total') _dashboard.filtered[2].state = true;
        Dashboard.filter(status, sources);
        if (_dashboard.showBarChart) updateBarChart(status, _dashboard.displayingCategory);
        if (_dashboard.showTable) updateTableData(status, _dashboard.displayingCategory);
        updateStats(status);
        console.log('*** Deals Filtered ***');
      }
    }

    _dashboard.mapFilters = {Cars: false, Trucks: false, Utilities: false};
    _dashboard.expandedSection = '';

    _dashboard.resetMapFilters = function(){
      angular.forEach(_dashboard.mapFilters, function(value, key){
        _dashboard.mapFilters[key] = false;
      })
      _dashboard.resetFiltersBtn = false;
    }

    _dashboard.displayCategory = function(category){
      console.log('called');
      _dashboard.displayingCategory = category;
      _dashboard.expandSection = true;
      _dashboard.expandedSection = category;
      _dashboard.resetFiltersBtn = _dashboard.mapFilters.Cars || _dashboard.mapFilters.Trucks || _dashboard.mapFilters.Utilities;
      console.log('Cars: '+_dashboard.mapFilters.Cars);
      console.log('Trucks: '+_dashboard.mapFilters.Trucks);
      console.log('Utilities: '+_dashboard.mapFilters.Utilities);
      console.log(_dashboard.resetFiltersBtn);
    }

    _dashboard.toggleSection  = function(section) {
      if ((section == _dashboard.displayingCategory) && _dashboard.expandSection) {
        _dashboard.expandSection = false;
        _dashboard.expandedSection = '';
      } else _dashboard.displayCategory(section);
    }

    var updateStats = function(status){
      switch(status){
        case 'won':
          _dashboard.stats[0].cars =  {
            units: _dashboard.wonDeals.pie[0].data,
            pvr: _dashboard.wonDeals.pie[0].pvr
          };
          _dashboard.stats[0].trucks =  {
            units: (_dashboard.wonDeals.pie[1].data + _dashboard.wonDeals.pie[2].data + _dashboard.wonDeals.pie[3].data),
            pvr: (_dashboard.wonDeals.pie[1].pvr + _dashboard.wonDeals.pie[2].pvr + _dashboard.wonDeals.pie[3].pvr)
          };
          break;
        case 'lost':
          _dashboard.stats[1].cars =  {
            units: _dashboard.lostDeals.pie[0].data,
            pvr: _dashboard.lostDeals.pie[0].pvr
          };
          _dashboard.stats[1].trucks =  {
            units: (_dashboard.lostDeals.pie[1].data + _dashboard.lostDeals.pie[2].data + _dashboard.lostDeals.pie[3].data),
            pvr: (_dashboard.lostDeals.pie[1].pvr + _dashboard.lostDeals.pie[2].pvr + _dashboard.lostDeals.pie[3].pvr)
          };
          break;
        case 'total':
          _dashboard.stats[2].cars =  {
            units: _dashboard.wonDeals.pie[0].data + _dashboard.lostDeals.pie[0].data,
            pvr: _dashboard.wonDeals.pie[0].pvr + _dashboard.lostDeals.pie[0].pvr
          };
          _dashboard.stats[2].trucks =  {
            units: (_dashboard.wonDeals.pie[1].data + _dashboard.wonDeals.pie[2].data + _dashboard.wonDeals.pie[3].data) +
            (_dashboard.lostDeals.pie[1].data + _dashboard.lostDeals.pie[2].data + _dashboard.lostDeals.pie[3].data),
            pvr: (_dashboard.wonDeals.pie[1].pvr + _dashboard.wonDeals.pie[2].pvr + _dashboard.wonDeals.pie[3].pvr) +
            (_dashboard.lostDeals.pie[1].pvr + _dashboard.lostDeals.pie[2].pvr + _dashboard.lostDeals.pie[3].pvr)
          };
          break;
      }
    }

    var getStats = function(){
      return [
        { id:'won',
          cars: {
            units: _dashboard.wonDeals.pie[0].data,
            pvr: _dashboard.wonDeals.pie[0].pvr
          },
          trucks: {
            units: (_dashboard.wonDeals.pie[1].data + _dashboard.wonDeals.pie[2].data + _dashboard.wonDeals.pie[3].data),
            pvr: (_dashboard.wonDeals.pie[1].pvr + _dashboard.wonDeals.pie[2].pvr + _dashboard.wonDeals.pie[3].pvr)
          },
          sources: [
            {
              id: 'walkIn',
              name: 'Walk In',
              state: true,
            },
            {
              id: 'Internet',
              name: 'Internet',
              state: true,
            },
            {
              id: 'Phone',
              name: 'Phone',
              state: true,
            },
            {
              id: 'HappyTag',
              name: 'Happy Tag',
              state: true,
            },
            {
              id: 'Other',
              name: 'Other',
              state: true,
            }
          ]
        },

        { id:'lost',
          cars: {
            units: _dashboard.lostDeals.pie[0].data,
            pvr: _dashboard.lostDeals.pie[0].pvr
          },
          trucks: {
            units: (_dashboard.lostDeals.pie[1].data + _dashboard.lostDeals.pie[2].data + _dashboard.lostDeals.pie[3].data),
            pvr: (_dashboard.lostDeals.pie[1].pvr + _dashboard.lostDeals.pie[2].pvr + _dashboard.lostDeals.pie[3].pvr)
          },
          sources: [
            {
              id: 'walkIn',
              name: 'Walk In',
              state: true,
            },
            {
              id: 'Internet',
              name: 'Internet',
              state: true,
            },
            {
              id: 'Phone',
              name: 'Phone',
              state: true,
            },
            {
              id: 'HappyTag',
              name: 'Happy Tag',
              state: true,
            },
            {
              id: 'Other',
              name: 'Other',
              state: true,
            }
          ]
        },

        {
          id: 'total',
          cars: {
            units: _dashboard.totalDeals.pie[0].data,
            pvr: _dashboard.totalDeals.pie[0].pvr
          },
          trucks: {
            units: (_dashboard.totalDeals.pie[1].data + _dashboard.totalDeals.pie[2].data + _dashboard.totalDeals.pie[3].data),
            pvr: (_dashboard.totalDeals.pie[1].pvr + _dashboard.totalDeals.pie[2].pvr + _dashboard.totalDeals.pie[3].pvr)
          },
          sources: [
            {
              id: 'walkIn',
              name: 'Walk In',
              state: true,
            },
            {
              id: 'Internet',
              name: 'Web',
              state: true,
            },
            {
              id: 'Phone',
              name: 'Phone',
              state: true,
            },
            {
              id: 'HappyTag',
              name: 'Happy Tag',
              state: true,
            },
            {
              id: 'Other',
              name: 'Other',
              state: true,
            }
          ]
        }
      ];
    }
    _dashboard.showBarChart = false;
    _dashboard.selectedPie = null;


    /**
     * Pie Chart Data
     */
    _dashboard.wonDeals = Dashboard.won();
    _dashboard.lostDeals = Dashboard.lost();
    _dashboard.totalDeals = Dashboard.total();

    /**
     * Pie Chart Options
     */
    _dashboard.pieOptions = {
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


    _dashboard.sales = [];
    _dashboard.models = [];
    _dashboard.color = '#1ab394';


    _dashboard.showDetails = function($event, pos, item, chart){
      console.log(item);
      console.log(chart);
      _dashboard.selectedPie = chart;
      _dashboard.color = item.series.color;

      var barData;
      switch(chart){
        case 'won':
          barData = _dashboard.wonDeals.bar[item.seriesIndex];
          break;
        case 'lost':
          barData = _dashboard.lostDeals.bar[item.seriesIndex];
          break;
        case 'total':
          barData = _dashboard.totalDeals.bar[item.seriesIndex];
          break;
      }

      //set section title
      _dashboard.displayingCategory = barData.category;

      //set labels
      _dashboard.models.length = 0;
      angular.forEach(barData.models, function(value, key){
        _dashboard.models.push([key, value]);
      });

      //set sales
      _dashboard.sales.length = 0;
      angular.forEach(barData.sales, function(value,key){
        _dashboard.sales.push([key, value]);
      });

      if (!_dashboard.showBarChart) _dashboard.showBarChart = true;


      console.log('WonDeals');
      console.log(_dashboard.wonDeals);
      console.log("*****************************");

      console.log('LostDeals');
      console.log(_dashboard.lostDeals);
      console.log("*****************************");

      console.log('TotalDeals');
      console.log(_dashboard.totalDeals);
      console.log("*****************************");


      console.log('*** DEBUG Data Generated ***');
      console.log("*****************************");

      console.log(' Bar Color ');
      console.log(_dashboard.color);
      console.log("*****************************");

      console.log(' Models Data');
      console.log(_dashboard.models);
      console.log("*****************************");
      console.log(' Sales Data ');
      console.log(_dashboard.sales);
      console.log("*****************************");
    }

    _dashboard.barChartData = [
      {
        label: "Sales",
        grow:{stepMode:"linear"},
        data: _dashboard.sales,
        color: _dashboard.color,
        bars: {
          show: true,
          align: "center",
          barWidth: .62,  //24 * 60 *60 * 600
          lineWidth: 1
        }
      },
    ];


    _dashboard.barChartOptions = {
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
        ticks: _dashboard.models,
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
          deals = _dashboard.wonDeals;
          break;
        case 'lost':
          deals = _dashboard.lostDeals;
          break;
        case 'total':
          deals = _dashboard.totalDeals;
          break;
      }
      return deals;
    }

    /**
     *
     * @type {{category: string, status: string}}
     */

    _dashboard.sectionTitle = {category: '', status: ''};
    _dashboard.setTableData = function(chart, status, category, haystack){
      console.log(chart);
      console.log(status);
      if (status){
        _dashboard.sectionTitle.status = status;
        _dashboard.sectionTitle.category = chart ? chart.series.label: '';
      } else {
        var barData = getDealsData(_dashboard.sectionTitle.status).bar;
        for(var i= 0; i < barData.length; i++){
          if (barData[i].category == category){
             _dashboard.sectionTitle.category = barData[i].models[chart.dataIndex];
            break;
          }
        }
      }

      var tableData = getDealsData(_dashboard.sectionTitle.status).tableData;
      console.log(tableData);
      console.log(_dashboard.sectionTitle.category);
      var needle = '', data = [];
      switch(_dashboard.sectionTitle.category){
        case 'Cars':
        case 'Utilities':
        case 'Trucks':
        case 'Vans':
        case 'Other':
          if (_dashboard.sectionTitle.category == 'Cars') needle = 'car';
          if (_dashboard.sectionTitle.category == 'Trucks') needle = 'truck';
          if (_dashboard.sectionTitle.category == 'Utilities') needle = 'utility';
          if (_dashboard.sectionTitle.category == 'Vans') needle = 'van';
          if (_dashboard.sectionTitle.category == 'Other') needle = 'other';
          data = $filter('filter')(tableData, function(val,idx, arr){
            return val.vehicleInformation.category == needle;
          });
          break;
        default:
          needle = _dashboard.sectionTitle.category;
          data = $filter('filter')(tableData, function(val, idx, arr){
            return val.vehicleInformation.model == needle;
          });
          break;
      }
      console.log(data);
      $scope.$applyAsync(function(){
        _dashboard.dealsTableData = data;
      });
    }




      /**
       *  Display Details Table
       * @param $event
       * @param pos
       * @param item
       */
    _dashboard.displayTable = function($event, pos, item, status, category){
       if (!_dashboard.showTable) _dashboard.showTable = true;
       //status = status == 'won' ? 'working': status;
      _dashboard.setTableData(item, status, category);
    }


      /**
       *  deals  table Data
       */
      _dashboard.dealsTableData = [];
      _dashboard.dtOptions = DTOptionsBuilder.newOptions()
          .withDOM('<"html5buttons"B>lTfgitp')
          .withOption('order', [[7, 'desc']])
          .withOption('responsive', true)
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
     * Stats Display Mode
     * @type {string}
     */
    _dashboard.chartView = 'chart';

    /**
     * StatsMap & Options
     * @type {{}}
     */
    _dashboard.statsMap = {};
    _dashboard.chartMapOptions = {
      zoom: 11,
      center: new google.maps.LatLng(38.9072, -77.0369),
      // Style for Google Maps
      styles: [{
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
    _dashboard.refreshMap = function (map) {
      $scope.$applyAsync(function(map){
        var m = map || _dashboard.statsMap;
        if (m) google.maps.event.trigger(m, 'resize');
        console.log('*** Refresh Map ***');
      })
    }





    _dashboard.chatRecipient = {name: '', number: ''};
    _dashboard.composeText = function(deal, event){
       event.stopPropagation();
      console.log('*** Compose Text ***');
      console.log(deal);
      if (deal.customerDetails.phone && deal.customerDetails.phone.toString().trim() != '') {
         if (!_dashboard.openChat) _dashboard.openChat = true;
        _dashboard.chatRecipient = {name:deal.customerDetails.name, number: deal.customerDetails.phone};
      } else toaster.error({
        title: 'Message Error',
        body: 'There are no phone number detected for this customer. please update the customer details.'
      })

    }

    _dashboard.composeMail = function(deal, event){
      event.stopPropagation();
      console.log('*** Compose Mail ****');
      console.log(deal);
      if (deal.customerDetails.email && deal.customerDetails.email.toString().trim() != '') {
        var mailTo = 'mailto:' + deal.customerDetails.email
        var w = $window.open(mailTo);
        var t = $timeout(function () {
          w.close();
        });
        $scope.on('destroy', function () {
          $timeout.cancel(t);
        })
      } else  toaster.error({
        title: 'Mail Error',
        body: 'No Email address detected for customer. Please update the customer info.'
      })



      /*var modalInstance = $uibModal.open({
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
      });*/
    }

    $scope.addLead = function () {
      var modalInstance = $uibModal.open({
        animation: true,
        windowClass: 'slide-up',
        templateUrl: 'app/account/dashboard/addLead.html',
        controller: 'AddLeadCtrl',
      });
    }
    $scope.addTask = function () {
      var modalInstance = $uibModal.open({
        animation: true,
        windowClass: 'slide-up',
        templateUrl: 'app/account/task/assignLead.html',
        controller: 'AddTaskCtrl',
      });
    }
  });


