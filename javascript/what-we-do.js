// Global variable for research pagination
let allResearchItems = [];
let currentlyDisplayed = 0;
const researchItemsPerPage = 6;
let allPeople = []; // Store all people data

// Function to render mission section from what-we-do.yaml
async function renderMission() {
    const container = document.getElementById('mission-content');
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading mission content...</p>
        </div>
    `;

    try {
        // Load the YAML data from the what-we-do.yaml file
        const data = await loadYamlData('what-we-do.yaml');
        if (!data || !data.mission) {
            container.innerHTML = '<p>Mission content not available at this time.</p>';
            return;
        }

        // Clear loading indicator
        container.innerHTML = '';

        const mission = data.mission;

        // Create mission content with preserved text
        const missionContent = document.createElement('div');
        missionContent.className = 'mission-content';

        missionContent.innerHTML = `
            <div class="mission-text">
                <p class="mission-statement">${mission.statement}</p>
                <p>${mission.description}</p>
                <p>${mission.approach}</p>
                <ul class="mission-goals">
                    ${mission.goals.map(goal => `
                        <li>
                            <i class="${goal.icon}"></i>
                            <span>${goal.text}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="mission-image" style="flex: 1.5; max-width: 60%;">
                <img src="images/Mission.png" alt="AI Safety Mission Illustration" style="width: 100%; height: auto; max-width: none; object-fit: contain;">
            </div>
        `;

        container.appendChild(missionContent);
    } catch (error) {
        console.error('Error rendering mission:', error);
        container.innerHTML = '<p>Failed to load mission content. Please try again later.</p>';
    }
}

// Function to render research items
async function renderResearch() {
    const container = document.getElementById('research-content');
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading research content...</p>
        </div>
    `;

    try {
        // Load the YAML data
        const data = await loadYamlData('what-we-do.yaml');
        if (!data || !data.research) {
            container.innerHTML = '<p>Research content not available at this time.</p>';
            return;
        }

        // Clear loading indicator
        container.innerHTML = '';

        const research = data.research;
        allResearchItems = research.items || [];

        // Create research content with items grid
        const researchContent = document.createElement('div');
        researchContent.className = 'research-content';

        researchContent.innerHTML = `
            <div class="research-intro">
                <p>${research.description}</p>
            </div>
            <div class="research-items" id="research-items-container">
                <!-- Research items will be populated here -->
            </div>
            <div class="research-view-more-container">
                <button class="research-view-more-btn" id="research-view-more-btn">
                    View More Research
                </button>
            </div>
        `;

        container.appendChild(researchContent);

        // Render initial research items
        renderResearchItems(researchItemsPerPage);

        // Set up view more button
        const viewMoreBtn = document.getElementById('research-view-more-btn');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', handleResearchViewMore);
            
            // Hide button if all items are already displayed
            if (allResearchItems.length <= researchItemsPerPage) {
                viewMoreBtn.style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Error rendering research:', error);
        container.innerHTML = '<p>Failed to load research content. Please try again later.</p>';
    }
}

// Function to render research items with limit
function renderResearchItems(limit = null) {
    const container = document.getElementById('research-items-container');
    if (!container || !allResearchItems) return;

    // Determine how many items to show
    const itemsToShow = limit ? Math.min(limit, allResearchItems.length) : allResearchItems.length;
    const itemsToRender = allResearchItems.slice(0, itemsToShow);
    
    // Clear container
    container.innerHTML = '';

    // Render each research item
    itemsToRender.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'research-item';

        // Format authors list
        const authorsHTML = item.authors ? item.authors.map(author => 
            `<span class="research-author">${author}</span>`
        ).join('') : '';

        itemElement.innerHTML = `
            <div class="research-item-header">
                <div class="research-item-icon">
                    <i class="${item.icon}"></i>
                </div>
                <h3 class="research-item-title">${item.title}</h3>
            </div>
            <p class="research-item-description">${item.description}</p>
            ${item.authors ? `
                <div class="research-item-authors">
                    <h4>Researchers</h4>
                    <div class="research-authors-list">
                        ${authorsHTML}
                    </div>
                </div>
            ` : ''}
        `;
    // <div class="research-item-footer">
    //     <a href="${item.link}" class="research-learn-more">
    //         Learn More <i class="fas fa-arrow-right"></i>
    //     </a>
    // </div>

        container.appendChild(itemElement);
    });

    // Update current count
    currentlyDisplayedResearch = itemsToShow;
}

// Function to handle view more/less research button
function handleResearchViewMore() {
    const viewMoreBtn = document.getElementById('research-view-more-btn');
    if (!viewMoreBtn || !allResearchItems) return;

    // Check if we're in expanded state (showing all items)
    if (currentlyDisplayedResearch >= allResearchItems.length) {
        // Switch to "View Less" mode
        renderResearchItems(researchItemsPerPage);
        viewMoreBtn.textContent = 'View More Research';
        
        // Scroll back to research section
        document.getElementById('research').scrollIntoView({ behavior: 'smooth' });
    } else {
        // Show all items
        renderResearchItems();
        viewMoreBtn.textContent = 'View Less Research';
    }
}

// Function to load all people from people.yaml
async function loadAllPeople() {
    try {
        const response = await fetch('content/people.yaml');
        if (!response.ok) {
            console.error('Failed to load people.yaml:', response.statusText);
            return [];
        }
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        return data.people || [];
    } catch (error) {
        console.error('Error loading people data:', error);
        return [];
    }
}

// Function to render featured publications with limit
async function renderFeaturedPublications(containerId, maxFeatured = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading featured publications...</p>
        </div>
    `;

    try {
        // Load all people if not already loaded
        if (allPeople.length === 0) {
            allPeople = await loadAllPeople();
        }

        // Load publications from all people
        const allEntries = [];
        for (const person of allPeople) {
            if (person.bib_file && typeof loadBibTeXFile === 'function') {
                const entries = await loadBibTeXFile(person.name);
                allEntries.push(...entries);
            }
        }

        // Clear the container
        container.innerHTML = '';

        if (allEntries.length === 0) {
            container.innerHTML = `<p class="no-publications">No publications found.</p>`;
            return;
        }

        // Filter for featured publications only
        let featuredEntries = allEntries.filter(entry => entry.featured === true);
        
        if (featuredEntries.length === 0) {
            container.innerHTML = `<p class="no-publications">No featured publications found.</p>`;
            return;
        }

        // Sort by year (newest first)
        featuredEntries.sort((a, b) => {
            const yearA = parseInt(a.fields.year || '0');
            const yearB = parseInt(b.fields.year || '0');
            return yearB - yearA;
        });

        // Limit to maximum number of featured publications
        featuredEntries = featuredEntries.slice(0, maxFeatured);

        // Create a publication list
        const publicationList = document.createElement('div');
        publicationList.className = 'publications-list';

        // Add publications
        featuredEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'publication-item featured-publication';

            // Set data attributes for filtering using the parsed tags
            if (entry.tags && entry.tags.length > 0) {
                item.dataset.topics = entry.tags.join(',');
            }

            // Format authors
            let authors = entry.fields.author || '';
            // authors = authors.replace(/\\myname{([^}]+)}/g, 'Bagdasarian, Eugene');
            // authors = authors.replace(/ and /g, ', ');

            // Highlight names from our people list
            allPeople.forEach(person => {
                const nameParts = person.name.split(' ');
                const lastName = nameParts[nameParts.length - 1];
                const firstName = nameParts[0];
                
                authors = authors.replace(new RegExp(`${lastName}(,)?\\s*${firstName}`, 'gi'),
                    `<strong>${lastName}$1 ${firstName}</strong>`);
            });

            // Common publication info
            const title = entry.fields.title || 'Unknown Title';
            const venue = entry.fields.booktitle || entry.fields.journal || '';
            const publisher = entry.fields.publisher || '';
            const pages = entry.fields.pages || '';
            const doi = entry.fields.doi || '';
            const url = entry.fields.url || '';
            const year = entry.fields.year || '';

            // Prepare tags HTML if there are tags
            let tagsHTML = '';
            if (entry.tags && entry.tags.length > 0) {
                tagsHTML = `
                    <div class="publication-tags">
                        ${entry.tags.map(tag => `<span class="publication-tag">${tag}</span>`).join(' ')}
                    </div>
                `;
            }

            // Create publication entry
            const entryHTML = `
                <div class="publication-entry featured-publication">
                    <div class="publication-citation">
                        <span class="publication-authors">${authors}</span>.
                        "<span class="publication-title">${title}</span>".
                        ${venue ? `<span class="publication-journal">${venue}</span>.` : ''}
                        ${publisher ? ` ${publisher}.` : ''}
                        ${pages ? ` Pages ${pages}.` : ''}
                        ${year ? ` ${year}.` : ''}
                    </div>
                    ${tagsHTML}
                    <div class="publication-links">
                        ${doi ? `<a href="https://doi.org/${doi}" class="publication-link" target="_blank"><i class="fas fa-external-link-alt"></i> DOI</a>` : ''}
                        ${url ? `<a href="${url}" class="publication-link" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>` : ''}
                        <a href="javascript:void(0)" class="publication-link show-bibtex" data-key="${entry.key}"><i class="fas fa-code"></i> BibTeX</a>
                    </div>
                    <div class="bibtex-content" id="bibtex-${entry.key}">
@${entry.type}{${entry.key},
${Object.entries(entry.fields).map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}
}
                    </div>
                </div>
            `;

            item.innerHTML = entryHTML;
            publicationList.appendChild(item);
        });

        container.appendChild(publicationList);

        // Add event listeners for showing/hiding BibTeX
        setupBibTeXToggles();

    } catch (error) {
        console.error('Error rendering featured publications:', error);
        container.innerHTML = `<p class="no-publications">Failed to load featured publications. Please try again later.</p>`;
    }
}

