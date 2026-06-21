import { describe, it, expect } from "vitest";
import { chunkArray } from "./chunk";

describe("chunkArray", () => {
  it("chunks array into equal parts", () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("handles remainder chunk", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles chunk size larger than array", () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("handles empty array", () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it("handles chunk size of 1", () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("throws error for zero chunk size", () => {
    expect(() => chunkArray([1, 2, 3], 0)).toThrow("chunk size must be greater than zero");
  });

  it("throws error for negative chunk size", () => {
    expect(() => chunkArray([1, 2, 3], -1)).toThrow("chunk size must be greater than zero");
  });

  it("works with string arrays", () => {
    expect(chunkArray(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
  });

  it("does not mutate original array", () => {
    const original = [1, 2, 3, 4];
    chunkArray(original, 2);
    expect(original).toEqual([1, 2, 3, 4]);
  });
});
