// Load YAML data and store cache
const dataCache = {
    people: null,
    artifacts: null
};

// Function to fetch and parse YAML data with caching
async function loadYamlData(fileName) {
    const cacheKey = fileName.replace('.yaml', '').replace('content/', '');
    
    // Return cached data if available
    if (dataCache[cacheKey]) {
        return dataCache[cacheKey];
    }

    try {
        const response = await fetch(`content/${fileName}`);
        if (!response.ok) {
            console.error(`Failed to load YAML file: ${fileName}`, response.statusText);
            return null;
        }
        
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        
        // Store in cache
        dataCache[cacheKey] = data;
        return data;
    } catch (e) {
        console.error(`Error loading or parsing YAML file: ${fileName}`, e);
        return null;
    }
}

// Function to process image paths
function getImagePath(imagePath, defaultImage = 'content/people/images/pic_placeholder.jpg') {
    if (!imagePath) return defaultImage;

    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Handle various path formats
    if (imagePath.startsWith('/')) {
        return imagePath.substring(1);
    } else if (imagePath.startsWith('content/')) {
        return imagePath;
    } else if (imagePath.startsWith('images/')) {
        return imagePath;
    } else if (imagePath.startsWith('researcher-')) {
        // For featured faculty images that start with researcher-
        return `images/${imagePath}`;
    } else if (imagePath.startsWith('artifacts/')) {
        return `content/images/${imagePath}`;
    } else {
        // For images that already include the images/ prefix in people.yaml
        return imagePath;
    }
}

// Function to parse BibTeX files
async function parseBibTeX(bibText) {
    const entries = [];
    let currentEntry = null;
    let currentField = null;
    let bracketCount = 0;
    let fieldContent = '';


    // Split the file into lines for easier processing
    const lines = bibText.split('\n');

    for (const line of lines) {
        // Skip empty lines
        if (line.trim() === '') continue;

        // Start of a new entry
        if (line.trim().startsWith('@')) {
            if (currentEntry) {
                // Save the previous entry if it exists
                entries.push(currentEntry);
            }

            // Extract the entry type and key
            const match = line.match(/@(\w+)\s*{\s*([^,]+),/);
            if (match) {
                currentEntry = {
                    type: match[1].toLowerCase(),
                    key: match[2],
                    fields: {},
                    tags: [],
                    featured: false
                };
                currentField = null;
                fieldContent = '';
                bracketCount = 0;
            }
            continue;
        }

        // End of an entry
        if (line.trim() === '}' && bracketCount === 0) {
            if (currentField && fieldContent) {
                currentEntry.fields[currentField] = fieldContent.trim();
            }
            // Save the last entry
            if (currentEntry) {
                entries.push(currentEntry);
                currentEntry = null;
            }
            continue;
        }

        // Process field
        if (currentEntry) {
            // Check if this line defines a new field
            const fieldMatch = line.match(/^\s*(\w+)\s*=\s*{(.*)$/);
            if (fieldMatch && bracketCount === 0) {
                // Save the previous field if it exists
                if (currentField && fieldContent) {
                    currentEntry.fields[currentField] = fieldContent.trim();
                    
                    // Process keywords field to extract tags
                    if (currentField === 'keywords') {
                        const keywordsStr = fieldContent.trim();
                        const keywords = keywordsStr
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k.length > 0);
                        currentEntry.tags = keywords;
                    }
                    
                    // Process featured field
                    if (currentField === 'featured') {
                        const featuredValue = fieldContent.trim().toLowerCase();
                        currentEntry.featured = featuredValue === 'true';
                    }
                }

                // Start a new field
                currentField = fieldMatch[1].toLowerCase();
                fieldContent = fieldMatch[2];

                // Count opening brackets
                bracketCount = (fieldContent.match(/{/g) || []).length;
                bracketCount -= (fieldContent.match(/}/g) || []).length;

                // Check if the field ends on the same line
                if (fieldContent.endsWith('},') || fieldContent.endsWith('}')) {
                    fieldContent = fieldContent.replace(/},?$/, '');
                    currentEntry.fields[currentField] = fieldContent.trim();
                    
                    // Process keywords field to extract tags
                    if (currentField === 'keywords') {
                        const keywordsStr = fieldContent.trim();
                        const keywords = keywordsStr
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k.length > 0);
                        currentEntry.tags = keywords;
                    }
                    
                    // Process featured field
                    if (currentField === 'featured') {
                        const featuredValue = fieldContent.trim().toLowerCase();
                        currentEntry.featured = featuredValue === 'true';
                    }
                    
                    currentField = null;
                    fieldContent = '';
                    bracketCount = 0;
                }
            } else if (currentField) {
                // Continue the current field
                fieldContent += ' ' + line.trim();

                // Update bracket count
                bracketCount += (line.match(/{/g) || []).length;
                bracketCount -= (line.match(/}/g) || []).length;

                // Check if the field ends on this line
                if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
                    fieldContent = fieldContent.replace(/},?$/, '');
                    currentEntry.fields[currentField] = fieldContent.trim();
                    
                    // Process keywords field to extract tags
                    if (currentField === 'keywords') {
                        const keywordsStr = fieldContent.trim();
                        const keywords = keywordsStr
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k.length > 0);
                        currentEntry.tags = keywords;
                    }
                    
                    // Process featured field
                    if (currentField === 'featured') {
                        const featuredValue = fieldContent.trim().toLowerCase();
                        currentEntry.featured = featuredValue === 'true';
                    }
                    
                    currentField = null;
                    fieldContent = '';
                    bracketCount = 0;
                }
            }
        }
    }

    // Add the last entry if it wasn't already added
    if (currentEntry) {
        if (currentField && fieldContent) {
            currentEntry.fields[currentField] = fieldContent.trim();
            
            // Process keywords field to extract tags
            if (currentField === 'keywords') {
                const keywordsStr = fieldContent.trim();
                const keywords = keywordsStr
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
                currentEntry.tags = keywords;
            }
            
            // Process featured field
            if (currentField === 'featured') {
                const featuredValue = fieldContent.trim().toLowerCase();
                currentEntry.featured = featuredValue === 'true';
            }
        }
        entries.push(currentEntry);
    }

    return entries;
}