// Function to setup BibTeX toggle functionality (reuse from publications.js)
function setupBibTeXToggles() {
    document.querySelectorAll('.show-bibtex').forEach(button => {
        button.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            const bibtexElem = document.getElementById(`bibtex-${key}`);
            if (bibtexElem) {
                if (bibtexElem.style.display === 'block') {
                    bibtexElem.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-code"></i> BibTeX';
                } else {
                    bibtexElem.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-times"></i> Hide BibTeX';
                }
            }
        });
    });
}

// Function to render outreach activities
async function renderOutreach() {
    const container = document.getElementById('outreach-content');
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading outreach activities...</p>
        </div>
    `;

    try {
        // Load the YAML data
        const data = await loadYamlData('what-we-do.yaml');
        if (!data || !data.outreach) {
            container.innerHTML = '<p>Outreach content not available at this time.</p>';
            return;
        }

        // Clear loading indicator
        container.innerHTML = '';

        const outreach = data.outreach;

        // Create outreach content with horizontal layout
        const outreachContent = document.createElement('div');
        outreachContent.className = 'outreach-content';

        outreachContent.innerHTML = `
            <div class="outreach-intro">
                <p>${outreach.description}</p>
            </div>
            <div class="outreach-activities">
                ${outreach.activities.map(activity => `
                    <div class="outreach-activity">
                        <div class="activity-icon">
                            <i class="${activity.icon}"></i>
                        </div>
                        <h3>${activity.title}</h3>
                        <p>${activity.description}</p>
                        <a href="${activity.link}" class="learn-more">${activity.link_text} <i class="fas fa-arrow-right"></i></a>
                    </div>
                `).join('')}
            </div>
        `;
        // <div class="impact-metrics">
        //     ${outreach.metrics.map(metric => `
        //         <div class="metric">
        //             <span class="metric-number">${metric.number}</span>
        //             <span class="metric-label">${metric.label}</span>
        //         </div>
        //     `).join('')}
        // </div>

        container.appendChild(outreachContent);
    } catch (error) {
        console.error('Error rendering outreach:', error);
        container.innerHTML = '<p>Failed to load outreach content. Please try again later.</p>';
    }
}

