// Function to render team members by category
async function renderTeamByCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading team members...</p>
        </div>
    `;

    try {
        // Load the YAML data from the who-we-are.yaml file
        const data = await loadYamlData('who-we-are.yaml');
        if (!data || !data.people || data.people.length === 0) {
            container.innerHTML = '<p>No team members available at this time.</p>';
            return;
        }

        // Filter people by category
        let categoryPeople = data.people.filter(person => {
            return person.categories && person.categories.includes(category);
        });

        if (categoryPeople.length === 0) {
            container.innerHTML = `<p>No ${category.toLowerCase()} members have been added to the site at this time.</p>`;
            return;
        }
        
        // Sort people alphabetically by last name, unless it's the 'Leadership' category
        if (category !== 'Leadership') {
            categoryPeople.sort((a, b) => {
                // Extract last name (last word in the name)
                const getLastName = (fullName) => {
                    if (!fullName) return '';
                    const nameParts = fullName.trim().split(/\s+/);
                    return nameParts[nameParts.length - 1].toLowerCase();
                };
                
                const lastNameA = getLastName(a.name);
                const lastNameB = getLastName(b.name);
                return lastNameA.localeCompare(lastNameB);
            });
        }

        // Debug: Log the sorted names to verify sorting is working
        // console.log(`${category} members sorted by last name:`, categoryPeople.map(p => p.name));

        // Clear loading indicator
        container.innerHTML = '';

        // Render each person in this category
        // ${person.email ? `<a href="mailto:${person.email}" class="member-link"><i class="fas fa-envelope"></i> Email</a>` : ''}
        categoryPeople.forEach(person => {
            const personCard = document.createElement('div');
            personCard.className = 'team-member';

            const imagePath = person.image || 'content/people/images/pic_placeholder.jpg';

            personCard.innerHTML = `
                <div class="member-photo">
                    <img src="${imagePath}" alt="${person.name}">
                </div>
                <div class="member-info">
                    <h4>${person.name}</h4>
                    <p class="member-title">${person.title}</p>
                    <p class="member-bio">${person.description}</p>
                    <div class="member-links">
                        
                        ${person.website ? `<a href="${person.website}" class="member-link" target="_blank"><i class="fas fa-globe"></i> Website</a>` : ''}
                    </div>
                    ${person.interests && person.interests.length > 0 ? 
                        `<div class="member-interests">
                            <span class="interests-label">Research Interests:</span>
                            ${person.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
                        </div>` : ''}
                </div>
            `;
            container.appendChild(personCard);
        });
    } catch (error) {
        console.error(`Error rendering ${category} members:`, error);
        container.innerHTML = `<p>Failed to load ${category.toLowerCase()} members. Please try again later.</p>`;
    }
}

// Function to render funding information by type
async function renderFundingByType(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Load the YAML data
        const data = await loadYamlData('who-we-are.yaml');
        if (!data || !data.funding || !data.funding[type]) {
            container.innerHTML = `<p>No ${type} funding information available.</p>`;
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Render each funding source
        data.funding[type].forEach(funder => {
            const funderElement = document.createElement('div');
            funderElement.className = 'funding-item';
            
            const logoPath = funder.logo || 'content/artifacts/images/aisec_generic.svg';
            
            funderElement.innerHTML = `
                <div class="funding-logo">
                    <img src="${logoPath}" alt="${funder.name}">
                </div>
                <h4>${funder.name}</h4>
            `;
            
            container.appendChild(funderElement);
        });
    } catch (error) {
        console.error(`Error rendering ${type} funding:`, error);
        container.innerHTML = `<p>Failed to load ${type} funding information. Please try again later.</p>`;
    }
}

// Function to highlight active sidebar item based on scroll position
function handleScrollSpy() {
    const sections = document.querySelectorAll('.content-section');
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    // Find which section is currently most visible in the viewport
    let currentSectionId = '';
    let maxVisibility = 0;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Calculate how much of the section is visible (as a percentage)
        let visibleHeight = 0;
        if (rect.top <= 0 && rect.bottom >= 0) {
            // Section top is above viewport top and bottom is in viewport
            visibleHeight = Math.min(rect.bottom, viewportHeight);
        } else if (rect.top >= 0 && rect.top < viewportHeight) {
            // Section top is in viewport
            visibleHeight = Math.min(viewportHeight - rect.top, rect.height);
        }
        
        const visibilityPercentage = (visibleHeight / rect.height) * 100;
        
        if (visibilityPercentage > maxVisibility) {
            maxVisibility = visibilityPercentage;
            currentSectionId = section.id;
        }
    });
    
    // Update active sidebar item
    if (currentSectionId) {
        sidebarItems.forEach(item => {
            const sectionId = item.getAttribute('data-section');
            if (sectionId === currentSectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Initialize the Who We Are page
function initWhoWeArePage() {
    // Load all content sections
    renderTeamByCategory('Leadership', 'leadership-container');
    renderTeamByCategory('Faculty', 'faculty-container');
    renderTeamByCategory('Research Fellows', 'research-fellows-container');
    renderTeamByCategory('Students', 'students-container');
    
    // Load funding information
    renderFundingByType('government', 'government-funding-container');
    renderFundingByType('industry', 'industry-funding-container');
    renderFundingByType('foundation', 'foundation-funding-container');

    // Set up sidebar item click handlers
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Set up scroll spy for sidebar
    window.addEventListener('scroll', handleScrollSpy);
    // Initial check for active section
    setTimeout(handleScrollSpy, 100);
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initWhoWeArePage);
