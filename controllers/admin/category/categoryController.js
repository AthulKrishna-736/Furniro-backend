import categoryModel from "../../../models/categorySchema.js";

// Add category
export const addCategory = async (req, res, next) => {
    const { name, description } = req.body;
    const lowerCaseName = name.toLowerCase();

    // Check for existing category with case-insensitive search
    const existingCategory = await categoryModel.findOne({
        name: { $regex: new RegExp(`^${lowerCaseName}$`, "i") }
    }).catch((error) => {
        console.error('Error checking category existence:', error.message);
        return next({ statusCode: 500, message: 'Error adding category', error: error.message });
    });

    if (existingCategory) {
        return next({ statusCode: 400, message: 'Category name already exists' });
    }

    const newCategory = new categoryModel({ name, description });

    await newCategory.save().catch((error) => {
        console.error('Error saving new category:', error.message);
        return next({ statusCode: 500, message: 'Error saving category', error: error.message });
    });

    res.status(201).json({ message: 'Category added successfully.', category: newCategory });
};

// Block or unblock category
export const blockCategory = async (req, res, next) => {
    const { id } = req.params;

    const category = await categoryModel.findById(id).catch((error) => {
        console.error('Error finding category:', error.message);
        return next({ statusCode: 500, message: 'Failed to update category status', error: error.message });
    });

    if (!category) {
        return next({ statusCode: 404, message: 'Category not found' });
    }

    category.isBlocked = !category.isBlocked;

    await category.save().catch((error) => {
        console.error('Error saving category status:', error.message);
        return next({ statusCode: 500, message: 'Failed to update category status', error: error.message });
    });

    res.status(200).json({
        message: `Category ${category.isBlocked ? "blocked" : "unblocked"} successfully`,
        isBlocked: category.isBlocked
    });
};

// Get all categories
export const getCategory = async (req, res, next) => {
    const categories = await categoryModel.find().catch((error) => {
        console.error('Error fetching categories:', error.message);
        return next({ statusCode: 500, message: 'Failed to fetch categories', error: error.message });
    });

    res.status(200).json({ message: 'Categories fetched successfully', categories });
};

// Update category
export const updateCategory = async (req, res, next) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await categoryModel.findById(id).catch((error) => {
        console.error('Error finding category:', error.message);
        return next({ statusCode: 500, message: 'Failed to update category', error: error.message });
    });

    if (!category) {
        return next({ statusCode: 404, message: 'Category not found' });
    }

    if (name) {
        const lowerCaseName = name.toLowerCase();
        const existingCategory = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${lowerCaseName}$`, "i") },
            _id: { $ne: id }
        }).catch((error) => {
            console.error('Error checking category name:', error.message);
            return next({ statusCode: 500, message: 'Error checking category name', error: error.message });
        });

        if (existingCategory) {
            return next({ statusCode: 400, message: 'Category name already exists, cannot update' });
        }
    }

    if (category.name === name && category.description === description) {
        return next({ statusCode: 400, message: 'No changes detected' });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    const updatedCategory = await category.save().catch((error) => {
        console.error('Error saving updated category:', error.message);
        return next({ statusCode: 500, message: 'Failed to update category', error: error.message });
    });

    res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
};
