'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MenuCtrl
 * @description
 * # MenuCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
    .controller('MenuCtrl', function($scope, $http, $window, $location, AuthenticationService, CONFIG) {
        $scope.menu = {};
        $scope.host = CONFIG.API_HOST;
        // check if a user is logged in and if the the sessionStorage contains data for extra security
        if (AuthenticationService.isLogged && $window.sessionStorage.token && $window.sessionStorage.user) {
            var user = JSON.parse($window.sessionStorage.user);
            $scope.menu.username = user.username;
            $scope.menu.avatar = user.avatar;
            $scope.menu.loggedIn = true;
        } else {
            $scope.menu.username = "Guest";
            $scope.menu.avatar = "/uploads/default.png";
            $scope.menu.loggedIn = false;
        }
    });
