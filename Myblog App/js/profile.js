const API_BASE_URL = "https://blogsphere-wtrv.onrender.com";
const API_PROFILE_URL = `${API_BASE_URL}/api/auth/profile`;
const API_ME_URL = `${API_BASE_URL}/api/auth/me`;
const API_UPLOAD_URL = `${API_BASE_URL}/api/upload`;
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=4F46E5&color=fff&size=150&name=User";

function resolveImageUrl(url) {
    if (!url || typeof url !== "string") return "";
    var trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
        return trimmed;
    }
    if (trimmed.startsWith("/")) {
        return API_BASE_URL + trimmed;
    }
    return API_BASE_URL + "/" + trimmed;
}

function getDefaultAvatar(name) {
    var n = encodeURIComponent(name || "User");
    return "https://ui-avatars.com/api/?background=4F46E5&color=fff&size=150&name=" + n;
}

// Toggle password visibility
window.togglePwVisibility = function(inputId, btn) {
    var inp = document.getElementById(inputId);
    if (!inp) return;
    var isText = inp.type === "text";
    inp.type = isText ? "password" : "text";
    var icon = btn.querySelector("i");
    if (icon) {
        icon.className = isText ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    }
};

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        showToast("Please login first to view your profile.", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const form = document.getElementById("profileForm");
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const picInput = document.getElementById("profilePic");
    const bioInput = document.getElementById("profileBio");
    const oldPasswordInput = document.getElementById("profileOldPassword");
    const passwordInput = document.getElementById("profilePassword");
    const confirmPasswordInput = document.getElementById("profileConfirmPassword");
    const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
    const pwMatchError = document.getElementById("pwMatchError");
    const sidebarName = document.getElementById("sidebarName");
    const sidebarEmail = document.getElementById("sidebarEmail");
    const sidebarBio = document.getElementById("sidebarBio");
    const sidebarAvatarPreview = document.getElementById("sidebarAvatarPreview");
    const headerNavAvatar = document.getElementById("headerNavAvatar");
    const headerNavName = document.getElementById("headerNavName");
    const profileImageUpload = document.getElementById("profileImageUpload");

    // Show/hide confirm password field when user types in new password field
    if (passwordInput && confirmPasswordGroup) {
        passwordInput.addEventListener("input", function () {
            if (this.value.length > 0) {
                confirmPasswordGroup.style.display = "block";
            } else {
                confirmPasswordGroup.style.display = "none";
                if (pwMatchError) pwMatchError.style.display = "none";
            }
        });
    }

    // Validate confirm password match on input
    if (confirmPasswordInput && pwMatchError) {
        confirmPasswordInput.addEventListener("input", function () {
            if (passwordInput && this.value && this.value !== passwordInput.value) {
                pwMatchError.textContent = "Passwords do not match.";
                pwMatchError.style.display = "block";
            } else {
                pwMatchError.style.display = "none";
            }
        });
    }

    // Set avatar src safely - always uses object-fit cover and fixed dimensions
    function setAvatarSrc(imgEl, url, fallbackName) {
        if (!imgEl) return;
        var resolved = resolveImageUrl(url);
        var src = (resolved && resolved.trim()) ? resolved.trim() : getDefaultAvatar(fallbackName);
        imgEl.src = src;
        imgEl.onerror = function () {
            this.onerror = null;
            this.src = getDefaultAvatar(fallbackName);
        };
    }

    // Update all avatar elements across the page
    function updateAllAvatars(url, name) {
        setAvatarSrc(sidebarAvatarPreview, url, name);
        setAvatarSrc(headerNavAvatar, url, name);
        // Also update dashboard nav avatar if it exists on this page
        var dashNav = document.getElementById("dashboardNavAvatar");
        if (dashNav) setAvatarSrc(dashNav, url, name);
    }

    // Auto-save profile photo to backend and update localStorage
    async function autoSaveProfilePhoto(photoUrl) {
        try {
            var currentToken = localStorage.getItem("token") || token;
            var name = nameInput ? nameInput.value.trim() : "";
            var email = emailInput ? emailInput.value.trim() : "";
            var bio = bioInput ? bioInput.value.trim() : "";

            var res = await fetch(API_PROFILE_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + currentToken
                },
                body: JSON.stringify({ name, email, bio, profilePic: photoUrl })
            });
            var data = await res.json();
            if (res.ok) {
                // Update token
                if (data.token) localStorage.setItem("token", data.token);
                // Sync currentUser in localStorage
                var existingUser = {};
                try { existingUser = JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch(e) {}
                var updatedUser = Object.assign({}, existingUser, {
                    id: data._id,
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    profilePic: data.profilePic || "",
                    bio: data.bio || ""
                });
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                showToast("✨ Profile photo updated!", "success");
            } else {
                showToast(data.message || "Failed to save photo", "error");
            }
        } catch (err) {
            console.error("Auto save profile photo error:", err);
        }
    }

    // Handle file upload for profile picture
    if (profileImageUpload) {
        profileImageUpload.addEventListener("change", async function () {
            var file = this.files[0];
            if (!file) return;

            var currentToken = localStorage.getItem("token") || token;
            var formData = new FormData();
            formData.append("image", file);

            try {
                showToast("Uploading image...", "info");
                var res = await fetch(API_UPLOAD_URL, {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + currentToken },
                    body: formData
                });
                var data = await res.json();
                if (res.ok && data.url) {
                    if (picInput) picInput.value = data.url;
                    updateAllAvatars(data.url, nameInput ? nameInput.value : "");
                    await autoSaveProfilePhoto(data.url);
                } else {
                    showToast(data.message || "Failed to upload image", "error");
                }
            } catch (err) {
                console.error("Upload error:", err);
                showToast("Upload error. Please check your connection and try again.", "error");
            }
        });
    }

    // Live preview when URL is typed in the profile pic URL input
    if (picInput) {
        ["input", "keyup", "paste", "change"].forEach(function(evt) {
            picInput.addEventListener(evt, function () {
                setTimeout(() => {
                    var url = this.value.trim();
                    updateAllAvatars(url, nameInput ? nameInput.value : "");
                }, 50);
            });
        });
    }

    // Load current user profile from backend
    try {
        var currentToken = localStorage.getItem("token") || token;
        var response = await fetch(API_ME_URL, {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (!response.ok) {
            throw new Error("Failed to load user profile");
        }

        var user = await response.json();

        if (nameInput) nameInput.value = user.name || "";
        if (emailInput) emailInput.value = user.email || "";
        if (picInput) picInput.value = user.profilePic || "";
        if (bioInput) bioInput.value = user.bio || "";

        if (sidebarName) sidebarName.textContent = user.name || "Blogger";
        if (sidebarEmail) sidebarEmail.textContent = user.email || "";
        if (sidebarBio) sidebarBio.textContent = user.bio || "Blogger & Content Creator";
        if (headerNavName) headerNavName.textContent = user.name || "Profile";

        updateAllAvatars(user.profilePic, user.name);

        // Also sync localStorage with fresh data from server
        var existingUser = {};
        try { existingUser = JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch(e) {}
        localStorage.setItem("currentUser", JSON.stringify(Object.assign({}, existingUser, {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePic: user.profilePic || "",
            bio: user.bio || ""
        })));

    } catch (err) {
        console.error("Load profile error:", err);
        // Fall back to localStorage if backend fails
        var cached = {};
        try { cached = JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch(e) {}
        if (nameInput && cached.name) nameInput.value = cached.name;
        if (emailInput && cached.email) emailInput.value = cached.email;
        if (picInput && cached.profilePic) picInput.value = cached.profilePic;
        if (bioInput && cached.bio) bioInput.value = cached.bio;
        updateAllAvatars(cached.profilePic, cached.name);
        showToast("Using cached profile data (server unreachable).", "warning");
    }

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            var currentToken = localStorage.getItem("token") || token;
            var name = nameInput ? nameInput.value.trim() : "";
            var email = emailInput ? emailInput.value.trim() : "";
            var profilePic = picInput ? picInput.value.trim() : "";
            var bio = bioInput ? bioInput.value.trim() : "";
            var oldPassword = oldPasswordInput ? oldPasswordInput.value : "";
            var newPassword = passwordInput ? passwordInput.value : "";
            var confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

            if (!name || !email) {
                showToast("Name and email are required fields.", "error");
                return;
            }

            // Password change validation
            if (newPassword) {
                if (!oldPassword) {
                    showToast("Please enter your current password to change it.", "error");
                    if (oldPasswordInput) oldPasswordInput.focus();
                    return;
                }
                if (newPassword.length < 6) {
                    showToast("New password must be at least 6 characters.", "error");
                    return;
                }
                if (newPassword !== confirmPassword) {
                    if (pwMatchError) { pwMatchError.textContent = "Passwords do not match."; pwMatchError.style.display = "block"; }
                    showToast("New passwords do not match.", "error");
                    return;
                }
            }

            var saveBtn = document.getElementById("saveProfileBtn");
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

            try {
                var bodyData = { name, email, profilePic, bio };
                if (newPassword) {
                    bodyData.oldPassword = oldPassword;
                    bodyData.newPassword = newPassword;
                }

                var res = await fetch(API_PROFILE_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + currentToken
                    },
                    body: JSON.stringify(bodyData)
                });

                var data = await res.json();

                if (!res.ok) {
                    showToast(data.message || "Failed to update profile", "error");
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes'; }
                    return;
                }

                // Update token & localStorage
                if (data.token) localStorage.setItem("token", data.token);
                localStorage.setItem("currentUser", JSON.stringify({
                    id: data._id,
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    profilePic: data.profilePic || "",
                    bio: data.bio || ""
                }));

                if (sidebarName) sidebarName.textContent = data.name;
                if (sidebarEmail) sidebarEmail.textContent = data.email;
                if (sidebarBio) sidebarBio.textContent = data.bio || "Blogger & Content Creator";
                if (headerNavName) headerNavName.textContent = data.name;
                updateAllAvatars(data.profilePic, data.name);

                showToast("✨ Profile updated successfully!", "success");

                // Clear password fields
                if (oldPasswordInput) oldPasswordInput.value = "";
                if (passwordInput) passwordInput.value = "";
                if (confirmPasswordInput) confirmPasswordInput.value = "";
                if (confirmPasswordGroup) confirmPasswordGroup.style.display = "none";
                if (pwMatchError) pwMatchError.style.display = "none";

            } catch (err) {
                console.error("Update profile error:", err);
                showToast("Server error. Unable to save profile.", "error");
            } finally {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes'; }
            }
        });
    }
});

function selectSampleAvatar(url) {
    var picInput = document.getElementById("profilePic");
    if (picInput) picInput.value = url;
    var sidebarAvatarPreview = document.getElementById("sidebarAvatarPreview");
    var headerNavAvatar = document.getElementById("headerNavAvatar");
    if (sidebarAvatarPreview) { sidebarAvatarPreview.src = url; }
    if (headerNavAvatar) { headerNavAvatar.src = url; }
    showToast("Avatar selected! Click 'Save Profile Changes' to save.", "info");
}

window.selectSampleAvatar = selectSampleAvatar;
window.resolveImageUrl = resolveImageUrl;
