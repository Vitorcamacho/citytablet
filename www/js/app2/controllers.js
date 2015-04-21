'use strict';
var current_service, current_scope;
var marker, circle;
var all_routes, all_ways, all_route_pois, route_pois, route_lines, route_gpoints, all_pols, map, routes;
var map_polylines = new Array(), map_polygons = new Array(), map_routes = new Array(), map_gpoints = new Array();
var routes, all_map_routes, all_route_pois, route_gpoints, all_pols;
var wrongLanguage, continueLanguage, newLanguage, chargingLanguage, nearLanguage, poiLanguage, gpointLanguage, polLanguage, voice_language;
var gpoint_way = false;
var voice;
var map, map_aux, map_enable=false;
var geolocator;
var current_latitude, current_longitude, current_line, current_gpoint_line, current_route;
var array_voice = new Array();
var min_dist = 28;
var index_route = 5;
var camera_on = false;
var compass_enable = false;
//--------------------------------------------------------------------------------------------------------------------//



angular.module('myApp2.controllers', [])
    .controller('RoutesCtrl', ['$scope', '$rootScope', '$routeParams', '$window', '$location', 'routeService', function ($scope, $rootScope, $routeParams, $window, $location, routeService) {
        if(map != undefined){
            setMapBearing(new plugin.google.maps.LatLng(32.738337, -16.989902), 10, null);
        }
        current_service = routeService;
        current_scope = $scope;
        initializeRoutesData($scope, $routeParams['idlanguage']);

        $scope.open_overlay = function (route){
            document.getElementById("map-canvas").style.display = "none";
            $scope.route = route;
            current_route = route;
            $rootScope.toggle('myOverlay', 'on');
        };

        $scope.open_overlay2 = function () {
            document.getElementById("map-canvas").style.display = "none";
            $scope.route = current_route;
            $rootScope.toggle('myOverlay2', 'on');
        };

        $scope.open_overlay3 = function (pol) {
            document.getElementById("map-canvas").style.display = "none";
            $scope.pol = pol;
            current_route = pol;
            $scope.$apply();
            $rootScope.toggle('myOverlay3', 'on');
        };

        $scope.continue_route = function () {
            $rootScope.toggle('myOverlay2', 'off');
            document.getElementById("map-canvas").style.display = "block";
            if (current_route != undefined && current_route['idroute'] != 1)
                getRightWay(map, '#DF0101', true, "route");
        };

        $scope.cancel = function(){
            document.getElementById("map-canvas").style.display = "block";
        }

        $scope.choose_route = function (route) {
            document.getElementById("map-canvas").style.display = "block";
            $rootScope.toggle('myOverlay', 'off');
            speechSynthesis.cancel();
            array_voice = new Array(), map_polylines = new Array(), map_polygons = new Array();
            current_line = null, current_gpoint_line = null;

            // CLEAR ALL
            map.clear();
            cleanLocalPoints();
            cleanGpoints();
            //
            setMapData();

//            if(route['idroute'] != 1){
//                console.log("entrou");
//                map.setZoom(18);
//                map.setCenter(new plugin.google.maps.LatLng(current_latitude, current_longitude));
//            }

            if (route != null) {
                var idroute = route['idroute'];
                var idlanguage = route['idlanguage'];
                initializeMapData(idroute);
            }
        };

        $scope.choose_pol = function (pol) {
            document.getElementById("map-canvas").style.display = "block";
            all_ways = new Array();
            var aux = pol;
            if(current_line != undefined)
                cleanRoute(current_line);
            aux['start_latitude'] = pol['latitude'];
            aux['start_longitude'] = pol['longitude'];
            getWay(map, new Array(aux), 0, 1, '#DF0101', true);
//            getGPointRoute(map, pol, '#DF0101', 'true');
        };

        $scope.near = function () {
            gpoint_way = true;
            getNearGPointRoute(map, 0, route_gpoints, '#DF0101', true);
        };

        $scope.showMenu = function(id){
            if(document.getElementById(id).style.display == "none")
                document.getElementById(id).style.display= "block";
            else
                document.getElementById(id).style.display= "none";
        }
        $scope.clear = function(){
            map.clear();
        }
    }]);

document.addEventListener("deviceready", function(){
    initialize(current_service);

    voice = new SpeechSynthesisUtterance();
    voice.onstart = function(){
//        console.log("start");
//        console.log(array_voice);
    }

    voice.onend = function(){
        speechSynthesis.cancel();
        array_voice.shift();
//        console.log("start");
//        console.log(array_voice);
        setTimeout(function(){play_sound()},200);
    };

//    navigator.compass.watchHeading(function(){
//        map.getMyLocation(function(position){
//            if(position.bearing != undefined)
//                setMapBearing(position.bearing);
//        }, function(){});
//    }, function(){}, {frequency: 4000});

    window.plugins.insomnia.keepAwake();

}, false);

