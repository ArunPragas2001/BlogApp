const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        //===============GET FORM VALUES================//
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const conformPassword = document.getElementById("confirmPassword").value;


        console.log(name);
        console.log(email);
        console.log(password);
        console.log(conformPassword);

    });

    //===============validate NAME================//


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

    alert("Registration successful");
    window.location.href = "index.html";



































}