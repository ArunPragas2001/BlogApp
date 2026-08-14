const API_PROFILE_URL = "http://localhost:5000/api/auth/profile";
const API_ME_URL = "http://localhost:5000/api/auth/me";

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
    const passwordInput = document.getElementById("profilePassword");
    const sidebarName = document.getElementById("sidebarName");
    const sidebarEmail = document.getElementById("sidebarEmail");
    const sidebarBio = document.getElementById("sidebarBio");
    const sidebarAvatarPreview = document.getElementById("sidebarAvatarPreview");
    const headerNavAvatar = document.getElementById("headerNavAvatar");
    const headerNavName = document.getElementById("headerNavName");

    if (picInput) {
        ["input", "keyup", "paste", "change"].forEach(evt => {
            picInput.addEventListener(evt, function () {
                setTimeout(() => {
                    const url = this.value.trim();
                    if (url && sidebarAvatarPreview) {
                        sidebarAvatarPreview.src = url;
                    }
                }, 10);
            });
        });
    }

    try {
        const response = await fetch(API_ME_URL, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load user profile");
        }

        const user = await response.json();

        if (nameInput) nameInput.value = user.name || "";
        if (emailInput) emailInput.value = user.email || "";
        if (picInput) picInput.value = user.profilePic || "";
        if (bioInput) bioInput.value = user.bio || "";

        if (sidebarName) sidebarName.textContent = user.name || "Blogger";
        if (sidebarEmail) sidebarEmail.textContent = user.email || "";
        if (sidebarBio) sidebarBio.textContent = user.bio || "Blogger & Content Creator";
        if (sidebarAvatarPreview && user.profilePic) sidebarAvatarPreview.src = user.profilePic;
        if (headerNavAvatar && user.profilePic) headerNavAvatar.src = user.profilePic;
        if (headerNavName) headerNavName.textContent = user.name || "Profile";

    } catch (err) {
        console.error("Load profile error:", err);
        showToast("Error loading profile data from server.", "error");
    }

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const name = nameInput ? nameInput.value.trim() : "";
            const email = emailInput ? emailInput.value.trim() : "";
            const profilePic = picInput ? picInput.value.trim() : "";
            const bio = bioInput ? bioInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";

            if (!name || !email) {
                showToast("Name and email are required fields.", "error");
                return;
            }

            const saveBtn = document.getElementById("saveProfileBtn");
            if (saveBtn) saveBtn.disabled = true;

            try {
                const bodyData = { name, email, profilePic, bio };
                if (password) {
                    bodyData.password = password;
                }

                const res = await fetch(API_PROFILE_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(bodyData)
                });

                const data = await res.json();

                if (!res.ok) {
                    showToast(data.message || "Failed to update profile", "error");
                    if (saveBtn) saveBtn.disabled = false;
                    return;
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("currentUser", JSON.stringify({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    profilePic: data.profilePic,
                    bio: data.bio
                }));

                if (sidebarName) sidebarName.textContent = data.name;
                if (sidebarEmail) sidebarEmail.textContent = data.email;
                if (sidebarBio) sidebarBio.textContent = data.bio || "Blogger & Content Creator";
                if (sidebarAvatarPreview && data.profilePic) sidebarAvatarPreview.src = data.profilePic;
                if (headerNavAvatar && data.profilePic) headerNavAvatar.src = data.profilePic;
                if (headerNavName) headerNavName.textContent = data.name;

                showToast("✨ Profile updated successfully in MongoDB!", "success");
                if (passwordInput) passwordInput.value = "";
            } catch (err) {
                console.error("Update profile error:", err);
                showToast("Server error. Unable to save profile.", "error");
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        });
    }
});

function selectSampleAvatar(url) {
    const picInput = document.getElementById("profilePic");
    const sidebarAvatarPreview = document.getElementById("sidebarAvatarPreview");
    if (picInput) picInput.value = url;
    if (sidebarAvatarPreview) sidebarAvatarPreview.src = url;
    showToast("Avatar preset selected. Click 'Save Profile Changes' to save.", "info");
}

window.selectSampleAvatar = selectSampleAvatar;
