const User = require("../models/User");
const Profile = require("../models/Profile");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress")

const { setTimeout } = require("timers");
const { convertSecondsToDuration } = require("../utils/secToDuration")

//const cron = require("node-cron"); --> when we need to schedule any recurring task


exports.updateProfile = async (req , res) => {
    try{
       
      //we already created dummy profile at the time of sign up so their is no need to create new profile simply update that profile
      //get data
      
      const{dateOfBirth="",about="",contactNumber="",gender=""}  = req.body;

      //get user id --> from req mai user kai body mai present hai at the time of token creation payload ko user mai save kiya hai

      const id = req.user.id;

      //validation
      // if(!dateOfBirth || !about || !contactNumber || !gender)
      // {
      //   return res.status(401).json({
      //       success:false,
      //       message:"All fields are required"
      //   })
      // } 

      //get usedetails by using id 
      const userDetails = await User.findById(id);
      //get profile which present inside the additionaldetails
      const profileId =  userDetails.additionalDetails;
      //get profile details

      const profile = await Profile.findById(profileId);

      //updates profile according to new data
      profile.gender=gender;
      profile.about = about;
      profile.contactNumber=contactNumber;
      profile.dateOfBirth = dateOfBirth;

      //save the document in db
      await profile.save();

        // Find the updated user details
      const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()
      return res.status(200).json({
        success:true,
        message:"Profile updated successfully",
        updatedUserDetails
      })

    }catch(error)
    {
        return res.status(500).json({
            success:false,
            meassge:"Somenthing went wrong , while updatiing profile"
        })
    }
}


//deleting profile or account 

exports.deleteProfile = async (req, res) => {
    try {
        // Get user id from the request
        const id = req.user.id;

        // Get user details
        const userDetails = await User.findById(id);

        // Get profile id from user details
        const profileId = userDetails.additionalDetails;

        // Validate all info
        if (!userDetails || !profileId) {
            return res.status(401).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Schedule the deletion after 2 to 3 days
        const delayInMilliseconds = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        setTimeout(async () => {
            
            // Delete profile
            await Profile.findByIdAndDelete(profileId);

            // Unenroll user from all courses

            await Course.updateMany({ studentsEnrolled: id }, { $pull: { studentsEnrolled: id } },{new:true});
                                }, delayInMilliseconds);

            // Delete user
            await User.findByIdAndDelete(id);
          
        return res.status(200).json({
            success: true,
            message: "Profile deletion scheduled successfully. It will be deleted in 2 to 3 days."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while scheduling profile deletion"
        });
    }
};

//get all user details
exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

//update profile picture
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

// exports.getEnrolledCourses = async (req, res) => {
//     try {
//       const userId = req.user.id
//       const userDetails = await User.findOne({
//         _id: userId,
//       })
//         .populate("courses")
//         .exec()
//       if (!userDetails) {
//         return res.status(400).json({
//           success: false,
//           message: `Could not find user with id: ${userDetails}`,
//         })
//       }
//       return res.status(200).json({
//         success: true,
//         data: userDetails.courses,
//       })
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       })
//     }
// };
  


exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id

    let userDetails = await User.findOne({ _id: userId })
    .populate({
      path: "courses",
      populate: {
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      },
    })
    .populate({
      path: "courseProgress",
      populate: [
        {
          path: "userId",
          model: "User",
        },
        {
          path: "courseId",
          model: "Course",
        },
        {
          path:"completedVideos",
          model:"SubSection"
        }
      ],
    })
    .exec();
  


    userDetails = userDetails.toObject()

    console.log("user details " , userDetails)
     
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }

      let courseProgressCount = await CourseProgress.findOne({
        courseId: userDetails.courses[i]._id,
        userId: userId,
      })

      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id })

    const courseData = courseDetails.map((course) => {
      // enrolled 
      const totalStudentsEnrolled = course.studentsEnrolled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      }

      return courseDataWithStats
    })

    res.status(200).json({ courses: courseData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