function setMapBearing(location,zoom,bearing){
    map.getCameraPosition(function(camera) {
        if(location == null || location == undefined)
            location = new plugin.google.maps.LatLng(current_latitude, current_longitude);
        if(zoom == null || zoom == undefined)
            zoom = camera.zoom;
        if(bearing == null || bearing == undefined)
            bearing = camera.bearing;

        if (camera_on)
            return;
        map.animateCamera({
            zoom: zoom,
            bearing: bearing,
            target: location
        }, function () {
            camera_on = false
        });
    });
}

function run_geolocator(service){
	geolocator = navigator.geolocation.watchPosition(
		function (position) {
		console.log(JSON.stringify(position.coords));
			var coordinates = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			current_latitude = coordinates.lat;
			current_longitude = coordinates.lng;

			if(map!=undefined && compass_enable) {
				map.getMyLocation(function(position2){
					if(position2.bearing != undefined)
						setMapBearing(null,null,position2.bearing);
				}, function(){});
			}

			if (!map_enable) {
				setMapData();
				map_enable = true;
			}

			updateCoordinates(coordinates);
			updatePosition(service, position);
			
		}, function(error){console.log("error ",error);}, {maximumAge: 0, enableHighAccuracy: true});
}

function updateCoordinates(coord){
    current_latitude = coord.lat;
    current_longitude = coord.lng;
    if(circle !== undefined) {
        circle.setCenter(coord);
        marker.setPosition(coord);
        setMapBearing(coord,null,null);

        //Se estiver com rota activa (e não na rota Gpoint)
        if (!gpoint_way) {
            checkPoiCollision(circle);
            checkRouteLine(circle);
            checkRightWay(circle, "normal");
        }
        else
            checkRightWay(circle, "gpoint");

        checkGpointCollision(circle);
        checkInstructionCollision(circle);
    }
}

function drawRouteGpoints(map_object, points){
    angular.forEach(points, function(poi){
        var coordinates = new plugin.google.maps.LatLng(poi['latitude'], poi['longitude']);
        map_object.addMarker({
        },function(instmarker) {
            instmarker.setIcon({
                'url': 'www/img/maps/gpoint.png',
                'size': {
                    width: 40,
                    height: 40
                }
            });
            instmarker.setPosition(coordinates);

            instmarker['read'] = 0
            instmarker['customInfo'] = poi
            instmarker.addEventListener(plugin.google.maps.event.MARKER_CLICK, function(marker) {
                var r = confirm("Do you want to go to this charge point?");
                if (r == true) {
                    gpoint_way = true;
                    getGPointRoute(map_object, poi, '#DF0101', 'true');
                }
            });
            map_gpoints.push(instmarker);
        });
    });
}

function cleanGpointInstructions(){
    var index = map_polygons.length-1;
    while(index > 0){
        if (map_polygons[index]['type'].indexOf("gpoint_instruction") > 0) {
            map_polygons[index]['polygon'].remove();
            map_polylines.splice(index, 1);
        }
        index--;
    }
}

function getGPointRoute(map_obj, poi, color, opa){
    cleanGpointRoute();
    map_aux.getRoutes({
        origin: [current_latitude, current_longitude],
        destination: [poi['latitude'], poi['longitude']],
        travelMode: 'driving',
        callback: function (e) {
            map_aux.routes = new Array();
            if(current_gpoint_line != undefined || current_gpoint_line != null){
                cleanGpointRoute();
                cleanRoute(current_gpoint_line);
            }
            if(current_line) {
                setVisibleLine(current_line, false);
            }
            var aux = filter_instructions(e[e.length-1]);
            current_gpoint_line = aux;
            drawLines(new Array(aux), color, opa, "gpoint");
            drawInstructionPoints(map_obj, new Array(aux), true, "gpoint");
        },
        error: function(error, e){
            setTimeout(function() { getGPointRoute(map_obj, color, opa); }, 0);
        }
    });
}

function getNearGPointRoute(map_obj, index, gpoints, color, opa){
    var length = gpoints.length;
    map_aux.getRoutes({
        origin: [current_latitude, current_longitude],
        destination: [gpoints[index]['latitude'], gpoints[index]['longitude']],
        travelMode: 'driving',
        callback: function (e) {
            if(index < length-1) {
                getNearGPointRoute(map_obj, ++index, gpoints, color, opa);
            }
            else
            {
//                console.log(e);
                var distance = 999999;
                var ind;
                angular.forEach(e,function(route, key){
                    if(distance > route.legs[0].distance.value) {
                        distance = route.legs[0].distance.value;
                        ind = key;
                    }
                    if(key == e.length-1)
                    {
                        map_aux.routes = new Array();
                        if(current_gpoint_line != undefined && current_gpoint_line != null)
                            cleanRoute(current_gpoint_line);
                        if(current_line)
                            setVisibleLine(current_line, false);

                        var aux = filter_instructions(e[ind]);
                        current_gpoint_line = aux;
                        drawLines(new Array(aux), color, opa, "gpoint");
                        drawInstructionPoints(map_obj, new Array(aux), true, "gpoint");
                    }
                });
            }
        },
        error: function(error, e){
            setTimeout(function() { getNearGPointRoute(map_obj, index, gpoints, color, opa); }, 0);
        }
    });
}

