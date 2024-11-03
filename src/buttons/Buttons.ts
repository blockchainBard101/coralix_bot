export const startButtonsNew = (chatId, bot) => {
    const message = '👋 Hello there, welcome to **CORALIX BOT⚡**! \n\n🚀 Experience fast-lightning trades, carry out on-chain lending and borrowing activities, and stake your profits to enjoy higher APRs—all with one click!';
    return bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Create Wallet', callback_data: 'CREATE_WALLET' },
                    { text: 'Import Wallet', callback_data: 'IMPORT_WALLET' },
                ]
            ],
        },
    });
};


export const startButtons = (chatId, bot, walletAddress, suiBalance) => {
    const message = `👋 Hello there, welcome to **CORALIX BOT⚡**! \n\n🚀 Experience fast-lightning trades, carry out on-chain lending and borrowing activities, and stake your profits to enjoy higher APRs—all with one click! \n\n📬 Wallet Address: \`${walletAddress}\` \n💰 Sui Balance: ${suiBalance} SUI 💧`;
    return bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'HOME', callback_data: 'HOME-BUTTON' },
                    { text: 'SETTINGS', callback_data: 'SETTINGS-BUTTON' },
                    { text: 'CHAT', callback_data: 'CHAT-BUTTON' },
                ]
            ],
        },
    });
};


export const homeButtons = (chatId, bot, walletAddress, suiBalance) => {
    const message = `**CORALIX BOT⚡**! \n\n🏠 Home \n\n📬 Wallet Address: \`${walletAddress}\` \n💰 Sui Balance: ${suiBalance} SUI 💧`;
    return bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'TRADE', callback_data: 'TRADE-BUTTON' },
                    { text: 'LEND', callback_data: 'LEND-BUTTON' },
                    { text: 'STAKE', callback_data: 'STAKE-BUTTON' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'BACK' },
                ],
            ],
        },
    });
};


export const tradeButtons = (chatId, bot, walletAddress, suiBalance) => {
    const message = `**CORALIX BOT⚡**! \n\n💼 Trade \n\n📬 Wallet Address: \`${walletAddress}\` \n💰 Sui Balance: ${suiBalance} SUI 💧`;
    return bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🛒 BUY', callback_data: 'BUY-BUTTON' },
                    { text: '💵 SELL', callback_data: 'SELL-BUTTON' },
                ],
                [
                    { text: '⚙️ MANAGE', callback_data: 'MANAGE-BUTTON' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'BACK' },
                ],
            ],
        },
    });
};

export const refreshBuyButtons = async (chatId, messageId, bot, results, uid) => {
    await bot.editMessageText(results.formattedString, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔄 Refresh', callback_data: `REFRESH-_ ${uid}_BUY-BUTTON-CA` },
                ],
                [
                    { text: '📊 Chart', url: results.args.chart },
                    { text: '🔍 Scan', url: results.args.scan },
                    { text: '📈 Track', callback_data: `TRACK-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '📉 DCA', callback_data: `BUY-_ ${uid}_MODE-BUTTON` },
                    { text: '🔔 Limit', callback_data: `SELL-_ ${uid}_MODE-BUTTON` },
                ],
                [
                    { text: '🔁 Switch to Sell', callback_data: `SWITCH-_ ${uid}_TO-SELL-BUTTON` },
                ],
                [
                    { text: '⚙️ Manage', callback_data: `MANAGE-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '💧 BUY 1 SUI', callback_data: `BUY-1-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 10 SUI', callback_data: `BUY-10-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY 20 SUI', callback_data: `BUY-20-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 50 SUI', callback_data: `BUY-50-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY 100 SUI', callback_data: `BUY-100-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 200 SUI', callback_data: `BUY-200-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY X SUI', callback_data: `BUY-X-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💸 BUY X TOKENS', callback_data: `BUY-X-_ ${uid}_TOKEN-BUTTON` },
                ],
            ]
        },
    });
};

export const refreshSellButtons = async (chatId, messageId, bot, results, uid) => {
    await bot.editMessageText(results.formattedString, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔄 Refresh', callback_data: `REFRESH-_ ${uid}_SELL-BUTTON-CA` },
                ],
                [
                    { text: '📊 Chart', url: results.args.chart },
                    { text: '🔍 Scan', url: results.args.scan },
                    { text: '📈 Track', callback_data: `TRACK-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '📉 DCA', callback_data: `BUY-_ ${uid}_MODE-BUTTON` },
                    { text: '🔔 Limit', callback_data: `SELL-_ ${uid}_MODE-BUTTON` },
                ],
                [
                    { text: '🔁 Switch to Buy', callback_data: `SWITCH-_ ${uid}_TO-BUY-BUTTON` },
                ],
                [
                    { text: '⚙️ Manage', callback_data: `MANAGE-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL 25%', callback_data: `SELL-25%-_ ${uid}_BUTTON` },
                    { text: 'SELL 50%', callback_data: `SELL-50%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL 75%', callback_data: `SELL-75%-_ ${uid}_BUTTON` },
                    { text: 'SELL 100%', callback_data: `SELL-100%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL X%', callback_data: `SELL-X%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '💸 SELL X TOKENS', callback_data: `SELL-X-_ ${uid}_TOKEN-BUTTON` },
                ]
            ]

        }
    })
}

