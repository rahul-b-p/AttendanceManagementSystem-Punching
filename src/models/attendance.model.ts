import mongoose, { Schema } from "mongoose";
import { IAttendance } from "../interfaces";
import { getTimeStamp } from "../utils";



const attendanceSchema = new Schema<IAttendance>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    punchIn: {
        type: String,
        required: true,
        default: () => getTimeStamp()
    },
    punchOut: {
        type: String
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    officeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'offices',
        required: true
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

attendanceSchema.index({ userId: 1, punchIn: 1 }, { unique: true });

const Attendance = mongoose.model<IAttendance>('attendances', attendanceSchema);

export default Attendance;