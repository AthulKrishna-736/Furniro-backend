import walletModel from "../../models/walletModel.js";

//getwallet
export const getUserWallet = async (req, res, next) => {
    const { userId } = req.params;
    const { page } = req.query;

    if (!userId) {
        return next({ statusCode: 404, message: 'User not found' });
    }

    let wallet = await walletModel.findOne({ userId });

    if (!wallet) {
        wallet = await walletModel.create({
            userId,
            balance: 4000,
            transactions: [
                {
                    type: 'credit',
                    amount: 4000,
                    description: 'Welcome bonus credited to your wallet!',
                    date: new Date(),
                },
            ],
        });
    }

    wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const limit = 5;
    const skip = (page - 1) * limit;
    const transactions = wallet.transactions.slice(skip, skip + limit);
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
        message: wallet.transactions.length === 1 ?
            'Wallet created successfully with a welcome bonus of ₹4000!' :
            'Wallet fetched successfully',
        wallet: {
            balance: wallet.balance,
            transactions,
        },
        pagination: { totalTransactions, totalPages },
    });
};

//credit amount
export const updateWallet = async (req, res, next) => {
    const { userId } = req.params;
    const { amount, description, type, orderId } = req.body;

    if (!amount || !description || amount <= 0 || !['credit', 'debit'].includes(type) || !orderId) {
        return next({ statusCode: 400, message: 'Invalid input. Provide a valid amount, description, orderId, and type ("credit" or "debit").' })
    }

    let wallet = await walletModel.findOne({ userId });
    if (!wallet) {
        wallet = new walletModel({
            userId,
            balance: 0,
            transactions: [],
        });
    }

    if (type == 'credit') {
        wallet.balance += amount;
    } else if (type == 'debit') {
        if (wallet.balance < amount) {
            return next({ statusCode: 400, message: 'Insufficient balance for debit' })
        }
        wallet.balance -= amount;
    }

    wallet.transactions.push({
        type,
        amount,
        description,
        relatedOrderId: orderId,
        date: new Date(),
    });

    await wallet.save();

    res.status(200).json({ message: 'Amount credited successfully', wallet: { balance: wallet.balance, transaction: wallet.transactions } });
}