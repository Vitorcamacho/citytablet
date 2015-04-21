'use strict';

/* Services */
var base_url = "http://www.citybubbles.pt/app/";

angular.module('myApp2.services', [])
    .value('version', '0.1')
    .service('routeService', function($http) {
        this.updateDevice = function(iddevice, latitude, longitude, date) {
            return $http({
                method: 'POST',
                data: 'iddevice=' + iddevice + '&latitude=' + latitude + '&longitude=' + longitude+ '&date=' + date,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: base_url+"update_device/"
            });
        }
    })
    .service('mapService', function($http) {
        this.updateDevice = function(iddevice, latitude, longitude, date) {
            return $http({
                method: 'POST',
                data: 'iddevice=' + iddevice + '&latitude=' + latitude + '&longitude=' + longitude+ '&date=' + date,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: base_url+"update_device/"
            });
        }
    });