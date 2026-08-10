// ==========================================
// DASHBOARD.JS - User Dashboard Controller
// ==========================================

const defaultBlogs = [
    {
        id: 1,
        title: "JavaScript Essentials",
        category: "Programming",
        content: "Learn the fundamentals of JavaScript and modern web scripting.",
        image: "Assets/images/blog1.avif",
        status: "Published",
        author: "Alex Johnson",
        createdAt: "2026-08-01"
    },
    {
        id: 2,
        title: "Getting Started with HTML",
        category: "Technology",
        content: "Learn the fundamentals of HTML and build your first website structure.",
        image: "Assets/images/blog2.avif",
        status: "Published",
        author: "Sarah Connor",
        createdAt: "2026-08-03"
    },
    {
        id: 3,
        title: "Modern CSS Tricks",
        category: "Web Design",
        content: "Explore modern CSS techniques for creating beautiful websites using Flexbox and Grid.",
        image: "Assets/images/blog3.avif",
        status: "Draft",
        author: "Michael Scott",
        createdAt: "2026-08-05"
    }
];

function getBlogs() {
    if (!localStorage.getItem("blogs")) {
        localStorage.setItem("blogs", JSON.stringify(defaultBlogs));
    }
    try {
        return JSON.parse(localStorage.getItem("blogs")) || defaultBlogs;
    } catch (e) {
        return defaultBlogs;
    }
}

function saveBlogsToStorage(blogs) {
    localStorage.setItem("blogs", JSON.stringify(blogs));
}

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
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("currentUser");
                window.location.href = "index.html";
            }
        });
    }
}

function updateStatistics(blogs) {
    const totalBlogs = document.getElementById("totalBlogs");
    const publishedBlogs = document.getElementById("publishedBlogs");
    const draftBlogs = document.getElementById("draftBlogs");

    const publishedCount = blogs.filter(b => b.status === "Published").length;
    const draftCount = blogs.filter(b => b.status === "Draft").length;

    if (totalBlogs) totalBlogs.textContent = blogs.length;
    if (publishedBlogs) publishedBlogs.textContent = publishedCount;
    if (draftBlogs) draftBlogs.textContent = draftCount;
}

function displayBlogs() {
    const blogContainer = document.getElementById("blogContainer");
    if (!blogContainer) return;

    const blogs = getBlogs();
    updateStatistics(blogs);

    if (blogs.length === 0) {
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

    blogContainer.innerHTML = blogs.map(blog => {
        const isPublished = blog.status === "Published";
        const badgeClass = isPublished ? "published" : "draft";
        
        return `
            <div class="dashboard-blog">
                <div class="blog-info">
                    <h3>${escapeHTML(blog.title)}</h3>
                    <p>${escapeHTML(blog.content)}</p>
                    <span class="badge ${badgeClass}">${escapeHTML(blog.status || "Draft")}</span>
                </div>

                <div class="blog-actions">
                    <button class="edit-btn" onclick="editBlog(${blog.id})">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteBlog(${blog.id})">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// Edit Blog Navigation
function editBlog(id) {
    window.location.href = `createBlog.html?id=${id}`;
}

// Delete Blog Handler
function deleteBlog(id) {
    let blogs = getBlogs();
    const blog = blogs.find(b => b.id === id);

    if (blog) {
        const confirmDelete = confirm(`Are you sure you want to delete "${blog.title}"?`);
        if (confirmDelete) {
            blogs = blogs.filter(b => b.id !== id);
            saveBlogsToStorage(blogs);
            displayBlogs();
        }
    }
}

// Expose handlers globally for inline onclick attributes
window.editBlog = editBlog;
window.deleteBlog = deleteBlog;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
    setupWelcomeAndAuth();
    displayBlogs();
});
