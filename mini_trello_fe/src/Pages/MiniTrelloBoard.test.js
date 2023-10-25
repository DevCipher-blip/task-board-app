import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing";
import Modal from "react-modal";
import { MiniTrelloBoard } from "./MiniTrelloBoard";
import { GET_CARDS } from "../graphql/queries";
function show(cards=[]) {
 const root=document.createElement("div");root.id="root";document.body.appendChild(root);Modal.setAppElement(root);
 return render(<MockedProvider addTypename={false} mocks={[{request:{query:GET_CARDS},result:{data:{allCards:cards}}}]}><MiniTrelloBoard /></MockedProvider>,{container:root});
}
test("a loaded empty board has three stages and an accessible add form", async()=>{
 show();await screen.findByRole("heading",{name:/To-Do/});
 expect(screen.getByRole("heading",{name:/In Progress/})).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Add Card"}));
 expect(screen.getByLabelText("Title")).toBeInTheDocument();expect(screen.getByRole("button",{name:"Save"})).toBeDisabled();
});
test("cancelling an edit clears the editor before a new card", async()=>{
 show([{id:"synthetic-1",title:"Synthetic task",description:"Example only",status:"todo"}]);
 fireEvent.click(await screen.findByRole("button",{name:"Edit Synthetic task"}));
 expect(screen.getByLabelText("Title")).toHaveValue("Synthetic task");
 fireEvent.click(screen.getByRole("button",{name:"Cancel"}));fireEvent.click(screen.getByRole("button",{name:"Add Card"}));
 expect(screen.getByLabelText("Title")).toHaveValue("");expect(screen.getByRole("button",{name:"Save"})).toBeDisabled();
});
