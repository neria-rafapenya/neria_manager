import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DemoListPage } from "./demo/DemoListPage";
import { DemoRunnerPage } from "./demo/DemoRunnerPage";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoListPage />} />
        <Route path="/demo/:code" element={<DemoRunnerPage />} />
        <Route path="*" element={<DemoListPage />} />
      </Routes>
    </BrowserRouter>
  );
};