export const buyButtons = (chatId, bot, results, uid) => {
    return bot.sendMessage(chatId, results.formattedString, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔄 Refresh', callback_data: `REFRESH-_ ${uid}_BUY-BUTTON-CA` },
                ],
                [
                    { text: '📊 Chart', url: results.args.chart },
                    { text: '🔍 Scan', url: results.args.scan },
                    { text: '📈 Track', callback_data: `TRACK-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '📉 DCA', callback_data: `BUY-_ ${uid}_MODE-BUTTON` },
                    { text: '🔔 Limit', callback_data: `SELL-_ ${uid}_MODE-BUTTON` },
                ],
                [
                    { text: '🔁 Switch to Sell', callback_data: `SWITCH-_ ${uid}_TO-SELL-BUTTON` },
                ],
                [
                    { text: '⚙️ Manage', callback_data: `MANAGE-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '💧 BUY 1 SUI', callback_data: `BUY-1-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 10 SUI', callback_data: `BUY-10-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY 20 SUI', callback_data: `BUY-20-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 50 SUI', callback_data: `BUY-50-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY 100 SUI', callback_data: `BUY-100-_ ${uid}_SUI-BUTTON` },
                    { text: '💧 BUY 200 SUI', callback_data: `BUY-200-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💧 BUY X SUI', callback_data: `BUY-X-_ ${uid}_SUI-BUTTON` },
                ],
                [
                    { text: '💸 BUY X TOKENS', callback_data: `BUY-X-_ ${uid}_TOKEN-BUTTON` },
                ],
            ]
        },
    });
};

export const sellButtons = (chatId, bot, results, uid) => {
    return bot.sendMessage(chatId, results.formattedString, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔄 Refresh', callback_data: `REFRESH-_ ${uid}_SELL-BUTTON-CA` },
                ],
                [
                    { text: '📊 Chart', url: results.args.chart },
                    { text: '🔍 Scan', url: results.args.scan },
                    { text: '📈 Track', callback_data: `TRACK-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '📉 DCA', callback_data: `BUY-_ ${uid}_MODE-BUTTON` },
                    { text: '🔔 Limit', callback_data: `SELL-_ ${uid}_MODE-BUTTON` },
                ],
                [
                    { text: '🔁 Switch to Buy', callback_data: `SWITCH-_ ${uid}_TO-BUY-BUTTON` },
                ],
                [
                    { text: '⚙️ Manage', callback_data: `MANAGE-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL 25%', callback_data: `SELL-25%-_ ${uid}_BUTTON` },
                    { text: 'SELL 50%', callback_data: `SELL-50%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL 75%', callback_data: `SELL-75%-_ ${uid}_BUTTON` },
                    { text: 'SELL 100%', callback_data: `SELL-100%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: 'SELL X%', callback_data: `SELL-X%-_ ${uid}_BUTTON` },
                ],
                [
                    { text: '💸 SELL X TOKENS', callback_data: `SELL-X-_ ${uid}_TOKEN-BUTTON` },
                ]
            ]

        },
    });
}