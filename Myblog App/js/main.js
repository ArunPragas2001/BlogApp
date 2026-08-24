var API_BASE_URL = (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:" ||
    window.location.hostname === ""
))
    ? (window.location.port === "5000" ? window.location.origin : "http://localhost:5000")
    : "https://blogsphere-wtrv.onrender.com";
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

// Check if currentUser or guest has liked a blog
function checkIsBlogLiked(blog) {
    if (!blog) return false;
    var currentUser = getCurrentUser();
    var blogId = String(blog._id || blog.id);

    if (currentUser) {
        var userId = String(currentUser.id || currentUser._id);
        if (blog.likes && Array.isArray(blog.likes)) {
            return blog.likes.some(function (l) {
                return String(l._id || l.id || l) === userId;
            });
        }
    }
    var guestLikes = JSON.parse(localStorage.getItem("guest_liked_blogs") || "[]");
    return guestLikes.includes(blogId);
}

function openArticleReader(blogId) {
    var blog = cachedBlogs.find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) return;

    var overlay = document.getElementById("articleReaderOverlay");
    var img = document.getElementById("articleReaderImg");
    var meta = document.getElementById("articleReaderMeta");
    var titleEl = document.getElementById("articleReaderTitle");
    var contentEl = document.getElementById("articleReaderContent");

    if (!overlay) return;

    // Check if blog has video
    var hasVideo = blog.video && blog.video.trim() !== "";
    var videoSrc = hasVideo ? resolveImageUrl(blog.video) : "";

    var cardBody = document.querySelector(".article-reader-body");
    var videoContainer = document.getElementById("articleReaderVideoContainer");

    if (hasVideo) {
        if (img) img.style.display = "none";
        if (!videoContainer && cardBody) {
            videoContainer = document.createElement("div");
            videoContainer.id = "articleReaderVideoContainer";
            videoContainer.style.cssText = "width:100%;margin-bottom:24px;border-radius:16px;overflow:hidden;background:#000;box-shadow:0 8px 24px rgba(0,0,0,0.2);";
            cardBody.parentNode.insertBefore(videoContainer, cardBody);
        }
        if (videoContainer) {
            videoContainer.style.display = "block";
            videoContainer.innerHTML =
                '<video id="articleReaderVideo" src="' + esc(videoSrc) + '" controls autoplay muted loop playsinline style="width:100%;max-height:380px;display:block;background:#000;border-radius:16px 16px 0 0;"></video>';
        }
    } else {
        if (videoContainer) videoContainer.style.display = "none";
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

    // Render Share & Like Toolbar inside Article Reader
    var shareBar = document.getElementById("articleReaderShareBar");
    if (!shareBar && meta && meta.parentNode) {
        shareBar = document.createElement("div");
        shareBar.id = "articleReaderShareBar";
        shareBar.className = "article-share-bar";
        meta.parentNode.insertBefore(shareBar, meta.nextSibling);
    }
    if (shareBar) {
        var isLiked = checkIsBlogLiked(blog);
        var likesCount = blog.likesCount || (blog.likes ? blog.likes.length : 0);
        var bTitleEsc = esc(blog.title || "").replace(/'/g, "\\'");

        shareBar.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<button class="share-chip like ' + (isLiked ? 'liked' : '') + '" data-like-blog-id="' + blogId + '" onclick="handleToggleLike(\'' + blogId + '\', this, event)">' +
            '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i> ' +
            '<span class="like-count-num">' + (likesCount > 0 ? likesCount + ' Likes' : 'Like') + '</span>' +
            '</button>' +
            '</div>' +
            '<div class="article-share-chips">' +
            '<span class="article-share-label"><i class="fa-solid fa-share-nodes" style="color:#4F46E5;"></i> Share:</span>' +
            '<button class="share-chip wa" onclick="BlogShare.whatsapp(\'' + blogId + '\', \'' + bTitleEsc + '\')"><i class="fa-brands fa-whatsapp"></i></button>' +
            '<button class="share-chip insta" onclick="BlogShare.instagram(\'' + blogId + '\', \'' + bTitleEsc + '\')"><i class="fa-brands fa-instagram"></i></button>' +
            '<button class="share-chip fb" onclick="BlogShare.facebook(\'' + blogId + '\')"><i class="fa-brands fa-facebook-f"></i></button>' +
            '<button class="share-chip copy" onclick="BlogShare.copy(\'' + blogId + '\', this)"><i class="fa-regular fa-copy"></i></button>' +
            '<button class="share-chip more" onclick="BlogShare.openModal(\'' + blogId + '\')"><i class="fa-solid fa-ellipsis"></i> More</button>' +
            '</div>' +
            '</div>';
    }

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeArticleReader() {
    var overlay = document.getElementById("articleReaderOverlay");
    var vid = document.getElementById("articleReaderVideo");
    if (vid) {
        vid.pause();
        vid.src = "";
    }
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
}

window.showTermsModal = showTermsModal;
window.filterBlogs = filterBlogs;
window.openArticleReader = openArticleReader;

// Like handler for any blog
async function handleToggleLike(blogId, btnEl, event) {
    if (event) event.stopPropagation();

    var blog = (cachedBlogs || []).find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) blog = { _id: blogId, likesCount: 0, likes: [] };

    var currentUser = getCurrentUser();
    var isLiked = checkIsBlogLiked(blog);

    var likesCount = blog.likesCount || (blog.likes ? blog.likes.length : 0);
    var newIsLiked = !isLiked;
    var newCount = newIsLiked ? (likesCount + 1) : Math.max(0, likesCount - 1);

    // Update in-memory model
    blog.likesCount = newCount;
    if (currentUser) {
        if (!blog.likes) blog.likes = [];
        var userId = String(currentUser.id || currentUser._id);
        if (newIsLiked) {
            if (!blog.likes.some(function (l) { return String(l._id || l.id || l) === userId; })) {
                blog.likes.push(userId);
            }
        } else {
            blog.likes = blog.likes.filter(function (l) { return String(l._id || l.id || l) !== userId; });
        }
    } else {
        var guestLikes = JSON.parse(localStorage.getItem("guest_liked_blogs") || "[]");
        if (newIsLiked) {
            if (!guestLikes.includes(String(blogId))) guestLikes.push(String(blogId));
        } else {
            guestLikes = guestLikes.filter(function (id) { return id !== String(blogId); });
        }
        localStorage.setItem("guest_liked_blogs", JSON.stringify(guestLikes));
    }

    // Sync button state visually across page immediately
    updateLikeButtonUI(blogId, newIsLiked, newCount);

    var token = localStorage.getItem("token");
    if (token) {
        try {
            var res = await fetch(API_BASE_URL + "/api/blogs/" + blogId + "/like", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });
            if (res.ok) {
                var data = await res.json();
                blog.likesCount = data.likesCount;
                blog.likes = data.likes;
                updateLikeButtonUI(blogId, data.isLiked, data.likesCount);
            }
        } catch (err) {
            console.warn("Like API error:", err);
        }
    } else {
        if (typeof showToast === "function") {
            showToast(newIsLiked ? "❤️ Post liked!" : "Unliked post", "info", 1500);
        }
    }

    try {
        localStorage.setItem("cached_home_blogs", JSON.stringify(cachedBlogs));
    } catch (e) {}
}
window.handleToggleLike = handleToggleLike;

