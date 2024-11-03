import { Bot } from '../models/user.model';

export const createNewBotButtons = async (telegramId: number) => {
    try {
        const bot = new Bot({ telegramId, });
        await bot.save();
    } catch (error) {
        console.error('Error creating new bot:', error);
    }
}

export const setOldButton = async (telegramId: number, buttonName: string, chatId: number, messageId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            bot.oldButtonName = buttonName;
            bot.oldButton = { chatId, messageId };
            await bot.save();
        }
    } catch (error) {
        console.error('Error setting old button:', error);
    }
}

export const getOldButtons = async (telegramId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            return {
                oldButtonName: bot.oldButtonName,
                oldButton: bot.oldButton};
        }
        return null;
    } catch (error) {
        console.error('Error getting old buttons:', error);
        return null;
    }
}

export const clearOldButton = async (telegramId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            bot.oldButton = null;
            await bot.save();
        }
    } catch (error) {
        console.error('Error clearing old buttons:', error);
    }
}

export const setOldButtonName = async (telegramId: number, buttonName: string) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            bot.oldButtonName = buttonName;
            await bot.save();
        }
    } catch (error) {
        console.error('Error setting old button name:', error);
    }
}

export const setOldCa = async (telegramId: number, ca) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            bot.oldCA = ca;
            await bot.save();
        }
    } catch (error) {
        console.error('Error setting old ca:', error);
    }
}

export const getOldCa = async (telegramId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            return bot.oldCA;
        }
        return null;
    } catch (error) {
        console.error('Error getting old ca:', error);
        return null;
    }
}

export const saveLastBtn4UserInp = async (telegramId: number, message : string) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            bot.lastBtn = message;
            await bot.save();
        }
    } catch (error) {
        console.error('Error saving last message:', error);
    }
}

export const getLastBtn4UserInp = async (telegramId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            return bot.lastBtn;
        }
        return null;
    } catch (error) {
        console.error('Error getting last message:', error);
        return null;
    }
}

export const addToCas = async (telegramId: number, ca: string, uid, chatId: number, messageId: number) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        let removedCa = null; // Variable to store the removed item

        if (bot) {
            if (bot.oldCAs.length >= 5) {
                removedCa = bot.oldCAs.shift(); // Store the removed item
            }
            bot.oldCAs.push({ ca, uid, chatId, messageId });
            await bot.save();
        }

        return removedCa; // Return the removed item
    } catch (error) {
        console.error('Error adding ca:', error);
    }
}

export const checkIfCaExists = async (telegramId: number, ca: string) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            for (let i = 0; i < bot.oldCAs.length; i++) {
                if (bot.oldCAs[i].ca === ca) {
                    return bot.oldCAs[i].uid;
                }
            }
            return null;
        }
        return null;
    } catch (error) {
        console.error('Error checking ca existence:', error);
        return null;
    }
}

export const getCaFromUid = async (telegramId: number, uid: string) => {
    try {
        const bot = await Bot.findOne({ telegramId });
        if (bot) {
            for (let i = 0; i < bot.oldCAs.length; i++) {
                if (bot.oldCAs[i].uid === uid) {
                    return bot.oldCAs[i];
                }
            }
            return null;
        }
        return null;
    } catch (error) {
        console.error('Error getting ca from uid:', error);
        return null;
    }
}

// export const getOldCas = async (telegramId: number) => {
//     try {
//         const bot = await Bot.findOne({ telegramId });
//         if (bot) {
//             return bot.oldCAs;
//         }
//         return null;
//     } catch (error) {
//         console.error('Error getting old cas:', error);
//         return null;
//     }
// }