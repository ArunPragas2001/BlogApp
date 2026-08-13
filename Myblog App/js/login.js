const loginForm=document.getElemenmtById("loginForm");

if (loginForm) {

loginForm.addEventListener("submit",function(event){
    event.preventDefault();

   
    // get form values
    const email=document.getElementById("loginEmail").value;
    const password=document.getElementById("loginPassword").value;

    console.log(email);
    console.log(password);

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
})
};