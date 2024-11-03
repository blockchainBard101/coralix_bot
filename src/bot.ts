import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { setOldButton, getOldButtons, clearOldButton, setOldButtonName, createNewBotButtons, saveLastBtn4UserInp, getLastBtn4UserInp, checkIfCaExists, addToCas, getCaFromUid } from './handlers/bots';
import { startButtons, startButtonsNew, homeButtons, tradeButtons, buyButtons, sellButtons, refreshBuyButtons, refreshSellButtons } from './buttons/Buttons';
import { checkUserExists, createUser, checkConnectedWallet, createNewWallet, connectWallet, getUserWalletAddress, getUserSecretPhrase } from './handlers/user';
import { findButtonNameById } from './helper';
import { getTokenDetails, getSuiBalance, getTokenPriceSui, getCoinBalance } from './utils/getTokenDetails';
import { connectDB } from './database';
import { buyTokenSui, sellTokenSui } from './sui/aggregator';
import { getUserTokenDetails } from './utils/getCoinDetails';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error('Telegram bot token is missing in the .env file');
}

const bot = new TelegramBot(token, { polling: true });

connectDB();

const buttons = {
    "Start": { id: 1, func: startButtons },
    "Start New": { id: 1, func: startButtonsNew },
    "HOME-BUTTON": { id: 2, func: homeButtons },
    "TRADE-BUTTON": { id: 3, func: tradeButtons },
};

const userCache = new Map<number, any>();
const walletCache = new Map<number, string>();

const getUserWallet = async (userId: number) => {
    if (walletCache.has(userId)) {
        return walletCache.get(userId);
    }
    const wallet = await checkConnectedWallet(userId);
    if (wallet) {
        walletCache.set(userId, wallet);
        return wallet;
    }
};

const handleNewUser = async (userId) => {
    const user = await checkUserExists(userId);
    if (!user) {
        await createUser(userId);
        await createNewBotButtons(userId);
    }
}

const deleteOldButton = async (userId: number, chatId: number, oldButton: any) => {
    if (oldButton?.messageId) {
        await bot.deleteMessage(chatId, oldButton.messageId.toString());
        await clearOldButton(userId);
    }
};

const handleStartButton = async (chatId: number, userId: number, walletAddress: string, suiBalance: string) => {
    await handleNewUser(userId);
    const wallet = await getUserWallet(userId);
    const buttonToShow = wallet ? "Start" : "Start New";
    const oldButtons = await getOldButtons(userId);

    await deleteOldButton(userId, chatId, oldButtons?.oldButton);

    buttons[buttonToShow].func(chatId, bot, walletAddress, suiBalance).then(async (sentMessage) => {
        await setOldButton(chatId, "Start", chatId, sentMessage.message_id);
    });
};

// Function to handle Home button logic
const handleHomeButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress: string, suiBalance: string) => {
    const oldButtons = await getOldButtons(userId);

    await deleteOldButton(userId, chatId, oldButtons?.oldButton);
    buttons["HOME-BUTTON"].func(chatId, bot, walletAddress, suiBalance).then(async (sentMessage) => {
        await setOldButton(chatId, "Start", chatId, sentMessage.message_id);
    });

}

const handleTradeButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress: string, suiBalance: string) => {
    const oldButtons = await getOldButtons(userId);
    await deleteOldButton(userId, chatId, oldButtons?.oldButton);
    buttons["TRADE-BUTTON"].func(chatId, bot, walletAddress, suiBalance).then(async (sentMessage) => {
        await setOldButton(chatId, "HOME-BUTTON", chatId, sentMessage.message_id);
    });
};


const createWallet = async (userId: number, chatId: number, bot: TelegramBot, suiBalance: string) => {
    const walletAddress = await createNewWallet(userId);
    if (walletAddress) {
        walletCache.set(userId, walletAddress);
        bot.sendMessage(chatId, `New Wallet created \nWallet Address: \`${walletAddress}\``, { parse_mode: 'Markdown' });
        handleStartButton(chatId, userId, walletAddress, suiBalance);
    }
};