function cleanGpoints(){
    map_gpoints = new Array();
}

function cleanGpointRoute(){
    angular.forEach(map_polylines, function(item, key){
        if(item['type'] == "gpoint"){
            item.polyline.remove();
            map_polylines.splice(key,1);
        }
    });
    cleanGpointInstructions();
}

function checkGpointCollision(circle_obj){
    var center = new google.maps.LatLng(circle_obj.getCenter().lat,circle_obj.getCenter().lng);
    angular.forEach(map_gpoints, function(item, key){
        var coordinates = new google.maps.LatLng(item['customInfo']['latitude'], item['customInfo']['longitude']);
        var distance = google.maps.geometry.spherical.computeDistanceBetween(center,coordinates);
        if(distance < min_dist && item['read'] == 0) {
//            splitMessage(item['customInfo']['instructions']);
            if(gpoint_way == true) {
//                item['read'] = 1;
//                console.log("colisao gpoint");
                cleanGpointRoute();
                gpoint_way = false;
                navigator.geolocation.clearWatch(geolocator);
                current_scope.open_overlay2();
            }
        }
    });
}

function filter_instructions(points){
    angular.forEach(points['legs'], function(point){
        angular.forEach(point['steps'], function(step){
            var a = new RegExp('<b>', 'g');
            var b = new RegExp('</b>', 'g');
            var c = new RegExp('</div>', 'g');
            var inst = step['instructions'];
            if (inst instanceof Array)
                var aux2 = inst[0].replace(a,'');
            else
                var aux2 = inst.replace(a,'');
            aux2 = aux2.replace(b,'');
            aux2 = aux2.replace(c,'');
            step['instructions'] = aux2.split('<div style="font-size:0.9em">');
            step['read'] = 0;
        });
    });
    return points;
}

function drawInstructionPoints(map_obj, points, legs, type){
    if(legs) {
        angular.forEach(points[0].legs[0].steps, function (step,key) {
            var polys = google.maps.geometry.encoding.decodePath(step.encoded_lat_lngs);
            if(key>0)
                var previous_polys = google.maps.geometry.encoding.decodePath(points[0].legs[0].steps[key-1].encoded_lat_lngs);

            step['route'] = points[0];
            step['read'] = 0;
            if(key == 0) {
                var coordinates = new plugin.google.maps.LatLng(polys[0].lat(), polys[0].lng());
                map_obj.addCircle({
                    'center': coordinates,
                    'strokeColor' : '#000000',
                    'strokeWidth': 1,
                    'radius': 1,
                    'fillColor' : '#000000'
                }, function(instcircle){
                    var aux_circle = new Array();
                    aux_circle['polygon'] = instcircle;
                    aux_circle['customInfo'] = step;
                    aux_circle['type'] = type+"_instruction";
                    map_polygons.push(aux_circle);
                });
            }
            else {
                if(previous_polys.length > 2) {
                    var coordinates = new plugin.google.maps.LatLng(previous_polys[previous_polys.length - 3].lat(), previous_polys[previous_polys.length - 3].lng());
                    map_obj.addCircle({
                        'center': coordinates,
                        'strokeColor' : '#000000',
                        'strokeWidth': 1,
                        'radius': 1,
                        'fillColor' : '#000000'
                    }, function(instcircle){
                        var aux_circle = new Array();
                        aux_circle['polygon'] = instcircle;
                        aux_circle['customInfo'] = step;
                        aux_circle['type'] = type+"_instruction";
                        map_polygons.push(aux_circle);
                    });
                }
                else{
                    var coordinates = new plugin.google.maps.LatLng(polys[0].lat(), polys[0].lng());
                    map_obj.addCircle({
                        'center': coordinates,
                        'strokeColor' : '#000000',
                        'strokeWidth': 1,
                        'radius': 1,
                        'fillColor' : '#000000'
                    }, function(instcircle){
                        var aux_circle = new Array();
                        aux_circle['polygon'] = instcircle;
                        aux_circle['customInfo'] = step;
                        aux_circle['type'] = type+"_instruction";
                        map_polygons.push(aux_circle);
                    });
                }
            }
        });
    }
    else
    {
        angular.forEach(points, function (map_routes,key) {
            angular.forEach(map_routes.steps, function (step,key2) {
                step['route'] = points[key];
                step['read'] = 0;
                var coordinates = new plugin.google.maps.LatLng(step['start_latitude'], step['start_longitude']);
                map_obj.addCircle({
                    'center': coordinates,
                    'strokeColor' : '#000000',
                    'strokeWidth': 1,
                    'radius': 1,
                    'fillColor' : '#000000'
                }, function(instcircle){
                    var aux_circle = new Array();
                    aux_circle['polygon'] = instcircle;
                    aux_circle['customInfo'] = step;
                    aux_circle['type'] = type+"_instruction";
                    map_polygons.push(aux_circle);
                });

            });
        });
    }
}

