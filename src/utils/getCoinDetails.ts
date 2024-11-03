import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const blockberryApiKey = process.env.BLOCKBERRY_API_KEY;

export const getUserTokenDetails = async (address, token = '0x2::sui::SUI') => {
const options = {
        method: 'GET',
        url: 'https://api.blockberry.one/sui/v1/accounts/' + address + '/balance',
        headers: { accept: '*/*', 'x-api-key': blockberryApiKey }
    };

    try {
        const res = await axios.request(options);
        const coin_details = res.data.find((coin) => coin.coinType === token);
        return coin_details ? coin_details : null;
    } catch (error) {
        // console.error(error);
        return null;
    }
}



// (async () => {
//     const details = await getUserTokenDetails("0x48dfdd7c1acb1b4919e1b4248206af584bef882f126f1733521ac41eb13fb77b");
//     console.log(details);
// })();