const batchDeleteMessages = async (chatId: number, messageIds: string[]) => {
    const deletePromises = messageIds.map((messageId) => bot.deleteMessage(chatId, messageId));
    await Promise.all(deletePromises);
};

// Optimize wallet import logic
const handleImportWallet = async (userId: number, chatId: number, msg, bot: TelegramBot, suiBalance) => {
    const words = msg.text?.split(' ') || [];
    if (words.length === 12) {
        const walletAddress = await connectWallet(userId, msg.text);
        if (walletAddress) {
            const phraseMessageId = msg.message_id;
            await bot.sendMessage(chatId, `Wallet imported \nWallet Address: \`${walletAddress}\``, { parse_mode: 'Markdown' });
            setTimeout(() => {
                batchDeleteMessages(chatId, [phraseMessageId.toString()]);
            }, 5000);
            walletCache.set(userId, walletAddress);
            handleStartButton(chatId, userId, walletAddress, suiBalance);
        } else {
            await bot.sendMessage(chatId, 'Invalid secret phrase. Please try again.');
        }
    } else {
        await bot.sendMessage(chatId, 'Please Enter a valid 12-word secret phrase.');
    }
};

// Handle wallet import and validation
const importWallet = (chatId: number, bot: TelegramBot) => {
    // Send message to prompt the user to send their secret phrase
    bot.sendMessage(chatId, 'Please send your existing 12-word secret phrase.').then((sentMessage) => {
        const promptMessageId = sentMessage.message_id;
    });
};

const handleCa = async (userId: number, chatId: number, msg, bot: TelegramBot, walletAddress: string, lastBtn, suiBalance) => {
    if (lastBtn === "BUY-BUTTON") {
        const pattern = /^0x[a-fA-F0-9]{64}::\w+::\w+$/;
        const ca = msg.text;
        if (pattern.test(ca)) {
            const results = await getTokenDetails(ca, walletAddress);
            if (results === null) {
                bot.deleteMessage(chatId, msg.message_id).then(() => {
                }).catch((err) => {
                });
                bot.sendMessage(chatId, `Wrong CA. "Please input a valid Sui token address"`).then((sentMessage) => {
                    setTimeout(() => {
                        bot.deleteMessage(chatId, sentMessage.message_id);
                    }, 5000);
                    // buy(userId, chatId, bot, walletAddress, suiBalance);
                });
            } else {
                let uid = await checkIfCaExists(userId, ca);

                buyButtons(chatId, bot, results, results.args.token_symbol).then(async (sentMessage) => {
                    if (uid === null) {
                        const removedCa = await addToCas(userId, ca, results.args.token_symbol, chatId, sentMessage.message_id);
                        if (removedCa !== null && removedCa !== undefined) {
                            bot.deleteMessage(chatId, removedCa.messageId).then(() => {
                            }).catch((err) => {
                                console.log(err);
                            });
                        }
                    }
                    await saveLastBtn4UserInp(userId, "BUY-BUTTON");
                });
            }
        } else {
            bot.deleteMessage(chatId, msg.message_id).then(() => {
            }).catch((err) => {
            });
            bot.sendMessage(chatId, `Wrong CA. "Please input a valid Sui token address"`).then((sentMessage) => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, sentMessage.message_id);
                }, 5000);
                // buy(userId, chatId, bot, walletAddress, suiBalance);
            });
        }
    } else {
        const pattern = /^0x[a-fA-F0-9]{64}::\w+::\w+$/;
        const ca = msg.text;
        if (pattern.test(ca)) {
            const results = await getTokenDetails(ca, walletAddress);
            if (results === null) {
                bot.deleteMessage(chatId, msg.message_id).then(() => {
                }).catch((err) => {
                });
                bot.sendMessage(chatId, `Wrong CA. "Please input a valid Sui token address"`).then((sentMessage) => {
                    setTimeout(() => {
                        bot.deleteMessage(chatId, sentMessage.message_id);
                    }, 5000);
                    // buy(userId, chatId, bot, walletAddress, suiBalance);
                });
            } else {
                let uid = await checkIfCaExists(userId, ca);
                buyButtons(chatId, bot, results, uid ?? results.args.token_symbol).then(async (sentMessage) => {
                    if (uid === null) {
                        const removedCa = await addToCas(userId, ca, results.args.token_symbol, chatId, sentMessage.message_id);
                        if (removedCa !== null && removedCa !== undefined) {
                            bot.deleteMessage(chatId, removedCa.messageId).then(() => {
                            }).catch((err) => {
                                console.log(err);
                            });
                        }
                    }
                    await saveLastBtn4UserInp(userId, "BUY-BUTTON");
                });
            }
        }
    }
}

