const axios = require('axios');
const fs = require('fs').promises; 
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');
const cron = require('node-cron');
require('dotenv').config();
const displayskw = require('./displayskw');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const date = new Date().toLocaleDateString('id-ID');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class MiniAppAPI {
    constructor() {
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://miniapp.dropstab.com',
            'Referer': 'https://miniapp.dropstab.com/',
            'Sec-CH-UA': '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129", "Microsoft Edge WebView2";v="129"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0'
        };
    }

    async auth(userData) {
        const url = 'https://api.miniapp.dropstab.com/api/auth/login';
        const headers = { ...this.headers, 'Webapp': 'true' };

        try {
            const response = await axios.post(url, userData, { headers });
            const accessToken = response.data.jwt.access.token;
            const refreshToken = response.data.jwt.refresh.token;

            return { accessToken, refreshToken };
        } catch (error) {
            console.error(chalk.red('Gagal Login: Silahkan Ganti Query Baru'));
            if (error.response) {
                console.error( );
                const errorMessage = `Authentication failed: ${error.response.data.message || error.message}`;
            }
            return null;
        }
    }

    async refreshAccessToken(refreshToken) {
        const url = 'https://api.miniapp.dropstab.com/api/auth/refresh';
        const headers = { ...this.headers, 'Authorization': `Bearer ${refreshToken}` };

        try {
            const response = await axios.post(url, {}, { headers });
            return response.data.jwt.access.token;
        } catch (error) {
            console.error(chalk.red('Failed to refresh access token:'), error.message);
            return null;
        }
    }

    async getProfile(token) {
        const url = 'https://api.miniapp.dropstab.com/api/user/current';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.get(url, { headers });
            const { tgUsername, balance } = response.data;
            return { tgUsername, balance };
        } catch (error) {
            console.error(chalk.red('Failed to get profile:'), error.message);
            return null;
        }
    }

    async totalBalance(tokensList) {
        let total = 0;

        for (const tokens of tokensList) {
            const profile = await this.getProfile(tokens.accessToken);
            if (profile) {
                total += parseFloat(profile.balance);
            }
        }

        return total;
    }

    async dailyBonus(token) {
        const url = 'https://api.miniapp.dropstab.com/api/bonus/dailyBonus';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.post(url, {}, { headers });
            if (response.data && response.data.result) {
                return {
                    result: true,
                    bonus: response.data.bonus,
                    streaks: response.data.streaks
                };
            } else {
                return {
                    result: false,
                    bonus: null,
                    streaks: null
                };
            }
        } catch (error) {
            console.error(chalk.red('Gagal Claim DailyBonus:', error.message));
            if (error.response) {
                console.error('Error details:', error.response.data);
            }
            return null;
        }
    }


    async claimreff(token) {
        const url = 'https://api.miniapp.dropstab.com/api/refLink/claim';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.post(url, {}, { headers });
            return {
                totalReward: response.data.totalReward,
                availableToClaim: response.data.availableToClaim
            };
        } catch (error) {
            console.error(chalk.red('Failed to claim reff:'), error.message);
            return null;
        }
    }

    async getQuests(token) {
        const url = 'https://api.miniapp.dropstab.com/api/quest';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.get(url, { headers });
            const quests = response.data.flatMap(category => 
                category.quests.map(quest => ({
                    id: quest.id,
                    name: quest.name,
                    status: quest.status
                }))
            );
            console.log(chalk.cyan(`AVAILABLE QUEST`));
            quests.forEach(quest => {
                if (quest.status === 'NEW') {
                    console.log(chalk.blue(`- ${quest.name} (Status: ${quest.status})`));
                } else if (quest.status === 'COMPLETED') {

                }
            });
            return quests;
        } catch (error) {
            console.error('Failed to get quests:', error.message);
            if (error.response) {
                console.error('Error details:', error.response.data);
            }
            return null;
        }
    }

    async doQuest(token, id, questName) {
        const url = `https://api.miniapp.dropstab.com/api/quest/${id}/verify`;
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.put(url, {}, { headers });
            return response.data;
        } catch (error) {
            console.error(chalk.red(`Failed to verify quest ${questName}:`), error.message);
            return null;
        }
    }

    async claimQuest(token, id, questName) {
        const url = `https://api.miniapp.dropstab.com/api/quest/${id}/claim`;
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const response = await axios.put(url, {}, { headers });
            return response.data;
        } catch (error) {
            return null;
        }
    }

    async xnxx(accessToken, refreshToken) {
        let token = accessToken;
        const quests = await this.getQuests(token);
        if (!quests) return;
        const verificationResults = [];

        for (const quest of quests) {
            if (quest.status === 'NEW') {
                const { id, name } = quest;
                const result = await this.doQuest(token, id, name);
                verificationResults.push({ id, name, result });
            }
        }

        for (const { id, name } of verificationResults) {
            const claimResult = await this.claimQuest(token, id, name);
            console.log(
                claimResult 
                    ? chalk.green(`- ${name} Berhasil`) 
                    : chalk.red(`- ${name}... Kerjakan Manual`)
            );
        }

        const claimReffResult = await this.claimreff(token);
        if (claimReffResult) {
            if (claimReffResult.totalReward === 0) {
                console.log(chalk.blue(`Tidak ada reward Reff : ${claimReffResult.availableToClaim}`));
            } else {
                console.log(chalk.green(`Sukses Claim Reff : ${claimReffResult.availableToClaim}`));
            }

        } else {
            console.error(chalk.red('Gagal klaim referensi.'));
        }

    }


    async processall(accessToken, refreshToken) {
        let token = accessToken;

        const bonusResult = await this.dailyBonus(token);
        if (!bonusResult) {
            token = await this.refreshAccessToken(refreshToken);
            if (token) {
                const newBonusResult = await this.dailyBonus(token);
                if (newBonusResult && newBonusResult.result) {
                    console.log(chalk.green('Daily bonus claimed successfully with refreshed token!'));
                } else {
                    console.error(chalk.red('Gagal klaim bonus setelah refresh token.'));
                    return;
                }
            } else {
                console.error(chalk.red('Refresh token failed, unable to claim bonus.'));
                return;
            }
        } else if (bonusResult.result) {
            console.log(chalk.green('Daily bonus Sukses!'));
        } else {
            console.error(chalk.yellow('Sudah Claim Daily '));
        }

        const quests = await this.getQuests(token);
        if (!quests) return;

        const verificationResults = [];
        console.log(chalk.gray('Mengerjakan quest..perlu beberapa menit agar quest bisa diclaim'));

        for (const quest of quests) {
            if (quest.status === 'NEW') {
                const { id, name } = quest;
                const result = await this.doQuest(token, id, name);
                verificationResults.push({ id, name, result });
            }
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        for (const { id, name } of verificationResults) {
            const claimResult = await this.claimQuest(token, id, name);
            console.log(
                claimResult 
                    ? chalk.green(`- ${name} Berhasil`) 
                    : chalk.red(`- ${name}... Kerjakan Manual`)
            );
        }
          
        const claimReffResult = await this.claimreff(token);
        if (claimReffResult) {
            if (claimReffResult.totalReward === 0) {
                console.log(chalk.blue(`Tidak ada reward Reff : ${claimReffResult.availableToClaim}`));
            } else {
                console.log(chalk.green(`Sukses Claim Reff : ${claimReffResult.availableToClaim}`));
            }

        } else {
            console.error(chalk.red('Gagal klaim referensi.'));
        }

    }
}

