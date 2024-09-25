import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export enum UserRole {
    Admin = 'admin',
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
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
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