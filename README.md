# PulseVote ⚡

Decentralized community polling platform built with Next.js 15 + ethers.js v5.

## Contract
- **Address:** `0xeb7765d9ece84053fe8ecd554ea59cacf6618c7d`
- **Network:** Sepolia Testnet

## Features
- ✅ Submit polls for admin review
- ✅ Admin approves / rejects before going live
- ✅ Admin can delete any poll, users only their own
- ✅ Categories: General, Technology, Sports, Politics, Entertainment, Science, Other
- ✅ Poll expiry dates
- ✅ Reactions: 🔥 👍 🤯 (one per wallet)
- ✅ Poll analytics (votes, winner, creator, timestamps)
- ✅ Dark / Light theme toggle
- ✅ Filter by status and category
- ✅ Search polls
- ✅ Admin panel at /admin (owner wallet only)

## Quick Start
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel
Push to GitHub → import at vercel.com → deploy.

## Admin Access
Connect the **contract owner wallet** to see the 👑 Admin link in the navbar.
The admin panel is at `/admin`.
