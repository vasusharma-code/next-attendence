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
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  coordinatorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  volunteerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Update the unique index to include both name and isActive
DepartmentSchema.index({ name: 1, isActive: 1 }, { unique: true });

// Use this pattern to handle model compilation
const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export default Department;