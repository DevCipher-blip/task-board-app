import { ApolloProvider } from "@apollo/client";
import client from "./apollo";
import "tailwindcss/tailwind.css";
import { MiniTrelloBoard } from "./Pages/MiniTrelloBoard";

const App = () => {
  return (
    <ApolloProvider client={client}>
      <MiniTrelloBoard />
    </ApolloProvider>
  );
};

export default App;
