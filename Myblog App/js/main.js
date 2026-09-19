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
var activeAuthorFilter = null;
var activeCategoryFilter = "all";

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
}

function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

        var xLink = document.getElementById("footerX");
        var insta = document.getElementById("footerInsta");
        var fb = document.getElementById("footerFb");
        var wa = document.getElementById("footerWa");
        var email = document.getElementById("footerEmail");
        var phone = document.getElementById("footerPhone");
        var address = document.getElementById("footerAddress");

        if (xLink && (config.twitterUrl || config.xUrl)) {
            xLink.href = config.twitterUrl || config.xUrl;
        } else if (xLink) {
            xLink.href = "https://x.com";
        }
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

// ─── Share Modal Utilities ───────────────────────────────────────────────────
function openShareModal(options) {
    var modal = document.getElementById("globalShareModal");
    var titleEl = document.getElementById("shareModalTitle");
    var subEl = document.getElementById("shareModalSubtitle");
    var urlInput = document.getElementById("shareDirectUrlInput");
    var linkX = document.getElementById("shareLinkX");
    var linkWa = document.getElementById("shareLinkWhatsApp");
    var linkFb = document.getElementById("shareLinkFacebook");
    var linkLi = document.getElementById("shareLinkLinkedIn");

    if (!modal) return;

    options = options || {};
    var type = options.type || "article"; // 'author' or 'article'
    var title = options.title || (type === "author" ? "Author Profile on BlogSphere" : "Blog Article on BlogSphere");
    var authorName = options.authorName || "an Author";
    var shareUrl = options.url || window.location.href;
    
    // Ensure full absolute URL
    if (shareUrl.startsWith("/") || shareUrl.startsWith("index.html") || !shareUrl.startsWith("http")) {
        shareUrl = window.location.origin + (window.location.pathname.replace(/\/[^/]*$/, "/")) + shareUrl.replace(/^\//, "");
    }

    if (titleEl) {
        titleEl.textContent = type === "author" ? "Share Author Profile" : "Share Article";
    }
    if (subEl) {
        subEl.textContent = type === "author" 
            ? "Share " + authorName + "'s articles and profile with fans."
            : "Share \"" + title + "\" with friends and followers.";
    }
    if (urlInput) {
        urlInput.value = shareUrl;
    }

    var shareText = type === "author"
        ? "Check out all articles written by " + authorName + " on BlogSphere! ✍️✨"
        : "Read \"" + title + "\" by " + authorName + " on BlogSphere! 📖✨";

    // Configure social intents
    if (linkX) {
        linkX.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText) + "&url=" + encodeURIComponent(shareUrl);
    }
    if (linkWa) {
        linkWa.href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText + "\n" + shareUrl);
    }
    if (linkFb) {
        linkFb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl);
    }
    if (linkLi) {
        linkLi.href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(shareUrl);
    }

    modal.classList.add("active");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeShareModal() {
    var modal = document.getElementById("globalShareModal");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
    if (!document.getElementById("articleReaderOverlay")?.classList.contains("active")) {
        document.body.style.overflow = "";
    }
}

function copyShareModalLink() {
    var urlInput = document.getElementById("shareDirectUrlInput");
    if (!urlInput || !urlInput.value) return;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(urlInput.value).then(function () {
            showToast("🔗 Link copied to clipboard!", "success");
        }).catch(function () {
            fallbackCopy(urlInput);
        });
    } else {
        fallbackCopy(urlInput);
    }
}

function fallbackCopy(inputEl) {
    try {
        inputEl.select();
        inputEl.setSelectionRange(0, 99999);
        document.execCommand("copy");
        showToast("🔗 Link copied to clipboard!", "success");
    } catch (e) {
        showToast("Press Ctrl+C to copy the link", "info");
    }
}

function shareBlogArticle(blogId) {
    var blog = cachedBlogs.find(function (b) { return (b._id || b.id) === blogId; });
    if (!blog) return;

    var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Author";
    var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
    var articleUrl = baseUrl + "index.html?article=" + encodeURIComponent(blogId);

    openShareModal({
        type: "article",
        title: blog.title || "Blog Post",
        authorName: authorName,
        url: articleUrl
    });
}

function shareAuthorProfile(authorId, authorName, authorBio) {
    var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
    var authorUrl = baseUrl + "index.html?author=" + encodeURIComponent(authorId);

    openShareModal({
        type: "author",
        title: "Articles by " + (authorName || "Author"),
        authorName: authorName || "Author",
        url: authorUrl
    });
}

