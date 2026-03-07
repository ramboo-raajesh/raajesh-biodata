// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {

    // 1. Initial Reveal Animations for Intro Section (Panel 1)
    const introTl = gsap.timeline();

    // Animate the image container for a "reveal" effect from Colordrunk
    gsap.fromTo("#panel-1 .img-container",
        { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
        { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.5, ease: "power4.inOut" }
    );

    // Subtle scale down on the image inside for a premium feel
    gsap.fromTo("#panel-1 .background-image",
        { scale: 1.2 },
        { scale: 1, duration: 2, ease: "power3.out" }
    );

    // Fade in text and blur overlay
    introTl.fromTo("#panel-1 .heading",
        { y: 50, opacity: 0, autoAlpha: 0 },
        { y: 0, opacity: 1, autoAlpha: 1, duration: 1.2, ease: "power4.out" },
        "-=0.5"
    )
        .fromTo("#panel-1 .subheading",
            { y: 30, opacity: 0, autoAlpha: 0 },
            { y: 0, opacity: 1, autoAlpha: 1, duration: 1, ease: "power3.out" },
            "-=0.8"
        )
        .fromTo("#panel-1 .blur-overlay",
            { opacity: 0 },
            { opacity: 1, duration: 1.5, ease: "power2.inOut" },
            "-=1"
        )
        .fromTo(".scroll-instruction",
            { opacity: 0, autoAlpha: 0 },
            { opacity: 1, autoAlpha: 1, duration: 1, ease: "fade" },
            "-=0.5"
        );

    // 2. Vertical Stick Drawer Animations with Colordrunk vibe
    const panels = gsap.utils.toArray(".drawer-panel");
    panels.forEach((panel, i) => {
        if (i === 0) return; // Skip intro panel initial scrub/reveal as we animated it already via timeline

        // --- A. The Scroll Scrub Timeline ---
        // This handles text parallax tied precisely to the scroll position
        let scrubTl = gsap.timeline({
            scrollTrigger: {
                trigger: panel,
                start: "top 80%",
                end: "top 10%",
                scrub: 1, // Smooth scrub
            }
        });

        const leftText = panel.querySelector(".text-move-left");
        const rightText = panel.querySelector(".text-move-right");

        // Target buttons individually for staggered scrub 
        const buttons = panel.querySelectorAll(".social-btn");

        if (leftText) scrubTl.fromTo(leftText, { x: -80, opacity: 0 }, { x: 0, opacity: 1 }, 0);
        if (rightText) scrubTl.fromTo(rightText, { x: 80, opacity: 0 }, { x: 0, opacity: 1 }, 0);

        if (buttons.length > 0) {
            scrubTl.fromTo(buttons,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.15 },
                0
            );
        }

        // Make the background image scale down slightly as panel covers the screen (Scrubbed)
        const bg = panel.querySelector(".background-image");
        if (bg) {
            gsap.fromTo(bg,
                { scale: 1.15 },
                {
                    scale: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: panel,
                        start: "top 100%",
                        end: "top 0%",
                        scrub: true
                    }
                }
            );
        }

        // --- B. The Triggered Reveal Animations ---
        // These happen once as the panel enters, independent of scrubbing

        // 1. Reveal the image via clip-path
        const imgContainer = panel.querySelector(".img-container");
        if (imgContainer) {
            gsap.fromTo(imgContainer,
                { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
                {
                    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    duration: 1.2,
                    ease: "power3.inOut",
                    scrollTrigger: {
                        trigger: panel,
                        start: "top 60%", // Trigger when panel is far enough up
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // 2. Fade in the blur overlay gracefully
        const overlay = panel.querySelector(".blur-overlay");
        if (overlay) {
            gsap.fromTo(overlay,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 1.5,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: panel,
                        start: "top 40%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    });

    // --- Fullscreen Mode on Mobile ---
    // Hide status bar and navigation bar upon first user interaction
    const enterFullscreen = () => {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Fullscreen error: ${err.message}`);
            });
        }
    };

    // Attach to first interaction since browsers block auto-fullscreen
    document.addEventListener('click', enterFullscreen, { once: true });
    document.addEventListener('touchstart', enterFullscreen, { once: true });
});
