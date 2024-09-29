const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new Schema({
    todo:{
        type: String,
        required: true,
        minLength: 3,
        maxLength: 100,
        trim : true,
    },
    username : {
        type : String,
        required : true,
    },
    creationDateTime:{
        type : Date,
        default : Date.now,
    }
 },
 {
    timestamps: true,
 }

)


module.exports = mongoose.model('Todo', todoSchema);