const commander = require('commander');

const { getWalletAndProvider } = require("../utils");
const { erc20Mint, createERC20ViaFactory } = require("../interactions");
const inquirer = require('inquirer');


let deploymentConfigQueries = [
    {
        name: `rpcUrl`,
        message: `Chain RPC Url (http): `
    },
    {
        name: `ethNetId`,
        message: `Ethereum Chain Id: `
    },
    {
        name: `privateKey`,
        message: `Private Key: `
    },
    {
        name: `gasPrice`,
        message: `Gas Price: `
    },
    {
        name: `gasLimit`,
        message: `Gas Limit: `
    }
];


exports.createToken = new commander.Command("createToken")
    .action(async function(args) {

        deploymentConfigQueries.push({name: `ercHandlerAddress`, message: `ERC20 Hanlder aadress: `});
        deploymentConfigQueries.push({name: `factoryAddress`, message: `ERC20 Factory address: `});
        deploymentConfigQueries.push({name: `tokenName`, message: `Token Name: `});
        deploymentConfigQueries.push({name: `tokenSymbol`, message: `Token Symbol: `});
        deploymentConfigQueries.push({name: `tokenDecimals`, message: `Token Decimals: `});

        let ans = await inquirer.prompt(deploymentConfigQueries);
        const { chainProvider, chainWallet } = getWalletAndProvider(ans.rpcUrl, ans.privateKey, Number(ans.chainId));

        await createERC20ViaFactory(ans.factoryAddress, ans.tokenName, ans.tokenSymbol, Number(ans.tokenDecimals), ans.ercHandlerAddress, chainWallet, chainProvider);
    });


exports.mintTokens = new commander.Command("mintTokens")
    .action(async function(args) {
        deploymentConfigQueries.push({name: `tokenName`, message: `Token Name: `});
        deploymentConfigQueries.push({name: `tokenSymbol`, message: `Token Symbol: `});
        deploymentConfigQueries.push({name: `tokenDecimals`, message: `Token Decimals: `});

        let ans = await inquirer.prompt(deploymentConfigQueries);
        const { chainProvider, chainWallet } = getWalletAndProvider(ans.rpcUrl, ans.privateKey, Number(ans.chainId));
        await erc20Mint(Number(ans.amount), ans.erc20Addr, chainWallet, chainProvider);
    })