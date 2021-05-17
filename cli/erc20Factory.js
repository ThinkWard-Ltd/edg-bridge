const commander = require('commander');

const ethers = require("ethers");
const { ContractABIs, GAS_LIMIT, GAS_PRICE } = require("../constants");
const { getWalletAndProvider, waitForTx } = require("../utils");

async function createERC20ViaFactory(
    rpcUrl,
    privateKey,
    chainId,
    factoryAddress,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    multiSigAddress) {
    const { chainProvider, chainWallet } = getWalletAndProvider(rpcUrl, privateKey, chainId);
    const filter = {
        address: factoryAddress,
        topics: [
            ethers.utils.id("MintableERC20Created(address)")
        ]
    }

    if (multiSigAddress.length) {
        chainProvider.on(filter, async topicData => {
            try {
                // get data key from topic data
                const newCreatedAddress = topicData.data.slice(26);
                console.log(`Token Created: 0x${newCreatedAddress}`);
                const originalOwner = await chainWallet.getAddress();

                const erc20Cloneable = new ethers.Contract(`0x${newCreatedAddress}`, ContractABIs.CloneableMintableERC20.abi, chainWallet);
                // role, account (0x0000000000000000000000000000000000000000000000000000000000000000 is admin role)
                let tx = await erc20Cloneable.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", multiSigAddress, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT});
                await waitForTx(chainProvider, tx.hash);
                tx = await erc20Cloneable.renounceRole("0x0000000000000000000000000000000000000000000000000000000000000000", originalOwner, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT});
                await waitForTx(chainProvider, tx.hash);

                const symbolName = await erc20Cloneable.name();
                console.log(`${symbolName} deployed at 0x${newCreatedAddress}, and transferred ownership to ${multiSigAddress}`);
                process.exit(1);
            } catch (err) {
                console.log(err);
                process.exit(1);
            }
        });
    }

    try {
        const erc20Factory = new ethers.Contract(factoryAddress, ContractABIs.MintableCoinFactory.abi, chainWallet);
        const tx = await erc20Factory.createERC20Mintable(tokenName, tokenSymbol, tokenDecimals, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT});
        await waitForTx(chainProvider, tx.hash);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

exports.createToken = new commander.Command("createToken")
    .option('--rpcUrl <rpcUrl>')
    .option('--privateKey <privateKey>')
    .option('--factoryAddress <factoryAddress>')
    .option('--chainId <chainId>')
    .option('--tokenName <tokenName>')
    .option('--tokenSymbol <tokenSymbol>')
    .option('--tokenDecimals <tokenDecimals>')
    .option('--multiSigAddress <multiSigAddress>')
    .action(async function(args) {
        await createERC20ViaFactory(
            args.rpcUrl,
            args.privateKey,
            Number(args.chainId),
            args.factoryAddress,
            args.tokenName,
            args.tokenSymbol,
            Number(args.tokenDecimals),
            args.multiSigAddress);
    });