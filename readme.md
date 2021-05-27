#  Bridge deployment for Edgeware <-> Ethereum  
We have used ChainSafe's Chainbridge template to build a bridge between Edgeware and Ethereum.

## Dependancies (Linux)
  Install node dependancies using
  ``` yarn install ```
  
  Install make for linux using
  ``` sudo apt-get install build-essential ```
  
  Install go using
  ```
  wget -c https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local

  export PATH=$PATH:/usr/local/go/bin
  source ~/.profile

  # go version go1.14.2 linux/amd64
  go version

  mkdir ~/go
  ```

  Install [docker](https://docs.docker.com/engine/install/ubuntu/).

  
##  Deployment
1. To deploy contracts on either side of the bridge, we need to first set the following variables in ```deploy.env``` file within ```env``` folder.
```
SRC_CHAIN_NETWORK_ID=
SRC_CHAIN_NAME=
SRC_ADDRESS=
SRC_CHAIN_PRIVATE_KEY=
SRC_CHAIN_RPC_HTTPS=
SGAS_LIMIT=
SGAS_PRICE=
# multi sig and ws endpoints are optional
SRC_CHAIN_RPC_WS=
SRC_MULTISIG=

DEST_CHAIN_NETWORK_ID=
DEST_CHAIN_NAME=
DEST_ADDRESS=
DEST_CHAIN_PRIVATE_KEY=
DEST_CHAIN_RPC_HTTPS=
DGAS_LIMIT=
DGAS_PRICE=
# multi sig and ws endpoints are optional
DEST_CHAIN_RPC_WS=
DEST_MULTISIG=

# 32 BYTE HEX string that identifies token on either side of the bridge
# Token Name and Symbol that gets deployed on destination chain
SRC_TOKEN=
SRC_DECIMALS=
RESOURCE_ID=
TARGET_TOKEN_NAME=
TARGET_TOKEN_SYMBOL=

# in Wei
BRIDGE_TRANSFER_FEE=
```
2. After initializing all the values, run ```yarn deploy``` to deploy the bridge. This will deploy all the contracts required for the bridge to work on both chains.

## Setup relayer
To run as a relayer on one of deployed bridge, the following steps are required:
1.  Get ```relayer``` role granted on the bridge where you want to run as a relayer.
2.  Setup the repository.
3.  Rename ```relayer.env.example``` to ```relayer.env``` within env directory and set these environment variables.
```bash
# BRIDGE=goerli_beresheet | rinkeby_beresheet only for now
BRIDGE=
CH1_ADDR=
CH1_PK=

CH2_ADDR=
CH2_PK=
KEYSTORE_PASSWORD=
```
4.  run ```yarn setup-relayer``` to create a configuration file for an existing bridge.

**Note:** If the scripts fail to run due to permission errors, please provide execution permission to all the files in the scripts folder.

## Start Relayer
Copmplete setting up the relayer config using setup relayer section and run ```yarn start-relayer```, if you want to run relayer in a docker container run previous command with ```-e docker```.

## Mintable Token deployment
1. To deploy a mintable token on the destination side of the bridge, create a file called ```factory``` and copy and update the following variables in it
```bash
RPC_URL=
CHAIN_ID=
PRIVATE_KEY=
FACTORY_ADDRESS=
TOKEN_NAME=
TOKEN_SYMBOL=
TOKEN_DECIMALS=
HANDLER_ADDR=
```
2. Run ```set -a;. factory;set +a```
3. Finally
```bash
node index.js createToken --rpcUrl $RPC_URL --privateKey $PRIVATE_KEY --factoryAddress $FACTORY_ADDRESS --chainId $CHAIN_ID --tokenName $TOKEN_NAME --tokenSymbol $TOKEN_SYMBOL --tokenDecimals $TOKEN_DECIMALS --ercHandlerAddress $HANDLER_ADDR
```

## Mint Tokens
1. Create file mint
```bash
AMOUNT=
ERC20ADDR=
RPC_URL=
PRIVATE_KEY=
CHAIN_ID=
```
2. Run ```set -a;. mint;set +a```
3. Finally
```bash
node index.js mintTokens --rpcUrl $RPC_URL --privateKey $PRIVATE_KEY --erc20Addr $ERC20ADDR --chainId $CHAIN_ID --amount $AMOUNT
```

## Token Transfer
1. To initiate a transfer using cli on an existing bridge, create a file called ```transfer``` and copy and update the following variables in it
```bash
RPC_URL=
PRIVATE_KEY=
ETH_CHAIN_ID=
BRIDGE_ADDR=
ERC20_ADDR=
RECIPIENT=
AMOUNT=
DECIMALS=
RES_ID=
HANDLER_ADDR=
DEST_CHAIN_ID=
GAS_PRICE=
GAS_LIMIT=
```
2. Run ```set -a;. transfer;set +a```
3. Finally
```bash
node index.js bridgeTokenTransfer --rpcUrl $RPC_URL --privateKey $PRIVATE_KEY --ethChainId $ETH_CHAIN_ID --bridgeAddress $BRIDGE_ADDR --erc20Address $ERC20_ADDR --recipient $RECIPIENT --amount $AMOUNT --decimals $DECIMALS --resourceId $RES_ID --handlerAddress $HANDLER_ADDR --destinationChainBridgeChainId $DEST_CHAIN_ID --gasPrice $GAS_PRICE --gasLimit $GAS_LIMIT
```
