import React from "react";
import Modal from "react-modal";
if (typeof document !== "undefined" && document.getElementById("root")) Modal.setAppElement("#root");

export const TicketFormModal = ({
  isModalOpen,
  openModal,
  closeModal,
  newCardTitle,
  newCardDescription,
  handleInputChange,
  saveCard,
  updateCardData,
  updateCardHandler,
}) => {
  const customStyles = {
    content: {
      width: "min(40rem, calc(100vw - 2rem))",
      height: "auto",
      maxHeight: "85vh",
      margin: "auto",
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
    },
  };

  return (
    <div className="board-toolbar">
      <button onClick={openModal}>Add Card</button>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={updateCardData ? "Update Card" : "Add New Card"}
        style={customStyles}
      >
        <h2>{updateCardData ? "Update Card" : "Add New Card"}</h2>
        <label htmlFor="card-title">Title</label>
        <input id="card-title"
          type="text"
          placeholder="Card Title"
          value={updateCardData ? updateCardData.title : newCardTitle}
          onChange={handleInputChange}
          name="title"
        />
        <label htmlFor="card-description">Description</label>
        <textarea id="card-description"
          placeholder="Card Description"
          name="description"
          value={
            updateCardData ? updateCardData.description : newCardDescription
          }
          onChange={handleInputChange}
        />
        {updateCardData ? (
          <button onClick={() => updateCardHandler(updateCardData.id)}>
            Update
          </button>
        ) : (
          <button onClick={saveCard} disabled={!newCardTitle.trim()}>Save</button>
        )}
        <button onClick={closeModal}>Cancel</button>
      </Modal>
    </div>
  );
};
