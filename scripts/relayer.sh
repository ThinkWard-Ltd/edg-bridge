#!/bin/bash

while getopts e: flag
do
    case "${flag}" in
        e) exe=${OPTARG};;
    esac
done

if [ "$exe" = "docker" ]; then
    cd env; . relayer.env;
    cd ../relayer;
    docker run  -d --restart=always -e KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD -v `pwd`/config.json:/config.json -v `pwd`/keys/:/keys/ chainsafe/chainbridge:1.1.1  --verbosity trace --latest
else
    cd env; . relayer.env;
    cd ../relayer;
    sudo make build;
    export KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD
    ./build/chainbridge --config config.json --verbosity trace --latest
fi