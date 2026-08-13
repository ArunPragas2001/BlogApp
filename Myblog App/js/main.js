// ==========================================
// MAIN.JS - Global Helpers & Home Page Controller
// ==========================================

const defaultBlogs = [
    {
        id: 1,
        title: "JavaScript Essentials",
        category: "Programming",
        content: "Learn the fundamentals of JavaScript and modern web scripting. Discover variables, functions, DOM manipulation, and asynchronous programming concepts.",
        image: "Assets/images/blog1.avif",
        status: "Published",
        author: "Alex Johnson",
        createdAt: "2026-08-01"
    },
    {
        id: 2,
        title: "Getting Started with HTML",
        category: "Technology",
        content: "Learn the fundamentals of HTML and build your first website structure. Understand semantic elements, forms, and accessibility best practices.",
        image: "Assets/images/blog2.avif",
        status: "Published",
        author: "Sarah Connor",
        createdAt: "2026-08-03"
    },
    {
        id: 3,
        title: "Modern CSS Tricks",
        category: "Web Design",
        content: "Improve your website designs using Flexbox, CSS Grid, custom properties, and responsive animations for state-of-the-art UI elements.",
        image: "Assets/images/blog3.avif",
        status: "Published",
        author: "Michael Scott",
        createdAt: "2026-08-05"
    }
];

const defaultUsers = [
    {
        id: 1,
        name: "Demo User",
        email: "user@example.com",
        password: "Password123!"
    }
];

// Initialize LocalStorage Data
function initStorage() {
    if (!localStorage.getItem("blogs")) {
        localStorage.setItem("blogs", JSON.stringify(defaultBlogs));
    }
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify(defaultUsers));
    }
}

// Get Blogs from LocalStorage
function getStoredBlogs() {
    initStorage();
    try {
        return JSON.parse(localStorage.getItem("blogs")) || defaultBlogs;
    } catch (e) {
        return defaultBlogs;
    }
}

// Save Blogs to LocalStorage
function saveBlogs(blogs) {
    localStorage.setItem("blogs", JSON.stringify(blogs));
}

// Get Current Logged-in User
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
        return null;
    }
}

// Global Nav UI update
function updateNav() {
    const navButtons = document.getElementById("navButtons");
    if (!navButtons) return;

    const currentUser = getCurrentUser();

    if (currentUser) {
        navButtons.innerHTML = `
            <span class="user-greeting" style="color: #64748B; font-weight: 500; font-size: 0.95rem; margin-right: 8px;">
                Hi, <strong>${escapeHTML(currentUser.name)}</strong>
            </span>
            <a href="dashboard.html" class="btn-login">Dashboard</a>
            <a href="#" id="mainLogoutBtn" class="btn-register" style="background: #EF4444; border-color: #EF4444;">Logout</a>
        `;

        const logoutBtn = document.getElementById("mainLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.removeItem("currentUser");
                window.location.reload();
            });
        }
    }
}

// Helper to escape HTML to prevent XSS
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Render Featured Blogs on Home Page
function renderHomeBlogs(categoryFilter = null) {
    const container = document.getElementById("featuredBlogsContainer");
    if (!container) return;

    const blogs = getStoredBlogs();
    const publishedBlogs = blogs.filter(b => b.status === "Published");

    let displayList = publishedBlogs;
    if (categoryFilter && categoryFilter !== "all") {
        displayList = publishedBlogs.filter(b => 
            b.category && b.category.toLowerCase() === categoryFilter.toLowerCase()
        );
    }

    if (displayList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748B;">
                <h3>No articles found in this category.</h3>
                <p>Check back later or <a href="createBlog.html" style="color: #4F46E5;">write one yourself</a>!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = displayList.map(blog => {
        const imageSrc = blog.image || "Assets/images/blog1.avif";
        return `
            <div class="blog-card">
                <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(blog.title)}" onerror="this.src='Assets/images/blog1.avif'">
                <div class="blog-card-content">
                    <span style="font-size: 0.8rem; font-weight: 600; color: #4F46E5; text-transform: uppercase; margin-bottom: 4px; display: block;">
                        ${escapeHTML(blog.category || "General")}
                    </span>
                    <h3>${escapeHTML(blog.title)}</h3>
                    <p>${escapeHTML(blog.content)}</p>
                    <button onclick="readBlogModal(${blog.id})">Read More</button>
                </div>
            </div>
        `;
    }).join("");
}

// Modal view for blog content
function readBlogModal(id) {
    const blogs = getStoredBlogs();
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    alert(`📖 ${blog.title}\nCategory: ${blog.category}\nBy: ${blog.author || "Anonymous"}\n\n${blog.content}`);
}

// Category filter interaction on index.html
function setupCategoryFilters() {
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach(card => {
        card.addEventListener("click", function (e) {
            e.preventDefault();
            const categoryName = this.querySelector("h3") ? this.querySelector("h3").innerText : "";
            
            // Scroll smoothly to featured section
            const featuredSec = document.getElementById("featured");
            if (featuredSec) {
                featuredSec.scrollIntoView({ behavior: "smooth" });
            }
            
            renderHomeBlogs(categoryName);
        });
    });
}

// Newsletter Form Handler
function setupNewsletterForm() {
    const form = document.querySelector(".newsletter-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = form.querySelector("input[type='email']");
            if (input && input.value) {
                alert(`Thank you for subscribing with ${input.value}! You'll receive our latest posts soon.`);
                input.value = "";
            }
        });
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
    initStorage();
    updateNav();
    renderHomeBlogs();
    setupCategoryFilters();
    setupNewsletterForm();
});
