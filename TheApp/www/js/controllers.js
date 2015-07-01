angular.module('GroupScreen.controllers', ['firebase', 'spotify', 'angularSoundManager', 'btford.socket-io'])

.factory('Socket', function (socketFactory) {
    return socketFactory({
        ioSocket: io('http://localhost:3000')
    });
})

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
            // $state.go('group',{groupName:data.name});
            $location.path('/group/' + data.name);
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

})


.controller('groupCtrl', function ($firebaseArray, $stateParams, $timeout, $scope, $location, Socket) {
    $scope.messages = [];
    $scope.groupId = $stateParams.groupName;
    var musicUrl = new Firebase('https://shining-fire-8634.firebaseio.com/'+$scope.groupId+'/music');
    $scope.musicHolder = $firebaseArray(musicUrl);
    $scope.musicHolder.$loaded().then(function () {
        $scope.playlistSongs = $scope.musicHolder;
    });


    Socket.connect();
    Socket.emit('joinGroup', $scope.groupId);

    $scope.addSong = function() {
        var item = {
            file: "http://api.soundcloud.com/tracks/4343857/stream?client_id=24491d49ef40ba3033edb95735cd6cee",
            song: "Hardwell Live @ Tomorrowland 2013 (Hardwell On Air 127)",
            artist: "Unknown Artist",
            album: "Unknown Artist",
            user: "Admin"
        }
        $scope.musicHolder.$add(item)
        $timeout(function() {
            Socket.emit('songAddedFromRemote', $scope.groupId);
        }, 500);

    }

    $scope.play = function() {
        Socket.emit('playPauseSong', $scope.groupId);
    }

    $scope.prev = function() {
        Socket.emit('previousTrack', $scope.groupId);
    }

    $scope.next = function() {
        Socket.emit('nextTrack', $scope.groupId);
    }

    $scope.volumeUp = function() {
        Socket.emit('volumeUpFromRemote', $scope.groupId);
    }

    $scope.volumeDown = function() {
        Socket.emit('volumeDownFromRemote', $scope.groupId);
    }


    Socket.on('playlistSongsChangedFromRemote', function(data){
        $scope.playlistSongs = data;
    });
});
