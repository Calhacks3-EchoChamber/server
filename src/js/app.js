var app = angular.module('StarterApp', ['ngMaterial', 'ngResource', 'ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
    
    // $urlRouterProvider.otherwise('/login');
    
    $stateProvider
        
        // HOME STATES AND NESTED VIEWS ========================================
        .state('login', {
            url: '/login',
            templateUrl: 'js/login/login.partial.html'
        })
        
        // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
        .state('dash', {
            url: '/dash',
            templateUrl: 'js/dash/dash.partial.html'
            // we'll get to this in a bit
        })
        
        .state('chat', {
            url: '/chat',
            templateUrl: 'js/chat/chat.partial.html'
            // we'll get to this in a bit
        });
        
});

app.factory('facebookService', function($q) {
    return {
        isLoggedIn: function() {
          console.log("checking if logged in");
          return new Promise(function(resolve, reject){
            FB.getLoginStatus(function(response) {
              if (response.status === 'connected') {
                // the user is logged in and has authenticated your
                // app, and response.authResponse supplies
                // the user's ID, a valid access token, a signed
                // request, and the time the access token
                // and signed request each expire
                var uid = response.authResponse.userID;
                var accessToken = response.authResponse.accessToken;
                resolve();
              } else if (response.status === 'not_authorized') {
                // the user is logged in to Facebook,
                // but has not authenticated your app
                reject();
              } else {
                // the user isn't logged in to Facebook.
                reject();
              }
             });
          })
        },
        getMyLastName: function() {
          return new Promise(function(resolve, reject){
            FB.api('/me', {
                fields: 'last_name'
            }, function(response) {
                if (!response || response.error) {
                    reject('Error occured');
                } else {
                    resolve(response);
                }
            });
          });
        },
        
        getMyProfilePictureUrl: function() {
          return new Promise(function(resolve, reject){
            FB.api('/me', {
                fields: 'picture'
            }, function(response) {
                if (!response || response.error) {
                    reject('Error occured');
                } else {
                    resolve(response.picture.data.url);
                }
            });
          });
        }
    }
});

app.run(['$rootScope', '$state', 'facebookService', function($rootScope, $state, fbService) {
  
    $state.go('login');

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      
      fbService.isLoggedIn().then(
        function(){
          console.log("We are authed");
          if(to.name === "login"){
            evt.preventDefault();
            $state.go('dash');
          }
        
      }, function(){
          console.log("We are not authed");
          if(to.name !== "login"){
            evt.preventDefault();
            $state.go('login');
          }
      });
      
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params, {location: 'replace'})
      }
    });
}]);

app.controller('AppCtrl', ['$scope', '$resource', 'facebookService', function($scope, $resource, fbService){
  $scope.toggleSearch = false;
  var GUEST = $resource('/api/v1/guests', null, {
    'update': {method: 'PUT'}
  });
  
  this.trySomeShit = function(){
    console.log("TRYING SHIT FUCK")
    fbService.getMyLastName().then(function(val){
      console.log(val);
    })
    fbService.getMyProfilePictureUrl().then(function(val){
      console.log(val);
    })
  };
  
  

  $scope.content = [];

  $scope.headers = [
  {
    name: 'Name',
    field: 'name'
  },{
    name:'Phone Number',
    field: 'number'
  },{
    name: 'Password',
    field: 'password'
  }
  ];
  
  GUEST.query(function(guests){
    $scope.content = $scope.content.concat(guests);
  });
  // $scope.digest();
  
  $scope.custom = {name: 'bold', number:'grey', password:'grey'};
  $scope.sortable = ['name', 'number'];
  $scope.thumbs = 'thumb';
  $scope.count = 10;

  $scope.guest = {};

  $scope.addGuest = function(){
    if($scope.guestForm.$valid){
      $scope.content.push($scope.guest);
      GUEST.save($scope.guest);
      $scope.guest = {};
      $scope.guestForm.$setPristine();
      $scope.guestForm.$setUntouched();
    }
  }

  $scope.addPermanentGuest = function(){
    $scope.guest.permanent = true;
    $scope.addGuest();
  }

  $scope.deleteGuest = function(guest){
    console.log('Deleting user ', guest);
    var idx = $scope.content.indexOf(guest);
    $scope.content.splice(idx,1);
    GUEST.delete({
      "id":guest.id
    });
  }

  $scope.updateGuest = function(guest){
    GUEST.update(guest);
  }
}]);