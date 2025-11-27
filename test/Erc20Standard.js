import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20Token", function () {
  // Setup fixture function
  async function deployERC20TokenFixture() {
    const tokenName = "DLTAfrica Token";
    const tokenSymbol = "DLT";

    // get accounts from ethers
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();

    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
    const erc20token = await ERC20Token.deploy(tokenName, tokenSymbol);

    return {
      tokenName,
      tokenSymbol,
      erc20token,
      owner,
      account1,
      account2,
      account3,
    };
  }

  describe("Deployment Test", function () {
    it("Should set the right token name and symbol", async function () {
      const { tokenName, tokenSymbol, erc20token } = await loadFixture(
        deployERC20TokenFixture
      );

      expect(await erc20token.name()).to.equal(tokenName);
      expect(await erc20token.symbol()).to.equal(tokenSymbol);
    });

    it("Should assign owner at deployment", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20token.owner()).to.equal(owner.address);
    });

    it("Should update total supply after deployment", async function () {
      const { erc20token } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20token.totalSupply()).to.be.greaterThan(0);
    });

    it("Owner should have the total supply after deployment", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      const totalSupply = await erc20token.totalSupply();
      const ownerBal = await erc20token.balanceOf(owner.address);

      expect(ownerBal).to.equal(totalSupply);
    });
  });

  describe("Transfer Tests", function () {
    it("Should revert if sender is address zero", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        erc20token.connect(zeroSigner).transfer(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if recipient is address zero", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        erc20token.connect(owner).transfer(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount zero or less", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await expect(
        erc20token.connect(owner).transfer(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        erc20token.connect(owner).transfer(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should transfer tokens successfully", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const initialBalancOfAccount1 = await erc20token.balanceOf(
        account1.address
      );
      const initialbalanceOfOwner = await erc20token.balanceOf(owner.address);
      const amountToTransfer = hre.ethers.parseUnits("100", 18); //100 tokens

      const tx = await erc20token
        .connect(owner)
        .transfer(account1.address, amountToTransfer);

      const account1BalanceAfterTransfer = await erc20token.balanceOf(
        account1.address
      );
      const ownerBalanceAfterTransfer = await erc20token.balanceOf(
        owner.address
      );

      expect(account1BalanceAfterTransfer).to.be.greaterThan(
        initialBalancOfAccount1
      );
      expect(ownerBalanceAfterTransfer).to.be.lessThan(initialbalanceOfOwner);
      expect(account1BalanceAfterTransfer).to.equal(
        initialBalancOfAccount1 + amountToTransfer
      );
    });

    it("Should emit Transfer event on successful transfer", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token.connect(owner).transfer(account1.address, amountToTransfer)
      )
        .to.emit(erc20token, "Transfer")
        .withArgs(owner.address, account1.address, amountToTransfer);
    });
  });
});