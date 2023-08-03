/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  '/': { view: 'pages/homepage' },

  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/

  'post /admin/signin': 'UsersController.adminSignin',
  'put /change/password': 'UsersController.changePassword',
  'post /register': 'UsersController.register',
  'post /user/signin': 'UsersController.userSignin',
  'post /forgot/password': 'UsersController.forgotPassword',
  'put /reset/password': 'UsersController.resetPassword',
  'post /add/user': 'UsersController.addUser',
  'get /users/list': 'UsersController.getAllUsers',
  'post /forgot/password/frontend': 'UsersController.forgotPasswordFrontend',
  'get /user/details': 'UsersController.userDetails',
  'get /check/Email': 'UsersController.checkEmail',
  'get /profile': 'UsersController.userProfileData',
  'get /user/detail': 'UsersController.userDetail',
  'put /edit/profile': 'UsersController.editProfile',

  'get /auto/login': 'UsersController.autoLogin',
  

  /** CommonController routes*/

  'post /upload/image': 'CommonController.uploadImage',
  'put /change/status': 'CommonController.changeStatus',
  'delete /delete': 'CommonController.commonDelete',
  'post /uploadvideos': 'CommonController.uploadVideos',
  'get /verifyUser': 'UsersController.verifyUser',

  /**CategoryController routes*/

  'post /category': 'CategoryController.addCategory',
  'get /categories': 'CategoryController.listCategory',
  'put /category': 'CategoryController.editCategory',
  'delete /category': 'CategoryController.deleteCategory',
  'get /category': 'CategoryController.categoryDetail',

  /**groupController routes*/

  'post /group': 'GroupController.addGroup',
  'get /group/list': 'GroupController.listGroup',
  'put /group': 'GroupController.editGroup',
  'delete /group': 'GroupController.deleteGroup',
  'get /group': 'GroupController.groupDetail',

  // invitation Controller routes
  'post /inviteusers': 'InviteusersController.inviteusers',
  'post /invite/multiple/users': 'InviteusersController.invitemultipleusers',
  'get /getAll/Inviteusers': 'InviteusersController.getAllinviteusers',
  'post /resent/Invite': 'InviteusersController.resentInvite',
  'get /get/qrcode': 'InviteusersController.generate_qrcode',


  // product Controller routes
  'post /add/product': 'ProductController.addproduct',
  'get /getAll/Product': 'ProductController.getAllProduct',
  'delete /delete/Product': 'ProductController.deleteproduct',
  'get /get/Product': 'ProductController.productDetails',
  'put /edit/Product': 'ProductController.editProduct',

  // Stripe Controller routes
  'post /add/card': 'StripeController.addCard',
  'get /getCards': 'StripeController.getCards',
  'delete /Cards': 'StripeController.deleteCard',
  'put /primary/card': 'StripeController.setPrimaryCard',

  // 'post /subscribe/newsletter':
  //   'NewsletterSubscriptionController.subscribeToNewsLetter',



  /**SubscriptionPlansController routes */

  'post /subscriptionplan': 'SubscriptionPlansController.addSubscriptionPlan',
  'get /subscriptionplan': 'SubscriptionPlansController.getPlanById',
  'get /purchase/plan': 'SubscriptionPlansController.getPurchasedPlan',
  'put /subscriptionplan': 'SubscriptionPlansController.editsubscriptionPlan',
  'get /subscriptionplans': 'SubscriptionPlansController.getAllPlans',
  'get /subscriptionplans/frontend':
    'SubscriptionPlansController.getAllPlansFrontend',
  'delete /subscriptionplan': 'SubscriptionPlansController.removePlans',
  'post /purchaseplan': 'SubscriptionPlansController.purchaseplan',
  'get /purchaseplans': 'SubscriptionPlansController.getAllPurchase',
  'get /activePlan': 'SubscriptionPlansController.myActiveSubscription',



  // trading api
  'get /End_of_Day': 'TradingController.End_of_Day',
  'get /Intraday': 'TradingController.Intraday',
  'get /Tickers': 'TradingController.Tickers',
  'get /Exchanges': 'TradingController.Exchanges',
  'get /Currencies': 'TradingController.Currencies',
  'get /Timezones': 'TradingController.Timezones',


};
