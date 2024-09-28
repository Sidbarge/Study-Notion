const User = require("../models/User");
const Category  = require("../models/Category");
const Course = require("../models/Course");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")
const{uploadImageToCloudinary} = require("../utils/imageUploader");

require("dotenv").config();

exports.createCourse = async (req,res) => {
   try{
     //fetch all data
     // Get user ID from request object
		
    //tag, remove kiya hai
     const{courseName,courseDescription,whatYouWillLearn,price,category,status,instructions,
        tag
           } = req.body;

     //get thumbnail
    const thumbnail = req.files.thumbnailImage;
     //validation
     
     if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category 

       || !tag || !thumbnail
        
         )
     {
         return res.status(401).json({
                success:false,
                message:"All fields are required",
                
         })
     }

     if(!status || status === undefined)
     {
        let status = "Draft";
     }
 
     //check for instructor - because each course ke liye alag instructor hoga 
    //  const instructorId = await User.findById(userId, {
    //     accountType: "Instructor",
    // });
     //const instructorDetails = await User.findById(userId);

     const instructorId = req.user.id
 
     if(!instructorId)
     {
         return res.status(404).json({
             success:false,
             message:"Intructor not found"
         })
     }
 
     //check valid category or not
     const categoryDetails = await Category.findById(category);
     //validation of tacategoryg
     if(!categoryDetails)
     {
         return res.status(404).json({
             success:false,
             message:"category details is not found"
         })
     }
     
 
     //upload image
    const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);
 
     //create new course with give details
 
     const newCourse = await Course.create({
         courseName,
         courseDescription,
         instructor:instructorId,
         whatYouWillLearn:whatYouWillLearn,
         price,
         tag:tag,
        category:categoryDetails._id,
        thumbnail:thumbnailImage.secure_url,
         status:status,
         instructions:instructions,
     });
 
     // add new course to User Schema
 
     await User.findByIdAndUpdate({_id:instructorId},
         {
             $push :{courses:newCourse._id}
         },{new:true});
 
     //update category ka schema
 
    const response=  await Category.findByIdAndUpdate({_id:category},
         {
             $push:{courses:newCourse._id}
         },{new:true});
 
     //return res

     return res.status(200).json({
        success:true,
        message:"Course created successfully",
        data:newCourse
        
     })
   }catch(error)
   {
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"Somenthing went wrong while creating course",
        error:error.message
    });
   }
}


//get all courses

exports.getAllCourses = async(req,res) => {

    try{
 
        const allCourses =await Course.find({},
                                           {courseName:true,
                                            price:true,thumbnail:true,instructor:true,ratingAndReviews:true,
                                            studentsEnrolled:true}).populate("instructor").exec();

        
         return res.status(200).json({
            success:true,
            message:"All courses fetched successfully",
            data:allCourses
         })                                   


    }catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Somenthing went wrong while fetching all courses"
        })
    }
}

//getcourse particular details 

exports.getCourseDetails = async(req,res) => {

try{
  //get data

  const {courseId} = req.body;

  //find course detail
  const courseDetails = await Course.findOne({_id:courseId})
                      .populate({
                          path:"instructor",
                          populate:{
                              path:"additionalDetails",
                          }
                      }).populate("category")
                       .populate("ratingAndReviews") 
                       .populate("studentsEnrolled")
                      .populate({
                           path:"courseContent",
                           populate:{
                               path:"subSection",
                               select: "-videoUrl",
                         }
                      })
                      .exec();

    //validation

    if(!courseDetails)
    {
        return res.status(404).json({
            success:false,
            message:`Could not find the course with ${courseId}`,
        })
    }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)



    return res.status(200).json({
        success:true,
        data: {
          courseDetails,
          totalDuration,
        },
        message:"Course details successfully fetched",
   
    })

}catch(error)
{        console.log(error)
    return res.status(500).json({
        success:false,
        message:"Somenthig went wrong while,getting particular course details",
        
    })
}

}


//edit course 
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

  exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id

      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()


       
  
      let courseProgressCount = await CourseProgress.findOne({
        courseId: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
      
      return res.status(200).json({
        success: true,
        
        data: {
          courseDetails,
          totalDuration,
          // courseProgressCount,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }

  // Delete the Course
exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }