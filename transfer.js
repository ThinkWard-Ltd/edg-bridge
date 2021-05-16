const ethers = require("ethers");
const fs = require('fs');
const { ContractABIs, GAS_PRICE, GAS_LIMIT } = require("./constants");
const { getWalletAndProvider, waitForTx } = require("./utils");
const path = require('path');
const Command = require('commander');

const expandDecimals = (amount, decimals = 18) => {
    return ethers.utils.parseUnits(String(amount), decimals);
}

(async() => {
    let { chainProvider, chainWallet } = getWalletAndProvider('','', 4);
    const erc20Instance = new ethers.Contract('', ContractABIs.Erc20Mintable.abi, chainWallet);
    
    let recipient = '';
    let decimals = 6;
    let amount = 250;
    let resourceId = '';
    let destChainId = 0 || 1;
    
    console.log(`Approving ${recipient} to spend ${amount} tokens!`);
    let tx = await erc20Instance.approve('', expandDecimals(amount, decimals), { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT});
    await waitForTx(chainProvider, tx.hash)

    // Instances
    const bridgeInstance = new ethers.Contract('', ContractABIs.Bridge.abi, chainWallet);
    const data = '0x' +
        ethers.utils.hexZeroPad(ethers.utils.bigNumberify(expandDecimals(amount, decimals)).toHexString(), 32).substr(2) +
        ethers.utils.hexZeroPad(ethers.utils.hexlify((recipient.length - 2)/2), 32).substr(2) +
        recipient.substr(2);

    console.log(`Constructed deposit:`)
    console.log(`  Resource Id: ${resourceId}`)
    console.log(`  Amount: ${expandDecimals(amount, decimals).toHexString()}`)
    console.log(`  len(recipient): ${(recipient.length - 2)/ 2}`)
    console.log(`  Recipient: ${recipient}`)
    console.log(`  Raw: ${data}`)
    console.log(`Creating deposit to initiate transfer!`);

    // Make the deposit
    tx = await bridgeInstance.deposit(
        destChainId, // destination chain id
        resourceId,
        data,
        { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT }
    );

    await waitForTx(chainProvider, tx.hash)
})()