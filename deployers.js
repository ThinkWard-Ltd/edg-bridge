const ethers = require("ethers");
const { ContractABIs } = require("./constants");

exports.deployBridgeContract = async function (chainId, initialRelayers, wallet, relayerThreshold = 1, fee = 0, proposalExpiry = 100, gasPrice, gasLimit) {
    console.log(`Deploying bridge contract...`);
    let factory = new ethers.ContractFactory(ContractABIs.Bridge.abi, ContractABIs.Bridge.bytecode, wallet);
    let contract = await factory.deploy(
        chainId.toString(),
        initialRelayers,
        relayerThreshold.toString(),
        ethers.utils.parseEther(fee.toString()),
        proposalExpiry.toString(), { gasPrice, gasLimit }
    );
    await contract.deployed();
    return contract.address;
}

exports.deployERC20Handler = async function (bridgeAddress, wallet, gasPrice, gasLimit) {
    console.log(`Deploying ERC20 Handler...`);
    const factory = new ethers.ContractFactory(ContractABIs.Erc20Handler.abi, ContractABIs.Erc20Handler.bytecode, wallet);
    const contract = await factory.deploy(bridgeAddress, [], [], [], { gasPrice, gasLimit });
    await contract.deployed();
    return contract.address;
}

exports.deployMintableCoinFactory = async function (wallet, gasPrice, gasLimit) {
    console.log(`Deploying MintableCoinFactory...`);
    const factory = new ethers.ContractFactory(ContractABIs.MintableCoinFactory.abi, ContractABIs.MintableCoinFactory.bytecode, wallet);
    const contract = await factory.deploy({ gasPrice, gasLimit });
    await contract.deployed();
    return contract.address;
}

exports.deployCloneableERC20 = async function (wallet, gasPrice, gasLimit) {
    console.log(`Deploying CloneableMintableERC20...`);
    const factory = new ethers.ContractFactory(ContractABIs.CloneableMintableERC20.abi, ContractABIs.CloneableMintableERC20.bytecode, wallet);
    const contract = await factory.deploy("", "", 0, { gasPrice, gasLimit });
    await contract.deployed();
    return contract.address;
}