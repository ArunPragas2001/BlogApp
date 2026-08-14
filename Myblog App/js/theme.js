(function () {
    var savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-mode-pre");
        document.body && document.body.classList.add("dark-mode");
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
        }
        injectThemeToggleAndProfile();
    });

    function injectThemeToggleAndProfile() {
        if (document.getElementById("themeToggleBtn")) return;

        var navbar = document.querySelector(".navbar");
        var globalHeader = document.querySelector(".global-header");

        var headerEl = navbar || globalHeader;
        if (!headerEl) return;

        var toggleBtn = document.createElement("button");
        toggleBtn.id = "themeToggleBtn";
        toggleBtn.className = "theme-toggle-btn";
        toggleBtn.setAttribute("title", "Toggle Dark / Light Mode");
        toggleBtn.setAttribute("aria-label", "Toggle theme");

        var isDark = document.body.classList.contains("dark-mode");
        toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';

        toggleBtn.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            var nowDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme", nowDark ? "dark" : "light");
            this.innerHTML = nowDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            if (window.showToast) {
                window.showToast(nowDark ? "🌙 Night Mode" : "☀️ Bright Mode", "info", 2000);
            }
        });

        if (navbar) {
            var logo = navbar.querySelector(".logo");
            if (logo && logo.parentNode === navbar) {
                navbar.insertBefore(toggleBtn, logo.nextSibling);
            } else {
                navbar.prepend(toggleBtn);
            }
        } else if (globalHeader) {
            var glLogo = globalHeader.querySelector(".logo");
            if (glLogo && glLogo.parentNode === globalHeader) {
                globalHeader.insertBefore(toggleBtn, glLogo.nextSibling);
            } else {
                globalHeader.prepend(toggleBtn);
            }
        }
    }
})();
