import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import nftContract from "../artifacts/KryptoPunks.sol/KryptoPunks.json";
import stakingContract from "../artifacts/NFTStakingVault.sol/NFTStakingVault.json";
import TokenContract from "../artifacts/KryptoPunksToken.sol/KryptoPunksToken.json";
import {
  nftContractAddress,
  networkDeployedTo,
  stakingContractAddress,
  tokenContractAddress,
} from "../utils/contracts-config";
import networksMap from "../utils/networksMap.json";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { FaRegSadTear } from "react-icons/fa";

import AlertModal from "../components/AlertModal";
import LoadingModal from "../components/LoadingModal";
import OwnedNft from "@/components/stakepage/OwnedNft";
import NftModal from "@/components/mintpage/NftModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faCubes,
  faWarehouse,
  faFireAlt,
  faCoins,
  faInfinity,
  faDollarSign,
  faTurnUp,
  faClock,
  faLevelUpAlt,
  faGift,
  faMinusCircle,
  faArrowRightFromBracket,
  faTrophy,
  faChartLine,
  faInfoCircle,
  faUserCircle,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";

function StakePage() {
  const data = useSelector((state) => state.blockchain.value);

  // State variables
  const [leaderboard, setLeaderboard] = useState([]);
  const [txStatus, setTxStatus] = useState(null);
  const [userNFTs, setUserNFTs] = useState([]);
  const [timeUntilLevelUp, setTimeUntilLevelUp] = useState(null);
  const [nftLevels, setNftLevels] = useState({});
  const [levelUpCosts, setLevelUpCosts] = useState({});
  const [rewardRates, setRewardRates] = useState({});
  const [hasUserApprovedNFT, setHasUserApprovedNFT] = useState(false);

  const [calculatedRewards, setCalculatedRewards] = useState({});

  const [stakingAmount, setStakingAmount] = useState(0);
  const [unstakingTokenId, setUnstakingTokenId] = useState(0);
  const [levelUpTokenId, setLevelUpTokenId] = useState(0);
  const [levelUpWithCostTokenId, setLevelUpWithCostTokenId] = useState(0);
  const [claimRewardTokenId, setClaimRewardTokenId] = useState(0);
  const [userStakedNFTs, setUserStakedNFTs] = useState([]);
  const [info, setInfo] = useState({
    paused: false,
  });
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Input handlers
  const handleStakingAmountChange = (event) => {
    setStakingAmount(event.target.value);
  };
  const handleUnstakingTokenIdChange = (event) => {
    setUnstakingTokenId(event.target.value);
  };
  const handleLevelUpTokenIdChange = (event) => {
    setLevelUpTokenId(event.target.value);
  };
  const handleLevelUpWithCostTokenIdChange = (event) => {
    setLevelUpWithCostTokenId(event.target.value);
  };
  const handleClaimRewardTokenIdChange = (event) => {
    setClaimRewardTokenId(event.target.value);
  };

  const [loading, setLoading] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState("");

  const showAlertModal = (message) => {
    setAlertModalMessage(message);
    setAlertModalOpen(true);
  };

  const closeAlertModal = () => {
    setAlertModalOpen(false);
  };

  const checkApproval = async (tokenId) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const nft_contract = new ethers.Contract(
      nftContractAddress,
      nftContract.abi,
      signer
    );

    const approvedAddress = await nft_contract.getApproved(tokenId);
    return approvedAddress === stakingContractAddress;
  };

  const stakeNFT = async (tokenId) => {
    if (data.network === networksMap[networkDeployedTo] && !info.paused) {
      try {
        setLoading(true);
        setTxStatus("Approving NFT for staking...");

        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();

        const isApproved = await checkApproval(tokenId);

        if (!isApproved) {
          const nftContractInstance = new ethers.Contract(
            nftContractAddress,
            nftContract.abi,
            signer
          );
          const approve_tx = await nftContractInstance.approve(
            stakingContractAddress,
            tokenId
          );
          await approve_tx.wait();
        }

        setTxStatus("Staking NFT...");

        const staking_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );
        const stake_tx = await staking_contract.stakeNFT(tokenId);
        await stake_tx.wait();

        setLoading(false);
        showAlertModal("Successfully staked NFT!");
        setTxStatus(null);
      } catch (error) {
        setLoading(false);
        if (error.reason.includes("user rejected transaction")) {
          showAlertModal("Transaction Cancelled by User");
        } else {
          showAlertModal(
            "An error has occurred while staking. Please try again."
          );
        }
        setTxStatus(null);
      }
    } else {
      showAlertModal(
        "Unable to stake at this time. Please check the conditions and try again."
      );
    }
  };

  const unstakeNFT = async (tokenId) => {
    if (data.network === networksMap[networkDeployedTo] && !info.paused) {
      try {
        setTxStatus("UNStaking NFT...");
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );
        const unstake_tx = await stake_contract.unstakeNFT(tokenId);
        await unstake_tx.wait();
        setLoading(false);
        showAlertModal("Successfully unstaked NFT!");
      } catch (error) {
        setLoading(false);
        if (error.reason.includes("user rejected transaction")) {
          showAlertModal("Transaction Cancelled by User");
        } else {
          showAlertModal(
            "An error has occurred while unstaking. Please try again."
          );
        }
      }
    } else {
      showAlertModal(
        "Unable to unstake at this time. Please check the conditions and try again."
      );
    }
  };
  const levelUp = async (tokenId) => {
    if (data.network === networksMap[networkDeployedTo] && !info.paused) {
      try {
        setTxStatus("LevelingUp NFT...");
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );
        const levelUp_tx = await stake_contract.levelUp(tokenId);
        await levelUp_tx.wait();
        setLoading(false);
        showAlertModal("Successfully leveled up NFT!");
      } catch (error) {
        setLoading(false);
        if (error.reason.includes("Too soon to level up")) {
          showAlertModal("Too soon to level, wait for some time");
        } else if (error.reason.includes("user rejected transaction")) {
          showAlertModal("Transaction Cancelled by User");
        } else {
          showAlertModal(
            "An error has occurred while leveling up. Please try again."
          );
        }
      }
    } else {
      showAlertModal(
        "Unable to level up at this time. Please check the conditions and try again."
      );
    }
  };

  const checkAllowance = async (ownerAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const token_contract = new ethers.Contract(
      tokenContractAddress,
      TokenContract.abi,
      signer
    );

    const allowance = await token_contract.allowance(
      ownerAddress,
      stakingContractAddress
    );
    // replace 'requiredAmount' with the actual amount needed for the operation
    return allowance >= 500;
  };

  const levelUpWithCost = async (tokenId) => {
    if (data.network === networksMap[networkDeployedTo] && !info.paused) {
      try {
        setTxStatus("LevelingUp NFT...");
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        // Add token contract
        const tokenContract = new ethers.Contract(
          tokenContractAddress,
          TokenContract.abi,
          signer
        );

        const ownerAddress = await signer.getAddress();
        const isAllowed = await checkAllowance(ownerAddress);

        if (!isAllowed) {
          // Approve the staking contract to spend tokens
          const approve_tx = await tokenContract.approve(
            stakingContractAddress,
            tokenId
          );
          await approve_tx.wait();
        }

        const levelUpWithCost_tx = await stake_contract.levelUpWithCost(
          tokenId
        );
        await levelUpWithCost_tx.wait();
        setLoading(false);
        showAlertModal("Successfully leveled up NFT with cost!");
      } catch (error) {
        setLoading(false);
        if (error.reason.includes("insufficient allowance")) {
          showAlertModal("Insufficient PDV to level Up");
        } else if (error.reason.includes("user rejected transaction")) {
          showAlertModal("Transaction Cancelled by User");
        } else {
          showAlertModal(
            "An error has occurred while leveling up. Please try again."
          );
        }
      }
    } else {
      showAlertModal(
        "Unable to level up with cost at this time. Please check the conditions and try again."
      );
    }
  };

  const claimReward = async (tokenId) => {
    if (data.network === networksMap[networkDeployedTo] && !info.paused) {
      try {
        setTxStatus("Claiming Reward...");
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );
        const claimReward_tx = await stake_contract.claimReward(tokenId);
        await claimReward_tx.wait();
        setLoading(false);
        showAlertModal("Successfully claimed rewards!");
      } catch (error) {
        setLoading(false);
        if (error.reason.includes("user rejected transaction")) {
          showAlertModal("Transaction Cancelled by User");
        } else {
          showAlertModal(
            "An error has occurred while claiming rewards. Please try again."
          );
        }
      }
    } else {
      showAlertModal(
        "Unable to claim rewards at this time. Please check the conditions and try again."
      );
    }
  };

  useEffect(() => {
    const fetchUserNFTs = async () => {
      try {
        if (data.network === networksMap[networkDeployedTo] && data.account) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const nftContractInstance = new ethers.Contract(
            nftContractAddress,
            nftContract.abi,
            signer
          );

          const balance = await nftContractInstance.balanceOf(data.account);
          const userTokens = [];
          // Check if the user has approved the staking contract
          const userAllowance = await nftContractInstance.isApprovedForAll(
            data.account,
            stakingContractAddress
          );
          setHasUserApprovedNFT(userAllowance);

          for (let i = 0; i < balance.toNumber(); i++) {
            const tokenId = await nftContractInstance.tokenOfOwnerByIndex(
              data.account,
              i
            );
            let tokenURI = await nftContractInstance.tokenURI(tokenId);
            tokenURI = tokenURI.replace(
              "ipfs://",
              "https://cloudflare-ipfs.com/ipfs/"
            );
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            userTokens.push({ tokenId: tokenId.toString(), metadata });
          }

          setUserNFTs(userTokens);
        }
      } catch (error) {
        showAlertModal(
          "An error occurred while fetching user NFTs. Please try again."
        );
      }
    };
    fetchUserNFTs();
  }, [data]);

  useEffect(() => {
    const fetchUserStakedNFTs = async () => {
      try {
        if (data.network === networksMap[networkDeployedTo] && data.account) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          // Create a new instance of the NFT contract
          const nftContractInstance = new ethers.Contract(
            nftContractAddress,
            nftContract.abi,
            signer
          );

          const stakingContractInstance = new ethers.Contract(
            stakingContractAddress,
            stakingContract.abi,
            signer
          );

          const stakedTokens = await stakingContractInstance.getStakedNFTs(
            data.account
          );

          const stakedUserTokens = [];
          for (let i = 0; i < stakedTokens.length; i++) {
            const tokenId = stakedTokens[i];
            let tokenURI = await nftContractInstance.tokenURI(tokenId);
            tokenURI = tokenURI.replace(
              "ipfs://",
              "https://cloudflare-ipfs.com/ipfs/"
            );
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            stakedUserTokens.push({ tokenId: tokenId.toString(), metadata });
          }

          setUserStakedNFTs(stakedUserTokens);
        }
      } catch (error) {
        showAlertModal(
          "An error occurred while fetching staked NFTs. Please try again."
        );
      }
    };
    fetchUserStakedNFTs();
  }, [data]);

  // Implementing getTimeUntilLevelUp
  const getTimeUntilLevelUp = async (owner, tokenId) => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        let timeUntilLevelUp = await stake_contract.getTimeUntilLevelUp(
          owner,
          tokenId
        );

        timeUntilLevelUp = timeUntilLevelUp.toNumber();

        // Start the countdown
        const countdownInterval = setInterval(() => {
          if (timeUntilLevelUp <= 0) {
            // If the countdown is complete, clear the interval
            clearInterval(countdownInterval);
          } else {
            // Decrease the time until level up by 1
            timeUntilLevelUp--;

            // Convert seconds to HH:MM:SS format
            const hours = Math.floor(timeUntilLevelUp / 3600);
            const minutes = Math.floor((timeUntilLevelUp % 3600) / 60);
            const seconds = timeUntilLevelUp % 60;

            // Pad the hours, minutes, and seconds values with leading zeros if they are less than 10
            const timeString = [
              hours.toString().padStart(2, "0"),
              minutes.toString().padStart(2, "0"),
              seconds.toString().padStart(2, "0"),
            ].join(":");

            // Update the state with the new time until level up
            setTimeUntilLevelUp(timeString);
          }
        }, 1000);
      } catch (error) {
        showAlertModal(
          "An error occurred while fetching the time until level up. Please try again."
        );
      }
    } else {
      showAlertModal(
        "Unable to fetch the time until level up. Please check the network and try again."
      );
    }
  };

  // Implementing checkLevel
  const checkLevel = async (owner, tokenId) => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const level = await stake_contract.checkLevel(owner, tokenId);
        setNftLevels((prevLevels) => ({
          ...prevLevels,
          [tokenId]: level.toNumber(),
        }));

        const levelUpCost = await stake_contract.getLevelUpCost(level);
        setLevelUpCosts((prevCosts) => ({
          ...prevCosts,
          [tokenId]: ethers.utils.formatEther(levelUpCost),
        }));

        const rewardRate = await stake_contract.getRewardRate(level);
        setRewardRates((prevRates) => ({
          ...prevRates,
          [tokenId]: ethers.utils.formatEther(rewardRate),
        }));
      } catch (error) {
        showAlertModal(
          "An error occurred while checking the level of the NFT, getting the cost to level up, or getting the reward rate. Please try again."
        );
      }
    } else {
      showAlertModal(
        "Unable to check the level of the NFT, get the cost to level up, or get the reward rate. Please check the network and try again."
      );
    }
  };

  useEffect(() => {
    // This function fetches the time until level up and level for each staked NFT
    const fetchAdditionalStakedNFTData = async () => {
      userStakedNFTs.forEach(({ tokenId }) => {
        getTimeUntilLevelUp(data.account, tokenId);
        checkLevel(data.account, tokenId);
      });
    };
    fetchAdditionalStakedNFTData();
  }, [userStakedNFTs, data.account]);

  const calculateReward = async () => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        const signer = provider.getSigner();
        const stake_contract = new ethers.Contract(
          stakingContractAddress,
          stakingContract.abi,
          signer
        );

        const rewards = {};

        // Calculate reward for each token
        for (const token of userStakedNFTs) {
          const tokenId = token.tokenId;
          const calculatedReward = await stake_contract.calculateReward(
            tokenId
          );
          rewards[tokenId] = ethers.utils.formatEther(calculatedReward);
        }

        setCalculatedRewards(rewards);
      } catch (error) {
        showAlertModal(
          "An error has occurred while calculating rewards. Please try again."
        );
      }
    } else {
      showAlertModal(
        "Unable to calculate rewards at this time. Please check the conditions and try again."
      );
    }
  };
  useEffect(() => {
    calculateReward();
  }, [userStakedNFTs]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (data.network === networksMap[networkDeployedTo] && data.account) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          const stake_contract = new ethers.Contract(
            stakingContractAddress,
            stakingContract.abi,
            signer
          );

          let leaderboardData = [...(await stake_contract.getLeaderboard())]; // clone array

          // Fetch the stake timestamp for each NFT and convert level to a number
          leaderboardData = await Promise.all(
            leaderboardData.map(async (entry) => {
              const stakeTimestamp = await stake_contract.getStakeTimestamp(
                entry.tokenId
              );

              return {
                ...entry,
                level: entry.level.toNumber(),
                stakeTimestamp: stakeTimestamp.toNumber(),
              };
            })
          );

          // Sort leaderboard by level (descending) and then stake timestamp (ascending)
          leaderboardData.sort((a, b) => {
            if (a.level !== b.level) {
              return b.level - a.level; // Sort by level in descending order
            } else {
              return b.stakeTimestamp - a.stakeTimestamp;
            }
          });

          // Limit leaderboard to top 10 entries
          leaderboardData = leaderboardData.slice(0, 10);

          setLeaderboard(leaderboardData);
        }
      } catch (error) {
        showAlertModal(
          "An error occurred while fetching the leaderboard data. Please try again."
        );
      }
    };

    fetchLeaderboard();
  }, [data]);

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const scaleUp = {
    hidden: { scale: 0 },
    visible: { scale: 1 },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="relative bg-slate-800">
      <NavBar />
      <AlertModal
        open={alertModalOpen}
        message={alertModalMessage}
        handleClose={closeAlertModal}
      />
      <LoadingModal open={loading} message={txStatus} />
      <div className="">
        <motion.div
          className=""
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <motion.header
            className="text-center text-4xl mb-4"
            initial="hidden"
            animate="visible"
            variants={scaleUp}
          >
            PandaVerse Staking Vault
          </motion.header>

          <main className="flex-grow mx-auto">
            {/* ownednfts */}
            <div id="#mynfts">
              <OwnedNft
                scaleUp={scaleUp}
                userNFTs={userNFTs}
                buttonVariants={buttonVariants}
                stakeNFT={stakeNFT}
                setSelectedNFT={setSelectedNFT}
                setIsModalOpen={setIsModalOpen}
              />
            </div>

            {/*----------------- StakedNfts ----------------------------*/}
            <div id="stakednfts ">
              {
                <div className="relative flex items-center justify-center py-10 md:p-20 ">
                  <img className="roadmap-bg absolute bottom-24 right-10" />
                  <div className="min-h-[80vh] md:max-w-[70vw] flex items-center">
                    <section className="px-10">
                      <motion.h2
                        className="text-3xl mb-8 text-secondary p-4 bg-gray-700 text-center rounded-xl"
                        initial="hidden"
                        animate="visible"
                        variants={scaleUp}
                        style={{
                          fontFamily: "YourFont", // Replace 'YourFont' with the desired font-family
                        }}
                      >
                        Staked NFTs Vault
                      </motion.h2>
                      <div className="flex gap-10 flex-wrap justify-center items-center">
                        {userStakedNFTs.length > 0 ? (
                          userStakedNFTs.map(({ tokenId, metadata }) => (
                            <div
                              key={tokenId}
                              className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-center shadow-2xl max-w-[300px] transition-all duration-500 ease-in-out transform hover:scale-105 animated-gradient"
                            >
                              <Image
                                className=" mx-auto mb-2 rounded-full border-4 border-secondary"
                                src={metadata.image.replace(
                                  "ipfs://",
                                  "https://cloudflare-ipfs.com/ipfs/"
                                )}
                                alt={`NFT ${tokenId}`}
                                width={250}
                                height={250}
                                quality={75}
                                layout="responsive"
                                whileHover={{ scale: 1.1 }}
                              />

                              <h2 className="text-white font-bold text-2xl mt-4">
                                PANDA #{tokenId}
                              </h2>
                              <p className="text-green-500 mt-2 text-lg font-semibold bg-slate-900 rounded-2xl">
                                {" "}
                                <FontAwesomeIcon
                                  icon={faFireAlt}
                                  className="text-red-500"
                                  fade
                                />{" "}
                                Reward: {calculatedRewards[tokenId]} PDV
                              </p>
                              <p className="text-gray-300 text-lg font-semibold">
                                Reward rate: {rewardRates[tokenId]} PDV
                              </p>
                              <div className="flex justify-center gap-2 mt-4">
                                <div className="flex flex-col gap-4">
                                  <motion.button
                                    onClick={() => levelUp(tokenId)}
                                    className="px-4 py-2 rounded-xl shadow-xl shadow-red-500 text-white font-semibold transition-all duration-500 ease-in-out transform hover:scale-110 flex items-center justify-center animated-gradient"
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    style={{
                                      fontFamily: "YourFont",
                                      textShadow: "0 0 5px #000",
                                      boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <div className="flex gap-2 items-center">
                                      <p>
                                        <FontAwesomeIcon
                                          icon={faLevelUpAlt}
                                          bounce
                                        />
                                      </p>
                                      <p>Level Up</p>
                                    </div>
                                  </motion.button>
                                  <motion.button
                                    onClick={() => claimReward(tokenId)}
                                    className="px-4 py-2 bg-blue-600 rounded-2xl text-white font-semibold transition-all duration-500 ease-in-out transform hover:scale-110 flex items-center justify-center"
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    style={{
                                      fontFamily: "YourFont",
                                      textShadow: "0 0 5px #000",
                                      boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <div className="flex gap-1 items-center ">
                                      <p>
                                        <FontAwesomeIcon icon={faGift} />
                                      </p>
                                      <p>Claim Rewards</p>
                                    </div>
                                  </motion.button>
                                </div>
                                <div className="flex flex-col gap-4">
                                  <motion.button
                                    onClick={() => levelUpWithCost(tokenId)}
                                    className="px-4 py-2 bg-yellow-600 rounded-2xl text-white font-semibold transition-all duration-500 ease-in-out transform hover:scale-110 flex items-center justify-center"
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    style={{
                                      fontFamily: "YourFont",
                                      textShadow: "0 0 5px #000",
                                      boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <div className="flex gap-1 items-center ">
                                      <p>
                                        <FontAwesomeIcon icon={faCoins} />
                                      </p>
                                      <p>Level Up with Cost</p>
                                    </div>
                                  </motion.button>

                                  <motion.button
                                    onClick={() => unstakeNFT(tokenId)}
                                    className="px-4 py-2 bg-red-600 rounded-2xl text-white font-semibold transition-all duration-500 ease-in-out transform hover:scale-110 flex items-center justify-center"
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    style={{
                                      fontFamily: "YourFont",
                                      textShadow: "0 0 5px #000",
                                      boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <div className="flex gap-1 items-center ">
                                      <p>
                                        <FontAwesomeIcon
                                          icon={faArrowRightFromBracket}
                                        />
                                      </p>
                                      <p>Unstake</p>
                                    </div>
                                  </motion.button>
                                </div>
                              </div>
                              <p className="text-gray-300 mt-4 text-lg font-semibold">
                                {" "}
                                <FontAwesomeIcon icon={faClock} /> Time until
                                level up: {timeUntilLevelUp}
                              </p>
                              <p className="text-green-500 text-lg font-semibold mt-2 bg-slate-900 rounded-2xl">
                                <FontAwesomeIcon
                                  icon={faTurnUp}
                                  className="text-orange-500"
                                />{" "}
                                NFT Level: {nftLevels[tokenId]}
                              </p>
                              <p className="text-gray-300 text-lg font-semibold">
                                {" "}
                                <FontAwesomeIcon
                                  icon={faCoins}
                                  className="text-green-500"
                                />{" "}
                                Cost to level up: {levelUpCosts[tokenId]} PDV
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col justify-center items-center rounded p-4 text-center min-w-full min-h-[50vh] gap-4">
                            <FaRegSadTear className="text-6xl text-gray-500" />
                            <p className="text-2xl mb-2 text-secondary">
                              Your vault is empty...
                            </p>
                            <p className="text-secondary text-xl">
                              Once you have staked some NFTs, they'll appear
                              here.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center mt-4">
                        <div className=" rounded-2xl p-4 text-center">
                          <motion.h3
                            className="text-2xl mb-2 "
                            initial="hidden"
                            animate="visible"
                            variants={scaleUp}
                            style={{
                              fontFamily: "YourFont", // Replace 'YourFont' with the desired
                            }}
                          >
                            Total Staked NFTs
                          </motion.h3>
                          <motion.p
                            className="text-4xl font-bold mb-8 text-secondary p-4 bg-gray-700 text-center"
                            initial="hidden"
                            animate="visible"
                            variants={scaleUp}
                            style={{
                              fontFamily: "YourFont", // Replace 'YourFont' with the desired font-family
                              color: "gold", // Replace 'gold' with the desired text color
                            }}
                          >
                            {userStakedNFTs.length}
                          </motion.p>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="divider-right"></div>
                </div>
              }
              {/*----------------- end of StakedNfts ----------------------------*/}
            </div>
            <div className="overflow-x-auto shadow-xl rounded-xl my-6 mx-4 md:mx-0 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:bg-gray-900">
              <div className="align-middle inline-block w-full p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-4xl font-semibold text-blue-800 dark:text-white">
                    Leaderboard
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Explore the competitive scene
                  </p>
                </div>
                <table className="min-w-full divide-y divide-blue-300 dark:divide-blue-700 table-fixed">
                  <thead className="bg-blue-800 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 md:px-6 py-3 text-left text-sm md:text-base leading-4 font-bold text-white uppercase tracking-wider w-1/4 rounded-tl-lg flex items-center"
                      >
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className="mr-2 animate-bounce"
                        />{" "}
                        Rank
                      </th>
                      <th
                        scope="col"
                        className="px-4 md:px-6 py-3 text-left text-sm md:text-base leading-4 font-bold text-white uppercase tracking-wider w-1/4"
                      >
                        <FontAwesomeIcon icon={faUserCircle} className="mr-2" />{" "}
                        Owner
                      </th>
                      <th
                        scope="col"
                        className="px-4 md:px-6 py-3 text-left text-sm md:text-base leading-4 font-bold text-white uppercase tracking-wider w-1/4"
                      >
                        <FontAwesomeIcon icon={faHashtag} className="mr-2" />{" "}
                        Token ID
                      </th>
                      <th
                        scope="col"
                        className="px-4 md:px-6 py-3 text-left text-sm md:text-base leading-4 font-bold text-white uppercase tracking-wider w-1/4"
                      >
                        <FontAwesomeIcon icon={faChartLine} className="mr-2" />{" "}
                        Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-300 dark:divide-blue-700 bg-white dark:bg-gray-800">
                    {leaderboard.map((entry, index) => (
                      <tr
                        key={entry.tokenId}
                        className={`${
                          index % 2 === 0
                            ? "bg-gray-50 dark:bg-gray-900"
                            : "bg-white dark:bg-gray-800"
                        } hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ease-in-out duration-200 transform hover:scale-105 ${
                          entry.owner === data.account
                            ? "bg-blue-200 dark:bg-blue-700"
                            : ""
                        } ${
                          index < 3
                            ? "bg-gradient-to-r from-green-400 to-blue-400 text-white"
                            : ""
                        }`}
                      >
                        <td className="px-4 md:px-6 py-4 whitespace-no-wrap text-lg leading-5 font-bold text-blue-800 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-700 dark:text-gray-300">
                          {entry.owner === data.account ? (
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              You
                            </span>
                          ) : (
                            entry.owner
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-700 dark:text-gray-300">
                          {entry.tokenId.toString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-no-wrap text-lg leading-5 text-blue-800 dark:text-white font-bold">
                          {entry.level.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </motion.div>
      </div>
      <Footer />
      {/* modal open */}
      <NftModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        selectedNFT={selectedNFT}
      />
    </div>
  );
}

export default StakePage;
