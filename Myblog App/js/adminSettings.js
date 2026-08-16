const API_BASE_URL = "https://blogsphere-wtrv.onrender.com";
const API_SETTINGS_URL = `${API_BASE_URL}/api/settings`;

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    if (!token || currentUser.role !== "owner") {
        showToast("Access Restricted. Only the System Owner can edit Site Settings.", "error");
        setTimeout(() => window.location.href = "dashboard.html", 1800);
        return;
    }

    const form = document.getElementById("siteConfigForm");
    const emailInput = document.getElementById("companyEmail");
    const phoneInput = document.getElementById("companyPhone");
    const addressInput = document.getElementById("companyAddress");
    const instaInput = document.getElementById("instagramUrl");
    const fbInput = document.getElementById("facebookUrl");
    const waInput = document.getElementById("whatsappNumber");
    const termsInput = document.getElementById("termsOfService");

    try {
        const response = await fetch(API_SETTINGS_URL);
        if (response.ok) {
            const config = await response.json();
            if (emailInput) emailInput.value = config.companyEmail || "";
            if (phoneInput) phoneInput.value = config.companyPhone || "";
            if (addressInput) addressInput.value = config.companyAddress || "";
            if (instaInput) instaInput.value = config.instagramUrl || "";
            if (fbInput) fbInput.value = config.facebookUrl || "";
            if (waInput) waInput.value = config.whatsappNumber || "";
            if (termsInput) termsInput.value = config.termsOfService || "";
        }
    } catch (err) {
        console.error("Load settings error:", err);
        showToast("Error loading current site settings.", "error");
    }

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const saveBtn = document.getElementById("saveConfigBtn");
            if (saveBtn) saveBtn.disabled = true;

            const bodyData = {
                companyEmail: emailInput ? emailInput.value.trim() : "",
                companyPhone: phoneInput ? phoneInput.value.trim() : "",
                companyAddress: addressInput ? addressInput.value.trim() : "",
                instagramUrl: instaInput ? instaInput.value.trim() : "",
                facebookUrl: fbInput ? fbInput.value.trim() : "",
                whatsappNumber: waInput ? waInput.value.trim() : "",
                termsOfService: termsInput ? termsInput.value.trim() : ""
            };

            try {
                const res = await fetch(API_SETTINGS_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(bodyData)
                });

                const data = await res.json();

                if (!res.ok) {
                    showToast(data.message || "Failed to update settings", "error");
                    if (saveBtn) saveBtn.disabled = false;
                    return;
                }

                showToast("✨ Site contact & social settings updated in MongoDB!", "success");
            } catch (err) {
                console.error("Update settings error:", err);
                showToast("Server error updating site settings.", "error");
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        });
    }
});
