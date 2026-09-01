// Portfolio App Logic for Muhammad Fikri
document.addEventListener('DOMContentLoaded', () => {
    // Check Lucide
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
            <div class="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-semibold">
                            ${r.featuredBadge || '🏆 Flagship'}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[11px] font-mono ${getLangClass(r.language)}">
                            ${r.language}
                        </span>
                    </div>
                    <h3 class="text-xl font-bold text-white group-hover:text-teal-400 transition-colors mb-2">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
                    </h3>
                    <p class="text-sm text-slate-300 leading-relaxed mb-4">
                        ${r.featuredHighlight || r.description}
                    </p>
                </div>
                <div>
                    <div class="flex flex-wrap gap-1.5 mb-5">
                        ${(r.topics || []).slice(0, 4).map(t => `
                            <span class="px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-400 text-xs font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>
                    <div class="flex items-center gap-2 pt-4 border-t border-slate-800/80">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-semibold text-xs text-center border border-teal-500/30 transition-all">
                            Buka di GitHub
                        </a>
                        <button onclick="copyCloneUrl('${r.clone_url}')" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/40 text-xs transition-all" title="Salin git clone">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- 3. Render Category Pills ---
    function renderCategoryPills() {
        if (!categoryPillsContainer) return;
        const categories = data.categories || [];
        
        categoryPillsContainer.innerHTML = categories.map(cat => {
            const isActive = cat.id === activeCategory;
            return `
                <button data-category="${cat.id}" class="category-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20' 
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }">
                    ${cat.name} <span class="ml-1 opacity-70 font-mono">(${cat.count})</span>
                </button>
            `;
        }).join('');

        // Attach listeners
        document.querySelectorAll('.category-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCategory = btn.dataset.category;
                displayedCount = PAGE_SIZE;
                renderCategoryPills();
                filterAndRenderRepos();
            });
        });
    }

    // --- 4. Filtering & Sorting Repositories ---
    function filterAndRenderRepos() {
        let filtered = allRepos.filter(r => {
            // Category Filter
            if (activeCategory === 'featured' && !r.isFeatured) return false;
            if (activeCategory !== 'all' && activeCategory !== 'featured' && r.categoryId !== activeCategory) return false;

            // Language Filter
            if (selectedLanguage !== 'all') {
                if (selectedLanguage === 'C++' && !r.language.includes('C++')) return false;
                else if (selectedLanguage !== 'C++' && r.language !== selectedLanguage) return false;
            }

            // Search Query Filter
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

        // Update count
        resultsCount.textContent = filtered.length;

        // Render Slice
        const visibleRepos = filtered.slice(0, displayedCount);
        renderRepoCards(visibleRepos);

        // Load More button visibility
        if (displayedCount >= filtered.length) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // --- 5. Render Cards ---
    function renderRepoCards(repos) {
        if (!reposGrid) return;
        
        if (repos.length === 0) {
            reposGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
                    <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-500 mb-3"></i>
                    <h3 class="text-lg font-bold text-white">Tidak ada repositori yang cocok</h3>
                    <p class="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</p>
                </div>
            `;
            return;
        }

        reposGrid.innerHTML = repos.map(r => `
            <div class="glass-card rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between group">
                <div>
                    <!-- Top Category & Lang -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${r.isFeatured ? 'bg-amber-400' : 'bg-teal-400'}"></span>
                            ${r.categoryName}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[11px] font-mono ${getLangClass(r.language)}">
                            ${r.language}
                        </span>
                    </div>

                    <!-- Title -->
                    <h3 class="text-base font-bold text-white group-hover:text-teal-400 transition-colors mb-2 line-clamp-1" title="${r.name}">
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
                    </h3>

                    <!-- Description -->
                    <p class="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2" title="${r.description}">
                        ${r.description}
                    </p>
                </div>

                <div>
                    <!-- Topics Tags -->
                    <div class="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                        ${(r.topics || []).slice(0, 3).map(t => `
                            <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>

                    <!-- Footer Actions -->
                    <div class="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        <button onclick="openModal('${r.name}')" class="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 hover:border-teal-500/40 transition-all flex items-center justify-center gap-1">
                            <i data-lucide="info" class="w-3.5 h-3.5"></i>
                            <span>Detail</span>
                        </button>
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-slate-900 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 transition-all" title="Buka di GitHub">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </a>
                        <button onclick="copyCloneUrl('${r.clone_url}')" class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-teal-500/40 transition-all" title="Salin git clone">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- Helper: Language Class ---
    function getLangClass(lang) {
        if (!lang) return 'bg-slate-800 text-slate-400';
        if (lang.includes('C++')) return 'lang-badge-cpp';
        if (lang.includes('Python')) return 'lang-badge-python';
        if (lang.includes('Shell')) return 'lang-badge-shell';
        if (lang.includes('C')) return 'lang-badge-c';
        if (lang.includes('PowerShell')) return 'lang-badge-powershell';
        if (lang.includes('JavaScript')) return 'lang-badge-javascript';
        return 'lang-badge-docker';
    }

    // --- 6. Event Listeners for Filters ---
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

    // --- 7. Modal System ---
    window.openModal = function(repoName) {
        const repo = allRepos.find(r => r.name === repoName);
        if (!repo) return;

        modalContent.innerHTML = `
            <div class="space-y-5">
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-semibold">
                        ${repo.categoryName}
                    </span>
                    <span class="px-2.5 py-0.5 rounded text-xs font-mono ${getLangClass(repo.language)}">
                        ${repo.language}
                    </span>
                </div>
                
                <h3 class="text-2xl font-bold text-white">${repo.name}</h3>
                
                <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed">
                    ${repo.description}
                </div>

                <div>
                    <div class="text-xs uppercase font-mono text-slate-400 mb-2">Topik & Kata Kunci:</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${(repo.topics || []).map(t => `
                            <span class="px-2 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono border border-slate-800">#${t}</span>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="text-xs uppercase font-mono text-slate-400 mb-2">Instruksi Git Clone:</div>
                    <div class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-teal-300">
                        <span class="truncate flex-1">git clone ${repo.clone_url}</span>
                        <button onclick="copyCloneUrl('${repo.clone_url}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors" title="Salin perintah">
                            Salin
                        </button>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <a href="${repo.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm text-center transition-all flex items-center justify-center gap-2">
                        <i data-lucide="github" class="w-4 h-4"></i>
                        <span>Buka Repository di GitHub</span>
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

    // --- 8. Copy to Clipboard & Toast ---
    window.copyCloneUrl = function(url) {
        navigator.clipboard.writeText(`git clone ${url}`).then(() => {
            showToast('Perintah git clone berhasil disalin ke clipboard!');
        }).catch(() => {
            showToast('Gagal menyalin otomatis. Silakan salin manual.');
        });
    };

    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
        if (window.lucide) lucide.createIcons();
    }

    // --- Initial Render ---
    renderFeatured();
    renderCategoryPills();
    filterAndRenderRepos();
});
