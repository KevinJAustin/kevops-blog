// Client-side search functionality
class SearchEngine {
    constructor() {
        this.searchIndex = [];
        this.searchInput = null;
        this.searchResults = null;
        this.isSearchVisible = false;
        this.init();
    }

    async init() {
        await this.loadSearchIndex();
        this.createSearchInterface();
        this.bindEvents();
    }

    async loadSearchIndex() {
        try {
            const response = await fetch('./search.json');
            this.searchIndex = await response.json();
            console.log('Search index loaded:', this.searchIndex.length, 'entries');
        } catch (error) {
            console.error('Failed to load search index:', error);
        }
    }

    createSearchInterface() {
        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-overlay">
                <div class="search-modal">
                    <div class="search-header">
                        <input type="text" class="search-input" placeholder="Search articles..." autocomplete="off">
                        <button class="search-close">&times;</button>
                    </div>
                    <div class="search-results"></div>
                </div>
            </div>
        `;

        document.body.appendChild(searchContainer);

        // Get references
        this.searchInput = searchContainer.querySelector('.search-input');
        this.searchResults = searchContainer.querySelector('.search-results');
        this.searchOverlay = searchContainer.querySelector('.search-overlay');
        this.searchClose = searchContainer.querySelector('.search-close');

        // Create search trigger button
        this.createSearchTrigger();
    }

    createSearchTrigger() {
        // Add search button to navigation or header
        const nav = document.querySelector('.gh-head-menu') || document.querySelector('nav') || document.querySelector('header');
        if (nav) {
            const searchTrigger = document.createElement('button');
            searchTrigger.className = 'search-trigger';
            searchTrigger.innerHTML = '🔍 Search';
            searchTrigger.setAttribute('aria-label', 'Open search');
            nav.appendChild(searchTrigger);

            searchTrigger.addEventListener('click', () => this.openSearch());
        }

        // Add keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    bindEvents() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // Close search
        this.searchClose.addEventListener('click', () => this.closeSearch());
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.closeSearch();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSearchVisible) {
                this.closeSearch();
            }
        });
    }

    openSearch() {
        this.searchOverlay.style.display = 'flex';
        this.isSearchVisible = true;
        this.searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    closeSearch() {
        this.searchOverlay.style.display = 'none';
        this.isSearchVisible = false;
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        document.body.style.overflow = '';
    }

    performSearch(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            return;
        }

        const results = this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.content} ${item.excerpt} ${item.tags?.join(' ') || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        this.displayResults(results, query);
    }

    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        const resultsHTML = results.map(result => {
            const highlightedTitle = this.highlightText(result.title, query);
            const highlightedExcerpt = this.highlightText(result.excerpt || '', query);
            
            return `
                <div class="search-result">
                    <h3><a href="${result.url}">${highlightedTitle}</a></h3>
                    <p>${highlightedExcerpt}</p>
                    ${result.tags && result.tags.length > 0 ? `<div class="search-tags">${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    ${result.date ? `<time class="search-date">${new Date(result.date).toLocaleDateString()}</time>` : ''}
                </div>
            `;
        }).join('');

        this.searchResults.innerHTML = resultsHTML;
    }

    highlightText(text, query) {
        if (!query.trim()) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SearchEngine());
} else {
    new SearchEngine();
}