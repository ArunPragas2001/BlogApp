const API_BASE_URL = (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:" ||
    window.location.hostname === ""
))
    ? (window.location.port === "5000" ? window.location.origin : "http://localhost:5000")
    : "https://blogsphere-wtrv.onrender.com";
const API_URL = `${API_BASE_URL}/api/auth/login`;

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
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError("emailError", "Please enter a valid email address format (e.g. name@domain.com).");
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
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
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
                const errorMsg = data.message || "Invalid email or password. Please check your credentials.";
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

            showToast(`👋 Welcome back, ${data.name}! Login successful.`, "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);
        } catch (error) {
            console.error("Login error:", error);
            const netErrorMsg = "Unable to connect to the backend server. Please check your internet connection and try again.";
            showError("generalError", netErrorMsg);
            showToast(netErrorMsg, "error", 6000);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });

    // ─── Forgot Password / Recovery Flow ─────────────────────────────────────
    const forgotModal = document.getElementById("forgotPasswordModal");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const closeForgotModalBtn = document.getElementById("closeForgotModalBtn");
    const forgotStep1 = document.getElementById("forgotStep1");
    const forgotStep2 = document.getElementById("forgotStep2");
    const forgotEmailInput = document.getElementById("forgotEmailInput");
    const sendRecoveryCodeBtn = document.getElementById("sendRecoveryCodeBtn");
    const forgotStep1Error = document.getElementById("forgotStep1Error");
    const sentToEmailSpan = document.getElementById("sentToEmailSpan");
    const resetCodeInput = document.getElementById("resetCodeInput");
    const resetNewPasswordInput = document.getElementById("resetNewPasswordInput");
    const resetConfirmPasswordInput = document.getElementById("resetConfirmPasswordInput");
    const submitResetPasswordBtn = document.getElementById("submitResetPasswordBtn");
    const forgotStep2Error = document.getElementById("forgotStep2Error");
    const backToStep1Btn = document.getElementById("backToStep1Btn");

    let currentRecoveryEmail = "";

    // Initialize password strength meter for reset modal
    if (typeof setupPasswordStrengthMeter === "function") {
        setupPasswordStrengthMeter("resetNewPasswordInput", "resetStrengthMeter", "resetConfirmPasswordInput");
    }

    function openForgotModal() {
        if (!forgotModal) return;
        forgotModal.classList.add("active");
        document.body.style.overflow = "hidden";
        if (forgotStep1) forgotStep1.style.display = "block";
        if (forgotStep2) forgotStep2.style.display = "none";
        if (forgotEmailInput) {
            forgotEmailInput.value = emailInput ? emailInput.value.trim() : "";
            setTimeout(() => forgotEmailInput.focus(), 100);
        }
        if (forgotStep1Error) forgotStep1Error.style.display = "none";
        if (forgotStep2Error) forgotStep2Error.style.display = "none";
    }

    function closeForgotModal() {
        if (!forgotModal) return;
        forgotModal.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", function (e) {
            e.preventDefault();
            openForgotModal();
        });
    }

    if (closeForgotModalBtn) closeForgotModalBtn.addEventListener("click", closeForgotModal);
    if (forgotModal) {
        forgotModal.addEventListener("click", function (e) {
            if (e.target === forgotModal) closeForgotModal();
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener("click", function () {
            if (forgotStep1) forgotStep1.style.display = "block";
            if (forgotStep2) forgotStep2.style.display = "none";
            if (forgotStep2Error) forgotStep2Error.style.display = "none";
        });
    }

    // Step 1: Send Recovery Code
    if (sendRecoveryCodeBtn) {
        sendRecoveryCodeBtn.addEventListener("click", async function () {
            const email = forgotEmailInput ? forgotEmailInput.value.trim() : "";
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (forgotStep1Error) {
                    forgotStep1Error.textContent = "Please enter a valid email address.";
                    forgotStep1Error.style.display = "block";
                }
                return;
            }

            if (forgotStep1Error) forgotStep1Error.style.display = "none";
            sendRecoveryCodeBtn.disabled = true;
            sendRecoveryCodeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending code...';

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (!res.ok) {
                    if (forgotStep1Error) {
                        forgotStep1Error.textContent = data.message || "Could not send verification email.";
                        forgotStep1Error.style.display = "block";
                    }
                    showToast(data.message || "Could not send verification email.", "error");
                    return;
                }

                currentRecoveryEmail = email;
                if (sentToEmailSpan) sentToEmailSpan.textContent = email;
                if (forgotStep1) forgotStep1.style.display = "none";
                if (forgotStep2) forgotStep2.style.display = "block";
                if (resetCodeInput) {
                    resetCodeInput.value = "";
                    resetCodeInput.placeholder = "6-digit Verification Code";
                    resetCodeInput.focus();
                }

                if (data.emailSent === false) {
                    showToast("ℹ️ Server email service is in local development mode. Check the backend server console log for your 6-digit code!", "info", 12000);
                } else {
                    showToast(data.message || "A verification code has been sent to your email. Please check your inbox.", "success", 7000);
                }
            } catch (err) {
                console.error("Forgot password error:", err);
                if (forgotStep1Error) {
                    forgotStep1Error.textContent = "Server connection error. Please try again.";
                    forgotStep1Error.style.display = "block";
                }
                showToast("Unable to connect to the server. Please try again.", "error");
            } finally {
                sendRecoveryCodeBtn.disabled = false;
                sendRecoveryCodeBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Verification Code';
            }
        });
    }

    // Step 2: Reset Password with Code
    if (submitResetPasswordBtn) {
        submitResetPasswordBtn.addEventListener("click", async function () {
            const resetCode = resetCodeInput ? resetCodeInput.value.trim() : "";
            const newPassword = resetNewPasswordInput ? resetNewPasswordInput.value : "";
            const confirmPassword = resetConfirmPasswordInput ? resetConfirmPasswordInput.value : "";

            if (!resetCode || resetCode.length < 4) {
                if (forgotStep2Error) {
                    forgotStep2Error.textContent = "Please enter the 6-digit verification code.";
                    forgotStep2Error.style.display = "block";
                }
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                if (forgotStep2Error) {
                    forgotStep2Error.textContent = "New password must be at least 6 characters long.";
                    forgotStep2Error.style.display = "block";
                }
                return;
            }

            if (newPassword !== confirmPassword) {
                if (forgotStep2Error) {
                    forgotStep2Error.textContent = "Passwords do not match.";
                    forgotStep2Error.style.display = "block";
                }
                return;
            }

            if (forgotStep2Error) forgotStep2Error.style.display = "none";
            submitResetPasswordBtn.disabled = true;
            submitResetPasswordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating password...';

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: currentRecoveryEmail,
                        resetCode: resetCode,
                        newPassword: newPassword
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    if (forgotStep2Error) {
                        forgotStep2Error.textContent = data.message || "Failed to reset password.";
                        forgotStep2Error.style.display = "block";
                    }
                    showToast(data.message || "Failed to reset password", "error");
                    return;
                }

                showToast(data.message || "Password updated successfully! Please log in now.", "success", 5000);
                closeForgotModal();
                if (emailInput && currentRecoveryEmail) {
                    emailInput.value = currentRecoveryEmail;
                }
                if (passwordInput) passwordInput.focus();
            } catch (err) {
                console.error("Reset password error:", err);
                if (forgotStep2Error) {
                    forgotStep2Error.textContent = "Server connection error. Please try again.";
                    forgotStep2Error.style.display = "block";
                }
            } finally {
                submitResetPasswordBtn.disabled = false;
                submitResetPasswordBtn.innerHTML = '<i class="fa-solid fa-check"></i> Reset & Update Password';
            }
        });
    }

    // ─── Real Google Identity Services (GIS) Sign-In Flow ───────────────────
    async function handleGoogleCredentialResponse(response) {
        if (!response || !response.credential) {
            showToast("Google authentication was cancelled or did not return a credential.", "error");
            return;
        }

        const wrapper = document.getElementById("googleSignInBtnWrapper");
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
                showToast(data.message || "Google authentication verification failed.", "error", 6000);
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

            showToast("🎉 Welcome, " + (data.name || "User") + "! Logging you in...", "success", 3000);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (err) {
            console.error("Google Auth verification error:", err);
            showToast("Unable to connect to authentication server. Please try again.", "error");
            if (wrapper) {
                wrapper.style.opacity = "1";
                wrapper.style.pointerEvents = "auto";
            }
        }
    }

    async function initGoogleAuth() {
        const container = document.getElementById("g_id_signin");
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

        if (window.location.protocol === "file:") {
            container.innerHTML = '<div style="font-size:0.85rem; color:#EA4335; text-align:center; padding:10px 14px; border:1.5px dashed #FCA5A5; border-radius:12px; background:#FEF2F2; line-height:1.4; max-width:340px; margin:0 auto;">' +
                '<i class="fa-solid fa-triangle-exclamation" style="margin-right:6px; font-size:1rem;"></i>' +
                '<strong>Local Server Required</strong><br>' +
                'Google OAuth does not support <code style="background:#FEE2E2; padding:2px 4px; border-radius:4px; font-weight:600;">file:///</code>.<br>' +
                'Please open: <a href="http://localhost:5000/login.html" style="color:#4F46E5; font-weight:700; text-decoration:underline;">http://localhost:5000/login.html</a>' +
                '</div>';
            return;
        }

        if (!clientId) {
            container.innerHTML = '<div style="font-size:0.82rem; color:#94A3B8; text-align:center; padding:8px 12px; border:1px dashed #CBD5E1; border-radius:10px;">' +
                '<i class="fa-brands fa-google" style="color:#4F46E5; margin-right:5px;"></i>' +
                '<span>Google Sign-In ready. Set <code style="color:#4F46E5;">GOOGLE_CLIENT_ID</code> in .env to activate.</span>' +
                '</div>';
            return;
        }

        function renderGoogleButton() {
            if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });

                    const isDarkMode = document.body.classList.contains("dark-mode");
                    google.accounts.id.renderButton(container, {
                        type: "standard",
                        theme: isDarkMode ? "filled_black" : "outline",
                        size: "large",
                        text: "signin_with",
                        shape: "pill",
                        logo_alignment: "left",
                        width: 320
                    });
                } catch (err) {
                    console.error("Google button render error:", err);
                }
            } else {
                setTimeout(renderGoogleButton, 200);
            }
        }

        renderGoogleButton();
    }

    setTimeout(initGoogleAuth, 150);
});
