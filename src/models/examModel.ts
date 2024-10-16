import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
    title: string;
    type: string;
    topic: string;
    duration: number;
    class: number;
    description?: string;
    section?: string;
    isPractice?: boolean;
    isActive?: boolean;
    isDeleted?: boolean;
    schoolId?: mongoose.Types.ObjectId;
    createdById?: mongoose.Types.ObjectId;
    updatedById?: mongoose.Types.ObjectId;
}
//'Speaking', 'Reading', 'Writing'
const examSchema = new Schema<IExam>({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true, enum: ['Speaking', 'Reading', 'Writing', 'Listening', 'Typing'] },
    topic: { type: String, required: true },
    duration: { type: Number, required: true },
    class: {
        type: Number,
        required: true,
        min: 1, // Minimum value 1
        max: 12, // Maximum value 12
        validate: {
            validator: Number.isInteger, // Ensures it's an integer
            message: '{VALUE} is not an integer value'
        }
    },
    section: {
        type: String,
        enum: [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
        ],
        message: '{VALUE} is not a valid section'
    },
    isPractice: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    schoolId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdById: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
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
});

examSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export const Exam = mongoose.model<IExam>('Exam', examSchema);