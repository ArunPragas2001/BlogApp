function getApiBaseUrl() {
    if (typeof window === "undefined") return "http://localhost:5000";
    var loc = window.location;
    if (loc.protocol.startsWith("http") && loc.port === "5000") {
        return loc.origin;
    }
    if (
        loc.hostname === "localhost" ||
        loc.hostname === "127.0.0.1" ||
        loc.hostname === "" ||
        loc.protocol === "file:" ||
        /^192\.168\./.test(loc.hostname) ||
        /^10\./.test(loc.hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(loc.hostname)
    ) {
        return (loc.protocol.startsWith("http") && loc.hostname)
            ? (loc.protocol + "//" + loc.hostname + ":5000")
            : "http://localhost:5000";
    }
    return loc.origin.includes("blogsphere") ? loc.origin : "https://blogsphere-wtrv.onrender.com";
}

var API_BASE_URL = getApiBaseUrl();
var API_BLOGS_URL = API_BASE_URL + "/api/blogs";
var API_SETTINGS_URL = API_BASE_URL + "/api/settings";

var cachedTerms = "Welcome to BlogSphere. By using our platform you agree to post respectful, original content and abide by our community guidelines.";
var cachedBlogs = (function () {
    try {
        var d = localStorage.getItem("cached_home_blogs");
        return d ? JSON.parse(d) : [];
    } catch (e) {
        return [];
    }
})();
var activeAuthorFilter = null;
var activeCategoryFilter = "all";

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
}

