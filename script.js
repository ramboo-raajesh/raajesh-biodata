// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {

    // ═══════════════════════════════════════════
    // 1. FLOATING PARTICLES
    // ═══════════════════════════════════════════
    const particlesContainer = document.getElementById("particles-container");

    function createParticle() {
        const particle = document.createElement("div");
        const isSparkle = Math.random() > 0.5;
        particle.classList.add("particle", isSparkle ? "sparkle" : "dot");

        // Random position
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";

        particlesContainer.appendChild(particle);

        // Animate using GSAP
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
            onComplete: () => {
                particle.remove();
            }
        });

        gsap.to(particle, {
            opacity: 0,
            duration: duration * 0.3,
            delay: duration * 0.7,
            ease: "power1.out",
        });
    }

    // Spawn particles at intervals
    setInterval(createParticle, 400);
    // Create initial batch
    for (let i = 0; i < 15; i++) {
        setTimeout(createParticle, i * 200);
    }


    // ═══════════════════════════════════════════
    // 2. HERO PANEL — Initial Reveal Animations
    // ═══════════════════════════════════════════
    const heroTl = gsap.timeline();

    // Image reveal via clip-path
    gsap.fromTo("#panel-hero .img-container",
        { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
        { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.5, ease: "power4.inOut" }
    );

    // Subtle zoom-out on hero image
    gsap.fromTo("#panel-hero .background-image",
        { scale: 1.3 },
        { scale: 1, duration: 2.5, ease: "power3.out" }
    );

    // Text fade-in cascade
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

    // Scrubbed text parallax
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

    // Image reveal via clip-path
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

    // Background scale
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

    // Blur overlay fade-in
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

        // Icon floats up and fades in
        if (icon) {
            quoteTl.fromTo(icon,
                { y: 40, opacity: 0, scale: 0.5 },
                { y: 0, opacity: 1, scale: 1, ease: "back.out(2)" },
                0
            );
        }

        // Text slides up and fades in
        if (text) {
            quoteTl.fromTo(text,
                { y: 60, opacity: 0 },
                { y: 0, opacity: 1, ease: "power3.out" },
                0.1
            );
        }

        // Subtle parallax — text moves slower than scroll
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

        // Label slides in
        if (label) {
            storyTl.fromTo(label,
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                0
            );
        }

        // Title wipes in with slight scale
        if (title) {
            storyTl.fromTo(title,
                { y: 50, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" },
                0.2
            );
        }

        // Paragraphs stagger in
        if (bodyPs.length > 0) {
            storyTl.fromTo(bodyPs,
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
                0.5
            );
        }

        // CTA buttons spring in (staggered)
        if (ctas.length > 0) {
            storyTl.fromTo(ctas,
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.5)" },
                0.9
            );
        }

        // Gradient background shimmer follows scroll
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
        .fromTo(".cta-emoji",
            { scale: 0, rotation: -20, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(3)" },
            0
        )
        .fromTo(".cta-title",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power4.out" },
            0.2
        )
        .fromTo(".cta-subtitle",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            0.5
        )
        .fromTo(".cta-hook",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            0.7
        )
        .fromTo(".cta-whatsapp-btn",
            { y: 40, opacity: 0, scale: 0.85 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)" },
            0.9
        );

    // Pulsing glow on WhatsApp button after reveal
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
});
