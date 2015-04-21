'use strict';

var ready = false;
var internet = true;
var state = false;
var all_map_routes, route_gpoints, route_pois, all_pols;
var control = true, info = false;

angular.module('myApp.controllers', [])
    .controller('IntroCtrl', ['$scope', '$location', 'languageService', function ($scope, $location, languageService) {
        document.addEventListener("backbutton", function (e) {
            e.preventDefault();
        }, false);


        document.addEventListener("deviceready", function () {
            console.log("device ready");
           window.plugins.insomnia.keepAwake();
           checkInternet(languageService, 2000, $location);
        }, false);


    }])
    .controller('LanguagesCtrl', ['languageService', function (languageService) {
        document.addEventListener("backbutton", function (e) {
            e.preventDefault();
        }, false);
            navigator.geolocation.watchPosition(
                function (position) {
//                    console.log(JSON.stringify(position));
                    updatePosition(languageService, position);
                }, null, {maximumAge: 0, enableHighAccuracy: true});
    }]);

var updatePosition = function (service, position) {

    if (service != null) {
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        service.updateDevice(device.uuid, position.coords.latitude, position.coords.longitude, datetime).then(function (response) {
//                        console.log(response);
        });
    }
};

var checkInternet = function (service, time, location) {
    var timer = time;
    var aux = 0;
    setInterval(function () {
        aux += timer;
		registerDevice(service);
		checkInfo();
		internet = "true";
		if (control == true && info == false)
			getData(service, location);
		else if (info == true) {
			location.path("/languages/");
		}
    }, timer);
}

var getData = function (service, location) {
//    console.log("get data");
    localStorage.clear();
    control = false;
    service.getMapRoutes().then(function (response) {
        all_map_routes = response['data'];
        localStorage.setItem("all_routes", JSON.stringify(response['data']));
//        console.log(response['data']);
        service.getRouteGpoints().then(function (response) {
            route_gpoints = response['data'];
            localStorage.setItem("all_gpoints", JSON.stringify(response['data']));
//            console.log(response['data']);
            service.getRoutePois().then(function (response) {
                route_pois = response['data'];
                localStorage.setItem("all_pois", JSON.stringify(response['data']));
//                console.log(response['data']);
                service.getRoutesLanguage().then(function (response) {
                    route_pois = response['data'];
                    localStorage.setItem("routes_info", JSON.stringify(response['data']));
//                    console.log(response['data']);
                    service.getPols().then(function (response) {
                        all_pols = response['data'];
                        localStorage.setItem("all_pols", JSON.stringify(response['data']));
//                        console.log(response['data']);
                        location.path("/languages/");
                    });
                });
            });
        });
    });
}

function checkInfo() {
    setInterval(function () {
        if (localStorage.getItem("all_routes") !== null && localStorage.getItem("all_gpoints") !== null && localStorage.getItem("all_pois") !== null && localStorage.getItem("routes_info") !== null && localStorage.getItem("all_pols") !== null) {
            info = true;
        }
    }, 1000)
}

var registerDevice = function (service) {
    service.registerDevice(device.uuid);
};
