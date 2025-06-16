import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  qrCode?: string;
  isApproved: boolean;
  departmentId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  qrCode: String,
  isApproved: { type: Boolean, default: false },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
}, {
  timestamps: true
});

// Ensure model is registered only once
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;