// Function to render resources
async function renderResources() {
    const container = document.getElementById('resources-content');
    if (!container) return;

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading resources...</p>
        </div>
    `;

    try {
        // Load the YAML data
        const data = await loadYamlData('what-we-do.yaml');
        if (!data || !data.resources) {
            container.innerHTML = '<p>Resources not available at this time.</p>';
            return;
        }

        // Clear loading indicator
        container.innerHTML = '';

        const resources = data.resources;

        // Create resources content with horizontal grid layout
        const resourcesContent = document.createElement('div');
        resourcesContent.className = 'resources-content';

        resourcesContent.innerHTML = `
            <div class="resources-intro">
                <p>${resources.description}</p>
            </div>
            <div class="resources-grid">
                ${resources.categories.map(category => `
                    <div class="resource-card">
                        <div class="resource-icon">
                            <i class="${category.icon}"></i>
                        </div>
                        <h3>${category.title}</h3>
                        <p>${category.description}</p>
                        <a href="${category.link}" class="resource-link">${category.link_text} <i class="fas fa-arrow-right"></i></a>
                    </div>
                `).join('')}
            </div>
        `;

        container.appendChild(resourcesContent);
    } catch (error) {
        console.error('Error rendering resources:', error);
        container.innerHTML = '<p>Failed to load resources. Please try again later.</p>';
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

// Initialize the What We Do page
async function initWhatWeDoPage() {
    // Load all content sections
    renderMission();
    renderResearch();
    if (document.getElementById('featured-publications-container')) {
        // Check if publications.js functions are available
        if (typeof loadBibTeXFile === 'function') {
            await renderFeaturedPublications('featured-publications-container', 5);
        } else {
            console.warn('Publications functionality not available - loadBibTeXFile function not found');
        }
    }
    // renderFeaturedPublications();
    // renderOutreach();
    // renderResources();

    // Set up sidebar item click handlers
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Set up scroll spy for sidebar
    window.addEventListener('scroll', handleScrollSpy);
    // Initial check for active section
    setTimeout(handleScrollSpy, 100);
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initWhatWeDoPage);
