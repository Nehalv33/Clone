import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Media query for desktop
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Toggles dark mode
 */
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  const darkModeBtn = document.querySelector('.dark-mode-toggle');
  if (darkModeBtn) {
    darkModeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

/**
 * Initialize dark mode from localStorage
 */
function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

/**
 * Handle search functionality - filters thumbnails
 */
function handleSearch(searchInput) {
  const query = searchInput.value.trim().toLowerCase();
  
  // Get all thumbnail cards
  const thumbnailCards = document.querySelectorAll('.thumbnail-card');
  let visibleCount = 0;
  
  if (!query) {
    // Show all thumbnails if search is empty
    thumbnailCards.forEach(card => {
      card.style.display = '';
    });
    removeNoResultsMessage();
    return;
  }
  
  // Filter thumbnails based on query
  thumbnailCards.forEach(card => {
    const title = card.querySelector('.thumbnail-title')?.textContent.toLowerCase() || '';
    const channel = card.querySelector('.thumbnail-channel')?.textContent.toLowerCase() || '';
    
    if (title.includes(query) || channel.includes(query)) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Show "No results" message if no videos match
  if (visibleCount === 0) {
    showNoResultsMessage(query);
  } else {
    removeNoResultsMessage();
  }
}

/**
 * Show "No videos found" message
 */
function showNoResultsMessage(query) {
  removeNoResultsMessage(); // Remove existing message first
  
  const thumbnailsGrid = document.querySelector('.thumbnails-grid');
  if (!thumbnailsGrid) return;
  
  const noResultsDiv = document.createElement('div');
  noResultsDiv.className = 'no-results-message';
  noResultsDiv.innerHTML = `
    <div class="no-results-content">
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="11" y1="16" x2="11.01" y2="16"></line>
      </svg>
      <h2>No videos found</h2>
      <p>Try different keywords or check your spelling</p>
      <p class="search-query">Searched for: "<strong>${query}</strong>"</p>
    </div>
  `;
  
  thumbnailsGrid.parentElement.insertBefore(noResultsDiv, thumbnailsGrid);
}

/**
 * Remove "No videos found" message
 */
function removeNoResultsMessage() {
  const existingMessage = document.querySelector('.no-results-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

/**
 * Decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Initialize dark mode early
  initDarkMode();

  // Load nav fragment to get logo, avatar, and menu content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  console.log('========================================');
  console.log('FRAGMENT HTML STRUCTURE:');
  console.log('========================================');
  console.log(fragment.innerHTML);
  console.log('========================================');
  
  // Extract logo and avatar (first 2 images)
  const allImages = Array.from(fragment.querySelectorAll('img'));
  console.log('Total images found:', allImages.length);
  
  let logoSrc = '';
  let avatarSrc = '';
  
  if (allImages.length >= 2) {
    logoSrc = allImages[0].src;
    avatarSrc = allImages[1].src;
    console.log('Logo src:', logoSrc);
    console.log('Avatar src:', avatarSrc);
  }
  
  // Extract menu items from fragment
  const menuItems = [];
  
  // Find ALL tables in the fragment
  const allTables = Array.from(fragment.querySelectorAll('table'));
  console.log('Total tables found:', allTables.length);
  
  if (allTables.length > 0) {
    // Process each table
    allTables.forEach((table, tableIndex) => {
      console.log(`\n--- Processing Table ${tableIndex + 1} ---`);
      const rows = Array.from(table.querySelectorAll('tr'));
      console.log(`  Rows in table: ${rows.length}`);
      
      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        console.log(`  Row ${rowIndex}: ${cells.length} cells`);
        
        // Debug: show content of each cell
        cells.forEach((cell, cellIndex) => {
          const hasImg = cell.querySelector('img') ? 'IMG' : '';
          const text = cell.textContent.trim();
          console.log(`    Cell ${cellIndex}: ${hasImg} "${text}"`);
        });
        
        // Try to extract menu item from this row
        if (cells.length >= 2) {
          // Cell 0: Icon
          const iconImg = cells[0].querySelector('img');
          const iconSrc = iconImg ? iconImg.src : '';
          
          // Cell 1: Label
          const label = cells[1].textContent.trim();
          
          // Cell 2: URL (optional)
          let href = '/';
          if (cells.length >= 3) {
            const linkElement = cells[2].querySelector('a');
            if (linkElement) {
              href = linkElement.href;
            } else {
              const urlText = cells[2].textContent.trim();
              // If it's just "/" or a path, use it
              if (urlText && (urlText.startsWith('/') || urlText.startsWith('http'))) {
                href = urlText;
              }
            }
          }
          
          // Check if this row has valid menu item data
          // Skip rows that are likely logo/avatar (first 2 images in entire fragment)
          const isLogoOrAvatar = iconSrc && (iconSrc === logoSrc || iconSrc === avatarSrc);
          
          if (iconSrc && label && !isLogoOrAvatar) {
            menuItems.push({ icon: iconSrc, label, href });
            console.log(`  ✓ Added: ${label} → ${href}`);
          } else {
            console.log(`  ✗ Skipped row ${rowIndex}: icon=${!!iconSrc}, label="${label}", isLogoOrAvatar=${isLogoOrAvatar}`);
          }
        }
      });
    });
  } else {
    console.log('⚠️ No tables found - trying alternative parsing...');
    
    // Alternative: Look for any structure with images after the first 2
    const contentWrapper = fragment.querySelector('.default-content-wrapper');
    if (contentWrapper) {
      console.log('Trying to parse from default-content-wrapper...');
      
      // Get all images, skip first 2 (logo/avatar)
      for (let i = 2; i < allImages.length; i++) {
        const img = allImages[i];
        const iconSrc = img.src;
        
        // Find the parent container
        let container = img.closest('p, div, td, tr');
        if (!container) {
          container = img.parentElement;
        }
        
        console.log(`Image ${i}: Looking for label near`, container?.tagName);
        
        let label = '';
        let href = '/';
        
        // Look for text in the container
        if (container) {
          // Get all text content
          const allText = container.textContent.trim();
          const imgAlt = img.alt || '';
          label = allText.replace(imgAlt, '').trim();
          
          // Look for link
          const link = container.querySelector('a');
          if (link) {
            href = link.href;
            if (!label) {
              label = link.textContent.trim();
            }
          }
          
          // Also check next siblings for label
          if (!label || label === '') {
            let sibling = container.nextElementSibling;
            let attempts = 0;
            while (sibling && attempts < 2) {
              const siblingText = sibling.textContent.trim();
              if (siblingText && siblingText !== '') {
                label = siblingText;
                const siblingLink = sibling.querySelector('a');
                if (siblingLink) {
                  href = siblingLink.href;
                }
                break;
              }
              sibling = sibling.nextElementSibling;
              attempts++;
            }
          }
        }
        
        if (label && iconSrc) {
          menuItems.push({ icon: iconSrc, label, href });
          console.log(`✓ Alternative method added: ${label} → ${href}`);
        }
      }
    }
  }
  
  console.log('\n========================================');
  console.log('FINAL MENU ITEMS:', menuItems.length);
  console.log('========================================');
  menuItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.label} (${item.href})`);
    console.log(`   Icon: ${item.icon}`);
  });
  console.log('========================================\n');
  
  // Generate menu HTML
  const menuHTML = menuItems.length > 0 
    ? menuItems.map(item => `
      <a href="${item.href}" class="menu-item">
        <img src="${item.icon}" alt="${item.label}" class="menu-icon">
        <span class="menu-label">${item.label}</span>
      </a>
    `).join('')
    : `
      <a href="/" class="menu-item">
        <span class="menu-label">Home</span>
      </a>
      <a href="/shorts" class="menu-item">
        <span class="menu-label">Shorts</span>
      </a>
    `;
  
  // Get logo HTML
  const logoHTML = logoSrc 
    ? `<img src="${logoSrc}" alt="VidTube Logo">` 
    : '<span style="font-size: 24px; font-weight: bold; color: #ff0000;">VidTube</span>';
  
  // Get avatar HTML
  const avatarHTML = avatarSrc 
    ? `<img src="${avatarSrc}" alt="Profile">` 
    : '<span class="avatar-letter">U</span>';

  // Clear block and create header structure
  block.textContent = '';
  
  // Create the header wrapper directly in the block (not inside a header tag)
  block.className = 'header-wrapper';
  block.setAttribute('aria-expanded', 'false');
  
  block.innerHTML = `
    <nav class="header-nav">
      <!-- LEFT: Hamburger + Logo -->
      <div class="nav-left">
        <button class="hamburger-menu" aria-label="Toggle menu" aria-expanded="false">
          <span class="hamburger-icon"></span>
        </button>
        <a href="/" class="nav-logo">
          ${logoHTML}
        </a>
      </div>

      <!-- CENTER: Search Bar (Desktop only) -->
      <div class="nav-center">
        <form class="search-form" role="search">
          <input 
            type="search" 
            class="search-input" 
            placeholder="Search..." 
            aria-label="Search"
            autocomplete="off"
          >
          <button type="submit" class="search-button" aria-label="Search">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </form>
      </div>

      <!-- RIGHT: Mobile Search + Dark Mode + Profile -->
      <div class="nav-right">
        <!-- Mobile Search Icon -->
        <button class="mobile-search-icon" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>

        <button class="dark-mode-toggle" aria-label="Toggle dark mode">
          <svg class="icon-light" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="icon-dark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <a href="/profile" class="profile-avatar" aria-label="Profile">
          ${avatarHTML}
        </a>
      </div>
    </nav>

    <!-- MOBILE SEARCH POPUP -->
    <div class="mobile-search-popup">
      <button class="mobile-search-back" aria-label="Close search">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <form class="mobile-search-form" role="search">
        <input 
          type="search" 
          class="mobile-search-input" 
          placeholder="Search..." 
          aria-label="Search"
          autocomplete="off"
        >
        <button type="submit" class="mobile-search-submit" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </form>
    </div>

    <!-- SIDEBAR MENU -->
    <aside class="sidebar-menu">
      <nav class="sidebar-nav">
        ${menuHTML}
      </nav>
    </aside>

    <!-- SIDEBAR OVERLAY (for mobile when expanded) -->
    <div class="sidebar-overlay"></div>
  `;

  // Event Listeners - use block instead of header
  const hamburger = block.querySelector('.hamburger-menu');
  const darkModeToggle = block.querySelector('.dark-mode-toggle');
  const searchForm = block.querySelector('.nav-center .search-form');
  const searchInput = block.querySelector('.nav-center .search-input');
  const sidebarOverlay = block.querySelector('.sidebar-overlay');
  
  // Mobile search elements
  const mobileSearchIcon = block.querySelector('.mobile-search-icon');
  const mobileSearchPopup = block.querySelector('.mobile-search-popup');
  const mobileSearchBack = block.querySelector('.mobile-search-back');
  const mobileSearchForm = block.querySelector('.mobile-search-form');
  const mobileSearchInput = block.querySelector('.mobile-search-input');

  // Hamburger menu toggle
  hamburger.addEventListener('click', () => {
    const isExpanded = block.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    
    block.setAttribute('aria-expanded', String(newState));
    hamburger.setAttribute('aria-expanded', String(newState));
    
    // Only lock body scroll on mobile when expanded
    if (window.innerWidth < 900) {
      document.body.style.overflow = newState ? 'hidden' : '';
    }
  });

  // Sidebar overlay click (close sidebar on mobile)
  sidebarOverlay.addEventListener('click', () => {
    block.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });

  // Dark mode toggle
  darkModeToggle.addEventListener('click', toggleDarkMode);

  // Desktop search form submission
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch(searchInput);
    });
  }

  // Real-time desktop search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      handleSearch(searchInput);
    });
  }

  // Mobile search icon - open popup
  if (mobileSearchIcon) {
    mobileSearchIcon.addEventListener('click', () => {
      mobileSearchPopup.classList.add('active');
      mobileSearchInput.focus();
    });
  }

  // Mobile search back button - close popup
  if (mobileSearchBack) {
    mobileSearchBack.addEventListener('click', () => {
      mobileSearchPopup.classList.remove('active');
      mobileSearchInput.value = '';
      // Reset search results
      const thumbnailCards = document.querySelectorAll('.thumbnail-card');
      thumbnailCards.forEach(card => {
        card.style.display = '';
      });
      removeNoResultsMessage();
    });
  }

  // Mobile search form submission
  if (mobileSearchForm) {
    mobileSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch(mobileSearchInput);
    });
  }

  // Real-time mobile search
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', () => {
      handleSearch(mobileSearchInput);
    });
  }

  // Close sidebar on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close mobile search popup
      if (mobileSearchPopup.classList.contains('active')) {
        mobileSearchPopup.classList.remove('active');
        mobileSearchInput.value = '';
        const thumbnailCards = document.querySelectorAll('.thumbnail-card');
        thumbnailCards.forEach(card => {
          card.style.display = '';
        });
        removeNoResultsMessage();
      }
      
      // Close sidebar
      if (block.getAttribute('aria-expanded') === 'true') {
        block.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-expanded', 'false');
        if (window.innerWidth < 900) {
          document.body.style.overflow = '';
        }
      }
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) {
      document.body.style.overflow = '';
      sidebarOverlay.style.display = 'none';
      // Close mobile search on desktop
      mobileSearchPopup.classList.remove('active');
    } else {
      sidebarOverlay.style.display = '';
    }
  });
}