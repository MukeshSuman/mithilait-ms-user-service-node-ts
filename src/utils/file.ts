// fileName: string;
//     fileType: string;
//     fileSize: number;
//     fileUrl: string;

export const getFileInfo = (file: Express.Multer.File) => {

    if(!file){
        throw Error("File not found", {
            cause: "May be file not upload"
        })
    }

    return {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: file.path
    }
}