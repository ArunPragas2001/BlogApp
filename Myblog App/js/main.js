var API_BASE_URL = "https://blogsphere-wtrv.onrender.com";
var API_BLOGS_URL = API_BASE_URL + "/api/blogs";
var API_SETTINGS_URL = API_BASE_URL + "/api/settings";

var cachedTerms = "Welcome to BlogSphere. By using our platform you agree to post respectful, original content and abide by our community guidelines.";
var cachedBlogs = [];

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
}

function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function resolveImageUrl(url) {
    if (!url || typeof url !== "string") return "";
    var trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.includes("localhost:5000") || trimmed.includes("localhost:8000")) {
        return trimmed.replace(/http:\/\/localhost:(5000|8000)/g, API_BASE_URL);
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
        return trimmed;
    }
    if (trimmed.startsWith("/api/images/")) {
        return API_BASE_URL + trimmed;
    }
    if (trimmed.startsWith("/")) {
        return API_BASE_URL + trimmed;
    }
    return API_BASE_URL + "/" + trimmed;
}

function updateNav() {
    var navButtons = document.getElementById("navButtons");
    var adminSettingsNavItem = document.getElementById("adminSettingsNavItem");
    var footerAdminLi = document.getElementById("footerAdminLi");
    var currentUser = getCurrentUser();

    if (currentUser && (currentUser.role === "admin" || currentUser.role === "owner")) {
        if (adminSettingsNavItem) adminSettingsNavItem.style.display = "block";
        if (footerAdminLi) footerAdminLi.style.display = "block";
    }

    if (!navButtons) return;

    if (currentUser && currentUser.name) {
        var rawAvatar = currentUser.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
        var avatarUrl = resolveImageUrl(rawAvatar);

        navButtons.innerHTML =
            '<a href="profile.html" class="nav-user-badge" id="navUserBadge">' +
            '<img src="' + esc(avatarUrl) + '" alt="avatar" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
            '<span>Hey, ' + esc(currentUser.name.split(" ")[0]) + ' 👋</span>' +
            '</a>' +
            '<a href="dashboard.html" class="btn-login" style="padding:8px 16px; font-size:0.88rem;">Dashboard</a>' +
            '<a href="#" id="mainLogoutBtn" class="btn-register" style="background:#EF4444; padding:8px 16px; font-size:0.88rem;">Logout</a>';

        var logoutBtn = document.getElementById("mainLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                showConfirmModal("Confirm Logout", "Are you sure you want to log out?", function () {
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("token");
                    showToast("Logged out successfully.", "info", 2000);
                    setTimeout(function () { window.location.reload(); }, 800);
                }, false);
            });
        }
    }
}

async function loadSiteSettings() {
    try {
        var res = await fetch(API_SETTINGS_URL);
        if (!res.ok) return;
        var config = await res.json();
        cachedTerms = config.termsOfService || cachedTerms;

        var insta = document.getElementById("footerInsta");
        var fb = document.getElementById("footerFb");
        var wa = document.getElementById("footerWa");
        var email = document.getElementById("footerEmail");
        var phone = document.getElementById("footerPhone");
        var address = document.getElementById("footerAddress");

        if (insta && config.instagramUrl) insta.href = config.instagramUrl;
        if (fb && config.facebookUrl) fb.href = config.facebookUrl;
        if (wa && config.whatsappNumber) wa.href = "https://wa.me/" + config.whatsappNumber.replace(/[^0-9]/g, "");
        if (email && config.companyEmail) email.textContent = config.companyEmail;
        if (phone && config.companyPhone) phone.textContent = config.companyPhone;
        if (address && config.companyAddress) address.textContent = config.companyAddress;
    } catch (err) {
        console.error("Site settings error:", err);
    }
}

function showTermsModal() {
    showConfirmModal("Terms of Service & Privacy Policy", cachedTerms, function () {}, false);
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
        return "";
    }
}