const buy = (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    bot.sendMessage(chatId, 'Paste the CA of the Token you want to buy');
}

const handleBack = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    const oldButtons = await getOldButtons(userId);
    const oldButtonName = oldButtons?.oldButtonName;

    if (oldButtonName !== "None") {
        await deleteOldButton(userId, chatId, oldButtons?.oldButton);
        if (oldButtonName !== undefined && oldButtonName !== "None") {
            buttons[oldButtonName]?.func(chatId, bot, walletAddress, suiBalance).then(async (sentMessage) => {
                const prevButton = findButtonNameById(buttons[oldButtonName].id - 1, buttons);
                if (prevButton) setOldButtonName(userId, prevButton);
                await setOldButton(chatId, oldButtonName, chatId, sentMessage.message_id);
            });
        }
    }
}

const handleBuyButtonRefresh = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, ca) => {
    const results = await getTokenDetails(ca.ca, walletAddress);
    refreshBuyButtons(ca.chatId, ca.messageId, bot, results, ca.uid).then(async (sentMessage) => {
    }).catch((err) => { })
}

const handleSellButtonRefresh = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, ca) => {
    const results = await getTokenDetails(ca.ca, walletAddress);
    refreshSellButtons(ca.chatId, ca.messageId, bot, results, ca.uid).then(async (sentMessage) => {
    }).catch((err) => { })
}

const handleSwitchtoSell = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, ca) => {
    const results = await getTokenDetails(ca.ca, walletAddress);
    refreshSellButtons(ca.chatId, ca.messageId, bot, results, ca.uid).then(async (sentMessage) => {
    }).catch((err) => { })
}

const handleSwitchtoBuy = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, ca) => {
    const results = await getTokenDetails(ca.ca, walletAddress);
    refreshBuyButtons(ca.chatId, ca.messageId, bot, results, ca.uid).then(async (sentMessage) => {
    }).catch((err) => { })
}

const handleBuyXsuiButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    bot.sendMessage(chatId, 'Please input the amount of Sui you want to buy');
}

const handleSellXTokenPercentButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    bot.sendMessage(chatId, 'Please input the percentage of Sui you want to sell, e.g. 100 for 100%, 50 for 50%');
}

const handleBuyXtokenButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    bot.sendMessage(chatId, 'Please input the amount of tokens you want to buy');
}

const handleSellXtokenButton = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance) => {
    bot.sendMessage(chatId, 'Please input the amount of tokens you want to sell');
}