function updateLikeButtonUI(blogId, isLiked, count) {
    var targets = document.querySelectorAll('[data-like-blog-id="' + blogId + '"]');
    targets.forEach(function (btn) {
        if (isLiked) {
            btn.classList.add("liked");
        } else {
            btn.classList.remove("liked");
        }
        var icon = btn.querySelector("i");
        if (icon) {
            icon.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        }
        var countEl = btn.querySelector(".like-count") || btn.querySelector(".like-count-num");
        if (countEl) {
            if (countEl.classList.contains("like-count-num")) {
                countEl.textContent = count > 0 ? (count + ' Likes') : 'Like';
            } else {
                countEl.textContent = count > 0 ? count : '';
            }
        }
    });
}
function triggerInstaHeartPop(containerEl) {
    if (!containerEl) return;
    var heart = containerEl.querySelector(".insta-big-heart-overlay");
    if (!heart) {
        heart = document.createElement("i");
        heart.className = "fa-solid fa-heart insta-big-heart-overlay";
        containerEl.appendChild(heart);
    }
    heart.classList.remove("animate");
    void heart.offsetWidth;
    heart.classList.add("animate");
}
window.triggerInstaHeartPop = triggerInstaHeartPop;

function handleInstagramDblClick(containerEl, blogId, event) {
    triggerInstaHeartPop(containerEl);
    var blog = (cachedBlogs || []).find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) blog = { _id: blogId, likesCount: 0, likes: [] };

    var isLiked = checkIsBlogLiked(blog);
    if (!isLiked) {
        handleToggleLike(blogId, null, event);
    }
}
window.handleInstagramDblClick = handleInstagramDblClick;

