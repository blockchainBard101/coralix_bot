import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    secretPhrase: { type: String},
    walletAddress: { type: String },
});

const BotSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    lastBtn: { type: String, default: "None" },
    oldButtonName: { type: String, default: "None" },
    oldButton: { type: Object, default: null },
    oldCA: { type: Object, default: null },
    oldCAs : { type: Array, default: [] },
})

export const User = mongoose.model('users', UserSchema);
export const Bot = mongoose.model('bots', BotSchema);
