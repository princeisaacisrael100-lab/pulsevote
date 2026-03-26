export const CONTRACT_ADDRESS = "0xeb7765d9ece84053fe8ecd554ea59cacf6618c7d";
export const SEPOLIA_CHAIN_ID = "0xaa36a7";
export const SEPOLIA_CHAIN_ID_NUM = 11155111;

export const CONTRACT_ABI = [
  "function submitPoll(string memory question, string[] memory options, uint256 expiresAt, uint8 category) external returns (uint256)",
  "function vote(uint256 id, uint256 option) external",
  "function closePoll(uint256 id) external",
  "function deletePoll(uint256 id) external",
  "function react(uint256 id, uint8 reactionType) external",
  "function approvePoll(uint256 id) external",
  "function rejectPoll(uint256 id) external",
  "function adminClosePoll(uint256 id) external",
  "function adminDeletePoll(uint256 id) external",
  "function transferOwnership(address newOwner) external",
  "function getPoll(uint256 id) external view returns (string memory question, string[] memory options, uint256[] memory votes, address creator, uint256 createdAt, uint256 expiresAt, uint8 status, uint8 category, uint256 fireCount, uint256 likeCount, uint256 mindBlownCount)",
  "function totalPolls() external view returns (uint256)",
  "function didVote(uint256 id, address voter) external view returns (bool)",
  "function didReact(uint256 id, address reactor) external view returns (bool)",
  "function isOwnerAddress(address addr) external view returns (bool)",
  "function getWinner(uint256 id) external view returns (uint256 winnerIndex, uint256 winnerVotes)",
  "function getPollsByStatus(uint8 statusFilter) external view returns (uint256[] memory ids)",
  "function owner() external view returns (address)",
];

export const CATEGORIES = ["General","Technology","Sports","Politics","Entertainment","Science","Other"] as const;
export type CategoryName = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<string, string> = {
  General: "💬", Technology: "💻", Sports: "⚽", Politics: "🏛",
  Entertainment: "🎬", Science: "🔬", Other: "📌",
};

export const STATUS = { PENDING: 0, ACTIVE: 1, CLOSED: 2, DELETED: 3 } as const;

export interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: number[];
  creator: string;
  createdAt: number;
  expiresAt: number;
  status: number;
  category: number;
  fireCount: number;
  likeCount: number;
  mindBlownCount: number;
  voted: boolean;
  reacted: boolean;
  isCreator: boolean;
}