function renderBlogCardsList(blogsList, container) {
    if (!container) return;

    if (!blogsList || blogsList.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><h3>No published articles found.</h3><p>Be the first to <a href="createBlog.html" style="color:#4F46E5;">write one</a>!</p></div>';
        return;
    }

    container.innerHTML = blogsList.map(function (blog) {
        var blogId = blog._id || blog.id;
        var rawImage = blog.image && blog.image.trim() !== "" ? blog.image : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80";
        var imageSrc = resolveImageUrl(rawImage);
        var hasVideo = blog.video && blog.video.trim() !== "";
        var videoSrc = hasVideo ? resolveImageUrl(blog.video) : "";
        var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Anonymous";
        var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
        var authorAvatar = resolveImageUrl(rawAvatar);
        var preview = (blog.content || "").substring(0, 120) + ((blog.content || "").length > 120 ? "…" : "");
        var pubDate = formatDate(blog.createdAt);
        var isLiked = checkIsBlogLiked(blog);
        var likesCount = blog.likesCount || (blog.likes ? blog.likes.length : 0);

        var mediaHtml;
        if (hasVideo) {
            mediaHtml =
                '<div class="blog-card-image-wrap" ondblclick="handleInstagramDblClick(this, \'' + blogId + '\', event)" style="position:relative;width:100%;background:#0F172A;overflow:hidden;border-radius:16px 16px 0 0;cursor:pointer;">' +
                '<video autoplay muted loop playsinline preload="auto" style="width:100%;max-height:240px;display:block;background:#000;object-fit:cover;" poster="' + esc(imageSrc) + '">' +
                '<source src="' + esc(videoSrc) + '">' +
                'Your browser does not support video.' +
                '</video>' +
                '<div style="position:absolute;top:10px;left:10px;background:rgba(99,102,241,0.9);color:#fff;font-size:0.72rem;padding:3px 9px;border-radius:20px;font-weight:700;display:flex;align-items:center;gap:5px;backdrop-filter:blur(4px);pointer-events:none;"><i class="fa-solid fa-video"></i> Video</div>' +
                '</div>';
        } else {
            mediaHtml =
                '<div class="blog-card-image-wrap" ondblclick="handleInstagramDblClick(this, \'' + blogId + '\', event)" style="position:relative;width:100%;height:210px;background:#E2E8F0;overflow:hidden;cursor:pointer;">' +
                '<div class="blog-img-loader" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748B;font-size:1.4rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>' +
                '<img src="' + esc(imageSrc) + '" alt="' + esc(blog.title) + '" loading="lazy" style="width:100%;height:210px;object-fit:cover;opacity:0;transition:opacity 0.3s ease;" ' +
                'onload="this.style.opacity=1;var l=this.previousElementSibling;if(l)l.style.display=\'none\';" ' +
                'onerror="this.style.opacity=1;var l=this.previousElementSibling;if(l)l.style.display=\'none\';this.src=\'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80\'">' +
                '</div>';
        }

        return '<div class="blog-card">' +
            mediaHtml +
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
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid #F1F5F9;">' +
            '<button class="read-more-btn" onclick="openArticleReader(\'' + blogId + '\')">' +
            '<i class="fa-solid fa-book-open"></i> Read' +
            '</button>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '<button class="insta-heart-btn ' + (isLiked ? 'liked' : '') + '" data-like-blog-id="' + blogId + '" onclick="handleToggleLike(\'' + blogId + '\', this, event)" title="Like Post">' +
            '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
            '<span class="like-count">' + (likesCount > 0 ? likesCount : '') + '</span>' +
            '</button>' +
            '<button class="share-card-btn" onclick="BlogShare.openModal(\'' + blogId + '\'); event.stopPropagation();" title="Share Article">' +
            '<i class="fa-solid fa-share-nodes"></i> Share' +
            '</button>' +
            '</div>' +
            '</div>' +
            '</div></div>';
    }).join("");
}

