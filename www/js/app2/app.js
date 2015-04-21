'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('myApp2', [
    "ngRoute",
    'myApp2.services',
    'myApp2.controllers',
    "mobile-angular-ui",
    "mobile-angular-ui.touch",
    "mobile-angular-ui.scrollable"

]);

app.config(function ($routeProvider) {
    $routeProvider.when('/language/:idlanguage', {templateUrl: 'views/app2/routes.html', controller: 'RoutesCtrl'});
    $routeProvider.when('/routes/:idroute/:idlanguage', {templateUrl: 'views/app2/map.html', controller: 'MapCtrl'});
});
