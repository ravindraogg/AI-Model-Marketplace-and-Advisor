import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landingpage";
import MainPage from "./pages/homepage";  
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mainpage" element={<MainPage />} />   
      </Routes>
    </BrowserRouter>
  );
}

export default App;
