/* =========================================================
   NAVIGATION HELPERS & PASSWORD STRENGTH UTILITIES
   ========================================================= */

(function () {
    // ─── 1. Floating Scroll Top, Bottom & Previous Page Controls ───────────
    function goBackPreviousPage() {
        if (window.history && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "index.html";
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function scrollToBottom() {
        window.scrollTo({
            top: document.documentElement.scrollHeight || document.body.scrollHeight,
            behavior: "smooth"
        });
    }

    function initFloatingNavigation() {
        if (document.getElementById("floatingNavContainer")) return;

        var navContainer = document.createElement("div");
        navContainer.id = "floatingNavContainer";
        navContainer.className = "floating-nav-container";

        // Previous Page Button
        var backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "floating-btn btn-back-page";
        backBtn.title = "Go to Previous Page";
        backBtn.setAttribute("aria-label", "Previous Page");
        backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        backBtn.onclick = goBackPreviousPage;

        // Scroll to Top Button
        var topBtn = document.createElement("button");
        topBtn.type = "button";
        topBtn.className = "floating-btn btn-scroll-top";
        topBtn.title = "Scroll to Top";
        topBtn.setAttribute("aria-label", "Scroll to Top");
        topBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        topBtn.onclick = scrollToTop;

        // Scroll to Bottom Button
        var bottomBtn = document.createElement("button");
        bottomBtn.type = "button";
        bottomBtn.className = "floating-btn btn-scroll-bottom";
        bottomBtn.title = "Scroll to Bottom";
        bottomBtn.setAttribute("aria-label", "Scroll to Bottom");
        bottomBtn.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        bottomBtn.onclick = scrollToBottom;

        // Home Page Button
        var homeBtn = document.createElement("button");
        homeBtn.type = "button";
        homeBtn.className = "floating-btn btn-home-page";
        homeBtn.title = "Go to Home Page";
        homeBtn.setAttribute("aria-label", "Home Page");
        homeBtn.innerHTML = '<i class="fa-solid fa-house"></i>';
        homeBtn.onclick = function () {
            window.location.href = "index.html";
        };

        navContainer.appendChild(homeBtn);
        navContainer.appendChild(backBtn);
        navContainer.appendChild(topBtn);
        navContainer.appendChild(bottomBtn);
        document.body.appendChild(navContainer);
    }

    // ─── 2. Strong Password Generator & Strength Meter ─────────────────────
    function generateStrongPassword(length) {
        length = length || 12;
        var uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        var lowercase = "abcdefghjkmnpqrstuvwxyz";
        var numbers = "23456789";
        var symbols = "!@#$%^&*_-+=";

        var allChars = uppercase + lowercase + numbers + symbols;
        var password = "";

        // Guarantee at least one of each character category
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        password += symbols.charAt(Math.floor(Math.random() * symbols.length));

        for (var i = 4; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Shuffle characters
        return password.split("").sort(function () { return 0.5 - Math.random(); }).join("");
    }

    function evaluatePasswordStrength(password) {
        if (!password) {
            return { score: 0, label: "Enter a password", color: "#94A3B8", width: "0%" };
        }

        var score = 0;
        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (score <= 1) {
            return { score: 1, label: "Weak - Add numbers & letters", color: "#EF4444", width: "25%" };
        } else if (score === 2 || score === 3) {
            return { score: 2, label: "Fair - Add symbols or uppercase", color: "#F59E0B", width: "50%" };
        } else if (score === 4) {
            return { score: 3, label: "Good - Strong security", color: "#3B82F6", width: "75%" };
        } else {
            return { score: 4, label: "Very Strong - Excellent password! 🔒", color: "#10B981", width: "100%" };
        }
    }

    function setupPasswordStrengthMeter(passwordInputId, containerId, confirmInputId) {
        var input = document.getElementById(passwordInputId);
        var container = document.getElementById(containerId);
        if (!input || !container) return;

        container.className = "password-strength-container";
        container.innerHTML =
            '<div class="strength-bar-track"><div class="strength-bar-fill" id="' + containerId + '_fill"></div></div>' +
            '<div class="strength-meta-row">' +
            '<span class="strength-label" id="' + containerId + '_label">Password Strength</span>' +
            '</div>';

        var fillEl = document.getElementById(containerId + "_fill");
        var labelEl = document.getElementById(containerId + "_label");

        function updateMeter() {
            var val = input.value;
            var res = evaluatePasswordStrength(val);
            if (fillEl) {
                fillEl.style.width = res.width;
                fillEl.style.backgroundColor = res.color;
            }
            if (labelEl) {
                labelEl.textContent = res.label;
                labelEl.style.color = res.color;
            }
        }

        input.addEventListener("input", updateMeter);
    }

    // Expose globals
    window.goBackPreviousPage = goBackPreviousPage;
    window.scrollToTop = scrollToTop;
    window.scrollToBottom = scrollToBottom;
    window.generateStrongPassword = generateStrongPassword;
    window.evaluatePasswordStrength = evaluatePasswordStrength;
    window.setupPasswordStrengthMeter = setupPasswordStrengthMeter;

    document.addEventListener("DOMContentLoaded", function () {
        initFloatingNavigation();
        initMobileNav();
    });

    // ─── 3. Mobile Navigation (Hamburger Menu) ───────────────────────────────
    function initMobileNav() {
        document.querySelectorAll(".navbar").forEach(function (navbar) {
            if (navbar.querySelector(".nav-toggle")) return;

            var toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "nav-toggle";
            toggle.setAttribute("aria-label", "Toggle navigation menu");
            toggle.setAttribute("aria-expanded", "false");
            toggle.innerHTML =
                '<span class="nav-toggle-bar"></span>' +
                '<span class="nav-toggle-bar"></span>' +
                '<span class="nav-toggle-bar"></span>';

            var logo = navbar.querySelector(".logo");
            if (logo) {
                logo.insertAdjacentElement("afterend", toggle);
            } else {
                navbar.prepend(toggle);
            }

            toggle.addEventListener("click", function (e) {
                e.stopPropagation();
                var isOpen = navbar.classList.toggle("nav-open");
                toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                document.body.classList.toggle("nav-menu-open", isOpen);
            });

            navbar.querySelectorAll(".nav-links a, .nav-buttons a, .nav-buttons button").forEach(function (link) {
                link.addEventListener("click", function () {
                    navbar.classList.remove("nav-open");
                    toggle.setAttribute("aria-expanded", "false");
                    document.body.classList.remove("nav-menu-open");
                });
            });
        });

        document.addEventListener("click", function (e) {
            if (e.target.closest(".navbar")) return;
            document.querySelectorAll(".navbar.nav-open").forEach(function (navbar) {
                navbar.classList.remove("nav-open");
                var btn = navbar.querySelector(".nav-toggle");
                if (btn) btn.setAttribute("aria-expanded", "false");
            });
            document.body.classList.remove("nav-menu-open");
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 992) {
                document.querySelectorAll(".navbar.nav-open").forEach(function (navbar) {
                    navbar.classList.remove("nav-open");
                    var btn = navbar.querySelector(".nav-toggle");
                    if (btn) btn.setAttribute("aria-expanded", "false");
                });
                document.body.classList.remove("nav-menu-open");
            }
        });
    }

    // ─── 4. Global Full-Page Preloader / Loading Window ─────────────────────
    function initGlobalPageLoader() {
        var existing = document.getElementById("globalPageLoader");
        if (existing) return existing;

        var loader = document.createElement("div");
        loader.id = "globalPageLoader";
        loader.innerHTML =
            '<div class="page-loader-card">' +
            '<div class="page-loader-spinner-wrap">' +
            '<div class="page-loader-ring-outer"></div>' +
            '<div class="page-loader-ring"></div>' +
            '<div class="page-loader-logo-icon"><i class="fa-solid fa-feather-pointed"></i></div>' +
            '</div>' +
            '<div class="page-loader-brand">Blog<span>Sphere</span></div>' +
            '<div class="page-loader-text" id="pageLoaderText">Loading fresh stories & insights...</div>' +
            '<div class="page-loader-progress-track">' +
            '<div class="page-loader-progress-bar"></div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(loader);
        return loader;
    }

    function showPageLoader(msg) {
        var loader = document.getElementById("globalPageLoader") || initGlobalPageLoader();
        var txt = document.getElementById("pageLoaderText");
        if (txt && msg) txt.textContent = msg;
        loader.classList.remove("loader-hidden");
    }

    function hidePageLoader() {
        var loader = document.getElementById("globalPageLoader");
        if (!loader) return;
        loader.classList.add("loader-hidden");
        setTimeout(function () {
            if (loader.classList.contains("loader-hidden")) {
                loader.style.display = "none";
            }
        }, 450);
    }

    window.showPageLoader = showPageLoader;
    window.hidePageLoader = hidePageLoader;

    document.addEventListener("DOMContentLoaded", function () {
        initGlobalPageLoader();
    });

    // Auto-dismiss loader when all window assets & data finish loading
    window.addEventListener("load", function () {
        setTimeout(function () {
            hidePageLoader();
        }, 300);
    });

    // Safety fallback: ensure loader never blocks user for more than 4 seconds
    setTimeout(function () {
        hidePageLoader();
    }, 4000);
})();
