import { ethers } from "hardhat";
import { expect } from "chai";
import axios from "axios";
import { Signer } from "ethers";
import fs from "fs";
const parseUnits = ethers.utils.parseUnits;
const formatUnits = ethers.utils.formatUnits;
async function getBAYCOrderParams(tokenId: number) {
  try {
    const { data, status } = await axios.get(
      `https://api.opensea.io/v2/orders/ethereum/seaport/listings?asset_contract_address=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d&limit=10&token_ids=${tokenId}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": "47605c2529cb49e38c2fd2d9a47ac61d",
        },
      }
    );

    // console.log(JSON.stringify(data, null, 4));

    return data.orders[0].protocol_data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("error message: ", error.message);
      return error.message;
    } else {
      console.log("unexpected error: ", error);
      return "An unexpected error occurred";
    }
  }
}
describe("Comptroller test", function () {
  let owner: Signer;
  let ownerAddress: string;
  let nonOwner: Signer;
  let nonOwnerAddress: string;
  let randomGuy: Signer;
  let randomGuyAddress: string;
  
  let zBondAddress: string;
  let zNftAddress: string;
  let ethWhaleAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  let ethWhale: Signer;
  let oneMonth = 60 * 60 * 24 * 30;
  let orderParams: any;
  before(async function () {
    orderParams = await getBAYCOrderParams(5523);
  });

  beforeEach(async function () {
    
    const signers = await ethers.getSigners();
    owner = signers[0];
    ownerAddress = await owner.getAddress();
    nonOwner = signers[1];
    nonOwnerAddress = await nonOwner.getAddress();
    randomGuy = signers[2];
    randomGuyAddress = await randomGuy.getAddress();


  });
  describe.only("bnpl", async function () {
    it("can buyNowPayLater", async function () {
      console.log(orderParams);
      console.log("done");
      let additionalRecipients = [];
      for (var i = 1; i < orderParams.parameters.consideration.length; i++) {
        additionalRecipients.push([
          orderParams.parameters.consideration[i].endAmount,
          orderParams.parameters.consideration[i].recipient,
        ]);
      }
      const considerationToken = orderParams.parameters.consideration[0].token;
      const considerationIdentifier =
        orderParams.parameters.consideration[0].identifierOrCriteria;
      const considerationAmount =
        orderParams.parameters.consideration[0].endAmount;
      const offerer = orderParams.parameters.offerer;
      const zone = orderParams.parameters.zone;
      const offerToken = orderParams.parameters.offer[0].token;
      const offerIdentifier =
        orderParams.parameters.offer[0].identifierOrCriteria;
      const offerAmount = orderParams.parameters.offer[0].endAmount;
      const basicOrderType = orderParams.parameters.orderType;
      const startTime = orderParams.parameters.startTime;
      const endTime = orderParams.parameters.endTime;
      const zoneHash = orderParams.parameters.zoneHash;
      const salt = orderParams.parameters.salt;
      const offererConduitKey = orderParams.parameters.conduitKey;
      const fulfillerConduitKey = orderParams.parameters.conduitKey;
      const totalOriginalAdditionalRecipients =
        orderParams.parameters.consideration.length - 1;
      const signature = orderParams.signature;
      console.log([
        considerationToken,
        considerationIdentifier,
        considerationAmount,
        offerer,
        zone,
        offerToken,
        offerIdentifier,
        offerAmount,
        basicOrderType,
        startTime,
        endTime,
        zoneHash,
        salt,
        offererConduitKey,
        fulfillerConduitKey,
        totalOriginalAdditionalRecipients,
        additionalRecipients,
        signature,
      ]);
      const calldata = ethers.utils.defaultAbiCoder.encode(
        [
          "address",
          "uint256",
          "uint256",
          "address",
          "address",
          "address",
          "uint256",
          "uint256",
          "uint8",
          "uint256",
          "uint256",
          "bytes32",
          "uint256",
          "bytes32",
          "bytes32",
          "uint256",
          "tuple(uint256,address)[]",
          "bytes",
        ],
        [
          considerationToken,
          considerationIdentifier,
          considerationAmount,
          offerer,
          zone,
          offerToken,
          offerIdentifier,
          offerAmount,
          basicOrderType,
          startTime,
          endTime,
          zoneHash,
          salt,
          offererConduitKey,
          fulfillerConduitKey,
          totalOriginalAdditionalRecipients,
          additionalRecipients,
          signature,
        ]
      );
      const seaport = 1;
      let pars = [
        considerationToken,
        considerationIdentifier,
        considerationAmount,
        offerer,
        zone,
        offerToken,
        offerIdentifier,
        offerAmount,
        basicOrderType,
        startTime,
        endTime,
        zoneHash,
        salt,
        offererConduitKey,
        fulfillerConduitKey,
        totalOriginalAdditionalRecipients,
        additionalRecipients,
        signature,
      ];
      let contractParams:any;
      contractParams = {
        offerer:offerer,
        zone:zone,
        basicOrderType:`${basicOrderType}`,
        offerToken:offerToken,
        offerIdentifier:offerIdentifier,
        offerAmount:offerAmount,
        considerationToken:considerationToken,
        considerationIdentifier:considerationIdentifier,
        considerationAmount:considerationAmount,
        startTime:startTime,
        endTime:endTime,
        zoneHash:zoneHash,
        salt:salt,
        totalOriginalAdditionalRecipients:`${totalOriginalAdditionalRecipients}`,
        signature:signature,
        offererConduitKey:offererConduitKey,
        fulfillerConduitKey:ethers.constants.HashZero,
        additionalRecipients,
      }
      console.log(contractParams)
    //   await protocol.bnpl.buyNowPayLater(seaport, oneMonth, calldata, {
    //     value: ethers.utils.parseEther("70"),
    //   });
      const seaportAddress = "0x00000000006c3852cbEf3e08E8dF289169EdE581";
      const seaportABI = JSON.parse((fs.readFileSync("./artifacts/contracts/Seaport.sol/Seaport.json")).toString())["abi"];
      let seaportContract = new ethers.Contract(seaportAddress, seaportABI, ethers.provider);
      const hundredEth = ethers.utils.parseEther("475");

      const tx = await seaportContract.connect(randomGuy).fulfillBasicOrder(contractParams, {
        value: hundredEth
      });
      console.log(tx);

    //   let fact = await ethers.getContractFactory("Seaport")
    //   let sp = fact.attach("0x00000000006c3852cbef3e08e8df289169ede581")
      
    //   let fulfillFragment =fact.interface.getFunction("fulfillBasicOrder")
    //   var toggle_data = fact.interface.encodeFunctionData(fulfillFragment, [pars])
    //   console.log(toggle_data)
    //   const data = await ethers.provider.call({
    //     to: "0x00000000006c3852cbef3e08e8df289169ede581",
    //     value: ethers.utils.parseEther("70"),
    //     data: toggle_data
    //   })
      
    });
  });
});


// offerer:
// 0x815E7D1530B0493747e07c4813e6C177Fb916878
// offer:
// 0:
// itemType:
// 2
// token:
// 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D
// identifierOrCriteria:
// 5523
// startAmount:
// 1
// endAmount:
// 1
// consideration:
// 0:
// itemType:
// 0
// token:
// 0x0000000000000000000000000000000000000000
// identifierOrCriteria:
// 0
// startAmount:
// 446500000000000000000
// endAmount:
// 446500000000000000000
// recipient:
// 0x815E7D1530B0493747e07c4813e6C177Fb916878
// 1:
// itemType:
// 0
// token:
// 0x0000000000000000000000000000000000000000
// identifierOrCriteria:
// 0
// startAmount:
// 11750000000000000000
// endAmount:
// 11750000000000000000
// recipient:
// 0x8De9C5A032463C561423387a9648c5C7BCC5BC90
// 2:
// itemType:
// 0
// token:
// 0x0000000000000000000000000000000000000000
// identifierOrCriteria:
// 0
// startAmount:
// 11750000000000000000
// endAmount:
// 11750000000000000000
// recipient:
// 0xAAe7aC476b117bcCAfE2f05F582906be44bc8FF1
// startTime:
// 1657605866
// endTime:
// 1658206307
// orderType:
// 2
// zone:
// 0x004C00500000aD104D7DBd00e3ae0A5C00560C00
// zoneHash:
// 0x0000000000000000000000000000000000000000000000000000000000000000
// salt:
// 41293457715090288
// conduitKey:
// 0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000
// counter:
// 0



// 0x9ab363ec34629703ab4cff75a922aab99d3acfb1c9b893a9830446814ff16b9b0d38f7678dc05af7fe2bdca27251cecc23612108c7e495a1210c3edc1aea8a451b


// 0xfb0f3ee1
// 0000000000000000000000000000000000000000000000000000000000000020
// 0000000000000000000000000000000000000000000000000000000000000000
// 0000000000000000000000000000000000000000000000000000000000000000
// 0000000000000000000000000000000000000000000000000f01a35bbfbfd000
// 000000000000000000000000a56722038b232f9a7fcb309fd533e284b9a3e5bc
// 000000000000000000000000004c00500000ad104d7dbd00e3ae0a5c00560c00
// 000000000000000000000000306b1ea3ecdf94ab739f1910bbda052ed4a9f949
// 00000000000000000000000000000000000000000000000000000000000043b3
// 0000000000000000000000000000000000000000000000000000000000000001
// 0000000000000000000000000000000000000000000000000000000000000002
// 0000000000000000000000000000000000000000000000000000000062ccdebb
// 0000000000000000000000000000000000000000000000000000000062d6193b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4d7be5b121cfb0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f00000000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000067d3fb8f8f90000000000000000000000000008de9c5a032463c561423387a9648c5c7bcc5bc9000000000000000000000000000000000000000000000000000cfa7f71f1f2000000000000000000000000000b4d24dacbdffa1bbf9a624044484b3feeb7fdf740000000000000000000000000000000000000000000000000000000000000041f40ee85aca16d877321232deb8f492241fe2a823d921ec97c9337c4e643bfd3f1fec134cb469ce9c55d8ff82f02a98f1c3d2b3d01934e6211a7099a067998a771c00000000000000000000000000000000000000000000000000000000000000