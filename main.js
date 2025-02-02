const axios = require('axios');
const fs = require('fs').promises; 
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');
const cron = require('node-cron');
require('dotenv').config();
const displayskw = require('./displayskw');
const MiniAppAPI = require('./MiniAppAPI');
const { processall, predik }  = require('./xhub');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const date = new Date().toLocaleDateString('id-ID');

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

    const api = new MiniAppAPI();
    const dataFile = path.join(__dirname, 'data.txt');

    try {
        const data = await fs.readFile(dataFile, 'utf8');
        const users = data.split('\n').filter(Boolean);
        const tokensList = [];
        let totalBalanceXnxx = 0;

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
                await processall(api, accessToken, refreshToken);
                console.log(chalk.magenta(`Balance ${profile.tgUsername} : ${profile.balance}\n`));

                const updatedProfile = await api.getProfile(accessToken);
                totalBalanceXnxx += parseFloat(updatedProfile.balance);
            } else {
            }
        }

        console.log(chalk.green.bold(`Total Balance Semua Akun : ${totalBalanceXnxx}\n\n`));

        await sendToTelegram(tokensList.length, totalBalanceXnxx);

    } catch (error) {
        console.error(chalk.red('Error reading data file:'), error.message);
    }
}

async function main() {
    cron.schedule('0 */4 * * *', async () => {
        await startBot();
        console.log();
        console.log(chalk.magenta.bold(`Cron AKTIF`));
        console.log(chalk.magenta('Autobot Akan Run Ulang Setiap 4 Jam...'));
    });

    await startBot();
    console.log();
    console.log(chalk.magenta.bold(`Cron AKTIF`));
    console.log(chalk.magenta('Autobot Akan Run Ulang Setiap 4 Jam...'));
}

main();
