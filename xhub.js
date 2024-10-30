const chalk = require('chalk');
const MiniAppAPI = require('./MiniAppAPI');

async function predik(api, accessToken) {
    let token = accessToken;

    const puki = await api.getOrder(token);
    if (puki) {
        const totalScore = puki.totalScore || 0;
        const listPeriods = puki.periods || [];

        for (const list of listPeriods) {
            const detailOrder = list.order || null;

            if (detailOrder) {
                const statusss = detailOrder.status || '';
                const orderid = detailOrder.id;

                if (statusss === 'CLAIM_AVAILABLE') {
                    await api.claimorder(token, orderid);
                    console.log(chalk.hex('#00FF00')(`Berhasil mengklaim order ${orderid}`));
                } else if (statusss === "PENDING") {
                    console.log(chalk.hex('#F0E68C')(`Order ${orderid} masih menunggu`));
                } else if (statusss === "NOT_WIN") {
                    await api.markChecked(token, orderid);
                    console.log(chalk.hex('#DC143C')(`Order ${orderid} tidak menang.`));
                }
            }
        }

        const coins = [
            { id: 1, symbol: 'BTC' },
            { id: 2, symbol: 'ETH' },
            { id: 19067, symbol: 'SOL' },
            { id: 34, symbol: 'DOGE' },
            { id: 18, symbol: 'TRX' },
            { id: 30777, symbol: 'TON' },
            { id: 49060, symbol: 'PEPE' },
            { id: 24716, symbol: 'SHIB' },
            { id: 65340, symbol: 'NOT' },
            { id: 77822, symbol: 'HMSTR' }
        ];

        const coinIds = coins.map(coin => coin.id);
        const shortOptions = [false, true];
        const kolor = {
            1: '1 jam',
            2: '4 jam',
            3: '24 jam'
        };

        for (let periodId of [1, 2, 3]) {
            const randomCoinId = coinIds[Math.floor(Math.random() * coinIds.length)];
            const isShort = shortOptions[Math.floor(Math.random() * shortOptions.length)];
            const coinSymbol = coins.find(coin => coin.id === randomCoinId).symbol;

            const order = {
                coinId: randomCoinId,
                short: isShort,
                periodId: periodId
            };

            const result = await api.postOrder(token, order);
            if (result) {
                console.log(chalk.hex('#90ee90')(`Memasang ${kolor[periodId]} ${coinSymbol} ${isShort ? 'short' : 'long'} Berhasil!`));
            } else {
                console.log(chalk.hex('#ff6666')(`Memasang ${kolor[periodId]} ${coinSymbol} ${isShort ? 'short' : 'long'} Gagal`));
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

    } else {
        console.log('Gagal mendapatkan order, menghentikan predik.');
    }
}


async function processall(api, accessToken, refreshToken) {
    let token = accessToken;

    const bonusResult = await api.dailyBonus(token);
    if (!bonusResult) {
        token = await api.refreshAccessToken(refreshToken);
        if (token) {
            const newBonusResult = await api.dailyBonus(token);
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

    await predik(api, accessToken);

    const quests = await api.getQuests(token);
    if (!quests) return;

    const verificationResults = [];

    for (const quest of quests) {
        if (quest.status === 'NEW') {
            const { id, name } = quest;
            console.log(chalk.blue(`Mengerjakan quest: ${name}`));
            const result = await api.doQuest(token, id, name);
            verificationResults.push({ id, name, result });
        }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    for (const { id, name } of verificationResults) {
         const claimResult = await api.claimQuest(token, id, name);
         console.log(
             claimResult 
                 ? chalk.green(`- ${name} Berhasil`) 
                 : chalk.red(`- ${name}... Kerjakan Manual`)
         );
    }

    const claimReffResult = await api.claimreff(token);
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

async function xnxx(api, accessToken, refreshToken) {
    let token = accessToken;
    const quests = await api.getQuests(token);
    if (!quests) return;

    for (const quest of quests) {
        if (quest.status === 'NEW') {
            const { id, name } = quest;
            console.log(chalk.blue(`quest: ${name}`));
        }
    }

    for (const quest of quests) {
        const { id, name, claimAllowed } = quest;
        console.log(chalk.blue(`- ${quest.name} (Status: ${quest.status})`));

        if (claimAllowed) { 
            const claimResult = await api.claimQuest(token, id, name);
            console.log(
                claimResult 
                    ? chalk.green(`- ${name} Berhasil`) 
                    : chalk.red(`- ${name}... Kerjakan Manual`)
            );
        } else {
            console.log(chalk.yellow(`- ${name} tidak dapat diklaim`));
        }
    }

    const claimReffResult = await api.claimreff(token);
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

module.exports = { xnxx, processall, predik };
