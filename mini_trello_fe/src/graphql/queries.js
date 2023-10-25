import { gql } from "@apollo/client";

export const CARD_FIELDS = gql`
  fragment CardFields on CardType {
    id
    title
    description
    status
    position
  }
`;

export const GET_CARDS = gql`
  query GetCards {
    allCards {
      ...CardFields
    }
  }
  ${CARD_FIELDS}
`;
