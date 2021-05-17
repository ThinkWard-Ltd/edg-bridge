const commander = require('commander');
const path = require('path');

const { deployBridgeContract, deployERC20Handler, deployMintableCoinFactory, deployCloneableERC20 } = require('../deployers');
const { setCloneableCoinAddress, revokeGrantERC20Role, renounceBridgeAdmin } = require('../interactions');
const { getWalletAndProvider, createChainConfig, publishChainConfiguration } = require("../utils");

require('dotenv').config({ path: path.join(__dirname, '../env/deployBridgeSingleSide.env') });
const GAS_LIMIT = Number(process.env.GAS_LIMIT);
const GAS_PRICE = Number(process.env.GAS_PRICE);
const CHAINBRIDGE_CHAIN_ID = Number(process.env.CHAINBRIDGE_CHAIN_ID);

exports.deployBridgeSingleSide = new commander.Command("deployBridgeSingleSide")
    .action(async args => {
        try {
            console.log(`Deploying chainsafe's chainbridge... `);

            // Get providers and wallets for both chains
            let chainProvider, chainWallet;
            let _res = getWalletAndProvider(process.env.CHAIN_RPC, process.env.PRIVATE_KEY, Number(process.env.ETH_CHAIN_ID));
            chainWallet = _res.chainWallet;
            chainProvider = _res.chainProvider;

            // Deployment of main bridge and handler contracts
            const deployedBridgeContractAddress = await deployBridgeContract(CHAINBRIDGE_CHAIN_ID, [], chainWallet, undefined, Number(process.env.BRIDGE_TRANSFER_FEE || 0), undefined, GAS_PRICE, GAS_LIMIT);
            const deployedHandlerAddress = await deployERC20Handler(deployedBridgeContractAddress, chainWallet, GAS_PRICE, GAS_LIMIT);

            // Deploy mintable factory contract
            const mintableCoinFactoryAddress = await deployMintableCoinFactory(chainWallet, GAS_PRICE, GAS_LIMIT);
            const cloneableMintableERC20Address = await deployCloneableERC20(chainWallet, GAS_PRICE, GAS_LIMIT);

            //  renounceRole AS MINTER, PAUSER, ADMIN give admin to factory
            await setCloneableCoinAddress(mintableCoinFactoryAddress, cloneableMintableERC20Address, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 1, true, process.env.PUB_ADDRESS, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 2, true, process.env.PUB_ADDRESS, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 0, false, mintableCoinFactoryAddress, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 0, true, process.env.PUB_ADDRESS, chainProvider, chainWallet);


            if (process.env.MULTISIG_ADDRESS.length) {
                await renounceBridgeAdmin(deployedBridgeContractAddress, chainWallet, chainProvider, process.env.MULTISIG_ADDRESS, process.env.CHAIN_NAME)
            }

            let chainBridgeConfig = createChainConfig(process.env.CHAIN_NAME,
                CHAINBRIDGE_CHAIN_ID.toString(),
                deployedBridgeContractAddress,
                deployedHandlerAddress,
                GAS_LIMIT,
                GAS_PRICE,
                process.env.CHAIN_RPC_WS.length ? process.env.CHAIN_RPC_WS : process.env.CHAIN_RPC,
                undefined,
                mintableCoinFactoryAddress);

            const deploymentFile = publishChainConfiguration(chainBridgeConfig);
            console.log(`Chainbridge contracts deployed and configuration written to publish/${deploymentFile}`);
        } catch (err) {
            console.log(err)
        }
    });