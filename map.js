// Global variables
let map;
let infoWindow;
let markers = [];
let restaurants = [];
let currentPosition = null;
let userMarker = null;
let userCircle = null;
let placesService;
let directionsService;
let directionsRenderer;

// Initialize the map
function initMap() {
    // Create a new map centered at a default location (New York City)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 14,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ],
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
        },
    });
    
    // Create info window for displaying restaurant info
    infoWindow = new google.maps.InfoWindow();
    
    // Create Places Service for getting restaurant data
    // Using a dedicated div for Places attribution to avoid issues with restricted API keys
    const placesDiv = document.getElementById('places-attribution');
    placesService = new google.maps.places.PlacesService(placesDiv || map);
    
    // Create Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    directionsRenderer.setMap(map);
    
    // Try to get user's current location
    getUserLocation();
    
    // Set up event listeners
    setupEventListeners();
}

// Get user's current location
function getUserLocation() {
    showLoadingIndicator();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                currentPosition = pos;
                map.setCenter(pos);
                addUserMarker(pos);
                searchNearbyRestaurants(pos);
                hideLoadingIndicator();
            },
            (error) => {
                console.error("Error getting user location:", error);
                showLocationError();
                hideLoadingIndicator();
            }
        );
    } else {
        console.error("Browser does not support geolocation");
        showLocationError();
        hideLoadingIndicator();
    }
}

// Add a marker for the user's location
function addUserMarker(position) {
    // Clear existing user markers if any (to prevent duplicates)
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    if (userCircle) {
        userCircle.setMap(null);
    }
    
    // Check if the Advanced Marker API is available and use it if possible
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        // Create a pin element with blue dot for the marker
        const pinElement = document.createElement("div");
        pinElement.innerHTML = `
            <div style="width: 20px; height: 20px; background-color: #4285F4; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,.3);"></div>
        `;
        
        // Use the new AdvancedMarkerElement API
        userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: map,
            title: "Your Location",
            content: pinElement,
            zIndex: 999,
        });
    } else {
        // Fall back to deprecated Marker API if AdvancedMarkerElement is not available
        userMarker = new google.maps.Marker({
            position: position,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
            },
            title: "Your Location",
            zIndex: 999,
        });
    }
    
    // Add a circle around the user's location to indicate search radius
    userCircle = new google.maps.Circle({
        map: map,
        center: position,
        radius: 1500, // 1500 meters = ~1 mile
        fillColor: "#4285F4",
        fillOpacity: 0.1,
        strokeColor: "#4285F4",
        strokeOpacity: 0.5,
        strokeWeight: 1,
    });
}

