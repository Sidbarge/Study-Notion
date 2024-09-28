const mongoose  = require("mongoose");

const profileSchema = new mongoose.Schema({

    dateOfBirth:{
        type:String,
        
    },

    gender:{
        type:String,
        

    },

    contactNumber:{
        type:Number,
        
    },

    about:{
        type:String,
        
    },

});

module.exports = mongoose.model("Profile",profileSchema);