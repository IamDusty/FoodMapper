// Filter management logic

// Initialize filter checkboxes when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
});

// Initialize filter groups
function initializeFilters() {
    // Set up "All" checkbox behavior for each filter group
    setupAllCheckboxBehavior('type');
    setupAllCheckboxBehavior('cuisine');
    setupAllCheckboxBehavior('price');
    
    // Enable mobile filter toggle
    setupMobileFilterToggle();
}

// Set up the "All" checkbox behavior for a filter group
function setupAllCheckboxBehavior(groupName) {
    const allCheckbox = document.getElementById(`${groupName}-all`);
    const otherCheckboxes = document.querySelectorAll(`input[id^="${groupName}-"]:not([id="${groupName}-all"])`);
    
    // When "All" is checked, uncheck others
    allCheckbox.addEventListener('change', function() {
        if (this.checked) {
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        } else {
            // If "All" is unchecked and no other options are selected, check it again
            const anyChecked = Array.from(otherCheckboxes).some(cb => cb.checked);
            if (!anyChecked) {
                this.checked = true;
            }
        }
    });
    
    // When any other checkbox is checked, uncheck "All"
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                allCheckbox.checked = false;
            } else {
                // If no checkboxes are checked, check "All"
                const anyChecked = Array.from(otherCheckboxes).some(cb => cb.checked);
                if (!anyChecked) {
                    allCheckbox.checked = true;
                }
            }
        });
    });
}

// Set up mobile filter toggle functionality
function setupMobileFilterToggle() {
    // Add button to navbar for mobile
    const navbar = document.querySelector('.navbar-collapse');
    if (navbar) {
        const filterToggleBtn = document.createElement('button');
        filterToggleBtn.id = 'filter-toggle-btn';
        filterToggleBtn.className = 'btn btn-outline-light d-md-none ms-2';
        filterToggleBtn.innerHTML = '<i class="fas fa-filter"></i> Filters';
        
        navbar.appendChild(filterToggleBtn);
        
        // Add event listener to toggle filters sidebar
        filterToggleBtn.addEventListener('click', function() {
            const filtersSidebar = document.getElementById('filters-sidebar');
            filtersSidebar.classList.toggle('show');
        });
        
        // Close filters when a filter is applied on mobile
        const applyFiltersBtn = document.getElementById('apply-filters');
        applyFiltersBtn.addEventListener('click', function() {
            const filtersSidebar = document.getElementById('filters-sidebar');
            if (window.innerWidth < 768) {
                filtersSidebar.classList.remove('show');
            }
        });
    }
}

// Get cuisine types from restaurant name and types
function getCuisineTypes(restaurant) {
    const knownCuisines = [
        'italian', 'mexican', 'chinese', 'japanese', 'thai', 
        'indian', 'american', 'french', 'greek', 'spanish',
        'korean', 'vietnamese', 'mediterranean', 'middle_eastern'
    ];
    
    // Check if any known cuisine is in the restaurant types
    const cuisineFromTypes = restaurant.types.find(type => 
        knownCuisines.includes(type)
    );
    
    if (cuisineFromTypes) {
        return cuisineFromTypes;
    }
    
    // Try to determine cuisine from restaurant name
    const name = restaurant.name.toLowerCase();
    const cuisineFromName = knownCuisines.find(cuisine => 
        name.includes(cuisine.replace('_', ' '))
    );
    
    if (cuisineFromName) {
        return cuisineFromName;
    }
    
    // Default to generic restaurant
    return 'restaurant';
}

// Check if a restaurant is fast food
function isFastFoodRestaurant(restaurant) {
    // Check restaurant types for fast food indicators
    const fastFoodTypes = ['meal_takeaway', 'fast_food'];
    const hasFastFoodType = restaurant.types.some(type => 
        fastFoodTypes.includes(type)
    );
    
    if (hasFastFoodType) {
        return true;
    }
    
    // Check restaurant name for common fast food chains
    const fastFoodChains = [
        'mcdonald', 'burger king', 'wendy', 'kfc', 'taco bell',
        'subway', 'domino', 'pizza hut', 'chipotle', 'popeyes',
        'chick-fil-a', 'sonic', 'dairy queen', 'five guys',
        'papa john', 'dunkin', 'starbucks', 'panera', 'arby'
    ];
    
    const name = restaurant.name.toLowerCase();
    return fastFoodChains.some(chain => name.includes(chain));
}
