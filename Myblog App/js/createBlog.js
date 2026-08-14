var API_BLOGS_URL = "http://localhost:5000/api/blogs";

document.addEventListener("DOMContentLoaded", async function () {
    var form = document.getElementById("createBlogForm");
    var titleInput = document.getElementById("blog-title");
    var categorySelect = document.getElementById("blog-category");
    var statusSelect = document.getElementById("blog-status");
    var imageInput = document.getElementById("blog-image");
    var imagePreviewContainer = document.getElementById("imagePreviewContainer");
    var imagePreview = document.getElementById("imagePreview");
    var contentInput = document.getElementById("blog-content");
    var pageHeading = document.getElementById("pageHeading");
    var pageSubtitle = document.getElementById("pageSubtitle");
    var submitBtn = document.getElementById("submitBtn");

    if (!form) return;

    function updateImagePreview(url) {
        if (!imagePreview || !imagePreviewContainer) return;
        var trimmed = (url || "").trim();
        if (trimmed === "") {
            imagePreviewContainer.style.display = "none";
            return;
        }
        imagePreviewContainer.style.display = "block";
        imagePreview.onerror = function () {
            imagePreviewContainer.style.display = "none";
            imagePreview.onerror = null;
        };
        imagePreview.onload = function () {
            imagePreviewContainer.style.display = "block";
        };
        imagePreview.src = trimmed;
    }

    if (imageInput) {
        imageInput.addEventListener("input", function () {
            updateImagePreview(this.value);
        });
        imageInput.addEventListener("paste", function () {
            setTimeout(function () { updateImagePreview(imageInput.value); }, 50);
        });
    }

    var token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to create or edit blogs.", "error");
        setTimeout(function () { window.location.href = "login.html"; }, 1200);
        return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get("id");

    if (editId) {
        try {
            var res = await fetch(API_BLOGS_URL + "/" + editId);
            if (res.ok) {
                var blog = await res.json();
                if (pageHeading) pageHeading.textContent = "Edit Blog Post";
                if (pageSubtitle) pageSubtitle.textContent = "Update your post details below.";
                if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Blog';

                if (titleInput) titleInput.value = blog.title || "";
                if (categorySelect) categorySelect.value = blog.category || "";
                if (statusSelect) statusSelect.value = blog.status || "Published";
                if (imageInput && blog.image) {
                    imageInput.value = blog.image;
                    setTimeout(function () { updateImagePreview(blog.image); }, 100);
                }
                if (contentInput) contentInput.value = blog.content || "";
            }
        } catch (err) {
            console.error("Error loading blog for edit:", err);
            showToast("Failed to load blog post for editing.", "error");
        }
    }

    function showError(errorId, message) {
        var el = document.getElementById(errorId);
        if (el) { el.textContent = message; el.style.display = "block"; }
    }

    function clearError(errorId) {
        var el = document.getElementById(errorId);
        if (el) { el.textContent = ""; el.style.display = "none"; }
    }

    function clearAllErrors() {
        clearError("titleError");
        clearError("categoryError");
        clearError("contentError");
        clearError("generalError");
    }

    if (titleInput) titleInput.addEventListener("input", function () { clearError("titleError"); });
    if (categorySelect) categorySelect.addEventListener("change", function () { clearError("categoryError"); });
    if (contentInput) contentInput.addEventListener("input", function () { clearError("contentError"); });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearAllErrors();

        var title = titleInput ? titleInput.value.trim() : "";
        var category = categorySelect ? categorySelect.value : "";
        var status = statusSelect ? statusSelect.value : "Published";
        var image = imageInput ? imageInput.value.trim() : "";
        var content = contentInput ? contentInput.value.trim() : "";

        var valid = true;

        if (!title || title.length < 3) {
            showError("titleError", title ? "Title must be at least 3 characters." : "Blog title is required.");
            valid = false;
        }
        if (!category) {
            showError("categoryError", "Please select a category.");
            valid = false;
        }
        if (!content || content.length < 10) {
            showError("contentError", content ? "Content must be at least 10 characters." : "Blog content is required.");
            valid = false;
        }

        if (!valid) return;

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving…"; }

        try {
            var method = editId ? "PUT" : "POST";
            var endpoint = editId ? API_BLOGS_URL + "/" + editId : API_BLOGS_URL;

            var response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ title: title, category: category, status: status.toLowerCase(), image: image, content: content })
            });

            var data = await response.json();

            if (!response.ok) {
                showError("generalError", data.message || "Failed to save blog post.");
                showToast(data.message || "Failed to save blog post", "error");
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = editId ? '<i class="fa-solid fa-floppy-disk"></i> Update Blog' : '<i class="fa-solid fa-paper-plane"></i> Publish Blog'; }
                return;
            }

            var currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
            var isAdminOrOwner = currentUser.role === "admin" || currentUser.role === "owner";
            var successMsg = isAdminOrOwner
                ? (editId ? "✅ Blog post updated!" : "🎉 Blog published!")
                : (editId ? "✅ Blog updated! Pending Admin approval." : "🎉 Blog created! Pending Admin approval.");

            showToast(successMsg, "success");
            setTimeout(function () { window.location.href = "dashboard.html"; }, 1200);
        } catch (err) {
            console.error("Save blog error:", err);
            showError("generalError", "Server error. Could not connect to backend.");
            showToast("Server error connecting to backend.", "error");
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Blog'; }
        }
    });
});
