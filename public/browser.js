console.log("hi from client");
let skip = 0;

window.onload = generateTodos();


// read
function generateTodos() {
   axios.get(`/read-item?skip=${skip}`)
   .then((res)=>{
                                //console.log(res)
                                // console.log(res.data);  
    if(res.data.status !== 200){
        alert(res.data.message);
        return;
    }
                         //console.log(res.data);
                        //console.log(res.data.data);
    const todos = res.data.data;

    console.log(skip);

    skip += todos.length;

    console.log(skip);

    console.log(todos);
     
    const item_list_container = document.getElementById("item_list");

    item_list_container.insertAdjacentHTML("beforeend", todos.map(item => {
        return `
            <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                <span class="item-text"> ${item.todo}</span>
                <div>
                    <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                    <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                </div>
            </li>
        `
        
       }).join("   ")
   );

    })
  .catch((err)=>console.log(err));
}


// edit data 
document.addEventListener("click", function(event) {


        if(event.target.classList.contains("edit-me")){
                                                    

            const todoId = event.target.getAttribute("data-id");
            const newData = prompt("Enter new text");

      
            axios.post("/edit-item", {todoId, newData})
                .then(res => {
        

                    if(res.data.status !== 200){
                        alert(res.data.message);
                        return;
                    }

                    // update the todo in the UI
                    event.target.parentElement.parentElement.querySelector(".item-text")
                    .innerHTML = newData;
                }
                )
                .catch(err => console.log(err));

            
        }

        // delete
        else if(event.target.classList.contains("delete-me")){
            console.log("delete-me clicked")

        
            const todoId = event.target.getAttribute("data-id");
        

            // call api passing todId
            axios.post("/delete-item", {todoId})
                .then(res => {
                    
                    if(res.data.status !== 200){
                        alert(res.data.message);
                        return;
                    }

                    // update the todo in the UI
                    event.target.parentElement.parentElement.remove();

                }
                )
                .catch(err => console.log(err));

            
        }

        // add todo
        else if(event.target.classList.contains("add_item")){
            // console.log("add buton clicked");

           const input =  document.getElementById("create_field");
                                                                 
            const inputText = input.value;
            if(inputText.trim() === ""){
                alert("Please enter a todo");
                return;
            }

            
            // call api passing new todo
            axios.post("/create-item", {todo: inputText})
            .then(res => {
                
                if(res.data.status!== 201){
                    alert(res.data.message);
                    return;
                }

                document.getElementById("create_field").value = "";


                document.getElementById("item_list").insertAdjacentHTML(
                    "beforeend",
                    `
                        <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                            <span class="item-text"> ${res.data.data.todo}</span>
                            <div>
                                <button data-id="${res.data.data.todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                                <button data-id="${res.data.data.todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                            </div>
                        </li>
                    `
                    );
                
                })
                .catch(err => console.log(err));

       }    
       
       else if(event.target.classList.contains("logout_me")){
                                       
         
         axios.post('/logout')
            .then((res)=>{
                console.log(res);
                if(res.status !== 200){
                    alert(res.data);
                    return;
                }

                window.location.href = "/login";
              })
            .catch(err => console.log(err));

        }

        else if(event.target.classList.contains("show_more")){
            console.log("show more clicked");

            generateTodos();

          

        }



});




































// <ul>
//     <li>
//        <span>Todo text</span>
//     </li>
//     <li> 
//         <button id="todo_id">Edit</button>
//     </li>
//     <li>
//         <button id="todo_id">Delete</button>
//     </li>
// </ul>