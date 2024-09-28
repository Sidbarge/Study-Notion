const { default: mongoose } = require("mongoose");
const Course = require("../models/Course");
const RatingAndReview = require("../models/RatingAndReview");

//create rating 

exports.createRating = async(req,res)=> {
   try{
       //fetch data

    const userId = req.user.id;
    const{rating,review,courseId} = req.body;

    //check user is  enrolled in course or not

    const courseDetails = await Course.findById({_id:courseId ,
                                                         studentsEnrolled : {$elemMatch:{$eq:userId}}});
    
    if(!courseDetails)
    {
        return res.status(401).json({
            success:false,
            message:"User in not enrolled in the course"
        })
    }

    //check if user is already reviewed course

    const alreadyReviewd = await RatingAndReview.findOne({
        user:userId,
        course:courseId,
    });

    if(alreadyReviewd)
    {
        return res.status(200).json({
            success:true,
            message:"Course is already reviewed by user"
        })
    }


    //create raring and review

    const ratingReview = await RatingAndReview.create({
                                                       rating:rating,
                                                       review:review,
                                                       user:userId,
                                                       course:courseId});

    
    //update the course with new rating and review
    await Course.findByIdAndUpdate(courseId,
                                 {
                                    $push:{ratingAndReviews:ratingReview}
                                 });
  await courseDetails.save()

    return res.status(200).json({
        success:true,
        ratingReview,
        message:"Rating and Review successfull",
    })                             


    
   }catch(error)
   {
    return res.status(500).json({
        success:false,
        message:"Internal server error"
    })
   }
}


//get Average rating

exports.getAverageRating = async (req , res ) => {
    try{
         //fetch courseid
         const courseId = req.body.courseId;
         //calculate avg rating
         const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
                {   $group:{
                             _id:null,
                             averageRating:{$avg:`$rating`}
                           }
                }
         ])
         //return avg rating and review
         if(result.length > 0)
         {
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating 
            });
         }
         //if no rating -->return res
         if(result.length === 0)
         {
            return res.status(404).json({
                success:false,
                message:"No rating and review given till now"
             })
         }

         //return succcess res
         return res.status(200).json({
            success:true,
            message:" Average rating fetched successfully"
         })
    }catch(error)
    {  console.log(error)
        return res.status(500).json({
            success:false,
            message:"somenthing went wrong whu=ile getting Average rating",
            error:error.message,
        })
    }
}

//get all rating and reveiw

exports.getAllRating = async(req,res)=>{
    try {
        const allReviews = await RatingAndReview.find({})
          .sort({ rating: "desc" })
          .populate({
            path: "user",
            select: "firstName lastName email image", // Specify the fields you want to populate from the "Profile" model
          })
          .populate({
            path: "course",
            select: "courseName", //Specify the fields you want to populate from the "Course" model
          })
          .exec()
    
        res.status(200).json({
          success: true,
          data: allReviews,
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve the rating and review for the course",
          error: error.message,
        })
      }
}