import { expect, test } from "vitest";
import { latest } from "./latest";

test("should call the only request the newest", () => {
  // given
  const requests = latest();

  // when
  const isNewest = requests.begin();

  // then
  expect(isNewest()).toBe(true);
});

test("should call a request replaced once a newer one began", () => {
  // given
  const requests = latest();
  const first = requests.begin();

  // when
  const second = requests.begin();

  // then
  expect(first()).toBe(false);
  expect(second()).toBe(true);
});

test("should call every request replaced after a drop", () => {
  // given
  const requests = latest();
  const first = requests.begin();

  // when
  requests.drop();

  // then
  expect(first()).toBe(false);
  expect(requests.begin()()).toBe(true);
});
