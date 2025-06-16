import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  leaderId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  joinCode: string; // Add this line
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  joinCode: { type: String, unique: true, required: true }, // Add this line
}, {
  timestamps: true
});

TeamSchema.index({ leaderId: 1 });
TeamSchema.index({ isActive: 1 });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);