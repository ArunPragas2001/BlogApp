var API_BASE_URL = "https://blogsphere-wtrv.onrender.com";
var API_BLOGS_URL = API_BASE_URL + "/api/blogs";
var API_ADMIN_REQ_URL = API_BASE_URL + "/api/auth/admin-requests";
var API_USERS_URL = API_BASE_URL + "/api/users";

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
}

function getAuthorId(author) {
    if (!author) return "";
    var id = author._id || author.id || author;
    return String(id);
}

function isAuthorMatch(author, user) {
    if (!author || !user) return false;
    if (user.email && author.email && user.email === author.email) return true;
    return getAuthorId(author) === String(user.id || user._id || "");
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

function getDefaultAvatar(name) {
    var n = encodeURIComponent(name || "User");
    return "https://ui-avatars.com/api/?background=4F46E5&color=fff&size=150&name=" + n;
}

function setupWelcomeAndAuth() {
    var welcomeHeading = document.getElementById("welcomeHeading");
    var userRoleBadgeText = document.getElementById("userRoleBadgeText");
    var adminSettingsNavLink = document.getElementById("adminSettingsNavLink");
    var adminSettingsBtn = document.getElementById("adminSettingsBtn");
    var dashboardAvatarEl = document.getElementById("dashboardAvatar");
    var dashNavAvatarEl = document.getElementById("dashboardNavAvatar");
    var currentUser = getCurrentUser();

    if (welcomeHeading && currentUser && currentUser.name) {
        welcomeHeading.innerHTML = "Hey, " + esc(currentUser.name) + "! <span class='welcome-icon'>▪</span>";
    }

    // Set avatar with fallback
    function setAvatar(el, url, name) {
        if (!el) return;
        var resolved = resolveImageUrl(url);
        el.src = (resolved && resolved.trim()) ? resolved.trim() : getDefaultAvatar(name);
        el.onerror = function () {
            this.onerror = null;
            this.src = getDefaultAvatar(name);
        };
    }

    if (currentUser) {
        setAvatar(dashboardAvatarEl, currentUser.profilePic, currentUser.name);
        setAvatar(dashNavAvatarEl, currentUser.profilePic, currentUser.name);
    }

    // Fetch fresh user data from backend to ensure avatars are up-to-date
    var token = localStorage.getItem("token");
    if (token) {
        fetch(API_BASE_URL + "/api/auth/me", {
            headers: { "Authorization": "Bearer " + token }
        }).then(function(res) {
            if (!res.ok) return;
            return res.json();
        }).then(function(user) {
            if (!user) return;
            setAvatar(dashboardAvatarEl, user.profilePic, user.name);
            setAvatar(dashNavAvatarEl, user.profilePic, user.name);
            if (welcomeHeading && user.name) {
                welcomeHeading.innerHTML = "Hey, " + esc(user.name) + "! <span class='welcome-icon'>▪</span>";
            }
            // Sync localStorage
            var existing = getCurrentUser() || {};
            localStorage.setItem("currentUser", JSON.stringify(Object.assign({}, existing, {
                id: user._id, _id: user._id,
                name: user.name, email: user.email,
                role: user.role, profilePic: user.profilePic || "",
                bio: user.bio || ""
            })));
        }).catch(function(err) {
            console.warn("Could not refresh user from API:", err.message);
        });
    }

    if (currentUser && userRoleBadgeText) {
        if (currentUser.role === "owner") {
            userRoleBadgeText.innerHTML = '<span style="background:#312E81;color:#C7D2FE;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">👑 System Owner</span> Full authority over all settings and approvals.';
        } else if (currentUser.role === "admin") {
            userRoleBadgeText.innerHTML = '<span style="background:#065F46;color:#6EE7B7;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">🛡️ Administrator</span> Manage post approvals and site settings.';
        } else {
            userRoleBadgeText.innerHTML = '<span style="background:#1E3A5F;color:#93C5FD;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">✍️ Blogger</span> Manage your stories and keep sharing ideas.';
        }
    }

    if (currentUser && (currentUser.role === "admin" || currentUser.role === "owner")) {
        if (adminSettingsNavLink) adminSettingsNavLink.style.display = "block";
        if (adminSettingsBtn) adminSettingsBtn.style.display = "inline-flex";
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            showConfirmModal("Confirm Logout", "Are you sure you want to log out of your session?", function () {
                localStorage.removeItem("currentUser");
                localStorage.removeItem("token");
                showToast("Logged out successfully.", "info", 2000);
                setTimeout(function () { window.location.href = "login.html"; }, 600);
            }, false);
        });
    }
}

