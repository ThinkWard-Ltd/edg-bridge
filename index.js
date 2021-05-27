const commander = require('commander');

const { deployBridge } = require('./cli/deploy');
const { setupRelayer } = require('./cli/relayer');
const { createToken, mintTokens } = require('./cli/erc20');

let program = new commander.Command();
program.addCommand(createToken);
program.addCommand(mintTokens);
program.addCommand(deployBridge);
program.addCommand(setupRelayer);

program.allowUnknownOption(false);

const run = async () => {
    try {
        await program.parseAsync(process.argv);
    } catch (e) {
        console.log({ e });
        process.exit(1)
    }
}


if (process.argv && process.argv.length <= 2) {
    program.help();
} else {
    run()
}