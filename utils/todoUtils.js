const todoDataValidation = ({todo}) => {
    return new Promise((resolve, reject)=> {
        if(!todo) return reject("Todo is missing");

        if(typeof todo !== "string") return reject("Todo is not a text");

        if(todo.length < 3 || todo.length > 50) return reject("Todo length should be 3 - 50 charcter");

        resolve();
    })
}


module.exports = todoDataValidation;