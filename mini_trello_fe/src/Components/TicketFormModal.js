import React from "react";
import Modal from "react-modal";

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
      width: "40rem",
      height: "auto",
      margin: "auto",
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
    },
  };

  return (
    <div className="status-column">
      <button onClick={openModal}>Add Card</button>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={updateCardData ? "Update Card" : "Add New Card"}
        style={customStyles}
      >
        <h2>{updateCardData ? "Update Card" : "Add New Card"}</h2>
        <input
          type="text"
          placeholder="Card Title"
          value={updateCardData ? updateCardData.title : newCardTitle}
          onChange={handleInputChange}
          name="title"
        />
        <textarea
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
          <button onClick={saveCard}>Save</button>
        )}
        <button onClick={closeModal}>Cancel</button>
      </Modal>
    </div>
  );
};
