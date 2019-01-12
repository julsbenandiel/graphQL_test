import mongoose from 'mongoose';
import { Schema } from 'mongoose'

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        require: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

export default mongoose.model('Event', eventSchema);
