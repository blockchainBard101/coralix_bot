import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as bip39 from 'bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import * as crypto from 'crypto';
import { getUserSecretPhrase } from '../handlers/user';
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { resolve4 } from 'dns';

const rpc_url = getFullnodeUrl("mainnet");
const suiClient = new SuiClient({ url: rpc_url });

async function generate12WordMnemonic() {
    // 128 bits entropy for 12-word mnemonic
    const entropy = crypto.randomBytes(16); // 16 bytes = 128 bits
    const mnemonic = bip39.entropyToMnemonic(entropy.toString('hex'), wordlist);
    return mnemonic
}

export const generateNewWallet = async () => {
    const mnemonic = await generate12WordMnemonic();
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const publicKey = keypair.getPublicKey().toSuiAddress();

    return {
        newPhrase: mnemonic,
        walletAddress: publicKey
    }
}

export const getWalletAddress = async (mnemonic: string) => {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const publicKey = keypair.getPublicKey().toSuiAddress();
    return publicKey
}

export const signAndExecuteTx = async (tx, phrase) => {
    const keypair = Ed25519Keypair.deriveKeypair(phrase)
    // console.log(keypair.getPublicKey().toSuiAddress());
    try {
        const { bytes, signature } = tx.sign({ suiClient, signer: keypair });
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
            requestType: 'WaitForLocalExecution',
            options: {
                showEffects: true,
            },
        });
        console.log(result);
        // const { objectChanges, balanceChanges } = await suiClient.signAndExecuteTransaction({
        //     transaction: tx,
        //     signer: keypair,
        //     options: {
        //         showBalanceChanges: true,
        //         showEvents: true,
        //         showInput: false,
        //         showEffects: true,
        //         showObjectChanges: true,
        //         showRawInput: false,
        //     }
        // });
        // console.log(objectChanges);
        if (result) {
            return true
        }
        else {
            return false
        }
    } catch (error) {
        console.log(error);
        return false
    }
}