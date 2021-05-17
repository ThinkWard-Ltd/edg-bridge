const commander = require('commander');
const path = require('path');

const { DEST_CHAIN_DEFAULT_ID, SRC_CHAIN_DEFAULT_ID } = require("../constants");
const { getWalletAndProvider, createChainConfig, publishRelayerConfiguration } = require("../utils");
const { deployBridgeContract, deployERC20Handler, deployCloneableERC20, deployMintableCoinFactory } = require("../deployers");
const { setCloneableCoinAddress, revokeGrantERC20Role, renounceBridgeAdmin } = require("../interactions");

require('dotenv').config({ path: path.join(__dirname, '../env/deployBridge.env') });

const SGAS_LIMIT = Number(process.env.SGAS_LIMIT), SGAS_PRICE = Number(process.env.SGAS_PRICE);
const DGAS_LIMIT = Number(process.env.DGAS_LIMIT), DGAS_PRICE = Number(process.env.DGAS_PRICE);

exports.deployBridge = new commander.Command("deployBridge")
    .action(async args => {
        try {
            console.log(`Deploying chainsafe's chainbridge... `);

            // Get providers and wallets for both chains
            let sourceChainProvider, destinationChainProvider,
                sourceWallet, destinationWallet;

            let _res = getWalletAndProvider(process.env.SRC_CHAIN_RPC_HTTPS, process.env.SRC_CHAIN_PRIVATE_KEY, Number(process.env.SRC_CHAIN_NETWORK_ID));
            sourceWallet = _res.chainWallet;
            sourceChainProvider = _res.chainProvider;

            _res = getWalletAndProvider(process.env.DEST_CHAIN_RPC_HTTPS, process.env.DEST_CHAIN_PRIVATE_KEY, Number(process.env.DEST_CHAIN_NETWORK_ID));
            destinationWallet = _res.chainWallet;
            destinationChainProvider = _res.chainProvider;

            // Deployment of main bridge and handler contracts
            const sourceBridgeAddress = await deployBridgeContract(SRC_CHAIN_DEFAULT_ID, [], sourceWallet, undefined, Number(process.env.BRIDGE_TRANSFER_FEE || 0), undefined, SGAS_PRICE, SGAS_LIMIT);
            const sourceHandlerAddress = await deployERC20Handler(sourceBridgeAddress, sourceWallet, SGAS_PRICE, SGAS_LIMIT);
            const destBridgeAddress = await deployBridgeContract(DEST_CHAIN_DEFAULT_ID, [], destinationWallet, undefined, Number(process.env.BRIDGE_TRANSFER_FEE || 0), undefined, DGAS_PRICE, DGAS_LIMIT);
            const destHanderAddress = await deployERC20Handler(destBridgeAddress, destinationWallet, DGAS_PRICE, DGAS_LIMIT);

            // Deploy mintable factory contract
            const srcMintableCoinFactoryAddress = await deployMintableCoinFactory(sourceWallet, SGAS_PRICE, SGAS_LIMIT);
            const srcCloneableMintableERC20Address = await deployCloneableERC20(sourceWallet, SGAS_PRICE, SGAS_LIMIT);
            const dstMintableCoinFactoryAddress = await deployMintableCoinFactory(destinationWallet, DGAS_PRICE, DGAS_LIMIT);
            const dstCloneableMintableERC20Address = await deployCloneableERC20(destinationWallet, DGAS_PRICE, DGAS_LIMIT);

            //  renounceRole AS MINTER, PAUSER, ADMIN give admin to factory
            await setCloneableCoinAddress(srcMintableCoinFactoryAddress, srcCloneableMintableERC20Address, sourceChainProvider, sourceWallet);
            await revokeGrantERC20Role(srcCloneableMintableERC20Address, 1, true, process.env.SRC_ADDRESS, sourceChainProvider, sourceWallet);
            await revokeGrantERC20Role(srcCloneableMintableERC20Address, 2, true, process.env.SRC_ADDRESS, sourceChainProvider, sourceWallet);
            await revokeGrantERC20Role(srcCloneableMintableERC20Address, 0, false, srcMintableCoinFactoryAddress, sourceChainProvider, sourceWallet);
            await revokeGrantERC20Role(srcCloneableMintableERC20Address, 0, true, process.env.SRC_ADDRESS, sourceChainProvider, sourceWallet);

            await setCloneableCoinAddress(dstMintableCoinFactoryAddress, dstCloneableMintableERC20Address, destinationChainProvider, destinationWallet);
            await revokeGrantERC20Role(dstCloneableMintableERC20Address, 1, true, process.env.DEST_ADDRESS, destinationChainProvider, destinationWallet);
            await revokeGrantERC20Role(dstCloneableMintableERC20Address, 2, true, process.env.DEST_ADDRESS, destinationChainProvider, destinationWallet);
            await revokeGrantERC20Role(dstCloneableMintableERC20Address, 0, false, dstMintableCoinFactoryAddress, destinationChainProvider, destinationWallet);
            await revokeGrantERC20Role(dstCloneableMintableERC20Address, 0, true, process.env.DEST_ADDRESS, destinationChainProvider, destinationWallet);

            if (process.env.SRC_MULTISIG.length) {
                await renounceBridgeAdmin(sourceBridgeAddress, sourceWallet, sourceChainProvider, process.env.SRC_MULTISIG, process.env.SRC_CHAIN_NAME)
            }

            if (process.env.DEST_MULTISIG.length) {
                await renounceBridgeAdmin(destBridgeAddress, destinationWallet, destinationChainProvider, process.env.DEST_MULTISIG, process.env.DEST_CHAIN_NAME)
            }

            let srcBridgeConfig = createChainConfig(process.env.SRC_CHAIN_NAME,
                SRC_CHAIN_DEFAULT_ID.toString(),
                sourceBridgeAddress,
                sourceHandlerAddress,
                SGAS_LIMIT,
                SGAS_PRICE,
                process.env.SRC_CHAIN_RPC_WS.length ? process.env.SRC_CHAIN_RPC_WS : process.env.SRC_CHAIN_RPC_HTTPS,
                undefined,
                srcMintableCoinFactoryAddress
            );

            let dstBridgeConfig = createChainConfig(process.env.DEST_CHAIN_NAME,
                DEST_CHAIN_DEFAULT_ID.toString(),
                destBridgeAddress,
                destHanderAddress,
                DGAS_LIMIT,
                DGAS_PRICE,
                process.env.DEST_CHAIN_RPC_WS.length ? process.env.DEST_CHAIN_RPC_WS : process.env.DEST_CHAIN_RPC_HTTPS,
                undefined,
                dstMintableCoinFactoryAddress
            )

            let fileName = publishRelayerConfiguration({ chains: [srcBridgeConfig, dstBridgeConfig] });
            console.log(`⚙️  ${fileName} created to run as the first relayer!`);

        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    });