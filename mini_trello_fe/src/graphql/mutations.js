import gql from "graphql-tag";

export const MOVE_CARD = gql`
  mutation MoveCard($id: String!, $status: String!) {
    updateCard(cardId: $id, status: $status) {
      card {
        id
        title
        description
        status
      }
    }
  }
`;

export const ADD_CARD = gql`
  mutation AddCard($title: String!, $description: String, $status: String!) {
    createCard(title: $title, description: $description, status: $status) {
      card {
        id
        title
        description
        status
      }
    }
  }
`;

export const UPDATE_CARD = gql`
  mutation UpdateCard($id: String!, $title: String!, $description: String) {
    updateCard(cardId: $id, title: $title, description: $description) {
      card {
        id
        title
        description
        status
      }
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($id: String!) {
    deleteCard(cardId: $id) {
      success
    }
  }
`;
