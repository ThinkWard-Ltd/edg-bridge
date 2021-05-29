const { getWalletAndProvider, buildDepositParams, expandDecimals } = require("../utils");
const { erc20Approve, bridgeDeposit } = require('../interactions');

async function bridgeTransfer() {
    try {
        let { chainProvider, chainWallet } = getWalletAndProvider(RPC_URL, PRIVATE_KEY, Number(CHAIN_ETH_NET_ID));
    
        await erc20Approve(TOKEN_ADDRESS, BRIDGE_HANDLER_ADDRESS, TOKEN_DECIMALS, AMOUNT, chainProvider, chainWallet, GAS_PRICE, GAS_LIMIT);
        const depositParams = buildDepositParams(RECIPIENT_ADDRESS, AMOUNT, TOKEN_DECIMALS);

        console.log(`
        Constructed deposit:        
        Resource Id: ${RESOURCE_ID}
        Amount: ${expandDecimals(AMOUNT, TOKEN_DECIMALS).toHexString()}
        Length (recipient): ${(RECIPIENT_ADDRESS.length - 2)/ 2}
        Recipient: ${RECIPIENT_ADDRESS}
        Raw: ${depositParams}
        Creating deposit to initiate transfer!`);
    
        await bridgeDeposit(BRDIGE_ADDRESS, depositParams, RESOURCE_ID, DST_CB_CHAIN_ID, GAS_PRICE, GAS_LIMIT, chainWallet, chainProvider);

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}