async function sendToTelegram(totalAccounts, totalBalance) {
    const message = `🔹 *Etherdrops Report ${date}

        🤖 Total Akun: ${totalAccounts || 'Query Sudah Expired'}
        💰 Total Balance: ${totalBalance || 'Silahkan Ganti Baru'}

         ==SKW Airdrop Hunter==*`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown' 
        });
        console.log(chalk.green('Pesan berhasil dikirim ke Telegram.'));
    } catch (error) {
        console.error(chalk.red('Gagal mengirim pesan ke Telegram:'), error.message);
    }
}

async function startBot() {
    console.clear();
    displayskw();
    console.log();
    await delay(3000)

    const api = new MiniAppAPI();
    const dataFile = path.join(__dirname, 'data.txt');

    try {
        const data = await fs.readFile(dataFile, 'utf8');
        const users = data.split('\n').filter(Boolean);
        const tokensList = [];
        let totalBalanceBeforeXnxx = 0;

        for (let user of users) {
            const userData = Object.fromEntries(new URLSearchParams(user.trim()));
            const payload = {
                ...userData,
                webAppData: user
            };

            const tokens = await api.auth(payload);
            if (tokens) {
                const { accessToken, refreshToken } = tokens;
                tokensList.push(tokens);

                const profile = await api.getProfile(accessToken);
                console.log(chalk.magenta.bold(`Akun: ${profile.tgUsername}`));
                await api.processall(accessToken, refreshToken);
                console.log(chalk.magenta(`Balance ${profile.tgUsername} : ${profile.balance}\n`));

                const updatedProfile = await api.getProfile(accessToken);
                totalBalanceBeforeXnxx += parseFloat(updatedProfile.balance);
            } else {
            }
        }

        console.log(chalk.green.bold(`Total Balance Semua Akun : ${totalBalanceBeforeXnxx}\n\n`));


        await new Promise(resolve => {
            let countdown = 10;

            const countdownInterval = setInterval(() => {
                if (countdown > 0) {
                    process.stdout.write(chalk.magenta(`Cooldown Claim Quest: ${countdown} detik. Bot By skwairdrop\r`));
                    countdown--;
                } else {
                    clearInterval(countdownInterval);
                    resolve();
                    console.log();
                }
            }, 1000);
        });


        for (const tokens of tokensList) {
            const profile = await api.getProfile(tokens.accessToken);
            console.log(chalk.magenta.bold(`Akun: ${profile.tgUsername}`));
            await api.xnxx(tokens.accessToken, tokens.refreshToken);
            console.log(``);
        }

        let totalBalanceAfterXnxx = 0;
        for (const tokens of tokensList) {
            const profile = await api.getProfile(tokens.accessToken);
            console.log(chalk.magenta(`Balance ${profile.tgUsername}: ${profile.balance}`));
            totalBalanceAfterXnxx += parseFloat(profile.balance);
        }

        console.log(chalk.green.bold(`Total Balance Semua Akun: ${totalBalanceAfterXnxx}`));

        await sendToTelegram(tokensList.length, totalBalanceAfterXnxx);

    } catch (error) {
        console.error(chalk.red('Error reading data file:'), error.message);
    }
}

async function main() {
    cron.schedule('0 1 * * *', async () => { 
        await startBot();
        console.log();
        console.log(chalk.magenta.bold(`Cron AKTIF`));
        console.log(chalk.magenta('Jam 08:00 WIB Autobot Akan Run Ulang...'));
    });

    await startBot();
    console.log();
    console.log(chalk.magenta.bold(`Cron AKTIF`));
    console.log(chalk.magenta('Jam 08:00 WIB Autobot Akan Run Ulang...'));
}

main();
