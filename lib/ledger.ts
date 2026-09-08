export type Balance = { name: string; amount: number };

/** Derives an equal share from the people participating in a booking. */
export function deriveShare(amount: number, participantCount: number) {
  if (participantCount <= 0) return 0;
  return Math.round((amount / participantCount) * 100) / 100;
}

/** Routes a refund back to the members who bore the booking cost. */
export function routeRefund(amount: number, costShares: Balance[]): Balance[] {
  const total = costShares.reduce((sum, share) => sum + share.amount, 0);
  if (amount <= 0 || total <= 0) return costShares.map((share) => ({ ...share, amount: 0 }));
  return costShares.map((share) => ({
    name: share.name,
    amount: Math.round((amount * (share.amount / total)) * 100) / 100,
  }));
}

/** Reduces mutual debts to one transfer per debtor/creditor pair for this prototype. */
export function minimiseSettlement(debts: Balance[], credits: Balance[]) {
  const debtors = debts.filter((item) => item.amount > 0).map((item) => ({ ...item }));
  const creditors = credits.filter((item) => item.amount > 0).map((item) => ({ ...item }));
  const transfers: { from: string; to: string; amount: number }[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
    transfers.push({ from: debtors[debtorIndex].name, to: creditors[creditorIndex].name, amount: Math.round(amount * 100) / 100 });
    debtors[debtorIndex].amount -= amount;
    creditors[creditorIndex].amount -= amount;
    if (debtors[debtorIndex].amount < 0.01) debtorIndex += 1;
    if (creditors[creditorIndex].amount < 0.01) creditorIndex += 1;
  }
  return transfers;
}