function checkInstructionCollision(circle_obj){
    var center = new google.maps.LatLng(circle_obj.getCenter().lat,circle_obj.getCenter().lng);
    angular.forEach(map_polygons, function(point, key){
        if(point['type'].indexOf("instruction") > 0){
            var coordinates = new google.maps.LatLng(point['polygon'].getCenter().lat, point['polygon'].getCenter().lng);
            var distance = google.maps.geometry.spherical.computeDistanceBetween(center,coordinates);
            if (distance < min_dist && point['customInfo']['read'] == 0) {
                if ((current_line != undefined && point['customInfo'].route.overview_polyline == current_line.overview_polyline) || (current_gpoint_line != undefined && point['customInfo'].route.overview_polyline == current_gpoint_line.overview_polyline)) {
//                    console.log("colisao "+key);
                    clearInstructionPoint(point);
                    play(point, 0);
                }
            }
        }
    });
}

function checkPoiCollision(circle_obj){
    var center = new google.maps.LatLng(circle_obj.getCenter().lat,circle_obj.getCenter().lng);
    angular.forEach(map_polygons, function(item){
        if(item['type'] == "poi") {
            item['polygon'].getPosition(function(position) {
                var coordinates = new google.maps.LatLng(position.lat, position.lng);
                var distance = google.maps.geometry.spherical.computeDistanceBetween(center, coordinates);
                if (distance < min_dist && item['customInfo']['read'] == 0) {
                    item['customInfo']['read'] = 1;
                    splitMessage(item['customInfo']['poi_description']);
                }
            });
        }
    });
}

function clearInstructionPoint(point){
    angular.forEach(map_polygons, function(item,key){
        if(item['type'].indexOf("instruction") > 0 && item['polygon'].getCenter() == point['polygon'].getCenter()){
            map_polygons[key]['polygon'].remove();
            map_polygons.splice(key,1);
        }
    });
}

function checkRouteLine(circle_obj){
    var center = new google.maps.LatLng(circle_obj.getCenter().lat,circle_obj.getCenter().lng);
    if(!gpoint_way) {
        angular.forEach(all_ways, function (point, key) {
//            if (point.legs !== undefined) {
//                var coordinates = new google.maps.LatLng(point.legs[0].start_location.lat(), point.legs[0].start_location.lng());
//                var distance = google.maps.geometry.spherical.computeDistanceBetween(center,coordinates);
//                if (distance < min_dist) {
//                    current_line = point;
//                    current_line['start_latitude'] = point.legs[0].start_location.lat();
//                    current_line['start_longitude'] = point.legs[0].start_location.lng();
//                    current_line['end_latitude'] = point.legs[0].end_location.lat();
//                    current_line['end_longitude'] = point.legs[0].end_location.lng();
//                }
//            }
            if (point.legs == undefined) {
                var coordinates = new google.maps.LatLng(point['start_latitude'], point['start_longitude']);
                var distance = google.maps.geometry.spherical.computeDistanceBetween(center,coordinates);
                if (distance < min_dist) {
                    if (current_line !== undefined && current_line['end_latitude'] == point['start_latitude'] && current_line['end_longitude'] == point['start_longitude']) {
//                        if (current_gpoint_line != undefined && current_gpoint_line.polyline != undefined) {
//                            angular.forEach(map_polylines, function (item, key) {
//                                if (current_gpoint_line.overview_polyline == item['customInfo'].overview_polyline || item['customInfo'].overview_polyline == item.overview_polyline) {
//                                    console.log("collision line");
//                                    item['polyline'].remove();
//                                    map_polylines.slice(key, 1);
//                                }
//                            })
//                        }
                        cleanRoute(current_line);
                        current_line = point;
                        setVisibleLine(current_line, true);
                    }
                }
            }
        });
    }
}

function drawLines(points, color, opa, type){
    points.forEach(function(item,key){
        var polys = google.maps.geometry.encoding.decodePath(item.overview_polyline);
        map_routes.push(item);
        var converted_polys = new Array();
        angular.forEach(polys,function(item2,key2){
            converted_polys.push(new plugin.google.maps.LatLng(item2.lat(), item2.lng()));
            if(key2 == polys.length-1)
            {
                map.addPolyline({
                    points: converted_polys,
                    'color' : color,
                    'width': 5,
                    'visible': opa
                }, function(polyline){
                    var aux_poi = new Array();
                    aux_poi['polyline'] = polyline;
                    aux_poi['customInfo'] = item;
                    aux_poi['type'] = type;
                    map_polylines.push(aux_poi);
                });
            }
        });
    });
}

