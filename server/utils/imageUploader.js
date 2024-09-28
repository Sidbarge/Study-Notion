const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async (file,folder,height,quality) => {
    const options = {folder};
    console.log(options);
    

    if(height)
    {
        options.height = height;
    }

    if(quality)
    {
        options.quality = quality;
    }

    //resources type auto it automatically detect the file type
    //const fileType = file.name.split(".")[1].toLowerCase();
   // options.resources_type = 'video';

    
    //console.log( "resources type is",options.resources_type);
    options.resource_type = "auto";

    return  cloudinary.uploader.upload(file.tempFilePath,options,(error, result)=>{
        console.log( "result",result, "error", error);
     });
}