// Set up price button behavior to work with checkboxes
function setupPriceButtonBehavior() {
    const priceButtons = document.querySelectorAll('input[id^="price-"]:not([id="price-all"])');
    const priceAllCheckbox = document.getElementById('price-all');
    
    if (priceButtons.length > 0 && priceAllCheckbox) {
        // When any price button is clicked
        priceButtons.forEach(button => {
            button.addEventListener('change', function() {
                // If this button is checked
                if (this.checked) {
                    // Uncheck the 'All' checkbox
                    priceAllCheckbox.checked = false;
                } else {
                    // If no other buttons are checked, check the 'All' checkbox
                    const anyChecked = Array.from(priceButtons).some(btn => btn.checked);
                    if (!anyChecked) {
                        priceAllCheckbox.checked = true;
                    }
                }
            });
        });
        
        // When 'All' checkbox is clicked
        priceAllCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck all price buttons
                priceButtons.forEach(button => {
                    button.checked = false;
                });
            }
        });
    }
}

// Setup animation effects for UI elements
function setupAnimationEffects() {
    // Add hover effects to filter sections
    const filterSections = document.querySelectorAll('.filter-section');
    filterSections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.classList.add('active-section');
        });
        section.addEventListener('mouseleave', function() {
            this.classList.remove('active-section');
        });
    });
    
    // Add animation to the apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            this.classList.add('btn-pulse');
            setTimeout(() => {
                this.classList.remove('btn-pulse');
            }, 500);
        });
    }
}// Filter management logic

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
    
    // Set up price button behavior (to match checkbox behavior)
    setupPriceButtonBehavior();
    
    // Enable mobile filter toggle
    setupMobileFilterToggle();
    
    // Setup animation effects
    setupAnimationEffects();
}

// Set up the "All" checkbox behavior for a filter group
function setupAllCheckboxBehavior(groupName) {
    const allCheckbox = document.getElementById(`${groupName}-all`);
    const otherCheckboxes = document.querySelectorAll(`input[id^="${groupName}-"]:not([id="${groupName}-all"])`);
    
    if (!allCheckbox) {
        console.error(`Missing checkbox with id ${groupName}-all`);
        return;
    }
    
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
    
    // Make sure the "All" checkbox is checked if no other checkboxes are checked
    function ensureSelection() {
        const anyChecked = Array.from(otherCheckboxes).some(cb => cb.checked);
        if (!anyChecked) {
            allCheckbox.checked = true;
        }
    }
    
    // Run this once at initialization
    ensureSelection();
}

// Set up mobile filter toggle functionality
function setupMobileFilterToggle() {
    // The toggle button is now in the HTML template as a map control
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const closeFiltersBtn = document.getElementById('close-filters');
    const filtersSidebar = document.getElementById('filters-sidebar');
    
    if (toggleFiltersBtn && closeFiltersBtn && filtersSidebar) {
        // Add event listener to toggle filters sidebar
        toggleFiltersBtn.addEventListener('click', function() {
            filtersSidebar.classList.toggle('show');
        });
        
        // Add event listener to close filters
        closeFiltersBtn.addEventListener('click', function() {
            filtersSidebar.classList.remove('show');
        });
        
        // Close filters when a filter is applied on mobile
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    filtersSidebar.classList.remove('show');
                }
            });
        }
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