function updateStatistics(myBlogs) {
    var totalBlogs = document.getElementById("totalBlogs");
    var publishedBlogs = document.getElementById("publishedBlogs");
    var draftBlogs = document.getElementById("draftBlogs");

    if (totalBlogs) totalBlogs.textContent = myBlogs.length;
    if (publishedBlogs) publishedBlogs.textContent = myBlogs.filter(function (b) { return b.isApproved; }).length;
    if (draftBlogs) draftBlogs.textContent = myBlogs.filter(function (b) { return !b.isApproved; }).length;
}

async function displayOwnerAdminRequests() {
    var currentUser = getCurrentUser();
    var section = document.getElementById("ownerAdminRequestSection");
    var container = document.getElementById("ownerAdminReqContainer");
    var countEl = document.getElementById("pendingAdminReqCount");

    if (!currentUser || (currentUser.role !== "owner" && currentUser.email !== "pragasarun1@gmail.com")) {
        if (section) section.style.display = "none";
        return;
    }

    try {
        var token = localStorage.getItem("token");
        var res = await fetch(API_ADMIN_REQ_URL, { headers: { "Authorization": "Bearer " + token } });
        if (!res.ok) return;
        var requests = await res.json();

        if (section) section.style.display = "block";
        if (countEl) countEl.textContent = requests.length + " Request" + (requests.length !== 1 ? "s" : "");

        if (!container) return;
        if (requests.length === 0) {
            container.innerHTML = '<p style="color:#3730A3;margin:0;">No pending Admin privilege requests.</p>';
            return;
        }

        container.innerHTML = requests.map(function (user) {
            return '<div class="dashboard-blog" style="border-left:5px solid #6366F1;">' +
                '<div class="blog-info"><h3>' + esc(user.name) + '</h3><p>Email: <strong>' + esc(user.email) + '</strong> — Awaiting Owner approval</p></div>' +
                '<div class="blog-actions">' +
                '<button class="edit-btn" style="background:#10B981;color:#fff;border-color:#10B981;" onclick="handleApproveAdminUser(\'' + user._id + '\',true)"><i class="fa-solid fa-user-check"></i> Approve</button>' +
                '<button class="delete-btn" onclick="handleApproveAdminUser(\'' + user._id + '\',false)"><i class="fa-solid fa-user-xmark"></i> Reject</button>' +
                '</div></div>';
        }).join("");
    } catch (err) {
        console.error("Owner admin requests error:", err);
    }
}

async function handleApproveAdminUser(userId, approve) {
    var token = localStorage.getItem("token");
    if (!token) return;

    try {
        var response = await fetch(API_ADMIN_REQ_URL + "/" + userId + "/approve", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ approve: approve })
        });
        var data = await response.json();
        if (!response.ok) { showToast(data.message || "Failed to process request", "error"); return; }
        showToast(approve ? "✅ " + data.name + " is now an Administrator!" : "❌ Admin request rejected.", approve ? "success" : "info");
        displayOwnerAdminRequests();
    } catch (err) {
        console.error("Approve admin error:", err);
        showToast("Error processing admin request", "error");
    }
}