const buyToken = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, amount, token_ca, token_name, sui = true) => {
    bot.sendMessage(chatId, 'Please wait sending transaction...').then(async (sentMessage) => {
        let sui_amout = amount
        if (!sui) {
            const pricePerSui = await getTokenPriceSui(token_ca);
            sui_amout = (amount * pricePerSui).toPrecision(3)
        }
        if (sui_amout > suiBalance) {
            bot.editMessageText(
                `Transaction failed ❌. \nFailed to convert ${sui_amout} SUI to ${token_name}. You do not have enough SUI in your wallet. \nCurrent SUI balance: ${suiBalance} SUI💧`,
                { chat_id: chatId, message_id: sentMessage.message_id }
            );
        }
        else {
            const phrase = await getUserSecretPhrase(userId);
            if (phrase) {
                const tx_condition = await buyTokenSui(userId, token_ca, walletAddress, sui_amout, phrase);
                if (tx_condition === true) {
                    bot.editMessageText('Transaction sent successfully', { chatId, chat_id: chatId, message_id: sentMessage.message_id })
                } else {
                    bot.editMessageText(
                        `Transaction failed ❌. \nFailed to convert ${sui_amout} SUI to ${token_name}. You do not have enough SUI in your wallet. \nCurrent SUI balance: ${suiBalance} SUI💧`,
                        { chat_id: chatId, message_id: sentMessage.message_id }
                    );
                }
            }
        }
    })
}

const sellToken = async (userId: number, chatId: number, bot: TelegramBot, walletAddress, suiBalance, amount, token_ca, token_name, percentage = true) => {
    const tokenBalnace = await getUserTokenDetails(walletAddress,token_ca);
    console.log(tokenBalnace);
    if (tokenBalnace.balance == 0) {
        bot.sendMessage(chatId, `You do not have any ${token_name} tokens in your wallet.`);
    } 
    else {
        bot.sendMessage(chatId, 'Please wait sending transaction...').then(async (sentMessage) => {
            let amount_token = amount
            if (percentage) {
                amount_token = (tokenBalnace.balance * (amount / 100));
                console.log(amount_token)
            }
            if (amount_token > tokenBalnace.balance) {
                bot.editMessageText(
                    `Transaction failed ❌. \nFailed to convert ${amount_token} ${token_name} tokens to SUI. You do not have enough ${token_name} tokens in your wallet.`,
                    { chat_id: chatId, message_id: sentMessage.message_id }
                );
            }
            else {
                const phrase = await getUserSecretPhrase(userId);
                if (phrase) {
                    const tx_condition = await sellTokenSui(userId, token_ca, walletAddress, amount_token, tokenBalnace.decimals, phrase);
                    if (tx_condition === true) {
                        bot.editMessageText('Transaction sent successfully', { chatId, chat_id: chatId, message_id: sentMessage.message_id })
                    } else {
                        bot.editMessageText(
                            `Transaction failed ❌.`,
                            { chat_id: chatId, message_id: sentMessage.message_id }
                        );
                    }
                }
            }
        }
        )
    }
}

const buySellXSuiTokens = async (userId: number, chatId: number, msg, bot: TelegramBot, walletAddress: string, lastBtn, suiBalance) => {
    if (/^\d+(\.\d+)?$/.test(msg.text)) {
        if (/BUY-X-_ (\w+)_SUI-BUTTON/.test(lastBtn)) {
            const pattern = /BUY-X-_ (\w+)_SUI-BUTTON/;
            const matches = lastBtn.match(pattern);
            if (matches) {
                const uid = matches[1];

                const ca = await getCaFromUid(userId, uid);
                if (ca) {
                    buyToken(userId, chatId, bot, walletAddress, suiBalance, Number(msg.text), ca.ca, uid);
                }
            }

        } else if (/(BUY|SELL)-X-_ (\w+)_TOKEN-BUTTON/.test(lastBtn)) {
            const pattern = /(BUY|SELL)-X-_ (\w+)_TOKEN-BUTTON/;
            const matches = lastBtn.match(pattern);
            if (matches) {
                const action = matches[1];
                const uid = matches[2];

                const ca = await getCaFromUid(userId, uid);
                if (ca) {
                    if (action === "BUY") {
                        buyToken(userId, chatId, bot, walletAddress, suiBalance, Number(msg.text), ca.ca, uid, false);
                    }
                    else {
                        sellToken(userId, chatId, bot, walletAddress, suiBalance, Number(msg.text), ca.ca, uid, false);
                    }
                }
            }
        } else if (/SELL-X%-_ (\w+)_BUTTON/.test(lastBtn)) {
            if (msg.text > 100) {
                bot.sendMessage(chatId, 'Maximum percentage is 100%, Please Enter a valid percentage, e.g. 100 for 100%, 50 for 50%');  
            } else if (msg.text < 1) {
                bot.sendMessage(chatId, 'Minimum percentage is 1%, Please Enter a valid percentage, e.g. 100 for 100%, 50 for 50%');
            } else {
                const pattern = /SELL-X%-_ (\w+)_BUTTON/;
                const matches = lastBtn.match(pattern);
                if (matches) {
                    const uid = matches[1];
                    const ca = await getCaFromUid(userId, uid);
                    if (ca) {
                        sellToken(userId, chatId, bot, walletAddress, suiBalance, Number(msg.text), ca.ca, uid, true);
                    }
                }
            }
        }
    }
}

