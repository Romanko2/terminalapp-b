/**
  * Subscriptions.js
*/
module.exports = {
  schema: true,
  primaryKey: 'id',
  attributes: {
      user_id: { model: "users", required: true },
      stripe_subscription_id: { type: "string" },
      subscription_plan_id: { model: "subscriptionplans" },
      status: {
          type: "string",
          isIn: ["active", "cancelled", "inactive"],           // 1 for active, 2 for cancelled, inactive : cancelled but billing cycle not ended
          defaultsTo: "active"
      },

      name: { type: 'string' },
      amount: { type: 'number', defaultsTo: 0 },

      interval: { type: 'string', isIn: ['month', 'year', 'week', 'day'] },
      interval_count: { type: 'number', defaultsTo: 1 },
      trial_period_days: { type: 'number', defaultsTo: 0 },
      description: { type: 'string' },

  
      valid_upto: { type: 'ref', columnType: "datetime" },
      trial_period_end_date: { type: 'ref', columnType: "datetime" },

      // common fields
      addedBy: { model: "users", },
      updatedBy: { model: "users", },
      createdAt: { type: 'ref', autoCreatedAt: true },
      updatedAt: { type: 'ref', autoUpdatedAt: true },

  }
};
