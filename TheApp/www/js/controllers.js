angular.module('GroupScreen.controllers', ['firebase'])

.controller('joinGroupCtrl', function($state, $scope, $location, $firebaseObject, $firebaseArray) {

  $scope.submit = function(data) {
    var group = new Firebase('https://shining-fire-8634.firebaseio.com/' + data.name);
    $scope.group = $firebaseArray(group);
    $scope.group.$loaded().then(function () {
      console.log($scope.group);
      if($scope.group.length >= 3) {
        $scope.firebaseGroup = $firebaseObject(group);
        $scope.firebaseGroup.$loaded().then(function () {
          if(data.pw == $scope.firebaseGroup.remotePassword) {
            window.localStorage["groupRemotePw"] = data.pw;
            $state.go('tab.group');
          } else if(data.pw == $scope.firebaseGroup.publicPassword) {
            window.alert("Für dich Proletarier gibts noch keine View");
          } else {
            window.alert("Vapiss dich, dein PW oder Username war falsch..");
          }
        });
      } else {
        window.alert("vapiss dich!");
      }
    });

  }

    $scope.change = function(){
      console.log("asd");
            $state.go('tab.group');
    }

})

.controller('groupCtrl', function() {
})

// .controller('ChatsCtrl', function($scope, Chats) {
//   // With the new view caching in Ionic, Controllers are only called
//   // when they are recreated or on app start, instead of every page change.
//   // To listen for when this page is active (for example, to refresh data),
//   // listen for the $ionicView.enter event:
//   //
//   //$scope.$on('$ionicView.enter', function(e) {
//   //});
  
//   $scope.chats = Chats.all();
//   $scope.remove = function(chat) {
//     Chats.remove(chat);
//   }
// })

// .controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
//   $scope.chat = Chats.get($stateParams.chatId);
// })

// .controller('AccountCtrl', function($scope) {
//   $scope.settings = {
//     enableFriends: true
//   };
// });