const refreshCa = async (userId, chatId, bot, uid, action, walletAddress, suiBalance) => {
    const ca = await getCaFromUid(userId, uid);
    if (ca) {

        if (action === "BUY") {
            handleBuyButtonRefresh(userId, chatId, bot, walletAddress, suiBalance, ca);
        } else if (action === "SELL") {
            handleSellButtonRefresh(userId, chatId, bot, walletAddress, suiBalance, ca);
        }
    }
}

const switchButton = async (userId: number, chatId: number, bot: TelegramBot, uid, action, walletAddress, suiBalance) => {
    const ca = await getCaFromUid(userId, uid);
    if (ca) {
        if (action === "BUY") {
            handleSwitchtoBuy(userId, chatId, bot, walletAddress, suiBalance, ca);
        } else if (action === "SELL") {
            handleSwitchtoSell(userId, chatId, bot, walletAddress, suiBalance, ca);
        }
    }
}

const handleBuySellXTokenButton = async (userId, chatId, bot, action, uid, walletAddress, suiBalance) => {
    if (action === "BUY") {
        handleBuyXtokenButton(userId, chatId, bot, walletAddress, suiBalance);
    } else if (action === "SELL") {
        handleSellXtokenButton(userId, chatId, bot, walletAddress, suiBalance);
    }
}

