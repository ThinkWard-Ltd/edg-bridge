const ethers = require("ethers");
const { ContractABIs, GAS_PRICE, GAS_LIMIT } = require("./constants");
const { waitForTx, expandDecimals } = require("./utils");

exports.setCloneableCoinAddress = async function (factoryAddress, cloneableContractAddress, chainProvider, wallet) {
    console.log(`Setting Cloneable address on factory ${factoryAddress}`);
    const factoryContract = new ethers.Contract(factoryAddress, ContractABIs.MintableCoinFactory.abi, wallet);
    const tx = await factoryContract.setMintableContractAddress(cloneableContractAddress);
    await waitForTx(chainProvider, tx.hash);
}

exports.revokeGrantERC20Role = async function (cloneableERC20Address, role, revoke, address, chainProvider, wallet) {
    let roles = [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
        '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'
    ]; // admin, minter, pauser
    console.log(`Updating Role ${cloneableERC20Address}`);
    const cloneableERC20 = new ethers.Contract(cloneableERC20Address, ContractABIs.CloneableMintableERC20.abi, wallet);
    if (revoke) {
        const tx = await cloneableERC20.renounceRole(roles[role], address, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT });
        await waitForTx(chainProvider, tx.hash);
    } else {
        const tx = await cloneableERC20.grantRole(roles[role], address, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT });
        await waitForTx(chainProvider, tx.hash);
    }
}

exports.registerResource = async function (bridgeAddress, handlerAddress, targetTokenAddress, resourceId, chainProvider, wallet) {
    const bridgeInstance = new ethers.Contract(bridgeAddress, ContractABIs.Bridge.abi, wallet);
    const tx = await bridgeInstance.adminSetResource(handlerAddress, resourceId, targetTokenAddress, { gasPrice: GAS_PRICE, gasLimit: GAS_LIMIT });
    await waitForTx(chainProvider, tx.hash);
}

exports.renounceBridgeAdmin = async function(bridgeAddress, chainWallet, chainProvider, multiSigAddress, chainName) {
    let bridgeInstance = new ethers.Contract(bridgeAddress, ContractABIs.Bridge.abi, chainWallet);

    let tx = await bridgeInstance.renounceAdmin(multiSigAddress);
    await waitForTx(chainProvider, tx.hash);
    console.log(`Transferred ${chainName} bridge ownership to ${multiSigAddress}`);
}

exports.erc20Approve = async function(erc20Address, recipient, decimals, amount, chainProvider, chainWallet, gasPrice, gasLimit) {
    const erc20Instance = new ethers.Contract(erc20Address, ContractABIs.Erc20Mintable.abi, chainWallet);
    console.log(`Approving ${recipient} to spend ${amount} tokens!`);
    let tx = await erc20Instance.approve(recipient, expandDecimals(amount, decimals), { gasPrice, gasLimit });
    await waitForTx(chainProvider, tx.hash)
}

exports.bridgeDeposit = async function(bridgeAddress, depositParams, resourceId, destinationChainId, gasPrice, gasLimit, chainWallet, chainProvider) {
    const bridgeInstance = new ethers.Contract(bridgeAddress, ContractABIs.Bridge.abi, chainWallet);
    tx = await bridgeInstance.deposit(destinationChainId, resourceId, depositParams, { gasPrice, gasLimit });
    await waitForTx(chainProvider, tx.hash);
}