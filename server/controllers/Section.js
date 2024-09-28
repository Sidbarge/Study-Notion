const Course = require("../models/Course");
const Section = require("../models/Section");
//const SubSection = require("../models/SubSection")
const SubSection = require("../models/SubSection")

//create section handeler

exports.createSection = async (req,res)=> {
    try{
   
        //fetch data
    const{sectionName ,courseId} = req.body;
    //validation

    if(!sectionName || !courseId)
    {
        

        return res.status(400).json({
            success:false,
            message:"All field are required",
            
        });
    }
    //create section
    const newSection = await Section.create({sectionName});
    //update Course model with section id
    //use populate to replace the section and subsection both

    const updatedCourse = await Course.findByIdAndUpdate(courseId,{
        $push : {courseContent:newSection._id},
    },{new:true}).populate({
        path:"courseContent",
        
        populate :{
            path:"subSection",
            
        }
    }).exec();

    

    return res.status(200).json({
        success:true,
        message:"Section created successfully",
        updatedCourse
    })
    }catch(error)
    {
         console.log(error)
        return res.status(500).json({
            success:false,
            message:"Somenthing went wrong while creating section",
            error:error.message
        });
    }

}

//update section

exports.updateSection =async(req,res)=>{
  try{
       //fetch data
    const{sectionName,sectionId ,courseId} = req.body; 
    //validation
    if(!sectionName || !sectionId)
    {
        return res.status(401).json({
            success:false,
            message:"All fieldes are required"
        });
    }
   

    const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
     //find updated course 
    const course = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()
    //return res
    return res.status(200).json({
        success:true,
        message:"section name  updated successfully",
        data:course
    });
  }catch(error)
  {
    return res.status(500).json({
        success:false,
        message:"Somenthing went wrong while updating section"
    })
  }
}


// // DELETE a section
exports.deleteSection = async (req, res) => {
    try {
      const { sectionId, courseId } = req.body
      await Course.findByIdAndUpdate(courseId, {
        $pull: {
          courseContent: sectionId,
        },
      })
      const section = await Section.findById(sectionId)
      console.log(sectionId, courseId)
      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        })
      }
      // Delete the associated subsections
      await SubSection.deleteMany({ _id: { $in: section.subSection } })
  
      await Section.findByIdAndDelete(sectionId)
  
      // find the updated course and return it
      const course = await Course.findById(courseId)
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.status(200).json({
        success: true,
        message: "Section deleted",
        data: course,
      })
    } catch (error) {
      console.error("Error deleting section:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
  







//delete section


// exports.deleteSection = async(req,res)=>{
//     try{
//        //get id -->also  we are sending id in parameter
//     const {sectionId} = req.body;

//     //use find by id and delete to delete section in section schema
//     await Section.findByIdAndDelete(sectionId);

//     //update the course schema because mongodb not delete the referances
//     //we use this function when we have directely courseId 
//     // await Course.findByIdAndUpdate(sectionId,{
//     //     $pull:{courseContent:sectionId}
//     // })

//     //By using section id we first findout course 
//     const course = await Course.findOne({courseContent:sectionId});
//     //validation
//     if(!course)
//     {
//         return res.status(404).json({
//             success:false,
//             message:"Section is already deleted or not found"
//         })
//     }
//     //then by using section id we delete the id from courseContent
//     await course.courseContent.pull(sectionId);
//     //save change in db
//      await course.save();
//     //return res
//     return res.status(200).json({
//         success:true,
//         message:"Section deleted successfully "
//     })


//     }catch(error)
//     {
//         return res.status(500).json({
//             success:false,
//             message:"Somenthing went wrong,while deleting section"
//         })
//     }
// }