// ─── Article Reader ──────────────────────────────────────────────────────────
function openArticleReader(blogId) {
    var blog = cachedBlogs.find(function (b) { return (b._id || b.id) === blogId; });
    if (!blog) return;

    var overlay = document.getElementById("articleReaderOverlay");
    var img = document.getElementById("articleReaderImg");
    var vid = document.getElementById("articleReaderVideo");
    var meta = document.getElementById("articleReaderMeta");
    var titleEl = document.getElementById("articleReaderTitle");
    var contentEl = document.getElementById("articleReaderContent");
    var shareBtns = document.getElementById("articleReaderShareButtons");

    if (!overlay) return;

    // Handle Video display
    if (vid) {
        if (blog.video && blog.video.trim() !== "") {
            vid.src = resolveImageUrl(blog.video);
            vid.style.display = "block";
        } else {
            vid.pause();
            vid.src = "";
            vid.style.display = "none";
        }
    }

    // Handle Image display
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

    var authorId = blog.author ? (blog.author._id || blog.author.id || "") : "";
    var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Author";
    var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    var authorAvatar = resolveImageUrl(rawAvatar);
    var pubDate = formatDate(blog.createdAt);

    if (meta) {
        meta.innerHTML =
            '<span class="article-category-badge">' + esc(blog.category || "General") + '</span>' +
            '<div class="article-author-chip" onclick="closeArticleReader(); viewAuthorArticles(\'' + esc(authorId) + '\', \'' + esc(authorName) + '\');" title="View all articles by this author">' +
            '<img src="' + esc(authorAvatar) + '" alt="' + esc(authorName) + '" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
            '<span>By ' + esc(authorName) + '</span> <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;margin-left:2px;"></i></div>' +
            (pubDate ? '<span style="font-size:0.85rem;color:#64748B;font-weight:500;display:inline-flex;align-items:center;gap:6px;"><i class="fa-regular fa-calendar-days" style="color:#4F46E5;"></i> Published: ' + esc(pubDate) + '</span>' : '');
    }

    if (titleEl) titleEl.textContent = blog.title || "";
    if (contentEl) contentEl.textContent = blog.content || "";

    if (shareBtns) {
        var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
        var shareUrl = baseUrl + "index.html?article=" + encodeURIComponent(blogId);
        var tweetText = "Read \"" + (blog.title || "Blog") + "\" by " + authorName + " on BlogSphere! 📖✨";

        shareBtns.innerHTML =
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText) + '&url=' + encodeURIComponent(shareUrl) + '" target="_blank" style="background:#000;color:#fff;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:0.95rem;" title="Share on X"><i class="fa-brands fa-x-twitter"></i></a>' +
            '<a href="https://api.whatsapp.com/send?text=' + encodeURIComponent(tweetText + "\n" + shareUrl) + '" target="_blank" style="background:#25D366;color:#fff;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:1.05rem;" title="Share on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>' +
            '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl) + '" target="_blank" style="background:#1877F2;color:#fff;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:1.05rem;" title="Share on Facebook"><i class="fa-brands fa-facebook-f"></i></a>' +
            '<button type="button" onclick="shareBlogArticle(\'' + blogId + '\')" style="background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;padding:6px 14px;border-radius:20px;font-weight:600;font-size:0.82rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-share-nodes"></i> More Options</button>';
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

// ─── Author & Blog Display ───────────────────────────────────────────────────
function viewAuthorArticles(authorId, authorName) {
    activeAuthorFilter = authorId;
    
    // Update browser URL query without full reload
    var newUrl = new URL(window.location);
    newUrl.searchParams.set("author", authorId);
    if (authorName) newUrl.searchParams.set("authorName", authorName);
    window.history.pushState({}, "", newUrl);

    var featured = document.getElementById("featured");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });

    renderHomeBlogs(activeCategoryFilter, activeAuthorFilter);
}

function clearAuthorFilter() {
    activeAuthorFilter = null;
    var newUrl = new URL(window.location);
    newUrl.searchParams.delete("author");
    newUrl.searchParams.delete("authorName");
    window.history.pushState({}, "", newUrl);

    renderHomeBlogs(activeCategoryFilter, null);
}