// Function to fetch and parse a BibTeX file
async function loadBibTeXFile(personName) {
    // The personName is directly used as the filename
    const fileName = `${personName}.bib`;

    try {
        const response = await fetch(`content/people/bibs/${encodeURIComponent(fileName)}`);
        if (!response.ok) {
            console.error(`Failed to load BibTeX file: ${fileName}`, response.statusText);
            return [];
        }

        const bibText = await response.text();
        return await parseBibTeX(bibText);
    } catch (e) {
        console.error(`Error loading or parsing BibTeX file: ${fileName}`, e);
        return [];
    }
}

// Function to search publications
function searchPublications() {
    const searchText = document.getElementById('publication-search')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('year-filter')?.value || 'all';
    const topicFilter = document.getElementById('topic-filter')?.value || 'all';

    const publicationItems = document.querySelectorAll('.publication-item');
    const yearSections = document.querySelectorAll('.publication-year');

    // Apply filters
    publicationItems.forEach(item => {
        const itemText = item.textContent.toLowerCase();
        const itemYear = item.closest('.publication-year')?.querySelector('h3')?.textContent || '';
        const itemTopics = item.dataset.topics ? item.dataset.topics.split(',') : [];

        // Check if the item matches all filters
        const matchesSearch = !searchText || itemText.includes(searchText);
        const matchesYear = yearFilter === 'all' || itemYear === yearFilter;
        const matchesTopic = topicFilter === 'all' ||
                            (itemTopics.length > 0 && itemTopics.includes(topicFilter));

        // Show or hide based on filters
        item.style.display = (matchesSearch && matchesYear && matchesTopic) ? 'block' : 'none';
    });

    // Hide year sections with no visible items
    yearSections.forEach(section => {
        const visibleItems = section.querySelectorAll('.publication-item[style="display: block"]');
        section.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });
}

// Function to populate topic filter options from publication tags
function populateTopicFilterOptions() {
    const topicFilter = document.getElementById('topic-filter');
    if (!topicFilter) return;
    
    // Get all unique tags from publications
    const tags = new Set();
    document.querySelectorAll('.publication-item').forEach(item => {
        if (item.dataset.topics) {
            const itemTopics = item.dataset.topics.split(',');
            itemTopics.forEach(topic => tags.add(topic.trim()));
        }
    });
    
    // Sort tags alphabetically
    const sortedTags = Array.from(tags).sort();
    
    // Clear existing options except 'all'
    while (topicFilter.options.length > 1) {
        topicFilter.remove(1);
    }
    
    // Add tags as options
    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag.charAt(0).toUpperCase() + tag.slice(1); // Capitalize first letter
        topicFilter.appendChild(option);
    });
}

