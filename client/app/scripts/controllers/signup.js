'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:SignupCtrl
 * @description
 * # SignupCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
    .controller('SignupCtrl', function($scope, User, $location, $window, AuthenticationService, FileUploader) {
        if (AuthenticationService.isLogged) {
            $location.path(JSON.parse($window.sessionStorage.user).username);
            return;
        } else {
            $scope.viewSignup = true;
            $scope.user = {};
            $scope.user.profile = {};
            $scope.saveUser = function() {
                $scope.loading = true;
                User.one('signup').customPOST($scope.user).then(function() {
                    $location.path('/login');
                }, function(response) {
                    if (response.data.code === 11000) {
                        $scope.message = "Username or email address are already taken.";
                    } else {
                        $scope.message = response.data;
                    }
                    $scope.loading = false;
                });
            };
        }
    });