function drawWaytoRoute(map_obj, points, color, opa){
    map_obj.routes = new Array();
    all_ways = new Array();
    var index = 0;
    if(points['map_routes'].length-1 > 5){
        var length = 5;}
    else
        var length = points['map_routes'].length-1;
    getWay(map_obj, points['map_routes'], index, length, color, opa);
}

function getWay(map_obj, points, index, length, color, opa, type){
    map_aux.getRoutes({
        origin: [current_latitude, current_longitude],
        destination: [points[index]['start_latitude'], points[index]['start_longitude']],
        travelMode: 'driving',
        callback: function (e) {
//            console.log(e);
            map_aux.routes = new Array();
            if(index < length-1) {
                setTimeout(function () {
                    getWay(map_obj, points, ++index, length, color, opa, type);
                }, 0);
            }
            else
            {
                var distance = 999999;
                var ind;
                angular.forEach(e,function(route, key){
                    if(distance > route.legs[0].distance.value) {
                        distance = route.legs[0].distance.value;
                        ind = key;
                    }
                    if(key == e.length-1)
                    {
                        var aux = filter_instructions(e[ind]);
                        all_ways.push(aux);
                        drawLines(new Array(aux), color, opa, "route");
                        drawInstructionPoints(map_obj, new Array(aux), true, "route");
                        drawRoute(map_obj, route_lines['map_routes'], '#DF0101', 'false', "route");
                        current_line = aux;
                        current_line['start_latitude'] = aux.legs[0].start_location.lat();
                        current_line['start_longitude'] = aux.legs[0].start_location.lng();
                        current_line['end_latitude'] = aux.legs[0].end_location.lat();
                        current_line['end_longitude'] = aux.legs[0].end_location.lng();
                    }
                });

            }
        },
        error: function(error, e){
            setTimeout(function() { getWay(map_obj, points, index, length, color, opa, type); }, 0);
        }
    });
}

function drawRoute(map_object, points, color, opa, type){
    map_routes = new Array();
    all_routes = new Array();
    var index = 0;
    var length = points.length-1;
    if(length >= 0)
            getRoute(map_object, points, index, length, color, opa, type);
}

function getRoute(map_object, route, index, length, color, opa, type){
    var polys = google.maps.geometry.encoding.decodePath(route[index].overview_polyline);
    map_routes.push(route[index]);
    var converted_polys = new Array();
    angular.forEach(polys,function(item2,key2){
        converted_polys.push(new plugin.google.maps.LatLng(item2.lat(), item2.lng()));
        if(key2 == polys.length-1)
        {
            map.addPolyline({
                points: converted_polys,
                'color' : color,
                'width': 5,
                'visible': opa
            }, function(polyline){
                var aux_poi = new Array();
                aux_poi['polyline'] = polyline;
                aux_poi['customInfo'] = route[index];
                aux_poi['type'] = type;
                map_polylines.push(aux_poi);
                if(index < length) {
                    setTimeout(function () {
                        all_ways.push(route[index]);
                        getRoute(map_object, route, ++index, length, color, opa, type);
                    }, 0);
                }
                else if(index == length){
                    all_ways.push(route[index]);
                    drawInstructionPoints(map_object, route, false, type);
                    map_object.routes.unshift(all_ways[0]);
                    var coord = new plugin.google.maps.LatLng(current_latitude, current_longitude);
                    updateCoordinates(coord);
                    return;
                }

            });
        }
    });
}

function getRightWay(map_obj, color, opa, type){
    map_aux.getRoutes({
        origin: [current_latitude, current_longitude],
        destination: [current_line['end_latitude'], current_line['end_longitude']],
        travelMode: 'driving',
        callback: function (e) {
            if(current_gpoint_line!= undefined && current_gpoint_line != null)
                cleanRoute(current_gpoint_line);
            if(current_line['aux_way'] != undefined && current_line['aux_way'] == true)
                cleanRoute(current_line);
            else if (current_line.polyline != undefined)
                setVisibleLine(current_line, false);

            var aux = filter_instructions(e[e.length-1]);
            drawLines(new Array(aux), color, opa, type);
            aux['aux_way'] = true;
            all_ways.push(aux);
            drawInstructionPoints(map_obj, new Array(aux), true, type);
            current_line = aux;
            current_line['start_latitude'] = aux.legs[0].start_location.lat();
            current_line['start_longitude'] = aux.legs[0].start_location.lng();
            current_line['end_latitude'] = aux.legs[0].end_location.lat();
            current_line['end_longitude'] = aux.legs[0].end_location.lng();
        },
        error: function(error, e){
                setTimeout(function() { getRightWay(map_obj, color, opa, type); }, 0);
        }
    });

}

