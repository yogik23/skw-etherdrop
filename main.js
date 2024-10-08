const axios = require('axios');
const fs = require('fs').promises; 
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');
const displayWelcomeMessage = require('./welcomeMessage');

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
            console.error(chalk.red('Authentication failed:'), error.message);
            if (error.response) {
                console.error('Error details:', error.response.data);
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
            console.log(chalk.cyan(`ALL QUEST`));
            quests.forEach(quest => {
                if (quest.status === 'NEW') {
                    console.log(chalk.blue(`- ${quest.name} (Status: ${quest.status})`));
                } else if (quest.status === 'COMPLETED') {
                    console.log(chalk.green(`- ${quest.name} (Status: ${quest.status})`));
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
        console.log(chalk.gray('Mengerjakan quest..perlu beberapa jam agar quest bisa diclaim'));

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
    }
}

async function startBot() {
    const api = new MiniAppAPI();
    const dataFile = path.join(__dirname, 'data.txt');

    try {
        const data = await fs.readFile(dataFile, 'utf8');
        const users = data.split('\n').filter(Boolean);

        for (let user of users) {
            const userData = Object.fromEntries(new URLSearchParams(user.trim()));
            const payload = {
                ...userData,
                webAppData: user
            };

            const tokens = await api.auth(payload);
            if (tokens) {
                const { accessToken, refreshToken } = tokens;

                const profile = await api.getProfile(accessToken);
                console.log(chalk.magenta.bold(`Akun ${profile.tgUsername}`));

                await api.processall(accessToken, refreshToken);
                console.log(chalk.green.bold(`Balance ${profile.tgUsername} : ${profile.balance}`));
                console.log('');
            } else {
                console.error(chalk.red('Authentication failed or no token received.'));
            }
        }

    } catch (error) {
        console.error(chalk.red('Error reading data file:'), error.message);
    }
}


async function main() {
  console.clear();
  const intervalTime = (24 * 60 * 60 * 1000);

  const runBot = async () => {
    displayWelcomeMessage();
    await startBot();
    startCountdown();
  };

  const startCountdown = () => {
    let countdown = intervalTime / 1000;

    const countdownInterval = setInterval(() => {
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        console.log(chalk.red('Waktu habis, menjalankan bot kembali...\n'));
      } else {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(chalk.magenta(`Cooldown Claim Berikutnya: ${countdown} detik. Bot By skwairdrop`));
        countdown--;
      }
    }, 1000);
  };

  await runBot();

  setInterval(runBot, intervalTime);
}

if (require.main === module) {
  main();
}
