'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module of the application.
 */
angular
  .module('clientApp', [
    'ngResource',
    'ngRoute',
    'restangular',
    'ngImgCrop',
    'angularFileUpload',

  ])
  .constant("CONFIG", {
      "API_HOST": "http://127.0.0.1:3000/apiv0",
      "API_UPLOADS": "/uploads"
  })
  .config(function ($routeProvider, RestangularProvider, $httpProvider, CONFIG) {

    $httpProvider.interceptors.push('authInterceptor');
    $httpProvider.interceptors.push('httpErrorResponseInterceptor');
    //$locationProvider.html5Mode(true);

    RestangularProvider.setBaseUrl(CONFIG.API_HOST);

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .when('/logout', {
        templateUrl: 'views/logout.html',
        controller: 'LogoutCtrl',
        controllerAs: 'logout'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl',
        controllerAs: 'signup'
      })
      .when('/404', {
          templateUrl: '404.html'
      })
      // keep username one of the last routes in the app to avoid faulty routing with just using the username
      .when('/:username', {
          templateUrl: 'views/user.html',
          controller: 'UserCtrl'
      })
      .when('/user/:username/profile', {
          templateUrl: 'views/profile.html',
          controller: 'ProfileCtrl'
      })
      .when('/user/:username/account', {
          templateUrl: 'views/account.html',
          controller: 'AccountCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  /*
   * Restangular factories
   */
  .factory('LoginRestangular', function(Restangular) {
      return Restangular.withConfig(function(RestangularConfigurer) {
          RestangularConfigurer.setRestangularFields({
              id: '_id'
          });
      });
  })
  .factory('Login', function(LoginRestangular) {
      return LoginRestangular.service('login');
  })
  .factory('UserRestangular', function(Restangular) {
      return Restangular.withConfig(function(RestangularConfigurer) {
          RestangularConfigurer.setRestangularFields({
              id: '_id'
          });
      });
  })
  .factory('User', function(UserRestangular) {
      return UserRestangular.service('user');
  })

  // END of Restangular factories

  // use this factory to check if the user is logged in or not
  .factory('AuthenticationService', function() {
      var auth = {
          isLogged: false
      }

      return auth;
  })
  // use this factory to log out the user
  .factory('LogoutService', function(AuthenticationService, $location, $window) {
      var logout = {
          logout: function() {
              delete $window.sessionStorage.token;
              delete $window.sessionStorage.user;
              AuthenticationService.isLogged = false;
              $location.path('/login');
          }
      };

      return logout;
  })
  // factory used to authenticate the requests
  .factory('authInterceptor', function($rootScope, $q, $window, $location, AuthenticationService) {
      return {
          request: function(config) {
              config.headers = config.headers || {};
              if ($window.sessionStorage.token) {
                  config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
                  AuthenticationService.isLogged = true;
              }
              return config;
          },
          response: function(response) {
              if (response.status === 401) {
                  $location.path('/login');
                  AuthenticationService.isLogged = false;
              }
              return response || $q.when(response);
          }
      };
  })
  // factory used to behave in a certain way after receiving the request status code from the server
  .factory('httpErrorResponseInterceptor',
      function($q, $location, LogoutService) {
          return {
              response: function(responseData) {
                  return responseData;
              },
              responseError: function error(response) {
                  console.info(response.status);
                  switch (response.status) {
                      case 401:
                          LogoutService.logout();
                          break;
                      case 404:
                          $location.path('/404');
                          break;
                      default:
                          break;
                  }

                  return $q.reject(response);
              }
          };
  });
