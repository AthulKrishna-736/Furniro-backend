import userModel from "../models/userModel.js";

export const adminAuth = async (req, res, next) => {
    try {
        const email = req.params.emailInt || req.query.email || req.params.email;

        const user = await userModel.findOne({ email });
        if (!user) {
            return next({ statusCode: 404, message: "Admin not found" });
        }
        // if (user.role !== "admin") {
        //     return next({ statusCode: 403, message: "User does not have admin privileges" });
        // }

        next();
    } catch (error) {
        console.error("Error in adminAuth middleware:", error);
        next({ statusCode: 500, message: "Internal server error" });
    }
};
