import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

import { startButtons, startButtonsNew } from './buttons/Buttons';
import { checkUserExists, createUser } from './handlers/user';

import { generateNewSecretPhrase } from './sui/client';
import { encryptPhrase } from './encryption';
import { findButtonNameById } from './helper';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error('Telegram bot token is missing in the .env file');
}

const bot = new TelegramBot(token, { polling: true });

let oldButtonName = "None";

const buttons = {
    "Start": { id: 1, func: startButtons },
    "Start New": { id: 1, func: startButtonsNew },
};

interface MessageInfo {
    chatId: number;
    messageId: number;
}

let oldButton: MessageInfo | null = null;

const handlesButton = async (userId: number, chatId: number, bot: TelegramBot, button_name: string) => {
    if (button_name === 'Back') {
        if (oldButtonName !== "None") {
            buttons[oldButtonName].func(chatId, bot).then((sentMessage) => {
                if (oldButtonName === "Start") {
                    oldButtonName = "Start";
                    oldButton = { chatId, messageId: sentMessage.message_id };
                } else {
                    const id = buttons[oldButtonName].id;
                    const buttoname = findButtonNameById(id - 1, buttons);
                    if (buttoname) {
                        oldButtonName = buttoname;
                    }

                }
            });
        }

    } else if (button_name == 'Start') {
        const user = await checkUserExists(userId);
        if (user) {
            buttons["Start"].func(chatId, bot).then((sentMessage) => {
                oldButtonName = "Start";
                oldButton = { chatId, messageId: sentMessage.message_id };
            });
        }
        else {
            buttons["Start New"].func(chatId, bot).then((sentMessage) => {
                oldButtonName = "Start";
                oldButton = { chatId, messageId: sentMessage.message_id };
            });
        }
    } else if (button_name == 'CREATE_WALLET') {
        const { newPhrase, walletAddress } = generateNewSecretPhrase();
        const encryptedPhrase = encryptPhrase(newPhrase)
        await createUser(userId, encryptedPhrase);
        bot.sendMessage(chatId, `New Wallet created \nWallet Address: ${walletAddress}`);
        buttons["Start"].func(chatId, bot).then((sentMessage) => {
            oldButtonName = "Start";
            oldButton = { chatId, messageId: sentMessage.message_id };
        });
    } else if (button_name == 'IMPORT_WALLET') {
        bot.sendMessage(chatId, 'Please send your existing 12 words secret phrase.');
        bot.once('message', async (phraseMessage) => {
            const words = phraseMessage.text.split(' ');
            if (words.length === 12) {
                const existingPhrase = phraseMessage.text;
                const encryptedPhrase = encryptPhrase(existingPhrase);
                await createUser(userId, encryptedPhrase);
                bot.sendMessage(chatId, `wallet imported.`);
                buttons["Start"].func(chatId, bot).then((sentMessage) => {
                    oldButtonName = "Start";
                    oldButton = { chatId, messageId: sentMessage.message_id };
                });
            }
            else {
                bot.sendMessage(chatId, 'Please send your existing 12 words secret phrase.');
                buttons["Start New"].func(chatId, bot).then((sentMessage) => {
                    oldButtonName = "Start";
                    oldButton = { chatId, messageId: sentMessage.message_id };
                });
            }

        });
    }

}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    handlesButton(userId, chatId, bot, 'Start');
});

bot.on('callback_query', (callbackQuery) => {
    // console.log(callbackQuery)
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const userId = callbackQuery.from?.id;


    if (message && data) {
        const chatId = message.chat.id;
        if (oldButton && oldButton.messageId) {
            bot.deleteMessage(oldButton.chatId, oldButton.messageId.toString()).then(() => {
                oldButton = null; // Reset after deletion
            })
            handlesButton(userId, chatId, bot, data);
        }

        else {
            console.log(data)
            handlesButton(userId, chatId, bot, data);
        }
    }
});
