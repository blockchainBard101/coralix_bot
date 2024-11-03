import { User } from '../models/user.model';
import { connectDB } from '.././database';
import { generateNewWallet, getWalletAddress } from '../sui/client';
import { encryptKeyphrase, decryptKeyphrase } from '../encryption';
import dotenv from 'dotenv';

dotenv.config();

// Check if the user exists in the database
export const checkUserExists = async (telegramId: number) => {
    try {
        const user = await User.findOne({ telegramId });
        return user;
    } catch (error) {
        console.error('Error checking user existence:', error);
        throw error;
    }
};

// Create a new user with encrypted secret phrase
export const createUser = async (telegramId: number) => {
    try {
        const newUser = new User({
            telegramId,
        });
        await newUser.save();
        return newUser;
    } catch (error) {
        console.error('Error creating new user:', error);
        throw error;
    }
};

export const checkConnectedWallet = async (telegramId: number) => {
    try {
        const user = await User.findOne({ telegramId });
        return user?.walletAddress;
    } catch (error) {
        console.error('Error checking user existence:', error);
        throw error;
    }
};

export const connectWallet = async (telegramId: number, phrase: string) => {
    try {
        const user = await User.findOne({ telegramId });
        if (user) {
            const password = process.env.PASSWORD;
            const encryptedPhrase = encryptKeyphrase(phrase, password as string);
            const walletAddress = await getWalletAddress(phrase);
        
            user.secretPhrase = encryptedPhrase;
            user.walletAddress = walletAddress;
            await user.save();
            return walletAddress;
        }
    } catch (error) {
        return null;
    }
}

export const createNewWallet = async (telegramId: number) => {
    try {
        const { newPhrase, walletAddress } = await generateNewWallet();
        const password = process.env.PASSWORD;
        const encryptedPhrase = encryptKeyphrase(newPhrase, password as string);
        const user = await User.findOne({ telegramId });
        if (user) {
            user.secretPhrase = encryptedPhrase;
            user.walletAddress = walletAddress;
            await user.save();
            return walletAddress;
        }
    } catch (error) {
        console.error('Error creating new wallet:', error);
        throw error;
    }
}

export const getUserWalletAddress = async (userId: number) => {
    try {
        const user = await User.findOne({ userId });
        const walletAddress = user?.walletAddress;
        return walletAddress;
    } catch (error) {
        console.error('Error getting wallet address:', error);
        throw error;
    }
}

export const getUserSecretPhrase = async (userId: number) => {
    try {
        const user = await User.findOne({ telegramId: userId });
        const secretPhrase = user?.secretPhrase;
        const decryptedPhrase = decryptKeyphrase(secretPhrase as string, process.env.PASSWORD as string);
        return decryptedPhrase
    } catch (error) {
        console.error('Error getting secret phrase:', error);
        return null
    }
}

// connectDB();
// await getUserSecretPhrase(7010393620)