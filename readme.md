# Edgeware <> Ethereum Bridge Docs

We've used ChainSafe's ChainBridge template to build a bridge between Edgeware and Ethereum. In its current state the bridge operates under a trusted federation model. Deposit events on one chain are detected by a trusted set of off-chain relayers who await finality, submit events to the other chain and vote on submissions to reach acceptance triggering the appropriate handler.

## Try the TestNet

We've deployed contracts and set up a relayer between Ethereum's Goerli TestNet and  Edgware's Beresheet TestNet. The TestNet bridge currently only supports a fake USDC token which can be minted [here](https://goerli.etherscan.io/address/0x76D60f8eC8a1A7adccE74915394644C589fB12f6#writeContract). Note after minting you can check your balance by adding the token to MetaMask.

### Try the TestNet UI

You can try out the UI **here**. 

### Goerli <> Beresheet Bridge Info

```bash
# Goerli 
Bridge Contract: 0x...
Beresheet ERC-20 Handler Contract:
Mintable Token Factory Contract:
MultSig Address:

# Beresheet 
Bridge Contract:
Beresheet ERC-20 Handler Contract:
Mintable Token Factory Contract:
MultSig Address: 

# Registered Tokens Goerli <> Beresheet
Token Name | ResourceID | Address
USDC         12....       0x... 

```

### Use it in your own project

To execute a transfer from a source chain to a destination chain you will need to do the following:

1. Approve the source chain handler contract as a spender of the ERC20 token
2. Use the **deposit** method on the source bridge contract to send tokens from the source chain to target chain

You can find an example script [here](https://github.com/dtradeorg/usdc-bridge/blob/master/cli/bridgeTokenTransfer.js)

---

## Dependencies
[![yarn](https://img.shields.io/npm/v/yarn?label=yarn)](#) 
[![node](https://img.shields.io/npm/v/node?label=node)](#) 

### Linux

Install yarn

Install project node dependancies using `yarn install`

Install make for linux using `sudo apt-get install build-essential`

Install Go using: 

```jsx
wget -c https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local

export PATH=$PATH:/usr/local/go/bin
source ~/.profile

# go version go1.14.2 linux/amd64
go version

mkdir ~/go
```

Install [docker](https://docs.docker.com/engine/install/ubuntu/).

### Mac

Install yarn

Install project node dependancies using `yarn install`

Install [Go](https://jimkang.medium.com/install-go-on-mac-with-homebrew-5fa421fc55f5)

Install [docker](https://docs.docker.com/docker-for-mac/install/) for mac

## ERC-20 Token Registration

To add a new token to the bridge, you will need a regular ERC-20 token deployed on the source chain and you will need to deploy a mintable ERC-20 token with the same name, symbol and decimal places on the destination chain. You can use the following steps to deploy the mintable token on the destination chain:

1. Clone this repository and install all **dependencies** noted above
2. Create a file called `factory` and set the following variables in it

    ```
    RPC_URL=
    CHAIN_ID=
    PRIVATE_KEY=
    FACTORY_ADDRESS= # Use appropiate dest chain factory address noted earlier
    TOKEN_NAME=
    TOKEN_SYMBOL=
    TOKEN_DECIMALS=
    MULTISIG_ADDRESS= # Use appropiate dest chain multisig address noted earlier
    ```

3. Run `set -a;. factory;set +a`
4. Finally run

    ```
    node index.js createToken --rpcUrl $RPC_URL /--privateKey $CHAIN_ID /--factoryAddress $FACTORY_ADDRESS /--chainId $CHAIN_ID /--tokenName $TOKEN_NAME /--tokenSymbol $TOKEN_SYMBOL /--tokenDecimals $TOKEN_DECIMALS /--multiSigAddress $MULTISIG_ADDRESS
    ```

This creates a mintable token using the provided private key and afterwards transfers ownership to multisig address.  The command will return the contract address. 
To register this new token on the deployed Goerli <> Beresheet TestNet Bridge please open an **issue here** and provide the token contract address on the source chain and the mintable token contract address on the destination chain.

Note that the multisig will renounce contract ownership after registering the token.

## Become a Relayer

### Setup Relayer

1. Get `relayer` role granted on the bridge you want to run as a relayer on.  This can only be performed by the admin/multisig of the bridge. 
To become a relayer on the deployed Goerli <> Beresheet TestNet Bridge please open an **issue here** and provide your account address for each chain.
2. Clone this repository and install all **dependencies** noted above
3. Rename `relayer.env.example` to `relayer.env` (`/env` directory) and set the following variables:

    ```
    BRIDGE= # ex: goerli_beresheet (name of bridge config file in /deployment folder)
    CH1_ADDR= # relayer address
    CH1_PK= 

    CH2_ADDR= # relayer address
    CH2_PK=
    KEYSTORE_PASSWORD= # will be used to encrypt key file
    ```

4. Run `yarn setup-relayer` to create a configuration file

    **Note:** If the scripts fail to run due to permission errors, please provide execution permission to all the files in the scripts folder.

### Start Relayer / Relayer Service

After setting up the relayer, you can run `yarn start-relayer`. Alternatively, you can run the relayer in a Docker container,  `yarn start-relayer -e docker`. The container restarts itself if it incurs any errors. 

If prompted for password, enter your system user password.

---

## Deploying a Bridge

Note we have already deployed a Goerli <> Beresheet TestNet Bridge, use the following steps if you'd like to deploy the required contracts for another bridge (EVM chains only). 

1. Start by renaming `deploy.env.example` to `deploy.env` (`/env` directory) and setting the following variables:

    ```
    SRC_CHAIN_NETWORK_ID=
    SRC_CHAIN_NAME=
    SRC_ADDRESS=
    SRC_CHAIN_PRIVATE_KEY=
    SRC_CHAIN_RPC_HTTPS=
    SGAS_LIMIT=
    SGAS_PRICE=
    # multi sig and ws endpoints are optional
    SRC_MULTISIG=

    DEST_CHAIN_NETWORK_ID=
    DEST_CHAIN_NAME=
    DEST_ADDRESS=
    DEST_CHAIN_PRIVATE_KEY=
    DEST_CHAIN_RPC_HTTPS=
    DGAS_LIMIT=
    DGAS_PRICE=
    # multi sig and ws endpoints are optional
    DEST_MULTISIG=

    ## Note: If using multisig, leave the vairables below empty (they will be set later)

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

2. After setting all required values, run `yarn deploy -a`. This command deploys all required contracts on both sides of the bridge.
3. Under the `/publish` directory there will be a newly created config file, copy this file to the `/deployments` directory.