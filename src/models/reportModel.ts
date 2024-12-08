import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  schoolId: mongoose.Types.ObjectId; // Reference to the User (School)
  examId: mongoose.Types.ObjectId; // Reference to the Exam
  studentId: mongoose.Types.ObjectId; // Reference to the User (Student)
  fileId?: mongoose.Types.ObjectId; // Reference to the File
  status:
    | 'Start'
    | 'Pending'
    | 'InProgress'
    | 'Completed'
    | 'Error'
    | 'Processing';
  score?: number;
  remarks?: string;
  apiResponse?: Record<string, any>;
  result?: Record<string, any>;
  isDeleted?: boolean;
  reason: string;
  takenCount?: number;
  oldInfo: Array<{
    fileId?: mongoose.Types.ObjectId;
    apiResponse?: Record<string, any>;
    result?: Record<string, any>;
  }>;
}

const reportSchema = new Schema<IReport>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: Schema.Types.ObjectId, ref: 'File' },
    status: {
      type: String,
      enum: [
        'Start',
        'Pending',
        'InProgress',
        'Completed',
        'Error',
        'Processing',
      ],
      default: 'InProgress',
    },
    score: { type: Number },
    remarks: { type: String },
    apiResponse: { type: Object },
    result: { type: Object },
    isDeleted: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    oldInfo: [
      {
        fileId: { type: Schema.Types.ObjectId, ref: 'File' },
        apiResponse: { type: Object },
        result: { type: Object },
      },
    ],
    takenCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        // delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        // delete ret.__v;
        return ret;
      },
    },
  }
);

export const Report = mongoose.model<IReport>('Report', reportSchema);
