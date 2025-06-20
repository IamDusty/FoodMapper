// Custom toast function for restaurant picker
function showToast(message, type = 'success', icon = 'check-circle') {
    // Check if we need to create a toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
}// Enhanced Restaurant Random Picker Functionality
let currentPickedRestaurants = [];
let restaurantPickerModal;

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedRestaurantPicker();
    
    // Initialize the restaurant picker modal
    restaurantPickerModal = new bootstrap.Modal(
        document.getElementById('restaurant-picker-modal')
    );
});

// Set up the restaurant picker functionality
function initializeEnhancedRestaurantPicker() {
    // Add event listeners to the picker buttons
    document.getElementById('pick-one-restaurant').addEventListener('click', function() {
        pickRandomRestaurants(1);
    });
    
    document.getElementById('pick-three-restaurants').addEventListener('click', function() {
        pickRandomRestaurants(3);
    });
}

// Pick random restaurants from the available list
function pickRandomRestaurants(count) {
    const restaurantCardsContainer = document.getElementById('restaurant-picker-cards');
    const modalTitle = document.getElementById('restaurant-picker-modal-label');
    
    // Update the modal title based on count
    modalTitle.textContent = count === 1 ? 'Your Restaurant Pick' : 'Your Random Restaurant Picks';
    
    // Check if we have restaurants to pick from
    if (!restaurants || restaurants.length === 0) {
        showError("No restaurants available. Please search for restaurants first.");
        return;
    }
    
    // Clear previous picks
    restaurantCardsContainer.innerHTML = "";
    currentPickedRestaurants = [];
    
    // Get random restaurants
    const availableRestaurants = [...restaurants]; // Create a copy to avoid modifying the original array
    const picks = [];
    
    // Ensure we don't try to pick more restaurants than are available
    const actualCount = Math.min(count, availableRestaurants.length);
    
    for (let i = 0; i < actualCount; i++) {
        // If we've already picked all available restaurants, break the loop
        if (availableRestaurants.length === 0) break;
        
        // Pick a random restaurant
        const randomIndex = Math.floor(Math.random() * availableRestaurants.length);
        const randomRestaurant = availableRestaurants[randomIndex];
        
        picks.push(randomRestaurant);
        
        // Remove the picked restaurant from available options to avoid duplicates
        availableRestaurants.splice(randomIndex, 1);
    }
    
    // Store the current picks for reference (used for shuffling)
    currentPickedRestaurants = picks;
    
    // Add restaurant cards to the container based on count
    if (count === 1) {
        // Single card centered
        const cardDiv = document.createElement('div');
        cardDiv.className = 'col-md-8 col-lg-6 mx-auto';
        cardDiv.innerHTML = createRestaurantCardHTML(picks[0], 0);
        restaurantCardsContainer.appendChild(cardDiv);
    } else {
        // Multiple cards in a row
        picks.forEach((restaurant, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'col-md-4';
            cardDiv.innerHTML = createRestaurantCardHTML(restaurant, index);
            restaurantCardsContainer.appendChild(cardDiv);
        });
    }
    
    // Show success message
    showToast(`Found ${picks.length} great ${picks.length === 1 ? 'option' : 'options'} for you!`, 'success', 'check-circle');
    
    // Add event listeners to buttons
    picks.forEach((restaurant, index) => {
        // Add event listener for shuffle button
        const shuffleBtn = restaurantCardsContainer.querySelector(`.shuffle-btn[data-index="${index}"]`);
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', function() {
                shuffleRestaurant(index);
            });
        }
        
        // Add event listener for view details button
        const viewDetailsBtn = restaurantCardsContainer.querySelector(`.view-details-btn[data-place-id="${restaurant.place_id}"]`);
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function() {
                // Close the picker modal first
                restaurantPickerModal.hide();
                // Show restaurant details after a short delay to allow modal transition
                setTimeout(() => {
                    showRestaurantDetails(restaurant.place_id);
                }, 300);
            });
        }
    });
    
    // Show the modal
    restaurantPickerModal.show();
}

// Create HTML for a restaurant card
function createRestaurantCardHTML(restaurant, index) {
    // Determine if this is a fast food restaurant based on types
    const isFastFood = restaurant.types.some(type => 
        ["meal_takeaway", "fast_food"].includes(type)
    );
    
    // Create search URL for the restaurant
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + restaurant.vicinity)}`;
    
    return `
        <div class="card h-100 restaurant-picker-card">
            <div class="card-img-container d-flex align-items-center justify-content-center">
                <i class="fas fa-utensils fa-3x text-light opacity-50"></i>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title">
                        <a href="${searchUrl}" target="_blank" class="restaurant-name-link">${restaurant.name}</a>
                    </h5>
                    <span class="restaurant-rating"><i class="fas fa-star me-1"></i>${restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"}</span>
                </div>
                <h6 class="card-subtitle mb-2 text-muted">${restaurant.vicinity}</h6>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="restaurant-price">${getDisplayPrice(restaurant.price_level)}</span>
                    <span class="badge ${isFastFood ? 'bg-danger' : 'bg-success'}">${isFastFood ? 'Fast Food' : 'Sit-down'}</span>
                </div>
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-between">
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-place-id="${restaurant.place_id}">
                    <i class="fas fa-info-circle me-1"></i> Details
                </button>
                <button class="btn btn-sm btn-outline-info shuffle-btn" data-index="${index}">
                    <i class="fas fa-random me-1"></i> Shuffle
                </button>
            </div>
        </div>
    `;
}

// Shuffle a single restaurant card
function shuffleRestaurant(indexToShuffle) {
    // Ensure we have restaurants to pick from
    if (!restaurants || restaurants.length === 0 || restaurants.length <= 1) {
        showError("Not enough restaurants to shuffle.");
        return;
    }
    
    // Create a list of available restaurants (excluding currently picked ones)
    const availableRestaurants = restaurants.filter(r => 
        !currentPickedRestaurants.some(picked => picked.place_id === r.place_id)
    );
    
    // If no other restaurants are available, show an error
    if (availableRestaurants.length === 0) {
        showError("No more restaurants available to shuffle.");
        return;
    }
    
    // Pick a random restaurant from the available ones
    const randomIndex = Math.floor(Math.random() * availableRestaurants.length);
    const newRestaurant = availableRestaurants[randomIndex];
    
    // Update the picked restaurants array
    currentPickedRestaurants[indexToShuffle] = newRestaurant;
    
    // Find the restaurant card that needs to be updated
    const restaurantCardsContainer = document.getElementById('restaurant-picker-cards');
    const cardElement = restaurantCardsContainer.querySelector(`.shuffle-btn[data-index="${indexToShuffle}"]`).closest('.col-md-4, .col-md-8');
    
    if (cardElement) {
        // Create a new card
        cardElement.innerHTML = createRestaurantCardHTML(newRestaurant, indexToShuffle);
        
        // Add event listeners to buttons
        const shuffleBtn = cardElement.querySelector('.shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', function() {
                shuffleRestaurant(indexToShuffle);
            });
        }
        
        const viewDetailsBtn = cardElement.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function() {
                // Close the picker modal first
                restaurantPickerModal.hide();
                // Show restaurant details after a short delay to allow modal transition
                setTimeout(() => {
                    showRestaurantDetails(newRestaurant.place_id);
                }, 300);
            });
        }
        
        // Add animation to show it's been updated
        const card = cardElement.querySelector('.restaurant-picker-card');
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = 'fadeIn 0.5s';
        
        // Show a success message
        showToast("Found a new option for you!", 'success', 'check-circle');
    }
}
