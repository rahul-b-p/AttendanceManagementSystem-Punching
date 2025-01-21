import mongoose, { Schema } from "mongoose";
import { IAttendance } from "../interfaces";



const attendanceSchema = new Schema<IAttendance>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    punchIn: {
        type: Date,
        required: true,
        unique: true,
        default: () => new Date()
    },
    punchOut: {
        type: Date
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


const Attendance = mongoose.model<IAttendance>('attendances', attendanceSchema);

export default Attendance;