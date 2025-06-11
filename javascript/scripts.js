document.addEventListener('DOMContentLoaded', function () {
    // Hero Slider Functionality
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;

    // Set first slide as current
    if (slides.length > 0) {
        slides[0].classList.add('current');
    }

    // Function to change slide
    function changeSlide(direction) {
        if (slides.length === 0) return;

        // Remove current class from current slide
        slides[currentSlide].classList.remove('current');

        // Calculate new slide index
        if (direction === 'next') {
            currentSlide = (currentSlide + 1) % slides.length;
        } else {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        }

        // Add current class to new slide
        slides[currentSlide].classList.add('current');
    }

    // Event listeners for buttons
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => changeSlide('prev'));
        nextBtn.addEventListener('click', () => changeSlide('next'));
    }

    // Auto slide change every 5 seconds
    if (slides.length > 0) {
        setInterval(() => changeSlide('next'), 5000);
    }

    // Dropdown menu for mobile
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
                    // If click is on a submenu link, allow default navigation.
                    // Optionally, hide the dropdown after a selection.
                    if (dropdownContent && dropdownContent.classList.contains('show')) {
                        // dropdownContent.classList.remove('show'); // Uncomment for auto-close
                    }
                    return; // Do not prevent default, do not toggle again.
                }

                // If the click was not on a submenu link (i.e., on the main toggle item or its padding):
                // Toggle the dropdown.
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                }
                // Prevent default action for the main toggle link.
                // This assumes the main link of a dropdown (e.g., "RESEARCH") should only toggle on mobile.
                e.preventDefault();
            });
        });
    }

    // Sidebar Navigation Functionality
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const sections = document.querySelectorAll('.content-section');

    if (sidebarItems.length > 0 && sections.length > 0) {
        // Function to activate sidebar item
        function activateSidebarItem(sectionId) {
            // Remove active class from all sidebar items
            sidebarItems.forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to current section's sidebar item
            const activeItem = document.querySelector(`.sidebar-item[data-section="${sectionId.replace('#', '')}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        // Handle click on sidebar items
        sidebarItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault(); // Prevent default action first

                const sectionId = this.querySelector('a').getAttribute('href');
                const section = document.querySelector(sectionId);

                console.log('Sidebar item clicked:', sectionId); // Debug log

                if (section) {
                    // Activate the clicked sidebar item
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');

                    // Smooth scroll to section
                    window.scrollTo({
                        top: section.offsetTop - 100,
                        behavior: 'smooth'
                    });

                    // Update URL hash without scrolling
                    if (history.pushState) {
                        history.pushState(null, null, sectionId);
                    }
                }
            });
        });

        // Handle scroll to update active sidebar item
        window.addEventListener('scroll', function () {
            let current = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 200; // Adjust threshold
                const sectionHeight = section.offsetHeight;

                if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                    current = '#' + section.getAttribute('id');
                }
            });

            if (current) {
                activateSidebarItem(current);
            }
        });
    }

    // Handle initial page load with hash in URL
    if (window.location.hash) {
        const hash = window.location.hash;
        const section = document.querySelector(hash);

        if (section) {
            setTimeout(() => {
                window.scrollTo({
                    top: section.offsetTop - 100,
                    behavior: 'smooth'
                });

                // If we have sidebar navigation on this page
                const sidebarItem = document.querySelector(`.sidebar-item[data-section="${hash.substring(1)}"]`);
                if (sidebarItem) {
                    document.querySelectorAll('.sidebar-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    sidebarItem.classList.add('active');
                }
            }, 100);
        }
    }

    // Make activateTab function globally available for dropdown navigation
    window.activateTab = function (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            setTimeout(() => {
                window.scrollTo({
                    top: section.offsetTop - 100,
                    behavior: 'smooth'
                });

                // If we have sidebar navigation
                const sidebarItem = document.querySelector(`.sidebar-item[data-section="${sectionId}"]`);
                if (sidebarItem) {
                    document.querySelectorAll('.sidebar-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    sidebarItem.classList.add('active');
                }
            }, 10);
        }
    };
});