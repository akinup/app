angular.module('GroupScreen.controllers', ['firebase', 'spotify', 'angularSoundManager', 'btford.socket-io'])

.factory('Socket', function (socketFactory) {
    return socketFactory({
        ioSocket: io('http://localhost:3000')
    });
})

.controller('GroupUserCtrl', function ($http, $stateParams, $scope, $firebaseArray, $firebaseObject, $location) {
    $scope.groupId = $stateParams.groupName;

    $scope.showLibraryModal = true;
    $scope.showLoading = false;
    $scope.libraryFiles = {};
    $scope.musicLibrary = [];
    $scope.playlistSongs = [];



    var group = new Firebase('https://shining-fire-8634.firebaseio.com/' + $scope.groupId);
    $scope.group = $firebaseArray(group);
    $scope.group.$loaded().then(function () {
        $scope.passwordFromServer = $firebaseObject(group);
        $scope.passwordFromServer.$loaded().then(function () {
            if (window.localStorage["groupUserPw"] != $scope.passwordFromServer.publicPassword) {
                $location.path('/joinGroup');
            }
        });
    });



    SC.initialize({
        client_id: "24491d49ef40ba3033edb95735cd6cee"
    });

    var musicUrl = new Firebase('https://shining-fire-8634.firebaseio.com/' + $scope.groupId + '/music');
    $scope.musicHolder = $firebaseArray(musicUrl);

    $scope.musicHolder.$loaded().then(function () {
        $scope.playlistSongs = $scope.musicHolder;
    });

    $scope.$watch('$viewContentLoaded', function () {
        //$scope.loadFromServer();
    });

    $scope.querySpotify = function () {
        if ($scope.musicValueSpotify.length > 0) {
            var url = 'http://api.soundcloud.com/tracks.json?client_id=24491d49ef40ba3033edb95735cd6cee&q=';
            url += $scope.musicValueSpotify;
            url += ' &limit=5&streamable=true';

            $http.get(url)
                .success(function (data) {
                    $scope.SpotifyEntries = data;
                });

        }
    }

    $scope.addSongSpotify = function (item) {
        SC.stream('/tracks/' + item.id, function (sm_object) {
            if($scope.duplicateCheckSong(sm_object)){
                var libraryItem = {
                    "file": sm_object.url,
                    "song": item.title,
                    "artist": item.artist || 'Unknown Artist',
                    "album": item.album || 'Unknown Artist',
                    "user": "User"
                };
                $scope.musicHolder.$add(libraryItem);
            }
            else{
                window.alert("gibts SCHON!");
            }
        });
        $scope.musicValueSpotify = "";
        $scope.SpotifyEntries = "";
    }

    $scope.duplicateCheckSong = function(sm_object){
        var check = true;
        for(var i = 0; i < $scope.playlistSongs.length; i ++){
            if($scope.playlistSongs[i].file == sm_object.url){
                check = false;
                return check;
            }
        }

        return check;
    }

    $scope.removeSongFromPlaylist = function (index) {
        $scope.musicHolder.$remove(index);
    }

    $scope.removeSongFromPlaylistBySrc = function (element) {
        for(var i = 0; i < $scope.playlistSongs.length; i ++){
            if($scope.playlistSongs[i].file == element){
                $scope.musicHolder.$remove(i);
            }
        }
    }

    $scope.show = function (item) {
        $scope.showRemove = false;
        if(item.user == "User"){
            $scope.showRemove = true;
        }
        else if(item.user == "Admin"){
            $scope.showRemove = false;
        }
        return $scope.showRemove;
    }

    $scope.parseFile = function (file) {
        id3(file, function (err, tags) {
            var relFile;
            var space = "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
                libraryItem;

            if (tags.title == space) {
                tags.title = null;
            }
            if (tags.artist == space) {
                tags.artist = null;
            }
            if (tags.album == space) {
                tags.album = null;
            }

            relFile = file.replace(/^.*(\\|\/|\:)/, '');

            libraryItem = {
                "file": tags.fileName || file,
                "song": tags.title || tags.fileName || relFile,
                "artist": tags.artist || 'Unknown Artist',
                "album": tags.album || 'Unknown Album',
                "user": 'User'
            };

            $scope.playlistSongs.push(libraryItem);
            $scope.$apply();
        });
    };

    $scope.loadFromServer = function () {
        var data = {"data": [{"song": "mp3/song1.mp3"}, {"song": "mp3/song2.mp3"}, {"song": "mp3/song3.mp3"}]};
        for (var i = 0; i < data.data.length; i++) {
            $scope.parseFile(data.data[i].song);
        }
    };




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
            window.localStorage["groupUserPw"] = data.pw;
            $location.path('/groupUser/' + data.name);
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


.controller('groupCtrl', function ($http, $firebaseArray, $stateParams, $timeout, $scope, $location, Socket) {
     $scope.messages = [];
    $scope.playbackTimeCurrent = 15;
    $scope.playbackProgress = 44;
    $scope.groupId = $stateParams.groupName;
    $scope.showLibraryModal = true;
    $scope.showLoading = false;
    $scope.libraryFiles = {};
    $scope.musicLibrary = [];
    $scope.playlistSongs = [];


    var musicUrl = new Firebase('https://shining-fire-8634.firebaseio.com/'+$scope.groupId+'/music');
    $scope.musicHolder = $firebaseArray(musicUrl);
    $scope.musicHolder.$loaded().then(function () {
        $scope.playlistSongs = $scope.musicHolder;
    });


    Socket.connect();
    Socket.emit('joinGroup', $scope.groupId);

    Socket.on('playlistSongsChangedFromRemote', function(data){
        $scope.playlistSongs = data;
    });

    Socket.on('volumeChangedFromClient', function (data) {
        $scope.volumeLevel = data;
    })

    Socket.on('playbackTimeCurrentFromClient', function(data){
        $scope.playbackTimeCurrent = data;
    });

    Socket.on('playbackProgressFromClient', function(data){
        $scope.playbackProgress = data;
    });

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

    $scope.changePlaybackProgressFromRemote = function($event) {
        var e = $event.currentTarget;
        var percent = ($event.offsetX / e.clientWidth).toFixed(2) * 100;
        Socket.emit('playbackProgressFromRemote', percent, $scope.groupId);
    }

    SC.initialize({
        client_id: "24491d49ef40ba3033edb95735cd6cee"
    });

    var musicUrl = new Firebase('https://shining-fire-8634.firebaseio.com/' + $scope.groupId + '/music');
    $scope.musicHolder = $firebaseArray(musicUrl);

    $scope.musicHolder.$loaded().then(function () {
        $scope.playlistSongs = $scope.musicHolder;
    });

    $scope.$watch('$viewContentLoaded', function () {
        //$scope.loadFromServer();
    });

    $scope.querySpotify = function () {
        if ($scope.musicValueSpotify.length > 0) {
            var url = 'http://api.soundcloud.com/tracks.json?client_id=24491d49ef40ba3033edb95735cd6cee&q=';
            url += $scope.musicValueSpotify;
            url += ' &limit=5&streamable=true';

            $http.get(url)
                .success(function (data) {
                    $scope.SpotifyEntries = data;
                });

        }
    }

    $scope.addSongSpotify = function (item) {
        SC.stream('/tracks/' + item.id, function (sm_object) {
            if($scope.duplicateCheckSong(sm_object)){
                var libraryItem = {
                    "file": sm_object.url,
                    "song": item.title,
                    "artist": item.artist || 'Unknown Artist',
                    "album": item.album || 'Unknown Artist',
                    "user": "User"
                };
                $scope.musicHolder.$add(libraryItem);
            }
            else{
                window.alert("gibts SCHON!");
            }
        });
        $scope.musicValueSpotify = "";
        $scope.SpotifyEntries = "";
    }

    $scope.duplicateCheckSong = function(sm_object){
        var check = true;
        for(var i = 0; i < $scope.playlistSongs.length; i ++){
            if($scope.playlistSongs[i].file == sm_object.url){
                check = false;
                return check;
            }
        }

        return check;
    }

    $scope.removeSongFromPlaylist = function (index) {
        $scope.musicHolder.$remove(index);
    }

    $scope.removeSongFromPlaylistBySrc = function (element) {
        for(var i = 0; i < $scope.playlistSongs.length; i ++){
            if($scope.playlistSongs[i].file == element){
                $scope.musicHolder.$remove(i);
            }
        }
    }

    $scope.show = function (item) {
        $scope.showRemove = false;
        if(item.user == "User"){
            $scope.showRemove = true;
        }
        else if(item.user == "Admin"){
            $scope.showRemove = false;
        }
        return $scope.showRemove;
    }

    $scope.parseFile = function (file) {
        id3(file, function (err, tags) {
            var relFile;
            var space = "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
                libraryItem;

            if (tags.title == space) {
                tags.title = null;
            }
            if (tags.artist == space) {
                tags.artist = null;
            }
            if (tags.album == space) {
                tags.album = null;
            }

            relFile = file.replace(/^.*(\\|\/|\:)/, '');

            libraryItem = {
                "file": tags.fileName || file,
                "song": tags.title || tags.fileName || relFile,
                "artist": tags.artist || 'Unknown Artist',
                "album": tags.album || 'Unknown Album',
                "user": 'User'
            };

            $scope.playlistSongs.push(libraryItem);
            $scope.$apply();
        });
    };

    $scope.loadFromServer = function () {
        var data = {"data": [{"song": "mp3/song1.mp3"}, {"song": "mp3/song2.mp3"}, {"song": "mp3/song3.mp3"}]};
        for (var i = 0; i < data.data.length; i++) {
            $scope.parseFile(data.data[i].song);
        }
    };



});
