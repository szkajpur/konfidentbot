`use strict`;

const botUsername = "";
const botOauth = ""; // without "oauth:"
const prefix = "$";
const userCooldown = "12000"; // 12 seconds
const globalCooldown = "4000" // 4 seconds
const ownerID = ""; // owner id
const botID = ""; // bot account id
const bannedRedditsPath = "./bannedreddits.json";
const connectChannels = [
    'pajlada'
];

module.exports = {
    botUsername,
    botOauth,
    prefix,
    userCooldown,
    globalCooldown,
    ownerID,
    botID,
    connectChannels,
    bannedRedditsPath
};
