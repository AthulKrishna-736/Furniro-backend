import bannerModel from "../../models/bannerSchema.js";

//get banners
export const getBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find().sort({ createdAt: 1 }); 
    res.status(200).json({
      message: "Banners retrieved successfully",
      banner: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error.message); 
    res.status(500).json({
      message: "Failed to retrieve banners",
      error: error.message,
    });
  }
};

//add banners
export const addBanners = async (req, res) => {
  console.log('ban req = ', req.body);
  try {
    const { bannerLocation, image } = req.body;

    if(!bannerLocation || !image){
      console.log('missing thing',[bannerLocation, image]);
      return res.status(400).json({ message:'Bannerlocation and image are missing.' })
    }
    
    console.log('values are properly there its time for the uploading face')
      const banner = new bannerModel({
        bannerLocation: bannerLocation,
        image: image,
      });

      const response = await banner.save();
      console.log('banner res = ', response);

      res.status(201).json({ message: 'Banner added successfully' });
  } catch (error) {
      console.error('Error while adding the banners:', error);
      res.status(500).json({ message: 'Banner adding failed. Please try again' });
  }
};


//edit banners
export const editBanner = async (req, res) => {
    try {
        console.log('edit ban = ', req.body)
        console.log('ban param = ', req.params)

        const { id } = req.params; 
        const { image, bannerLocation } = req.body; 
    
        if (!id || !image) {
          console.log('some thing is missing here')
          return res.status(400).json({ message: "Banner ID, location and order is required." });
        }

    
        const updatedBanner = await bannerModel.findByIdAndUpdate(
          id,
          { image: image },
          { new: true }
        );
    
        if (!updatedBanner) {
          return res.status(404).json({ message: "Banner not found." });
        }

        console.log('update banner = ', updatedBanner)
    
        res.status(200).json({ message: "Banner image updated successfully." });
      } catch (error) {
        console.error("Error while editing the banner image:", error);
        res.status(500).json({ message: "Failed to update the banner image. Please try again." });
      }
}



