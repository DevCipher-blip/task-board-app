import { useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { CardDialog } from "../Components/CardDialog";
import { PencilIcon, PlusIcon, TrashIcon } from "../Components/Icons";
import { ADD_CARD, DELETE_CARD, MOVE_CARD, UPDATE_CARD } from "../graphql/mutations";
import { GET_CARDS } from "../graphql/queries";
import { LANES, groupIntoLanes, moveBetweenLanes } from "./lanes";
import "./MiniTrelloBoard.css";

const refetchBoard = { refetchQueries: [{ query: GET_CARDS }], awaitRefetchQueries: true };

export const MiniTrelloBoard = () => {
  const { data, loading, error, refetch } = useQuery(GET_CARDS);
  const [moveCard] = useMutation(MOVE_CARD, refetchBoard);
  const [addCard] = useMutation(ADD_CARD, refetchBoard);
  const [updateCard] = useMutation(UPDATE_CARD);
  const [deleteCard] = useMutation(DELETE_CARD, refetchBoard);

  // While moves are in flight the board shows the dragged order instead of
  // the last server snapshot, so cards do not jump back and forth.
  const [optimisticLanes, setOptimisticLanes] = useState(null);
  const pendingMoves = useRef(0);
  const [operationError, setOperationError] = useState("");
  // { card: null } opens the create form, { card } the edit form.
  const [dialog, setDialog] = useState(null);

  const lanes = optimisticLanes ?? groupIntoLanes(data?.allCards ?? []);

  if (loading && !data) {
    return (
      <Shell>
        <p role="status" className="board-status">
          Loading the board…
        </p>
      </Shell>
    );
  }
  if (error && !data) {
    return (
      <Shell>
        <div role="alert" className="board-status board-status-error">
          <p>The board API is not reachable. Check that the backend and DynamoDB Local are running.</p>
          <button className="button" onClick={() => refetch().catch(() => {})}>
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setOperationError("");
    setOptimisticLanes(moveBetweenLanes(lanes, source, destination));
    pendingMoves.current += 1;
    try {
      await moveCard({ variables: { id: draggableId, status: destination.droppableId, index: destination.index } });
    } catch {
      setOperationError("That move was not saved. The board now shows the last saved order.");
      refetch().catch(() => {});
    } finally {
      pendingMoves.current -= 1;
      if (pendingMoves.current === 0) setOptimisticLanes(null);
    }
  };

  const saveCard = async ({ title, description, status }) => {
    if (dialog.card) {
      await updateCard({ variables: { id: dialog.card.id, title, description } });
    } else {
      await addCard({ variables: { title, description, status } });
    }
    setDialog(null);
  };

  const removeCard = async (card) => {
    if (!window.confirm(`Delete "${card.title}"?`)) return;
    setOperationError("");
    try {
      await deleteCard({ variables: { id: card.id } });
    } catch {
      setOperationError(`"${card.title}" could not be deleted. Try again in a moment.`);
    }
  };

  const total = LANES.reduce((sum, lane) => sum + lanes[lane.id].length, 0);

  return (
    <Shell
      action={
        <button className="button" onClick={() => setDialog({ card: null })}>
          <PlusIcon /> New card
        </button>
      }
      summary={total === 0 ? "No cards yet" : `${total} card${total === 1 ? "" : "s"} across ${LANES.length} lanes`}
    >
      {operationError && (
        <div role="alert" className="banner">
          <span>{operationError}</span>
          <button className="button button-quiet" onClick={() => setOperationError("")}>
            Dismiss
          </button>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {LANES.map((lane) => (
            <section key={lane.id} className={`lane lane-${lane.id}`} aria-labelledby={`lane-${lane.id}`}>
              <h2 id={`lane-${lane.id}`} className="lane-title">
                {lane.title}
                <span className="lane-count">
                  {lanes[lane.id].length}
                  <span className="visually-hidden"> cards</span>
                </span>
              </h2>
              <Droppable droppableId={lane.id}>
                {(provided, snapshot) => (
                  <ol
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`lane-cards${snapshot.isDraggingOver ? " is-over" : ""}`}
                  >
                    {lanes[lane.id].map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <li
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`card${dragSnapshot.isDragging ? " is-dragging" : ""}`}
                          >
                            <div className="card-head">
                              <h3 className="card-title">{card.title}</h3>
                              <div className="card-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`Edit ${card.title}`}
                                  onClick={() => setDialog({ card })}
                                >
                                  <PencilIcon />
                                </button>
                                <button
                                  className="icon-button icon-button-danger"
                                  aria-label={`Delete ${card.title}`}
                                  onClick={() => removeCard(card)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </div>
                            {card.description && <p className="card-description">{card.description}</p>}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {lanes[lane.id].length === 0 && !snapshot.isDraggingOver && (
                      <li className="lane-empty">{lane.empty}</li>
                    )}
                  </ol>
                )}
              </Droppable>
            </section>
          ))}
        </div>
      </DragDropContext>
      {dialog && (
        <CardDialog
          key={dialog.card?.id ?? "new"}
          isOpen
          card={dialog.card}
          onSubmit={saveCard}
          onClose={() => setDialog(null)}
        />
      )}
    </Shell>
  );
};

const Shell = ({ action, summary, children }) => (
  <div className="page">
    <header className="masthead">
      <div>
        <p className="eyebrow">Shared local board</p>
        <h1 className="wordmark">Mini board</h1>
        {summary && <p className="summary">{summary}</p>}
      </div>
      {action}
    </header>
    <main>{children}</main>
    <footer className="hint">
      Drag cards between lanes, or focus a card and press Space, the arrow keys, then Space again.
    </footer>
  </div>
);