function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getReadingTime(content) {
    if (!content) return 1;
    var words = String(content).trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
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

function applySiteConfig(config) {
    if (!config) return;
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
}

async function loadSiteSettings() {
    try {
        var cached = localStorage.getItem("cached_site_settings");
        if (cached) {
            applySiteConfig(JSON.parse(cached));
        }
        var res = await fetch(API_SETTINGS_URL);
        if (!res.ok) return;
        var config = await res.json();
        localStorage.setItem("cached_site_settings", JSON.stringify(config));
        applySiteConfig(config);
    } catch (err) {
        console.warn("Site settings fetch note:", err);
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
    var linkTg = document.getElementById("shareLinkTelegram");
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
    if (linkTg) {
        linkTg.href = "https://t.me/share/url?url=" + encodeURIComponent(shareUrl) + "&text=" + encodeURIComponent(shareText);
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
    var overlay = document.getElementById("articleReaderOverlay");
    if (!overlay || !overlay.classList.contains("active")) {
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
    if (window.BlogShare && typeof window.BlogShare.openModal === 'function') {
        window.BlogShare.openModal(blogId);
    } else {
        var blog = cachedBlogs.find(function (b) { return String(b._id || b.id) === String(blogId); });
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
}

function shareAuthorProfile(authorId, authorName, authorBio) {
    if (window.BlogShare && typeof window.BlogShare.openAuthorModal === 'function') {
        window.BlogShare.openAuthorModal(authorId, authorName, authorBio);
    } else {
        var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
        var authorUrl = baseUrl + "index.html?author=" + encodeURIComponent(authorId);
        if (authorName) authorUrl += "&authorName=" + encodeURIComponent(authorName);

        openShareModal({
            type: "author",
            title: "Articles by " + (authorName || "Author"),
            authorName: authorName || "Author",
            url: authorUrl
        });
    }
}

// ─── Likes & Comments System ─────────────────────────────────────────────────
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

function handleInstagramDblClick(containerEl, blogId, event) {
    triggerInstaHeartPop(containerEl);
    var blog = (cachedBlogs || []).find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) blog = { _id: blogId, likesCount: 0, likes: [] };

    var isLiked = checkIsBlogLiked(blog);
    if (!isLiked) {
        handleToggleLike(blogId, null, event);
    }
}

function insertEmojiIntoComment(emoji) {
    var inp = document.getElementById("readerCommentInputField");
    if (!inp) return;
    var start = inp.selectionStart || inp.value.length;
    var end = inp.selectionEnd || inp.value.length;
    var text = inp.value;
    inp.value = text.substring(0, start) + emoji + text.substring(end);
    inp.focus();
    var newPos = start + emoji.length;
    inp.setSelectionRange(newPos, newPos);
}

function renderArticleComments(blog, container) {
    if (!container || !blog) return;
    var blogId = String(blog._id || blog.id);
    var comments = blog.comments || [];
    var currentUser = getCurrentUser();

    var emojisList = ["😊", "❤️", "🔥", "👍", "👏", "🎉", "💡", "🚀", "💯", "✨", "💬", "✍️", "🙌", "😍", "🥳", "🌟", "🎈", "📚"];
    var emojiChipsHtml = emojisList.map(function(em) {
        return '<button type="button" class="emoji-chip-btn" onclick="insertEmojiIntoComment(\'' + em + '\')" title="Add ' + em + '" style="background:transparent;border:none;font-size:1.25rem;cursor:pointer;padding:4px 6px;border-radius:8px;transition:transform 0.15s ease, background 0.15s ease;" onmouseover="this.style.transform=\'scale(1.25)\';this.style.background=\'rgba(99,102,241,0.12)\'" onmouseout="this.style.transform=\'scale(1)\';this.style.background=\'transparent\'">' + em + '</button>';
    }).join("");

    var commentsHtml = comments.map(function (c) {
        var avatar = resolveImageUrl(c.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
        var cDate = formatDate(c.createdAt) || "Recently";
        return '<div class="comment-item">' +
            '<img src="' + esc(avatar) + '" alt="avatar" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
            '<div style="flex:1;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">' +
            '<strong class="comment-author-name">' + esc(c.userName || "User") + '</strong>' +
            '<small style="font-size:0.75rem;color:#64748B;">' + esc(cDate) + '</small>' +
            '</div>' +
            '<div class="comment-text">' + esc(c.text) + '</div>' +
            '</div></div>';
    }).join("");

    container.innerHTML =
        '<div class="comments-heading"><i class="fa-regular fa-comment" style="color:#4F46E5;"></i> Comments (' + (blog.commentsCount || comments.length) + ')</div>' +
        '<form onsubmit="handleAddComment(\'' + blogId + '\', this, event)" class="comment-input-wrap" style="display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box;">' +
        '<div style="display:flex;gap:8px;width:100%;">' +
        '<input type="text" placeholder="' + (currentUser ? 'Add a comment...' : 'Write a comment (as guest)...') + '" class="comment-input-field" required id="readerCommentInputField" style="flex:1;padding:12px 16px;border-radius:12px;border:1.5px solid #E2E8F0;font-size:0.95rem;">' +
        '<button type="submit" class="comment-post-btn" style="padding:10px 22px;border-radius:12px;background:#4F46E5;color:#fff;font-weight:700;border:none;cursor:pointer;">Post</button>' +
        '</div>' +
        '<div class="comment-emoji-bar" style="display:flex;align-items:center;gap:4px;overflow-x:auto;padding:6px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;scrollbar-width:none;">' +
        '<span style="font-size:0.75rem;font-weight:700;color:#64748B;white-space:nowrap;margin-right:4px;"><i class="fa-regular fa-face-smile" style="color:#4F46E5;"></i> Emojis:</span>' +
        emojiChipsHtml +
        '</div>' +
        '</form>' +
        '<div class="comments-list" id="readerCommentsList" style="margin-top:16px;">' +
        (comments.length > 0 ? commentsHtml : '<p style="color:#64748B;font-size:0.88rem;margin:0;">No comments yet. Be the first to share your thoughts!</p>') +
        '</div>';
}

function focusArticleCommentInput() {
    var inp = document.getElementById("readerCommentInputField");
    if (inp) {
        inp.scrollIntoView({ behavior: "smooth", block: "center" });
        inp.focus();
    }
}

async function handleAddComment(blogId, formEl, event) {
    if (event) event.preventDefault();
    var input = formEl ? formEl.querySelector("input") : null;
    if (!input || !input.value.trim()) return;

    var text = input.value.trim();
    var blog = (cachedBlogs || []).find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) blog = { _id: blogId, comments: [], commentsCount: 0 };

    var currentUser = getCurrentUser();
    var userName = currentUser ? (currentUser.name || currentUser.email) : "Guest Reader";
    var userAvatar = currentUser ? (currentUser.profilePic || "") : "";

    var newComment = {
        userName: userName,
        userAvatar: userAvatar,
        text: text,
        createdAt: new Date().toISOString()
    };

    if (!blog.comments) blog.comments = [];
    blog.comments.unshift(newComment);
    blog.commentsCount = blog.comments.length;

    input.value = "";

    var commentsSection = document.getElementById("articleReaderCommentsSection");
    if (commentsSection) {
        renderArticleComments(blog, commentsSection);
    }
    updateCommentCountUI(blogId, blog.commentsCount);

    if (typeof showToast === "function") {
        showToast("💬 Comment posted!", "success", 2000);
    }

    try {
        var headers = { "Content-Type": "application/json" };
        var token = localStorage.getItem("token");
        if (token) headers["Authorization"] = "Bearer " + token;

        var res = await fetch(API_BASE_URL + "/api/blogs/" + blogId + "/comments", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ text: text, authorName: userName, userAvatar: userAvatar })
        });
        if (res.ok) {
            var data = await res.json();
            if (data.comments) blog.comments = data.comments;
            if (data.commentsCount !== undefined) blog.commentsCount = data.commentsCount;
            if (commentsSection) renderArticleComments(blog, commentsSection);
            updateCommentCountUI(blogId, blog.commentsCount);
        }
    } catch (err) {
        console.warn("Comment API sync error:", err);
    }

    try {
        localStorage.setItem("cached_home_blogs", JSON.stringify(cachedBlogs));
    } catch (e) {}
}

function updateCommentCountUI(blogId, count) {
    var targets = document.querySelectorAll('[data-comment-blog-id="' + blogId + '"]');
    targets.forEach(function (el) {
        var countEl = el.querySelector(".comment-count") || el;
        if (countEl) countEl.textContent = count > 0 ? count : '';
    });
}

// ─── Article Reader ──────────────────────────────────────────────────────────
function populateArticleReaderUI(blog) {
    if (!blog) return;
    var blogId = blog._id || blog.id;
    var img = document.getElementById("articleReaderImg");
    var meta = document.getElementById("articleReaderMeta");
    var titleEl = document.getElementById("articleReaderTitle");
    var contentEl = document.getElementById("articleReaderContent");

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
    if (contentEl) {
        // Render line breaks correctly for story/novel long-form content
        var safeContent = esc(blog.content || "");
        contentEl.innerHTML = safeContent.replace(/\n/g, "<br>");
    }

    // Add estimated reading time badge to meta
    var readTime = getReadingTime(blog.content);
    if (meta) {
        var readTimeBadge = meta.querySelector('.read-time-badge');
        if (!readTimeBadge) {
            readTimeBadge = document.createElement('span');
            readTimeBadge.className = 'read-time-badge';
            readTimeBadge.style.cssText = 'font-size:0.82rem;color:#64748B;font-weight:500;display:inline-flex;align-items:center;gap:5px;';
            meta.appendChild(readTimeBadge);
        }
        readTimeBadge.innerHTML = '<i class="fa-regular fa-clock" style="color:#4F46E5;"></i> ' + readTime + ' min read';
    }

    // Render Share & Like & Comment Toolbar inside Article Reader
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
        var commentsCount = blog.commentsCount || (blog.comments ? blog.comments.length : 0);
        var bTitleEsc = esc(blog.title || "").replace(/'/g, "\\'");

        shareBar.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap;">' +
            '<div class="insta-actions-left">' +
            '<button class="insta-action-icon-btn like-btn ' + (isLiked ? 'liked' : '') + '" data-like-blog-id="' + blogId + '" onclick="handleToggleLike(\'' + blogId + '\', this, event)" title="Like Post">' +
            '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
            '<span class="like-count-num">' + (likesCount > 0 ? likesCount + ' Likes' : 'Like') + '</span>' +
            '</button>' +
            '<button class="insta-action-icon-btn comment-btn" onclick="focusArticleCommentInput();" title="Comment">' +
            '<i class="fa-regular fa-comment"></i>' +
            '<span class="comment-count" data-comment-blog-id="' + blogId + '">' + (commentsCount > 0 ? commentsCount : '') + '</span>' +
            '</button>' +
            '<button class="insta-action-icon-btn share-btn" onclick="shareBlogArticle(\'' + blogId + '\')" title="Share Post">' +
            '<i class="fa-solid fa-paper-plane"></i>' +
            '</button>' +
            '</div>' +
            '<div class="article-share-chips">' +
            '<span class="article-share-label">Quick Share:</span>' +
            '<a class="share-chip x-tw" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent('Read "' + (blog.title || 'Blog') + '" on BlogSphere 📖✨') + '&url=' + encodeURIComponent(window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/') + 'index.html?article=' + encodeURIComponent(blogId)) + '" target="_blank" title="Share on X" style="background:#000;color:#fff;width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;"><i class="fa-brands fa-x-twitter" style="font-size:0.85rem;"></i></a>' +
            '<button class="share-chip wa" onclick="BlogShare.whatsapp(\'' + blogId + '\', \'' + bTitleEsc + '\')"><i class="fa-brands fa-whatsapp"></i></button>' +
            '<button class="share-chip fb" onclick="BlogShare.facebook(\'' + blogId + '\')"><i class="fa-brands fa-facebook-f"></i></button>' +
            '<button class="share-chip copy" onclick="BlogShare.copy(\'' + blogId + '\', this)"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            '</div>';
    }

    // Render Comments Section inside Article Reader
    var commentsSection = document.getElementById("articleReaderCommentsSection");
    if (!commentsSection && contentEl && contentEl.parentNode) {
        commentsSection = document.createElement("div");
        commentsSection.id = "articleReaderCommentsSection";
        commentsSection.className = "blog-comments-container";
        contentEl.parentNode.appendChild(commentsSection);
    }
    if (commentsSection) {
        renderArticleComments(blog, commentsSection);
    }
}

