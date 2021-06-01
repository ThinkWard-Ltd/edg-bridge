#!/bin/bash
set -a; . ./env/relayer.env; set +a;

if test -f "./deployments/$BRIDGE.json"; then
    cp ./deployments/$BRIDGE.json ./relayer/config.json
fi
cd ./relayer;
make build;

SPKFILE=keys/"$CH1_ADDR".key
if [ ! -f "$SPKFILE" ]; then
./build/chainbridge accounts import --privateKey $CH1_PK --password $KEYSTORE_PASSWORD
fi

DPKFILE=keys/"$CH2_ADDR".key
if [ ! -f "$DPKFILE" ]; then 
./build/chainbridge accounts import --privateKey $CH2_PK --password $KEYSTORE_PASSWORD
fi