async function displayOwnerUserManagement() {
    var currentUser = getCurrentUser();
    var section = document.getElementById("ownerUserManagementSection");
    var container = document.getElementById("ownerUserManagementContainer");

    if (!currentUser || (currentUser.role !== "owner" && currentUser.role !== "admin")) {
        if (section) section.style.display = "none";
        return;
    }

    try {
        var token = localStorage.getItem("token");
        var res = await fetch(API_USERS_URL, { headers: { "Authorization": "Bearer " + token } });
        if (!res.ok) return;
        var users = await res.json();

        if (section) section.style.display = "block";
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<p style="color:#475569;margin:0;">No users found.</p>';
            return;
        }

        container.innerHTML = users.map(function (user) {
            var badgeColor = user.role === "admin" ? "#10B981" : "#4F46E5";
            var blockBtnText = user.isBlocked ? "Unblock" : "Block";
            var blockBtnColor = user.isBlocked ? "#10B981" : "#F59E0B";
            var blockBtnIcon = user.isBlocked ? "fa-unlock" : "fa-lock";

            var rawAvatar = user.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            var userAvatar = resolveImageUrl(rawAvatar);

            var actionsHtml = "";
            if (currentUser.role === "owner") {
                actionsHtml = '<div class="blog-actions">' +
                '<button class="edit-btn" style="background:' + blockBtnColor + ';color:#fff;border-color:' + blockBtnColor + ';" onclick="toggleBlockUserDashboard(\'' + user._id + '\')"><i class="fa-solid ' + blockBtnIcon + '"></i> ' + blockBtnText + '</button>' +
                '<button class="delete-btn" onclick="deleteUserDashboard(\'' + user._id + '\', \'' + esc(user.name) + '\')"><i class="fa-solid fa-trash-can"></i> Remove</button>' +
                '</div>';
            }

            return '<div class="dashboard-blog" style="border-left:5px solid ' + badgeColor + ';">' +
                '<img src="' + esc(userAvatar) + '" alt="Avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:14px;" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
                '<div class="blog-info" style="flex:1;"><h3>' + esc(user.name) + '</h3><p>Email: <strong>' + esc(user.email) + '</strong> — Role: <span style="font-weight:700;color:' + badgeColor + ';">' + esc(user.role.toUpperCase()) + '</span>' + (user.isBlocked ? ' <span style="color:#EF4444;font-weight:700;">(BLOCKED)</span>' : '') + '</p></div>' +
                actionsHtml +
                '</div>';
        }).join("");
    } catch (err) {
        console.error("Owner user management error:", err);
    }
}

async function toggleBlockUserDashboard(userId) {
    var token = localStorage.getItem("token");
    if (!token) return;
    try {
        var response = await fetch(API_USERS_URL + "/" + userId + "/block", {
            method: "PUT",
            headers: { "Authorization": "Bearer " + token }
        });
        var data = await response.json();
        if (!response.ok) { showToast(data.message || "Failed to toggle block status", "error"); return; }
        showToast(data.message, "success");
        displayOwnerUserManagement();
    } catch (err) {
        showToast("Error updating user block status", "error");
    }
}

