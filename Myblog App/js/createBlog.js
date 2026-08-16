var API_BLOGS_URL = "http://localhost:5000/api/blogs";
var API_UPLOAD_URL = "http://localhost:5000/api/upload";

// Holds the uploaded/entered image URL
var _currentImageUrl = "";

document.addEventListener("DOMContentLoaded", async function () {
    var form = document.getElementById("createBlogForm");
    if (!form) return;

    var titleInput = document.getElementById("blog-title");
    var categorySelect = document.getElementById("blog-category");
    var statusSelect = document.getElementById("blog-status");
    var imageUrlInput = document.getElementById("blog-image");          // URL text input
    var imageUploadInput = document.getElementById("blogImageUpload");  // File input
    var imagePreviewContainer = document.getElementById("imagePreviewContainer");
    var imagePreview = document.getElementById("imagePreview");
    var removePhotoBtn = document.getElementById("removePhotoBtn");
    var contentInput = document.getElementById("blog-content");
    var pageHeading = document.getElementById("pageHeading");
    var pageSubtitle = document.getElementById("pageSubtitle");
    var submitBtn = document.getElementById("submitBtn");
    var uploadProgressEl = document.getElementById("uploadProgress");

    var token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to create or edit blogs.", "error");
        setTimeout(function () { window.location.href = "login.html"; }, 1200);
        return;
    }

    // ─── Image Preview Helpers ────────────────────────────────────────────────
    function showImagePreview(url) {
        _currentImageUrl = (url || "").trim();
        if (!imagePreview || !imagePreviewContainer) return;
        if (!_currentImageUrl) {
            imagePreviewContainer.style.display = "none";
            return;
        }
        imagePreview.onerror = function () {
            this.onerror = null;
            imagePreviewContainer.style.display = "none";
            _currentImageUrl = "";
            if (imageUrlInput) imageUrlInput.value = "";
            showToast("Could not load image from that URL.", "error");
        };
        imagePreview.onload = function () {
            imagePreviewContainer.style.display = "block";
        };
        imagePreview.src = _currentImageUrl;
    }

    function clearImage() {
        _currentImageUrl = "";
        if (imageUrlInput) imageUrlInput.value = "";
        if (imageUploadInput) imageUploadInput.value = "";
        if (imagePreview) imagePreview.src = "";
        if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
    }

    // ─── URL Input → live preview ────────────────────────────────────────────
    if (imageUrlInput) {
        ["input", "paste", "change"].forEach(function (evt) {
            imageUrlInput.addEventListener(evt, function () {
                clearTimeout(imageUrlInput._debounce);
                imageUrlInput._debounce = setTimeout(function () {
                    showImagePreview(imageUrlInput.value);
                }, 300);
            });
        });
    }

    // ─── File Upload ─────────────────────────────────────────────────────────
    if (imageUploadInput) {
        imageUploadInput.addEventListener("change", async function () {
            var file = this.files && this.files[0];
            if (!file) return;

            // Validate file size client-side (10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast("Image must be under 10 MB.", "error");
                this.value = "";
                return;
            }

            var formData = new FormData();
            formData.append("image", file);

            // Show loading state
            if (uploadProgressEl) { uploadProgressEl.style.display = "flex"; }
            showToast("Uploading image...", "info");

            try {
                var res = await fetch(API_UPLOAD_URL, {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + token },
                    body: formData
                });

                var data = await res.json();

                if (res.ok && data.url) {
                    if (imageUrlInput) imageUrlInput.value = data.url;
                    showImagePreview(data.url);
                    showToast("✅ Image uploaded successfully!", "success");
                } else {
                    showToast(data.message || "Upload failed. Please try again.", "error");
                    this.value = "";
                }
            } catch (err) {
                console.error("Image upload error:", err);
                showToast("Upload error. Check your connection.", "error");
                this.value = "";
            } finally {
                if (uploadProgressEl) { uploadProgressEl.style.display = "none"; }
            }
        });
    }

    // ─── Remove Photo Button ─────────────────────────────────────────────────
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener("click", function () {
            clearImage();
            showToast("Image removed.", "info");
        });
    }

    // ─── Edit Mode: Load existing blog ──────────────────────────────────────
    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get("id");

    if (editId) {
        try {
            var res = await fetch(API_BLOGS_URL + "/" + editId, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) {
                var blog = await res.json();
                if (pageHeading) pageHeading.textContent = "Edit Blog Post";
                if (pageSubtitle) pageSubtitle.textContent = "Update your post details below.";
                if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Blog';

                if (titleInput) titleInput.value = blog.title || "";
                if (categorySelect) categorySelect.value = blog.category || "";
                if (statusSelect) statusSelect.value = blog.status || "published";
                if (contentInput) contentInput.value = blog.content || "";

                if (blog.image && blog.image.trim()) {
                    if (imageUrlInput) imageUrlInput.value = blog.image;
                    // slight delay to allow DOM to fully render
                    setTimeout(function () { showImagePreview(blog.image); }, 150);
                }
            } else {
                showToast("Could not load blog for editing.", "error");
            }
        } catch (err) {
            console.error("Error loading blog for edit:", err);
            showToast("Failed to load blog post for editing.", "error");
        }
    }

    // ─── Validation Helpers ──────────────────────────────────────────────────
    function showError(errorId, message) {
        var el = document.getElementById(errorId);
        if (el) { el.textContent = message; el.style.display = "block"; }
    }

    function clearError(errorId) {
        var el = document.getElementById(errorId);
        if (el) { el.textContent = ""; el.style.display = "none"; }
    }

    function clearAllErrors() {
        ["titleError", "categoryError", "contentError", "generalError"].forEach(clearError);
    }

    if (titleInput) titleInput.addEventListener("input", function () { clearError("titleError"); });
    if (categorySelect) categorySelect.addEventListener("change", function () { clearError("categoryError"); });
    if (contentInput) contentInput.addEventListener("input", function () { clearError("contentError"); });

    // ─── Form Submit ─────────────────────────────────────────────────────────
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearAllErrors();

        var title = titleInput ? titleInput.value.trim() : "";
        var category = categorySelect ? categorySelect.value : "";
        var status = statusSelect ? statusSelect.value : "published";
        // Use the module-level _currentImageUrl OR fall back to what's in the URL input
        var image = _currentImageUrl || (imageUrlInput ? imageUrlInput.value.trim() : "");
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

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
        }

        try {
            var method = editId ? "PUT" : "POST";
            var endpoint = editId ? API_BLOGS_URL + "/" + editId : API_BLOGS_URL;

            var response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    status: status.toLowerCase(),
                    image: image,
                    content: content
                })
            });

            var data = await response.json();

            if (!response.ok) {
                showError("generalError", data.message || "Failed to save blog post.");
                showToast(data.message || "Failed to save blog post", "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = editId
                        ? '<i class="fa-solid fa-floppy-disk"></i> Update Blog'
                        : '<i class="fa-solid fa-paper-plane"></i> Publish Blog';
                }
                return;
            }

            var currentUser = {};
            try { currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch(e) {}
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
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Blog';
            }
        }
    });
});
