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


    alert("Login successful!"); 
    
    window.location.href = "dashboard.html";






    












})

}