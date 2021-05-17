const ethers = require('ethers');
const fs = require('fs');
const solc = require('solc');
const path = require('path');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.waitForTx = async (provider, hash) => {
    console.log(`[${hash}] Waiting for transaction...`);
    while (!await provider.getTransactionReceipt(hash)) {
        sleep(5000)
    }
}

exports.splitCommaList = (csl) => csl.split(",")

exports.getWalletAndProvider = function(rpcUrl, privateKey, chainNetworkId = undefined) {
    let chainProvider = chainNetworkId
      ? new ethers.providers.JsonRpcProvider(rpcUrl, {
          name: "custom",
          chainId: chainNetworkId,
        })
      : new ethers.providers.JsonRpcProvider(rpcUrl);
    let chainWallet = new ethers.Wallet(privateKey, chainProvider);
    return { chainProvider, chainWallet };
}

exports.expandDecimals = function (amount, decimals = 18) {
    return ethers.utils.parseUnits(String(amount), decimals);
}


exports.compileMintableERC20 = async function(tokenName, tokenSymbol, decimalPlaces = 18) {
    const input = {
        language: 'Solidity',
        sources: {
            'ExtendedERC20PresetMinterPauser.sol': {
                content: fs.readFileSync(`./contracts/custom/ExtendedERC20PresetMinterPauser.sol`, { encoding: 'utf-8' })
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    var output = JSON.parse(solc.compile(JSON.stringify(input), { import: getContents }));
    return output.contracts['ExtendedERC20PresetMinterPauser.sol']['ExtendedERC20PresetMinterPauser']
}

function getContents(fileName) {
    try {
        let contents = fs.readFileSync(`./contracts/custom/${fileName}`, { encoding: 'utf-8' });
        return { contents };
    } catch (err) {
        return { error: 'File not found!' };
    }
}

exports.createChainConfig = function (chainName, chainId, bridgeAddress, erc20handlerAddress, gasLimit = 8000000, gasPrice = 100000000000, endpoint = '', relayerAddress = '') {
    let chainConfig = {
        endpoint,
        from: relayerAddress,
        id: chainId,
        type: "ethereum",
        name: chainName,
        opts: {
            bridge: bridgeAddress,
            erc20Handler: erc20handlerAddress,
            genericHandler: erc20handlerAddress,
            gasLimit: gasLimit.toString(),
            maxGasPrice: gasPrice.toString()
        }
    }

    if (endpoint.length && endpoint.startsWith('http')) chainConfig.opts['http'] = 'true';
    return chainConfig;
}

exports.publishChainConfiguration = function (chainConfig) {
    let publishPath = path.join(__dirname, './publish/');
    if (!fs.existsSync(publishPath)) fs.mkdirSync(publishPath);
    let fileName = `bridge-${chainConfig.name}-${Date.now()}.json`;
    fs.writeFileSync(publishPath + fileName, JSON.stringify(chainConfig), 'utf-8');
    return fileName;
}

exports.publishRelayerConfiguration = function (relayerConfig) {
    let publishPath = path.join(__dirname, './publish/');
    if (!fs.existsSync(publishPath)) fs.mkdirSync(publishPath);
    let fileName = `bridge-${relayerConfig.chains[0].name}-${relayerConfig.chains[1].name}-${Date.now()}.json`;
    fs.writeFileSync(publishPath + fileName, JSON.stringify(relayerConfig), 'utf-8');
    return fileName;
}

exports.createRelayerConfig = function(chain1Config, chain2Config, srcFactory, destFactory) {
    let factories = {
        [chain1Config.id]: srcFactory,
        [chain2Config.id]: destFactory
    };

    return {
        chains: [chain1Config, chain2Config],
        factories
    }
}

exports.expandDecimals = function (amount, decimals = 18) {
    return ethers.utils.parseUnits(String(amount), decimals);
}

exports.buildDepositParams = function (recipient, amount, decimals) {
    return '0x' +
        ethers.utils.hexZeroPad(ethers.utils.bigNumberify(expandDecimals(amount, decimals)).toHexString(), 32).substr(2) +
        ethers.utils.hexZeroPad(ethers.utils.hexlify((recipient.length - 2)/2), 32).substr(2) +
        recipient.substr(2)
}