async function deleteUserDashboard(userId, name) {
    var token = localStorage.getItem("token");
    if (!token) return;
    
    showConfirmModal("Remove User", "Permanently delete user \"" + esc(name) + "\"? This action cannot be undone.", async function () {
        try {
            var response = await fetch(API_USERS_URL + "/" + userId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            var data = await response.json();
            if (!response.ok) { showToast(data.message || "Could not delete user", "error"); return; }
            showToast("User completely removed.", "success");
            displayOwnerUserManagement();
        } catch (err) {
            showToast("Failed to delete user.", "error");
        }
    }, true);
}

async function displayBlogs() {
    var blogContainer = document.getElementById("blogContainer");
    var adminApprovalSection = document.getElementById("adminApprovalSection");
    var adminPendingContainer = document.getElementById("adminPendingContainer");
    var pendingAdminCount = document.getElementById("pendingAdminCount");
    var currentUser = getCurrentUser();

    if (!blogContainer) return;

    blogContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Loading blogs…</div>';

    try {
        var token = localStorage.getItem("token");
        var headers = token ? { "Authorization": "Bearer " + token } : {};
        var response = await fetch(API_BLOGS_URL + "?all=true", { headers: headers });
        if (!response.ok) throw new Error("Failed to fetch blogs");

        var blogs = await response.json();
        window.allBlogs = blogs;

        var myBlogs = blogs;
        if (currentUser && currentUser.role === "user") {
            myBlogs = blogs.filter(function (b) { return isAuthorMatch(b.author, currentUser); });
        }
        window.allMyBlogs = myBlogs;
        window.currentFilter = window.currentFilter || 'all';

        updateStatistics(myBlogs);
        renderBlogsList();

    } catch (error) {
        console.error("Fetch dashboard blogs error:", error);
        blogContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#EF4444;"><p>Could not load blogs. Please check your connection and try again.</p></div>';
    }
}

function filterDashboardBlogs(filterType) {
    window.currentFilter = filterType;
    renderBlogsList();
}
window.filterDashboardBlogs = filterDashboardBlogs;

// ─── Blog Preview Modal for Owners and Admins ─────────────────────────────────
function openAdminBlogPreview(blogId) {
    var blog = (window.allBlogs || []).find(function (b) { return (b._id || b.id) === blogId; });
    if (!blog) {
        showToast("Could not find blog details.", "error");
        return;
    }

    var overlay = document.getElementById("adminBlogPreviewModal");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "adminBlogPreviewModal";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.8);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
        document.body.appendChild(overlay);
    }

    var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "User";
    var rawAvatar = (blog.author && blog.author.profilePic) ? blog.author.profilePic : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    var authorAvatar = resolveImageUrl(rawAvatar);
    var pubDate = formatDate(blog.createdAt);
    var fullImage = blog.image && blog.image.trim() !== "" ? resolveImageUrl(blog.image) : "";
    var currentUser = getCurrentUser();
    var isAdminOrOwner = currentUser && (currentUser.role === "admin" || currentUser.role === "owner");

    var approveButtons = "";
    var isAuthorOfBlog = isAuthorMatch(blog.author, currentUser);
    var canEditBlog = isAdminOrOwner || isAuthorOfBlog;

    if (canEditBlog) {
        approveButtons += '<button type="button" style="background:#4F46E5;color:#fff;border:none;padding:10px 22px;border-radius:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;" onclick="closeAdminBlogPreview();editBlog(\'' + blogId + '\')"><i class="fa-solid fa-pen"></i> Edit Post</button>';
    }
    if (isAdminOrOwner && !blog.isApproved) {
        approveButtons += '<button type="button" style="background:#10B981;color:#fff;border:none;padding:10px 22px;border-radius:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;" onclick="handleApproveBlogFromModal(\'' + blogId + '\',true)"><i class="fa-solid fa-check"></i> Approve & Publish</button>' +
                         '<button type="button" style="background:#EF4444;color:#fff;border:none;padding:10px 22px;border-radius:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;" onclick="handleApproveBlogFromModal(\'' + blogId + '\',false)"><i class="fa-solid fa-xmark"></i> Reject Post</button>';
    }

    overlay.innerHTML = '<div style="background:#FFFFFF;width:100%;max-width:760px;max-height:90vh;border-radius:24px;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);position:relative;display:flex;flex-direction:column;border:1px solid rgba(99,102,241,0.2);">' +
        '<div style="padding:24px 32px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#FFFFFF;z-index:10;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span style="background:#EEF2FF;color:#4F46E5;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;text-transform:uppercase;">' + esc(blog.category || "General") + '</span>' +
        '<span style="background:' + (blog.isApproved ? '#ECFDF5;color:#059669;' : '#FFFBEB;color:#D97706;') + 'padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;">' + (blog.isApproved ? '✅ Approved' : '⏳ Pending Review') + '</span>' +
        '</div>' +
        '<button type="button" onclick="closeAdminBlogPreview()" style="background:#F1F5F9;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;color:#475569;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div style="padding:32px;flex:1;">' +
        (fullImage ? '<img src="' + esc(fullImage) + '" alt="preview" style="width:100%;max-height:340px;object-fit:cover;border-radius:16px;margin-bottom:24px;box-shadow:0 6px 20px rgba(0,0,0,0.08);">' : '') +
        '<h1 style="font-size:1.85rem;color:#0F172A;font-weight:800;line-height:1.3;margin-bottom:14px;">' + esc(blog.title) + '</h1>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid #F1F5F9;">' +
        '<img src="' + esc(authorAvatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.src=\'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80\'">' +
        '<div><strong style="color:#0F172A;font-size:0.95rem;display:block;">' + esc(authorName) + '</strong>' +
        (pubDate ? '<small style="color:#64748B;font-size:0.82rem;"><i class="fa-regular fa-calendar-days"></i> ' + esc(pubDate) + '</small>' : '') +
        '</div></div>' +
        '<div style="color:#334155;font-size:1.05rem;line-height:1.8;white-space:pre-line;word-break:break-word;">' + esc(blog.content) + '</div>' +
        '</div>' +
        '<div style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap;border-radius:0 0 24px 24px;">' +
        approveButtons +
        '<button type="button" style="background:#E2E8F0;color:#334155;border:none;padding:10px 20px;border-radius:10px;font-weight:600;cursor:pointer;" onclick="closeAdminBlogPreview()">Close</button>' +
        '</div></div>';

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    overlay.onclick = function (e) {
        if (e.target === overlay) closeAdminBlogPreview();
    };
}

function closeAdminBlogPreview() {
    var overlay = document.getElementById("adminBlogPreviewModal");
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
}

