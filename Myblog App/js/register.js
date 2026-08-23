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

    // ─── Real Google Identity Services (GIS) Sign-Up Flow ───────────────────
    async function handleGoogleSignUpCredentialResponse(response) {
        if (!response || !response.credential) {
            showToast("Google registration was cancelled or did not return a credential.", "error");
            return;
        }

        const wrapper = document.getElementById("googleSignUpBtnWrapper");
        if (wrapper) {
            wrapper.style.opacity = "0.6";
            wrapper.style.pointerEvents = "none";
        }

        try {
            // Strictly send the signed Google ID token credential to backend for cryptographic verification
            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Google registration verification failed.", "error", 6000);
                if (wrapper) {
                    wrapper.style.opacity = "1";
                    wrapper.style.pointerEvents = "auto";
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

            showToast("🎉 Welcome to BlogSphere, " + (data.name || "User") + "!", "success", 3000);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (err) {
            console.error("Google Sign-Up verification error:", err);
            showToast("Unable to connect to registration server. Please try again.", "error");
            if (wrapper) {
                wrapper.style.opacity = "1";
                wrapper.style.pointerEvents = "auto";
            }
        }
    }

    async function initGoogleSignUp() {
        const container = document.getElementById("g_id_signup");
        if (!container) return;

        let clientId = "";
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google-client-id`);
            if (res.ok) {
                const data = await res.json();
                clientId = data.clientId || "";
            }
        } catch (e) {
            console.warn("Could not fetch Google Client ID from backend:", e);
        }

        if (!clientId) {
            container.innerHTML = '<div style="font-size:0.82rem; color:#94A3B8; text-align:center; padding:8px 12px; border:1px dashed #CBD5E1; border-radius:10px;">' +
                '<i class="fa-brands fa-google" style="color:#4F46E5; margin-right:5px;"></i>' +
                '<span>Google Sign-Up ready. Set <code style="color:#4F46E5;">GOOGLE_CLIENT_ID</code> in .env to activate.</span>' +
                '</div>';
            return;
        }

        function renderGoogleRegisterButton() {
            if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleSignUpCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });

                    const isDarkMode = document.body.classList.contains("dark-mode");
                    google.accounts.id.renderButton(container, {
                        type: "standard",
                        theme: isDarkMode ? "filled_black" : "outline",
                        size: "large",
                        text: "signup_with",
                        shape: "pill",
                        logo_alignment: "left",
                        width: 320
                    });
                } catch (err) {
                    console.error("Google button render error:", err);
                }
            } else {
                setTimeout(renderGoogleRegisterButton, 200);
            }
        }

        renderGoogleRegisterButton();
    }

    setTimeout(initGoogleSignUp, 150);
});