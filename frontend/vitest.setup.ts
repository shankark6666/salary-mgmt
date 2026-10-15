import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy*/waitFor budget; see testTimeout in vitest.config.ts for why it is not the 1s default.
configure({ asyncUtilTimeout: 5_000 });

// jsdom has <dialog> but not its modal API. Mirror what browsers do to the `open` state so
// dialog contents are visible to accessibility queries, as they are to real users.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
