var API_BLOGS_URL = "http://localhost:5000/api/blogs";
var API_ADMIN_REQ_URL = "http://localhost:5000/api/auth/admin-requests";

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
}

function esc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function setupWelcomeAndAuth() {
    var welcomeHeading = document.getElementById("welcomeHeading");
    var userRoleBadgeText = document.getElementById("userRoleBadgeText");
    var adminSettingsNavLink = document.getElementById("adminSettingsNavLink");
    var adminSettingsBtn = document.getElementById("adminSettingsBtn");
    var dashboardAvatarEl = document.getElementById("dashboardAvatar");
    var currentUser = getCurrentUser();

    if (welcomeHeading && currentUser && currentUser.name) {
        welcomeHeading.textContent = "Hey, " + currentUser.name + "! 👋";
    }

    if (dashboardAvatarEl && currentUser) {
        dashboardAvatarEl.src = currentUser.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
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

        var myBlogs = blogs;
        if (currentUser && currentUser.role === "user") {
            myBlogs = blogs.filter(function (b) { return b.author && (b.author._id === currentUser.id || b.author.email === currentUser.email); });
        }

        updateStatistics(myBlogs);

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
                    return '<div class="dashboard-blog" style="border-left:5px solid #F59E0B;">' +
                        '<div class="blog-info"><h3>' + esc(blog.title) + '</h3><p>' + esc((blog.content || "").substring(0, 90)) + (blog.content && blog.content.length > 90 ? "…" : "") + '</p><small>By <strong>' + esc(authorName) + '</strong> · ' + esc(blog.category) + '</small></div>' +
                        '<div class="blog-actions">' +
                        '<button class="edit-btn" style="background:#10B981;color:#fff;border-color:#10B981;" onclick="handleApproveBlog(\'' + blogId + '\',true)"><i class="fa-solid fa-check"></i> Approve</button>' +
                        '<button class="delete-btn" onclick="handleApproveBlog(\'' + blogId + '\',false)"><i class="fa-solid fa-xmark"></i> Reject</button>' +
                        '</div></div>';
                }).join("");
            }
        }

        if (myBlogs.length === 0) {
            blogContainer.innerHTML = '<div style="text-align:center;padding:48px;background:#fff;border-radius:16px;color:#64748B;">' +
                '<i class="fa-regular fa-folder-open" style="font-size:3rem;color:#94A3B8;margin-bottom:14px;display:block;"></i>' +
                '<h3 style="margin-bottom:8px;color:#0F172A;">No blogs yet</h3>' +
                '<p style="margin-bottom:18px;">You haven\'t created any stories yet.</p>' +
                '<a href="createBlog.html" class="create-btn" style="display:inline-flex;text-decoration:none;padding:12px 24px;"><i class="fa-solid fa-plus"></i> Create Blog</a></div>';
            return;
        }

        blogContainer.innerHTML = myBlogs.map(function (blog) {
            var blogId = blog._id || blog.id;
            var isApproved = blog.isApproved;
            var approvalStatus = blog.approvalStatus || (isApproved ? "approved" : "pending");
            var badgeClass = isApproved ? "published" : "draft";
            var statusText = isApproved ? "✅ Approved & Live" : (approvalStatus === "pending_author" ? "🖊️ Admin edited · Author review needed" : "⏳ Pending Approval");
            var authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Unknown";
            var blogImage = blog.image && blog.image.trim() !== "" ? blog.image : "";

            var isAuthorOfBlog = currentUser && blog.author && (blog.author._id === currentUser.id || blog.author.email === currentUser.email);
            var canEditDelete = isAdminOrOwner || isAuthorOfBlog;

            var actionsHtml = canEditDelete ? (
                '<div class="blog-actions">' +
                '<button class="edit-btn" onclick="editBlog(\'' + blogId + '\')"><i class="fa-solid fa-pen"></i> Edit</button>' +
                '<button class="delete-btn" onclick="deleteBlog(\'' + blogId + '\',\'' + esc(blog.title || "") + '\')"><i class="fa-solid fa-trash"></i> Delete</button>' +
                '</div>'
            ) : "";

            return '<div class="dashboard-blog">' +
                (blogImage ? '<img src="' + esc(blogImage) + '" alt="thumb" style="width:96px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;" onerror="this.style.display=\'none\'">' : '') +
                '<div class="blog-info" style="flex:1;">' +
                '<h3>' + esc(blog.title) + '</h3>' +
                '<p>' + esc((blog.content || "").substring(0, 100)) + (blog.content && blog.content.length > 100 ? "…" : "") + '</p>' +
                '<div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap;">' +
                '<span class="badge ' + badgeClass + '">' + statusText + '</span>' +
                '<span style="font-size:0.8rem;font-weight:600;color:#4F46E5;">' + esc(blog.category || "General") + '</span>' +
                '<small style="color:#64748B;">By ' + esc(authorName) + '</small>' +
                '</div></div>' +
                actionsHtml +
                '</div>';
        }).join("");

    } catch (error) {
        console.error("Fetch dashboard blogs error:", error);
        blogContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#EF4444;"><p>Could not load blogs. Make sure backend is running on http://localhost:5000</p></div>';
    }
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

document.addEventListener("DOMContentLoaded", function () {
    setupWelcomeAndAuth();
    displayOwnerAdminRequests();
    displayBlogs();
});