async function handleApproveBlogFromModal(blogId, approve) {
    closeAdminBlogPreview();
    await handleApproveBlog(blogId, approve);
}

window.openAdminBlogPreview = openAdminBlogPreview;
window.closeAdminBlogPreview = closeAdminBlogPreview;
window.handleApproveBlogFromModal = handleApproveBlogFromModal;

function renderBlogsList() {
    var blogContainer = document.getElementById("blogContainer");
    var adminApprovalSection = document.getElementById("adminApprovalSection");
    var adminPendingContainer = document.getElementById("adminPendingContainer");
    var pendingAdminCount = document.getElementById("pendingAdminCount");
    var currentUser = getCurrentUser();

    if (!blogContainer) return;

    var blogs = window.allBlogs || [];
    var myBlogs = window.allMyBlogs || [];

    // Filter myBlogs based on currentFilter
    var filteredBlogs = myBlogs;
    if (window.currentFilter === 'published') {
        filteredBlogs = myBlogs.filter(function(b) { return b.isApproved; });
    } else if (window.currentFilter === 'pending') {
        filteredBlogs = myBlogs.filter(function(b) { return !b.isApproved; });
    }

    var isAdminOrOwner = currentUser && (currentUser.role === "admin" || currentUser.role === "owner");

    if (isAdminOrOwner && adminApprovalSection && adminPendingContainer) {
        var pendingBlogs = blogs.filter(function (b) { return !b.isApproved; });
        adminApprovalSection.style.display = "block";
        if (pendingAdminCount) pendingAdminCount.textContent = pendingBlogs.length + " Pending";

        if (pendingBlogs.length === 0) {
            adminPendingContainer.innerHTML = '<p style="color:#92400E;margin:0;">No pending blogs waiting for approval. 🎉</p>';
        } else {
            adminPendingContainer.innerHTML = pendingBlogs.map(function (blog) {
                var blogId = blog._id || blog.id;
                var authorName = blog.author ? (blog.author.name || blog.author.email) : "User";
                var rawBlogImage = blog.image && blog.image.trim() !== "" ? resolveImageUrl(blog.image) : "";

                return '<div class="dashboard-blog" style="border-left:5px solid #F59E0B;">' +
                    (rawBlogImage ? '<img src="' + esc(rawBlogImage) + '" alt="thumb" style="width:96px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;margin-right:12px;" onerror="this.style.display=\'none\'">' : '') +
                    '<div class="blog-info" style="flex:1;"><h3>' + esc(blog.title) + '</h3><p>' + esc((blog.content || "").substring(0, 90)) + (blog.content && blog.content.length > 90 ? "…" : "") + '</p><small>By <strong>' + esc(authorName) + '</strong> · ' + esc(blog.category) + '</small></div>' +
                    '<div class="blog-actions">' +
                    '<button class="edit-btn" style="background:#4F46E5;color:#fff;border-color:#4F46E5;" onclick="openAdminBlogPreview(\'' + blogId + '\')"><i class="fa-solid fa-eye"></i> View Blog</button>' +
                    '<button class="edit-btn" onclick="editBlog(\'' + blogId + '\')"><i class="fa-solid fa-pen"></i> Edit</button>' +
                    '<button class="edit-btn" style="background:#10B981;color:#fff;border-color:#10B981;" onclick="handleApproveBlog(\'' + blogId + '\',true)"><i class="fa-solid fa-check"></i> Approve</button>' +
                    '<button class="delete-btn" onclick="handleApproveBlog(\'' + blogId + '\',false)"><i class="fa-solid fa-xmark"></i> Reject</button>' +
                    '</div></div>';
            }).join("");
        }
    }

    if (filteredBlogs.length === 0) {
        blogContainer.innerHTML = '<div class="empty-state-box">' +
            '<i class="fa-regular fa-folder-open empty-state-icon"></i>' +
            '<h3 class="empty-state-title">No blogs found</h3>' +
            '<p class="empty-state-subtitle">No stories match this filter.</p>' +
            '<a href="createBlog.html" class="create-btn" style="display:inline-flex;text-decoration:none;padding:12px 24px;margin-top:8px;"><i class="fa-solid fa-plus"></i> Create Blog</a></div>';
        return;
    }

    blogContainer.innerHTML = filteredBlogs.map(function (blog) {
        var blogId = blog._id || blog.id;
        var isApproved = blog.isApproved;
        var approvalStatus = blog.approvalStatus || (isApproved ? "approved" : "pending");
        var badgeClass = isApproved ? "published" : "draft";
        var statusText = isApproved ? "✅ Approved & Live" : (approvalStatus === "pending_author" ? "🖊️ Admin edited · Author review needed" : "⏳ Pending Approval");
        var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Unknown";
        var blogImage = blog.image && blog.image.trim() !== "" ? resolveImageUrl(blog.image) : "";
        var pubDate = formatDate(blog.createdAt);

        var isAuthorOfBlog = isAuthorMatch(blog.author, currentUser);
        var canEditDelete = isAdminOrOwner || isAuthorOfBlog;

        var actionsHtml = (
            '<div class="blog-actions">' +
            '<button class="edit-btn" style="background:#4F46E5;color:#fff;border-color:#4F46E5;" onclick="openAdminBlogPreview(\'' + blogId + '\')"><i class="fa-solid fa-eye"></i> View</button>' +
            (canEditDelete ? '<button class="edit-btn" onclick="editBlog(\'' + blogId + '\')"><i class="fa-solid fa-pen"></i> Edit</button>' : '') +
            (canEditDelete ? '<button class="delete-btn" onclick="deleteBlog(\'' + blogId + '\',\'' + esc(blog.title || "") + '\')"><i class="fa-solid fa-trash"></i> Delete</button>' : '') +
            '</div>'
        );

        return '<div class="dashboard-blog">' +
            (blogImage ? '<img src="' + esc(blogImage) + '" alt="thumb" style="width:96px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;margin-right:12px;" onerror="this.style.display=\'none\'">' : '') +
            '<div class="blog-info" style="flex:1;">' +
            '<h3>' + esc(blog.title) + '</h3>' +
            '<p>' + esc((blog.content || "").substring(0, 100)) + (blog.content && blog.content.length > 100 ? "…" : "") + '</p>' +
            '<div style="display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap;">' +
            '<span class="badge ' + badgeClass + '">' + statusText + '</span>' +
            '<span style="font-size:0.8rem;font-weight:600;color:#4F46E5;">' + esc(blog.category || "General") + '</span>' +
            '<small style="color:#64748B;">By ' + esc(authorName) + '</small>' +
            (pubDate ? '<small style="color:#64748B;"><i class="fa-regular fa-calendar-days" style="color:#6366F1;"></i> ' + esc(pubDate) + '</small>' : '') +
            '</div></div>' +
            actionsHtml +
            '</div>';
    }).join("");
}

