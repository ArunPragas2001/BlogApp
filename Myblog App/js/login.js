// ==========================================
// LOGIN.JS - Login Form Controller
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (!loginForm) return;

    // Helper functions for UI feedback
    function showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = "block";
        }
    }

    function clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = "";
            errorElement.style.display = "none";
        }
    }

    function clearAllErrors() {
        clearError("emailError");
        clearError("passwordError");
        clearError("generalError");
    }

    // Validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || email.trim() === "") {
            showError("emailError", "Please enter your email address.");
            return false;
        } else if (!emailRegex.test(email.trim())) {
            showError("emailError", "Please enter a valid email address.");
            return false;
        } else {
            clearError("emailError");
            return true;
        }
    }

    function validatePassword(password) {
        if (!password || password.trim() === "") {
            showError("passwordError", "Please enter your password.");
            return false;
        } else {
            clearError("passwordError");
            return true;
        }
    }

    // Input listener to clear error as user types
    if (emailInput) {
        emailInput.addEventListener("input", () => clearError("emailError"));
    }
    if (passwordInput) {
        passwordInput.addEventListener("input", () => clearError("passwordError"));
    }

    // Form submit listener
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearAllErrors();

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Get registered users from localStorage
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users")) || [];
        } catch (e) {
            users = [];
        }

        // Add demo user if users list is empty
        if (users.length === 0) {
            users = [{
                id: 1,
                name: "Demo User",
                email: "user@example.com",
                password: "Password123!"
            }];
            localStorage.setItem("users", JSON.stringify(users));
        }

        // Find user by email and password
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (user) {
            // Save active session
            localStorage.setItem("currentUser", JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            showError("generalError", "Invalid email address or password. Try demo: user@example.com / Password123!");
        }
    });
});