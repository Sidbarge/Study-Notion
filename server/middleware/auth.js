const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//authitication
exports.auth = async (req,res,next) => {
    try{
      
        //extract token from req body,or header or cookie
         const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ","");

         //check token fetched or not
         if(!token)
         {
            return res.status(401).json({
                success:false,
                message:"Token Missing"
            });
         }

         //verify the token 
         try{
            //decode all information present in token and add token in req mai new user object mai
            const decode = await jwt.verify(token,process.env.JWT_SECRET);
            req.user = decode;
               
         }catch(error)
         {
            return res.status(401).json({
                success:false,
                message:"Token is invalid"
            });
         }

         next();
    }catch(error)
    {
      return res.status(401).json({
        success:false,
        message:"Somenthing went wrong while verifying token",
        error:error.message
      });
    }
}

//isStudent

exports.isStudent = async(req,res,next)=>{

    try{
         
        if(req.user.accountType !== "Student")
        {
            return res.status(401).json({
                success:false,
                message:"This is protected route for student"
            })
        }

        next();
    }catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"accountType is not matching "
        })
    }
}



//isInstructor

exports.isInstructor = async (req,res,next) => {
    try{
         
        if(req.user.accountType !== "Instructor")
        {
            return res.status(401).json({
                success:false,
                message:"This is protected route for Instructor"
            })
        }

        next();
    }catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"accountType is not matching "
        })
    }
}

exports.isAdmin = async (req,res,next) => {
    try{
         
        if(req.user.accountType !== "Admin")
        {
            return res.status(401).json({
                success:false,
                message:"This is protected route for Admin"
            })
        }

        next();
    }catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"accountType is not matching "
        })
    }
}
