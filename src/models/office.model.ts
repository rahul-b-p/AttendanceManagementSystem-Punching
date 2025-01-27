import mongoose, { Schema } from "mongoose";
import { IOffice } from "../interfaces";
import { convertToISOString } from "../utils";





const officeSchema = new Schema<IOffice>({
    officeName: {
        type: String,
        required: true
    },
    adress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zip_code: {
            type: String,
            required: true
        }
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
    radius: {
        type: Number,
        required: true
    },
    managers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    ],
    employees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
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

officeSchema.pre('save', function (next) {
    this.createdAt = convertToISOString(this.createdAt);
        this.updatedAt = convertToISOString(this.updatedAt);
    next();
});

officeSchema.index({ 'location.latitude': 1, 'location.longitude': 1, 'isDeleted': 1 }, { unique: true });


const Office = mongoose.model<IOffice>('offices', officeSchema);

export default Office;