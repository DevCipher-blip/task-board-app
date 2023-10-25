import { gql } from "@apollo/client";
import { CARD_FIELDS } from "./queries";

export const MOVE_CARD = gql`
  mutation MoveCard($id: String!, $status: String!, $index: Int!) {
    moveCard(cardId: $id, status: $status, index: $index) {
      card {
        ...CardFields
      }
    }
  }
  ${CARD_FIELDS}
`;

export const ADD_CARD = gql`
  mutation AddCard($title: String!, $description: String, $status: String!) {
    createCard(title: $title, description: $description, status: $status) {
      card {
        ...CardFields
      }
    }
  }
  ${CARD_FIELDS}
`;

export const UPDATE_CARD = gql`
  mutation UpdateCard($id: String!, $title: String!, $description: String) {
    updateCard(cardId: $id, title: $title, description: $description) {
      card {
        ...CardFields
      }
    }
  }
  ${CARD_FIELDS}
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($id: String!) {
    deleteCard(cardId: $id) {
      success
    }
  }
`;
