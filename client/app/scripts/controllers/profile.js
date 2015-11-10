'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProfileCtrl
 * @description
 * # ProfileCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('ProfileCtrl', function ($scope, $routeParams, User, AuthenticationService, $location, $window, CONFIG, FileUploader, $anchorScroll) {
    $scope.viewProfile = true;
    $scope.mainLoad = true;
    $scope.profile = {};
    $scope.host = CONFIG.API_HOST;

    // check if the user is logged in
    if (AuthenticationService.isLogged) {

      // function used to automatically scroll inside the page
      $scope.scrollTo = function() {
          setTimeout(function() {
              var old = $location.hash();
              $location.hash('upload');
              $anchorScroll();
              //reset to old to keep any additional routing logic from kicking in
              $location.hash(old);

          });
      };

      // get the user's unique id and use it for the http request
      var id = JSON.parse($window.sessionStorage.user).id;
      // get the user's profile
      User.one(id).get().then(function(data, status, headers, config) {
          $scope.mainLoad = false;
          var profile = data;
          // save the user's profile to the scope
          $scope.profile = profile;

          // function used to save the user's profile details (first name, last name and email)
          $scope.saveProfile = function() {
              $scope.loading = true;
              // restangular's way of making a PUT request with the profile JSON object
              $scope.profile.save().then(function() {
                  $scope.loading = false;
                  $scope.success = "Great! Your profile was updated.";
              }, function(response) {
                  $scope.loading = false;
                  $scope.error = response.data;
              });
          };

          // function used when we want to make modifications to the user's avatars (change current one or delete an existing one)
          $scope.changeAvatar = function(newAvatar, requestType) {
            // save the new selected avatar to the scope
            $scope.profile.newAvatar = newAvatar;
            $scope.profile.requestType = requestType;
            // make the PUT request with the new configuration
            User.one($scope.profile.username).customPUT($scope.profile, 'avatar').then(function(data) {
              // parse the information we have saved in the session storage
              var user = JSON.parse($window.sessionStorage.user);

              if (requestType == "change") {
                // we changed the avatar on the server, but let's also modify the avatar real-time
                // that way we don't have to make another request to the server to get the data
                user.avatar = newAvatar;
                // change the user object in the session storage
                $window.sessionStorage.user = JSON.stringify(user);
                $scope.avatarChangeStatus = 1;
              } else if (requestType == "delete") {
                // if the deleted picture matches the current used one, then switch back to the default avatar
                if (user.avatar == newAvatar) {
                    user.avatar = '/uploads/default.png';
                    $window.sessionStorage.user = JSON.stringify(user);
                }
                // delete the image from the the scope so it dissapears from the view
                var deletedIndex = $scope.profile.uploads.indexOf(data);
                $scope.profile.uploads.splice(deletedIndex, 1);

                $scope.avatarChangeStatus = 2;
              }

            }, function(response) {
              $scope.avatarChangeStatus = 3;
            });

          };
      });

      // create our FileUploader object
      var url = CONFIG.API_HOST + "/user/" + JSON.parse($window.sessionStorage.user).username + "/avatar";
      var uploader = $scope.uploader = new FileUploader({
          url: url,
          headers: {
              'Authorization': 'Bearer ' + $window.sessionStorage.token
          },
          queueLimit: 1
      });

      // FILTERS for the files
      uploader.filters.push({
          name: 'imageFilter',
          fn: function(item /*{File|FileLikeObject}*/ , options) {
              var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
              return '|jpg|png|jpeg|'.indexOf(type) !== -1;
          }
      });

      /**
       * Show preview with cropping
       */
      uploader.onAfterAddingFile = function(item) {
          $scope.avatarChangeStatus = 0;
          $scope.scrollTo();
          item.croppedImage = '';
          var reader = new FileReader();
          reader.onload = function(event) {
              $scope.$apply(function() {
                  item.image = event.target.result;
              });
          };
          reader.readAsDataURL(item._file);
      };

      /**
       * Upload Blob (cropped image) instead of file.
       * @see
       *   https://developer.mozilla.org/en-US/docs/Web/API/FormData
       *   https://github.com/nervgh/angular-file-upload/issues/208
       */
      uploader.onBeforeUploadItem = function(item) {
          var blob = dataURItoBlob(item.croppedImage);
          item._file = blob;
      };

      /**
       * Converts data uri to Blob. Necessary for uploading.
       * @see
       *   http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
       * @param  {String} dataURI
       * @return {Blob}
       */
      var dataURItoBlob = function(dataURI) {
          var binary = atob(dataURI.split(',')[1]);
          var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
          var array = [];
          for (var i = 0; i < binary.length; i++) {
              array.push(binary.charCodeAt(i));
          }
          return new Blob([new Uint8Array(array)], {
              type: mimeString
          });
      };

      // CALLBACKS

      uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/ , filter, options) {
          //console.info('onWhenAddingFileFailed', item, filter, options);
          $scope.error = "File format not supported. You can upload JPG/JPEG/PNG.";
      };
      uploader.onAfterAddingAll = function(addedFileItems) {
          $scope.scrollTo();
          //console.info('onAfterAddingAll', addedFileItems);
      };
      uploader.onProgressItem = function(fileItem, progress) {
          $scope.avatarChangeStatus = 0;
          $scope.error = null;
          //console.info('onProgressItem', fileItem, progress);
      };
      uploader.onProgressAll = function(progress) {
          //console.info('onProgressAll', progress);
      };
      uploader.onSuccessItem = function(fileItem, response, status, headers) {
          $scope.profile.uploads.push(response);
          uploader.queue.length = 0;
          //console.info('onSuccessItem', fileItem, response, status, headers);
      };
      uploader.onErrorItem = function(fileItem, response, status, headers) {
          //if (status === 403) {
              console.log(response);
              $scope.error = response;
          //}
          //console.info('onErrorItem', fileItem, response, status, headers);
      };
      uploader.onCancelItem = function(fileItem, response, status, headers) {
          //console.info('onCancelItem', fileItem, response, status, headers);
      };
      uploader.onCompleteItem = function(fileItem, response, status, headers) {
          //console.info('onCompleteItem', fileItem, response, status, headers);
      };
      uploader.onCompleteAll = function() {
          //console.info('onCompleteAll');
      };
    } else {
    	$location.path('/login')
    }
  });
