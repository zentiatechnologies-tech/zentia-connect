import { describe, expect, it } from "vitest";
import { bestPicks, recommend, searchTools, tools } from "./model";

describe("tool hub model", () => {
  it("loads the full catalog with unique ids", () => {
    expect(tools.length).toBe(46);
    expect(new Set(tools.map((t) => t.id)).size).toBe(tools.length);
  });

  it("covers every chosen goal in a shortlist", () => {
    const picks = recommend({ prof: "retail", goals: ["marketing", "finance", "customers"], comfort: 2, budget: "free" });
    for (const g of ["marketing", "finance", "customers"]) {
      expect(picks.some((p) => p.tool.goals.includes(g))).toBe(true);
    }
  });

  it("respects comfort level and budget", () => {
    const picks = recommend({ prof: "tech", goals: ["automation", "web"], comfort: 1, budget: "free" });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.tool.level === 1 && p.tool.price !== "paid")).toBe(true);
  });

  it("puts profession-specific tools on that profession's board", () => {
    const farm = bestPicks("agri").map((t) => t.id);
    expect(farm).toContain("plantvillage");
    expect(bestPicks("education").map((t) => t.id)).toContain("magicschool");
  });

  it("searches by name and filters by category", () => {
    expect(searchTools("canva", "", "").map((t) => t.id)).toContain("canva");
    expect(searchTools("", "Finance", "").every((t) => t.cat === "Finance")).toBe(true);
  });
});
