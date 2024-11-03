import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { getUserTokenDetails } from './getCoinDetails';

const client = new SuiClient({
    url: getFullnodeUrl('mainnet'),
});

function formatPrice(price: number): string {
    if (price >= 1_000_000_000) {
        return `$${(price / 1_000_000_000).toFixed(1)}B`;
    } else if (price >= 1_000_000) {
        return `$${(price / 1_000_000).toFixed(1)}M`;
    } else if (price >= 1_000) {
        return `$${(price / 1_000).toFixed(1)}K`;
    }
    return `$${price}`;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getTokenDetails = async (token: string, walletAddress) => {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
        method: 'GET',
        headers: {},
    });
    const responseData = await response.json();
    const data = responseData.pairs[0];
    if (data.quoteToken.symbol === "SUI") {
        // Fetch token balance
        const token_balance = await getCoinBalance(walletAddress, data.baseToken.address);
        const suiBalance = await getSuiBalance(walletAddress);
        // const suiBalance = 0;
        const args = {
            token_banlance: token_balance,
            token_name: data.baseToken.name,
            token_symbol: data.baseToken.symbol,
            chart: data.url,
            scan: `https://suiscan.xyz/mainnet/coin/${data.baseToken.address}/txs`,
            ca: data.baseToken.address,
        }
        const formattedWebsites = data.info.websites
            .map(site => `${site.label}: ${site.url}`)
            .join('\n');

        const formattedSocials = data.info.socials
            .map(social => `${social.type.charAt(0).toUpperCase() + social.type.slice(1)}: ${social.url}`)
            .join('\n📱');

        const formattedString = `
**CORALIX BOT⚡**!

📈 ${data.baseToken.name}
${data.baseToken.symbol} / ${data.quoteToken.symbol}

🪙 CA: ${data.baseToken.address}
🔄 LP: ${data.dexId}

💵 Price (USD): $${data.priceUsd}
💱 Price : ${data.priceNative} ${data.quoteToken.symbol}

💧 Liquidity (USD): ${formatPrice(Number(data.liquidity.usd))}
📊 FDV: ${formatPrice(Number(data.fdv))}
🏦 Market Cap: ${formatPrice(Number(data.marketCap))}

📅 Created: ${new Date(data.pairCreatedAt).toLocaleString()}

${formattedSocials}
🌐 ${formattedWebsites}
----------------------------------------------------------------
📬 Wallet Address: \`${walletAddress}\`
💰 Balance: ${suiBalance} SUI💧
💰 Balance: ${token_balance.balance} ${data.baseToken.symbol} | $${token_balance.balanceUsd}
`;
        return { formattedString, args }
    } else {
        return null
    }
}

export const getTokenPriceSui = async (token: string) => {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
        method: 'GET',
        headers: {},
    });
    const responseData = await response.json();
    const data = responseData.pairs[0];
    return Number(data.priceNative)
    // return data.priceUsd
}

export const getCoinBalance = async (address: string, coinType: string = '0x2::sui::SUI') => {
    const details = await getUserTokenDetails(address, coinType)
    if (details === null) {
        return ({ balance: 0, balanceUsd: 0, decimals: 0 });
    } else {
        return ({ balance: details.balance, balanceUsd: details.balanceUsd, decimals: details.decimals });
    }
}

export const getSuiBalance = async (address: string) => {
    try {
        const balance = await client.getBalance({
            owner: address,
        });
        return Number(balance.totalBalance) / 10 ** 9;
    } catch (error) {
        console.error(error);
        return 0;
    }
    
}

// console.log(await getTokenDetails("0x457b032746c225d35489e3c260349125245656d44d1f048f2370d5edf4a66851::gus::GUS", "0x48dfdd7c1acb1b4919e1b4248206af584bef882f126f1733521ac41eb13fb77b"))
// console.log(await getCoinBalance("0x48dfdd7c1acb1b4919e1b4248206af584bef882f126f1733521ac41eb13fb77b", "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"))

