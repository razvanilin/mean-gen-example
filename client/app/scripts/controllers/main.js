'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
    .controller('MainCtrl', function ($scope, AuthenticationService, $location, $window, CONFIG, $http) {

      // if the user is logged in, change the url to the user's page
      if (AuthenticationService.isLogged) {
      	$location.path(JSON.parse($window.sessionStorage.user).username);
      }
  });
