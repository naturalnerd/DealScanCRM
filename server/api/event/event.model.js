'use strict';

export default function(sequelize, DataTypes) {
  var Event = sequelize.define('Event', {
    eventID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    time: DataTypes.DATE,
    category: DataTypes.STRING,
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'normal', 'medium', 'important'],
      defaultValue:'normal'
    },
    status: DataTypes.STRING
  }, {
    /**
     * Virtual Getters
     */
    getterMethods: {
      //Public profile information
      profile: function () {
        return {
          'eventID': this.getDataValue('eventID'),
          'name': this.getDataValue('name'),
          'description': this.getDataValue('description'),
          'location': this.getDataValue('location'),
          "time": this.getDataValue('time'),
          "category": this.getDataValue('category'),
          'priority': this.getDataValue('priority'),
          'status': this.getDataValue('status'),
          'createdAt': this.getDataValue('createdAt')
        }
      },

      // Non-sensitive info we'll be putting in the token
      token: function () {
        return {
          'eventID': this.getDataValue('eventID'),
          'name': this.getDataValue('name'),
          'description': this.getDataValue('description'),
          'location': this.getDataValue('location'),
          "time": this.getDataValue('time'),
          "category": this.getDataValue('category'),
          'priority': this.getDataValue('priority'),
          'status': this.getDataValue('status'),
          'createdAt': this.getDataValue('createdAt')
        }
      },
    },

  });

  return Event;
}