function checkRightWay(circle_obj, type){
    var center = new google.maps.LatLng(circle_obj.getCenter().lat,circle_obj.getCenter().lng);

    if (type == "normal" && current_line != undefined)
        var path  = google.maps.geometry.encoding.decodePath(current_line.overview_polyline);
    else if (type == "gpoint" && current_gpoint_line != undefined)
        var path  = google.maps.geometry.encoding.decodePath(current_gpoint_line.overview_polyline);
    else
        return;

    var count_points = path.length;
    angular.forEach(path, function (item) {
        var coordinates = new google.maps.LatLng(item.lat(), item.lng());
        var distance = google.maps.geometry.spherical.computeDistanceBetween(center,coordinates);
        if(distance >= min_dist)
            count_points--;
        else
            index_route = 5;

        if (count_points == 0) {
            index_route--;
            if (index_route == 0) {
                if(gpoint_way){
                    current_gpoint_line['aux_way'] = true;
                    getGpointRightWay(map, 'red', 0.8, "gpoint");
                }
                else {
                    current_line['aux_way'] = true;
                    getRightWay(map, '#DF0101', true, "route");
                }
//                beep.play();
//                array_voice.push(wrongLanguage);
//                play_sound();
                index_route = 5;
            }
        }
    });
}

function getGpointRightWay(map_obj, color, opa){
    var aux_route = new Array();
    map.getRoutes({
        origin: [current_latitude, current_longitude],
        destination: [current_gpoint_line.legs[0].end_location.lat(), current_gpoint_line.legs[0].end_location.lng()],
        travelMode: 'driving',
        callback: function (e) {
            if(current_gpoint_line['aux_way'] != undefined && current_gpoint_line['aux_way'] == true || current_gpoint_line !== undefined)
                cleanRoute(current_gpoint_line);
            var aux = filter_instructions(e[e.length-1]);
            drawLines(new Array(aux), color, opa, type);
            aux['aux_way'] = true;
            drawInstructionPoints(map_obj, new Array(aux), true, type);
            current_gpoint_line = aux;
        },
        error: function(error, e){
            setTimeout(function() { getGpointRightWay(map_obj, color, opa, type); }, 0);
        }
    });
}

function splitMessage(message){
//    console.log(message);
    var begin = 0;
    var index = 180;
    while(begin < message.length) {
        while (message[begin+index] != "." && begin+index < message.length) {
            index--;
            if(begin == begin+index)
            {
                index = 180;
                while (message[begin+index] != "," && begin+index < message.length) {
                    index--;
                    if(begin == begin+index)
                    {
                        index = 180;
                        while (message[begin+index] != " " && begin+index < message.length) {
                            index--;
                        }
                        array_voice.push(message.substring(begin, begin+index));
                        begin += index;
                        index = 180;
                    }
                }
                array_voice.push(message.substring(begin, begin+index+1));
                begin += index+1;
                index = 180;
            }
        }
        array_voice.push(message.substring(begin, begin+index+1));
        begin += index+1;
    }
    play_sound();
}

function play(point, ind){
    var index = ind;
    if(index > point['customInfo']['instructions'].length-1)
    {
        point['customInfo']['read'] = 1;
        play_sound();
        return;
    }
    else
    {
        if(typeof point['customInfo']['instructions'][index] === 'object')
            array_voice.push(point['customInfo']['instructions'][index]['text']);
        else
            array_voice.push(point['customInfo']['instructions'][index]);
        play(point, ++index);
    }
}

function play_sound(){
    if(array_voice.length > 0){
        voice.text = array_voice[0];
        speechSynthesis.speak(voice);
    }
}

function setMapData(){
    var location = new plugin.google.maps.LatLng(current_latitude, current_longitude);
    map.addMarker({
    },function(instmarker){
        marker = instmarker;
        marker.setIcon({
            'url': 'www/img/maps/car.png',
            'size': {
                width: 40,
                height: 40
            }
        });
        marker.setPosition(location);
        map.addCircle({
            'center': location,
            'strokeColor' : '#000000',
            'strokeWidth': 1,
            'radius': 25,
            'fillColor' : '#FFFFFF'
        }, function(instcircle){
            circle = instcircle;
        });

        setMapBearing(location,13,null);

    });
    drawRouteGpoints(map, route_gpoints);
}

function initializeRoutesData(scope, idlanguage) {
    current_line = null, current_gpoint_line = null;

//    console.log(JSON.stringify(localStorage))
    var data_routeinfo = localStorage.getItem("routes_info");
    routes = JSON.parse(data_routeinfo);

    routes = routes[idlanguage-1];
    scope.idlanguage = idlanguage;
    scope.routes = routes;
    scope.navbarCollapsed = true;
//    console.log("routes", routes);

    var data_routes = localStorage.getItem("all_routes");
    all_map_routes = JSON.parse(data_routes);
    all_map_routes = all_map_routes[idlanguage-1];
//    console.log("all_map_routes", all_map_routes)


    var data_pois = localStorage.getItem("all_pois");
    all_route_pois = JSON.parse(data_pois);
    all_route_pois = all_route_pois[idlanguage - 1];
//    console.log("route_pois", route_pois)


    var data_gpoints = localStorage.getItem("all_gpoints");
    route_gpoints = JSON.parse(data_gpoints);
    route_gpoints = route_gpoints[idlanguage-1];
//    console.log("route_gpoints", route_gpoints);
//
    var data_pols = localStorage.getItem("all_pols");
    all_pols = JSON.parse(data_pols);
    all_pols = all_pols[idlanguage-1];
//    console.log("all_pols", all_pols);

    getLanguage(idlanguage);

    scope.idlanguage = idlanguage;

    scope.continueLanguage = continueLanguage;
    scope.newLanguage = newLanguage;
    scope.chargingLanguage = chargingLanguage;
    scope.nearLanguage = nearLanguage;
    scope.poiLanguage = poiLanguage;
    scope.gpointLanguage = gpointLanguage;
    scope.polLanguage = polLanguage;

    checkVoice(idlanguage);
}

