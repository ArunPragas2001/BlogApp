const blogForm = document.getElementById('blogForm');

if (blogForm) {
    blogForm.addEventListener('submit', function (event) {
        event.preventDefault();


        // Get form values

        const title = document.getElementById('blogTitle').value.trim();

        const content = document.getElementById('blogContent').value.trim();

        const image = document.getElementById('blogImage').value.trim();

        const category = document.getElementById('blogCategory').value.trim();

        console.log(title);

        console.log(content);

        console.log(image);

        console.log(category);


        // Validate form values


        //==========validate title================//


        if (title === '') {
            showError('titleError', 'Title is required');
        }

        else {
            clearError('titleError');
        }



        //==========validate content================//




        if (content === '') {
            showError('contentError', 'Content is required');
        }

        else {
            clearError('contentError');
        }       



        //==========validate image URL================//




        if (image === '') {
            showError('imageError', 'Image URL is required');
        }

        else {
            clearError('imageError');
        }


        //==========validate category================//


        if(category === '') {
            showError('categoryError', 'Category is required');
        }

        else {
            clearError('categoryError');
        }

        //==========create blog object================//

        const blog ={

            title: title,
            content: content,
            image: image,
            category: category

           
        }


        console.log(blog);


        // //==========store blog in local storage================//

        // let blogs = JSON.parse(localStorage.getItem('blogs')) || [];


        










    

    })

}