async function openArticleReader(blogId) {
    var overlay = document.getElementById("articleReaderOverlay");
    if (!overlay) return;

    var blog = cachedBlogs.find(function (b) { return String(b._id || b.id) === String(blogId); });
    if (!blog) {
        try {
            var localItem = localStorage.getItem("cached_article_" + blogId);
            if (localItem) {
                blog = JSON.parse(localItem);
                if (blog) cachedBlogs.push(blog);
            }
        } catch (e) {}
    }

    // 1. If in memory or localStorage cache, show reader instantly in 0ms!
    if (blog) {
        populateArticleReaderUI(blog);
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";

        // Silent background sync for fresh comments & like count
        fetch(API_BASE_URL + "/api/blogs/" + blogId)
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (freshBlog) {
                if (freshBlog) {
                    var idx = cachedBlogs.findIndex(function (b) { return String(b._id || b.id) === String(blogId); });
                    if (idx > -1) cachedBlogs[idx] = freshBlog;
                    else cachedBlogs.push(freshBlog);
                    try { localStorage.setItem("cached_article_" + blogId, JSON.stringify(freshBlog)); } catch (e) {}
                    populateArticleReaderUI(freshBlog);
                }
            })
            .catch(function () {});
        return;
    }

    // 2. Direct external link - open reader with immediate loading state
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    var titleEl = document.getElementById("articleReaderTitle");
    var contentEl = document.getElementById("articleReaderContent");
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:#4F46E5;"></i> Loading article...';
    if (contentEl) contentEl.textContent = "Please wait while we retrieve the latest story...";

    try {
        var freshRes = await fetch(API_BASE_URL + "/api/blogs/" + blogId);
        if (freshRes.ok) {
            var freshBlog = await freshRes.json();
            cachedBlogs.push(freshBlog);
            try { localStorage.setItem("cached_article_" + blogId, JSON.stringify(freshBlog)); } catch (e) {}
            populateArticleReaderUI(freshBlog);
        } else {
            if (titleEl) titleEl.textContent = "Article not found";
            if (contentEl) contentEl.textContent = "The requested story may have been removed or is unavailable.";
        }
    } catch (e) {
        if (titleEl) titleEl.textContent = "Unable to load article";
        if (contentEl) contentEl.textContent = "Please check your network connection and try again.";
    }
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
    try {
        var newUrl = new URL(window.location);
        newUrl.searchParams.set("author", authorId);
        if (authorName) newUrl.searchParams.set("authorName", authorName);
        window.history.pushState({}, "", newUrl);
    } catch (e) {}

    var container = document.getElementById("featuredBlogsContainer");
    if (container && Array.isArray(cachedBlogs) && cachedBlogs.length > 0) {
        // INSTANT 0ms filter from memory!
        var filtered = filterBlogsList(cachedBlogs);
        updateAuthorBannerUI(cachedBlogs);
        renderBlogCardsList(filtered, container);
    } else {
        renderHomeBlogs(activeCategoryFilter, activeAuthorFilter);
    }

    var featured = document.getElementById("featured");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });
}

