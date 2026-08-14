(function () {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    document.addEventListener("DOMContentLoaded", function () {
        injectThemeToggleBtn();
    });

    function injectThemeToggleBtn() {
        if (document.getElementById("themeToggleBtn")) return;

        const navLinks = document.querySelector(".nav-links") || document.querySelector(".global-nav-links") || document.querySelector(".navbar");
        if (!navLinks) return;

        const toggleBtn = document.createElement("button");
        toggleBtn.id = "themeToggleBtn";
        toggleBtn.className = "theme-toggle-btn";
        toggleBtn.setAttribute("title", "Toggle Dark / Light Mode");

        const isDark = document.body.classList.contains("dark-mode");
        toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';

        toggleBtn.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            const nowDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme", nowDark ? "dark" : "light");
            this.innerHTML = nowDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            if (window.showToast) {
                window.showToast(nowDark ? "🌙 Night Mode Activated" : "☀️ Bright Mode Activated", "info");
            }
        });

        if (navLinks.tagName === "UL") {
            const li = document.createElement("li");
            li.appendChild(toggleBtn);
            navLinks.appendChild(li);
        } else {
            navLinks.appendChild(toggleBtn);
        }
    }
})();
