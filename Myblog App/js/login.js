const API_URL = "http://localhost:5000/api/auth/login";

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (!loginForm) return;

    function showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.style.display = "block";
        }
    }

    function clearError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    }

    function clearAllErrors() {
        clearError("generalError");
        clearError("emailError");
        clearError("passwordError");
    }

    if (emailInput) emailInput.addEventListener("input", () => clearError("emailError"));
    if (passwordInput) passwordInput.addEventListener("input", () => clearError("passwordError"));

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearAllErrors();

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        let isValid = true;

        if (!email) {
            showError("emailError", "Please enter your email address.");
            isValid = false;
        }

        if (!password) {
            showError("passwordError", "Please enter your password.");
            isValid = false;
        }

        if (!isValid) return;

        const submitBtn = loginForm.querySelector("button[type='submit']");
        const originalBtnText = submitBtn ? submitBtn.textContent : "Login";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showError("generalError", data.message || "Invalid email or password.");
                showToast(data.message || "Invalid email or password", "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
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

            showToast("👋 Welcome back! Login successful.", "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);
        } catch (error) {
            console.error("Login error:", error);
            showError("generalError", "Unable to connect to backend server.");
            showToast("Unable to connect to backend server on http://localhost:5000", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
});