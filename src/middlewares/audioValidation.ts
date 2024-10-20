import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "src/utils/apiResponse";
import fs from "fs";
import path from "path";
import { UserRole } from "src/models/userModel";


// Create a multer storage that dynamically creates folder based on a request-provided path
const storageForExamFile = multer.diskStorage({
    destination: (req: Request, file, cb) => {
      // Extract folder path from request body or query
      let folderPath = "exam/default";

      if(req.user){
        const currUser = req.user;
        if(currUser.role === UserRole.School){
            folderPath = 'exam/' + currUser.id
        }
        if(currUser.role === UserRole.Student || currUser.role === UserRole.Teacher){
            folderPath = 'exam/' + currUser.schoolId ? currUser.schoolId : 'default'
        }
          
      }
  
      const uploadDir = path.join(__dirname, "../../uploads", folderPath);  // Create the full path
  
      // Check if directory exists, if not, create it
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });  // Create the directory recursively
      }
  
      cb(null, uploadDir);  // Set the destination folder
    },
    
    filename: (req: Request, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;  // Use timestamp and original file name
      cb(null, fileName);
    },
  });

// Define the allowed file type for wav audio files
const allowedType = "audio/wav";

// Create the multer instance with reusable validation for wav audio files
export const audioUpload = multer({
    storage: storageForExamFile,
  // dest: "uploads/audio/",  // Destination for uploaded files
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit (adjust as needed)
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    // Check if the file is a .wav file
    if (file.mimetype !== allowedType) {
      return cb(new Error("Only .wav audio files are allowed"));
    }
    cb(null, true);
  },
});

// Middleware to handle multer errors (e.g., file size, file type validation)
export const audioValidationErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json(new ApiResponse(400, false, err.message ? err.message : err, null, err.message))//{ success: false, message: err.message });
  }
  next();
};
