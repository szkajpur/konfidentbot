`use strict`;

const botUsername = "KonfidentBot_";
const botOauth = ""; // without "oauth:"
const prefix = "$";
const userCooldown = "12000"; // 12 seconds
const globalCooldown = "4000" // 4 seconds
const ownerUsername = "szkajpur"; // owner nickname
const bannedRedditsPath = "./bannedreddits.json";
const anonymousChannels = [
    'mamm0n'
];
const connectChannels = [
    'pajlada'
];
const notifyChannels = [
    'pajlada'
];

module.exports = {
    botUsername,
    botOauth,
    prefix,
    userCooldown,
    globalCooldown,
    ownerUsername,
    bannedRedditsPath,
    connectChannels,
    anonymousChannels,
    notifyChannels
};
