import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "react-modal";
import { beforeEach, expect, test, vi } from "vitest";
import { ADD_CARD, DELETE_CARD, UPDATE_CARD } from "../graphql/mutations";
import { GET_CARDS } from "../graphql/queries";
import { MiniTrelloBoard } from "./MiniTrelloBoard";

const card = (id, title, status, position, description = "") => ({
  __typename: "CardType",
  id,
  title,
  description,
  status,
  position,
});

const boardQuery = (cards) => ({ request: { query: GET_CARDS }, result: { data: { allCards: cards } } });

function showBoard(mocks) {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  Modal.setAppElement(root);
  return render(
    <MockedProvider mocks={mocks}>
      <MiniTrelloBoard />
    </MockedProvider>,
    { container: root },
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
});

test("shows a loading state, then three empty lanes", async () => {
  showBoard([boardQuery([])]);
  expect(screen.getByRole("status")).toHaveTextContent("Loading the board");
  expect(await screen.findByRole("heading", { name: /To do/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /In progress/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Done/ })).toBeInTheDocument();
  expect(screen.getByText("No cards yet")).toBeInTheDocument();
  expect(screen.getByText("Nothing queued. Add a card to start.")).toBeInTheDocument();
});

test("renders cards in their lanes, ordered by position", async () => {
  showBoard([
    boardQuery([
      card("2", "Second", "todo", 2048),
      card("1", "First", "todo", 1024, "Has notes"),
      card("3", "Shipped", "done", 1024),
    ]),
  ]);
  const todo = (await screen.findByRole("heading", { name: /To do/ })).closest("section");
  const titles = within(todo).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
  expect(titles).toEqual(["First", "Second"]);
  expect(within(todo).getByText("Has notes")).toBeInTheDocument();
  expect(screen.getByText("3 cards across 3 lanes")).toBeInTheDocument();
});

test("offers a retry when the API is unreachable", async () => {
  showBoard([
    { request: { query: GET_CARDS }, error: new Error("offline") },
    boardQuery([card("1", "Back online", "todo", 1024)]),
  ]);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("not reachable");
  await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Back online")).toBeInTheDocument();
});

test("creates a card in the chosen lane and refreshes the board", async () => {
  const created = card("9", "Write docs", "in-progress", 1024, "README first");
  showBoard([
    boardQuery([]),
    {
      request: { query: ADD_CARD, variables: { title: "Write docs", description: "README first", status: "in-progress" } },
      result: { data: { createCard: { __typename: "CreateCard", card: created } } },
    },
    boardQuery([created]),
  ]);
  await userEvent.click(await screen.findByRole("button", { name: "New card" }));
  const submit = screen.getByRole("button", { name: "Add card" });
  expect(submit).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Title"), "  Write docs ");
  await userEvent.type(screen.getByLabelText("Description"), "README first");
  await userEvent.selectOptions(screen.getByLabelText("Lane"), "in-progress");
  await userEvent.click(submit);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  const doing = screen.getByRole("heading", { name: /In progress/ }).closest("section");
  expect(within(doing).getByText("Write docs")).toBeInTheDocument();
});

test("keeps the form open with a message when saving fails", async () => {
  showBoard([
    boardQuery([]),
    {
      request: { query: ADD_CARD, variables: { title: "Doomed", description: "", status: "todo" } },
      error: new Error("Network down"),
    },
  ]);
  await userEvent.click(await screen.findByRole("button", { name: "New card" }));
  await userEvent.type(screen.getByLabelText("Title"), "Doomed");
  await userEvent.click(screen.getByRole("button", { name: "Add card" }));
  expect(await within(screen.getByRole("dialog")).findByRole("alert")).toHaveTextContent("Network down");
  expect(screen.getByLabelText("Title")).toHaveValue("Doomed");
});

test("edits a card and clears the editor when cancelled", async () => {
  const original = card("1", "Draft", "todo", 1024, "Old notes");
  showBoard([
    boardQuery([original]),
    {
      request: { query: UPDATE_CARD, variables: { id: "1", title: "Final", description: "Old notes" } },
      result: { data: { updateCard: { __typename: "UpdateCard", card: { ...original, title: "Final" } } } },
    },
  ]);
  await userEvent.click(await screen.findByRole("button", { name: "Edit Draft" }));
  expect(screen.getByLabelText("Title")).toHaveValue("Draft");
  expect(screen.queryByLabelText("Lane")).not.toBeInTheDocument();

  await userEvent.clear(screen.getByLabelText("Title"));
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Title"), "Final");
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Final")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Edit Final" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await userEvent.click(screen.getByRole("button", { name: "New card" }));
  expect(screen.getByLabelText("Title")).toHaveValue("");
});

test("deletes a card only after confirmation and reports failures", async () => {
  const doomed = card("1", "Old task", "done", 1024);
  showBoard([
    boardQuery([doomed]),
    { request: { query: DELETE_CARD, variables: { id: "1" } }, error: new Error("offline") },
  ]);
  const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  await userEvent.click(await screen.findByRole("button", { name: "Delete Old task" }));
  expect(screen.getByText("Old task")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Delete Old task" }));
  expect(await screen.findByRole("alert")).toHaveTextContent('"Old task" could not be deleted');
  expect(confirm).toHaveBeenCalledTimes(2);
  confirm.mockRestore();
});
