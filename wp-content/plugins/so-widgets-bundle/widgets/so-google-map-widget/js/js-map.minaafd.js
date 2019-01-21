function loadMap(a){a(".sow-google-map-canvas").each(function(){var e=a(this),o=e.data("address");if(!o){var t=e.data("marker-positions");t&&t.length&&(o=t[0].place)}var n=new google.maps.Geocoder;n.geocode({address:o},function(a,o){if(o==google.maps.GeocoderStatus.OK){var t=Number(e.data("zoom"));t||(t=14);var i="user_map_style",r={zoom:t,scrollwheel:Boolean(e.data("scroll-zoom")),draggable:Boolean(e.data("draggable")),disableDefaultUI:Boolean(e.data("disable-ui")),center:a[0].geometry.location,mapTypeControlOptions:{mapTypeIds:[google.maps.MapTypeId.ROADMAP,i]}},s=new google.maps.Map(e.get(0),r),p={name:e.data("map-name")},d=e.data("map-styles");if(d){var l=new google.maps.StyledMapType(d,p);s.mapTypes.set(i,l),s.setMapTypeId(i)}Boolean(e.data("marker-at-center"))&&new google.maps.Marker({position:a[0].geometry.location,map:s,draggable:Boolean(e.data("markers-draggable")),icon:e.data("marker-icon"),title:""});var g=e.data("marker-positions");g&&g.length&&g.forEach(function(a){var o=function(){n.geocode({address:a.place},function(t,n){if(n==google.maps.GeocoderStatus.OK){var i=new google.maps.Marker({position:t[0].geometry.location,map:s,draggable:Boolean(e.data("markers-draggable")),icon:e.data("marker-icon"),title:""});if(a.hasOwnProperty("info")&&a.info){var r={content:a.info};a.hasOwnProperty("info_max_width")&&a.info_max_width&&(r.maxWidth=a.info_max_width);var p=e.data("marker-info-display");r.disableAutoPan="always"==p;var d=new google.maps.InfoWindow(r);"always"==p?d.open(s,i):i.addListener(p,function(){d.open(s,i)})}}else n==google.maps.GeocoderStatus.OVER_QUERY_LIMIT&&setTimeout(o,1e3*Math.random(),a)})};setTimeout(o,1e3*Math.random(),a)});var m=e.data("directions");if(m){m.waypoints&&m.waypoints.length&&m.waypoints.map(function(a){a.stopover=Boolean(a.stopover)});var c=new google.maps.DirectionsRenderer;c.setMap(s);var v=new google.maps.DirectionsService;v.route({origin:m.origin,destination:m.destination,travelMode:m.travelMode.toUpperCase(),avoidHighways:Boolean(m.avoidHighways),avoidTolls:Boolean(m.avoidTolls),waypoints:m.waypoints,optimizeWaypoints:Boolean(m.optimizeWaypoints)},function(a,e){e==google.maps.DirectionsStatus.OK&&c.setDirections(a)})}if(Boolean(e.data("keep-centered"))){var w;google.maps.event.addDomListener(s,"idle",function(){w=s.getCenter()}),google.maps.event.addDomListener(window,"resize",function(){s.setCenter(w)})}}else o==google.maps.GeocoderStatus.ZERO_RESULTS&&e.append("<div><p><strong>There were no results for the place you entered. Please try another.</strong></p></div>")})})}function loadApi(a){var e=a(".sow-google-map-canvas").data("api-key"),o="https://maps.googleapis.com/maps/api/js?v=3.exp&callback=initialize";e&&(o+="&key="+e);var t=a('<script type="text/javascript" src="'+o+'">');a("body").append(t)}function initialize(){loadMap(window.jQuery)}jQuery(function(a){window.google&&window.google.maps?loadMap(a):loadApi(a)});