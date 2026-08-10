// ==========================================
// REGISTER.JS - Account Registration Controller
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const termsInput = document.getElementById("terms");

    if (!registerForm) return;

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
        clearError("nameError");
        clearError("emailError");
        clearError("passwordError");
        clearError("confirmPasswordError");
        clearError("termsError");
        clearError("generalError");
    }

    // Validation functions
    function validateName(name) {
        if (!name || name.trim() === "") {
            showError("nameError", "Name is required.");
            return false;
        } else if (name.trim().length < 3) {
            showError("nameError", "Name must be at least 3 characters long.");
            return false;
        } else {
            clearError("nameError");
            return true;
        }
    }

    function validateEmail(email) {
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!email || email.trim() === "") {
            showError("emailError", "Email is required.");
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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/;
        if (!password) {
            showError("passwordError", "Password is required.");
            return false;
        } else if (!passwordRegex.test(password)) {
            showError("passwordError", "Password must be at least 8 characters long and include an uppercase, lowercase, number, and special character.");
            return false;
        } else {
            clearError("passwordError");
            return true;
        }
    }

    function validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) {
            showError("confirmPasswordError", "Please confirm your password.");
            return false;
        } else if (password !== confirmPassword) {
            showError("confirmPasswordError", "Passwords do not match.");
            return false;
        } else {
            clearError("confirmPasswordError");
            return true;
        }
    }

    function validateTerms(termsChecked) {
        if (!termsChecked) {
            showError("termsError", "You must agree to the terms and privacy policy.");
            return false;
        } else {
            clearError("termsError");
            return true;
        }
    }

    // Input listeners to clear errors dynamically
    if (nameInput) nameInput.addEventListener("input", () => clearError("nameError"));
    if (emailInput) emailInput.addEventListener("input", () => clearError("emailError"));
    if (passwordInput) passwordInput.addEventListener("input", () => clearError("passwordError"));
    if (confirmPasswordInput) confirmPasswordInput.addEventListener("input", () => clearError("confirmPasswordError"));
    if (termsInput) termsInput.addEventListener("change", () => clearError("termsError"));

    // Submit handler
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        clearAllErrors();

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
        const termsChecked = termsInput ? termsInput.checked : false;

        const isNameValid = validateName(name);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isConfirmValid = validateConfirmPassword(password, confirmPassword);
        const isTermsValid = validateTerms(termsChecked);

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid || !isTermsValid) {
            return;
        }

        // Check if email already registered
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users")) || [];
        } catch (err) {
            users = [];
        }

        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            showError("emailError", "An account with this email address already exists.");
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password
        };

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        // Auto login
        localStorage.setItem("currentUser", JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }));

        alert("Registration successful! Welcome to BlogSphere.");
        window.location.href = "dashboard.html";
    });
});