const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    firstName:{
        type:String,
        required:true,
        trim:true
    },

    lastName:{
        type:String,
        required:true,
        trim:true
    },
    
    email:{
        type:String,
        required:true,
        trim:true
    },

    contactNumber:{
        type:String,
        
        trim:true
    },

    password:{
        type:String,
        required:true,
       
    },
    
    accountType:{
        type:String,
        required:true,
        enum: ["Admin", "Student", "Instructor"],
    },
    active: {
        type: Boolean,
        default: true,
    },

    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        
        ref:"Profile",
    },

    courses:[
        {
            type:mongoose.Schema.Types.ObjectId,
        
            ref:"Course",
        }
    ],

    tag:{
        type:[String],
        required:true,
        trim:true
    },
    
    image:{
        type:String,
        
    },

    token:{
        type:String
    },
    resetPasswordExpires:{
        type:Date,
    },

    courseProgress:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"CourseProgress"
        }
    ],
    approved: {
        type: Boolean,
        default: true,
    },
  
    
},  { timestamps: true });

module.exports = mongoose.model("User",userSchema);