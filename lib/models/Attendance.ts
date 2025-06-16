import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  markedBy: mongoose.Types.ObjectId;
  role: string;
  departmentId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  timestamp: Date;
  date: string; // YYYY-MM-DD format for easy querying
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: true }, // YYYY-MM-DD
  location: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance on same date
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ markedBy: 1, timestamp: -1 });
AttendanceSchema.index({ departmentId: 1, date: 1 });
AttendanceSchema.index({ teamId: 1, date: 1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);