function clearAuthorFilter() {
    activeAuthorFilter = null;
    try {
        var newUrl = new URL(window.location);
        newUrl.searchParams.delete("author");
        newUrl.searchParams.delete("authorName");
        window.history.pushState({}, "", newUrl);
    } catch (e) {}

    var container = document.getElementById("featuredBlogsContainer");
    if (container && Array.isArray(cachedBlogs) && cachedBlogs.length > 0) {
        // INSTANT 0ms filter from memory!
        var filtered = filterBlogsList(cachedBlogs);
        updateAuthorBannerUI(cachedBlogs);
        updateCategoryHeaderUI(activeCategoryFilter, filtered.length);
        renderBlogCardsList(filtered, container);
    } else {
        renderHomeBlogs(activeCategoryFilter, null);
    }
}

function renderBlogCardsList(blogsList, container) {
    if (!container) return;

    if (!blogsList || blogsList.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#64748B;">' +
            '<div style="font-size:2.8rem;color:#94A3B8;margin-bottom:12px;"><i class="fa-regular fa-newspaper"></i></div>' +
            '<h3 style="color:#0F172A;font-size:1.3rem;margin-bottom:6px;">No articles found</h3>' +
            '<p style="margin-bottom:18px;">No published stories match the selected criteria.</p>' +
            (activeAuthorFilter ? '<button type="button" class="read-more-btn" onclick="clearAuthorFilter()"><i class="fa-solid fa-arrow-left"></i> View All Articles</button>' : '<a href="createBlog.html" class="read-more-btn"><i class="fa-solid fa-pen-nib"></i> Write One Now</a>') +
            '</div>';
        return;
    }

    container.innerHTML = blogsList.map(function (blog) {
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
            '<h3 style="font-size:1.15rem;font-weight:700;color:#0F172A;margin-bottom:8px;line-height:1.3;cursor:pointer;" onclick="openArticleReader(\'' + blogId + '\')">' + esc(blog.title) + '</h3>' +
            '<p class="blog-card-preview">' + esc(preview) + '</p>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">' +
            '<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="viewAuthorArticles(\'' + esc(authorId) + '\', \'' + esc(authorName) + '\')" title="Click to view all stories by ' + esc(authorName) + '">' +
            '<img src="' + esc(authorAvatar) + '" alt="avatar" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid #6366F1;" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
            '<small style="color:#4F46E5;font-weight:600;">By ' + esc(authorName) + ' <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;margin-left:3px;opacity:0.7;"></i></small>' +
            '</div>' +
            '<span style="font-size:0.75rem;color:#94A3B8;font-weight:500;display:inline-flex;align-items:center;gap:4px;"><i class="fa-regular fa-clock"></i> ' + getReadingTime(blog.content) + ' min</span>' +
            '</div>' +
            '<div class="insta-action-bar">' +
            '<div class="insta-actions-left">' +
            '<button class="insta-action-icon-btn like-btn ' + (isLiked ? 'liked' : '') + '" data-like-blog-id="' + blogId + '" onclick="handleToggleLike(\'' + blogId + '\', this, event)" title="Like Post">' +
            '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
            '<span class="like-count">' + (likesCount > 0 ? likesCount : '') + '</span>' +
            '</button>' +
            '<button class="insta-action-icon-btn share-btn" onclick="shareBlogArticle(\'' + blogId + '\'); event.stopPropagation();" title="Share Post">' +
            '<i class="fa-solid fa-paper-plane"></i>' +
            '</button>' +
            '</div>' +
            '<button class="insta-action-icon-btn read-btn" onclick="openArticleReader(\'' + blogId + '\')" title="Read Article">' +
            '<i class="fa-solid fa-book-open"></i>' +
            '</button>' +
            '</div>' +
            '</div></div>';
    }).join("");
}

