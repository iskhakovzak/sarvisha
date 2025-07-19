// ===== MAIN APPLICATION FILE =====

class PortfolioApp {
    constructor() {
        this.currentLanguage = CONFIG.app.defaultLanguage;
        this.currentTheme = CONFIG.app.defaultTheme;
        this.isInitialized = false;
        this.modules = {};
        this.state = {
            isLoading: true,
            isScrolling: false,
            isMenuOpen: false,
            currentSection: 'hero'
        };
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize core modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            // Start the application
            this.start();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleError(error);
        }
    }

    async initializeModules() {
        // Wait for external libraries
        await this.waitForLibraries();
        
        // Initialize core modules
        this.modules.smoothScroll = new SmoothScrollModule();
        this.modules.cursor = new CursorModule();
        this.modules.animations = new AnimationsModule();
        this.modules.language = new LanguageModule();
        this.modules.theme = new ThemeModule();
        this.modules.portfolio = new PortfolioModule();
        this.modules.navigation = new NavigationModule();
        this.modules.accessibility = new AccessibilityModule();
        
        // Initialize modules
        for (const [name, module] of Object.entries(this.modules)) {
            if (module && typeof module.init === 'function') {
                await module.init();
            }
        }
    }

    async waitForLibraries() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            const checkLibraries = () => {
                attempts++;
                if (typeof gsap !== 'undefined' && typeof Lenis !== 'undefined' && typeof SplitType !== 'undefined') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Libraries failed to load'));
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            
            checkLibraries();
        });
    }

    setupEventListeners() {
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Navigation events
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Intersection Observer for sections
        this.setupIntersectionObserver();
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
    }

    initializeUI() {
        // Set initial theme
        this.modules.theme.setTheme(this.currentTheme);
        
        // Set initial language
        this.modules.language.setLanguage(this.currentLanguage);
        
        // Initialize navigation
        this.modules.navigation.init();
        
        // Setup portfolio
        this.modules.portfolio.init();
        
        // Update year in footer
        document.getElementById('year').textContent = new Date().getFullYear();
    }

    start() {
        // Run intro animation immediately
        this.runIntroAnimation();
        
        // Mark as initialized
        this.isInitialized = true;
        
        // Dispatch custom event
        this.dispatchEvent('app:ready');
        
        console.log('Portfolio app initialized successfully');
    }



    async runIntroAnimation() {
        try {
            const heroTitle = document.querySelector('.hero-title');
            const heroImage = document.querySelector('.hero-image');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            
            if (!heroTitle || !heroImage) return;
            
            // Split text for animation
            const heroTitleLines = new SplitType(heroTitle, { types: 'lines' });
            const heroSubtitleLines = new SplitType(heroSubtitle, { types: 'lines' });
            
            // Set initial states
            gsap.set(heroTitleLines.lines, { y: '100%' });
            gsap.set(heroSubtitleLines.lines, { y: '100%' });
            gsap.set(heroImage, { scale: 1.25, opacity: 0 });
            
            // Create timeline
            const tl = gsap.timeline({ delay: 0.5 });
            
            tl.to(heroImage, {
                scale: 1,
                opacity: 1,
                duration: 2,
                ease: 'power3.out'
            })
            .to(heroTitleLines.lines, {
                y: 0,
                duration: 1.5,
                ease: 'power3.out',
                stagger: 0.1
            }, '-=1.5')
            .to(heroSubtitleLines.lines, {
                y: 0,
                duration: 1,
                ease: 'power3.out',
                stagger: 0.05
            }, '-=1');
            
        } catch (error) {
            console.warn('Intro animation failed:', error);
        }
    }

    setupIntersectionObserver() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.state.currentSection = sectionId;
                    
                    // Update navigation
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                    
                    // Dispatch event
                    this.dispatchEvent('section:visible', { sectionId });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-20% 0px -20% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }

    setupPerformanceMonitoring() {
        // Monitor performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                    }
                }, 0);
            });
        }
    }

    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.dispatchEvent('window:resize');
            
            // Update cursor for mobile
            if (window.innerWidth <= CONFIG.breakpoints.tablet) {
                this.modules.cursor?.disable();
            } else {
                this.modules.cursor?.enable();
            }
        }, 250);
    }

    handleScroll() {
        if (!this.state.isScrolling) {
            this.state.isScrolling = true;
            requestAnimationFrame(() => {
                this.state.isScrolling = false;
            });
        }
    }

    handleGlobalClick(event) {
        // Handle mobile menu toggle
        if (event.target.closest('#menu-toggle')) {
            this.toggleMobileMenu();
        }
        
        // Handle back to top
        if (event.target.closest('#back-to-top')) {
            event.preventDefault();
            this.scrollToTop();
        }
        
        // Handle portfolio item clicks
        if (event.target.closest('.portfolio-item')) {
            const item = event.target.closest('.portfolio-item');
            this.openPortfolioModal(item);
        }
        
        // Handle modal close
        if (event.target.closest('#modal-close') || event.target.closest('.modal')) {
            this.closePortfolioModal();
        }
    }

    handleKeydown(event) {
        // Escape key
        if (event.key === 'Escape') {
            this.closePortfolioModal();
            this.closeMobileMenu();
        }
        
        // Navigation keys
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.navigateSections(event.key === 'ArrowUp' ? -1 : 1);
        }
    }

    handleBeforeUnload() {
        // Save current state
        localStorage.setItem(CONFIG.storage.language, this.currentLanguage);
        localStorage.setItem(CONFIG.storage.theme, this.currentTheme);
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (mobileMenu && menuToggle) {
            this.state.isMenuOpen = !this.state.isMenuOpen;
            
            if (this.state.isMenuOpen) {
                mobileMenu.classList.add('active');
                menuToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    closeMobileMenu() {
        if (this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    scrollToTop() {
        if (this.modules.smoothScroll?.lenis) {
            this.modules.smoothScroll.lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    openPortfolioModal(item) {
        const modal = document.getElementById('modal');
        const modalImage = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        
        if (modal && item) {
            const image = item.querySelector('img, video');
            const title = item.querySelector('.portfolio-label')?.textContent || 'Portfolio Item';
            
            if (modalImage) modalImage.src = image?.src || '';
            if (modalTitle) modalTitle.textContent = title;
            if (modalDescription) modalDescription.textContent = 'Portfolio item description';
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closePortfolioModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    navigateSections(direction) {
        const sections = Array.from(document.querySelectorAll('section[id]'));
        const currentIndex = sections.findIndex(section => section.id === this.state.currentSection);
        const nextIndex = currentIndex + direction;
        
        if (nextIndex >= 0 && nextIndex < sections.length) {
            const targetSection = sections[nextIndex];
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    handleError(error) {
        console.error('Application error:', error);
        
        // Show user-friendly error message
        this.showErrorMessage('An error occurred. Please refresh the page.');
        
        // Dispatch error event
        this.dispatchEvent('app:error', { error: error.message });
    }

    showErrorMessage(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Public API methods
    getModule(name) {
        return this.modules[name];
    }

    getState() {
        return { ...this.state };
    }

    setLanguage(language) {
        this.currentLanguage = language;
        this.modules.language?.setLanguage(language);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.modules.theme?.setTheme(theme);
    }

    refresh() {
        // Reload the application
        window.location.reload();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
} else {
    window.PortfolioApp = PortfolioApp;
} // ===== COMPONENTS JAVASCRIPT =====

// ===== LANGUAGE MODULE =====
class LanguageModule {
    constructor() {
        this.currentLanguage = CONFIG.app.defaultLanguage;
        this.supportedLanguages = CONFIG.app.supportedLanguages;
        this.init();
    }

    init() {
        this.setupLanguageSwitcher();
        this.loadSavedLanguage();
        this.updateAllText();
    }

    setupLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');

        langButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang');
                this.setLanguage(lang);
            });
        });
    }

    setLanguage(language) {
        if (!this.supportedLanguages.includes(language)) return;

        this.currentLanguage = language;

        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === language) {
                btn.classList.add('active');
            }
        });

        // Save to localStorage
        Utils.setStorage(CONFIG.storage.language, language);

        // Update all text content
        this.updateAllText();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('language:changed', {
            detail: { language }
        }));
    }

    updateAllText() {
        const elements = document.querySelectorAll('[data-en], [data-ru], [data-uz]');

        elements.forEach(element => {
            const text = element.getAttribute(`data-${this.currentLanguage}`);
            if (text) {
                element.textContent = text;
            }
        });
    }

    loadSavedLanguage() {
        const savedLang = Utils.getStorage(CONFIG.storage.language, this.currentLanguage);
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            this.setLanguage(savedLang);
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// ===== CURSOR MODULE =====
class CursorModule {
    constructor() {
        this.cursor = null;
        this.cursorFollower = null;
        this.isEnabled = CONFIG.cursor.enabled;
        this.init();
    }

    init() {
        this.createCursor();
        this.setupEventListeners();
        this.updateVisibility();
    }

    createCursor() {
        // Create cursor elements
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        document.body.appendChild(this.cursor);

        this.cursorFollower = document.createElement('div');
        this.cursorFollower.className = 'cursor-follower';
        document.body.appendChild(this.cursorFollower);
    }

    setupEventListeners() {
        // Mouse move
        document.addEventListener('mousemove', (e) => {
            if (!this.isEnabled) return;

            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';

            // Delayed follower
            setTimeout(() => {
                this.cursorFollower.style.left = e.clientX + 'px';
                this.cursorFollower.style.top = e.clientY + 'px';
            }, 100);
        });

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .btn, .filter-btn, .portfolio-item, .contact-link');

        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!this.isEnabled) return;
                this.cursor.classList.add('hover-active');
                this.cursorFollower.classList.add('hover-active');
            });

            element.addEventListener('mouseleave', () => {
                if (!this.isEnabled) return;
                this.cursor.classList.remove('hover-active');
                this.cursorFollower.classList.remove('hover-active');
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.updateVisibility();
        });
    }

    updateVisibility() {
        const isMobile = Utils.isMobile();
        const isTouchDevice = Utils.isTouchDevice();

        if (isMobile || isTouchDevice) {
            this.disable();
        } else {
            this.enable();
        }
    }

    enable() {
        this.isEnabled = true;
        if (this.cursor) this.cursor.style.display = 'block';
        if (this.cursorFollower) this.cursorFollower.style.display = 'block';
        document.body.style.cursor = 'none';
    }

    disable() {
        this.isEnabled = false;
        if (this.cursor) this.cursor.style.display = 'none';
        if (this.cursorFollower) this.cursorFollower.style.display = 'none';
        document.body.style.cursor = 'auto';
    }
}

// ===== SMOOTH SCROLL MODULE =====
class SmoothScrollModule {
    constructor() {
        this.lenis = null;
        this.init();
    }

    async init() {
        if (typeof Lenis !== 'undefined') {
            this.setupLenis();
        } else {
            console.warn('Lenis not available, using native smooth scroll');
        }
    }

    setupLenis() {
        this.lenis = new Lenis({
            duration: CONFIG.scroll.duration,
            easing: CONFIG.scroll.easing,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: CONFIG.scroll.mouseMultiplier,
            touchMultiplier: CONFIG.scroll.touchMultiplier,
            infinite: CONFIG.scroll.infinite
        });

        // Integrate with GSAP
        if (typeof gsap !== 'undefined') {
            gsap.ticker.add((time) => {
                this.lenis.raf(time * 1000);
            });
        } else {
            function raf(time) {
                this.lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    scrollTo(target, options = {}) {
        if (this.lenis) {
            this.lenis.scrollTo(target, options);
        } else {
            // Fallback to native smooth scroll
            if (typeof target === 'string') {
                const element = document.querySelector(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', ...options });
                }
            }
        }
    }
}

// ===== ANIMATIONS MODULE =====
class AnimationsModule {
    constructor() {
        this.init();
    }

    init() {
        if (typeof gsap !== 'undefined') {
            this.setupGSAP();
        }
    }

    setupGSAP() {
        // Register ScrollTrigger plugin
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Setup scroll-triggered animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        // Animate elements when they come into view
        const animatedElements = document.querySelectorAll('.scroll-trigger');

        animatedElements.forEach(element => {
            gsap.fromTo(element,
                {
                    opacity: 0,
                    y: 50
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: element,
                        start: 'top 80%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    }
}

// ===== THEME MODULE =====
class ThemeModule {
    constructor() {
        this.currentTheme = CONFIG.app.defaultTheme;
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.loadSavedTheme();
        this.setTheme(this.currentTheme);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        Utils.setStorage(CONFIG.storage.theme, theme);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('theme:changed', {
            detail: { theme }
        }));
    }

    loadSavedTheme() {
        const savedTheme = Utils.getStorage(CONFIG.storage.theme, this.currentTheme);
        if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
            this.setTheme(savedTheme);
        }
    }
}

// ===== NAVIGATION MODULE =====
class NavigationModule {
    constructor() {
        this.navigation = null;
        this.lastScrollTop = 0;
        this.init();
    }

    init() {
        this.navigation = document.getElementById('navigation');
        this.setupScrollBehavior();
        this.setupMobileMenu();
    }

    setupScrollBehavior() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add/remove scrolled class
        if (scrollTop > 50) {
            this.navigation.classList.add('scrolled');
        } else {
            this.navigation.classList.remove('scrolled');
        }

        // Hide/show navigation on scroll
        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            this.navigation.classList.add('hidden');
        } else {
            this.navigation.classList.remove('hidden');
        }

        this.lastScrollTop = scrollTop;
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
            });
        }
    }
}

// ===== PORTFOLIO MODULE =====
class PortfolioModule {
    constructor() {
        this.currentFilter = 'all';
        this.portfolioItems = [];
        this.init();
    }

    init() {
        this.loadPortfolioItems();
        this.setupFilters();
        this.setupPortfolioGrid();
    }

    loadPortfolioItems() {
        this.portfolioItems = CONFIG.portfolio.items;
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = btn.getAttribute('data-filter');
                this.filterPortfolio(filter);

                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    filterPortfolio(filter) {
        this.currentFilter = filter;
        const grid = document.getElementById('portfolio-grid');

        if (!grid) return;

        // Clear grid
        grid.innerHTML = '';

        // Filter items
        const filteredItems = filter === 'all'
            ? this.portfolioItems
            : this.portfolioItems.filter(item =>
                item.category === filter || item.type === filter
            );

        // Render items
        filteredItems.forEach(item => {
            const itemElement = this.createPortfolioItem(item);
            grid.appendChild(itemElement);
        });
    }

    createPortfolioItem(item) {
        const element = document.createElement('div');
        element.className = 'portfolio-item';
        element.setAttribute('data-category', item.category);
        element.setAttribute('data-type', item.type);

        const media = item.video ?
            `<video src="${item.video}" muted loop></video>` :
            `<img src="${item.image}" alt="${item.title}" loading="lazy">`;

        element.innerHTML = `
            ${media}
            <div class="portfolio-overlay">
                <div class="portfolio-info">
                    <div class="portfolio-title">${item.title}</div>
                    <div class="portfolio-category">${item.category}</div>
                </div>
            </div>
            <div class="portfolio-label">${item.type}</div>
        `;

        return element;
    }

    setupPortfolioGrid() {
        // Initial render
        this.filterPortfolio('all');
    }
}

// ===== ACCESSIBILITY MODULE =====
class AccessibilityModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupReducedMotion();
    }

    setupKeyboardNavigation() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    setupFocusManagement() {
        // Add focus-visible class for better focus styles
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupReducedMotion() {
        if (Utils.isReducedMotion()) {
            document.documentElement.classList.add('reduced-motion');
        }
    }
}

// Export modules for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LanguageModule,
        CursorModule,
        SmoothScrollModule,
        AnimationsModule,
        ThemeModule,
        NavigationModule,
        PortfolioModule,
        AccessibilityModule
    };
} else {
    window.LanguageModule = LanguageModule;
    window.CursorModule = CursorModule;
    window.SmoothScrollModule = SmoothScrollModule;
    window.AnimationsModule = AnimationsModule;
    window.ThemeModule = ThemeModule;
    window.NavigationModule = NavigationModule;
    window.PortfolioModule = PortfolioModule;
    window.AccessibilityModule = AccessibilityModule;
} // ===== CONFIGURATION FILE =====

const CONFIG = {
    // App settings
    app: {
        name: 'Sarvinoz Usmanova',
        version: '2.0.0',
        debug: false,
        defaultLanguage: 'ru',
        supportedLanguages: ['en', 'ru', 'uz'],
        defaultTheme: 'dark',
        smoothScroll: true,
        cursorEnabled: true,
        animationsEnabled: true
    },

    // API endpoints
    api: {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        retries: 3
    },

    // Portfolio data
    portfolio: {
        items: [
            {
                id: 1,
                title: 'Vogue Editorial',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Fashion editorial for Vogue magazine featuring high-end fashion photography',
                year: 2024,
                client: 'Vogue',
                tags: ['fashion', 'editorial', 'high-end'],
                featured: true
            },
            {
                id: 2,
                title: 'Djafariy Campaign',
                category: 'photo',
                type: 'commercial',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Commercial campaign for Djafariy brand showcasing luxury fashion',
                year: 2023,
                client: 'Djafariy',
                tags: ['commercial', 'luxury', 'fashion'],
                featured: true
            },
            {
                id: 3,
                title: 'Elle Magazine',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'Editorial feature for Elle magazine with contemporary fashion styling',
                year: 2023,
                client: 'Elle',
                tags: ['editorial', 'fashion', 'magazine'],
                featured: false
            },
            {
                id: 4,
                title: 'Fashion Portrait 1',
                category: 'photo',
                type: 'portrait',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Elegant portrait photography showcasing natural beauty',
                year: 2024,
                client: 'Personal',
                tags: ['portrait', 'beauty', 'natural'],
                featured: false
            },
            {
                id: 5,
                title: 'Runway Show 1',
                category: 'photo',
                type: 'runway',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Paris Fashion Week runway appearance',
                year: 2023,
                client: 'Paris Fashion Week',
                tags: ['runway', 'fashion-week', 'luxury'],
                featured: true
            },
            {
                id: 6,
                title: 'Editorial Spread 1',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'High-fashion editorial spread for international magazine',
                year: 2024,
                client: 'International Magazine',
                tags: ['editorial', 'high-fashion', 'magazine'],
                featured: false
            },
            {
                id: 7,
                title: 'Commercial Campaign 1',
                category: 'photo',
                type: 'commercial',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Luxury brand commercial campaign',
                year: 2023,
                client: 'Luxury Brand',
                tags: ['commercial', 'luxury', 'brand'],
                featured: false
            },
            {
                id: 8,
                title: 'Beauty Shot 1',
                category: 'photo',
                type: 'beauty',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Close-up beauty photography highlighting features',
                year: 2024,
                client: 'Beauty Brand',
                tags: ['beauty', 'close-up', 'features'],
                featured: false
            },
            {
                id: 9,
                title: 'Fashion Editorial 2',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'Contemporary fashion editorial with bold styling',
                year: 2023,
                client: 'Fashion Magazine',
                tags: ['editorial', 'contemporary', 'bold'],
                featured: false
            },
            {
                id: 10,
                title: 'Portrait Session 1',
                category: 'photo',
                type: 'portrait',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Professional portrait session in studio',
                year: 2024,
                client: 'Studio Session',
                tags: ['portrait', 'studio', 'professional'],
                featured: false
            },
            {
                id: 11,
                title: 'Runway Show 2',
                category: 'photo',
                type: 'runway',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Milan Fashion Week runway appearance',
                year: 2023,
                client: 'Milan Fashion Week',
                tags: ['runway', 'milan', 'fashion-week'],
                featured: false
            },
            {
                id: 12,
                title: 'Commercial Ad 1',
                category: 'photo',
                type: 'commercial',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'Print advertisement for fashion brand',
                year: 2024,
                client: 'Fashion Brand',
                tags: ['commercial', 'print', 'advertisement'],
                featured: false
            },
            {
                id: 13,
                title: 'Beauty Editorial 1',
                category: 'photo',
                type: 'beauty',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Beauty editorial for cosmetics brand',
                year: 2023,
                client: 'Cosmetics Brand',
                tags: ['beauty', 'cosmetics', 'editorial'],
                featured: false
            },
            {
                id: 14,
                title: 'Fashion Spread 1',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Multi-page fashion spread in magazine',
                year: 2024,
                client: 'Fashion Magazine',
                tags: ['editorial', 'spread', 'magazine'],
                featured: false
            },
            {
                id: 15,
                title: 'Studio Portrait 1',
                category: 'photo',
                type: 'portrait',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'Studio portrait with dramatic lighting',
                year: 2023,
                client: 'Studio Session',
                tags: ['portrait', 'studio', 'dramatic'],
                featured: false
            },
            {
                id: 16,
                title: 'Runway Show 3',
                category: 'photo',
                type: 'runway',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'New York Fashion Week runway',
                year: 2024,
                client: 'New York Fashion Week',
                tags: ['runway', 'nyfw', 'fashion-week'],
                featured: false
            },
            {
                id: 17,
                title: 'Commercial Campaign 2',
                category: 'photo',
                type: 'commercial',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'International brand campaign',
                year: 2023,
                client: 'International Brand',
                tags: ['commercial', 'international', 'campaign'],
                featured: false
            },
            {
                id: 18,
                title: 'Beauty Shot 2',
                category: 'photo',
                type: 'beauty',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                description: 'Close-up beauty photography',
                year: 2024,
                client: 'Beauty Brand',
                tags: ['beauty', 'close-up', 'photography'],
                featured: false
            },
            {
                id: 19,
                title: 'Editorial Feature 1',
                category: 'photo',
                type: 'editorial',
                image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Feature editorial for fashion publication',
                year: 2023,
                client: 'Fashion Publication',
                tags: ['editorial', 'feature', 'publication'],
                featured: false
            },
            {
                id: 20,
                title: 'Portrait Collection 1',
                category: 'photo',
                type: 'portrait',
                image: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=1887&auto=format&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1545561088-2a73b8894172?q=80&w=400&auto=format&fit=crop',
                description: 'Portrait collection for portfolio',
                year: 2024,
                client: 'Portfolio',
                tags: ['portrait', 'collection', 'portfolio'],
                featured: false
            },
            {
                id: 21,
                title: 'Fashion Reel 1',
                category: 'video',
                type: 'editorial',
                video: 'https://ik.imagekit.io/sarvinozusmanova/video/IMG_9337.MP4?updatedAt=1752780826850',
                thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=400&auto=format&fit=crop',
                description: 'Behind the scenes fashion reel showcasing editorial work',
                year: 2024,
                client: 'Personal',
                tags: ['video', 'editorial', 'behind-scenes'],
                featured: true
            }
        ],
        categories: [
            { id: 'all', name: { en: 'All', ru: 'Все', uz: 'Barchasi' } },
            { id: 'photo', name: { en: 'Photo', ru: 'Фото', uz: 'Foto' } },
            { id: 'video', name: { en: 'Video', ru: 'Видео', uz: 'Video' } },
            { id: 'editorial', name: { en: 'Editorial', ru: 'Эдиториал', uz: 'Editorial' } }
        ],
        itemsPerPage: 6,
        loadMoreEnabled: true
    },

    // Experience timeline
    experience: [
        {
            year: 2024,
            title: { en: 'Vogue Editorial', ru: 'Эдиториал для Vogue', uz: 'Vogue Editorial' },
            description: {
                en: 'Featured in international fashion editorial',
                ru: 'Участие в международном модном эдиториале',
                uz: 'Xalqaro moda editorialida ishtirok etdi'
            },
            category: 'editorial'
        },
        {
            year: 2023,
            title: { en: 'Paris Fashion Week', ru: 'Неделя моды в Париже', uz: 'Parij Moda Haftasi' },
            description: {
                en: 'Walked for multiple luxury brands',
                ru: 'Выступала для нескольких люксовых брендов',
                uz: 'Bir nechta hashamatli brendlar uchun yurdi'
            },
            category: 'runway'
        },
        {
            year: 2022,
            title: { en: 'Elle Magazine', ru: 'Журнал Elle', uz: 'Elle Jurnali' },
            description: {
                en: 'Cover and editorial feature',
                ru: 'Обложка и эдиториал',
                uz: 'Muqova va editorial material'
            },
            category: 'editorial'
        }
    ],

    // Personal information
    personal: {
        name: 'Sarvinoz Usmanova',
        title: { en: 'International Model', ru: 'Международная модель', uz: 'Xalqaro Model' },
        location: 'Tashkent, Uzbekistan',
        bio: {
            en: 'An international model based in Tashkent, with a passion for editorial and high-fashion projects. My work is about telling stories and evoking emotions through the lens.',
            ru: 'Международная модель из Ташкента, увлеченная эдиториал и high-fashion проектами. Моя работа — рассказывать истории и вызывать эмоции через объектив.',
            uz: 'Toshkentda istiqomat qiluvchi xalqaro model, editorial va yuqori moda loyihalariga ishtiyoqmand. Mening ishim - ob\'ektiv orqali hikoyalar aytib berish va his-tuyg\'ularni uyg\'otish.'
        },
        measurements: {
            height: '170 cm',
            chest: '75 cm',
            waist: '60 cm',
            hips: '85 cm'
        },
        languages: ['Русский', 'English', 'O\'zbek'],
        specializations: ['Editorial', 'Fashion', 'Commercial', 'Runway'],
        stats: [
            { number: '5+', label: { en: 'Years Experience', ru: 'Лет опыта', uz: 'Yillik Tajriba' } },
            { number: '50+', label: { en: 'Projects', ru: 'Проектов', uz: 'Loyihalar' } },
            { number: '15+', label: { en: 'Brands', ru: 'Брендов', uz: 'Brendlar' } }
        ]
    },

    // Contact information
    contact: {
        email: 'sarahusmanova@icloud.com',
        instagram: 'https://instagram.com/sarvisha.usmanova',
        telegram: 'https://t.me/srv_usmn',
        links: [
            {
                type: 'email',
                url: 'mailto:sarahusmanova@icloud.com',
                icon: '✉️',
                label: 'Email'
            },
            {
                type: 'instagram',
                url: 'https://instagram.com/sarvisha.usmanova',
                icon: '📸',
                label: 'Instagram'
            },
            {
                type: 'telegram',
                url: 'https://t.me/srv_usmn',
                icon: '💬',
                label: 'Telegram'
            }
        ]
    },

    // Animation settings
    animations: {
        duration: {
            fast: 150,
            normal: 300,
            slow: 500,
            verySlow: 1000
        },
        easing: {
            ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            custom: 'cubic-bezier(0.16, 1, 0.3, 1)'
        },
        stagger: {
            fast: 0.05,
            normal: 0.1,
            slow: 0.2
        }
    },

    // Scroll settings
    scroll: {
        smooth: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        mouseMultiplier: 1,
        touchMultiplier: 2,
        infinite: false
    },

    // Cursor settings
    cursor: {
        enabled: true,
        size: 12,
        followerSize: 32,
        hoverScale: 2,
        followerHoverScale: 1.5,
        mixBlendMode: 'difference'
    },

    // Theme settings
    themes: {
        dark: {
            background: '#121212',
            surface: '#1A1A1A',
            surfaceLight: '#2A2A2A',
            textPrimary: '#EAEAEA',
            textSecondary: '#B0B0B0',
            textMuted: '#888888',
            primary: '#B5AB9A',
            accent: '#B5AB9A'
        },
        light: {
            background: '#FFFFFF',
            surface: '#F8F9FA',
            surfaceLight: '#E9ECEF',
            textPrimary: '#212529',
            textSecondary: '#6C757D',
            textMuted: '#ADB5BD',
            primary: '#B5AB9A',
            accent: '#B5AB9A'
        }
    },

    // Breakpoints
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        wide: 1440
    },

    // Error messages
    errors: {
        libraryLoad: 'One or more critical libraries failed to load',
        networkError: 'Network error occurred',
        imageLoadError: 'Failed to load image',
        videoLoadError: 'Failed to load video'
    },

    // Success messages
    success: {
        formSubmitted: 'Message sent successfully',
        imageLoaded: 'Image loaded successfully',
        videoLoaded: 'Video loaded successfully'
    },

    // Local storage keys
    storage: {
        theme: 'portfolio-theme',
        language: 'portfolio-language',
        cursorEnabled: 'portfolio-cursor-enabled',
        animationsEnabled: 'portfolio-animations-enabled'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
} // ===== PORTFOLIO JAVASCRIPT =====

class PortfolioManager {
    constructor() {
        this.currentFilter = 'all';
        this.portfolioItems = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.init();
    }

    init() {
        this.loadPortfolioItems();
        this.setupFilters();
        this.setupPortfolioGrid();
        this.setupModal();
    }

    loadPortfolioItems() {
        this.portfolioItems = CONFIG.portfolio.items;
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = btn.getAttribute('data-filter');
                this.filterPortfolio(filter);

                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    filterPortfolio(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.renderPortfolio();
    }

    renderPortfolio() {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;

        // Clear grid
        grid.innerHTML = '';

        // Filter items
        const filteredItems = this.currentFilter === 'all'
            ? this.portfolioItems
            : this.portfolioItems.filter(item =>
                item.category === this.currentFilter || item.type === this.currentFilter
            );

        // Get items for current page
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const itemsToShow = filteredItems.slice(startIndex, endIndex);

        // Render items
        itemsToShow.forEach(item => {
            const itemElement = this.createPortfolioItem(item);
            grid.appendChild(itemElement);
        });

        // Update load more button
        this.updateLoadMoreButton(filteredItems.length);
    }

    createPortfolioItem(item) {
        const element = document.createElement('div');
        element.className = 'portfolio-item';
        element.setAttribute('data-category', item.category);
        element.setAttribute('data-type', item.type);
        element.setAttribute('data-id', item.id);

        const media = item.video ?
            `<video src="${item.video}" muted loop></video>` :
            `<img src="${item.image}" alt="${item.title}" loading="lazy">`;

        element.innerHTML = `
            ${media}
            <div class="portfolio-overlay">
                <div class="portfolio-info">
                    <div class="portfolio-title">${item.title}</div>
                    <div class="portfolio-category">${item.category}</div>
                </div>
            </div>
            <div class="portfolio-label">${item.type}</div>
        `;

        // Add click event for modal
        element.addEventListener('click', () => {
            this.openModal(item);
        });

        return element;
    }

    setupPortfolioGrid() {
        // Initial render
        this.renderPortfolio();
    }

    setupModal() {
        const modal = document.getElementById('modal');
        const modalClose = document.getElementById('modal-close');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    openModal(item) {
        const modal = document.getElementById('modal');
        const modalImage = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');

        if (modal && item) {
            const media = item.video ?
                `<video src="${item.video}" controls autoplay muted loop></video>` :
                `<img src="${item.image}" alt="${item.title}">`;

            if (modalImage) {
                modalImage.innerHTML = media;
            }
            if (modalTitle) modalTitle.textContent = item.title;
            if (modalDescription) modalDescription.textContent = item.description;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            // Stop video if playing
            const video = modal.querySelector('video');
            if (video) {
                video.pause();
            }
        }
    }

    updateLoadMoreButton(totalItems) {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            const totalPages = Math.ceil(totalItems / this.itemsPerPage);
            const hasMorePages = this.currentPage < totalPages;

            loadMoreBtn.style.display = hasMorePages ? 'block' : 'none';

            if (hasMorePages) {
                loadMoreBtn.addEventListener('click', () => {
                    this.loadMore();
                });
            }
        }
    }

    loadMore() {
        this.currentPage++;
        this.renderPortfolio();
    }

    // Public methods
    getCurrentFilter() {
        return this.currentFilter;
    }

    getPortfolioItems() {
        return this.portfolioItems;
    }

    refreshPortfolio() {
        this.renderPortfolio();
    }
}

// Initialize portfolio manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManager;
} else {
    window.PortfolioManager = PortfolioManager;
} // ===== PRELOADER MODULE =====

class PreloaderModule {
    constructor() {
        this.duration = 7000; // 7 seconds
        this.quotes = [
            "Fashion is the armor to survive the reality of everyday life.",
            "Style is a way to say who you are without having to speak.",
            "Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, fashion has to do with ideas, the way we live, what is happening.",
            "Elegance is the only beauty that never fades.",
            "Fashion is about dressing according to what's fashionable. Style is more about being yourself.",
            "The joy of dressing is an art.",
            "Fashion is what you're offered four times a year by designers. And style is what you choose.",
            "Beauty begins the moment you decide to be yourself.",
            "Fashion is like eating, you shouldn't stick to the same menu.",
            "Style is knowing who you are, what you want to say, and not giving a damn."
        ];
        this.currentQuoteIndex = 0;
        this.progress = 0;
        this.isComplete = false;
        this.init();
    }

    init() {
        this.setupElements();
        this.startPreloader();
    }

    setupElements() {
        this.preloader = document.getElementById('preloader');
        this.progressBar = document.getElementById('preloader-bar');
        this.quoteElement = document.getElementById('preloader-quote');
        this.percentageElement = document.getElementById('preloader-percentage');

        if (!this.preloader || !this.progressBar || !this.quoteElement || !this.percentageElement) {
            console.error('Preloader elements not found');
            return;
        }
    }

    startPreloader() {
        const startTime = Date.now();
        const endTime = startTime + this.duration;

        const updateProgress = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            this.progress = Math.min((elapsed / this.duration) * 100, 100);

            // Update progress bar
            if (this.progressBar) {
                this.progressBar.style.width = `${this.progress}%`;
            }

            // Update percentage
            if (this.percentageElement) {
                this.percentageElement.textContent = `${Math.round(this.progress)}%`;
            }

            // Update quotes every 2 seconds
            const quoteInterval = Math.floor(this.progress / 14); // 14% intervals for 7 quotes
            if (quoteInterval !== this.currentQuoteIndex && quoteInterval < this.quotes.length) {
                this.currentQuoteIndex = quoteInterval;
                this.updateQuote();
            }

            if (this.progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                this.complete();
            }
        };

        requestAnimationFrame(updateProgress);
    }

    updateQuote() {
        if (this.quoteElement && this.currentQuoteIndex < this.quotes.length) {
            // Fade out
            this.quoteElement.style.opacity = '0';

            setTimeout(() => {
                // Update text
                this.quoteElement.textContent = this.quotes[this.currentQuoteIndex];

                // Fade in
                this.quoteElement.style.opacity = '1';
            }, 300);
        }
    }

    complete() {
        this.isComplete = true;

        // Add completion animation
        if (this.preloader) {
            this.preloader.classList.add('hidden');

            setTimeout(() => {
                this.preloader.style.display = 'none';

                // Dispatch completion event
                document.dispatchEvent(new CustomEvent('preloader:complete'));

                // Show main content
                document.body.classList.add('loaded');
            }, 500);
        }
    }

    // Public method to check if preloader is complete
    isPreloaderComplete() {
        return this.isComplete;
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreloaderModule;
} else {
    window.PreloaderModule = PreloaderModule;
} // ===== UTILITIES FILE =====

class Utils {
    // ===== DOM UTILITIES =====

    static $(selector) {
        return document.querySelector(selector);
    }

    static $$(selector) {
        return document.querySelectorAll(selector);
    }

    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    }

    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }

    static hasClass(element, className) {
        return element && element.classList.contains(className);
    }

    // ===== EVENT UTILITIES =====

    static on(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    static off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    static once(element, event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(element, event, onceHandler);
        };
        this.on(element, event, onceHandler);
    }

    static delegate(parent, selector, event, handler) {
        this.on(parent, event, (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        });
    }

    // ===== ANIMATION UTILITIES =====

    static animate(element, properties, options = {}) {
        if (!element) return;

        const defaults = {
            duration: 300,
            easing: 'ease',
            delay: 0,
            fill: 'forwards'
        };

        const config = { ...defaults, ...options };

        return element.animate(properties, config);
    }

    static fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    static fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    static slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: ['translateY(30px)', 'translateY(0)'],
            down: ['translateY(-30px)', 'translateY(0)'],
            left: ['translateX(-30px)', 'translateX(0)'],
            right: ['translateX(30px)', 'translateX(0)']
        };

        const [from, to] = transforms[direction] || transforms.up;

        return this.animate(element, [
            { opacity: 0, transform: from },
            { opacity: 1, transform: to }
        ], { duration });
    }

    // ===== SCROLL UTILITIES =====

    static scrollTo(element, options = {}) {
        const defaults = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };

        const config = { ...defaults, ...options };

        if (typeof element === 'string') {
            element = this.$(element);
        }

        if (element) {
            element.scrollIntoView(config);
        }
    }

    static scrollToTop(options = {}) {
        this.scrollTo(document.body, options);
    }

    static getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }

    static isElementInViewport(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    static isElementPartiallyInViewport(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right > 0
        );
    }

    // ===== DEVICE & BROWSER UTILITIES =====

    static isMobile() {
        return window.innerWidth <= CONFIG.breakpoints.tablet;
    }

    static isTablet() {
        return window.innerWidth > CONFIG.breakpoints.tablet && window.innerWidth <= CONFIG.breakpoints.desktop;
    }

    static isDesktop() {
        return window.innerWidth > CONFIG.breakpoints.desktop;
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static isReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    static isHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    }

    static getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }

    // ===== STORAGE UTILITIES =====

    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    }

    static clearStorage() {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }

    // ===== STRING UTILITIES =====

    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static truncate(str, length = 100, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    static slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static formatNumber(num, options = {}) {
        const defaults = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };

        return new Intl.NumberFormat(undefined, { ...defaults, ...options }).format(num);
    }

    static formatDate(date, options = {}) {
        const defaults = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return new Intl.DateTimeFormat(undefined, { ...defaults, ...options }).format(new Date(date));
    }

    // ===== ARRAY & OBJECT UTILITIES =====

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    static mergeObjects(...objects) {
        return objects.reduce((result, obj) => {
            return { ...result, ...obj };
        }, {});
    }

    // ===== MATH UTILITIES =====

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ===== IMAGE UTILITIES =====

    static preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    static preloadImages(sources) {
        return Promise.all(sources.map(src => this.preloadImage(src)));
    }

    static getImageDimensions(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                });
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // ===== PERFORMANCE UTILITIES =====

    static measureTime(fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, time: end - start };
    }

    static async measureTimeAsync(fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        return { result, time: end - start };
    }

    static requestIdleCallback(callback, options = {}) {
        if ('requestIdleCallback' in window) {
            return window.requestIdleCallback(callback, options);
        } else {
            return setTimeout(callback, 1);
        }
    }

    static cancelIdleCallback(id) {
        if ('cancelIdleCallback' in window) {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    }

    // ===== ERROR HANDLING =====

    static handleError(error, context = '') {
        console.error(`Error${context ? ` in ${context}` : ''}:`, error);

        // Dispatch error event
        const event = new CustomEvent('app:error', {
            detail: { error, context, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    static async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    // ===== VALIDATION UTILITIES =====

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    // ===== URL UTILITIES =====

    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    }

    static removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }

    // ===== COLOR UTILITIES =====

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static getContrastColor(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return '#000000';

        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
} 