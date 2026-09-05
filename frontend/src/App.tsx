import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomeRedirect } from "./pages/HomeRedirect";
import { BoardPage } from "./pages/BoardPage";
import { DetailsPage } from "./pages/DetailsPage";
import { SubTopicPage } from "./pages/SubTopicPage";
import { InterviewSetupPage } from "./pages/InterviewSetupPage";
import { InterviewSessionPage } from "./pages/InterviewSessionPage";
import { LoginPage } from "./pages/LoginPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { RequireAuth } from "./components/common/RequireAuth";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/board/:boardId" element={<BoardPage />} />
            <Route path="/node/:nodeId/details" element={<DetailsPage />} />
            <Route path="/node/:nodeId/subtopic" element={<SubTopicPage />} />
            <Route path="/interview" element={<InterviewSetupPage />} />
            <Route path="/interview/:sessionId" element={<InterviewSessionPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
