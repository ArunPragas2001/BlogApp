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
        if (name === "") {
            showError("nameError", "Name is required");
        }
        else if (name.length < 3) {
            showError("nameError", "Name must be at least 3 characters long");
        }
        else {
            clearError("nameError");
            return true;
        }
    }

    function validateEmail(email) {
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if (email === "") {
            showError("emailError", "Email is required");
        }
        else if (!email.match(emailRegex)) {
            showError("emailError", "Invalid email address");
        }
        else {
            clearError("emailError");
            return true;
        }
    }
    function validatepassword(password) {
        passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/

        if (password === "") {
            showError("passwordError", "Enter your password");
        }

        else if (!password.match(passwordRegex)) {
            showError("passwordError", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
        }
        else {
            clearError("passwordError");
            return true;
        }
    }

    function validateConfirmPassword(password, confirmPassword) {
        if (confirmPassword === "") {
            showError("confirmPasswordError", "Confirm password is required");
        }
        else if (password !== confirmPassword) {
            showError("confirmPasswordError", "Passwords do not match");
        }
        else {
            clearError("confirmPasswordError");
            return true;
        }
    }

    function validateTerms(terms) {
        if (!terms) {
            showError("termsError", "You must agree to the terms and conditions");
        }
        else {
            clearError("termsError");
            return true;
        }
    }

    alert("Registration successful");
    window.location.href = "index.html";



































}