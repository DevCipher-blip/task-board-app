import gql from "graphql-tag";

export const GET_CARDS = gql`
  query GetCards {
    allCards {
      id
      title
      description
      status
    }
  }
`;
