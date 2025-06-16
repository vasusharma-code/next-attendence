import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'coordinator' | 'volunteer' | 'team-leader' | 'team-member';
  isVerified: boolean;
  isApproved: boolean;
  qrCode: string;
  departmentId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  coordinatorId?: mongoose.Types.ObjectId;
  teamLeaderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'coordinator', 'volunteer', 'team-leader', 'team-member'],
    default: 'volunteer'
  },
  isVerified: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: function() {
    return this.role !== 'team-leader';
  }},
  qrCode: { type: String, required: true, unique: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  coordinatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  teamLeaderId: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

UserSchema.index({ email: 1, phone: 1 });
UserSchema.index({ role: 1, isApproved: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);