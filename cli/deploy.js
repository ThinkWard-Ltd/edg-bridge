const commander = require('commander');
const path = require('path');

const { getWalletAndProvider, createChainConfig, publishRelayerConfiguration } = require("../utils");
const { deployBridgeContract, deployERC20Handler, deployCloneableERC20, deployMintableCoinFactory } = require("../deployers");
const { setCloneableCoinAddress, revokeGrantERC20Role, renounceBridgeAdmin } = require("../interactions");

require('dotenv').config({ path: path.join(__dirname, '../env/deploy.env') });

async function deployBridge(chainRpcUrl, chainName, publicKey, privateKey, ethChainId, cbChainId, multiSigAddr, bridgeTransferFee, gasPrice, gasLimit) {
    let { chainProvider, chainWallet } = getWalletAndProvider(chainRpcUrl, privateKey, ethChainId);

    // No Relayers on deployment
    const bridgeAddress = await deployBridgeContract(cbChainId, [], chainWallet, undefined, bridgeTransferFee, undefined, gasPrice, gasLimit);
    const handlerAddress = await deployERC20Handler(bridgeAddress, chainWallet, gasPrice, gasLimit);

    const mintableCoinFactoryAddress = await deployMintableCoinFactory(chainWallet, gasPrice, gasLimit);
    const cloneableMintableERC20Address = await deployCloneableERC20(chainWallet, gasPrice, gasLimit);

    await setCloneableCoinAddress(mintableCoinFactoryAddress, cloneableMintableERC20Address, chainProvider, chainWallet);
    await revokeGrantERC20Role(cloneableMintableERC20Address, 1, true, publicKey, chainProvider, chainWallet);
    await revokeGrantERC20Role(cloneableMintableERC20Address, 2, true, publicKey, chainProvider, chainWallet);
    await revokeGrantERC20Role(cloneableMintableERC20Address, 0, false, mintableCoinFactoryAddress, chainProvider, chainWallet);
    await revokeGrantERC20Role(cloneableMintableERC20Address, 0, true, publicKey, chainProvider, chainWallet);

    if (multiSigAddr.length) {
        await renounceBridgeAdmin(bridgeAddress, chainWallet, chainProvider, multiSigAddr, chainName)
    }

    return createChainConfig(
        chainName,
        cbChainId,
        bridgeAddress,
        handlerAddress,
        gasLimit,
        gasPrice,
        chainRpcUrl,
        '',
        mintableCoinFactoryAddress
    )
}

exports.deployBridge = new commander.Command("deployBridge")
    .option("-s, --source", "Deploys on source only.")
    .option("-d, --destination", "Deploys on destination only.")
    .option("-a, --all", "Deploy on both.")
    .action(async args => {
        try {
            console.log(`Deploying chainsafe's chainbridge... `);
            let chains = [];

            if (args.source || args.all) {
                chains.push(await deployBridge(
                    process.env.SRC_CHAIN_RPC_HTTPS,
                    process.env.SRC_CHAIN_NAME,
                    process.env.SRC_ADDRESS,
                    process.env.SRC_CHAIN_PRIVATE_KEY,
                    Number(process.env.SRC_CHAIN_NETWORK_ID), 0,
                    process.env.SRC_MULTISIG,
                    parseInt(process.env.BRIDGE_TRANSFER_FEE) || 0,
                    Number(process.env.SGAS_PRICE),
                    Number(process.env.SGAS_LIMIT)));
            }

            if (args.destination || args.all) {
                chains.push(await deployBridge(
                    process.env.DEST_CHAIN_RPC_HTTPS,
                    process.env.DEST_CHAIN_NAME, 
                    process.env.DEST_ADDRESS,
                    process.env.DEST_CHAIN_PRIVATE_KEY,
                    Number(process.env.DEST_CHAIN_NETWORK_ID), 1,
                    process.env.DEST_MULTISIG,
                    parseInt(process.env.BRIDGE_TRANSFER_FEE) || 0,
                    Number(process.env.DGAS_PRICE),
                    Number(process.env.DGAS_LIMIT)));
            }


            let fileName = publishRelayerConfiguration({ chains });
            console.log(`⚙️  ${fileName} created to run as the first relayer!`);

        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    });