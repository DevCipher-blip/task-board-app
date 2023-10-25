import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./MiniTrelloBoard.css";
import { TicketFormModal } from "../Components/TicketFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { GET_CARDS } from "../graphql/queries";
import {
  MOVE_CARD,
  ADD_CARD,
  UPDATE_CARD,
  DELETE_CARD,
} from "../graphql/mutations";

export const MiniTrelloBoard = () => {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, loading, error } = useQuery(GET_CARDS);
  const [allCards, setAllCards] = useState();
  const [updateCardData, setUpdateCardData] = useState(null);

  useEffect(() => {
    setAllCards({
      lanes: [
        {
          id: "todo",
          title: "To-Do",
          label: "2/2",
          cards: data?.allCards.filter((card) => card.status === "todo"),
        },
        {
          id: "in-progress",
          title: "In Progress",
          label: "0/0",
          cards: data?.allCards.filter((card) => card.status === "in-progress"),
        },
        {
          id: "done",
          title: "Done",
          label: "0/0",
          cards: data?.allCards.filter((card) => card.status === "done"),
        },
      ],
    });
  }, [data]);

  const [moveCard] = useMutation(MOVE_CARD);
  const [addCard] = useMutation(ADD_CARD);
  const [updateCard] = useMutation(UPDATE_CARD);
  const [deleteCard] = useMutation(DELETE_CARD);

  const moveCardHandler = (id, newStatus) => {
    moveCard({ variables: { id, status: newStatus } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (updateCardData) {
      setUpdateCardData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else {
      if (name === "title") {
        setNewCardTitle(value);
      } else if (name === "description") {
        setNewCardDescription(value);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const sourceLaneId = result.source.droppableId;
    const destinationLaneId = result.destination.droppableId;
    const cardId = result.draggableId;

    if (sourceLaneId === destinationLaneId) {
      const lane = allCards.lanes.find((lane) => lane.id === sourceLaneId);
      const updatedCards = Array.from(lane.cards);
      const [movedCard] = updatedCards.splice(result.source.index, 1);
      updatedCards.splice(result.destination.index, 0, movedCard);

      setAllCards((prevState) => {
        const updatedLanes = prevState.lanes.map((lane) => {
          if (lane.id === sourceLaneId) {
            return { ...lane, cards: updatedCards };
          }
          return lane;
        });

        return { lanes: updatedLanes };
      });
    } else {
      moveCardHandler(cardId, destinationLaneId);

      setAllCards((prevState) => {
        const sourceLane = prevState.lanes.find(
          (lane) => lane.id === sourceLaneId
        );
        const destinationLane = prevState.lanes.find(
          (lane) => lane.id === destinationLaneId
        );

        const updatedSourceCards = Array.from(sourceLane.cards);
        const updatedDestinationCards = Array.from(destinationLane.cards);

        const [movedCard] = updatedSourceCards.splice(result.source.index, 1);
        updatedDestinationCards.splice(result.destination.index, 0, movedCard);

        const updatedLanes = prevState.lanes.map((lane) => {
          if (lane.id === sourceLaneId) {
            return { ...lane, cards: updatedSourceCards };
          } else if (lane.id === destinationLaneId) {
            return { ...lane, cards: updatedDestinationCards };
          }
          return lane;
        });

        return { lanes: updatedLanes };
      });
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCardTitle("");
    setNewCardDescription("");
  };

  const openUpdateModal = (card) => {
    setUpdateCardData(card);
    openModal();
  };

  const saveCard = () => {
    addCard({
      variables: {
        title: newCardTitle,
        description: newCardDescription,
        status: "todo",
      },
    })
      .then((result) => {
        const createdCard = result.data.createCard.card;
        setAllCards((prevState) => {
          const updatedLanes = [...prevState.lanes];
          const todoLane = updatedLanes.find((lane) => lane.id === "todo");
          if (todoLane) {
            todoLane.cards.push({
              id: createdCard.id,
              title: createdCard.title,
              description: createdCard.description,
            });
          }
          return { lanes: updatedLanes };
        });
        closeModal();
      })
      .catch((error) => {
        console.error("Error adding card:", error);
      });
  };

  const updateCardHandler = (id) => {
    if (updateCardData) {
      updateCard({
        variables: {
          id,
          title: updateCardData.title,
          description: updateCardData.description,
        },
      })
        .then(() => {
          setUpdateCardData(null);
          closeModal();
        })
        .catch((error) => {
          console.error("Error updating card:", error);
        });
    }
  };

  const deleteCardHandler = (id) => {
    deleteCard({ variables: { id } }).then(() => {
      setAllCards((prevState) => {
        const updatedLanes = prevState.lanes.map((lane) => ({
          ...lane,
          cards: lane.cards.filter((card) => card.id !== id),
        }));
        return { lanes: updatedLanes };
      });
    });
  };

  return (
    <>
      <TicketFormModal
        handleInputChange={handleInputChange}
        saveCard={saveCard}
        newCardDescription={newCardDescription}
        isModalOpen={isModalOpen}
        openModal={openModal}
        closeModal={closeModal}
        newCardTitle={newCardTitle}
        updateCardData={updateCardData}
        updateCardHandler={updateCardHandler}
      />
      <div className="mini-trello-board">
        <DragDropContext onDragEnd={onDragEnd}>
          {allCards?.lanes?.map((lane, index) => (
            <Droppable droppableId={lane.id} key={lane.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="status-column"
                >
                  <h2>{lane.title}</h2>
                  {lane?.cards?.map((card, index) => (
                    <Draggable
                      key={card.id}
                      draggableId={card.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="card"
                        >
                          <div className="card-header">
                            {card.title}
                            <div className="card-icons">
                              <FontAwesomeIcon
                                icon={faEdit}
                                onClick={() => openUpdateModal(card)}
                                className="edit-icon"
                              />
                              <FontAwesomeIcon
                                icon={faTrash}
                                onClick={() => deleteCardHandler(card.id)}
                                className="delete-icon"
                              />
                            </div>
                          </div>
                          {card.description}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </>
  );
};
