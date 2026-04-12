// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════
// CONFIG — Paste your Google Apps Script URL
// ═══════════════════════════════════════════
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxho6xpdoDFMoLJjjjPi2bcGX44BatN3jtFNifoG58BXQohdd1Bn7vxZBKIDVmp6J5z/exec';
// Deployment ID: AKfycbxho6xpdoDFMoLJjjjPi2bcGX44BatN3jtFNifoG58BXQohdd1Bn7vxZBKIDVmp6J5z


// ═══════════════════════════════════════════
// ANALYTICS — Global tracking state
// ═══════════════════════════════════════════
const pageStartTime = Date.now();
let maxScrollPercent = 0;
let sectionTimes = {};
let activeSections = new Set();


// ═══════════════════════════════════════════
// DOM READY — Entry Point
// ═══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    // If no backend URL configured, skip auth entirely (dev mode)
    if (!APPS_SCRIPT_URL) {
        skipAuth();
        return;
    }

    // If already authenticated (persists across browser restarts)
    if (localStorage.getItem('biodata_auth') === 'true') {
        skipAuth();
        silentTrackVisit(); // Track cached/returning visits
        return;
    }

    // Show auth screen
    initAuth();
});


// ═══════════════════════════════════════════
// AUTH SYSTEM
// ═══════════════════════════════════════════
let isSignUpMode = true;

function initAuth() {
    // Prevent scrolling while auth is showing
    document.body.style.overflow = 'hidden';

    // Create twinkling star background
    createAuthStars();

    // Animate auth card entrance
    gsap.to('.auth-card', {
        y: 0, opacity: 1, scale: 1,
        duration: 0.9, ease: 'power3.out', delay: 0.3
    });

    // Form submit listener
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

    // Toggle sign-in / sign-up
    document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

function createAuthStars() {
    const container = document.getElementById('auth-stars');
    if (!container) return;

    for (let i = 0; i < 60; i++) {
        const star = document.createElement('div');
        star.classList.add('auth-star');
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
        star.style.animationDelay = Math.random() * 3 + 's';
        if (Math.random() > 0.7) {
            star.style.width = '3px';
            star.style.height = '3px';
        }
        container.appendChild(star);
    }
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    clearAuthMessage();

    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnText = document.getElementById('auth-btn-text');
    const toggleTextEl = document.getElementById('auth-toggle-text');
    const userInput = document.getElementById('auth-userid');
    const passInput = document.getElementById('auth-password');

    if (isSignUpMode) {
        title.textContent = 'Unlock My Story';
        subtitle.textContent = 'Create an account to read the full story';
        btnText.textContent = 'Create Account & Enter';
        toggleTextEl.innerHTML = 'Already been here? <a href="#" id="auth-toggle-link">Sign In</a>';
        userInput.placeholder = 'Choose a username';
        passInput.placeholder = 'Set a password';
    } else {
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to continue where you left off';
        btnText.textContent = 'Sign In & Enter';
        toggleTextEl.innerHTML = 'First time here? <a href="#" id="auth-toggle-link">Create Account</a>';
        userInput.placeholder = 'Your username';
        passInput.placeholder = 'Your password';
    }

    // Re-attach toggle listener
    document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });

    // Subtle card animation
    gsap.fromTo('.auth-card',
        { scale: 0.97 },
        { scale: 1, duration: 0.3, ease: 'power2.out' }
    );
}

async function handleAuthSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('auth-userid').value.trim();
    const password = document.getElementById('auth-password').value;
    const btnText = document.getElementById('auth-btn-text');
    const spinner = document.getElementById('auth-spinner');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!userId || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    if (isSignUpMode && userId.length < 3) {
        showAuthMessage('Username must be at least 3 characters', 'error');
        return;
    }

    if (isSignUpMode && password.length < 4) {
        showAuthMessage('Password must be at least 4 characters', 'error');
        return;
    }

    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    submitBtn.disabled = true;
    clearAuthMessage();

    try {
        // Get location (non-blocking — if user denies, we still proceed)
        const location = await getLocation();
        const device = getDeviceInfo();

        // Send to Google Apps Script
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: isSignUpMode ? 'signup' : 'login',
                userId: userId,
                password: password,
                latitude: location.latitude,
                longitude: location.longitude,
                device: device,
                referrer: document.referrer || 'direct'
            }),
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.success) {
            showAuthMessage(result.message, 'success');

            // Store persistent session
            localStorage.setItem('biodata_auth', 'true');
            localStorage.setItem('biodata_user', userId);

            // Wait a beat, then reveal biodata
            setTimeout(() => {
                revealBiodata();
            }, 900);
        } else {
            showAuthMessage(result.message, 'error');
            shakeCard();
            resetButton();
        }

    } catch (err) {
        console.error('Auth error:', err);
        showAuthMessage('Something went wrong. Please try again.', 'error');
        shakeCard();
        resetButton();
    }
}

