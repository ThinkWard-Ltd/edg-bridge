#!/bin/bash
cd env; . relayer.env;
cd ../relayer;
docker run  -d --restart=always -e KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD -v `pwd`/config.json:/config.json -v `pwd`/keys/:/keys/ chainsafe/chainbridge:1.1.1  --verbosity trace --latest