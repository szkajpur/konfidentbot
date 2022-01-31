const config = require('./config.json');
const commands = require('./commands.json');
const { ChatClient } = require('dank-twitch-irc');
const got = require('got');
const moment = require('moment');
const usernameRegex = new RegExp(/^@?([\w]{1,25}),?$/);
var cooldown = false;
// Helper functions

// Declare clients
let client = new ChatClient({
    username: config.botUsername,
    password: `oauth:${config.botOauth}`,
    rateLimits: "default"
});
let clientRead = new ChatClient({
    username: "justinfan12345",
    rateLimits: "verifiedBot"
});


// Events on client
client.on("connecting", () => {
    console.log(`Connecting ${config.botUsername} to #${config.channel} twitch chat...`);
})
client.on("ready", () => {
    console.log(`Successfully connected ${config.botUsername} #${config.channel} twitch chat!`);
	client.say(config.channel, `Successfully connected ${config.botUsername} to #${config.channel} channel!`);
})
client.on("close", (error) => {
    if (error != null) {
        console.error('Client closed due to error: ', error);
    } else {
        console.error('Client closed due to unknown error!');
    }
})
client.on("error", (error) => {
    if (error != null) {
        console.error('Client error: ', error);
    } else {
        console.error('Client unknown error!');
    }    
})

// Events on clientRead
clientRead.on("connecting", () => {
    console.log("Read | Connecting...");
});
clientRead.on("ready", () => {
    console.log("Read | Connected!");
    clientRead.join("mamm0n");
});
clientRead.on("close", (error) => {
    if (error != null) {
        console.error("Read | Client closed due to error", error);
    }
});

// sayMulti sends the message in multiple channels at once through client specified
function sayMulti(client, channels, message) {
    for (channel of channels) {
        client.say(channel, message).catch(console.error);
    }
}

// cooldown function
function cd(time){
    cooldown = true;
    setTimeout(() => {
        cooldown = false;
    }, parseInt(time));
}

//cytat function
function cytat(nick){
    (async () => {
        try {
            do {
                var response = await got(`https://harambelogs.pl/channel/demonzz1/user/${nick}/random`);
            } while (!response.body.includes('#demonzz1'));
            if (nick == 'pierdzibak_kwiatka' || nick == 'pierdzibak_laskawy') {
                var emote = "Pierdzibak";
            } else
            if (nick == 'ltk__') {
                var emote = "Madge";
            } else
            if (nick == 'amazingniepolak') {
                var emote = "demonzPe";
            } else
            if (nick == 'julkalols') {
                var emote = "mitoman";
            }
            if (nick == 'gawcio69') {
                var emote = "peepoFoil";
            }
            let wiadomosc = response.body;
            if (wiadomosc.includes(nick)){
                let quote = wiadomosc.split(`#demonzz1 ${nick}:`);
                let cytat = quote[1].trim();
                client.say(config.channel, `${emote} Thinking ${cytat} Thinking2 ${quote[0]}`);
                cd(5000);
                return;
            } else if (wiadomosc.includes('pierdzibak_laskawy')) {
                let quote = wiadomosc.split(`#demonzz1 pierdzibak_laskawy:`);
                let cytat = quote[1].trim();
                client.say(config.channel, `${emote} Thinking ${cytat} Thinking2 ${quote[0]}`);
                cd(5000);
                return;    
            } else {
                client.say(config.channel, `Nie udało się pobrać cytatu PoroSad`);
                cd(3000);
                return;
            }
        } catch (error) {
            console.log(error.response);
            cd(3000);
            return;
        }
    })();
}

clientRead.on("JOIN", (msg) => {
    console.log(`Read | Joined #${msg.channelName}`);
});

clientRead.on("CLEARCHAT", (msg) => {
    if (msg.isPermaban()) {
        sayMulti(client, config.channel, `⚠ ${msg.targetUsername} dostał perma u mamona! mamon ⚠`);
    }
});

client.on("PRIVMSG", async (msg) => {
    if (msg.senderUsername == client.configuration.username){
        return;
    }
    if (!msg.messageText.startsWith(config.prefix)){
        return;
    }
    if (cooldown == true){
        return;
    }
    let args = msg.messageText.slice(config.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    switch(command){
        case 'help':
            client.say(config.channel, `@${msg.senderUsername}, ${commands.help}`);
            cd(3000);
            break;
        case 'czyjpies':
            if (args.length < 1){
                client.say(config.channel, `@${msg.senderUsername}, podaj nick!`);
                cd(3000);
                return;
            }
            let match = usernameRegex.exec(args[0].toLowerCase());
            if (match === null){
                client.say(config.channel, `@${msg.senderUsername}, podaj poprawny nick!`);
                cd(3000);
                return;
            }
            let target = match[1];
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${target}`);
                    const lista = JSON.parse(response.body);
                    if (!lista.length) {
                        client.say(config.channel, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych!`);
                        cd(3000);
                        return;
                    }
                    const bruh = `${lista[0].streamer} (${lista[0].count}m)`;
                    client.say(config.channel, `@${msg.senderUsername}, ${target} jest psem: ${bruh} Wowee`);
                } catch (error) {
                    console.log(error.response);
                    cd(3000);
                    return;
                }
            })();
            cd(5000);
            break;
        case 'top5':
            if (args.length < 1){
                client.say(config.channel, `@${msg.senderUsername}, podaj nick!`);
                cd(3000);
                return;
            }
            let pagman = usernameRegex.exec(args[0].toLowerCase());
            if (pagman === null){
                client.say(config.channel, `@${msg.senderUsername}, podaj poprawny nick!`);
                cd(3000);
                return;
            }
            let okge = pagman[1];
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${okge}`);
                    const lista = JSON.parse(response.body);
                    if (!lista.length) {
                        client.say(config.channel, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych!`);
                        cd(3000);
                        return;
                    }
                    const bruh = `${lista[0].streamer} ${lista[0].count}m | ${lista[1].streamer} ${lista[1].count}m | ${lista[2].streamer} ${lista[2].count}m | ${lista[3].streamer} ${lista[3].count}m | ${lista[4].streamer} ${lista[4].count}m`;
                    client.say(config.channel, `@${msg.senderUsername}, TOP5 ${okge} -> ${bruh} PepoG`);
                } catch (error) {
                    console.log(error.response);
                    cd(3000);
                    return;
                }
            })();
            cd(5000);
            break;
        case 'cytat_pierdzibaka':
            cytat('pierdzibak_kwiatka');
            break;
        case 'cytat_amazinga':
            cytat('amazingniepolak');
            break;
        case 'cytat_janusza':
            cytat('julkalols');
            break;
        case 'cytat_ltk':
            cytat('ltk__');
            break;
        case 'cytat_gawcia':
            cytat('gawcio69');
            break;
    }
}
);

client.connect();
client.join(config.channel);
clientRead.connect();