var API_BASE_URL = (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:" ||
    window.location.hostname === ""
))
    ? (window.location.port === "5000" ? window.location.origin : "http://localhost:5000")
    : "https://blogsphere-wtrv.onrender.com";
var API_BLOGS_URL = API_BASE_URL + "/api/blogs";
var API_UPLOAD_URL = API_BASE_URL + "/api/upload";

// Holds the uploaded/entered image and video URLs
var _currentImageUrl = "";
var _currentVideoUrl = "";
var _uploadInProgress = false;
var _videoUploadInProgress = false;

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

function isUnsupportedMobileImage(file) {
    if (!file) return false;
    var name = (file.name || "").toLowerCase();
    var type = (file.type || "").toLowerCase();
    return type.indexOf("heic") !== -1 || type.indexOf("heif") !== -1 ||
        name.endsWith(".heic") || name.endsWith(".heif");
}

function isAdminOrOwnerUser(user) {
    if (!user) return false;
    return user.role === "admin" || user.role === "owner";
}

async function refreshCurrentUser(token) {
    if (!token) {
        try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch (e) { return {}; }
    }

    try {
        var res = await fetch(API_BASE_URL + "/api/auth/me", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) {
            try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch (e) { return {}; }
        }

        var user = await res.json();
        var syncedUser = {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            adminStatus: user.adminStatus,
            profilePic: user.profilePic || "",
            bio: user.bio || ""
        };
        localStorage.setItem("currentUser", JSON.stringify(syncedUser));
        return syncedUser;
    } catch (err) {
        console.warn("Could not refresh user session:", err.message);
        try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch (e) { return {}; }
    }
}

function setCategoryValue(selectEl, category) {
    if (!selectEl) return;
    var value = (category || "").trim();
    if (!value) {
        selectEl.value = "";
        return;
    }

    var hasOption = Array.prototype.some.call(selectEl.options, function (opt) {
        return opt.value === value;
    });

    if (!hasOption) {
        var dynamicOption = document.createElement("option");
        dynamicOption.value = value;
        dynamicOption.textContent = value;
        selectEl.appendChild(dynamicOption);
    }

    selectEl.value = value;
}

