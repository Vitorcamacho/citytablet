'use strict';

/* Services */
var base_url = "http://www.citybubbles.pt/app/";


angular.module('myApp.services', [])
    .value('version', '0.1')
    .service('languageService', function($http) {

        this.getMapRoutes = function() {
            return $http({
                method: 'POST',
                url: base_url+"get_map_route/"
            });
        };

        this.getRouteGpoints = function() {
            return $http({
                method: 'POST',
                url: base_url+"get_route_gpoints/"
            });
        };

        this.getRoutePois = function() {
            return $http({
                method: 'POST',
                url: base_url+"get_route_pois/"
            });
        };

        this.getPols = function() {
            return $http({
                method: 'POST',
                url: base_url+"get_pols/"
            });
        };

        this.getRoutesLanguage = function() {
            return $http({
                method: 'POST',
                url: base_url+"get_route_languages/"
            });
        };

        this.registerDevice = function(iddevice) {
            return $http({
                method: 'POST',
                url: base_url+"regist_device/"+iddevice
            });
        }

        this.updateDevice = function(iddevice, latitude, longitude, date) {
            return $http({
                method: 'POST',
                data: 'iddevice=' + iddevice + '&latitude=' + latitude + '&longitude=' + longitude+ '&date=' + date,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: base_url+"update_device/"
            });
        }
    });