// Search for nearby restaurants
function searchNearbyRestaurants(position) {
    showLoadingIndicator();
    
    console.log("Searching for restaurants near:", position);
    
    // Use the server-side proxy endpoint instead of direct Places API call
    fetch(`/api/places/nearby?location=${position.lat},${position.lng}&radius=1500&type=restaurant`)
        .then(response => {
            console.log("Server response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Server API response:", data);
            
            if (data.status === "OK" && data.results) {
                restaurants = data.results;
                displayRestaurants(restaurants);
            } else {
                const errorMsg = data.error_message || 'Unknown error';
                console.error("Error fetching nearby restaurants:", data.status, errorMsg);
                
                let errorDetails = `
                    <div class="alert alert-danger">
                        <strong>Google API Error:</strong> ${data.status}<br>
                        <strong>Error Message:</strong> ${errorMsg}<br><br>
                        <p>Please check your Google API key settings to ensure it has the following:</p>
                        <ul>
                            <li>The Places API is enabled</li>
                            <li>If using HTTP referrer restrictions, make sure to include both your domain AND *.googleapis.com</li>
                            <li>Consider temporarily removing application restrictions for testing</li>
                        </ul>
                    </div>
                `;
                
                document.getElementById("restaurant-list").innerHTML = errorDetails;
                showError(`API Error: ${data.status} - ${errorMsg}`);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("restaurant-list").innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
            showError("Error fetching nearby restaurants: " + error.message);
        })
        .finally(() => {
            hideLoadingIndicator();
        });
}

// Display restaurants on the map and in the list
function displayRestaurants(restaurantList) {
    // Clear existing markers
    clearMarkers();
    
    // Clear restaurant list
    const restaurantListContainer = document.getElementById("restaurant-list");
    restaurantListContainer.innerHTML = "";
    
    // Update restaurant count
    document.getElementById("restaurant-count").textContent = restaurantList.length;
    
    // Show "no results" message if no restaurants found
    if (restaurantList.length === 0) {
        document.getElementById("no-results").style.display = "block";
        return;
    } else {
        document.getElementById("no-results").style.display = "none";
    }
    
    // Display each restaurant
    restaurantList.forEach((restaurant, index) => {
        addRestaurantMarker(restaurant, index);
        addRestaurantToList(restaurant, index);
    });
}

// Add a restaurant marker to the map
function addRestaurantMarker(restaurant, index) {
    // Determine if this is a fast food restaurant based on types
    const isFastFood = restaurant.types.some(type => 
        ["meal_takeaway", "fast_food"].includes(type)
    );
    
    let marker;
    
    // Check if Advanced Marker API is available
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        // Create color for marker
        const markerColor = isFastFood ? "#FF5252" : "#4CAF50";
        
        // Create pin element for the marker
        const pinElement = document.createElement("div");
        pinElement.innerHTML = `
            <div style="
                width: 16px; 
                height: 16px; 
                background-color: ${markerColor}; 
                border-radius: 50%; 
                border: 1.5px solid white; 
                box-shadow: 0 2px 6px rgba(0,0,0,.3);
                transform: scale(0);
                animation: dropIn 0.3s ease-out forwards;
            "></div>
        `;
        
        // Add animation style only once
        if (!document.getElementById('marker-animation-style')) {
            const style = document.createElement('style');
            style.id = 'marker-animation-style';
            style.textContent = `
                @keyframes dropIn {
                    0% { transform: scale(0) translateY(-20px); }
                    70% { transform: scale(1.2) translateY(5px); }
                    100% { transform: scale(1) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Use the new AdvancedMarkerElement
        marker = new google.maps.marker.AdvancedMarkerElement({
            position: restaurant.geometry.location,
            map: map,
            title: restaurant.name,
            content: pinElement,
            zIndex: index,
        });
        
        // Add click functionality
        marker.addListener("click", () => {
            openRestaurantInfoWindow(restaurant, marker);
        });
    } else {
        // Fall back to standard Marker
        marker = new google.maps.Marker({
            position: restaurant.geometry.location,
            map: map,
            title: restaurant.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: isFastFood ? "#FF5252" : "#4CAF50",
                fillOpacity: 0.9,
                strokeColor: "#FFFFFF",
                strokeWeight: 1.5,
            },
            animation: google.maps.Animation.DROP,
            zIndex: index,
        });
        
        // Add click event listener to marker
        marker.addListener("click", () => {
            openRestaurantInfoWindow(restaurant, marker);
        });
    }
    
    // Store marker reference
    markers.push(marker);
}

// Open info window for a restaurant
function openRestaurantInfoWindow(restaurant, marker) {
    // Create content for info window
    const content = `
        <div class="custom-info-window">
            <div class="info-window-header">${restaurant.name}</div>
            <div class="info-window-content">
                <div>${restaurant.vicinity}</div>
                <div>Rating: ${restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"} ⭐</div>
                <div>Price: ${getDisplayPrice(restaurant.price_level)}</div>
                <button id="view-details-btn" class="btn btn-sm btn-primary mt-2">View Details</button>
            </div>
        </div>
    `;
    
    // Set content and open info window
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
    
    // Add event listener to "View Details" button
    setTimeout(() => {
        const viewDetailsBtn = document.getElementById("view-details-btn");
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener("click", () => {
                showRestaurantDetails(restaurant.place_id);
            });
        }
    }, 100);
}

// Add a restaurant to the list view
function addRestaurantToList(restaurant, index) {
    const restaurantListContainer = document.getElementById("restaurant-list");
    
    // Determine if this is a fast food restaurant based on types
    const isFastFood = restaurant.types.some(type => 
        ["meal_takeaway", "fast_food"].includes(type)
    );
    
    // Create restaurant card element
    const restaurantCard = document.createElement("div");
    restaurantCard.className = "col-md-6 col-lg-4 fade-in";
    restaurantCard.innerHTML = `
        <div class="card h-100 restaurant-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title">${restaurant.name}</h5>
                    <span class="restaurant-rating">${restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"} ⭐</span>
                </div>
                <h6 class="card-subtitle mb-2 text-muted">${restaurant.vicinity}</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="restaurant-price">${getDisplayPrice(restaurant.price_level)}</span>
                    <span class="badge ${isFastFood ? 'bg-danger' : 'bg-success'}">${isFastFood ? 'Fast Food' : 'Sit-down'}</span>
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-place-id="${restaurant.place_id}">View Details</button>
                <button class="btn btn-sm btn-outline-secondary ms-2 directions-btn" data-lat="${restaurant.geometry.location.lat}" data-lng="${restaurant.geometry.location.lng}">
                    <i class="fas fa-directions"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add restaurant card to list
    restaurantListContainer.appendChild(restaurantCard);
    
    // Add event listener to "View Details" button
    const viewDetailsBtn = restaurantCard.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", () => {
        showRestaurantDetails(restaurant.place_id);
    });
    
    // Add event listener to "Directions" button
    const directionsBtn = restaurantCard.querySelector(".directions-btn");
    directionsBtn.addEventListener("click", () => {
        if (currentPosition) {
            const destination = {
                lat: parseFloat(directionsBtn.getAttribute("data-lat")),
                lng: parseFloat(directionsBtn.getAttribute("data-lng"))
            };
            showDirections(currentPosition, destination);
        } else {
            showError("Your location is not available. Please allow location access and try again.");
        }
    });
}

// Show restaurant details in a modal
function showRestaurantDetails(placeId) {
    // Show loading state in modal
    const modalBody = document.getElementById("restaurant-detail-content");
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("restaurant-detail-modal"));
    modal.show();
    
    // Use the server-side proxy endpoint instead of direct Places API call
    fetch(`/api/places/details?place_id=${placeId}`)
        .then(response => {
            console.log("Server details response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Server details API response:", data);
            
            if (data.status === "OK" && data.result) {
                updateRestaurantDetailModal(data.result);
            } else {
                const errorMsg = data.error_message || 'Unknown error';
                console.error("Error fetching place details:", data.status, errorMsg);
                
                let errorDetails = `
                    <div class="alert alert-danger">
                        <strong>Google API Error:</strong> ${data.status}<br>
                        <strong>Error Message:</strong> ${errorMsg}<br><br>
                        <p>Please check your Google API key settings or try the "Test API" button in the navbar.</p>
                    </div>
                `;
                
                modalBody.innerHTML = errorDetails;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.message}<br>
                    <p>Something went wrong when fetching restaurant details. Please try again later or check the API settings using the "Test API" button.</p>
                </div>
            `;
        });
}

// Update the restaurant detail modal with fetched data
function updateRestaurantDetailModal(place) {
    const modalBody = document.getElementById("restaurant-detail-content");
    const modalTitle = document.getElementById("restaurant-detail-modal-label");
    const websiteLink = document.getElementById("restaurant-website-link");
    
    // Set modal title
    modalTitle.textContent = place.name;
    
    // Set website link
    if (place.website) {
        websiteLink.href = place.website;
        websiteLink.style.display = "block";
    } else {
        websiteLink.style.display = "none";
    }
    
    // Create content for modal body
    let openingHoursHTML = "";
    if (place.opening_hours && place.opening_hours.weekday_text) {
        openingHoursHTML = `
            <div class="mt-3">
                <h6><i class="fas fa-clock me-2"></i>Opening Hours</h6>
                <ul class="list-group list-group-flush">
                    ${place.opening_hours.weekday_text.map(day => `
                        <li class="list-group-item bg-transparent">${day}</li>
                    `).join("")}
                </ul>
            </div>
        `;
    }
    
    // Set modal content
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-12">
                <p class="lead">
                    <i class="fas fa-map-marker-alt me-2"></i>${place.formatted_address}
                </p>
                
                <div class="d-flex align-items-center mb-3">
                    <span class="me-3">
                        <i class="fas fa-star text-warning me-1"></i>
                        <strong>${place.rating ? place.rating.toFixed(1) : "N/A"}</strong>/5
                    </span>
                    <span>
                        <i class="fas fa-dollar-sign me-1"></i>
                        <strong>${getDisplayPrice(place.price_level)}</strong>
                    </span>
                </div>
                
                <div class="my-3">
                    <h6><i class="fas fa-utensils me-2"></i>Categories</h6>
                    <div>
                        ${place.types.filter(type => !["point_of_interest", "establishment", "food"].includes(type))
                            .map(type => `<span class="badge bg-secondary me-1 mb-1">${formatType(type)}</span>`)
                            .join("")}
                    </div>
                </div>
                
                ${openingHoursHTML}
            </div>
        </div>
    `;
}

// Show directions from user location to restaurant
function showDirections(origin, destination) {
    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                // Close any open info windows
                infoWindow.close();
            } else {
                console.error("Directions request failed due to " + status);
                showError("Could not calculate directions. Please try again later.");
            }
        }
    );
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Set up event listeners
function setupEventListeners() {
    // Locate me button
    document.getElementById("locate-me").addEventListener("click", () => {
        getUserLocation();
    });
    
    // Search button
    document.getElementById("search-button").addEventListener("click", () => {
        searchRestaurants();
    });
    
    // Search input - listen for Enter key
    document.getElementById("search-input").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            searchRestaurants();
        }
    });
    
    // Apply filters button
    document.getElementById("apply-filters").addEventListener("click", () => {
        applyFilters();
    });
    
    // Rating slider
    document.getElementById("rating-slider").addEventListener("input", (event) => {
        const value = event.target.value;
        document.getElementById("rating-value").textContent = `${value} ⭐`;
    });
}

