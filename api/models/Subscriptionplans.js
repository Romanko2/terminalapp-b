/**
 * Plans.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
  schema: true,
  attributes: {
      name: { type: 'string', required: true },
      amount: { type: 'number', defaultsTo: 0 },

      status: {
          type: 'string',
          isIn: ['active', 'deactive'],
          defaultsTo: 'active'
      },

      stripe_plan_id: { type: 'string', },
      stripe_product_id: { type: 'string', },

      interval: { type: 'string', isIn: ['month', 'year', 'week', 'day'] },
      interval_count: { type: 'number', defaultsTo: 1 },
      trial_period_days: { type: 'number', defaultsTo: 0 },
      description: { type: 'string' },

      // common feilds
      addedBy: { model: 'users' },
      updatedBy: { model: 'users' },
      isDeleted: { type: 'Boolean', defaultsTo: false },
      createdAt: { type: 'ref', autoCreatedAt: true },
      updatedAt: { type: 'ref', autoUpdatedAt: true },
  }
};