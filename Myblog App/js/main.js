const API_BLOGS_URL = "http://localhost:5000/api/blogs";
const API_SETTINGS_URL = "http://localhost:5000/api/settings";

let cachedTerms = "Welcome to BlogSphere. By using our platform, you agree to post respectful content and adhere to our terms.";

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
        return null;
    }
}

function updateNav() {
    const navButtons = document.getElementById("navButtons");
    const adminSettingsNav = document.getElementById("adminSettingsNav");
    const footerAdminSettingsLink = document.getElementById("footerAdminSettingsLink");

    const currentUser = getCurrentUser();

    if (currentUser && (currentUser.role === "admin" || currentUser.role === "owner")) {
        if (adminSettingsNav) adminSettingsNav.style.display = "block";
        if (footerAdminSettingsLink) footerAdminSettingsLink.style.display = "block";
    }

    if (navButtons && currentUser && currentUser.name) {
        const avatarUrl = currentUser.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
        navButtons.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <a href="profile.html" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #1E293B; font-weight: 500;">
                    <img src="${escapeHTML(avatarUrl)}" alt="Avatar" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #4F46E5;">
                    <span style="font-size: 0.95rem; font-weight: 600; color: inherit;">Hey, <strong>${escapeHTML(currentUser.name)}</strong></span>
                </a>
                <a href="dashboard.html" class="btn-login" style="padding: 8px 16px;">Dashboard</a>
                <a href="#" id="mainLogoutBtn" class="btn-register" style="background: #EF4444; border-color: #EF4444; padding: 8px 16px;">Logout</a>
            </div>
        `;

        const logoutBtn = document.getElementById("mainLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                showConfirmModal(
                    "Confirm Logout",
                    "Are you sure you want to log out?",
                    () => {
                        localStorage.removeItem("currentUser");
                        localStorage.removeItem("token");
                        showToast("Logged out successfully.", "info");
                        setTimeout(() => window.location.reload(), 600);
                    },
                    false
                );
            });
        }
    }
}

async function loadSiteSettings() {
    try {
        const res = await fetch(API_SETTINGS_URL);
        if (res.ok) {
            const config = await res.json();
            cachedTerms = config.termsOfService || cachedTerms;

            const insta = document.getElementById("footerInsta");
            const fb = document.getElementById("footerFb");
            const wa = document.getElementById("footerWa");
            const email = document.getElementById("footerEmail");
            const phone = document.getElementById("footerPhone");
            const address = document.getElementById("footerAddress");

            if (insta && config.instagramUrl) insta.href = config.instagramUrl;
            if (fb && config.facebookUrl) fb.href = config.facebookUrl;
            if (wa && config.whatsappNumber) wa.href = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`;
            if (email && config.companyEmail) email.textContent = config.companyEmail;
            if (phone && config.companyPhone) phone.textContent = config.companyPhone;
            if (address && config.companyAddress) address.textContent = config.companyAddress;
        }
    } catch (err) {
        console.error("Site settings error:", err);
    }
}

function showTermsModal() {
    showConfirmModal("📄 Terms of Service & Privacy Policy", cachedTerms, () => {}, false);
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function renderHomeBlogs(categoryFilter = null) {
    const container = document.getElementById("featuredBlogsContainer");
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748B;">
            <p><i class="fa-solid fa-spinner fa-spin"></i> Loading stories from MongoDB...</p>
        </div>
    `;

    try {
        const response = await fetch(API_BLOGS_URL);
        let blogs = [];
        if (response.ok) {
            blogs = await response.json();
        }

        let displayList = blogs;
        if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
            displayList = blogs.filter(b => 
                b.category && b.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        if (displayList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748B;">
                    <h3>No published articles found in this category.</h3>
                    <p>Be the first to <a href="createBlog.html" style="color: #4F46E5;">write one yourself</a>!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = displayList.map(blog => {
            const imageSrc = blog.image || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80";
            const authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Anonymous";
            const authorAvatar = blog.author && blog.author.profilePic ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

            return `
                <div class="blog-card">
                    <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(blog.title)}" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80'">
                    <div class="blog-card-content">
                        <span style="font-size: 0.8rem; font-weight: 600; color: #4F46E5; text-transform: uppercase; margin-bottom: 4px; display: block;">
                            ${escapeHTML(blog.category || "General")}
                        </span>
                        <h3>${escapeHTML(blog.title)}</h3>
                        <p>${escapeHTML(blog.content)}</p>
                        
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                            <img src="${escapeHTML(authorAvatar)}" alt="Author Avatar" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                            <small style="color: #64748B; font-weight: 500;">By ${escapeHTML(authorName)}</small>
                        </div>

                        <button onclick="readBlogModal('${escapeHTML(blog.title).replace(/'/g, "\\'")}', '${escapeHTML(blog.content).replace(/'/g, "\\'")}', '${escapeHTML(authorName).replace(/'/g, "\\'")}')">Read More</button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Home blogs fetch error:", err);
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #EF4444;">
                <p>Could not load stories. Ensure backend server is running on http://localhost:5000</p>
            </div>
        `;
    }
}

function readBlogModal(title, content, author) {
    showConfirmModal(`📖 ${title}`, `By ${author || 'Anonymous'}\n\n${content}`, () => {}, false);
}

window.readBlogModal = readBlogModal;
window.renderHomeBlogs = renderHomeBlogs;
window.showTermsModal = showTermsModal;

function setupCategoryFilters() {
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach(card => {
        card.addEventListener("click", function (e) {
            e.preventDefault();
            const categoryName = this.querySelector("h3") ? this.querySelector("h3").innerText : "";
            
            const featuredSec = document.getElementById("featured");
            if (featuredSec) {
                featuredSec.scrollIntoView({ behavior: "smooth" });
            }
            
            renderHomeBlogs(categoryName);
        });
    });
}

function setupNewsletterForm() {
    const form = document.querySelector(".newsletter-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = form.querySelector("input[type='email']");
            if (input && input.value) {
                showToast(`Thank you for subscribing with ${input.value}!`, "success");
                input.value = "";
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    updateNav();
    loadSiteSettings();
    renderHomeBlogs();
    setupCategoryFilters();
    setupNewsletterForm();
});
