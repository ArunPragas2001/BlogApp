// ==========================================
// CREATEBLOG.JS - Create & Edit Blog Controller
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("createBlogForm");
    const titleInput = document.getElementById("blog-title");
    const categorySelect = document.getElementById("blog-category");
    const statusSelect = document.getElementById("blog-status");
    const imageInput = document.getElementById("blog-image");
    const contentInput = document.getElementById("blog-content");
    const pageHeading = document.getElementById("pageHeading");
    const pageSubtitle = document.getElementById("pageSubtitle");
    const submitBtn = document.getElementById("submitBtn");

    if (!form) return;

    // Read edit mode ID from URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("id") ? parseInt(urlParams.get("id"), 10) : null;

    let blogs = [];
    try {
        blogs = JSON.parse(localStorage.getItem("blogs")) || [];
    } catch (e) {
        blogs = [];
    }

    let existingBlog = null;
    if (editId) {
        existingBlog = blogs.find(b => b.id === editId);
        if (existingBlog) {
            // Populate form for editing
            if (pageHeading) pageHeading.textContent = "Edit Blog";
            if (pageSubtitle) pageSubtitle.textContent = "Update your post details below.";
            if (submitBtn) {
                submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update Blog`;
            }

            if (titleInput) titleInput.value = existingBlog.title || "";
            if (categorySelect) categorySelect.value = existingBlog.category || "";
            if (statusSelect) statusSelect.value = existingBlog.status || "Published";
            if (imageInput) imageInput.value = existingBlog.image || "";
            if (contentInput) contentInput.value = existingBlog.content || "";
        }
    }

    // Helper functions for UI feedback
    function showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = "block";
        }
    }

    function clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = "";
            errorElement.style.display = "none";
        }
    }

    function clearAllErrors() {
        clearError("titleError");
        clearError("categoryError");
        clearError("contentError");
        clearError("generalError");
    }

    // Validation functions
    function validateTitle(title) {
        if (!title || title.trim() === "") {
            showError("titleError", "Blog title is required.");
            return false;
        } else if (title.trim().length < 3) {
            showError("titleError", "Title must be at least 3 characters long.");
            return false;
        } else {
            clearError("titleError");
            return true;
        }
    }

    function validateCategory(category) {
        if (!category || category === "") {
            showError("categoryError", "Please select a category.");
            return false;
        } else {
            clearError("categoryError");
            return true;
        }
    }

    function validateContent(content) {
        if (!content || content.trim() === "") {
            showError("contentError", "Blog content is required.");
            return false;
        } else if (content.trim().length < 10) {
            showError("contentError", "Content must be at least 10 characters long.");
            return false;
        } else {
            clearError("contentError");
            return true;
        }
    }

    // Live validation clearing on input
    if (titleInput) titleInput.addEventListener("input", () => clearError("titleError"));
    if (categorySelect) categorySelect.addEventListener("change", () => clearError("categoryError"));
    if (contentInput) contentInput.addEventListener("input", () => clearError("contentError"));

    // Form submit listener
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearAllErrors();

        const title = titleInput ? titleInput.value.trim() : "";
        const category = categorySelect ? categorySelect.value : "";
        const status = statusSelect ? statusSelect.value : "Published";
        const image = imageInput ? imageInput.value.trim() : "";
        const content = contentInput ? contentInput.value.trim() : "";

        const isTitleValid = validateTitle(title);
        const isCategoryValid = validateCategory(category);
        const isContentValid = validateContent(content);

        if (!isTitleValid || !isCategoryValid || !isContentValid) {
            return;
        }

        // Get logged in user name for author field
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem("currentUser"));
        } catch (err) {
            currentUser = null;
        }

        const authorName = currentUser ? currentUser.name : "Anonymous";

        if (existingBlog) {
            // Update existing blog
            existingBlog.title = title;
            existingBlog.category = category;
            existingBlog.status = status;
            existingBlog.image = image || existingBlog.image || "Assets/images/blog1.avif";
            existingBlog.content = content;
            alert("Blog updated successfully!");
        } else {
            // Create new blog
            const newBlog = {
                id: Date.now(),
                title: title,
                category: category,
                status: status,
                image: image || "Assets/images/blog1.avif",
                content: content,
                author: authorName,
                createdAt: new Date().toISOString().split("T")[0]
            };
            blogs.unshift(newBlog);
            alert("Blog published successfully!");
        }

        // Save back to localStorage
        localStorage.setItem("blogs", JSON.stringify(blogs));

        // Redirect to dashboard
        window.location.href = "dashboard.html";
    });
});