// Stale-While-Revalidate blog loading with Author Filter and Category Filter support
async function renderHomeBlogs(categoryFilter, authorFilter) {
    var container = document.getElementById("featuredBlogsContainer");
    var authorBanner = document.getElementById("authorProfileBanner");
    var sectionTitle = document.getElementById("featuredSectionTitle");
    var sectionSub = document.getElementById("featuredSectionSubtitle");

    if (!container) return;

    if (categoryFilter !== undefined) activeCategoryFilter = categoryFilter;
    if (authorFilter !== undefined) activeAuthorFilter = authorFilter;

    // 1. Instant cache load if available
    try {
        var localData = localStorage.getItem("cached_home_blogs");
        if (localData) {
            var parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedBlogs = parsed;
                var filtered = filterBlogsList(cachedBlogs);
                updateAuthorBannerUI(cachedBlogs);
                updateCategoryHeaderUI(activeCategoryFilter, filtered.length);
                renderBlogCardsList(filtered, container);
                if (window.hidePageLoader) window.hidePageLoader();
            }
        }
    } catch (e) {}

    if (cachedBlogs.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Loading stories...</div>';
    }

    // 2. Fresh fetch from server
    try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, 6000);

        var blogs = [];
        try {
            var response = await fetch(API_BLOGS_URL, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) blogs = await response.json();
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            // Fallback: try opposite URL (local<->remote)
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
                localStorage.setItem("cached_home_blogs_ts", String(Date.now()));
            } catch (e) {}

            var displayList = filterBlogsList(blogs);
            updateAuthorBannerUI(blogs);
            renderBlogCardsList(displayList, container);
        }
    } catch (err) {
        console.error("Home blogs fetch error:", err);
        if (cachedBlogs.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#EF4444;"><p>Could not load stories. Please check your connection and try again.</p></div>';
        }
    } finally {
        if (window.hidePageLoader) window.hidePageLoader();
    }
}