function resetButton() {
    const btnText = document.getElementById('auth-btn-text');
    const spinner = document.getElementById('auth-spinner');
    const submitBtn = document.getElementById('auth-submit-btn');
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
    submitBtn.disabled = false;
}

function shakeCard() {
    const card = document.querySelector('.auth-card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
}


// ═══════════════════════════════════════════
// LOCATION + DEVICE INFO
// ═══════════════════════════════════════════
function getLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ latitude: '', longitude: '' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                latitude: pos.coords.latitude.toFixed(6),
                longitude: pos.coords.longitude.toFixed(6)
            }),
            () => resolve({ latitude: '', longitude: '' }),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    });
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    const screenSize = `${screen.width}x${screen.height}`;

    let device = 'Unknown';
    if (/iPhone/.test(ua)) device = 'iPhone';
    else if (/iPad/.test(ua)) device = 'iPad';
    else if (/Android/.test(ua)) {
        const match = ua.match(/;\s*([^;)]+)\s*Build/);
        device = match ? match[1].trim() : 'Android';
    }
    else if (/Windows/.test(ua)) device = 'Windows PC';
    else if (/Mac/.test(ua)) device = 'Mac';
    else if (/Linux/.test(ua)) device = 'Linux';

    return `${device} (${screenSize})`;
}


// ═══════════════════════════════════════════
// AUTH UI HELPERS
// ═══════════════════════════════════════════
function showAuthMessage(msg, type) {
    const el = document.getElementById('auth-message');
    el.textContent = msg;
    el.className = 'auth-message ' + type;
}

function clearAuthMessage() {
    const el = document.getElementById('auth-message');
    el.textContent = '';
    el.className = 'auth-message';
}

function revealBiodata() {
    // Slide auth overlay up with a cinematic exit
    gsap.to('#auth-overlay', {
        y: '-100%',
        duration: 1.2,
        ease: 'power3.inOut',
        onComplete: () => {
            document.getElementById('auth-overlay').style.display = 'none';
            document.body.style.overflow = '';
            initBiodata();
        }
    });
}

function skipAuth() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    initBiodata();
}

// Silent visit tracking for cached/returning visitors
function silentTrackVisit() {
    const userId = localStorage.getItem('biodata_user');
    if (!APPS_SCRIPT_URL || !userId) return;

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'trackVisit',
            userId: userId,
            referrer: document.referrer || 'direct',
            device: getDeviceInfo()
        }),
        redirect: 'follow'
    }).catch(() => {});
}

// Send final analytics (scroll depth, time spent, sections)
function sendAnalytics() {
    const userId = localStorage.getItem('biodata_user');
    if (!APPS_SCRIPT_URL || !userId) return;

    // Finalize active section timers
    activeSections.forEach(id => {
        if (sectionTimes[id] && sectionTimes[id].start) {
            sectionTimes[id].total += (Date.now() - sectionTimes[id].start) / 1000;
        }
    });

    // Build section summary: "Hero:12s, About:8s"
    const sectionNames = {
        'panel-hero': 'Hero', 'quote-1': 'Quote1', 'panel-about': 'About',
        'quote-2': 'Quote2', 'section-professional': 'Career',
        'quote-3': 'Quote3', 'section-personal': 'Origins',
        'section-name': 'NameGate', 'quote-married': 'Married?',
        'section-married-freedom': 'OurLife', 'quote-tea': 'TeaTwist',
        'section-cta': 'WhatsApp'
    };

    const sectionsViewed = Object.entries(sectionTimes)
        .filter(([, v]) => v.total > 1)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([id, v]) => `${sectionNames[id] || id}:${Math.round(v.total)}s`)
        .join(', ');

    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    const mins = Math.floor(timeSpent / 60);
    const secs = timeSpent % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'trackAnalytics',
            userId: userId,
            timeSpent: timeStr,
            scrollDepth: maxScrollPercent,
            sectionsViewed: sectionsViewed
        }),
        redirect: 'follow',
        keepalive: true
    }).catch(() => {});
}


