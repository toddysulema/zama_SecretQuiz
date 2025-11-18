import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("SecretQuiz", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`SecretQuiz contract deployed at: ${deployed.address}`);
  console.log(`Network: ${hre.network.name}`);
};

export default func;
func.id = "deploy_secretquiz";
func.tags = ["SecretQuiz"];

