'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
    "ngRoute",
    "mobile-angular-ui",
    "mobile-angular-ui.touch",
    "mobile-angular-ui.scrollable",
    'myApp.services',
    'myApp.controllers'
]);

app.config(function ($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'views/app1/intro.html', controller: 'IntroCtrl'});
    $routeProvider.when('/languages', {templateUrl: 'views/app1/languages.html', controller: 'LanguagesCtrl'});
});
