const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DLToken", function () {
  async function deployDLTokenFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const DLToken = await ethers.getContractFactory("DLToken");
    const dlToken = await DLToken.deploy("Muhammed Musa", "MM");
    return { dlToken, owner, otherAccount };
  }

  it("Should set the right owner", async function () {
    const { dlToken, owner } = await loadFixture(deployDLTokenFixture);
    expect(await dlToken.owner()).to.equal(owner.address);
  });

  it("Should set the correct token name and symbol", async function () {
    const { dlToken } = await loadFixture(deployDLTokenFixture);
    expect(await dlToken.getTokenName()).to.equal("Muhammed Musa");
    expect(await dlToken.getSymbol()).to.equal("MM");
  });

  it("Should mint initial supply to owner", async function () {
    const { dlToken, owner } = await loadFixture(deployDLTokenFixture);
    const expectedSupply = ethers.parseUnits("1000000", 18);
    expect(await dlToken.balanceOf(owner.address)).to.equal(expectedSupply);
  });

  it("Should transfer tokens between accounts and burn 5%", async function () {
    const { dlToken, owner, otherAccount } = await loadFixture(
      deployDLTokenFixture
    );
    const transferAmount = ethers.parseUnits("100", 18);
    const burnAmount = (transferAmount * 5n) / 100n;
    const actualTransferAmount = transferAmount - burnAmount;

    await expect(dlToken.transfer(otherAccount.address, transferAmount))
      .to.emit(dlToken, "Transfer")
      .withArgs(owner.address, otherAccount.address, actualTransferAmount)
      .to.emit(dlToken, "Transfer")
      .withArgs(owner.address, ethers.ZeroAddress, burnAmount);

    expect(await dlToken.balanceOf(otherAccount.address)).to.equal(
      actualTransferAmount
    );
    expect(await dlToken.balanceOf(owner.address)).to.equal(
      ethers.parseUnits("999900", 18)
    );
    expect(await dlToken.getTotalSupply()).to.equal(
      ethers.parseUnits("999995", 18)
    );
  });

  it("Should fail if sender doesn't have enough tokens", async function () {
    const { dlToken, owner, otherAccount } = await loadFixture(
      deployDLTokenFixture
    );
    const initialOwnerBalance = await dlToken.balanceOf(owner.address);

    await expect(
      dlToken.connect(otherAccount).transfer(owner.address, 1)
    ).to.be.revertedWith("Insufficient balance");

    expect(await dlToken.balanceOf(owner.address)).to.equal(
      initialOwnerBalance
    );
  });

  it("Should approve tokens for delegated transfer", async function () {
    const { dlToken, owner, otherAccount } = await loadFixture(
      deployDLTokenFixture
    );
    const approveAmount = ethers.parseUnits("100", 18);

    await expect(dlToken.approve(otherAccount.address, approveAmount))
      .to.emit(dlToken, "Approval")
      .withArgs(owner.address, otherAccount.address, approveAmount);

    expect(
      await dlToken.allowance(owner.address, otherAccount.address)
    ).to.equal(approveAmount);
  });

  it("Should transfer tokens using transferFrom and burn 5%", async function () {
    const { dlToken, owner, otherAccount } = await loadFixture(
      deployDLTokenFixture
    );
    const approveAmount = ethers.parseUnits("100", 18);
    const transferAmount = ethers.parseUnits("50", 18);
    const burnAmount = (transferAmount * 5n) / 100n;
    const actualTransferAmount = transferAmount - burnAmount;

    await dlToken.approve(otherAccount.address, approveAmount);

    await expect(
      dlToken
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, transferAmount)
    )
      .to.emit(dlToken, "Transfer")
      .withArgs(owner.address, otherAccount.address, actualTransferAmount)
      .to.emit(dlToken, "Transfer")
      .withArgs(owner.address, ethers.ZeroAddress, burnAmount);

    expect(await dlToken.balanceOf(otherAccount.address)).to.equal(
      actualTransferAmount
    );
    expect(await dlToken.balanceOf(owner.address)).to.equal(
      ethers.parseUnits("999950", 18)
    );
    expect(await dlToken.getTotalSupply()).to.equal(
      ethers.parseUnits("999997.5", 18)
    );
    expect(
      await dlToken.allowance(owner.address, otherAccount.address)
    ).to.equal(approveAmount - transferAmount);
  });

  it("Should burn 5% of tokens on transfer", async function () {
    const { dlToken, owner, otherAccount } = await loadFixture(
      deployDLTokenFixture
    );
    const transferAmount = ethers.parseUnits("100", 18);
    const burnAmount = (transferAmount * 5n) / 100n;

    await dlToken.transfer(otherAccount.address, transferAmount);

    expect(await dlToken.getTotalSupply()).to.equal(
      ethers.parseUnits("999995", 18)
    );
  });
});