document.addEventListener("DOMContentLoaded", async function () {
    var form = document.getElementById("createBlogForm");
    if (!form) return;

    var titleInput = document.getElementById("blog-title");
    var categorySelect = document.getElementById("blog-category");
    var statusSelect = document.getElementById("blog-status");
    var imageUrlInput = document.getElementById("blog-image");          // Image URL text input
    var imageUploadInput = document.getElementById("blogImageUpload");  // Image file input
    var imagePreviewContainer = document.getElementById("imagePreviewContainer");
    var imagePreview = document.getElementById("imagePreview");
    var removePhotoBtn = document.getElementById("removePhotoBtn");
    var uploadProgressEl = document.getElementById("uploadProgress");

    var videoUrlInput = document.getElementById("blog-video");          // Video URL text input
    var videoUploadInput = document.getElementById("blogVideoUpload");  // Video file input
    var videoPreviewContainer = document.getElementById("videoPreviewContainer");
    var videoPreview = document.getElementById("videoPreview");
    var removeVideoBtn = document.getElementById("removeVideoBtn");
    var videoUploadProgressEl = document.getElementById("videoUploadProgress");

    var contentInput = document.getElementById("blog-content");
    var pageHeading = document.getElementById("pageHeading");
    var pageSubtitle = document.getElementById("pageSubtitle");
    var submitBtn = document.getElementById("submitBtn");

    var token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to create or edit blogs.", "error");
        setTimeout(function () { window.location.href = "login.html"; }, 1200);
        return;
    }

    // ─── Image Preview Helpers ────────────────────────────────────────────────
    function showImagePreview(url) {
        var resolved = resolveImageUrl(url);
        _currentImageUrl = resolved;
        if (!imagePreview || !imagePreviewContainer) return;
        if (!_currentImageUrl) {
            imagePreviewContainer.style.display = "none";
            return;
        }
        imagePreview.onerror = function () {
            this.onerror = null;
            imagePreviewContainer.style.display = "none";
            showToast("Preview unavailable, but the image URL was saved.", "info");
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

    // ─── Video Preview Helpers ────────────────────────────────────────────────
    function showVideoPreview(url) {
        var resolved = resolveImageUrl(url);
        _currentVideoUrl = resolved;
        if (!videoPreview || !videoPreviewContainer) return;
        if (!_currentVideoUrl) {
            videoPreviewContainer.style.display = "none";
            return;
        }
        videoPreview.onerror = function () {
            this.onerror = null;
            videoPreviewContainer.style.display = "none";
            showToast("Video preview unavailable, but the video URL was saved.", "info");
        };
        videoPreview.onloadeddata = function () {
            videoPreviewContainer.style.display = "block";
        };
        videoPreview.src = _currentVideoUrl;
        videoPreviewContainer.style.display = "block";
    }

    function clearVideo() {
        _currentVideoUrl = "";
        if (videoUrlInput) videoUrlInput.value = "";
        if (videoUploadInput) videoUploadInput.value = "";
        if (videoPreview) {
            videoPreview.pause();
            videoPreview.src = "";
        }
        if (videoPreviewContainer) videoPreviewContainer.style.display = "none";
    }

    // ─── Image URL Input → live preview ──────────────────────────────────────
    if (imageUrlInput) {
        ["input", "paste", "change"].forEach(function (evt) {
            imageUrlInput.addEventListener(evt, function () {
                clearTimeout(imageUrlInput._debounce);
                imageUrlInput._debounce = setTimeout(function () {
                    var val = (imageUrlInput.value || "").trim();
                    if (val) {
                        showImagePreview(val);
                    } else {
                        clearImage();
                    }
                }, 300);
            });
        });
    }

    // ─── Video URL Input → live preview ──────────────────────────────────────
    if (videoUrlInput) {
        ["input", "paste", "change"].forEach(function (evt) {
            videoUrlInput.addEventListener(evt, function () {
                clearTimeout(videoUrlInput._debounce);
                videoUrlInput._debounce = setTimeout(function () {
                    var val = (videoUrlInput.value || "").trim();
                    if (val) {
                        showVideoPreview(val);
                    } else {
                        clearVideo();
                    }
                }, 300);
            });
        });
    }

    // ─── Image File Upload ───────────────────────────────────────────────────
    if (imageUploadInput) {
        imageUploadInput.addEventListener("change", async function () {
            var file = this.files && this.files[0];
            if (!file) return;

            if (isUnsupportedMobileImage(file)) {
                showToast("HEIC photos aren't supported. Change camera settings to JPG or use a JPG/PNG file.", "error");
                this.value = "";
                return;
            }

            // Validate file size client-side (10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast("Image must be under 10 MB.", "error");
                this.value = "";
                return;
            }

            var currentToken = localStorage.getItem("token") || token;
            var formData = new FormData();
            formData.append("image", file);

            // Show loading state
            _uploadInProgress = true;
            if (uploadProgressEl) { uploadProgressEl.style.display = "flex"; }
            if (submitBtn) submitBtn.disabled = true;
            showToast("Uploading image to Cloudinary...", "info");

            try {
                var res = await fetch(API_UPLOAD_URL, {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + currentToken },
                    body: formData
                });

                var data = await res.json();

                if (res.ok && (data.url || data.path || data.secure_url)) {
                    var savedUrl = data.secure_url || (data.path ? resolveImageUrl(data.path) : resolveImageUrl(data.url));
                    _currentImageUrl = savedUrl;
                    if (imageUrlInput) imageUrlInput.value = savedUrl;
                    showImagePreview(savedUrl);
                    showToast("✅ Image uploaded successfully!", "success");
                } else {
                    showToast(data.message || "Upload failed. Please try again.", "error");
                    this.value = "";
                }
            } catch (err) {
                console.error("Image upload error:", err);
                showToast("Upload error. Please check your connection and try again.", "error");
                this.value = "";
            } finally {
                _uploadInProgress = false;
                if (uploadProgressEl) { uploadProgressEl.style.display = "none"; }
                if (submitBtn && !_videoUploadInProgress) submitBtn.disabled = false;
            }
        });
    }

    // ─── Video File Upload ───────────────────────────────────────────────────
    if (videoUploadInput) {
        videoUploadInput.addEventListener("change", async function () {
            var file = this.files && this.files[0];
            if (!file) return;

            // Validate video format client-side
            var allowedExts = /\.(mp4|webm|mov|avi|mkv|m4v|ogv)$/i;
            if (!allowedExts.test(file.name) && !file.type.startsWith("video/")) {
                showToast("Unsupported format. Use MP4, WebM, MOV, AVI, or MKV.", "error");
                this.value = "";
                return;
            }

            // Validate video size client-side (100MB)
            if (file.size > 100 * 1024 * 1024) {
                showToast("Video must be under 100 MB.", "error");
                this.value = "";
                return;
            }

            var currentToken = localStorage.getItem("token") || token;
            var formData = new FormData();
            formData.append("video", file);

            _videoUploadInProgress = true;
            if (videoUploadProgressEl) { videoUploadProgressEl.style.display = "flex"; }
            if (submitBtn) submitBtn.disabled = true;
            showToast("Uploading video to Cloudinary (this may take a moment)...", "info");

            try {
                var res = await fetch(API_UPLOAD_URL + "/video", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + currentToken },
                    body: formData
                });

                if (res.status === 404) {
                    // Fallback to /api/upload
                    res = await fetch(API_UPLOAD_URL, {
                        method: "POST",
                        headers: { "Authorization": "Bearer " + currentToken },
                        body: formData
                    });
                }

                var data = await res.json();

                if (res.ok && (data.url || data.secure_url)) {
                    var savedVideoUrl = data.secure_url || data.url;
                    _currentVideoUrl = savedVideoUrl;
                    if (videoUrlInput) videoUrlInput.value = savedVideoUrl;
                    showVideoPreview(savedVideoUrl);
                    showToast("✅ Video uploaded successfully!", "success");
                } else {
                    showToast(data.message || "Video upload failed. Please try again.", "error");
                    this.value = "";
                }
            } catch (err) {
                console.error("Video upload error:", err);
                showToast("Video upload error. Please check your connection and try again.", "error");
                this.value = "";
            } finally {
                _videoUploadInProgress = false;
                if (videoUploadProgressEl) { videoUploadProgressEl.style.display = "none"; }
                if (submitBtn && !_uploadInProgress) submitBtn.disabled = false;
            }
        });
    }

    // ─── Remove Photo & Video Buttons ─────────────────────────────────────────
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener("click", function () {
            clearImage();
            showToast("Image removed.", "info");
        });
    }

    if (removeVideoBtn) {
        removeVideoBtn.addEventListener("click", function () {
            clearVideo();
            showToast("Video removed.", "info");
        });
    }

    // ─── Edit Mode: Load existing blog ──────────────────────────────────────
    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get("id");

    if (editId) {
        if (pageHeading) pageHeading.textContent = "Loading Blog...";
        if (pageSubtitle) pageSubtitle.textContent = "Please wait while we load the post for editing.";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        }

        try {
            var currentToken = localStorage.getItem("token") || token;
            var currentUser = await refreshCurrentUser(currentToken);
            var res = await fetch(API_BLOGS_URL + "/" + encodeURIComponent(editId), {
                headers: { "Authorization": "Bearer " + currentToken }
            });

            if (!res.ok) {
                var loadError = {};
                try { loadError = await res.json(); } catch (e) {}
                showToast(loadError.message || "Could not load blog for editing.", "error");
                setTimeout(function () { window.location.href = "dashboard.html"; }, 1500);
                return;
            }

            var blog = await res.json();
            var isAdminOrOwner = isAdminOrOwnerUser(currentUser);
            var authorId = blog.author ? String(blog.author._id || blog.author.id || blog.author) : "";
            var userId = String(currentUser.id || currentUser._id || "");
            var canEdit = isAdminOrOwner || (authorId && userId && authorId === userId);

            if (!canEdit) {
                showToast("You are not authorized to edit this blog.", "error");
                setTimeout(function () { window.location.href = "dashboard.html"; }, 1500);
                return;
            }

            if (pageHeading) pageHeading.textContent = "Edit Blog Post";
            if (pageSubtitle) pageSubtitle.textContent = isAdminOrOwner && authorId !== userId
                ? "You are editing another author's post as an administrator."
                : "Update your post details below.";
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Blog';
            }

            if (titleInput) titleInput.value = blog.title || "";
            setCategoryValue(categorySelect, blog.category || "General");
            if (statusSelect) statusSelect.value = (blog.status || "published").toLowerCase();
            if (contentInput) contentInput.value = blog.content || "";

            if (blog.image && blog.image.trim()) {
                var resolvedImg = resolveImageUrl(blog.image);
                _currentImageUrl = resolvedImg;
                if (imageUrlInput) imageUrlInput.value = resolvedImg;
                setTimeout(function () { showImagePreview(resolvedImg); }, 150);
            }

            if (blog.video && blog.video.trim()) {
                var resolvedVid = resolveImageUrl(blog.video);
                _currentVideoUrl = resolvedVid;
                if (videoUrlInput) videoUrlInput.value = resolvedVid;
                setTimeout(function () { showVideoPreview(resolvedVid); }, 150);
            }
        } catch (err) {
            console.error("Error loading blog for edit:", err);
            showToast("Failed to load blog post for editing.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Blog';
            }
        } finally {
            if (window.hidePageLoader) window.hidePageLoader();
        }
    } else {
        if (window.hidePageLoader) window.hidePageLoader();
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
        var image = _currentImageUrl || (imageUrlInput ? resolveImageUrl(imageUrlInput.value.trim()) : "");
        var video = _currentVideoUrl || (videoUrlInput ? resolveImageUrl(videoUrlInput.value.trim()) : "");
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

        if (_uploadInProgress) {
            showToast("Please wait for the image upload to finish before saving.", "error");
            return;
        }

        if (_videoUploadInProgress) {
            showToast("Please wait for the video upload to finish before saving.", "error");
            return;
        }

        var pendingFile = imageUploadInput && imageUploadInput.files && imageUploadInput.files[0];
        if (pendingFile && !_currentImageUrl) {
            showToast("Image is still uploading. Please wait a moment and try again.", "error");
            return;
        }

        var pendingVideoFile = videoUploadInput && videoUploadInput.files && videoUploadInput.files[0];
        if (pendingVideoFile && !_currentVideoUrl) {
            showToast("Video is still uploading. Please wait a moment and try again.", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
        }

        try {
            var currentToken = localStorage.getItem("token") || token;
            var method = editId ? "PUT" : "POST";
            var endpoint = editId ? API_BLOGS_URL + "/" + encodeURIComponent(editId) : API_BLOGS_URL;

            var response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + currentToken
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    status: status.toLowerCase(),
                    image: image,
                    video: video,
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

            var currentUser = await refreshCurrentUser(currentToken);
            var isAdminOrOwner = isAdminOrOwnerUser(currentUser);
            var isEditingOthersBlog = editId && data.author &&
                String(data.author._id || data.author.id || "") !== String(currentUser.id || currentUser._id || "");
            var successMsg = isAdminOrOwner
                ? (editId
                    ? (isEditingOthersBlog ? "Blog updated successfully!" : "Blog post updated!")
                    : "Blog published!")
                : (editId ? "Blog updated! Pending Admin approval." : "Blog created! Pending Admin approval.");

            showToast(successMsg, "success");
            setTimeout(function () { window.location.href = "dashboard.html"; }, 1200);

        } catch (err) {
            console.error("Save blog error:", err);
            showError("generalError", "Server error. Could not connect to backend.");
            showToast("Server error connecting to backend.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = editId
                    ? '<i class="fa-solid fa-floppy-disk"></i> Update Blog'
                    : '<i class="fa-solid fa-paper-plane"></i> Publish Blog';
            }
        }
    });
});

