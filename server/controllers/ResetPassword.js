const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPasswordToken

exports.resetPasswordToken = async(req,res)=>
{
    try{
    
        //get email from req body

        const {email} = req.body;
        //check user for this email and validite user 

        const user = await User.findOne({email});
        //valididate
        if(!user)
        {
            return res.status(401).json({
                success:false,
				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
            });
        }

        //generate token 
        //const token = crypto.randomUUID();
        const token = crypto.randomBytes(20).toString("hex");
        //update the user  by adding token and expiry time
        // it will add unique token and expiry time in db
        const updatedDetails = await User.findOneAndUpdate({email},{token:token,resetPasswordExpires:Date.now()+5*60*1000},{new:true});
        //create url for reset password

        const url = `http://localhost:3000/update-password/${token}`

        //send mail for reset pass

        const response =  await mailSender(email,"Password Reset",`Your Link for email verification is ${url}. Please click this url to reset your password.`
        );
        console.log( "Email response is :",response);
        return res.status(200).json({
            success:true,
            message:"Email Sent Successfully, Please Check Your Email to Continue Further",
            token,

        });
    


    }catch(error)
    {   
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Somenthing went wrong while sending password reset email"

        })
    }

    

}

//resetPassword

exports.resetPassword = async (req,res) => {
  try{
     
      //fetch token , password, and confirm password
   // here token is added by the frontend url into body
   const {password,confirmPassword,token} = req.body;

   //validation
   if(password !== confirmPassword)
   {
    return res.json({
        success:false,
        message:"password not matching"
    });
   }

   //gey userdetails by using token
    
   const userDetails = await User.findOne({token:token});

   //if not details found invalid token
   if(!userDetails)
   {
    return res.status(400).json({
        success:false,
        message:"Invalid Token"
    });
   }
   //check token time
   if(!(userDetails.resetPasswordExpires > Date.now()))
   {
    return res.json({
        success:false,
        message:"Token time expired ,Please regenerate your token"
    });
   }

   //hash password

   const hashedPassword = await bcrypt.hash(password,10);

   //update password (new:true --> it written updated document)
   await User.findOneAndUpdate({token:token},{password:hashedPassword},{new:true});

   //return response
   return res.status(200).json({
    success:true,
    message:"Password reset successfully ",
   })

  

  }catch(error)
  {     console.log(error);
       return res.status(500).json({
        success:false,
        message:"Somenting went wrong while resetting password"
       })
  }
}



