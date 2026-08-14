const API_BLOGS_URL = "http://localhost:5000/api/blogs";

document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("createBlogForm");
    const titleInput = document.getElementById("blog-title");
    const categorySelect = document.getElementById("blog-category");
    const statusSelect = document.getElementById("blog-status");
    const imageInput = document.getElementById("blog-image");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const contentInput = document.getElementById("blog-content");
    const pageHeading = document.getElementById("pageHeading");
    const pageSubtitle = document.getElementById("pageSubtitle");
    const submitBtn = document.getElementById("submitBtn");

    if (!form) return;

    function updateImagePreview(url) {
        if (url && url.trim() !== "") {
            imagePreview.src = url.trim();
            imagePreviewContainer.style.display = "block";
            imagePreview.onerror = function () {
                imagePreviewContainer.style.display = "none";
            };
        } else {
            imagePreviewContainer.style.display = "none";
        }
    }

    if (imageInput && imagePreview && imagePreviewContainer) {
        ["input", "keyup", "paste", "change"].forEach(evt => {
            imageInput.addEventListener(evt, function () {
                setTimeout(() => updateImagePreview(this.value), 10);
            });
        });
    }

    const token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to create or edit blogs.", "error");
        setTimeout(() => window.location.href = "login.html", 1200);
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("id");

    if (editId) {
        try {
            const res = await fetch(`${API_BLOGS_URL}/${editId}`);
            if (res.ok) {
                const blog = await res.json();
                if (pageHeading) pageHeading.textContent = "Edit Blog";
                if (pageSubtitle) pageSubtitle.textContent = "Update your post details below.";
                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update Blog`;
                }

                if (titleInput) titleInput.value = blog.title || "";
                if (categorySelect) categorySelect.value = blog.category || "";
                if (statusSelect) statusSelect.value = blog.status || "Published";
                if (imageInput) {
                    imageInput.value = blog.image || "";
                    updateImagePreview(blog.image);
                }
                if (contentInput) contentInput.value = blog.content || "";
            }
        } catch (err) {
            console.error("Error loading blog for edit:", err);
            showToast("Failed to load blog post for editing.", "error");
        }
    }

    function showError(errorId, message) {
        const el = document.getElementById(errorId);
        if (el) {
            el.textContent = message;
            el.style.display = "block";
        }
    }

    function clearError(errorId) {
        const el = document.getElementById(errorId);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    }

    function clearAllErrors() {
        clearError("titleError");
        clearError("categoryError");
        clearError("contentError");
        clearError("generalError");
    }

    function validateTitle(title) {
        if (!title || title.trim() === "") {
            showError("titleError", "Blog title is required.");
            return false;
        } else if (title.trim().length < 3) {
            showError("titleError", "Title must be at least 3 characters long.");
            return false;
        }
        clearError("titleError");
        return true;
    }

    function validateCategory(category) {
        if (!category || category === "") {
            showError("categoryError", "Please select a category.");
            return false;
        }
        clearError("categoryError");
        return true;
    }

    function validateContent(content) {
        if (!content || content.trim() === "") {
            showError("contentError", "Blog content is required.");
            return false;
        } else if (content.trim().length < 10) {
            showError("contentError", "Content must be at least 10 characters long.");
            return false;
        }
        clearError("contentError");
        return true;
    }

    if (titleInput) titleInput.addEventListener("input", () => clearError("titleError"));
    if (categorySelect) categorySelect.addEventListener("change", () => clearError("categoryError"));
    if (contentInput) contentInput.addEventListener("input", () => clearError("contentError"));

    form.addEventListener("submit", async function (e) {
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

        if (submitBtn) submitBtn.disabled = true;

        try {
            const method = editId ? "PUT" : "POST";
            const endpoint = editId ? `${API_BLOGS_URL}/${editId}` : API_BLOGS_URL;

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    category,
                    status: status.toLowerCase(),
                    image,
                    content
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showError("generalError", data.message || "Failed to save blog post.");
                showToast(data.message || "Failed to save blog post", "error");
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            const isUserAdmin = JSON.parse(localStorage.getItem("currentUser") || "{}").role === "admin";
            const successMsg = isUserAdmin 
                ? (editId ? "✅ Blog post updated successfully!" : "🎉 Blog post published!")
                : (editId ? "✅ Blog updated! Sent to Admin for approval." : "🎉 Blog created! Sent to Admin for approval.");

            showToast(successMsg, "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } catch (err) {
            console.error("Save blog error:", err);
            showError("generalError", "Server error. Could not connect to backend.");
            showToast("Server error connecting to backend.", "error");
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});
