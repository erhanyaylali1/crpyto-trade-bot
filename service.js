const { Spot } = require('@binance/connector');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

class WalletService {

    constructor() {
        this.client = new Spot(process.env.API_KEY, process.env.API_SECRET, {
            verbose: true,
            useServerTime: false,
        });
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'erhanwindows8@gmail.com',
                pass: process.env.PASSWORD
            }
        });
        this.get();
        this.shouldSell = this.shouldSellCalculator();
        this.lastPrice = null;
        this.lastTradeId = null;
    }

    shouldSellCalculator = async () => {
        this.shouldSell = false;
        await this.client.account().then(response => {
            const { balances } = response.data;
            balances.forEach((el) => {
                if (el.asset === 'SHIB') {
                    if (el.free) {
                        this.shouldSell = true;
                    } else {
                        this.shouldSell = false;
                    }
                }
            })
        })
    }

    get = async (req, res) => {
        await setInterval(this.process, 5000);
    }

    process = async () => {

        console.log("-----------------------------------------------------------------------");
        const [bnbNumber, usdtNumber] = await this.getBnbNumber();
        const bnbPrice = await this.getBnbPrice();

        if (bnbPrice !== null) {
            try {
                const wantedPrice = parseFloat(this.lastPrice * (1 + (this.shouldSell ? 0.005 : -0.005))).toFixed(8);
                console.log(this.shouldSell ? "SELL" : "BUY")
                console.log("Last Price: ", this.lastPrice);
                console.log("Current Price: ", bnbPrice);
                console.log("Wanted Price: ", wantedPrice);
                const { data } = await this.client.openOrders();
                console.log("Open Orders: ", data.map((el) => el.orderId), " lastTradeId: ", this.lastTradeId);
                const isThereOrder = data.map((el) => el.orderId).includes(this.lastTradeId);
                console.log("Is there order: ", isThereOrder);
                if (!isThereOrder) {
                    if (this.shouldSell && bnbPrice > wantedPrice) await this.sell(bnbPrice, bnbNumber);
                    if (!this.shouldSell && bnbPrice < wantedPrice) await this.buy(bnbPrice, usdtNumber)
                } else {
                    console.log("işlem bitmedi");
                }
            } catch (e) {
                console.log(e);
            }

        }
    }

    getBnbNumber = async () => {
        let bnbNumber = null, usdtNumber = null;
        await this.client.account().then(response => {
            const { balances } = response.data;
            balances.forEach((el) => {
                if (el.asset === 'SHIB') {
                    bnbNumber = el.free;
                } else if (el.asset === 'USDT') {
                    usdtNumber = el.free;
                }
            })
        }).catch((err) => console.log(err));
        return [bnbNumber, usdtNumber];
    }

    getBnbPrice = async () => {
        let bnbPrice = null;
        await this.client.tickerPrice('SHIBUSDT')
            .then((res) => {
                bnbPrice = res.data.price
                if (this.lastPrice === null) {
                    this.lastPrice = res.data.price;
                    console.log("lastPrice: ", this.lastPrice);
                }
            })
        return bnbPrice;
    }

    sell = async (bnbPrice, bnbNumber) => {
        await this.client.newOrder('SHIBUSDT', 'SELL', 'LIMIT', {
            price: bnbPrice,
            quantity: parseInt(bnbNumber * 0.95),
            timeInForce: 'GTC'
        }).then(response => {
            console.log("satış, fiyat: ", bnbPrice);
            this.sendMail("SATIŞ", bnbPrice, this.lastPrice);
            this.lastTradeId = response.data.orderId
            this.lastPrice = bnbPrice;
            this.shouldSell = false;
        })
            .catch(error => this.client.logger.error(error.response))
    }

    buy = async (bnbPrice, usdtNumber) => {
        await this.client.newOrder('SHIBUSDT', 'BUY', 'LIMIT', {
            price: bnbPrice,
            quantity: parseInt(usdtNumber / bnbPrice),
            timeInForce: 'GTC'
        }).then(response => {
            console.log("alış, fiyat: ", bnbPrice);
            this.sendMail("ALIŞ", bnbPrice, this.lastPrice);
            this.lastTradeId = response.data.orderId
            this.lastPrice = bnbPrice;
            this.shouldSell = true;
        })
            .catch(error => this.client.logger.error(error.response))
    }

    sendMail = async (type, price, lastPrice) => {
        var mailOptions = {
            from: 'erhanwindows8@gmail.com',
            to: 'erhanyaylali9@gmail.com',
            subject: `SHIB/USTD: ${parseFloat(price).toFixed(8)} fiyatından ${type} emri verildi.`,
            text: `${new Date().toLocaleString()} tarihinde SHIB/USTD: ${price} fiyatından ${type} emri verildi. Önceki Emir ise SHIB:/USTD: ${parseFloat(lastPrice).toFixed(8)} fiyatından ${type === "ALIŞ" ? "SATIŞ" : "ALIŞ"} olarak gerçekleştirildi.`
        };
        await this.transporter.sendMail(mailOptions);
    }

}

module.exports = WalletService;



