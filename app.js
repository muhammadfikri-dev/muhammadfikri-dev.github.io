// Portfolio App Logic for Muhammad Fikri
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    const data = window.PORTFOLIO_DATA || { repositories: [], categories: [] };
    const allRepos = data.repositories || [];
    
    let activeCategory = 'all';
    let searchQuery = '';
    let selectedLanguage = 'all';
    let sortBy = 'featured-first';
    
    const PAGE_SIZE = 18;
    let displayedCount = PAGE_SIZE;

    // Elements
    const featuredGrid = document.getElementById('featuredGrid');
    const reposGrid = document.getElementById('reposGrid');
    const categoryPillsContainer = document.getElementById('categoryPillsContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const languageSelect = document.getElementById('languageSelect');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCount = document.getElementById('resultsCount');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const repoModal = document.getElementById('repoModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalContent = document.getElementById('modalContent');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const themeToggle = document.getElementById('themeToggle');
    const themeIconSun = document.getElementById('themeIconSun');
    const themeIconMoon = document.getElementById('themeIconMoon');

    // --- 1. Theme Management ---
    const savedTheme = localStorage.getItem('mf_theme') || 'dark';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    });

    function setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.body.classList.add('light-theme');
            themeIconSun.classList.remove('hidden');
            themeIconMoon.classList.add('hidden');
            localStorage.setItem('mf_theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            document.body.classList.remove('light-theme');
            themeIconSun.classList.add('hidden');
            themeIconMoon.classList.remove('hidden');
            localStorage.setItem('mf_theme', 'dark');
        }
    }

    // --- 2. Render Featured Projects Spotlight ---
    function renderFeatured() {
        const featuredRepos = allRepos.filter(r => r.isFeatured);
        if (!featuredGrid) return;

        featuredGrid.innerHTML = featuredRepos.slice(0, 6).map(r => `
            <div class="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-semibold">
                            ${r.featuredBadge || 'Sistem Utama'}
                        </span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-xs font-mono border border-slate-800 text-slate-300">
                            <img src="${r.languageIcon}" alt="${r.language}" class="w-3.5 h-3.5 object-contain">
                            <span>${r.language}</span>
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-white group-hover:text-teal-400 transition-colors mb-2">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
                    </h3>
                    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                        ${r.featuredHighlight || r.description}
                    </p>
                </div>
                <div>
                    <div class="flex flex-wrap gap-1 mb-4">
                        ${(r.topics || []).slice(0, 4).map(t => `
                            <span class="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-xs font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>
                    <div class="flex items-center gap-2 pt-3 border-t border-slate-800">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-semibold text-xs text-center border border-teal-500/30 transition-all flex items-center justify-center gap-1.5">
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                            <span>Buka Repositori</span>
                        </a>
                        <button onclick="copyCloneUrl('${r.clone_url}')" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/40 text-xs transition-all" title="Salin Perintah Git Clone">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- 3. Render Category Pills with Real Lucide Icons ---
    function renderCategoryPills() {
        if (!categoryPillsContainer) return;
        const categories = data.categories || [];
        
        categoryPillsContainer.innerHTML = categories.map(cat => {
            const isActive = cat.id === activeCategory;
            return `
                <button data-category="${cat.id}" class="category-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20' 
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }">
                    <i data-lucide="${cat.lucide || 'layers'}" class="w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-teal-400'}"></i>
                    <span>${cat.name}</span>
                    <span class="ml-0.5 opacity-70 font-mono text-[11px]">(${cat.count})</span>
                </button>
            `;
        }).join('');

        // Attach event listeners
        document.querySelectorAll('.category-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCategory = btn.dataset.category;
                displayedCount = PAGE_SIZE;
                renderCategoryPills();
                filterAndRenderRepos();
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    // --- 4. Filter & Sort Repositories ---
    function filterAndRenderRepos() {
        let filtered = allRepos.filter(r => {
            // Category
            if (activeCategory === 'featured' && !r.isFeatured) return false;
            if (activeCategory !== 'all' && activeCategory !== 'featured' && r.categoryId !== activeCategory) return false;

            // Language
            if (selectedLanguage !== 'all') {
                if (r.languageKey !== selectedLanguage && r.language !== selectedLanguage) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = r.name.toLowerCase().includes(q);
                const matchDesc = (r.description || '').toLowerCase().includes(q);
                const matchTopics = (r.topics || []).some(t => t.toLowerCase().includes(q));
                const matchLang = (r.language || '').toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchTopics && !matchLang) return false;
            }

            return true;
        });

        // Sorting
        if (sortBy === 'featured-first') {
            filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || a.name.localeCompare(b.name));
        } else if (sortBy === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortBy === 'recent') {
            filtered.sort((a, b) => (b.pushedAt || '').localeCompare(a.pushedAt || ''));
        }

        resultsCount.textContent = filtered.length;

        const visibleRepos = filtered.slice(0, displayedCount);
        renderRepoCards(visibleRepos);

        if (displayedCount >= filtered.length) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }

        if (window.lucide) lucide.createIcons();
    }

    // --- 5. Render Cards Grid ---
    function renderRepoCards(repos) {
        if (!reposGrid) return;
        
        if (repos.length === 0) {
            reposGrid.innerHTML = `
                <div class="col-span-full py-14 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
                    <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-500 mb-2.5"></i>
                    <h3 class="text-base font-bold text-white">Tidak ada repositori yang sesuai</h3>
                    <p class="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau pilih filter kategori lainnya.</p>
                </div>
            `;
            return;
        }

        reposGrid.innerHTML = repos.map(r => `
            <div class="glass-card rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between group">
                <div>
                    <!-- Top Category & Language SVG -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <i data-lucide="${r.categoryLucide || 'cpu'}" class="w-3.5 h-3.5 text-teal-400"></i>
                            <span>${r.categoryName}</span>
                        </span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                            <img src="${r.languageIcon}" alt="${r.language}" class="w-3 h-3 object-contain">
                            <span>${r.language}</span>
                        </span>
                    </div>

                    <!-- Title -->
                    <h3 class="text-sm sm:text-base font-bold text-white group-hover:text-teal-400 transition-colors mb-2 line-clamp-1" title="${r.name}">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
                    </h3>

                    <!-- Description -->
                    <p class="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2" title="${r.description}">
                        ${r.description}
                    </p>
                </div>

                <div>
                    <!-- Topics Tags -->
                    <div class="flex flex-wrap gap-1 mb-3.5 h-5 overflow-hidden">
                        ${(r.topics || []).slice(0, 3).map(t => `
                            <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>

                    <!-- Footer Actions -->
                    <div class="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        <button onclick="openModal('${r.name}')" class="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 hover:border-teal-500/40 transition-all flex items-center justify-center gap-1.5">
                            <i data-lucide="info" class="w-3.5 h-3.5 text-teal-400"></i>
                            <span>Detail</span>
                        </button>
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-slate-900 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 transition-all" title="Buka di GitHub">
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                        </a>
                        <button onclick="copyCloneUrl('${r.clone_url}')" class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/40 transition-all" title="Salin git clone">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- 6. Event Listeners ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim()) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        displayedCount = PAGE_SIZE;
        filterAndRenderRepos();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        filterAndRenderRepos();
    });

    languageSelect.addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
        displayedCount = PAGE_SIZE;
        filterAndRenderRepos();
    });

    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        filterAndRenderRepos();
    });

    loadMoreBtn.addEventListener('click', () => {
        displayedCount += PAGE_SIZE;
        filterAndRenderRepos();
    });

    // --- 7. Modal System with Tabbed Specifications ---
    window.openModal = function(repoName) {
        const repo = allRepos.find(r => r.name === repoName);
        if (!repo) return;

        modalContent.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-semibold">
                        <i data-lucide="${repo.categoryLucide || 'cpu'}" class="w-3.5 h-3.5"></i>
                        ${repo.categoryName}
                    </span>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                        <img src="${repo.languageIcon}" alt="${repo.language}" class="w-3.5 h-3.5 object-contain">
                        <span>${repo.language}</span>
                    </span>
                </div>
                
                <h3 class="text-xl font-bold text-white">${repo.name}</h3>
                
                <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    ${repo.description}
                </div>

                <div>
                    <div class="text-xs uppercase font-mono text-slate-400 mb-2">Topik & Spesifikasi Protokol:</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${(repo.topics || []).map(t => `
                            <span class="px-2 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="text-xs uppercase font-mono text-slate-400 mb-2">Perintah Kloning Git:</div>
                    <div class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-teal-300">
                        <span class="truncate flex-1">git clone ${repo.clone_url}</span>
                        <button onclick="copyCloneUrl('${repo.clone_url}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors">
                            Salin
                        </button>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <a href="${repo.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2">
                        <i class="devicon-github-original text-base"></i>
                        <span>Buka Repositori di GitHub</span>
                    </a>
                </div>
            </div>
        `;

        repoModal.classList.remove('hidden');
        repoModal.classList.add('flex');
        if (window.lucide) lucide.createIcons();
    };

    closeModalBtn.addEventListener('click', () => {
        repoModal.classList.add('hidden');
        repoModal.classList.remove('flex');
    });

    repoModal.addEventListener('click', (e) => {
        if (e.target === repoModal) {
            repoModal.classList.add('hidden');
            repoModal.classList.remove('flex');
        }
    });

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !repoModal.classList.contains('hidden')) {
            repoModal.classList.add('hidden');
            repoModal.classList.remove('flex');
        }
    });

    // --- 8. Copy to Clipboard ---
    window.copyCloneUrl = function(url) {
        navigator.clipboard.writeText(`git clone ${url}`).then(() => {
            showToast('Perintah git clone berhasil disalin ke clipboard.');
        }).catch(() => {
            showToast('Gagal menyalin otomatis. Silakan salin manual.');
        });
    };

    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
        if (window.lucide) lucide.createIcons();
    }

    // Initial render
    renderFeatured();
    renderCategoryPills();
    filterAndRenderRepos();
});
