const API_BASE_URL = (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:" ||
    window.location.hostname === ""
))
    ? (window.location.port === "5000" ? window.location.origin : "http://localhost:5000")
    : "https://blogsphere-wtrv.onrender.com";
const API_URL = `${API_BASE_URL}/api/auth/register`;

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const roleSelect = document.getElementById("registerRole");
    const roleNotice = document.getElementById("roleNotice");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const termsCheckbox = document.getElementById("terms");

    if (!registerForm) return;

    if (typeof setupPasswordStrengthMeter === "function") {
        setupPasswordStrengthMeter("registerPassword", "registerStrengthMeter", "confirmPassword");
    }

    if (roleSelect && roleNotice) {
        roleSelect.addEventListener("change", function () {
            if (this.value === "admin") {
                roleNotice.style.display = "block";
            } else {
                roleNotice.style.display = "none";
            }
        });
    }

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
        clearError("nameError");
        clearError("emailError");
        clearError("passwordError");
        clearError("confirmPasswordError");
        clearError("termsError");
    }

    function validateName(name) {
        if (!name || name.trim() === "") {
            showError("nameError", "Name is required.");
            return false;
        } else if (name.trim().length < 3) {
            showError("nameError", "Name must be at least 3 characters long.");
            return false;
        }
        clearError("nameError");
        return true;
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || email.trim() === "") {
            showError("emailError", "Email is required.");
            return false;
        } else if (!emailRegex.test(email.trim())) {
            showError("emailError", "Please enter a valid email address.");
            return false;
        }
        clearError("emailError");
        return true;
    }

    function validatePassword(password) {
        if (!password) {
            showError("passwordError", "Password is required.");
            return false;
        } else if (password.length < 6) {
            showError("passwordError", "Password must be at least 6 characters long.");
            return false;
        }
        clearError("passwordError");
        return true;
    }

    function validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) {
            showError("confirmPasswordError", "Please confirm your password.");
            return false;
        } else if (password !== confirmPassword) {
            showError("confirmPasswordError", "Passwords do not match.");
            return false;
        }
        clearError("confirmPasswordError");
        return true;
    }

    function validateTerms(termsChecked) {
        if (!termsChecked) {
            showError("termsError", "You must agree to the terms.");
            return false;
        }
        clearError("termsError");
        return true;
    }

    if (nameInput) nameInput.addEventListener("input", () => clearError("nameError"));
    if (emailInput) emailInput.addEventListener("input", () => clearError("emailError"));
    if (passwordInput) passwordInput.addEventListener("input", () => clearError("passwordError"));
    if (confirmPasswordInput) confirmPasswordInput.addEventListener("input", () => clearError("confirmPasswordError"));
    if (termsCheckbox) termsCheckbox.addEventListener("change", () => clearError("termsError"));

    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearAllErrors();

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const requestedRole = roleSelect ? roleSelect.value : "user";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
        const termsChecked = termsCheckbox ? termsCheckbox.checked : false;

        const isNameValid = validateName(name);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isConfirmValid = validateConfirmPassword(password, confirmPassword);
        const isTermsValid = validateTerms(termsChecked);

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid || !isTermsValid) {
            showToast("Please fix the highlighted errors before submitting.", "error");
            return;
        }

        const submitBtn = registerForm.querySelector("button[type='submit']");
        const originalBtnText = submitBtn ? submitBtn.textContent : "Create Account";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password, requestedRole })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.message || "Registration failed. Please check your information.";
                showError("generalError", errorMsg);
                showToast(errorMsg, "error", 6000);
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
                adminStatus: data.adminStatus,
                profilePic: data.profilePic,
                bio: data.bio
            }));

            if (data.adminStatus === "pending") {
                showToast("🎉 Account created! Your Admin request is pending Owner approval.", "info", 5000);
            } else {
                showToast("🎉 Registration successful! Welcome to BlogSphere.", "success");
            }

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } catch (error) {
            console.error("Registration error:", error);
            const netErrorMsg = "Unable to connect to the backend server. Please check your connection and try again.";
            showError("generalError", netErrorMsg);
            showToast(netErrorMsg, "error", 6000);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });

    // ─── Terms & Privacy Modal Logic ─────────────────────────────────────────
    const termsModal = document.getElementById("termsModal");
    const openTermsLink = document.getElementById("openTermsLink");
    const closeTermsBtn = document.getElementById("closeTermsBtn");
    const closeTermsBottomBtn = document.getElementById("closeTermsBottomBtn");
    const agreeTermsBtn = document.getElementById("agreeTermsBtn");

    function openTermsModal() {
        if (termsModal) {
            termsModal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }

    function closeTermsModal() {
        if (termsModal) {
            termsModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    if (openTermsLink) {
        openTermsLink.addEventListener("click", function (e) {
            e.preventDefault();
            openTermsModal();
        });
    }

    if (closeTermsBtn) closeTermsBtn.addEventListener("click", closeTermsModal);
    if (closeTermsBottomBtn) closeTermsBottomBtn.addEventListener("click", closeTermsModal);

    if (agreeTermsBtn) {
        agreeTermsBtn.addEventListener("click", function () {
            if (termsCheckbox) {
                termsCheckbox.checked = true;
                clearError("termsError");
            }
            closeTermsModal();
            showToast("Terms of Service & Privacy Policy accepted.", "success", 3000);
        });
    }

    if (termsModal) {
        termsModal.addEventListener("click", function (e) {
            if (e.target === termsModal) closeTermsModal();
        });
    }
});