// ═══════════════════════════════════════════
// BIODATA INITIALIZATION
// (All scroll/animation code lives here)
// ═══════════════════════════════════════════
function initBiodata() {
    
    // Initialize language toggle
    initLanguageToggle();

    // ─── ANALYTICS: Scroll depth tracker ────
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            const percent = Math.round((window.scrollY / docHeight) * 100);
            if (percent > maxScrollPercent) maxScrollPercent = percent;
        }
    }, { passive: true });

    // ─── ANALYTICS: Section engagement tracker ────
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            if (!id) return;
            if (entry.isIntersecting) {
                sectionTimes[id] = sectionTimes[id] || { total: 0, start: 0 };
                sectionTimes[id].start = Date.now();
                activeSections.add(id);
            } else {
                if (activeSections.has(id) && sectionTimes[id] && sectionTimes[id].start) {
                    sectionTimes[id].total += (Date.now() - sectionTimes[id].start) / 1000;
                    sectionTimes[id].start = 0;
                    activeSections.delete(id);
                }
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

    // ─── ANALYTICS: Send on page unload ────
    window.addEventListener('beforeunload', sendAnalytics);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sendAnalytics();
    });

    // ─── Name Form Handler ──────────────────
    const nameForm = document.getElementById('name-form');
    const lockedContent = document.getElementById('locked-content');
    const lockedOverlay = document.getElementById('locked-overlay');

    if (nameForm) {
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('visitor-name');
            const visitorName = nameInput.value.trim();
            const btnText = document.getElementById('name-btn-text');
            const spinner = document.getElementById('name-spinner');
            const submitBtn = document.getElementById('name-submit-btn');
            const savedMsg = document.getElementById('name-saved-msg');

            if (!visitorName) return;

            // Loading state
            btnText.style.display = 'none';
            spinner.style.display = 'block';
            submitBtn.disabled = true;

            // Update WhatsApp link with name + heart emoji
            const whatsappBtn = document.getElementById('whatsapp-cta');
            if (whatsappBtn) {
                const msg = encodeURIComponent(`Hi Raajesh! It's ${visitorName} here. Just read your entire kathai and had to say hi da ... ❤️`);
                whatsappBtn.href = `https://wa.me/919566874940?text=${msg}`;
            }

            // Send name to Google Sheets
            const userId = localStorage.getItem('biodata_user');
            if (APPS_SCRIPT_URL && userId) {
                try {
                    await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'updateName',
                            userId: userId,
                            name: visitorName
                        }),
                        redirect: 'follow'
                    });
                } catch (err) {
                    console.log('Name update error:', err);
                }
            }

            // Show success
            savedMsg.textContent = `Nice to meet you, ${visitorName}!`;
            nameForm.style.display = 'none';

            // Unlock the hidden content
            if (lockedContent) {
                lockedContent.classList.add('unlocked');
            }
            if (lockedOverlay) {
                lockedOverlay.classList.add('hidden');
            }

            // Refresh ScrollTrigger so new sections animate
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 1100);
        });
    }

    // ─── WhatsApp click: send final analytics ────
    const whatsappCta = document.getElementById('whatsapp-cta');
    if (whatsappCta) {
        whatsappCta.addEventListener('click', () => {
            sendAnalytics();
        });
    }

    // ═══════════════════════════════════════════
    // 1. FLOATING PARTICLES
    // ═══════════════════════════════════════════
    const particlesContainer = document.getElementById("particles-container");

    function createParticle() {
        const particle = document.createElement("div");
        const isSparkle = Math.random() > 0.5;
        particle.classList.add("particle", isSparkle ? "sparkle" : "dot");

        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";

        particlesContainer.appendChild(particle);

        const duration = 4 + Math.random() * 6;
        gsap.to(particle, {
            opacity: isSparkle ? 0.7 : 0.4,
            duration: duration * 0.3,
            ease: "power1.in",
        });

        gsap.to(particle, {
            y: -(50 + Math.random() * 150),
            x: (Math.random() - 0.5) * 100,
            duration: duration,
            ease: "none",
            onComplete: () => { particle.remove(); }
        });

        gsap.to(particle, {
            opacity: 0,
            duration: duration * 0.3,
            delay: duration * 0.7,
            ease: "power1.out",
        });
    }

    setInterval(createParticle, 400);
    for (let i = 0; i < 15; i++) {
        setTimeout(createParticle, i * 200);
    }


    // ═══════════════════════════════════════════
    // 2. HERO PANEL — Initial Reveal Animations
    // ═══════════════════════════════════════════
    const heroTl = gsap.timeline();

    gsap.fromTo("#panel-hero .img-container",
        { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
        { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.5, ease: "power4.inOut" }
    );

    gsap.fromTo("#panel-hero .background-image",
        { scale: 1.3 },
        { scale: 1, duration: 2.5, ease: "power3.out" }
    );

    heroTl
        .fromTo("#panel-hero .heading",
            { y: 60, opacity: 0, autoAlpha: 0 },
            { y: 0, opacity: 1, autoAlpha: 1, duration: 1.2, ease: "power4.out" },
            "-=0.5"
        )
        .fromTo("#panel-hero .subheading",
            { y: 40, opacity: 0, autoAlpha: 0 },
            { y: 0, opacity: 1, autoAlpha: 1, duration: 1, ease: "power3.out" },
            "-=0.7"
        )
        .fromTo("#panel-hero .blur-overlay",
            { opacity: 0 },
            { opacity: 1, duration: 1.5, ease: "power2.inOut" },
            "-=1"
        )
        .fromTo(".scroll-instruction",
            { opacity: 0, autoAlpha: 0, y: 20 },
            { opacity: 1, autoAlpha: 1, y: 0, duration: 1, ease: "power2.out" },
            "-=0.5"
        );


    // ═══════════════════════════════════════════
    // 3. ABOUT PANEL — Drawer Animations
    // ═══════════════════════════════════════════
    const aboutPanel = document.getElementById("panel-about");

    const aboutScrubTl = gsap.timeline({
        scrollTrigger: {
            trigger: aboutPanel,
            start: "top 80%",
            end: "top 10%",
            scrub: 1,
        }
    });

    const leftText = aboutPanel.querySelector(".text-move-left");
    const rightText = aboutPanel.querySelector(".text-move-right");

    if (leftText) aboutScrubTl.fromTo(leftText, { x: -100, opacity: 0 }, { x: 0, opacity: 1 }, 0);
    if (rightText) aboutScrubTl.fromTo(rightText, { x: 100, opacity: 0 }, { x: 0, opacity: 1 }, 0);

    const aboutImg = aboutPanel.querySelector(".img-container");
    if (aboutImg) {
        gsap.fromTo(aboutImg,
            { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
            {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                duration: 1.2,
                ease: "power3.inOut",
                scrollTrigger: {
                    trigger: aboutPanel,
                    start: "top 60%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    const aboutBg = aboutPanel.querySelector(".background-image");
    if (aboutBg) {
        gsap.fromTo(aboutBg,
            { scale: 1.2 },
            {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: aboutPanel,
                    start: "top 100%",
                    end: "top 0%",
                    scrub: true
                }
            }
        );
    }

    const aboutOverlay = aboutPanel.querySelector(".blur-overlay");
    if (aboutOverlay) {
        gsap.fromTo(aboutOverlay,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: aboutPanel,
                    start: "top 40%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }


    // ═══════════════════════════════════════════
    // 4. QUOTE SECTIONS — Reveal Animations
    // ═══════════════════════════════════════════
    document.querySelectorAll(".quote-section").forEach((section) => {
        const icon = section.querySelector(".quote-icon");
        const text = section.querySelector(".quote-text");

        const quoteTl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 70%",
                end: "top 20%",
                scrub: 1,
            }
        });

        if (icon) {
            quoteTl.fromTo(icon,
                { y: 40, opacity: 0, scale: 0.5 },
                { y: 0, opacity: 1, scale: 1, ease: "back.out(2)" },
                0
            );
        }

        if (text) {
            quoteTl.fromTo(text,
                { y: 60, opacity: 0 },
                { y: 0, opacity: 1, ease: "power3.out" },
                0.1
            );
        }

        gsap.to(section.querySelector(".quote-content"), {
            y: -30,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        });
    });


    // ═══════════════════════════════════════════
    // 5. STORY SECTIONS — Cinematic Reveals
    // ═══════════════════════════════════════════
    document.querySelectorAll(".story-section").forEach((section) => {
        const label = section.querySelector(".story-label");
        const title = section.querySelector(".story-title");
        const bodyPs = section.querySelectorAll(".story-body p");
        const ctas = section.querySelectorAll(".story-cta");

        const storyTl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 65%",
                toggleActions: "play none none reverse",
            }
        });

        if (label) {
            storyTl.fromTo(label,
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                0
            );
        }

        if (title) {
            storyTl.fromTo(title,
                { y: 50, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" },
                0.2
            );
        }

        if (bodyPs.length > 0) {
            storyTl.fromTo(bodyPs,
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
                0.5
            );
        }

        if (ctas.length > 0) {
            storyTl.fromTo(ctas,
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.5)" },
                0.9
            );
        }

        const gradientBg = section.querySelector(".story-gradient-bg");
        if (gradientBg) {
            gsap.to(gradientBg, {
                backgroundPosition: "100% 50%",
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                }
            });
        }
    });


    // ═══════════════════════════════════════════
    // 6. FINAL CTA SECTION — Grand Finale
    // ═══════════════════════════════════════════
    const ctaSection = document.getElementById("section-cta");

    const ctaTl = gsap.timeline({
        scrollTrigger: {
            trigger: ctaSection,
            start: "top 60%",
            toggleActions: "play none none reverse",
        }
    });

    ctaTl
        .fromTo(".cta-title",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power4.out" },
            0
        )
        .fromTo(".cta-subtitle",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            0.3
        )
        .fromTo(".cta-hook",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            0.5
        )
        .fromTo(".cta-whatsapp-btn",
            { y: 40, opacity: 0, scale: 0.85 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)" },
            0.7
        );

    gsap.to(".cta-whatsapp-btn", {
        boxShadow: "0 4px 25px rgba(37, 211, 102, 0.5), 0 0 80px rgba(37, 211, 102, 0.2)",
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 2,
    });


    // ═══════════════════════════════════════════
    // 7. FULLSCREEN ON MOBILE
    // ═══════════════════════════════════════════
    const enterFullscreen = () => {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Fullscreen error: ${err.message}`);
            });
        }
    };

    document.addEventListener('click', enterFullscreen, { once: true });
    document.addEventListener('touchstart', enterFullscreen, { once: true });
}
// ═══════════════════════════════════════════
// LANGUAGE TOGGLE SYSTEM (EN / TEN)
// ═══════════════════════════════════════════
const translations = {
    EN: {
        hero_heading: "Hey, I'm Raajesh",
        hero_sub: "Navigating life with a calm sunset vibe... searching for someone brave and beautiful enough to ride along.",
        hero_scroll: "Scroll to know my story",
        quote1: "Some stories begin when you least expect them... <br><em>maybe ours could be one of them.</em>",
        about_title: "The Real Me",
        about_p1: "I don't smoke and I don't drink. My best buzz comes from deep conversations and genuine company.",
        about_p2: "I'm career-focused during the day, but I'm not glued to my laptop. With the right company, I know how to make moments fun, interesting, and a little bit special. 😉",
        quote2: "Still scrolling?<br><em>Careful&hellip; this is starting to feel like we already know each other.</em>",
        career_title: "What I Do",
        career_p1: "I'm a total tech guy — mostly coding and brainstorming with AIs in my free time. When boredom strikes, I grab my bike and head out for a tea break. 😅",
        career_p2: "At the office, I work closely with AI automation projects — especially eKYC and AML process automations. &mdash; But my interests go beyond that — I'm also into US capital markets, corporate taxes, and investment advisory.",
        career_cta: "See the full career story on LinkedIn",
        quote3: "If you've made it this far,<br><em>I think the universe is trying to tell you something.</em>",
        origins_title: "Where It All Began",
        origins_p1: "A spirited soul born and raised in the sun-kissed town of <strong>Mayiladuthurai</strong> &mdash; a small-town dreamer with an enormous appetite for life.",
        origins_p2: "Brimming with boundless energy and an insatiably curious mind. My humour? That's a whole different level &mdash; some jokes are dark, some might make you mad, but mostly I'll have you laughing non-stop. 😉",
        origins_p3: "This adventurous heart is on a quest &mdash; not for treasure, but for <em>someone extraordinary</em> 💫. Someone who matches my wavelength, vibes with my beautiful madness, and turns everyday moments into stories worth telling forever. ❤️",
        origins_cta: "The life behind the story",
        name_title: "One Last Thing...",
        name_body: "You've shown so much interest in my story... now I'm curious too. Who's the person behind those curious eyes? 😌",
        name_btn: "That's Me — Unlock the Rest",
        locked_msg: "Tell me your name... there's more to this story",
        married_title: "What if we married?",
        freedom_title: "No Rules, Only Vibes",
        freedom_p1: "I don't believe in putting restrictions like a 90's parent... everything is your choice.",
        freedom_p2: "Want to study? Study. Want to work? Go for it. Got a business idea? Let's make it happen.",
        freedom_p3: "I won't be the one who blocks your dreams... I'll be the first one to invest in them.",
        tea_quote: "But there's just one condition...<br><em>When I ask for tea... you gotta make it for me.</em><br>That's it. That's the deal.",
        cta_title: "You actually read all that? You're a serious case.",
        cta_subtitle: "Spending this much time on the internet... that's basically a commitment.<br>Now I'm really curious... who is the person behind those scrolling fingers.",
        cta_hook: "Don't overthink it — just tap below and say <strong>'Hi'</strong> 😉<br>I won't screenshot it... <em>I won't tell anyone 🤞</em>",
        cta_btn: "Just Say Hi"
    },
    TEN: {
        hero_heading: "Hey, naan Raajesh",
        hero_sub: "Life ah calm sunset vibe la navigate panren… aana adha en kooda senthu handle pandra brave and beauty thedren...",
        hero_scroll: "Scroll pannunga… ennoda kathaya kekalaam",
        quote1: "Sila kadhai ellam unexpected ah dhaan start aagum… <br><em>namma kathayum maybe one of them ah irukalam</em>",
        about_title: "The Real Me",
        about_p1: "Naan smoke um panna maaten, drink um panna maaten… enakku best buzz na deep conversations um, genuine company dhaan 😌",
        about_p2: "Career mela focus iruken… aana laptop ah kattikitu iruka maaten 😄… right company irundha, moments ah fun ah, interesting ah… konjam special ah maathiduvein 😉",
        quote2: "Still scroll pandriya?<br><em>Careful&hellip; this is starting to feel like we already know each other.</em>",
        career_title: "What I Do",
        career_p1: "I'm totally a tech guy... mostly codings, brainstrom with AIs thaan free timela irukum... athuvum bore adicha bikeah eduthutu tea kudika poiduvan 😅",
        career_p2: "In office I closely work with AI automation projects athulayum eKYC aprom AML process automations... &mdash; ennathaan automations la interest irunthalum... US Captial market, corporate taxes aprom investment adviselaam kooda nalla pannuvan.",
        career_cta: "See the full career story on LinkedIn",
        quote3: "If you've made it this far,<br><em>I think the universe is trying to tell you something.</em>",
        origins_title: "Where It All Began",
        origins_p1: "A spirited soul born and raised in the sun-kissed town of <strong>Mayiladuthurai</strong> &mdash; a small-town dreamer with an enormous appetite for life.",
        origins_p2: "Brimming with boundless energy ah iruken… curiosity level romba over 😌… humour ah? adhu vera level… naan bayangarama joke adipan… sila jokes dark ah irukum 😅… sila jokes kovam varum… but mostly sirika vechiduven 😉",
        origins_p3: "Ipdi oru konjam loose ah irukum adventurous heart… ipo oru quest la iruku — treasure kaaga illa… <em>oru special someone kaaga</em> 💫… en wavelength match aaganum… en beautiful madness ah handle panna theriyanum 😌… daily life ah kooda namma rendu perum serndha story aakidalam… lifetime ah sollitu iruka maari ❤️",
        origins_cta: "The life behind the story",
        name_title: "One Last Thing...",
        name_body: "En story la ivlo interest kaamikreenga… ippo naanum konjam interest kaamikalama? 😉… andha curious eyes pinnadi irukura person yaar nu therinjikanum 😌",
        name_btn: "That's Me and balance unlock panu",
        locked_msg: "Unga name sollunga... approm innum nalla story iruku",
        married_title: "What if we married?",
        freedom_title: "No Rules, Only Vibes",
        freedom_p1: "Enaku 90's kid maathiri restriction la poda pudikathu... full of unoda choice thaan.",
        freedom_p2: "Padikanuma? Padi. Velaiku ponuma? Po. Any business idea tharlama? Panu.",
        freedom_p3: "Unoda dreams ku naan thadai podra aala illa... un dreams ku naan muthal invest pannura aalu.",
        tea_quote: "But oru condition mattum iruku...<br><em>Na tea ketta... nee pottu kudukanum.</em><br>That's it. That's the deal.",
        cta_title: "Idhellam full ah padicha neenga serious case",
        cta_subtitle: "Internet la ivlo neram spend pannina... idhu almost commitment dhaan<br>Ippo enakku romba curiosity... andha scrolling fingers pinnadi irukura person yaar nu.",
        cta_hook: "Overthink panna vendam — just keela tap panni <strong>'Hi'</strong> nu sollu 😉<br>Naan screenshot edukka maaten... <em>yaarkitayum solla maatan 🤞</em>",
        cta_btn: "Just Say Hi"
    }
};

let currentLang = 'EN'; // Default language

function applyLanguage(lang) {
    const texts = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.innerHTML = texts[key];
        }
    });
    
    // Apply placeholders
    const namePlaceholderMatch = lang === 'EN' ? "What should I call you?" : "What should I call you? unga name";
    const nameInput = document.getElementById('visitor-name');
    if (nameInput) nameInput.placeholder = namePlaceholderMatch;

    // Refresh ScrollTrigger to account for text height changes
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 100);
}

function initLanguageToggle() {
    const toggleBtn = document.getElementById('lang-toggle');
    if (!toggleBtn) return;
    
    const langLabel = toggleBtn.querySelector('.lang-label');
    
    // Initially apply default language (EN)
    applyLanguage(currentLang);
    langLabel.textContent = currentLang === 'EN' ? 'Tanglish' : 'English';
    
    toggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'EN' ? 'TEN' : 'EN';
        
        // Liquid glass press animation
        toggleBtn.classList.remove('liquid-active');
        void toggleBtn.offsetWidth; // trigger reflow
        toggleBtn.classList.add('liquid-active');
        
        // Switch text smoothly
        gsap.to('[data-i18n]', {
            opacity: 0,
            y: 5,
            duration: 0.2,
            stagger: 0.01,
            onComplete: () => {
                applyLanguage(currentLang);
                langLabel.textContent = currentLang === 'EN' ? 'Tanglish' : 'English';
                gsap.to('[data-i18n]', {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    stagger: 0.01,
                    ease: "power2.out"
                });
            }
        });
    });

    // Make the button floating and appear from panel 2 (About) onwards
    const aboutPanel = document.getElementById('panel-about');
    
    if (aboutPanel) {
        ScrollTrigger.create({
            trigger: aboutPanel,
            start: "top center", // Appears when About section hits middle of screen
            onEnter: () => toggleBtn.classList.add('visible'),
            onLeaveBack: () => toggleBtn.classList.remove('visible')
        });
    }
}
