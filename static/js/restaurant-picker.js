// Restaurant Random Picker Functionality
let currentPickedRestaurants = [];

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeRestaurantPicker();
});

// Set up the restaurant picker functionality
function initializeRestaurantPicker() {
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
    const restaurantContainer = document.getElementById('restaurant-picker-container');
    const restaurantCardsContainer = document.getElementById('restaurant-picker-cards');
    
    // Check if we have restaurants to pick from
    if (!restaurants || restaurants.length === 0) {
        showError("No restaurants available. Please search for restaurants first.");
        return;
    }
    
    // Clear previous picks
    restaurantCardsContainer.innerHTML = "";
    currentPickedRestaurants = [];
    
    // Show the container
    restaurantContainer.style.display = "block";
    
    // Add title for the picked restaurants
    const titleDiv = document.createElement('div');
    titleDiv.className = 'col-12 restaurant-picker-title';
    titleDiv.innerHTML = `
        <h5>${count === 1 ? 'Your Restaurant Pick' : 'Your Random Restaurant Picks'}</h5>
    `;
    restaurantCardsContainer.appendChild(titleDiv);
    
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
    
    // Add restaurant cards to the container
    picks.forEach((restaurant, index) => {
        addPickedRestaurantCard(restaurant, index, count);
    });
    
    // Scroll to the picked restaurants
    restaurantContainer.scrollIntoView({ behavior: 'smooth' });
}

// Add a restaurant card to the picker container
function addPickedRestaurantCard(restaurant, index, totalCount) {
    const restaurantCardsContainer = document.getElementById('restaurant-picker-cards');
    
    // Create column with appropriate width based on number of restaurants
    const colClass = totalCount === 1 ? 'col-md-8 col-lg-6 mx-auto' : 'col-md-4';
    
    // Determine if this is a fast food restaurant based on types
    const isFastFood = restaurant.types.some(type => 
        ["meal_takeaway", "fast_food"].includes(type)
    );
    
    // Create the card element
    const cardElement = document.createElement('div');
    cardElement.className = colClass;
    cardElement.innerHTML = `
        <div class="card h-100 restaurant-picker-card">
            <div class="card-img-top d-flex align-items-center justify-content-center bg-dark">
                <i class="fas fa-utensils fa-3x text-light opacity-50"></i>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title">${restaurant.name}</h5>
                    <span class="restaurant-rating">${restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"} ⭐</span>
                </div>
                <h6 class="card-subtitle mb-2 text-muted">${restaurant.vicinity}</h6>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="restaurant-price">${getDisplayPrice(restaurant.price_level)}</span>
                    <span class="badge ${isFastFood ? 'bg-danger' : 'bg-success'}">${isFastFood ? 'Fast Food' : 'Sit-down'}</span>
                </div>
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-between">
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-place-id="${restaurant.place_id}">View Details</button>
                <button class="btn btn-sm btn-outline-info shuffle-btn" data-index="${index}">
                    <i class="fas fa-random"></i> Shuffle
                </button>
            </div>
        </div>
    `;
    
    // Add card to container
    restaurantCardsContainer.appendChild(cardElement);
    
    // Add event listeners to buttons
    const shuffleBtn = cardElement.querySelector('.shuffle-btn');
    shuffleBtn.addEventListener('click', function() {
        shuffleRestaurant(index);
    });
    
    const viewDetailsBtn = cardElement.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', function() {
        showRestaurantDetails(restaurant.place_id);
    });
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
        !currentPickedRestaurants.includes(r)
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
    
    // Find the container that needs to be updated
    const restaurantCardsContainer = document.getElementById('restaurant-picker-cards');
    const cards = restaurantCardsContainer.querySelectorAll('.restaurant-picker-card');
    
    if (indexToShuffle < cards.length) {
        // Get the parent column of the card
        const cardColumn = cards[indexToShuffle].closest('[class^="col-"]');
        const totalCount = currentPickedRestaurants.length;
        
        // Remove the old card
        if (cardColumn) {
            // Get the class of the column to preserve it
            const colClass = cardColumn.className;
            
            // Create a new card
            const newCardElement = document.createElement('div');
            newCardElement.className = colClass;
            
            // Determine if this is a fast food restaurant based on types
            const isFastFood = newRestaurant.types.some(type => 
                ["meal_takeaway", "fast_food"].includes(type)
            );
            
            // Create the new card content
            newCardElement.innerHTML = `
                <div class="card h-100 restaurant-picker-card">
                    <div class="card-img-top d-flex align-items-center justify-content-center bg-dark">
                        <i class="fas fa-utensils fa-3x text-light opacity-50"></i>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${newRestaurant.name}</h5>
                            <span class="restaurant-rating">${newRestaurant.rating ? newRestaurant.rating.toFixed(1) : "N/A"} ⭐</span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-muted">${newRestaurant.vicinity}</h6>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="restaurant-price">${getDisplayPrice(newRestaurant.price_level)}</span>
                            <span class="badge ${isFastFood ? 'bg-danger' : 'bg-success'}">${isFastFood ? 'Fast Food' : 'Sit-down'}</span>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary view-details-btn" data-place-id="${newRestaurant.place_id}">View Details</button>
                        <button class="btn btn-sm btn-outline-info shuffle-btn" data-index="${indexToShuffle}">
                            <i class="fas fa-random"></i> Shuffle
                        </button>
                    </div>
                </div>
            `;
            
            // Replace the old card with the new one
            cardColumn.parentNode.replaceChild(newCardElement, cardColumn);
            
            // Add event listeners to buttons
            const shuffleBtn = newCardElement.querySelector('.shuffle-btn');
            shuffleBtn.addEventListener('click', function() {
                shuffleRestaurant(indexToShuffle);
            });
            
            const viewDetailsBtn = newCardElement.querySelector('.view-details-btn');
            viewDetailsBtn.addEventListener('click', function() {
                showRestaurantDetails(newRestaurant.place_id);
            });
            
            // Add animation to show it's been updated
            const card = newCardElement.querySelector('.restaurant-picker-card');
            card.style.animation = 'none';
            card.offsetHeight; // Trigger reflow
            card.style.animation = 'fadeIn 0.5s';
            
            // Show a success message
            showInfo("Restaurant shuffled successfully!");
        }
    }
}
