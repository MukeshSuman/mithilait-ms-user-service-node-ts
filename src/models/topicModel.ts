import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
    title: string;
    description?: string;
    type: 'Speaking' | 'Reading' | 'Writing' | 'Listening' | 'Typing';
    // topic: string;
    duration?: number;
    class?: number;
    isPractice?: boolean;
    isActive?: boolean;
    isDeleted?: boolean;
    schoolId?: mongoose.Types.ObjectId;
    createdById?: mongoose.Types.ObjectId;
    updatedById?: mongoose.Types.ObjectId;
}
//'Speaking', 'Reading', 'Writing'
const topicSchema = new Schema<ITopic>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['Speaking', 'Reading', 'Writing', 'Listening', 'Typing'], default:"Reading" },
    // topic: { type: String, required: true },
    duration: { type: Number, required: false },
    class: {
        type: Number,
        required: false,
        min: 1, // Minimum value 1
        max: 12, // Maximum value 12
        validate: {
            validator: Number.isInteger, // Ensures it's an integer
            message: '{VALUE} is not an integer value'
        }
    },
    isPractice: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    schoolId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdById: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User' },
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

topicSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);