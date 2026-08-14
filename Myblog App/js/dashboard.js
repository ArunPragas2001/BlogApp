// ==========================================
// DASHBOARD.JS - API Backend & Toast Integration
// ==========================================

const API_BLOGS_URL = "http://localhost:5000/api/blogs";

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
    const currentUser = getCurrentUser();

    if (welcomeHeading && currentUser && currentUser.name) {
        welcomeHeading.textContent = `Welcome back, ${currentUser.name}! 👋`;
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

function updateStatistics(blogs) {
    const totalBlogs = document.getElementById("totalBlogs");
    const publishedBlogs = document.getElementById("publishedBlogs");
    const draftBlogs = document.getElementById("draftBlogs");

    const publishedCount = blogs.filter(b => (b.status || "").toLowerCase() === "published").length;
    const draftCount = blogs.filter(b => (b.status || "").toLowerCase() === "draft").length;

    if (totalBlogs) totalBlogs.textContent = blogs.length;
    if (publishedBlogs) publishedBlogs.textContent = publishedCount;
    if (draftBlogs) draftBlogs.textContent = draftCount;
}

async function displayBlogs() {
    const blogContainer = document.getElementById("blogContainer");
    if (!blogContainer) return;

    blogContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748B;">
            <p><i class="fa-solid fa-spinner fa-spin"></i> Loading blogs from MongoDB...</p>
        </div>
    `;

    try {
        const response = await fetch(API_BLOGS_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch blogs");
        }
        const blogs = await response.json();
        updateStatistics(blogs);

        if (blogs.length === 0) {
            blogContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff; border-radius: 16px; color: #64748B;">
                    <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: #94A3B8; margin-bottom: 12px; display: block;"></i>
                    <h3 style="margin-bottom: 8px; color: #0F172A;">No blogs found in MongoDB</h3>
                    <p style="margin-bottom: 16px;">You haven't created any stories yet.</p>
                    <a href="createBlog.html" class="create-btn-sm" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                        <i class="fa-solid fa-plus"></i> Create Blog
                    </a>
                </div>
            `;
            return;
        }

        blogContainer.innerHTML = blogs.map(blog => {
            const isPublished = (blog.status || "").toLowerCase() === "published";
            const badgeClass = isPublished ? "published" : "draft";
            const authorName = blog.author ? (blog.author.name || blog.author.email || "Author") : "Unknown";
            const blogId = blog._id || blog.id;
            const blogImage = blog.image ? escapeHTML(blog.image) : "";

            return `
                <div class="dashboard-blog" style="display: flex; gap: 20px; align-items: center;">
                    ${blogImage ? `<img src="${blogImage}" alt="Blog Image" style="width: 100px; height: 75px; object-fit: cover; border-radius: 10px; flex-shrink: 0;" onerror="this.style.display='none'">` : ''}
                    <div class="blog-info" style="flex-grow: 1;">
                        <h3>${escapeHTML(blog.title)}</h3>
                        <p>${escapeHTML(blog.content)}</p>
                        <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
                            <span class="badge ${badgeClass}">${escapeHTML(blog.status || "published")}</span>
                            <small style="color: #64748B;">By ${escapeHTML(authorName)}</small>
                        </div>
                    </div>

                    <div class="blog-actions" style="flex-shrink: 0;">
                        <button class="edit-btn" onclick="editBlog('${blogId}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteBlog('${blogId}', '${escapeHTML(blog.title).replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
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

// Edit Blog Navigation
function editBlog(id) {
    window.location.href = `createBlog.html?id=${id}`;
}

// Delete Blog Handler
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

document.addEventListener("DOMContentLoaded", function () {
    setupWelcomeAndAuth();
    displayBlogs();
});
