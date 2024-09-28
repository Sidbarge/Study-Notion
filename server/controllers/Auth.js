//import controller
const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const {passwordUpdated} = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");



//sendotp logic

exports.sendOTP = async (req,res) => {
    try
    {
      //fetch email
    const {email} = req.body;

    //check user is already exist or not
    const checkUserPresent =  await User.findOne({email});

    if(checkUserPresent)//if present
    {
        return res.status(401).json({
            success:false,
            message:"User Is Already Registered."
        })
    }

    //generate otp

    var otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    });

    console.log("OTP :",otp);
    //check unique otp or not 

    let result = await OTP.findOne({otp:otp});

    while(result) // if simliar entery found -> generate new otp
    {
        otp = otpGenerator.geneate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
    }

    result = await OTP.findOne({otp:otp});

    //save otp in db for  verification

    const otpPayload = {email,otp};

    //create entery on db

    const otpBody = await OTP.create(otpPayload);

    return res.status(200).json({
        success:true,
        message:"OTP Sent Successfully.",
        otp,
    })

     

    }catch(error)
    {
        console.log(error);
         return res.status(200).json({
            success:false,
            message:error.message,
         })
    }

        
}


//signup logic

exports.signUp = async(req,res) => {
    try 
    {
       //fetch all data from req body

    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        otp,
        contactNumber,
    } = req.body
    //validate entered data

    if(!firstName || !lastName || !email || !password || !confirmPassword ||!accountType || !otp)
    {
        return res.status(403).json({
            success:false,
            message:"All Feildes Are Required."
        })
    }
    // match the confirm password
    if(password !== confirmPassword )
    {
        return res.status(400).json({
            success:false,
            message:"Password Not Match"
        });
    }

    //check user already easist or not

    const exstingUser = await User.findOne({email});

    //if found
    if(exstingUser)
    {
        return res.status(400).json({
            success:false,
            message:"User Is Already Registered"

        })
    }
    //find the most recent otp stored in db for the email

    const recentOtp = await OTP.findOne({email}).sort({createdAt:-1}).limit(1);
    console.log(recentOtp);
    //validates the otp
    if(!recentOtp)
    {
        //otp not found
        return res.status(400).json({
            success:false,
            message:"Otp Not Found"
        })
    }

    else if(otp !== recentOtp.otp) //*** 
    { 
      
        //invalid otp
        return res.status(400).json({
            success:false,
            message:"Invalid Otp",
        });
    }

    //hash password 
    const hashedPassword = await bcrypt.hash(password,10);
    //create user
    let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);
    
    // create additional profile for User
    const profileDetails = await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:contactNumber
    })

    
    const newUser = await User.create({
        firstName:firstName,
        lastName:lastName,
        email:email,
        contactNumber:contactNumber,
        password:hashedPassword,
        accountType:accountType,
        approved:approved,
        additionalDetails: profileDetails._id,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}` 

    });
     
    console.log(newUser);
    //return res
    return res.status(200).json({
        success:true,
        message:"User Registerd Successfully",
        user: newUser

    });

    }catch(error)
    {
      console.log(error);
      return res.status(400).json({
        success:false,
        message:error.message,
        

      });
    }
}

//login logic

exports.login = async(req,res)=>{
   try
   {
    
     //fetch email,password data from req body

     const{email,password} = req.body;

     //validate data
     if(!email || !password)
     {
         return res.status(403).json({
            success:false,
				    message: `Please Fill up All the Required Fields`,
        
         });
     }
     //check user 
     
     const user = await User.findOne({email}).populate("additionalDetails");
 
     if(!user)
     {
         return res.status(401).json({
             success:false,
             message: `User is not Registered with Us Please SignUp to Continue`,
            });
     }
 
     //generate jwt token after matching password
     
     if(await bcrypt.compare(password,user.password))
     {
       const payload = {
         email:user.email,
         id:user._id,
         accountType:user.accountType
       }
      
       const token = jwt.sign(payload,process.env.JWT_SECRET,{
         expiresIn:"2h",
       });
 
       user.token = token;
       user.password = undefined;
 
       //create cookie and send response
       const options = {
 
         expires:new Date(Date.now()+3*24*60*60*1000),
         httpOnly:true,
       }
 
       res.cookie("token",token,options).status(200).json({
         success:true,
         message:`User Login Success`,
         user,
         token,
       });
     }
     else{
         return res.status(401).json({
             success:false,
             message:"Password is incorrect"
         });
     }
   }catch(error)
   {
     console.log(error);

     return res.status(500).json({
        success:false,
        message:"Login Failure, Please Try Again"
     });
   }

}

//chanepassword

exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

// exports.changePassword = async(req,res)=>{

//     try
//     {
     
//         //get old password and new password and confirm password from req body
//         const{oldPassword,newPassword} = req.body;

//         //validation
//         if(!oldPassword || !newPassword )
//         {
//           return res.status(401).json({
//             success:false,
//             message:"All fields are required"
//           });
//         }

//         //find user by using id 
//         //id present inside the user because all decoded information of token stored in user proerty

//         const userId = req.user.id;

//         const user = await User.findById(userId);

//         if(!user)
//         {
//           return res.status(401).json({
//             success:false,
//             message:"User is not registered`,please try again"
//           })
//         }

//         //mathing oldpassword with stored one

//         const isPasswordMatch = await bcrypt.compare(oldPassword,user.password);
//         if(!isPasswordMatch)
//         {
//           return res.status(400).json({
//             success:false,
//             message:"The Password Is Incorrect"
//           })
//         }
//         //match newpass and confirm pass
//         // if(newPassword !== confirmPassword)
//         // {
//         //    return res.status(401).json({
//         //     success:false,
//         //     message:"Password and confirm passwrd does not match"
//         //    })
//         // }
       

//         //hash new password
//         const hashedPassword = await bcrypt.hash(newPassword,10);

//         //save password indb
//          user.password = hashedPassword;
//          await user.save(); // or by usinf findyByIdAndUpdate

//          //send notifiaction email
//          try{
//           const emailResponse = await mailSender(
//             user.email,
//             "Password Changed Successfully",
//             `Hello ${user.firstName},\n\nYour password has been successfully changed on StudyNotion. If you didn't initiate this change, please contact our support team immediately.\n\nBest regards,\nThe StudyNotion Team`
//           );
//          }catch(error)
//          {
//           return res.status(500).json({
//             success:false,
//             message:`Error While Sending Notification Email(change password)`
//           });
//          }
//          //return res

//           return res.status(200).json({
//             success:false,
//             message:"Password Change Successfully"
//           });
       

//     }catch(error)
//     {
//         console.log(error);

//         return res.status(500).json({
//             success:false,
//             message:"Somenthing went wrong while changing Password",
//             error:error.message
//         });
//     }
// }