function openArticleReader(blogId) {
    var blog = cachedBlogs.find(function (b) { return (b._id || b.id) === blogId; });
    if (!blog) return;

    var overlay = document.getElementById("articleReaderOverlay");
    var img = document.getElementById("articleReaderImg");
    var meta = document.getElementById("articleReaderMeta");
    var titleEl = document.getElementById("articleReaderTitle");
    var contentEl = document.getElementById("articleReaderContent");

    if (!overlay) return;

    if (img) {
        if (blog.image && blog.image.trim() !== "") {
            img.style.opacity = "0";
            img.onload = function () { this.style.opacity = "1"; };
            img.onerror = function () { this.style.opacity = "1"; this.style.display = "none"; };
            img.src = resolveImageUrl(blog.image);
            img.style.display = "block";
        } else {
            img.style.display = "none";
        }
    }

    if (meta) {
        var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Author";
        var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
        var authorAvatar = resolveImageUrl(rawAvatar);
        var pubDate = formatDate(blog.createdAt);
        meta.innerHTML =
            '<span class="article-category-badge">' + esc(blog.category || "General") + '</span>' +
            '<div class="article-author-chip">' +
            '<img src="' + esc(authorAvatar) + '" alt="' + esc(authorName) + '" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
            '<span>By ' + esc(authorName) + '</span></div>' +
            (pubDate ? '<span style="font-size:0.85rem;color:#64748B;font-weight:500;display:inline-flex;align-items:center;gap:6px;"><i class="fa-regular fa-calendar-days" style="color:#4F46E5;"></i> Published: ' + esc(pubDate) + '</span>' : '');
    }

    if (titleEl) titleEl.textContent = blog.title || "";
    if (contentEl) contentEl.textContent = blog.content || "";

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeArticleReader() {
    var overlay = document.getElementById("articleReaderOverlay");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
}

window.showTermsModal = showTermsModal;
window.filterBlogs = filterBlogs;

async function renderHomeBlogs(categoryFilter) {
    var container = document.getElementById("featuredBlogsContainer");
    if (!container) return;

    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</div>';

    try {
        var response = await fetch(API_BLOGS_URL);
        var blogs = [];
        if (response.ok) blogs = await response.json();
        cachedBlogs = blogs;

        var displayList = blogs;
        if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
            displayList = blogs.filter(function (b) {
                return b.category && b.category.toLowerCase() === categoryFilter.toLowerCase();
            });
        }

        if (displayList.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><h3>No published articles found.</h3><p>Be the first to <a href="createBlog.html" style="color:#4F46E5;">write one</a>!</p></div>';
            return;
        }

        container.innerHTML = displayList.map(function (blog) {
            var blogId = blog._id || blog.id;
            var rawImage = blog.image && blog.image.trim() !== "" ? blog.image : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80";
            var imageSrc = resolveImageUrl(rawImage);
            var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Anonymous";
            var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
            var authorAvatar = resolveImageUrl(rawAvatar);
            var preview = (blog.content || "").substring(0, 120) + ((blog.content || "").length > 120 ? "…" : "");
            var pubDate = formatDate(blog.createdAt);

            return '<div class="blog-card">' +
                '<div class="blog-card-image-wrap" style="position:relative;width:100%;height:210px;background:#E2E8F0;overflow:hidden;">' +
                '<div class="blog-img-loader" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748B;font-size:1.4rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>' +
                '<img src="' + esc(imageSrc) + '" alt="' + esc(blog.title) + '" loading="lazy" style="width:100%;height:210px;object-fit:cover;opacity:0;transition:opacity 0.3s ease;" ' +
                'onload="this.style.opacity=1;var l=this.previousElementSibling;if(l)l.style.display=\'none\';" ' +
                'onerror="this.style.opacity=1;var l=this.previousElementSibling;if(l)l.style.display=\'none\';this.src=\'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80\'">' +
                '</div>' +
                '<div class="blog-card-content">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;">' +
                '<span style="font-size:0.78rem;font-weight:700;color:#4F46E5;text-transform:uppercase;letter-spacing:0.5px;">' + esc(blog.category || "General") + '</span>' +
                (pubDate ? '<span style="font-size:0.78rem;color:#64748B;font-weight:500;"><i class="fa-regular fa-calendar-days" style="margin-right:4px;"></i>' + esc(pubDate) + '</span>' : '') +
                '</div>' +
                '<h3 style="font-size:1.15rem;font-weight:700;color:#0F172A;margin-bottom:8px;line-height:1.3;">' + esc(blog.title) + '</h3>' +
                '<p class="blog-card-preview">' + esc(preview) + '</p>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
                '<img src="' + esc(authorAvatar) + '" alt="avatar" style="width:26px;height:26px;border-radius:50%;object-fit:cover;" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
                '<small style="color:#64748B;font-weight:500;">By ' + esc(authorName) + '</small>' +
                '</div>' +
                '<button class="read-more-btn" onclick="openArticleReader(\'' + blogId + '\')">' +
                '<i class="fa-solid fa-book-open"></i> Read More' +
                '</button>' +
                '</div></div>';
        }).join("");
    } catch (err) {
        console.error("Home blogs fetch error:", err);
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#EF4444;"><p>Could not load stories. Please check your connection and try again.</p></div>';
    }
}

function filterBlogs(cat) {
    var featured = document.getElementById("featured");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });
    setTimeout(function () { renderHomeBlogs(cat); }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
    updateNav();
    loadSiteSettings();
    renderHomeBlogs();

    var closeBtn = document.getElementById("articleReaderClose");
    if (closeBtn) closeBtn.addEventListener("click", closeArticleReader);

    var overlay = document.getElementById("articleReaderOverlay");
    if (overlay) {
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeArticleReader();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeArticleReader();
    });

    var newsletterForm = document.getElementById("newsletterForm");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            var input = newsletterForm.querySelector("input[type='email']");
            var submitBtn = newsletterForm.querySelector("button[type='submit']");
            if (!input || !input.value) return;

            var email = input.value.trim();
            var originalBtnHtml = submitBtn ? submitBtn.innerHTML : "Subscribe";

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subscribing...';
                }
                showToast("Subscribing...", "info");
                var res = await fetch(API_BASE_URL + "/api/subscribers/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email })
                });
                var data = await res.json();
                if (res.ok) {
                    showToast(data.message || "Thank you for subscribing!", "success", 4000);
                    input.value = "";
                } else {
                    showToast(data.message || "Subscription failed", "error");
                }
            } catch (err) {
                showToast("Error connecting to server. Please try again.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }
});

window.openArticleReader = openArticleReader;
window.resolveImageUrl = resolveImageUrl;
