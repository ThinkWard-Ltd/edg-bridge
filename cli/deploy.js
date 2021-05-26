const commander = require('commander');
const { getWalletAndProvider, createChainConfig, publishChainConfiguration } = require("../utils");
const { deployBridgeContract, deployERC20Handler, deployCloneableERC20, deployMintableCoinFactory } = require("../deployers");
const { setCloneableCoinAddress, revokeGrantERC20Role, renounceBridgeAdmin } = require("../interactions");
const inquirer = require('inquirer');

let deploymentConfigQueries = [
    {
        name: `rpcUrl`,
        message: `Chain RPC Url (http): `
    },
    {
        name: `rpcUrlWs`,
        message: `Chain RPC Url (ws): `
    },
    {
        name: `ethNetId`,
        message: `Ethereum Chain Id: `
    },
    {
        name: `chainName`,
        message: `Chain Name: `
    },
    {
        name: `privateKey`,
        message: `Private Key: `
    },
    {
        name: `publicKey`,
        message: `Public Key: `
    },
    {
        name: `multiSigAddress`,
        message: `Multi Sig Address: `
    },
    {
        name: `gasPrice`,
        message: `Gas Price: `
    },
    {
        name: `gasLimit`,
        message: `Gas Limit: `
    },
    {
        name: `transferFee`,
        message: `Bridge Transfer Fee: `
    }
];

async function deploymentLoop() {
    let defaultCBChainId = 0;
    
    async function deployOnChain() {
        try {
            let ans = await inquirer.prompt(deploymentConfigQueries);
            ans.gasLimit = parseInt(ans.gasLimit);
            ans.gasPrice = parseInt(ans.gasPrice);
            ans.ethNetId = parseInt(ans.ethNetId);
            ans.transferFee = parseInt(ans.transferFee);

            let { chainWallet, chainProvider } = getWalletAndProvider(ans.rpcUrl, ans.privateKey, ans.ethNetId);
    
            // Deployment of main bridge and handler contracts
            const deployedBridgeContractAddress = await deployBridgeContract(defaultCBChainId, [], chainWallet, undefined, ans.transferFee, undefined, ans.gasPrice, ans.gasLimit);
            const deployedHandlerAddress = await deployERC20Handler(deployedBridgeContractAddress, chainWallet, ans.gasPrice, ans.gasLimit);
    
            // Deploy mintable factory contract
            const mintableCoinFactoryAddress = await deployMintableCoinFactory(chainWallet, ans.gasPrice, ans.gasLimit);
            const cloneableMintableERC20Address = await deployCloneableERC20(chainWallet, ans.gasPrice, ans.gasLimit);
    
            //  renounceRole AS MINTER, PAUSER, ADMIN give admin to factory
            await setCloneableCoinAddress(mintableCoinFactoryAddress, cloneableMintableERC20Address, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 1, true, ans.publicKey, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 2, true, ans.publicKey, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 0, false, mintableCoinFactoryAddress, chainProvider, chainWallet);
            await revokeGrantERC20Role(cloneableMintableERC20Address, 0, true, ans.publicKey, chainProvider, chainWallet);
    
    
            if (ans.multiSigAddress.length) {
                await renounceBridgeAdmin(deployedBridgeContractAddress, chainWallet, chainProvider, ans.multiSigAddress, ans.chainName);
            }
    
            let chainBridgeConfig = createChainConfig(ans.chainName,
                defaultCBChainId.toString(),
                deployedBridgeContractAddress,
                deployedHandlerAddress,
                ans.gasLimit,
                ans.gasPrice,
                ans.rpcUrlWs.length ? ans.rpcUrlWs : ans.rpcUrl,
                undefined,
                mintableCoinFactoryAddress);
    
            const deploymentFile = publishChainConfiguration(chainBridgeConfig);
            console.log(`Chainbridge contracts deployed and configuration written to publish/${deploymentFile}`);

        } catch (err) {
            console.error(`Deployment failed: ${err.message}`);
            process.exit(1);
        }


        let questions = [{ name: 'deployChoice', message: 'Deploy on another chain? (y/n): '}];
        ans = await inquirer.prompt(questions);

        if (ans.deployChoice === 'y') {
            defaultCBChainId++;
            deployOnChain();
            return Promise.resolve();
        } else {
            console.log(`Finished deployment on ${defaultCBChainId+1} chains.`);
            process.exit(1);
        }
    }

    await deployOnChain();
}

exports.deployChainbridge = new commander.Command("deployChainbridge")
    .action(async args => {
        try {
            console.log(`Deploying chainsafe's chainbridge... `);
            await deploymentLoop();            

        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    });