function getLanguage(id) {
    if (id == 1) {
        wrongLanguage = "Caminho errado, por favor, siga a linha vermelha.";
        continueLanguage = "Continue a rota";
        newLanguage = "Nova rota";
        chargingLanguage = "Área de carregamento";
        nearLanguage = "Estação de carregamento mais próximo";
        poiLanguage = "Ponto de Interesse";
        gpointLanguage = "Ponto de Carregamento";
        polLanguage = "Ponto Local";
        voice_language = 'pt';
    }
    else if (id == 2){
        wrongLanguage = "Wrong way, please follow the red line.";
        continueLanguage = "Continue route";
        newLanguage = "New route";
        chargingLanguage = "Charging area";
        nearLanguage = "Nearest charging station";
        poiLanguage = "Point of Interest";
        gpointLanguage = "Charging Point";
        polLanguage = "Local Point";
        voice_language = 'en';
    }
    else if(id == 3){
        wrongLanguage = "Camino equivocado, por favor, siga la línea roja. ";
        continueLanguage = "Continuar ruta";
        newLanguage = "Nueva ruta";
        chargingLanguage = "Área de carga";
        nearLanguage = "Estación de carga más cercana";
        poiLanguage = "Punto de Interés";
        gpointLanguage = "Punto de Carga";
        polLanguage = "Punto Local";
        voice_language = 'es';
    }
    else if(id == 4){
        wrongLanguage = "Falsche Weg, folgen Sie bitte die rote Linie. ";
        continueLanguage = "Weiter Weg";
        newLanguage = "Neue Route";
        chargingLanguage = "Ladebereich";
        nearLanguage = "nächstgelegenen Ladestation";
        poiLanguage = "In der Umgebung";
        gpointLanguage = "Ladestation";
        polLanguage = "Lokale Punkt";
        voice_language = 'de';
    }
    else if(id == 5){
        wrongLanguage = "Väärällä tavalla, seuraa punainen viiva. ";
        continueLanguage = "Jatka reittiä";
        newLanguage = "Uusi reitti";
        chargingLanguage = "Lataaminen alue";
        nearLanguage = "Lähin latauspistettä";
        poiLanguage = "nähtävyys";
        gpointLanguage = "latauspiste";
        polLanguage = "paikallislupa";
        voice_language = 'fi';
    }
    else if(id == 6){
        wrongLanguage = "Mauvaise façon, s'il vous plaît suivez la ligne rouge. ";
        continueLanguage = "Continuer la route";
        newLanguage = "Nouvelle route";
        chargingLanguage = "Zone de charge";
        nearLanguage = "Station de charge le plus proche";
        poiLanguage = "Point d'Intérêt";
        gpointLanguage = "Borne de Recharge";
        polLanguage = "Point Local";
        voice_language = 'fr';
    }
    else if(id == 7){
        wrongLanguage = "Modo errato, si prega di seguire la linea rossa. ";
        continueLanguage = "Continuare percorso";
        newLanguage = "Nuova rotta";
        chargingLanguage = "Zona di ricarica";
        nearLanguage = "Stazione di ricarica più vicina";
        poiLanguage = "Punto di Interesse";
        gpointLanguage = "Punto di Ricarica";
        polLanguage = "I luoghi";
        voice_language = 'it';
    }
    else if(id == 8){
        wrongLanguage = "Неправильный способ, пожалуйста, следуйте по красной линии. ";
        continueLanguage = "Продолжить маршрут";
        newLanguage = "Новый маршрут";
        chargingLanguage = "Зарядка площадь";
        nearLanguage = "Ближайшая заправочная станция";
        poiLanguage = "достопримечательность";
        gpointLanguage = "точка зарядки";
        polLanguage = "местная";
        voice_language = 'ru';
    }
}

function checkVoice() {
    if (voice != undefined) {
        voice.lang = voice_language;
    }
    else
        setTimeout(function () {
            checkVoice()
        }, 1000);
}

