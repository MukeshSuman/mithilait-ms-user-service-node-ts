import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { number } from "joi";

export enum UserRole {
    Admin = 'admin',
    School = 'school',
    Teacher = 'teacher',
    Student = 'student',
    Guest = 'guest',
}

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female' | 'Other' | '';
    bio?: string;
    profilePictureUrl?: string;
    websiteUrl?: string;
    phoneNumber?: string;
    role: UserRole;
    status: 'Active' | 'Inactive' | 'Suspended';
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    registrationDate: Date;
    lastLoginDate?: Date;
    ipAddress?: string;
    userAgent?: string;
    loginAttempts: number;
    lastPasswordChange?: Date;
    isDeleted: boolean;
    isActive: boolean;
    schoolId?: mongoose.Types.ObjectId;
    subscriptionStatus: 'Free' | 'Basic' | 'Premium';
    subscriptionExpiryDate?: Date;
    createdById?: mongoose.Types.ObjectId;
    updatedById?: mongoose.Types.ObjectId;
    comparePassword(candidatePassword: string): Promise<boolean>;
    rollNumber?: number;
    section?: string;
    class?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    assessmentYear?: number;
}

const userSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
        bio: String,
        profilePictureUrl: String,
        websiteUrl: String,
        phoneNumber: String,
        role: { type: String, enum: Object.values(UserRole), default: UserRole.Guest },
        status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
        emailVerified: { type: Boolean, default: false },
        twoFactorEnabled: { type: Boolean, default: false },
        registrationDate: { type: Date, default: Date.now },
        lastLoginDate: Date,
        ipAddress: String,
        userAgent: String,
        loginAttempts: { type: Number, default: 0 },
        lastPasswordChange: Date,
        rollNumber: { type: Number, default: 0 },
        section: {
            type: String,
            enum: [
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
            ],
            message: '{VALUE} is not a valid section'
        },
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
        assessmentYear: {
            type: Number,
            required: false,
            min: 2019, // Minimum value 2019
            max: 2030, // Maximum value 2030
            validate: {
                validator: Number.isInteger, // Ensures it's an integer
                message: '{VALUE} is not an integer value'
            },
            default: new Date().getFullYear()
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        schoolId: { type: Schema.Types.ObjectId, ref: 'User' },
        subscriptionStatus: { type: String, enum: ['Free', 'Basic', 'Premium'], default: 'Free' },
        subscriptionExpiryDate: Date,
        createdById: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedById: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                ret.name = `${ret.firstName || ''} ${ret.lastName}`.trim();
                delete ret.__v;
                delete ret.password;
                delete ret.isDeleted;

                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                ret.name = `${ret.firstName || ''} ${ret.lastName}`.trim();
                delete ret.__v;
                delete ret.password;
                delete ret.isDeleted;
                return ret;
            }
        }
    }
);

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);