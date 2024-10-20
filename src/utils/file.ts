import path from "path";

export const getFileInfo = (file: Express.Multer.File) => {

    if(!file){
        throw Error("File not found", {
            cause: "May be file not upload"
        })
    }

    const relativePath = path.relative(__dirname, file.path).replaceAll('../', '') ;

    return {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: relativePath || file.path,
        fullPath: file.path
    }
}