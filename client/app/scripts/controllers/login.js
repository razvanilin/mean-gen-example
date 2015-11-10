'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
    .controller('LoginCtrl', function($scope, $http, $window, $location, AuthenticationService, Login) {
        // check if the user is logged in
        if (AuthenticationService.isLogged) {
            $location.path(JSON.parse($window.sessionStorage.user).username);
        }
        $scope.viewLogin = true;
        $scope.login = {};
        $scope.message = '';
        $scope.logIn = function() {
            $scope.loading = true;
            Login.post($scope.login).then(function(data, status, headers, config) {
                    $scope.loading = false;
                    $window.sessionStorage.token = data.token;
                    $window.sessionStorage.user = JSON.stringify(data.user);
                    AuthenticationService.isLogged = true;

                    $scope.message = false;

                    var username = JSON.parse($window.sessionStorage.user).username;
                    $location.path(username);
                },
                function(response) {
                    $scope.loading = false;
                    //console.log(response.data, response.status);
                    delete $window.sessionStorage.token;
                    delete $window.sessionStorage.user;
                    AuthenticationService.isLogged = false;
                    $scope.message = 'Invalid username or password';
                });
        };
    });