function initialize(service){
    var div = document.getElementById("map-canvas");
    var div_menu = document.getElementById("mainSidebar");
    map = plugin.google.maps.Map.getMap(div, {
        'backgroundColor': 'white',
        'mapType': plugin.google.maps.MapTypeId.ROADMAP,
        'controls': {
            'compass': true,
            'indoorPicker': false,
//            'myLocationButton': true,
            'zoom': true
        },
        'gestures': {
            'scroll': true,
            'tilt': false,
            'rotate': true
        },
        camera:{
            'latLng': new plugin.google.maps.LatLng(32.738337, -16.989902),
            'zoom': 10
        }
    });
    camera_on = true;
    map.animateCamera({
            zoom: 10,
            target: new plugin.google.maps.LatLng(32.738337, -16.989902)
        },
        function(){
            camera_on = false;
            compass_enable = true;
        });

    map_aux = new GMaps({
        div: '#map-aux',
        lat: 32.738337,
        lng: -16.989902
    });

    div.style.display="block";
    div_menu.style.display="none";

    run_geolocator(service);

//    map.on(plugin.google.maps.event.MAP_CLICK, updateCoordinates);
}

function initializeMapData(idroute) {
    //route_lines
    angular.forEach(all_map_routes, function(item){
        if(item['idroute'] == idroute)
            route_lines = item;
    });
    //route_pois
    route_pois = all_route_pois[idroute];
    drawRoutePoi(map, route_pois, "poi");

    if (idroute == 1) {
        drawLocalPoints(map, all_pols, "pol");
    }
    if (route_lines['map_routes'].length > 0)
        drawWaytoRoute(map, route_lines, '#DF0101', 'true');
}

function drawRoutePoi(map_object, points, type){
    cleanRoutePoi();
    angular.forEach(points, function(poi) {
        map_object.addMarker({
        }, function (instmarker) {
            instmarker.setIcon({
                'url': 'www/img/maps/poi.png',
                'size': {
                    width: 40,
                    height: 40
                }
            });
            var coordinates = new plugin.google.maps.LatLng(poi['latitude'], poi['longitude']);
            instmarker.setPosition(coordinates);
            poi['read'] = 0;
            var aux_poi = new Array();
            aux_poi['polygon'] = instmarker;
            aux_poi['customInfo'] = poi;
            aux_poi['type'] = type;
            map_polygons.push(aux_poi);
        });
    });
}

function cleanRoutePoi(){
    var index = map_polygons.length - 1;
    while (index >= 0) {
        if (map_polygons[index]['type'] == "poi" && map_polygons[index]['customInfo'] !== undefined && map_polygons[index]['customInfo']['idlanguage'] !== undefined) {
            map_polygons[index]['polygon'].remove();
            map_polygons.splice(index, 1);
        }
        index--;
    }
}

function drawLocalPoints(map_object, points, type){
    angular.forEach(points, function(pol){
        if(pol[0]['pol_image'] != undefined && pol[0]['pol_image'] != "null"){
            map_object.addMarker({
                'markerClick': function() {
                    current_scope.open_overlay3(pol[0]);
                }
            }, function (instmarker) {
                instmarker.setIcon({
                    'url': 'www/img/maps/pol.png',
                    'size': {
                        width: 40,
                        height: 40
                    }
                });
                var coordinates = new plugin.google.maps.LatLng(pol[0]['latitude'], pol[0]['longitude']);
                instmarker.setPosition(coordinates);
                pol['read'] = 0;
                var aux_pol = new Array();
                aux_pol['polygon'] = instmarker;
                aux_pol['customInfo'] = pol;
                aux_pol['type'] = type;
                map_polygons.push(aux_pol);
            });
        }
    });
}

function cleanLocalPoints(){
    var index = map_polygons.length - 1;
    while (index >= 0) {
        if (map_polygons[index]['type'] == "pol" && map_polygons[index]['customInfo'] !== undefined && map_polygons[index]['customInfo']['idlanguage'] !== undefined) {
            map_polygons[index]['polygon'].remove();
            map_polygons.splice(index, 1);
        }
        index--;
    }
}

function cleanRoute(route){
//    console.log("route cleaned");
    angular.forEach(map_polylines, function(item,key){
        if(route.overview_polyline == item['customInfo'].overview_polyline) {
            item['polyline'].remove();
            map_polylines.splice(key, 1);
        }
    });
    var index = map_polygons.length-1;
    while(index > 0){
        if(map_polygons[index]['customInfo'] !== undefined && map_polygons[index]['customInfo'].route !== undefined)
            if(map_polygons[index]['customInfo'].route.overview_polyline == route.overview_polyline){
//                console.log("removed");
                map_polygons[index]['polygon'].remove();
                map_polygons.splice(index,1);
            }
            index--;
    }
}

function setVisibleLine(line,condition){
    angular.forEach(map_polylines, function(item,key){
        if(line.overview_polyline == item['customInfo'].overview_polyline) {
            item['polyline'].setVisible(condition);
        }
    });
}

var updatePosition = function(service, position){
    if(service != null) {
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        service.updateDevice(device.uuid, position.coords.latitude, position.coords.longitude, datetime).then(function (response) {
//                        console.log(response['data']);
        });
    }
};
