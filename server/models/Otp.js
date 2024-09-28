const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");



const OTPSchema = new mongoose.Schema({

    email:{
        type:String,
        required:true,
        trim:true,
    },

    otp:{
        type:String,
        required:true,
    },

    createsAt:{
        type:Date,
        default:Date.now(),
        expires:5*60,
    }
});


//funtion--> to send email

async function sendVerificationMail(email,otp){
    try{
       
        const response = await mailSender(email,"Verification Email From StudyNotion",emailTemplate(otp));

        console.log("Email Send Succesfully",response);

    }catch(error)
    {
        console.log("Error While Sending Mail",error);
        throw error;
    }
}

//use pre-save middleware 

OTPSchema.pre("save", async function(next){
    await sendVerificationMail(this.email,this.otp);
    //inssted of "this" we can use doc.email or doc.otp
    next();
})

module.exports = mongoose.model("OTP",OTPSchema);