async function renderHomeBlogs(categoryFilter, authorFilter) {
    var container = document.getElementById("featuredBlogsContainer");
    var authorBanner = document.getElementById("authorProfileBanner");
    var sectionTitle = document.getElementById("featuredSectionTitle");
    var sectionSub = document.getElementById("featuredSectionSubtitle");

    if (!container) return;

    if (categoryFilter !== undefined) activeCategoryFilter = categoryFilter;
    if (authorFilter !== undefined) activeAuthorFilter = authorFilter;

    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Loading stories…</div>';

    try {
        var response = await fetch(API_BLOGS_URL);
        var blogs = [];
        if (response.ok) blogs = await response.json();
        cachedBlogs = blogs;

        var displayList = blogs;

        // Filter by author if active
        if (activeAuthorFilter) {
            displayList = displayList.filter(function (b) {
                if (!b.author) return false;
                var aId = b.author._id || b.author.id || b.author;
                var aName = b.author.name || b.author.email || "";
                return String(aId) === String(activeAuthorFilter) || 
                       String(aName).toLowerCase() === String(activeAuthorFilter).toLowerCase();
            });
        }

        // Filter by category if active
        if (activeCategoryFilter && activeCategoryFilter.toLowerCase() !== "all") {
            displayList = displayList.filter(function (b) {
                return b.category && b.category.toLowerCase() === activeCategoryFilter.toLowerCase();
            });
        }

        // Render Author Profile Banner if filtering by author
        if (activeAuthorFilter && authorBanner) {
            var primaryAuthor = (displayList.length > 0 && displayList[0].author) ? displayList[0].author : null;
            var authorName = "Author";
            var authorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
            var authorBio = "Prolific writer and contributor to the BlogSphere creator community.";

            if (primaryAuthor) {
                authorName = primaryAuthor.name || primaryAuthor.email || "Author";
                if (primaryAuthor.profilePic) authorAvatar = resolveImageUrl(primaryAuthor.profilePic);
                if (primaryAuthor.bio) authorBio = primaryAuthor.bio;
            } else {
                var urlParams = new URLSearchParams(window.location.search);
                var paramName = urlParams.get("authorName");
                if (paramName) authorName = paramName;
            }

            var authorCount = displayList.length;

            authorBanner.style.display = "block";
            authorBanner.innerHTML =
                '<div class="author-hero-banner">' +
                '<div class="author-hero-left">' +
                '<img src="' + esc(authorAvatar) + '" alt="' + esc(authorName) + '" class="author-hero-avatar" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
                '<div class="author-hero-details">' +
                '<h1>' + esc(authorName) + ' <span style="font-size:1.2rem;">✍️</span></h1>' +
                '<p>' + esc(authorBio) + '</p>' +
                '<div class="author-hero-badges">' +
                '<span class="author-pill"><i class="fa-solid fa-newspaper"></i> ' + authorCount + ' Published ' + (authorCount === 1 ? 'Article' : 'Articles') + '</span>' +
                '<span class="author-pill" style="background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.4);color:#A7F3D0;"><i class="fa-solid fa-circle-check"></i> Verified Creator</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="author-hero-actions">' +
                '<button type="button" class="btn-author-share" onclick="shareAuthorProfile(\'' + esc(activeAuthorFilter) + '\', \'' + esc(authorName) + '\', \'' + esc(authorBio) + '\')">' +
                '<i class="fa-solid fa-share-nodes"></i> Share Author Page' +
                '</button>' +
                '<button type="button" class="btn-author-all" onclick="clearAuthorFilter()">' +
                '<i class="fa-solid fa-arrow-left"></i> View All Stories' +
                '</button>' +
                '</div>' +
                '</div>';

            if (sectionTitle) sectionTitle.textContent = "Articles by " + authorName;
            if (sectionSub) sectionSub.textContent = "Explore all " + authorCount + " stories published by " + authorName;
        } else if (authorBanner) {
            authorBanner.style.display = "none";
            if (sectionTitle) sectionTitle.textContent = "Latest Articles";
            if (sectionSub) sectionSub.textContent = "Fresh stories published by our vibrant community";
        }

        if (displayList.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#64748B;">' +
                '<div style="font-size:2.8rem;color:#94A3B8;margin-bottom:12px;"><i class="fa-regular fa-newspaper"></i></div>' +
                '<h3 style="color:#0F172A;font-size:1.3rem;margin-bottom:6px;">No articles found</h3>' +
                '<p style="margin-bottom:18px;">No published stories match the selected criteria.</p>' +
                (activeAuthorFilter ? '<button type="button" class="read-more-btn" onclick="clearAuthorFilter()"><i class="fa-solid fa-arrow-left"></i> View All Articles</button>' : '<a href="createBlog.html" class="read-more-btn"><i class="fa-solid fa-pen-nib"></i> Write One Now</a>') +
                '</div>';
            return;
        }

        container.innerHTML = displayList.map(function (blog) {
            var blogId = blog._id || blog.id;
            var rawImage = blog.image && blog.image.trim() !== "" ? blog.image : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80";
            var imageSrc = resolveImageUrl(rawImage);
            var hasVideo = blog.video && blog.video.trim() !== "";
            var videoSrc = hasVideo ? resolveImageUrl(blog.video) : "";
            var authorId = blog.author ? (blog.author._id || blog.author.id || "") : "";
            var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Anonymous";
            var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
            var authorAvatar = resolveImageUrl(rawAvatar);
            var preview = (blog.content || "").substring(0, 120) + ((blog.content || "").length > 120 ? "…" : "");
            var pubDate = formatDate(blog.createdAt);

            var mediaHtml;
            if (hasVideo) {
                mediaHtml =
                    '<div class="blog-card-image-wrap" style="position:relative;width:100%;background:#0F172A;overflow:hidden;border-radius:16px 16px 0 0;">' +
                    '<video autoplay muted loop playsinline preload="auto" style="width:100%;max-height:240px;display:block;background:#000;object-fit:cover;" poster="' + esc(imageSrc) + '">' +
                    '<source src="' + esc(videoSrc) + '">' +
                    'Your browser does not support video.' +
                    '</video>' +
                    '<div style="position:absolute;top:10px;left:10px;background:rgba(99,102,241,0.9);color:#fff;font-size:0.72rem;padding:3px 9px;border-radius:20px;font-weight:700;display:flex;align-items:center;gap:5px;backdrop-filter:blur(4px);pointer-events:none;"><i class="fa-solid fa-video"></i> Video</div>' +
                    '</div>';
            } else {
                mediaHtml =
                    '<div class="blog-card-image-wrap" style="position:relative;width:100%;height:210px;background:#E2E8F0;overflow:hidden;">' +
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
                '<h3 style="font-size:1.15rem;font-weight:700;color:#0F172A;margin-bottom:8px;line-height:1.3;cursor:pointer;" onclick="openArticleReader(\'' + blogId + '\')">' + esc(blog.title) + '</h3>' +
                '<p class="blog-card-preview">' + esc(preview) + '</p>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;cursor:pointer;" onclick="viewAuthorArticles(\'' + esc(authorId) + '\', \'' + esc(authorName) + '\')" title="Click to view all stories by ' + esc(authorName) + '">' +
                '<img src="' + esc(authorAvatar) + '" alt="avatar" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid #6366F1;" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
                '<small style="color:#4F46E5;font-weight:600;">By ' + esc(authorName) + ' <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;margin-left:3px;opacity:0.7;"></i></small>' +
                '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
                '<button class="read-more-btn" onclick="openArticleReader(\'' + blogId + '\')"><i class="fa-solid fa-book-open"></i> Read</button>' +
                '<button class="share-card-btn" onclick="shareBlogArticle(\'' + blogId + '\')" title="Share this blog post"><i class="fa-solid fa-share-nodes"></i> Share</button>' +
                '</div>' +
                '</div></div>';
        }).join("");
    } catch (err) {
        console.error("Home blogs fetch error:", err);
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#EF4444;"><p>Could not load stories. Please check your connection and try again.</p></div>';
    } finally {
        if (window.hidePageLoader) window.hidePageLoader();
    }
}

function filterBlogs(cat) {
    var featured = document.getElementById("featured");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });
    setTimeout(function () { renderHomeBlogs(cat, activeAuthorFilter); }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
    updateNav();
    loadSiteSettings();

    // Check URL parameters on load for ?author= or ?article=
    var urlParams = new URLSearchParams(window.location.search);
    var authorParam = urlParams.get("author") || urlParams.get("authorId");
    var articleParam = urlParams.get("article") || urlParams.get("id");

    if (authorParam) {
        activeAuthorFilter = authorParam;
    }

    renderHomeBlogs("all", activeAuthorFilter).then(function() {
        if (articleParam) {
            setTimeout(function() {
                openArticleReader(articleParam);
            }, 400);
        }
    });

    var closeBtn = document.getElementById("articleReaderClose");
    if (closeBtn) closeBtn.addEventListener("click", closeArticleReader);

    var overlay = document.getElementById("articleReaderOverlay");
    if (overlay) {
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeArticleReader();
        });
    }

    var shareModalOverlay = document.getElementById("globalShareModal");
    if (shareModalOverlay) {
        shareModalOverlay.addEventListener("click", function (e) {
            if (e.target === shareModalOverlay) closeShareModal();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeArticleReader();
            closeShareModal();
        }
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

window.showTermsModal = showTermsModal;
window.filterBlogs = filterBlogs;
window.openArticleReader = openArticleReader;
window.closeArticleReader = closeArticleReader;
window.resolveImageUrl = resolveImageUrl;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyShareModalLink = copyShareModalLink;
window.shareBlogArticle = shareBlogArticle;
window.shareAuthorProfile = shareAuthorProfile;
window.viewAuthorArticles = viewAuthorArticles;
window.clearAuthorFilter = clearAuthorFilter;