const handlesButton = async (userId: number, chatId: number, bot: TelegramBot, buttonName: string, walletAddress, suiBalance) => {
    const pattern_buy_btn = /BUY-(\d+)-_ (\w+)_/;
    if (pattern_buy_btn.test(buttonName)) {
        const match = buttonName.match(pattern_buy_btn);
        if (match) {
            const [, suiAmount, caSyb] = match;
            const ca = await getCaFromUid(userId, caSyb);
            if (ca) {

                buyToken(userId, chatId, bot, walletAddress, suiBalance, Number(suiAmount), ca.ca, caSyb);
                await saveLastBtn4UserInp(userId, "BUY-BUTTON");
            }
        }
    } else if (/BUY-X-_ (\w+)_SUI-BUTTON/.test(buttonName)) {
        handleBuyXsuiButton(userId, chatId, bot, walletAddress, suiBalance);
        await saveLastBtn4UserInp(userId, buttonName);
    } else if (/(BUY|SELL)-X-_ (\w+)_TOKEN-BUTTON/.test(buttonName)) {
        const pattern = /(BUY|SELL)-X-_ (\w+)_TOKEN-BUTTON/;
        const matches = buttonName.match(pattern);
        if (matches) {
            const action = matches[1];
            const uid = matches[2];
            await handleBuySellXTokenButton(userId, chatId, bot, action, uid, walletAddress, suiBalance);
            await saveLastBtn4UserInp(userId, buttonName);
        }
    } else if (/SELL-(\d+)%-_ (\w+)_BUTTON/.test(buttonName)) {
        const pattern = /SELL-(\d+)%-_ (\w+)_BUTTON/;
        const matches = buttonName.match(pattern);
        if (matches) {
            const [, percentage, caSyb] = matches;
            const ca = await getCaFromUid(userId, caSyb);
            if (ca) {
                sellToken(userId, chatId, bot, walletAddress, suiBalance, Number(percentage), ca.ca, caSyb);
                await saveLastBtn4UserInp(userId, "SELL-BUTTON");
            }
        }
    } else if (/SELL-X%-_ (\w+)_BUTTON/.test(buttonName)) {
        handleSellXTokenPercentButton(userId, chatId, bot, walletAddress, suiBalance);
        await saveLastBtn4UserInp(userId, buttonName);
    }
    else if (buttonName.includes('REFRESH')) {
        const pattern = /REFRESH-_\s(\w+)_(BUY|SELL)-BUTTON-CA/;
        const matches = buttonName.match(pattern);
        if (matches) {

            const uid = matches[1];
            const action = matches[2];
            await refreshCa(userId, chatId, bot, uid, action, walletAddress, suiBalance);
            await saveLastBtn4UserInp(userId, "BUY-BUTTON");
        }
    } else if (buttonName.includes('SWITCH')) {
        const pattern = /SWITCH-_\s(\w+)_TO-(BUY|SELL)-BUTTON/;
        const matches = buttonName.match(pattern);
        if (matches) {
            const uid = matches[1];
            const action = matches[2];
            await switchButton(userId, chatId, bot, uid, action, walletAddress, suiBalance);
            await saveLastBtn4UserInp(userId, "BUY-BUTTON");
        }
    }
    else {
        switch (buttonName) {
            case 'BACK':
                handleBack(userId, chatId, bot, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'Start':
                handleStartButton(chatId, userId, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'CREATE_WALLET':
                await createWallet(userId, chatId, bot, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'IMPORT_WALLET':
                importWallet(chatId, bot);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'HOME-BUTTON':
                handleHomeButton(userId, chatId, bot, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'TRADE-BUTTON':
                handleTradeButton(userId, chatId, bot, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            case 'BUY-BUTTON':
                buy(userId, chatId, bot, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;


            case 'SELL-X%-BUTTON':
                handleSellXTokenPercentButton(userId, chatId, bot, walletAddress, suiBalance);
                await saveLastBtn4UserInp(userId, buttonName);
                break;

            default:
                // bot.sendMessage(chatId, 'Unknown command.');
                break;
        }
    };
};

const setupBot = async () => {
    const sui = "0x2::sui::SUI"
    let suiBalance = 0;

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const walletAddress = await getUserWallet(userId);
        if (walletAddress) {
            const balance = await getSuiBalance(walletAddress);
            suiBalance = balance !== null ? balance : 0;
        }
        handlesButton(userId, chatId, bot, 'Start', walletAddress, suiBalance);
    });

    bot.on('callback_query', async (callbackQuery) => {
        const message = callbackQuery.message;
        const data = callbackQuery.data;
        const userId = callbackQuery.from?.id;
        const walletAddress = await getUserWallet(userId);
        if (walletAddress) {
            const balance = await getSuiBalance(walletAddress);
            suiBalance = balance !== null ? balance : 0;
        }

        if (message && data && userId) {
            const chatId = message.chat.id;
            handlesButton(userId, chatId, bot, data, walletAddress, suiBalance);
        }
    });

    const prefix = '/';

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const walletAddress = await getUserWallet(userId);

        if (msg.author?.bot || msg.text.startsWith(prefix)) {
            return;
        }
        else if (userId) {
            const user = await checkUserExists(userId);
            if (user) {
                if (walletAddress) {
                    const balance = await getSuiBalance(walletAddress);
                    suiBalance = balance !== null ? balance : 0;
                    const lastBtn = await getLastBtn4UserInp(chatId);
                    await handleCa(userId, chatId, msg, bot, walletAddress, lastBtn, suiBalance);
                    await buySellXSuiTokens(userId, chatId, msg, bot, walletAddress, lastBtn, suiBalance);
                }
                else {
                    await handleImportWallet(userId, chatId, msg, bot, suiBalance);
                }
            }
        }
    });
};

await setupBot();
