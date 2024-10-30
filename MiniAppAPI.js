const axios = require('axios');
const chalk = require('chalk');

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
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                const response = await axios.get(url, { headers });
                const { tgUsername, balance } = response.data;
                return { tgUsername, balance };
            } catch (error) {
                attempt++;
                console.error(chalk.red(`Attempt ${attempt} - Failed to get profile:`), error.message);
            }
        }
        return null;
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
                    status: quest.status,
                    claimAllowed: quest.claimAllowed
                }))
            );
            quests.forEach(quest => {
                if (quest.status === 'NEW') {
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

    async getOrder(token) {
        const url = 'https://api.miniapp.dropstab.com/api/order';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            console.error(chalk.red('Error saat mendapatkan koin:'), error.message);
            return null;
        }
    }

    async claimorder(token, orderid) {
        const url = `https://api.miniapp.dropstab.com/api/order/${orderid}/claim`;
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.put(url, {}, { headers });
            return response.data;
        } catch (error) {
            console.error(chalk.red(`Failed:`), error.message);
            return null;
        }
    }

    async markChecked(token, orderid) {
        const url = `https://api.miniapp.dropstab.com/api/order/${orderid}/markUserChecked`;
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.put(url, {}, { headers });
            return response.data;
        } catch (error) {
            console.error('Error marking checked:', error.message);
            return null;
        }
    }

    async getCoins(token) {
        const url = 'https://api.miniapp.dropstab.com/api/order/coins';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            console.error(chalk.red('Error saat mendapatkan koin:'), error.message);
            return null;
        }
    }

    async postOrder(token, order) {
        const url = 'https://api.miniapp.dropstab.com/api/order';
        const headers = { ...this.headers, 'Authorization': `Bearer ${token}` };

        try {
            const response = await axios.post(url, order, { headers });
            return response.data;
        } catch (error) {
            return null;
        }

    }
}


module.exports = MiniAppAPI;
