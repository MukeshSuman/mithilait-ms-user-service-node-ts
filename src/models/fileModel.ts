import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedById: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    description?: string;
    isActive?: boolean;
    isDeleted?: boolean;
}

const fileSchema = new Schema<IFile>(
    {
        fileName: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        uploadedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        schoolId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        description: { type: String },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,  // Automatically manages createdAt and updatedAt fields
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                delete ret.__v;
                delete ret.isDeleted;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                delete ret.__v;
                delete ret.isDeleted;
                return ret;
            }
        }
    }
);

export const File = mongoose.model<IFile>('File', fileSchema);
