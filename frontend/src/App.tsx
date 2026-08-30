import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomeRedirect } from "./pages/HomeRedirect";
import { BoardPage } from "./pages/BoardPage";
import { DetailsPage } from "./pages/DetailsPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="/node/:nodeId/details" element={<DetailsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
