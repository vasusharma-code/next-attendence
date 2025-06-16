import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  coordinatorIds: mongoose.Types.ObjectId[];
  volunteerIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  coordinatorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  volunteerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ isActive: 1 });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);