// Instant Stale-While-Revalidate blog loading
async function renderHomeBlogs(categoryFilter) {
    var container = document.getElementById("featuredBlogsContainer");
    if (!container) return;

    // 1. Instant cache load from localStorage (0ms rendering)
    try {
        var localData = localStorage.getItem("cached_home_blogs");
        if (localData) {
            var parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedBlogs = parsed;
                var displayList = cachedBlogs;
                if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
                    displayList = cachedBlogs.filter(function (b) {
                        return b.category && b.category.toLowerCase() === categoryFilter.toLowerCase();
                    });
                }
                renderBlogCardsList(displayList, container);
                if (window.hidePageLoader) window.hidePageLoader();
            }
        }
    } catch (e) {}

    if (cachedBlogs.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Loading stories...</div>';
    }

    // 2. Background fetch with 3.5s timeout + fallback
    try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, 3500);

        var blogs = [];
        var response;
        try {
            response = await fetch(API_BLOGS_URL, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) blogs = await response.json();
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            // Fallback attempt to alternate URL if default API hangs or fails
            var fallbackUrl = API_BASE_URL.includes("localhost")
                ? "https://blogsphere-wtrv.onrender.com/api/blogs"
                : "http://localhost:5000/api/blogs";
            try {
                var fallbackRes = await fetch(fallbackUrl);
                if (fallbackRes.ok) blogs = await fallbackRes.json();
            } catch (err2) {
                console.warn("Fallback fetch error:", err2);
            }
        }

        if (Array.isArray(blogs) && blogs.length > 0) {
            cachedBlogs = blogs;
            try {
                localStorage.setItem("cached_home_blogs", JSON.stringify(blogs));
            } catch (e) {}

            var displayList = blogs;
            if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
                displayList = blogs.filter(function (b) {
                    return b.category && b.category.toLowerCase() === categoryFilter.toLowerCase();
                });
            }
            renderBlogCardsList(displayList, container);
        }
        checkDeepLinkArticle();
    } catch (err) {
        console.error("Home blogs fetch error:", err);
        if (cachedBlogs.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#EF4444;"><p>Could not load stories. Please check your connection and try again.</p></div>';
        }
    } finally {
        if (window.hidePageLoader) window.hidePageLoader();
    }
}

function checkDeepLinkArticle() {
    try {
        var params = new URLSearchParams(window.location.search);
        var targetId = params.get("blogId") || params.get("id");
        if (targetId) {
            setTimeout(function () {
                openArticleReader(targetId);
            }, 300);
        }
    } catch (e) {
        console.warn("Deep link parse error:", e);
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
            var input = this.querySelector("input[type='email']");
            if (!input || !input.value.trim()) return;

            try {
                var res = await fetch(API_BASE_URL + "/api/subscribers/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: input.value.trim() })
                });
                var data = await res.json();
                if (res.ok) {
                    showToast(data.message || "🎉 Subscribed successfully!", "success");
                    input.value = "";
                } else {
                    showToast(data.message || "Could not subscribe.", "error");
                }
            } catch (err) {
                console.error("Newsletter error:", err);
                showToast("Subscription failed. Please check connection.", "error");
            }
        });
    }
});