function filterBlogsList(blogs) {
    var list = blogs;
    if (activeAuthorFilter) {
        list = list.filter(function (b) {
            if (!b.author) return false;
            var aId = b.author._id || b.author.id || b.author;
            var aName = b.author.name || b.author.email || "";
            return String(aId) === String(activeAuthorFilter) || 
                   String(aName).toLowerCase() === String(activeAuthorFilter).toLowerCase();
        });
    }
    if (activeCategoryFilter && activeCategoryFilter.toLowerCase() !== "all") {
        var targetCat = activeCategoryFilter.toLowerCase().trim();
        list = list.filter(function (b) {
            if (!b.category) return false;
            var bCat = b.category.toLowerCase().trim();
            if (targetCat === "story/novel" || targetCat === "story / novel" || targetCat === "story" || targetCat === "novel") {
                return bCat.includes("story") || bCat.includes("novel");
            }
            return bCat === targetCat;
        });
    }
    return list;
}

function updateAuthorBannerUI(allBlogs) {
    var authorBanner = document.getElementById("authorProfileBanner");
    var sectionTitle = document.getElementById("featuredSectionTitle");
    var sectionSub = document.getElementById("featuredSectionSubtitle");

    if (!authorBanner) return;

    if (activeAuthorFilter) {
        var authorBlogs = allBlogs.filter(function (b) {
            if (!b.author) return false;
            var aId = b.author._id || b.author.id || b.author;
            var aName = b.author.name || b.author.email || "";
            return String(aId) === String(activeAuthorFilter) || 
                   String(aName).toLowerCase() === String(activeAuthorFilter).toLowerCase();
        });

        var primaryAuthor = (authorBlogs.length > 0 && authorBlogs[0].author) ? authorBlogs[0].author : null;
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

        var authorCount = authorBlogs.length;

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
            '<i class="fa-solid fa-paper-plane"></i> Share Author Page' +
            '</button>' +
            '<button type="button" class="btn-author-all" onclick="clearAuthorFilter()">' +
            '<i class="fa-solid fa-arrow-left"></i> View All Stories' +
            '</button>' +
            '</div>' +
            '</div>';

        if (sectionTitle) sectionTitle.textContent = "Articles by " + authorName;
        if (sectionSub) sectionSub.textContent = "Explore all " + authorCount + " stories published by " + authorName;
    } else {
        authorBanner.style.display = "none";
        if (sectionTitle) sectionTitle.textContent = "Latest Articles";
        if (sectionSub) sectionSub.textContent = "Fresh stories published by our vibrant community";
    }
}

function updateCategoryHeaderUI(cat, filteredCount) {
    var sectionTitle = document.getElementById("featuredSectionTitle");
    var sectionSub = document.getElementById("featuredSectionSubtitle");
    if (!sectionTitle || activeAuthorFilter) return;

    if (cat && cat.toLowerCase() !== "all") {
        sectionTitle.innerHTML = 'Stories in ' + esc(cat) + ' <span class="active-filter-badge"><i class="fa-solid fa-tag"></i> ' + esc(cat) + ' <button type="button" class="btn-clear-cat-filter" onclick="filterBlogs(\'all\')" title="Show All Blogs">&times;</button></span>';
        sectionSub.innerHTML = 'Showing ' + (filteredCount || 0) + ' ' + (filteredCount === 1 ? 'story' : 'stories') + ' in this topic • <a href="#" onclick="filterBlogs(\'all\'); return false;" style="color:#4F46E5;font-weight:600;text-decoration:underline;">View All Blogs</a>';
    } else {
        sectionTitle.textContent = "Latest Articles";
        sectionSub.textContent = "Fresh stories published by our vibrant community";
    }
}

