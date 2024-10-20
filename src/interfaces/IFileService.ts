import { IUser } from 'src/models/userModel';
import { IFile } from '../models/fileModel';
import { IBaseService } from './IBaseService';

export interface IFileService extends IBaseService<IFile> {
    saveFile(file: Express.Multer.File, currUser?: IUser): Promise<IFile>
}
