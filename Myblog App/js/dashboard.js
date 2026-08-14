const API_BLOGS_URL = "http://localhost:5000/api/blogs";
const API_ADMIN_REQ_URL = "http://localhost:5000/api/auth/admin-requests";

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
        return null;
    }
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

function setupWelcomeAndAuth() {
    const welcomeHeading = document.getElementById("welcomeHeading");
    const userRoleBadgeText = document.getElementById("userRoleBadgeText");
    const adminSettingsNavLink = document.getElementById("adminSettingsNavLink");
    const adminSettingsBtn = document.getElementById("adminSettingsBtn");
    const currentUser = getCurrentUser();

    if (welcomeHeading && currentUser && currentUser.name) {
        welcomeHeading.textContent = `Hey, ${currentUser.name}! 👋`;
        if (currentUser.role === "owner" && userRoleBadgeText) {
            userRoleBadgeText.innerHTML = `<strong>Role: System Owner (Super Admin)</strong> — Full authority over Admin approvals, post approvals, and site settings.`;
        } else if (currentUser.role === "admin" && userRoleBadgeText) {
            userRoleBadgeText.innerHTML = `<strong>Role: Administrator</strong> — Control over post approvals and site settings.`;
        }
    }

    if (currentUser && (currentUser.role === "admin" || currentUser.role === "owner")) {
        if (adminSettingsNavLink) adminSettingsNavLink.style.display = "block";
        if (adminSettingsBtn) adminSettingsBtn.style.display = "inline-flex";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            showConfirmModal(
                "Confirm Logout",
                "Are you sure you want to log out of your session?",
                () => {
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("token");
                    showToast("Logged out successfully.", "info");
                    setTimeout(() => window.location.href = "login.html", 600);
                },
                false
            );
        });
    }
}

function updateStatistics(allBlogs, myBlogs) {
    const totalBlogs = document.getElementById("totalBlogs");
    const publishedBlogs = document.getElementById("publishedBlogs");
    const draftBlogs = document.getElementById("draftBlogs");

    const approvedCount = myBlogs.filter(b => b.isApproved).length;
    const pendingCount = myBlogs.filter(b => !b.isApproved).length;

    if (totalBlogs) totalBlogs.textContent = myBlogs.length;
    if (publishedBlogs) publishedBlogs.textContent = approvedCount;
    if (draftBlogs) draftBlogs.textContent = pendingCount;
}

