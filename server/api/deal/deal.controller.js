/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/deals              ->  index
 * POST    /api/deals              ->  create
 * GET     /api/deals/:id          ->  show
 * PUT     /api/deals/:id          ->  update
 * DELETE  /api/deals/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import {Dealership} from '../../sqldb';
import {Deal} from '../../sqldb';
import {User} from '../../sqldb';
import {Customer} from '../../sqldb';
import {Vehicle} from '../../sqldb';
import {Trade} from '../../sqldb';

var Q = require('q');
var moment = require('moment');


function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    console.log(err);
    res.status(statusCode).send(err);
  };
}

// Gets a list of Deals
export function index(req, res) {
  console.log(req.query);
  if (!req.query.hasOwnProperty('dealershipID') || !req.query.dealershipID || req.query.dealershipID.trim() == '')
    res.status(500).send('DealershipID is required!');
  if (!req.query.hasOwnProperty('from') || !req.query.from || req.query.from.trim() == '')
    res.status(500).send('Date Range "From" is required!');
  if (!req.query.hasOwnProperty('to') || !req.query.to || req.query.to.trim() == '')
    res.status(500).send('Date Range "To" is required!');
  var searchOptions = {
    dealershipID: req.query.dealershipID,
    createdAt: {
      $lte: req.query.to,
      $gte: req.query.from
    }
  };
  if (req.query.hasOwnProperty('employee') && req.query.employee && req.query.employee.trim() != '')
    searchOptions.saleRepID = req.query.employee;
  Deal.findAll({
      where: searchOptions,
      include:[
        {
          model: User,
          as:'SaleRep',
          attributes: ['userID','firstName', 'lastName', 'role'],
          required: true
        },
        {
          model: Customer,
          as: 'Buyer',
          attributes: ['customerID','firstName', 'lastName', 'phone', 'email', 'source'],
          required: true
        },
        {
          model: Customer,
          as: 'CoBuyers',
          attributesL: ['customerID','firstName', 'lastName', 'phone', 'email', 'source']
        },
        {
          model: Vehicle,
          as: 'Purchase',
          attributes: ['vehicleID','make', 'model', 'year','invoice','trimLevel', 'state', 'classification'],
          required: true
        },
      ]
    })
    .then(function(deals){
      if (deals && deals.length > 0){
        return res.status(200).json(formatDeals(deals));
      } else return res.status(200).json([]);
    }).catch(handleError(res));
}

function formatDeals(deals){
  var _deals = [];
  for(var i = 0; i < deals.length; i++){
    var deal = deals[i];
    var dt = moment(new Date(deal.createdAt));
    _deals.push({
      "model": deal.Purchase.profile.model,
      "vehicleID": deal.Purchase.profile.vehicleID,
      "category": deal.Purchase.profile.classification,
      "make": deal.Purchase.profile.make,
      "year": deal.Purchase.profile.year,
      "trimLevel": deal.Purchase.profile.trimLevel,
      "customerID": deal.Buyer.profile.customerID,
      "name": deal.Buyer.profile.name,
      "email": deal.Buyer.profile.email,
      "phone": deal.Buyer.profile.phone,
      "date": dt.format("ddd, MMM DD YYYY HH:MM a"),
      "userID": deal.saleRepID,
      "salesman": deal.SaleRep.profile.name,
      "source": deal.Buyer.profile.source,
      "price": deal.salePrice,
      "retailValue": deal.retailValue,
      "cost":deal.Purchase.profile.invoice,
      "status": deal.status,
      "paymentOption": deal.paymentOption,
      "dealID": deal.dealID,
      "dealershipID": deal.dealershipID,
      "dscDealID": deal.dscDealID
    });
  }
  return _deals;
}


export function getKPI(req, res){

  return User.find({
    where: {
      userID: req.user.userID
    },
    include: [
      {
        model: Dealership,
        as: 'Employer',
        required: true
      }
    ]
  }).then(function(user){
    if (user){

      var dealershipID = user.Employer[0].token.dealerID;
      var saleRep = '';
      var promises = [];
      var from = (moment().startOf('month')).format('YYYY-MM-DD');
      var to = moment().format('YYYY-MM-DD');
      if (req.user.role == 'sale_rep') saleRep = ' AND saleRepID = '+req.user.userID+' ';

      /* Get New Cars KPI */
      promises.push(Deal.sequelize
        .query('SELECT classification AS Classification,' +
          ' COUNT(DISTINCT dealID) AS Units, SUM(Deals.salePrice - Deals.retailValue) AS Gross' +
          ' FROM Deals INNER JOIN Vehicles ON Deals.vehicleID = Vehicles.vehicleID' +
          ' WHERE (Deals.createdAt <= "'+to+'" AND Deals.createdAt >= "'+from+'") AND state="new" AND (status = "working" OR status = "sold" OR status="won") ' +
          'AND dealershipID = '+dealershipID+' '+saleRep+
          ' GROUP BY classification',
          {type: Deal.sequelize.QueryTypes.SELECT}));

      /* Get Used Card KPI */
      promises.push(Deal.sequelize
        .query('SELECT classification AS Classification,' +
          ' COUNT(DISTINCT dealID) AS Units, SUM(Deals.salePrice - Deals.retailValue) AS Gross' +
          ' FROM Deals INNER JOIN Vehicles ON Deals.vehicleID = Vehicles.vehicleID' +
          ' WHERE (Deals.createdAt <= "'+to+'" AND Deals.createdAt >= "'+from+'") AND state="used" AND (status = "working" OR status = "sold" OR status="won") ' +
          'AND dealershipID = '+dealershipID+' '+saleRep+
          'GROUP BY classification',
          {type: Deal.sequelize.QueryTypes.SELECT}));
      /*  */
      return Q.all(promises).then(function(kpis){
        //console.log(kpis);
        return res.status(200).json({"new": kpis[0], "used":kpis[1]});
      });

    } else return res.status(200).json([]);
  }).catch(handleError(res));

}

// Gets a single Deal from the DB
export function show(req, res) {
  Deal.find({
    where: {
      dealID: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Deal in the DB
export function create(req, res) {
  Deal.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Sync Deals  in the DB
export function sync(req, res) {

  console.log(' -- Deals To Process ---');
  //console.log(req.body);
  var deals = req.body;
  var promises = [];
  for(var i=0; i < deals.length; i++)
    promises.push(Deal.dscUpsert(deals[i]));
  return Q.all(promises).then(respondWithResult(res)).catch(handleError(res));
}

// Updates an existing Deal in the DB
export function update(req, res) {
  if (req.body.dealID) {
    delete req.body.dealID;
  }
  Deal.find({
    where: {
      dealID: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Deal from the DB
export function destroy(req, res) {
  Deal.find({
    where: {
      dealID: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
