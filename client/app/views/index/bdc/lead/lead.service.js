'use strict';

angular.module('dealScanCrmApp')
  .factory('Lead', function (Auth, LeadResource, Util) {
    // Service logic
    // ...

    var user = Auth.getCurrentUser();
    var _leads = [];

      /**
       * Create New Lead
       * @param options
       */
    function createLead(details){
        if (!details) throw new Error('Lead Details are required');
        if (!details.name) throw new Error('Lead Name is required');
        if (!details.phone) throw new Error('Lead phone is required');
        if (!details.source) throw new Error('Lead Source is required');
        return LeadResource.save(details)
          .$promise.then(function (lead) {
            if (lead && !lead.error) {
              lead.profile.timeAgo = moment(lead.profile.createdAt).fromNow();
              _leads.unshift(lead.profile);
            }
            return lead;
          }).catch(function (err) {
            console.log(err);
            return {error: {msg: err.data, code: err.status}};
          });
    }

      /**
       * Update Exisiting Lead
       */
    function editLead(leadID, details){
        if (!leadID) throw new Error('LeadID is required');
        if (!details) throw new Error('Lead Details are required');
        if (!details.name) throw new Error('Lead Name is required');
        if (!details.phone) throw new Error('Lead phone is required');
        return LeadResource.update({id: leadID}, details)
          .$promise.then(function(lead){
            if (lead){
              var idx = Util.indexOfObject(_leads, 'leadID', leadID);
              lead.profile.timeAgo = moment(lead.profile.createdAt).fromNow();
              if (idx != -1) _leads.splice(idx, 1, lead.profile);
              return lead.profile;
            }
          }).catch(function(err){
            console.log(err);
            return err;
          });
    }

    /**
     * Schedule lead Appointment
     * @param details
       */
    function scheduleAppointment(details){
      if (!details) throw new Error('Appointment Details are needed');
      return LeadResource.scheduleLead(details)
        .$promise.then(function(appointment){
        console.log(appointment);
        if (appointment){
          return appointment;
        } else return {error: {msg: '', code:''}};
      }).catch(function(err){
         console.log(err);
         return err;
      });
    }

    /**
     * Add note to lead
     * @param details
     * @returns {*}
       */
    function addNote(details){
      if (!details) throw new Error('Note Details are needed');
      if (!details.leadID) throw new Error('Lead Details is required');
      if (!details.note) throw new Error('Note content is required');
      return LeadResource.note(details)
        .$promise.then(function(note){
          console.log(note);
        if (note){
           return note;
        } else return {error: {msg: '', code: ''}};
      }).catch(function(err){
          console.log(err);
          return err;
        });

    }

      /**
       * Delete Lead
       */
      function deleteLead(leadID){


    }

      /**
       * Get List of leads
       */
    function getLeads(){
      return LeadResource.query().$promise
        .then(function(leads){
           console.log(leads);
           if (leads && !leads.error){
              _leads.length = 0;
              for (var i = 0; i < leads.length; i++) {
                leads[i].profile.timeAgo = moment(leads[i].profile.createdAt).fromNow();
                _leads.push(leads[i].profile);
              }
              return _leads;
           } else return {error: {msg:leads.error.msg}};
        })
        .catch(function(err){
          console.log(err);
          return err;
      });
    }

      /**
       * assign lead to User
       */
    function assignLead(){


    }

      /**
       * Convert Lead to Customer
       */
    function convertLead(){



    }


    // Public API here
    return {
      create: createLead,
      update: editLead,
      remove: deleteLead,
      leads: getLeads,
      appointment: scheduleAppointment,
      note: addNote,
      assign: assignLead,
      convert: convertLead
    };
  });
