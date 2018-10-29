var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var solc = require('solc');
var fs = require('fs');

// Connection
var account= "0x2401101eCED2508eEAF0A563F1e2b5B945Ee2060";
var pkey = "2d953cf811f1adefd422f27845820a28f5d0ffe517d4ac9f56aa385646c79356";
//account=  "0x618179114d77CE70899797b88BB2294c15ad5364";
//pkey=  "9216e258d39955a2eb8d19ff67b260827852891454cbb9e0c012620c6ed803f9";
var connInfo = {
	"conexion":{
	    "Mainnet": 'https://mainnet.infura.io/v3/66219843c1074abdacb74ccc2d1047b9',
	    "Ropsten": 'https://ropsten.infura.io/v3/66219843c1074abdacb74ccc2d1047b9',
	    "Rinkeby": 'https://mainnet.infura.io/v3/66219843c1074abdacb74ccc2d1047b9',
	    "local": 'http://localhost:8545'
	}
};
var provider = connInfo["conexion"].Ropsten;

console.log(provider);

var web3 = new Web3(new Web3.providers.HttpProvider(provider));

// contract source code
source = fs.readFileSync("contratos/ContratoPepito.sol", "utf8");
var compiled = solc.compile(source);
// Compile the contract to get the bytecode and the abi
var ContractName = Object.keys(compiled.contracts)[0];
var contract = compiled.contracts[ContractName];
var abi = contract.interface;
var parsedABI = JSON.parse(abi);
var bytecode = "0x" + contract.bytecode;
// Use the first contract
console.log("USING " + ContractName +  " == " + provider);



////Variables propias



//Deploying a contract has a minimum fee of 32000 gas, plus 200 gas per
// byte of the source code, as per Appendix G in the Ethereum yellow paper (The Create and CodeDeposit opcodes)
// OBJ: bytecode.length() ~= real length * 2, I don't care
console.log("largo:" + bytecode.length)
const deployCost = 32000 + (200 * bytecode.length);

// Some contracts has a payable constructor, must send them ethers...
var valueToSend = 0 // Web3.utils.toWei('1', 'ether');




Promise.all([web3.eth.getBalance(account),web3.eth.getGasPrice()])
        .then((vs) => {
            console.log("Account " + account + " balance " + vs[0]);
            var gasPrice = vs[1];
            console.log("Precio del gas " + gasPrice + " en wei");
            console.log("Se requiere " + deployCost + " gas");
            console.log("costo de la transaccion  " + (deployCost * gasPrice) + " en wei ");

            web3.eth.getTransactionCount(account).then((nonce) => {
                console.log("TX nonce " + nonce);
                var rawTx = {
                    nonce: web3.utils.toHex(nonce),
                    from: account,
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(deployCost),
                    value:  web3.utils.toHex(valueToSend),
                    data: bytecode
                };
                var tx = new Tx(rawTx);
                tx.sign(new Buffer.from(pkey, "hex"));
                var serializedTx = tx.serialize();
                web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                    .on('receipt', (tx) => {
                        console.log("Block hash " + tx.blockHash);
                        console.log("Block number " + tx.blockNumber);
                        console.log("Contract address " + tx.contractAddress);
                        console.log("Transaction hash " + tx.transactionHash);
                        console.log("Gas used " + tx.cumulativeGasUsed);
                    }).on('error', (error) => { console.log("ERROR " + error) });
            });
    });