const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const {uploadImageToCloudinary} = require("../utils/imageUploader");


exports.createSubSection = async(req,res)=>{
   try{
      //fetch data
    const{title, description,sectionId} = req.body;
    //fetch video from file
    const video = req.files.video;
    
      if(!video)
      {
        console.log("video not found")
      }
    
   
    //console.log(video);
    //validate data
     if(!title  || !description || !sectionId || !video)
     {
        return res.status(401).json({
            success:false,
            message:"All fields are required",
            
           
        });
     }
    //upload video to cloudinary-->you are getting secure_url
    const videoUploadDetail = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
    //create new subsection in db
    const newSubSection = await SubSection.create({
        title:title,
       timeDuration:`${videoUploadDetail.duration}`,
        description:description,
        videoUrl:videoUploadDetail.secure_url,

    });
    //update section with subsection object id
   const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},{
        $push:{subSection:newSubSection._id}
    },{new:true}).populate({
        path:"subSection",
        
    }).exec();

    console.log(updatedSection);

    //return res 

    return res.status(200).json({
        success:true,
        message:"SubSection created succsessfully",
        data:updatedSection
    });
   }catch(error)
   {
    console.log("error while creating new subection",error)
    return res.status(500).json({
        success:false,
        message:"Somenthing went wrong, while creating subsection",
        error:error.message
    })
   }
}

//update subsection

exports.updateSubSection = async (req, res) => {
    try {
      const {sectionId, subSectionId, title, description } = req.body
      const subSection = await SubSection.findById(subSectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()

      const updatedSection = await Section.findById(sectionId).populate("subSection").exec()


  
      return res.json({
        success: true,
        data:updatedSection,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }






  exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }

  // *******imp*******
      updatedSection = await Section.findById(sectionId).populate("subSection").exec()
  
      return res.json({
        success: true,
        data:updatedSection,
        message: "SubSection deleted successfully",
       
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }



  
//delete subSection

// exports.deleteSubSection = async (req,res)=>{
//     try{
//         //get id -->assume that we are sending parameter inside http request like this `/api/sections/1234`

//         const{SubSectionId,sectionId} = req.body;

//         //use find by id and delete subsection from subsection schema
//         await SubSection.findByIdAndDelete(SubSectionId );

//         //update the section schema-->this logic is used when we have direct section id
//         // await Section.findByIdAndUpdate(SectionId,{
//         //     $pull:{subSections:SubSectionId}
//         // },{new:true});


//         //first find out the section that conatin subsection using subsectionId

//         const section = await Section.findOne({subSection:SubSectionId});

//         //remove subsection id from subsections arry
//         section.subSection.pull(SubSectionId);
//         //save 
//          await section.save();


//         //return res
//         return res.status(200).json({
//             success:true,
//             message:"subSection deleted successfully",
//             data:section
//         })

//     }catch(error)
//     {
//         return res.status(500).json({
//             success:false,
//             message:"Somenthing went wrong, while seleting subsection"
//         })
//     }
// }