function filterBlogs(cat) {
    activeCategoryFilter = cat || "all";

    // Update browser URL query parameter without reloading
    try {
        var newUrl = new URL(window.location);
        if (activeCategoryFilter && activeCategoryFilter.toLowerCase() !== "all") {
            newUrl.searchParams.set("category", activeCategoryFilter);
        } else {
            newUrl.searchParams.delete("category");
        }
        window.history.pushState({}, "", newUrl);
    } catch (e) {}

    // Update active visual indicator on category cards
    var cards = document.querySelectorAll(".category-card");
    cards.forEach(function (el) {
        var elCat = el.getAttribute("data-category") || (el.querySelector("h3") ? el.querySelector("h3").textContent.trim() : "");
        if ((activeCategoryFilter === "all" && (elCat === "all" || elCat === "All Blogs")) || 
            (elCat && elCat.toLowerCase() === activeCategoryFilter.toLowerCase())) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });

    var container = document.getElementById("featuredBlogsContainer");
    if (container && Array.isArray(cachedBlogs) && cachedBlogs.length > 0) {
        var filtered = filterBlogsList(cachedBlogs);
        updateCategoryHeaderUI(activeCategoryFilter, filtered.length);

        if (filtered.length === 0) {
            container.innerHTML =
                '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:#F8FAFC;border-radius:16px;border:1.5px dashed #CBD5E1;margin:12px 0;">' +
                '<div style="font-size:2.5rem;margin-bottom:12px;">📖</div>' +
                '<h3 style="font-size:1.25rem;color:#0F172A;margin-bottom:8px;font-weight:700;">No stories found in "' + esc(activeCategoryFilter) + '"</h3>' +
                '<p style="color:#64748B;font-size:0.95rem;margin-bottom:20px;">Be the first author to publish an engaging article in this category!</p>' +
                '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
                '<button type="button" onclick="filterBlogs(\'all\')" class="btn-primary" style="padding:10px 24px;font-size:0.9rem;border-radius:50px;background:#4F46E5;color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-layer-group"></i> View All Stories</button>' +
                '<a href="createBlog.html" class="btn-secondary" style="padding:10px 24px;font-size:0.9rem;border-radius:50px;background:#0F172A;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-pen-nib"></i> Write a Story</a>' +
                '</div>' +
                '</div>';
        } else {
            renderBlogCardsList(filtered, container);
        }
    } else {
        renderHomeBlogs(cat, activeAuthorFilter);
    }

    var featured = document.getElementById("featured");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", function () {
    // Preserve cache across sessions for instant 0ms load
    updateNav();
    loadSiteSettings();

    // Background server warm-up (prevents Render cold starts for subsequent actions)
    try {
        fetch(API_BASE_URL + "/api/health", { mode: "cors" }).catch(function () {});
    } catch (e) {}

    // Check URL parameters on load for ?author= or ?article= or ?category=
    var urlParams = new URLSearchParams(window.location.search);
    var authorParam = urlParams.get("author") || urlParams.get("authorId");
    var articleParam = urlParams.get("article") || urlParams.get("id") || urlParams.get("blogId");
    var categoryParam = urlParams.get("category");

    if (authorParam) {
        activeAuthorFilter = authorParam;
    }
    if (categoryParam) {
        activeCategoryFilter = categoryParam;
    }

    // Direct article link: Open article reader IMMEDIATELY without waiting for whole feed
    if (articleParam) {
        openArticleReader(articleParam);
    }

    // Render home blogs (hydrates immediately from cache in 0ms, then revalidates in background)
    renderHomeBlogs(activeCategoryFilter, activeAuthorFilter);

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

// Window exports
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
window.handleToggleLike = handleToggleLike;
window.handleInstagramDblClick = handleInstagramDblClick;
window.triggerInstaHeartPop = triggerInstaHeartPop;
window.insertEmojiIntoComment = insertEmojiIntoComment;
window.handleAddComment = handleAddComment;
window.focusArticleCommentInput = focusArticleCommentInput;
window.BlogShare = BlogShare;