async function displayOwnerAdminRequests() {
    const currentUser = getCurrentUser();
    const ownerAdminRequestSection = document.getElementById("ownerAdminRequestSection");
    const ownerAdminReqContainer = document.getElementById("ownerAdminReqContainer");
    const pendingAdminReqCount = document.getElementById("pendingAdminReqCount");

    if (!currentUser || (currentUser.role !== "owner" && currentUser.email !== "pragasarun1@gmail.com")) {
        if (ownerAdminRequestSection) ownerAdminRequestSection.style.display = "none";
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_ADMIN_REQ_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) return;
        const requests = await res.json();

        if (ownerAdminRequestSection) ownerAdminRequestSection.style.display = "block";
        if (pendingAdminReqCount) pendingAdminReqCount.textContent = `${requests.length} Requests`;

        if (requests.length === 0) {
            ownerAdminReqContainer.innerHTML = `<p style="color: #3730A3; margin: 0;">No pending Admin registration requests.</p>`;
            return;
        }

        ownerAdminReqContainer.innerHTML = requests.map(user => {
            const userId = user._id;
            return `
                <div class="dashboard-blog" style="background: #FFF; border-left: 5px solid #6366F1; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; color: #1E293B;">${escapeHTML(user.name)}</h3>
                        <p style="margin: 0; color: #64748B; font-size: 0.88rem;">Email: <strong>${escapeHTML(user.email)}</strong> | Status: Pending Owner Approval</p>
                    </div>
                    <div class="blog-actions">
                        <button class="create-btn-sm" style="background: #10B981; border-color: #10B981; cursor: pointer;" onclick="handleApproveAdminUser('${userId}', true)">
                            <i class="fa-solid fa-user-check"></i> Approve Admin
                        </button>
                        <button class="delete-btn" onclick="handleApproveAdminUser('${userId}', false)">
                            <i class="fa-solid fa-user-xmark"></i> Reject
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Owner admin requests error:", err);
    }
}

async function handleApproveAdminUser(userId, approve) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_ADMIN_REQ_URL}/${userId}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ approve })
        });

        const data = await response.json();
        if (!response.ok) {
            showToast(data.message || "Failed to update admin user status", "error");
            return;
        }

        showToast(approve ? `✅ ${data.name} is now an Approved Administrator!` : `❌ Admin request rejected for ${data.name}`, approve ? "success" : "info");
        displayOwnerAdminRequests();
    } catch (err) {
        console.error("Approve admin error:", err);
        showToast("Error processing admin request", "error");
    }
}

async function displayBlogs() {
    const blogContainer = document.getElementById("blogContainer");
    const adminApprovalSection = document.getElementById("adminApprovalSection");
    const adminPendingContainer = document.getElementById("adminPendingContainer");
    const pendingAdminCount = document.getElementById("pendingAdminCount");
    const currentUser = getCurrentUser();

    if (!blogContainer) return;

    blogContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748B;">
            <p><i class="fa-solid fa-spinner fa-spin"></i> Loading blogs from MongoDB...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        const fetchUrl = `${API_BLOGS_URL}?all=true`;
        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error("Failed to fetch blogs");
        }
        const blogs = await response.json();

        let myBlogs = blogs;
        if (currentUser && currentUser.role === "user") {
            myBlogs = blogs.filter(b => b.author && (b.author._id === currentUser.id || b.author.email === currentUser.email));
        }

        updateStatistics(blogs, myBlogs);

        if (currentUser && (currentUser.role === "admin" || currentUser.role === "owner") && adminApprovalSection && adminPendingContainer) {
            const pendingBlogs = blogs.filter(b => !b.isApproved);
            adminApprovalSection.style.display = "block";
            if (pendingAdminCount) pendingAdminCount.textContent = `${pendingBlogs.length} Pending`;

            if (pendingBlogs.length === 0) {
                adminPendingContainer.innerHTML = `<p style="color: #92400E; margin: 0;">No pending blogs waiting for approval.</p>`;
            } else {
                adminPendingContainer.innerHTML = pendingBlogs.map(blog => {
                    const blogId = blog._id || blog.id;
                    const authorName = blog.author ? (blog.author.name || blog.author.email) : "User";
                    return `
                        <div class="dashboard-blog" style="background: #FFF; border-left: 5px solid #F59E0B; margin-bottom: 12px;">
                            <div class="blog-info">
                                <h3>${escapeHTML(blog.title)}</h3>
                                <p>${escapeHTML(blog.content)}</p>
                                <div style="margin-top: 6px;">
                                    <small style="color: #64748B;">By <strong>${escapeHTML(authorName)}</strong> | Category: ${escapeHTML(blog.category)}</small>
                                </div>
                            </div>
                            <div class="blog-actions">
                                <button class="create-btn-sm" style="background: #10B981; border-color: #10B981; cursor: pointer;" onclick="handleApproveBlog('${blogId}', true)">
                                    <i class="fa-solid fa-check"></i> Approve Post
                                </button>
                                <button class="delete-btn" onclick="handleApproveBlog('${blogId}', false)">
                                    <i class="fa-solid fa-xmark"></i> Reject
                                </button>
                            </div>
                        </div>
                    `;
                }).join("");
            }
        }

        if (myBlogs.length === 0) {
            blogContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff; border-radius: 16px; color: #64748B;">
                    <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: #94A3B8; margin-bottom: 12px; display: block;"></i>
                    <h3 style="margin-bottom: 8px; color: #0F172A;">No blogs found</h3>
                    <p style="margin-bottom: 16px;">You haven't created any stories yet.</p>
                    <a href="createBlog.html" class="create-btn-sm" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                        <i class="fa-solid fa-plus"></i> Create Blog
                    </a>
                </div>
            `;
            return;
        }

        blogContainer.innerHTML = myBlogs.map(blog => {
            const isApproved = blog.isApproved;
            const badgeClass = isApproved ? "published" : "draft";
            const statusText = isApproved ? "Approved & Live" : "Pending Admin Approval";
            const authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Unknown";
            const blogId = blog._id || blog.id;
            const blogImage = blog.image ? escapeHTML(blog.image) : "";

            const isAuthorOrAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "owner" || (blog.author && (blog.author._id === currentUser.id || blog.author.email === currentUser.email)));

            return `
                <div class="dashboard-blog" style="display: flex; gap: 20px; align-items: center;">
                    ${blogImage ? `<img src="${blogImage}" alt="Blog Image" style="width: 100px; height: 75px; object-fit: cover; border-radius: 10px; flex-shrink: 0;" onerror="this.style.display='none'">` : ''}
                    <div class="blog-info" style="flex-grow: 1;">
                        <h3>${escapeHTML(blog.title)}</h3>
                        <p>${escapeHTML(blog.content)}</p>
                        <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
                            <span class="badge ${badgeClass}">${statusText}</span>
                            <span style="font-size: 0.8rem; font-weight: 600; color: #4F46E5;">${escapeHTML(blog.category || "General")}</span>
                            <small style="color: #64748B;">By ${escapeHTML(authorName)}</small>
                        </div>
                    </div>

                    ${isAuthorOrAdmin ? `
                        <div class="blog-actions" style="flex-shrink: 0;">
                            <button class="edit-btn" onclick="editBlog('${blogId}')">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="delete-btn" onclick="deleteBlog('${blogId}', '${escapeHTML(blog.title).replace(/'/g, "\\'")}')">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Fetch dashboard blogs error:", error);
        blogContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #EF4444;">
                <p>Could not load blogs from backend API. Make sure server is running on http://localhost:5000</p>
            </div>
        `;
    }
}

async function handleApproveBlog(id, approve) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_BLOGS_URL}/${id}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                isApproved: approve,
                approvalStatus: approve ? "approved" : "rejected"
            })
        });

        const data = await response.json();
        if (!response.ok) {
            showToast(data.message || "Failed to update approval status", "error");
            return;
        }

        showToast(approve ? "✅ Blog approved and published live!" : "❌ Blog rejected.", approve ? "success" : "info");
        displayBlogs();
    } catch (err) {
        console.error("Approve error:", err);
        showToast("Error updating blog status", "error");
    }
}

function editBlog(id) {
    window.location.href = `createBlog.html?id=${id}`;
}

function deleteBlog(id, title) {
    const token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to delete blogs.", "error");
        return;
    }

    showConfirmModal(
        "Delete Blog Post",
        `Are you sure you want to permanently delete "${title || 'this blog'}"?`,
        async () => {
            try {
                const response = await fetch(`${API_BLOGS_URL}/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    showToast(data.message || "Could not delete blog", "error");
                    return;
                }

                showToast("🗑️ Blog deleted successfully from MongoDB.", "success");
                displayBlogs();
            } catch (err) {
                console.error("Delete blog error:", err);
                showToast("Failed to delete blog. Server connection error.", "error");
            }
        },
        true
    );
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
