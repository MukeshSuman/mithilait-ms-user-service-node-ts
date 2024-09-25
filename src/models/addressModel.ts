import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
    userId: mongoose.Types.ObjectId;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
}

const AddressSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

export const UserAddress = mongoose.model<IAddress>('Address', AddressSchema);