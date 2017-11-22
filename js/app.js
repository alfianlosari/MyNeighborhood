let map;
let infoWindow;
let locations;
let locationList;
let filterText;
let markers = [];

initMap = () => {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -6.2015955, lng: 106.8355373},
        zoom: 20,
        styles,
        mapTypeControl: false
    });
 
    infoWindow = new google.maps.InfoWindow();
    locations = [
        {title: 'Google Indonesia', location: { lat: -6.223566, lng: 106.798989 }},                                                                                
        {title: 'Senayan City', location: { lat: -6.227211, lng: 106.797152 }},                                                                        
        {title: 'Plaza Senayan', location: { lat: -6.225573, lng: 106.799161 }},                                                                
        {title: 'fX Sudirman', location: { lat: -6.224580, lng: 106.804018 }},                                                        
        {title: 'Sarinah', location: { lat: -6.187716, lng: 106.823840 }},                                                
        {title: 'Plaza Indonesia', location: { lat: -6.192953, lng: 106.821831 }},                                        
        {title: 'Plaza Semanggi', location: { lat: -6.219900, lng: 106.814494 }},                                
        {title: 'Citywalk Sudirman', location: { lat: -6.208897, lng: 106.818388 }},                        
        {title: 'Plaza Festival', location: { lat: -6.220952, lng: 106.832972 }},                
        {title: 'Kuningan City Mall', location: { lat: -6.224783, lng: 106.829289 }},        
        {title: 'Shangri-La Hotel, Jakarta', location: { lat: -6.202820, lng: 106.818682 }},
        {title: 'Setiabudi One', location: { lat: -6.215241, lng: 106.830125 }},
        {title: 'Epiwalk', location: { lat: -6.217794, lng: 106.834700 }},
        {title: 'Grand Indonesia', location: { lat: -6.195169, lng: 106.819754 }},
        {title: 'Mall Kota Kasablanka', location: { lat: -6.223576, lng: 106.842685 }}                
    ];

    locations.sort((a, b) => a.title > b.title);
    let bounds = new google.maps.LatLngBounds();
    for (let i in locations) {
        let position = locations[i].location;
        let title = locations[i].title;
        let marker = new google.maps.Marker({
            map,
            position,
            title,
            animation: google.maps.Animation.DROP,
            id: i
        });

        locations[i].marker = marker;
        markers.push(marker);
        marker.addListener('click', () => {
            toggleBounce(marker);
            populateInfoWindow(marker);
        });
        bounds.extend(marker.position);
    }

    map.fitBounds(bounds);
    google.maps.event.addListener(map, 'bounds_changed', (event) => {
        if (map.getZoom() > 15) {
            map.setZoom(15);
        }
    });

    ko.applyBindings( new ViewModel() )
};

function populateInfoWindow(marker) {
    if (infoWindow.marker != marker) {
        infoWindow.marker = marker;
        infoWindow.setContent(``);
        infoWindow.addListener('closeclick', () => {
            infoWindow.marker = null;
        });

        const lat = marker.position.lat();
        const lng = marker.position.lng();

        $.ajax({
            type: 'GET',
            dataType: "jsonp",
            cache: false,
            url: `https://api.foursquare.com/v2/venues/search?v=20161016&ll=${lat}%2C%20${lng}&client_id=DW14MQ2YPRPTPOHOP01D4PIG0OXGNGZO3SXTXDBN3PG11KQ5&client_secret=ZXEX4BXEV5F0IG0NNEQTCDIUH3FD0MD1I0GBFFLFAOAPZWKG`,
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Failed to get Foursquare Data');
            },
            success: (data) => {
                if (data.meta.code === 200) {
                    let venues = data.response.venues || [];
                    if (venues.length > 1) {
                        let venue = venues[0];
                        const website = venue.url;
                        const address = venue.location.formattedAddress.join(', ');
                        let content = `<div class="info"><h4>Top Venue<br>${venue.name}</h4><br>${address}`
                        if (website) {
                            content += `<br><br><a href="${website}">Visit Website</a>`
                        }

                        const contact = venue.contact;
                        const phone = contact.phone;
                        if (phone) {
                            content += `<br>Tel: <a href="tel:${phone}">${contact.formattedPhone}</a>`
                        }

                        const twitter = contact.twitter;
                        if (twitter) {
                            content += `<br>Twitter: <a class="twitter-follow-button"
                            href="https://twitter.com/${twitter}">@${twitter}</a>`
                        }                        
                        content += `</div><div><img id="foursquare-logo" src="img/foursquare.png"></div>`;
                        infoWindow.setContent(content);
                    } else {
                        infoWindow.setContent(`<div>No Venues Found</div>`);
                    }
                } else {
                    infoWindow.setContent(`<div>Failed to load data</div>`);
                }
            }
        });
        infoWindow.open(map, marker);
    }
}

const ViewModel = function() {
    locationList = ko.observableArray([]);
    locations.forEach((location) => locationList.push(location))
    filterText = ko.observable('');
    filterLocations = ko.computed(() => {
        if (filterText() === '') {
            return locationList();
        } else {
            return ko.utils.arrayFilter(locationList(), (location) => location.title.toLowerCase().includes(filterText().toLowerCase()));
        }
    });

    locationClick = (location) => {
        toggleBounce(location.marker);
        populateInfoWindow(location.marker);
        closeNav();
    };

    clear = () => {
        filterText('');
        hideListings();
        showListings(filterLocations());
    };

    filter = () => {
        hideListings();
        showListings(filterLocations());
    };
}

function toggleBounce(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => { marker.setAnimation(null); }, 750);    
}

function showListings(locations) {
    let bounds = new google.maps.LatLngBounds;
    for (let location of locations) {
        let marker = markers.find((m) => location.marker === m);
        if (marker) {
            marker.setMap(map);
            bounds.extend(marker.position);
            map.fitBounds(bounds);
        }
    }   
}

function hideListings() {
    for (let marker of markers) {
        marker.setMap(null);
    }
}

function openNav() {
    document.getElementById('mySidenav').style.width = "320px";
    document.getElementById('hamburger').style.visibility = "hidden";
    document.getElementById('sideContainer').style.width = "320px";    
}

function closeNav() {
    document.getElementById('mySidenav').style.width = "0";
    document.getElementById('hamburger').style.visibility = "visible";
    document.getElementById('sideContainer').style.visibility = "0";
}

const styles =  [
    {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{color: '#263c3f'}]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{color: '#6b9a76'}]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{color: '#38414e'}]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{color: '#212a37'}]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{color: '#9ca5b3'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{color: '#746855'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{color: '#1f2835'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{color: '#f3d19c'}]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{color: '#2f3948'}]
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{color: '#17263c'}]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{color: '#515c6d'}]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{color: '#17263c'}]
    }
];