// Search for restaurants based on search input
function searchRestaurants() {
    const searchInput = document.getElementById("search-input").value.trim();
    
    if (searchInput === "") {
        return;
    }
    
    showLoadingIndicator();
    
    // Use the Google Maps geolocation API directly via our server
    // For simplicity, we'll just search for restaurants near this query
    // instead of trying to get the exact location
    fetch(`/api/places/nearby?location=${currentPosition.lat},${currentPosition.lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(searchInput)}`)
        .then(response => {
            console.log("Server response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Server API response for search:", data);
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
                // Get the first result's location
                const location = data.results[0].geometry.location;
                
                // Move the map to this location
                map.setCenter(location);
                
                // Save and display all results
                restaurants = data.results;
                displayRestaurants(restaurants);
            } else if (data.status === "ZERO_RESULTS") {
                // No results found
                console.log("No restaurants found for search:", searchInput);
                document.getElementById("restaurant-list").innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                        <h5>No restaurants matching "${searchInput}"</h5>
                        <p class="text-muted">Try a different search term or browse restaurants nearby</p>
                    </div>
                `;
                showError("No restaurants found. Try a different search term.");
            } else {
                // API Error
                const errorMsg = data.error_message || 'Unknown error';
                console.error("Error searching for location:", data.status, errorMsg);
                
                document.getElementById("restaurant-list").innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle me-2"></i>API Error: ${data.status}</h5>
                            <p>${errorMsg}</p>
                            <p>Please try the "Test API" button in the navigation bar to check your API key settings.</p>
                        </div>
                    </div>
                `;
                
                showError(`API Error: ${data.status}. Please check your API key configuration.`);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("restaurant-list").innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
                        <p>${error.message}</p>
                        <p>There was a problem processing your search. Please try again later.</p>
                    </div>
                </div>
            `;
            showError("Error searching for restaurants: " + error.message);
        })
        .finally(() => {
            hideLoadingIndicator();
        });
}

// Apply filters to the restaurant list
function applyFilters() {
    // Check if we have restaurants to filter
    if (restaurants.length === 0) {
        return;
    }
    
    showLoadingIndicator();
    
    // Get filter values
    const typeFilters = getCheckboxValues("type");
    const cuisineFilters = getCheckboxValues("cuisine");
    const priceFilters = getCheckboxValues("price");
    const ratingFilter = parseFloat(document.getElementById("rating-slider").value);
    
    // Filter restaurants
    const filteredRestaurants = restaurants.filter(restaurant => {
        // Check restaurant type (Fast Food vs. Sit-down)
        const isFastFood = restaurant.types.some(type => 
            ["meal_takeaway", "fast_food"].includes(type)
        );
        
        const typeMatch = typeFilters.includes("all") || 
            (isFastFood && typeFilters.includes("fast-food")) || 
            (!isFastFood && typeFilters.includes("sit-down"));
        
        // Check cuisine type
        const cuisineMatch = cuisineFilters.includes("all") || 
            cuisineFilters.some(cuisine => 
                restaurant.types.includes(cuisine) || 
                (restaurant.name && restaurant.name.toLowerCase().includes(cuisine))
            );
        
        // Check price level
        const priceMatch = priceFilters.includes("all") || 
            (restaurant.price_level && priceFilters.includes(restaurant.price_level.toString()));
        
        // Check rating
        const ratingMatch = !restaurant.rating || restaurant.rating >= ratingFilter;
        
        return typeMatch && cuisineMatch && priceMatch && ratingMatch;
    });
    
    // Display filtered restaurants
    displayRestaurants(filteredRestaurants);
    hideLoadingIndicator();
}

// Helper function to get checkbox values
function getCheckboxValues(groupName) {
    const checkboxes = document.querySelectorAll(`input[id^="${groupName}-"]:checked`);
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Helper function to format a type string
function formatType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to display price level
function getDisplayPrice(priceLevel) {
    if (!priceLevel && priceLevel !== 0) {
        return "Price N/A";
    }
    
    let priceDisplay = "";
    for (let i = 0; i < priceLevel + 1; i++) {
        priceDisplay += "$";
    }
    
    return priceDisplay;
}

// Show loading indicator
function showLoadingIndicator() {
    document.getElementById("loading-indicator").style.display = "flex";
}

// Hide loading indicator
function hideLoadingIndicator() {
    document.getElementById("loading-indicator").style.display = "none";
}

// Show error message
function showError(message) {
    // Create toast element
    const toastId = 'error-toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();
}

// Show location error
function showLocationError() {
    showError("Could not get your location. Please enable location services and refresh the page.");
}
