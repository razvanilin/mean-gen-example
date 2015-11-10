'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('UserCtrl', function ($scope, $routeParams, User, CONFIG, $window) {
    $scope.user = {};
    $scope.host = CONFIG.API_HOST;
    $scope.user.username = $routeParams.username;
    $scope.loading = true;
    User.one($routeParams.username).customGET('profile')
        .then(function(data) {
            $scope.loading = false;
            $scope.user = data;
            console.log($scope.user);
        });
  });
