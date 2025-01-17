import mongoose, { Schema } from "mongoose";
import { IOffice } from "../interfaces";





const officeSchema = new Schema<IOffice>({
    name: {
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
        longtitude: {
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
            type: mongoose.Schema.Types.ObjectId
        }
    ],
    employees: [
        {
            type: mongoose.Schema.Types.ObjectId
        }
    ]
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
})


const Office = mongoose.model<IOffice>('offices', officeSchema);

export default Office;