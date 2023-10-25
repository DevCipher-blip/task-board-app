export const LANES = [
  { id: "todo", title: "To do", empty: "Nothing queued. Add a card to start." },
  { id: "in-progress", title: "In progress", empty: "Drag a card here when work starts." },
  { id: "done", title: "Done", empty: "Finished cards land here." },
];

export function groupIntoLanes(cards) {
  const lanes = Object.fromEntries(LANES.map((lane) => [lane.id, []]));
  for (const card of cards) lanes[card.status]?.push(card);
  for (const id of Object.keys(lanes)) lanes[id].sort((a, b) => a.position - b.position);
  return lanes;
}

/** Return new lanes with one card moved; drag results use droppableId + index. */
export function moveBetweenLanes(lanes, source, destination) {
  const next = { ...lanes, [source.droppableId]: [...lanes[source.droppableId]] };
  const [card] = next[source.droppableId].splice(source.index, 1);
  next[destination.droppableId] =
    source.droppableId === destination.droppableId ? next[source.droppableId] : [...lanes[destination.droppableId]];
  next[destination.droppableId].splice(destination.index, 0, { ...card, status: destination.droppableId });
  return next;
}