// Export publications as BibTeX
async function exportBibTeX() {
    try {
        // Fetch the raw BibTeX file
        const response = await fetch('content/people/bibs/Eugene Bagdasarian.bib');
        if (!response.ok) {
            throw new Error(`Failed to load BibTeX file: ${response.statusText}`);
        }

        const bibtexContent = await response.text();

        // Download as file
        const blob = new Blob([bibtexContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'publications.bib';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting BibTeX:', error);
        alert('Failed to export BibTeX file. Please try again later.');
    }
}

/**
 * Renders the navigation bar from global.yaml data.
 * @param {Array<object>} navItems - The navigation items data from global.yaml.
 */
function renderNavbar(navItems) {
    const mainMenu = document.querySelector('.main-menu');
    if (!mainMenu) return;

    mainMenu.innerHTML = navItems.map(item => `
        <li class="dropdown">
            <a href="${item.href}">${item.name}</a>
            ${item.dropdown ? `
                <div class="dropdown-content ${item.dropdown.length > 4 ? 'wider-dropdown' : ''}">
                    ${item.dropdown.map(subItem => `
                        <a href="${subItem.href}" onclick="activateTab('${subItem.sectionId}'); return true;">${subItem.name}</a>
                    `).join('')}
                </div>
            ` : ''}
        </li>
    `).join('');

    // Re-initialize mobile dropdown functionality after rendering
    initializeMobileDropdowns();
}

/**
 * Renders the footer from global.yaml data.
 * @param {object} footerData - The footer data from global.yaml.
 */
function renderFooter(footerData) {
    const footerLinksContainer = document.querySelector('.footer-links');
    const footerSocialContainer = document.querySelector('.footer-social');
    const footerBottomContainer = document.querySelector('.footer-bottom');

    // Render footer columns
    if (footerLinksContainer && footerData.columns) {
        footerLinksContainer.innerHTML = footerData.columns.map(column => `
            <div class="footer-column">
                <h4>${column.title}</h4>
                <ul>
                    ${column.links.map(link => `<li><a href="${link.href}">${link.name}</a></li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    // Render social media links
    if (footerSocialContainer && footerData.socials && footerData.socials.length > 0) {
        footerSocialContainer.innerHTML = footerData.socials.map(social => `
            <a href="${social.href}" aria-label="${social.name}"><i class="${social.icon}"></i></a>
        `).join('');
    }

    // Render footer bottom content
    if (footerBottomContainer && footerData.copyright && footerData.legal) {
        footerBottomContainer.innerHTML = `
            <p>${footerData.copyright}</p>
            <div class="footer-legal">
                ${footerData.legal.map(link => `<a href="${link.href}">${link.name}</a>`).join('')}
            </div>
        `;
    }
}

/**
 * Initializes mobile dropdown functionality for the dynamically loaded navigation.
 */
function initializeMobileDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    // Add click event for mobile devices
    if (window.innerWidth <= 768) {
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', function (e) {
                const dropdownContent = this.querySelector('.dropdown-content');
                
                // Determine if the click was on a link within the dropdown content
                let clickedOnSubmenuLink = false;
                if (dropdownContent) {
                    const linksInDropdown = dropdownContent.querySelectorAll('a');
                    for (const link of linksInDropdown) {
                        if (link.contains(e.target)) {
                            clickedOnSubmenuLink = true;
                            break;
                        }
                    }
                }

                if (clickedOnSubmenuLink) {
                    // If click is on a submenu link, allow default navigation
                    return;
                }

                // Toggle the dropdown for main navigation items
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                }
                e.preventDefault();
            });
        });
    }
}

/**
 * Loads and renders global content (navbar, footer) from global.yaml.
 */
async function loadGlobalContent() {
    try {
        const data = await loadYamlData('global.yaml');
        if (!data) {
            console.error('Global content data not found');
            return;
        }

        // Render navigation if data exists
        if (data.navigation) {
            renderNavbar(data.navigation);
        }

        // Render footer if data exists
        if (data.footer) {
            renderFooter(data.footer);
        }

        console.log('Global content loaded successfully');
    } catch (error) {
        console.error('Error loading global content:', error);
    }
}

// Initialize global content loading when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadGlobalContent();
});