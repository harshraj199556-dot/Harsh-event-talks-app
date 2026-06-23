document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseNotes = [];
    let filteredNotes = [];
    let currentFilters = {
        search: '',
        category: 'ALL'
    };

    // DOM Elements
    const feedContainer = document.getElementById('feed-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');
    const searchInput = document.getElementById('search-input');
    const lastUpdatedEl = document.getElementById('last-updated');
    const totalCountEl = document.getElementById('total-count');
    
    // Stats elements
    const featureCountEl = document.getElementById('feature-count');
    const announcementCountEl = document.getElementById('announcement-count');
    const otherCountEl = document.getElementById('other-count');

    // Sidebar pill counts
    const pillCounts = {
        ALL: document.getElementById('count-all'),
        Feature: document.getElementById('count-feature'),
        Announcement: document.getElementById('count-announcement'),
        Changed: document.getElementById('count-changed'),
        Fixed: document.getElementById('count-fixed'),
        Deprecated: document.getElementById('count-deprecated')
    };

    // Modal elements
    const tweetModal = document.getElementById('tweet-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const postTweetBtn = document.getElementById('post-tweet-btn');
    const copyTweetBtn = document.getElementById('copy-tweet-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCountProgress = document.querySelector('.progress-ring__circle');
    const charCountText = document.getElementById('char-count-text');

    // Progress Ring configuration
    const ringRadius = charCountProgress.r.baseVal.value;
    const ringCircumference = ringRadius * 2 * Math.PI;
    charCountProgress.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    charCountProgress.style.strokeDashoffset = ringCircumference;

    // Toast element
    const toastContainer = document.getElementById('toast-container');

    // Toast Notification utility
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = '<svg viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>';
        } else if (type === 'error') {
            icon = '<svg viewBox="0 0 20 20"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/></svg>';
        } else {
            icon = '<svg viewBox="0 0 20 20"><path d="M10 15h2V9h-2v6zm0-8h2V5h-2v2zM10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
        }

        toast.innerHTML = `${icon}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // Clipboard helpers
    function copyTextToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('Copied to clipboard!'))
                .catch(() => showToast('Failed to copy', 'error'));
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('Copied to clipboard!');
            } catch (err) {
                showToast('Failed to copy', 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    // Set SVG progress ring offset based on characters
    function setProgress(percent) {
        const offset = ringCircumference - (percent / 100 * ringCircumference);
        charCountProgress.style.strokeDashoffset = offset;
    }

    // Update Tweet character counter
    function updateCharCount() {
        const text = tweetTextarea.value;
        const count = text.length;
        const remaining = 280 - count;
        
        charCountText.textContent = remaining;
        
        // Progress percentage (cap at 100%)
        const percent = Math.min((count / 280) * 100, 100);
        setProgress(percent);

        // Style counts and ring based on limits
        if (remaining < 0) {
            charCountText.className = 'char-count-text danger';
            charCountProgress.style.stroke = 'var(--color-deprecated)';
            postTweetBtn.disabled = true;
            postTweetBtn.style.opacity = 0.5;
            postTweetBtn.style.cursor = 'not-allowed';
        } else if (remaining <= 20) {
            charCountText.className = 'char-count-text warning';
            charCountProgress.style.stroke = 'var(--color-changed)';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = 1;
            postTweetBtn.style.cursor = 'pointer';
        } else {
            charCountText.className = 'char-count-text';
            charCountProgress.style.stroke = 'var(--twitter-blue)';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = 1;
            postTweetBtn.style.cursor = 'pointer';
        }
    }

    // Open Modal
    function openTweetModal(update) {
        // Generate prefilled tweet
        const tag = update.category.toLowerCase().includes('bug') ? 'Fix' : update.category;
        const categoryHashtag = `#${tag.replace(/\s+/g, '')}`;
        const header = `📢 BigQuery ${categoryHashtag} update: `;
        const link = `\n\nRead more: ${update.link}`;
        
        const availableBodySpace = 280 - header.length - link.length;
        
        let body = update.text;
        if (body.length > availableBodySpace) {
            body = body.substring(0, availableBodySpace - 3) + '...';
        }
        
        tweetTextarea.value = `${header}${body}${link}`;
        updateCharCount();
        tweetModal.classList.add('active');
        tweetTextarea.focus();
    }

    // Close Modal
    function closeTweetModal() {
        tweetModal.classList.remove('active');
    }

    // Event listeners for Modal
    modalCloseBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on click outside content container
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    tweetTextarea.addEventListener('input', updateCharCount);

    // Copy tweet text from modal
    copyTweetBtn.addEventListener('click', () => {
        copyTextToClipboard(tweetTextarea.value);
    });

    // Launch tweet window
    postTweetBtn.addEventListener('click', () => {
        const text = encodeURIComponent(tweetTextarea.value);
        const url = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(url, '_blank');
        closeTweetModal();
        showToast('Opened Twitter composer!');
    });

    // Setup Category Pill filter listeners
    const categoryPillEls = document.querySelectorAll('.category-pill');
    categoryPillEls.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPillEls.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const category = pill.getAttribute('data-category');
            currentFilters.category = category;
            applyFilters();
        });
    });

    // Search input listener
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    // Generate HTML for skeleton loading state
    function renderSkeletons() {
        feedContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            feedContainer.innerHTML += `
                <div class="skeleton-card">
                    <div class="card-header">
                        <div class="card-meta">
                            <div class="skeleton-line skeleton-title"></div>
                            <div class="skeleton-line skeleton-date"></div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="skeleton-line skeleton-para" style="margin-bottom: 8px;"></div>
                        <div class="skeleton-line skeleton-para" style="margin-bottom: 8px;"></div>
                        <div class="skeleton-line skeleton-para short"></div>
                    </div>
                    <div class="skeleton-actions">
                        <div class="skeleton-line skeleton-btn"></div>
                        <div class="skeleton-line skeleton-btn"></div>
                    </div>
                </div>
            `;
        }
    }

    // Render stats metrics
    function updateStats(notes) {
        totalCountEl.textContent = notes.length;
        
        let featureCount = 0;
        let announcementCount = 0;
        let otherCount = 0;

        // Categorize count variables
        let counts = {
            ALL: notes.length,
            Feature: 0,
            Announcement: 0,
            Changed: 0,
            Fixed: 0,
            Deprecated: 0
        };

        notes.forEach(note => {
            const cat = note.category;
            
            // Standardize categories for top widgets
            if (cat === 'Feature') {
                featureCount++;
            } else if (cat === 'Announcement') {
                announcementCount++;
            } else {
                otherCount++;
            }

            // Map exact categories to counts
            if (counts.hasOwnProperty(cat)) {
                counts[cat]++;
            } else if (cat.toLowerCase().includes('fix')) {
                counts['Fixed']++;
            } else if (cat.toLowerCase().includes('change')) {
                counts['Changed']++;
            } else {
                // If it is something else, we don't count it under strict pills unless added
            }
        });

        featureCountEl.textContent = featureCount;
        announcementCountEl.textContent = announcementCount;
        otherCountEl.textContent = otherCount;

        // Update counts in sidebar pills
        Object.keys(pillCounts).forEach(key => {
            if (pillCounts[key]) {
                pillCounts[key].textContent = counts[key];
            }
        });
    }

    // Render the release notes list
    function renderReleaseNotes(notes) {
        feedContainer.innerHTML = '';
        
        if (notes.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 20 20"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-8h2v5H9v-5zm0-3h2v2H9V7z"/></svg>
                    <h3>No updates found</h3>
                    <p>Try refining your search terms or selecting a different category filter.</p>
                </div>
            `;
            return;
        }

        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'update-card';
            card.id = note.id;

            // Map category to CSS class suffix
            let badgeClass = 'badge-general';
            const cat = note.category.toLowerCase();
            
            if (cat.includes('feature')) {
                badgeClass = 'badge-feature';
            } else if (cat.includes('announcement')) {
                badgeClass = 'badge-announcement';
            } else if (cat.includes('change')) {
                badgeClass = 'badge-changed';
            } else if (cat.includes('fix')) {
                badgeClass = 'badge-fixed';
            } else if (cat.includes('deprecat')) {
                badgeClass = 'badge-deprecated';
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-meta">
                        <span class="badge ${badgeClass}">${note.category}</span>
                        <span class="card-date">${note.date}</span>
                    </div>
                </div>
                <div class="card-body">
                    ${note.html}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn btn-copy-link" title="Copy Direct Link">
                        <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                        <span>Link</span>
                    </button>
                    <button class="card-action-btn btn-copy-text" title="Copy Raw Text">
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        <span>Copy</span>
                    </button>
                    <button class="card-action-btn btn-tweet" title="Compose Tweet">
                        <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span>Tweet</span>
                    </button>
                </div>
            `;

            // Attach event listeners to buttons
            card.querySelector('.btn-copy-link').addEventListener('click', () => {
                copyTextToClipboard(note.link);
            });

            card.querySelector('.btn-copy-text').addEventListener('click', () => {
                copyTextToClipboard(note.text);
            });

            card.querySelector('.btn-tweet').addEventListener('click', () => {
                openTweetModal(note);
            });

            feedContainer.appendChild(card);
        });
    }

    // Apply active filters on cached release notes array
    function applyFilters() {
        filteredNotes = releaseNotes.filter(note => {
            // Search filter
            const matchesSearch = note.text.toLowerCase().includes(currentFilters.search) || 
                                  note.category.toLowerCase().includes(currentFilters.search) ||
                                  note.date.toLowerCase().includes(currentFilters.search);
            
            // Category filter
            let matchesCategory = true;
            if (currentFilters.category !== 'ALL') {
                if (currentFilters.category === 'Fixed') {
                    matchesCategory = note.category.toLowerCase().includes('fix');
                } else if (currentFilters.category === 'Changed') {
                    matchesCategory = note.category.toLowerCase().includes('change');
                } else {
                    matchesCategory = note.category === currentFilters.category;
                }
            }
            
            return matchesSearch && matchesCategory;
        });

        renderReleaseNotes(filteredNotes);
    }

    // Fetch details from backend API
    function fetchReleaseNotes(force = false) {
        renderSkeletons();
        
        // Disable refresh button & add spinning animation
        refreshBtn.disabled = true;
        refreshIcon.classList.add('spinner');
        
        let url = '/api/release-notes';
        if (force) {
            url += '?refresh=true';
        }

        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error('API server returned an error');
                }
                return res.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                releaseNotes = data.updates;
                
                // Format relative or local last updated text
                if (data.cached_at) {
                    const cacheDate = new Date(data.cached_at * 1000);
                    lastUpdatedEl.textContent = `Last updated: ${cacheDate.toLocaleTimeString()}`;
                }

                // Update widgets and grid
                updateStats(releaseNotes);
                applyFilters();

                if (force) {
                    showToast('Successfully refreshed release notes!');
                } else if (data.from_cache) {
                    showToast('Loaded notes from cache');
                }
            })
            .catch(err => {
                console.error(err);
                showToast(`Failed to load: ${err.message}`, 'error');
                
                // Render error state in timeline
                feedContainer.innerHTML = `
                    <div class="empty-state" style="border-color: var(--color-deprecated-border)">
                        <svg style="fill: var(--color-deprecated)" viewBox="0 0 20 20"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-8h2v5H9v-5zm0-3h2v2H9V7z"/></svg>
                        <h3>Failed to retrieve release notes</h3>
                        <p style="color: var(--color-deprecated)">${err.message}</p>
                        <button class="btn btn-primary" id="retry-btn" style="margin-top: 16px;">Retry Connection</button>
                    </div>
                `;
                
                const retryBtn = document.getElementById('retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => fetchReleaseNotes(true));
                }
            })
            .finally(() => {
                // Re-enable refresh button
                refreshBtn.disabled = false;
                refreshIcon.classList.remove('spinner');
            });
    }

    // Refresh click handler
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Initial load
    fetchReleaseNotes(false);
});
