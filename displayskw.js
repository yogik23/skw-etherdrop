const chalk = require('chalk');
const welcomeskw = `
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
                          
`;

function displayskw() {
  console.log(welcomeskw);
  console.log(chalk.hex('#ffb347')(`Fitur Autobot by SKW AIRDROP HUNTER`));
  console.log(chalk.hex('#90ee90')('1. Multi Akun'));
  console.log(chalk.hex('#90ee90')('2. Auto complete task'));
  console.log(chalk.hex('#90ee90')('3. Daily check in & Daily Task'));
  console.log(chalk.hex('#90ee90')('4. Send Notif Ke Telegram'));
  console.log(chalk.hex('#90ee90')('5. Otomatis mengulang Autobot dijam 8 Pagi'));
}

module.exports = displayskw;
