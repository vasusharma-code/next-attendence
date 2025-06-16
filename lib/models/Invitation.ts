import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  userId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate invitations
InvitationSchema.index({ userId: 1, departmentId: 1, status: 1 });

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
