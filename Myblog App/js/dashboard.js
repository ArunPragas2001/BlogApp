const blogs =[
   {
    id: 1,
    title: "Blog 1",
    content: "Content 1",
    image: "image1.jpg",
    category: "Category 1"
   },
   {
    id: 2,
    title: "Blog 2",
    content: "Content 2",
    image: "image2.jpg",
    category: "Category 2"
   }

];


const blogContainer=document.getElementById("blogContainer");

const totalBlog=document.getElementById("totalBlogs");

const publishedBlogs=document.getElementById("publishedBlogs");

const draftBlogs=document.getElementById("draftBlogs");


if(!blogContainer)
{
    return;
}
blogContainer.innerHTML ="";

blogs.forEach(function(blog){
 
    const blogCard = document.createElement("div");
    blogCard.classList.add("dashboard-blog");
    blogCard.innerHTML = `

    <div class="blog-info">
        <span class="blog-catogory">
        ${blog.category}
        </span>

        <h3>${blog.title}</h3>
        <p>${blog.content}</p>

        <div class="blog-actions">
            <button onclick="editBlog(${blog.id})">
            Edit</button>

            <button onclick="deleteBlog(${blog.id})">
            Delete</button>

        </div>
        </div>
    `;

    blogContainer.appendChild(blogCard);

        
    
    
    
    
    
})

