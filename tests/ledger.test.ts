import { describe, expect, it } from "vitest";

import { closeoutNet, deriveShare, forecastCost, fundingProgress, minimiseSettlement, netByCurrency, poolBalance, recordCurrencyExpense, routeRefund } from "../lib/ledger";

describe("GroupTrip Ledger deterministic math", () => {
  it("derives a booking share from participation count", () => {
    expect(deriveShare(8000, 3)).toBe(2666.67);
    expect(deriveShare(24000, 4)).toBe(6000);
    expect(deriveShare(5000, 0)).toBe(0);
  });

  it("routes refunds to the people who bore the cost", () => {
    expect(routeRefund(18000, [
      { name: "Amit", amount: 30000 },
      { name: "Rohan", amount: 10000 },
    ])).toEqual([
      { name: "Amit", amount: 13500 },
      { name: "Rohan", amount: 4500 },
    ]);
  });

  it("minimises settlement into the fewest matching transfers", () => {
    expect(minimiseSettlement(
      [{ name: "Aisha", amount: 1240 }, { name: "Neha", amount: 760 }],
      [{ name: "Amit", amount: 1500 }, { name: "Rohan", amount: 500 }],
    )).toEqual([
      { from: "Aisha", to: "Amit", amount: 1240 },
      { from: "Neha", to: "Amit", amount: 260 },
      { from: "Neha", to: "Rohan", amount: 500 },
    ]);
  });
});


it("forecasts a person's cost from draft opt-ins", () => {
  expect(forecastCost([
    { category: "Stay", amount: 24000, participantCount: 4 },
    { category: "Activity", amount: 8000, participantCount: 3 },
  ])).toBe(8666.67);
  expect(forecastCost([
    { category: "Stay", amount: 24000, participantCount: 4 },
    { category: "Activity", amount: 8000, participantCount: 3 },
  ], [true, false])).toBe(6000);
});

it("tracks escrow funding and close-out totals deterministically", () => {
  expect(poolBalance(36000, 24000)).toEqual({ collected: 36000, committed: 24000, available: 12000 });
  expect(fundingProgress([
    { name: "Aisha", amount: 18000 },
    { name: "Rohan", amount: 18000 },
    { name: "Priya", amount: 0 },
  ], 18000)).toEqual({ required: 54000, collected: 36000, remaining: 18000, complete: false });
  expect(closeoutNet(12000, 18000, 4500)).toBe(34500);
});

it("preserves original currency and records FX costs separately", () => {
  expect(recordCurrencyExpense({ originalAmount: 180, currency: "USD", fxRate: 83.12, fxSpread: 120, foreignFee: 75 })).toEqual({
    originalAmount: 180, currency: "USD", fxRate: 83.12, fxSpread: 120, foreignFee: 75, baseAmount: 14961.6, totalBaseCost: 15156.6,
  });
  expect(netByCurrency([
    { originalAmount: 180, currency: "USD", fxRate: 83.12, fxSpread: 120, foreignFee: 75 },
    { originalAmount: 50, currency: "USD", fxRate: 83.2, fxSpread: 0, foreignFee: 0 },
    { originalAmount: 2200, currency: "INR", fxRate: 1, fxSpread: 0, foreignFee: 0 },
  ])).toEqual({ USD: 230, INR: 2200 });
});
