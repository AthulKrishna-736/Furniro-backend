import categoryModel from "../../../models/categorySchema.js";


//add category
export const addCategory = async (req, res) => {
    const { name, description } = req.body;
    const lowerCaseName = name.toLowerCase();
    try {

        const existingCategory = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${lowerCaseName}$`, "i") } // Case-insensitive search
        });

        if (existingCategory) {
            console.log('Category name already exists, cannot add');
            return res.status(400).json({ message: 'Category name already exists' });
        }
        
        const newCategory = new categoryModel({ name, description })

        const response = await newCategory.save();
        console.log('category added successfully', response)

        return res.status(201).json({ message:'Category added successfully.',category: newCategory })
        
    } catch (error) {
        console.log('cat error = ', error.message)
        res.status(500).json({ message: 'Error adding category', error: error.message });
    }
}


//block category
export const blockCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await categoryModel.findById(id);

        if(!category){
            return res.status(404).json({ message:'Category not found' })
        }

        category.isBlocked = !category.isBlocked
        const response = await category.save();
        console.log('res for block cat = ', response)
        res.status(200).json({ message:`Category ${category.isBlocked ? "blocked" : "unblocked"} successfully`, isBlocked:category.isBlocked })

    } catch (error) {
        res.status(500).json({ message: "Failed to update category status", error: error.message });
    }
}


//get all categories
export const getCategory = async (req, res) => {
    try {
        const response = await categoryModel.find();
        return res.status(200).json({ message:'categories fetched successfully', categories: response })
    } catch (error) {
        console.log('error while fetching categories: ', error)
        return res.status(500).json({ message:'An error occured while fetching categories. Please try again later.', error: error.message })
    }
}


//update categories
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const category = await categoryModel.findById(id);

        if(!category){
            return res.status(404).json({ message:'Category not found' })
        }

        if(name){
            const lowerCaseName = name.toLowerCase();
            const existingCategory = await categoryModel.findOne({ name: { $regex: new RegExp(`^${lowerCaseName}$`, "i") }, _id:{ $ne: id } })
            if(existingCategory){
                console.log(' cant updatae the category already exist')
                return res.status(400).json({ message:'Category name already exists, cannot update' })
            }
        }

        if (category.name === name && category.description === description) {
            console.log('no changes for the detials in edit cat');
            return res.status(400).json({ message: "No changes detected" });
        }

        category.name = name || category.name;
        category.description = description || category.description;

        const updatedCategory = await category.save();
        console.log('updated cat = ',updatedCategory)

        return res.status(200).json({ message:'Category updated successfully', category: updatedCategory })

    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ message: "Server error while updating category" });
    }
}
