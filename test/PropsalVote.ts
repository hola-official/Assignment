import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("ProposalVote", function () {
  async function deployProposalVoteFixture() {
    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const ProposalVote = await ethers.getContractFactory("ProposalVote");
    const proposalVote = await ProposalVote.deploy();
    return { proposalVote, owner, voter1, voter2, voter3 };
  }

  it("Should create a new proposal", async function () {
    const { proposalVote, owner } = await loadFixture(
      deployProposalVoteFixture
    );
    const name = "Test Proposal";
    const description = "This is a test proposal";
    const quorum = 3;

    await expect(proposalVote.createProposal(name, description, quorum))
      .to.emit(proposalVote, "ProposalCreated")
      .withArgs(name, quorum);

    const proposal = await proposalVote.getAProposal(0);
    expect(proposal.name_).to.equal(name);
    expect(proposal.desc_).to.equal(description);
    expect(proposal.quorum_).to.equal(quorum);
    expect(proposal.status_).to.equal(0);
  });

  it("Should not allow creation of proposal from zero address", async function () {
    const { proposalVote } = await loadFixture(deployProposalVoteFixture);
    await expect(
      proposalVote.createProposal("Test", "Description", 3, {
        from: ethers.ZeroAddress,
      })
    ).to.be.revertedWith("Zero address is not allowd");
  });

  it("Should allow voting on a proposal", async function () {
    const { proposalVote, owner, voter1 } = await loadFixture(
      deployProposalVoteFixture
    );
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await expect(proposalVote.connect(voter1).voteOnProposal(0))
      .to.emit(proposalVote, "ProposalActive")
      .withArgs("Test Proposal", 1);

    const proposal = await proposalVote.getAProposal(0);
    expect(proposal.count_).to.equal(1);
    expect(proposal.status_).to.equal(1);
  });

  it("Should not allow voting twice on the same proposal", async function () {
    const { proposalVote, voter1 } = await loadFixture(
      deployProposalVoteFixture
    );
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await proposalVote.connect(voter1).voteOnProposal(0);
    await expect(
      proposalVote.connect(voter1).voteOnProposal(0)
    ).to.be.revertedWith("You've voted already");
  });

  it("Should change proposal status to Accepted when quorum is reached", async function () {
    const { proposalVote, voter1, voter2, voter3 } = await loadFixture(
      deployProposalVoteFixture
    );
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await proposalVote.connect(voter1).voteOnProposal(0);
    await proposalVote.connect(voter2).voteOnProposal(0);

    await expect(proposalVote.connect(voter3).voteOnProposal(0))
      .to.emit(proposalVote, "ProposalApproved")
      .withArgs("Test Proposal", 3);

    const proposal = await proposalVote.getAProposal(0);
    expect(proposal.status_).to.equal(3);
  });

  it("Should not allow voting on an accepted proposal", async function () {
    const { proposalVote, voter1, voter2, voter3, owner } = await loadFixture(
      deployProposalVoteFixture
    );
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await proposalVote.connect(voter1).voteOnProposal(0);
    await proposalVote.connect(voter2).voteOnProposal(0);
    await proposalVote.connect(voter3).voteOnProposal(0);

    await expect(
      proposalVote.connect(owner).voteOnProposal(0)
    ).to.be.revertedWith("This proposal has been accepted already");
  });

  it("Should return all proposals", async function () {
    const { proposalVote } = await loadFixture(deployProposalVoteFixture);
    await proposalVote.createProposal("Proposal 1", "Description 1", 3);
    await proposalVote.createProposal("Proposal 2", "Description 2", 5);

    const proposals = await proposalVote.getAllProposals();
    expect(proposals.length).to.equal(2);
    expect(proposals[0].name).to.equal("Proposal 1");
    expect(proposals[1].name).to.equal("Proposal 2");
  });

  it("Should not allow getting a proposal with out-of-bounds index", async function () {
    const { proposalVote } = await loadFixture(deployProposalVoteFixture);
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await expect(proposalVote.getAProposal(1)).to.be.revertedWith(
      "Index is out-of-bound"
    );
  });

  it("Should not allow voting on a proposal with out-of-bounds index", async function () {
    const { proposalVote, voter1 } = await loadFixture(
      deployProposalVoteFixture
    );
    await proposalVote.createProposal(
      "Test Proposal",
      "This is a test proposal",
      3
    );

    await expect(
      proposalVote.connect(voter1).voteOnProposal(1)
    ).to.be.revertedWith("Index is out-of-bound");
  });
});
