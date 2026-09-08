import { describe, expect, it } from "vitest";

import { deriveShare, minimiseSettlement, routeRefund } from "../lib/ledger";

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
