const { getWalletAndProvider, buildDepositParams, expandDecimals } = require("../utils");
const { erc20Approve, bridgeDeposit } = require('../interactions');
const commander = require('commander');

async function depositViaBridge(args) {
    try {
        let { chainProvider, chainWallet } = getWalletAndProvider(args.rpcUrl, args.privateKey, args.ethChainId, Number(args.gasPrice), Number(args.gasLimit));
    
        await erc20Approve(args.erc20Address, args.handlerAddress, Number(args.decimals), Number(args.amount), chainProvider, chainWallet);
        const depositParams = buildDepositParams(args.recipient, Number(args.amount), Number(args.decimals));

        console.log(`
        Constructed deposit:
        
        Resource Id: ${args.resourceId}
        Amount: ${expandDecimals(args.amount, args.decimals).toHexString()}
        Length (recipient): ${(args.recipient.length - 2)/ 2}
        Recipient: ${args.recipient}
        Raw: ${depositParams}
        Creating deposit to initiate transfer!`);
    
        await bridgeDeposit(args.bridgeAddress, depositParams, args.resourceId, Number(args.destinationChainBridgeChainId), Number(args.gasPrice), Number(args.gasLimit), chainWallet, chainProvider);

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

exports.bridgeTokenTransfer = new commander.Command("bridgeTokenTransfer")
    .option('--rpcUrl <rpcUrl>')
    .option('--privateKey <privateKey>')
    .option('--ethChainId <ethChainId>')
    .option('--bridgeAddress <bridgeAddress>')
    .option('--erc20Address <erc20Address>')
    .option('--recipient <recipient>')
    .option('--amount <amount>')
    .option('--decimals <decimals>')
    .option('--resourceId <resourceId>')
    .option('--handlerAddress <handlerAddress>')
    .option('--destinationChainBridgeChainId <destinationChainBridgeChainId>')
    .option('--gasPrice <gasPrice>')
    .option('--gasLimit <gasLimit>')
    .action(async function(args) {
        await depositViaBridge(args)
    });