async function handleApproveBlog(id, approve) {
    var token = localStorage.getItem("token");
    if (!token) return;

    try {
        var response = await fetch(API_BLOGS_URL + "/" + id + "/approve", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ isApproved: approve, approvalStatus: approve ? "approved" : "rejected" })
        });
        var data = await response.json();
        if (!response.ok) { showToast(data.message || "Failed to update status", "error"); return; }
        showToast(approve ? "✅ Blog approved and live!" : "❌ Blog rejected.", approve ? "success" : "info");
        displayBlogs();
    } catch (err) {
        console.error("Approve error:", err);
        showToast("Error updating blog status", "error");
    }
}

function editBlog(id) { window.location.href = "createBlog.html?id=" + id; }

function deleteBlog(id, title) {
    var token = localStorage.getItem("token");
    if (!token) { showToast("Please login first.", "error"); return; }

    showConfirmModal("Delete Blog Post", "Permanently delete \"" + (title || "this blog") + "\"?\n\nThis action cannot be undone.", async function () {
        try {
            var response = await fetch(API_BLOGS_URL + "/" + id, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            var data = await response.json();
            if (!response.ok) { showToast(data.message || "Could not delete blog", "error"); return; }
            showToast("🗑️ Blog deleted successfully.", "success");
            displayBlogs();
        } catch (err) {
            console.error("Delete blog error:", err);
            showToast("Failed to delete blog. Server error.", "error");
        }
    }, true);
}

window.editBlog = editBlog;
window.deleteBlog = deleteBlog;
window.handleApproveBlog = handleApproveBlog;
window.handleApproveAdminUser = handleApproveAdminUser;
window.toggleBlockUserDashboard = toggleBlockUserDashboard;
window.deleteUserDashboard = deleteUserDashboard;

document.addEventListener("DOMContentLoaded", function () {
    setupWelcomeAndAuth();
    displayOwnerAdminRequests();
    displayOwnerUserManagement();
    displayBlogs();
});

