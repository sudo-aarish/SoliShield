import dotenv from "dotenv";
dotenv.config();

export function calculatePrice(lineCount) {
  const base = 0.50;
  const perLine = 0.01;
  return (base + (lineCount * perLine)).toFixed(2);
}

export function getPaymentRequest(amount = "1.00", network = "base-sepolia") {
  return {
    amount: amount,
    recipient: process.env.RECEIVING_WALLET,
    network: network,
    description: `Audit Fee: ${amount} USDC`
  };
}

export async function verifyPayment(paymentData, expectedAmount) {
  try {
    if (!paymentData?.txHash || !paymentData?.success) return false;

    if (expectedAmount) {
      const paidAmount = parseFloat(paymentData.amount);
      const requiredAmount = parseFloat(expectedAmount);
      if (paidAmount < requiredAmount) {
        console.error(`Amount Mismatch: Paid ${paidAmount}, Required ${requiredAmount}`);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Verification failed:", err.message);
    return false;
  }
}